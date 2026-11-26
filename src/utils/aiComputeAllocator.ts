// =============================================================================
// AI 算力調配模組 — 計算引擎 (Allocation Engine)
// =============================================================================
// 全部為純函式 (pure functions)，無副作用，方便單元測試與重用。
// 核心：把各家不同單位/週期的額度，正規化成「每週可用當量」，
//       再依任務能力分做貪婪式最佳調配（capability 最高者優先吃需求），
//       以「最大化有效產出 + 避免爆量 + 減少閒置」為目標。
// =============================================================================

import {
  AIProviderPlan,
  QuotaBucket,
  TaskTypeId,
  AllocatorSettings,
  TASK_TYPES,
} from '../constants/aiCompute';

const WEEKS_PER_MONTH = 52 / 12; // ≈ 4.333

/** 把一條額度桶換算成「每週可用數量」。unlimited → Infinity。 */
export function bucketWeeklyCapacity(b: QuotaBucket, s: AllocatorSettings): number {
  if (b.unlimited) return Infinity;
  let perPeriod = b.limit;
  switch (b.period) {
    case 'day': perPeriod = b.limit * 7; break;
    case 'week': perPeriod = b.limit; break;
    case 'month': perPeriod = b.limit / WEEKS_PER_MONTH; break;
    case 'session-5h': perPeriod = b.limit * s.sessionsPerWeek; break;
  }
  const accounts = b.perAccount ? Math.max(1, (b as any)._accounts ?? 1) : 1;
  return perPeriod * accounts;
}

/** 單一供應商，對某任務類型的每週可用當量（能力分為 0 則視為不支援）。 */
export function providerCapacityForTask(
  p: AIProviderPlan,
  task: TaskTypeId,
  s: AllocatorSettings
): number {
  if (!p.enabled) return 0;
  if (!(p.capability[task] && p.capability[task]! > 0)) return 0;
  let cap = 0;
  for (const b of p.quotas) {
    if (!b.taskTypes.includes(task)) continue;
    const withAccounts: QuotaBucket = b.perAccount
      ? ({ ...b, _accounts: p.accounts } as any)
      : b;
    const w = bucketWeeklyCapacity(withAccounts, s);
    if (w === Infinity) return Infinity;
    cap += w;
  }
  return cap;
}

export interface TaskCapacityRow {
  task: TaskTypeId;
  total: number;                                   // 全部供應商加總（可能 Infinity）
  byProvider: { providerId: string; capacity: number; capability: number }[];
}

/** 盤整：每個任務類型，各家可提供多少每週當量。 */
export function inventoryByTask(
  providers: AIProviderPlan[],
  s: AllocatorSettings
): TaskCapacityRow[] {
  return TASK_TYPES.map(({ id }) => {
    const byProvider = providers
      .map((p) => ({
        providerId: p.id,
        capacity: providerCapacityForTask(p, id, s),
        capability: p.capability[id] ?? 0,
      }))
      .filter((x) => x.capacity > 0)
      .sort((a, b) => b.capability - a.capability || b.capacity - a.capacity);
    const hasInf = byProvider.some((x) => x.capacity === Infinity);
    const total = hasInf
      ? Infinity
      : byProvider.reduce((sum, x) => sum + x.capacity, 0);
    return { task: id, total, byProvider };
  });
}

export interface InventorySummary {
  monthlyUSD: number;
  totalAccounts: number;
  enabledCount: number;
  vendors: number;
}

export function inventorySummary(providers: AIProviderPlan[]): InventorySummary {
  const enabled = providers.filter((p) => p.enabled);
  return {
    monthlyUSD: enabled.reduce((s, p) => s + p.billingUSD, 0),
    totalAccounts: enabled.reduce((s, p) => s + p.accounts, 0),
    enabledCount: enabled.length,
    vendors: new Set(enabled.map((p) => p.vendor)).size,
  };
}

// -----------------------------------------------------------------------------
// 調配：把每週任務需求貪婪分配到能力最高、尚有餘量的供應商
// -----------------------------------------------------------------------------
export interface Assignment {
  providerId: string;
  amount: number;
  capability: number;
}

export interface TaskAllocation {
  task: TaskTypeId;
  demand: number;
  assignments: Assignment[];
  met: number;        // 已滿足數量
  unmet: number;      // 無法滿足數量（需求爆量）
  valueScore: number; // Σ(分配量 × 能力分)，越高代表用在越強的工具上
}

export interface ProviderUtilization {
  providerId: string;
  // 各任務類型：使用量 / 容量
  byTask: { task: TaskTypeId; used: number; capacity: number }[];
  // 綜合利用率（有限容量部分的加權；unlimited 不計入分母）
  utilization: number;
}

export interface AllocationResult {
  perTask: TaskAllocation[];
  perProvider: ProviderUtilization[];
  totalValue: number;
  totalUnmet: number;
}

/**
 * 主調配函式。
 * @param demand 每週各任務需求量
 */
export function recommendAllocation(
  providers: AIProviderPlan[],
  demand: Record<TaskTypeId, number>,
  s: AllocatorSettings
): AllocationResult {
  // 記錄每個 (provider, task) 的剩餘容量
  const remaining: Record<string, Record<string, number>> = {};
  for (const p of providers) {
    remaining[p.id] = {};
    for (const t of TASK_TYPES) {
      remaining[p.id][t.id] = providerCapacityForTask(p, t.id, s);
    }
  }

  const perTask: TaskAllocation[] = TASK_TYPES.map(({ id }) => {
    let need = Math.max(0, demand[id] ?? 0);
    const ranked = providers
      .filter((p) => p.enabled && (p.capability[id] ?? 0) > 0)
      .sort((a, b) => (b.capability[id]! - a.capability[id]!));

    const assignments: Assignment[] = [];
    let valueScore = 0;
    for (const p of ranked) {
      if (need <= 0) break;
      const avail = remaining[p.id][id];
      if (avail <= 0) continue;
      const take = avail === Infinity ? need : Math.min(need, avail);
      assignments.push({ providerId: p.id, amount: take, capability: p.capability[id]! });
      if (avail !== Infinity) remaining[p.id][id] -= take;
      valueScore += take * p.capability[id]!;
      need -= take;
    }
    const demandVal = Math.max(0, demand[id] ?? 0);
    return {
      task: id,
      demand: demandVal,
      assignments,
      met: demandVal - need,
      unmet: need,
      valueScore,
    };
  });

  // 供應商利用率
  const perProvider: ProviderUtilization[] = providers.map((p) => {
    const byTask = TASK_TYPES.map(({ id }) => {
      const capacity = providerCapacityForTask(p, id, s);
      const used = capacity === Infinity
        ? (perTask.find((t) => t.task === id)?.assignments.find((a) => a.providerId === p.id)?.amount ?? 0)
        : capacity - remaining[p.id][id];
      return { task: id, used, capacity };
    });
    // 只用「有限容量」計算利用率
    const finite = byTask.filter((x) => x.capacity !== Infinity && x.capacity > 0);
    const usedSum = finite.reduce((s2, x) => s2 + x.used, 0);
    const capSum = finite.reduce((s2, x) => s2 + x.capacity, 0);
    return {
      providerId: p.id,
      byTask,
      utilization: capSum > 0 ? usedSum / capSum : 0,
    };
  });

  return {
    perTask,
    perProvider,
    totalValue: perTask.reduce((s2, t) => s2 + t.valueScore, 0),
    totalUnmet: perTask.reduce((s2, t) => s2 + t.unmet, 0),
  };
}

// -----------------------------------------------------------------------------
// 洞察與建議（最大化算力的具體提示）
// -----------------------------------------------------------------------------
export type InsightLevel = 'critical' | 'warn' | 'tip' | 'good';

export interface Insight {
  level: InsightLevel;
  title: string;
  detail: string;
}

export function buildInsights(
  providers: AIProviderPlan[],
  result: AllocationResult,
  s: AllocatorSettings
): Insight[] {
  const out: Insight[] = [];
  const nameOf = (id: string) => providers.find((p) => p.id === id)?.name ?? id;
  const taskName = (id: TaskTypeId) => TASK_TYPES.find((t) => t.id === id)?.nameZh ?? id;

  // 1) 爆量（需求 > 容量）
  for (const t of result.perTask) {
    if (t.unmet > 0.5) {
      out.push({
        level: 'critical',
        title: `「${taskName(t.task)}」算力不足`,
        detail: `每週需求 ${Math.round(t.demand)}，可滿足 ${Math.round(t.met)}，缺口 ${Math.round(t.unmet)}。建議：降低需求、提高 sessionsPerWeek 假設，或升級對應方案。`,
      });
    }
  }

  // 2) 高閒置（利用率 < 30% 且有有限容量）
  for (const pu of result.perProvider) {
    const p = providers.find((x) => x.id === pu.providerId);
    if (!p || !p.enabled) continue;
    const finite = pu.byTask.filter((x) => x.capacity !== Infinity && x.capacity > 0);
    if (finite.length === 0) continue;
    if (pu.utilization < 0.3) {
      // 找出該供應商最強且閒置的任務類型
      const best = [...finite].sort((a, b) => (p.capability[b.task]! - p.capability[a.task]!))[0];
      out.push({
        level: 'tip',
        title: `${p.name} 大量閒置（利用率 ${(pu.utilization * 100).toFixed(0)}%）`,
        detail: `可把更多「${taskName(best.task)}」等任務導向它，攤平成本。已付費但未用到的算力就是浪費。`,
      });
    }
  }

  // 3) 成本效率：每月每「有效產出分」的成本
  const enabled = providers.filter((p) => p.enabled);
  const monthly = enabled.reduce((sum, p) => sum + p.billingUSD, 0);
  if (result.totalValue > 0 && monthly > 0) {
    const costPerValue = monthly / result.totalValue;
    out.push({
      level: 'good',
      title: `目前方案成本效率`,
      detail: `每月 $${monthly.toFixed(0)} / 每週有效產出分 ${result.totalValue.toFixed(0)} ≈ $${costPerValue.toFixed(2)}／分。把高需求導向能力分高的工具可拉高分母、降低此值。`,
    });
  }

  // 4) 影像/影片優先用 Google（額度最大且能力最強）
  const g = providers.find((p) => p.id === 'google-one-pro' && p.enabled);
  if (g) {
    out.push({
      level: 'tip',
      title: '影像/研究優先走 Google（×帳號數）',
      detail: `Google AI Pro 的影像(1000/日)與 Deep Research(20/日) 皆按帳號倍增，你有 ${g.accounts} 個帳號 = 超大額度，應優先消化圖像與研究任務。`,
    });
  }

  // 5) 寫程式集中 Claude、日常/寫作走 Monica 無限額度
  out.push({
    level: 'tip',
    title: '分工原則（最大化）',
    detail: '重度寫程式/Agent → Claude Max；日常問答/寫作翻譯 → Monica（無限基礎查詢，不耗稀缺額度）；影像/聯網研究 → Google 多帳號；Claude 的 session 額度留給最難的任務。',
  });

  return out;
}
