// =============================================================================
// AI 算力調配模組 — Dashboard UI
// =============================================================================
// 獨立元件，不依賴占星資料 (chartData)，可單獨運作。
// 功能：
//   1. 總覽盤整（月費/帳號/能力容量）
//   2. 訂閱清單（每格可編輯：費用、帳號數、各額度、啟用開關）
//   3. 每週任務需求（滑桿調整）
//   4. 調配建議（任務→最佳供應商、利用率、缺口警示、最大化提示）
//   5. 可調整假設（sessionsPerWeek、匯率）＋ 一鍵還原預設
// 設定自動存入 localStorage。
// =============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Cpu, Sliders, RotateCcw, Wallet, Users, Boxes, Lightbulb,
  AlertTriangle, CheckCircle2, Info, Power, ExternalLink,
} from 'lucide-react';
import {
  AIProviderPlan, AllocatorSettings, TaskTypeId,
  DEFAULT_PROVIDERS, DEFAULT_SETTINGS, TASK_TYPES, AI_COMPUTE_STORAGE_KEY,
} from '../constants/aiCompute';
import {
  recommendAllocation, inventorySummary, inventoryByTask,
  providerCapacityForTask, buildInsights, Insight,
} from '../utils/aiComputeAllocator';

interface PersistShape {
  providers: AIProviderPlan[];
  settings: AllocatorSettings;
  demand: Record<TaskTypeId, number>;
}

const defaultDemand = (): Record<TaskTypeId, number> => {
  const d = {} as Record<TaskTypeId, number>;
  TASK_TYPES.forEach((t) => (d[t.id] = t.defaultWeekly));
  return d;
};

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const loadState = (): PersistShape => {
  try {
    const raw = localStorage.getItem(AI_COMPUTE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.providers && parsed?.settings && parsed?.demand) return parsed;
    }
  } catch { /* ignore */ }
  return { providers: clone(DEFAULT_PROVIDERS), settings: clone(DEFAULT_SETTINGS), demand: defaultDemand() };
};

const fmtCap = (n: number): string => (n === Infinity ? '無限' : Math.round(n).toLocaleString());

const LEVEL_STYLE: Record<Insight['level'], string> = {
  critical: 'bg-red-50 border-red-200 text-red-800',
  warn: 'bg-amber-50 border-amber-200 text-amber-800',
  tip: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  good: 'bg-emerald-50 border-emerald-200 text-emerald-800',
};
const LEVEL_ICON: Record<Insight['level'], React.ReactNode> = {
  critical: <AlertTriangle size={16} />,
  warn: <AlertTriangle size={16} />,
  tip: <Lightbulb size={16} />,
  good: <CheckCircle2 size={16} />,
};

export default function AIComputeDashboard() {
  const init = useMemo(loadState, []);
  const [providers, setProviders] = useState<AIProviderPlan[]>(init.providers);
  const [settings, setSettings] = useState<AllocatorSettings>(init.settings);
  const [demand, setDemand] = useState<Record<TaskTypeId, number>>(init.demand);

  // 持久化
  useEffect(() => {
    try {
      localStorage.setItem(AI_COMPUTE_STORAGE_KEY, JSON.stringify({ providers, settings, demand }));
    } catch { /* ignore quota errors */ }
  }, [providers, settings, demand]);

  const summary = useMemo(() => inventorySummary(providers), [providers]);
  const invByTask = useMemo(() => inventoryByTask(providers, settings), [providers, settings]);
  const result = useMemo(() => recommendAllocation(providers, demand, settings), [providers, demand, settings]);
  const insights = useMemo(() => buildInsights(providers, result, settings), [providers, result, settings]);

  const providerName = (id: string) => providers.find((p) => p.id === id)?.name ?? id;

  const patchProvider = (id: string, patch: Partial<AIProviderPlan>) =>
    setProviders((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const patchQuota = (pid: string, qid: string, limit: number) =>
    setProviders((ps) =>
      ps.map((p) =>
        p.id === pid
          ? { ...p, quotas: p.quotas.map((q) => (q.id === qid ? { ...q, limit } : q)) }
          : p
      )
    );

  const resetAll = () => {
    if (!confirm('確定還原所有 AI 算力設定為預設值？你手動修改的數字會消失。')) return;
    setProviders(clone(DEFAULT_PROVIDERS));
    setSettings(clone(DEFAULT_SETTINGS));
    setDemand(defaultDemand());
  };

  const twd = (usd: number) => Math.round(usd * settings.usdToTwd).toLocaleString();

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">AI 算力調配中心</h2>
            <p className="text-xs text-gray-500">盤整你的 AI 訂閱、依能力與額度最佳調配、最大化每一分訂閱費</p>
          </div>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
        >
          <RotateCcw size={14} /> 還原預設
        </button>
      </div>

      {/* 總覽 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Wallet size={16} />} label="每月總支出" value={`$${summary.monthlyUSD.toFixed(0)}`} sub={`≈ NT$${twd(summary.monthlyUSD)} / 月`} />
        <KpiCard icon={<Boxes size={16} />} label="啟用方案" value={`${summary.enabledCount}`} sub={`${summary.vendors} 家供應商`} />
        <KpiCard icon={<Users size={16} />} label="總帳號席次" value={`${summary.totalAccounts}`} sub="含群組多帳號" />
        <KpiCard
          icon={result.totalUnmet > 0.5 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          label="每週需求缺口"
          value={result.totalUnmet > 0.5 ? `${Math.round(result.totalUnmet)}` : '0'}
          sub={result.totalUnmet > 0.5 ? '有任務算力不足' : '目前供給充足'}
          danger={result.totalUnmet > 0.5}
        />
      </div>

      {/* 智能提示 */}
      <section>
        <SectionTitle icon={<Lightbulb size={16} />} title="調配洞察與最大化建議" />
        <div className="grid md:grid-cols-2 gap-2">
          {insights.map((ins, i) => (
            <div key={i} className={`flex gap-2 items-start p-3 rounded-xl border text-xs ${LEVEL_STYLE[ins.level]}`}>
              <span className="mt-0.5 flex-shrink-0">{LEVEL_ICON[ins.level]}</span>
              <div>
                <div className="font-bold mb-0.5">{ins.title}</div>
                <div className="leading-relaxed opacity-90">{ins.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 盤整：各任務類型容量（堆疊條） */}
      <section>
        <SectionTitle icon={<Boxes size={16} />} title="算力盤整：每週容量 vs. 需求（依任務類型）" />
        <div className="space-y-2.5 bg-gray-50 rounded-2xl border border-gray-100 p-4">
          {invByTask.map((row) => {
            const meta = TASK_TYPES.find((t) => t.id === row.task)!;
            const need = demand[row.task] ?? 0;
            const totalFinite = row.total === Infinity ? Math.max(need, 1) : row.total;
            const overloaded = row.total !== Infinity && need > row.total;
            return (
              <div key={row.task}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-gray-700">{meta.icon} {meta.nameZh}</span>
                  <span className={overloaded ? 'text-red-600 font-bold' : 'text-gray-500'}>
                    需求 {Math.round(need)} / 容量 {fmtCap(row.total)} {meta.unit}
                  </span>
                </div>
                <div className="relative h-5 rounded-lg bg-gray-200 overflow-hidden flex">
                  {row.byProvider.map((bp) => {
                    const cap = bp.capacity === Infinity ? totalFinite : bp.capacity;
                    const pct = Math.min(100, (cap / totalFinite) * 100);
                    return (
                      <div
                        key={bp.providerId}
                        className={`h-full ${PROVIDER_COLOR[bp.providerId] ?? 'bg-gray-400'} opacity-80`}
                        style={{ width: `${pct}%` }}
                        title={`${providerName(bp.providerId)}：${fmtCap(bp.capacity)}（能力 ${bp.capability}/5）`}
                      />
                    );
                  })}
                  {/* 需求標線 */}
                  {row.total !== Infinity && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-900"
                      style={{ left: `${Math.min(100, (need / totalFinite) * 100)}%` }}
                      title={`需求 ${Math.round(need)}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <Legend providers={providers} />
        </div>
      </section>

      {/* 每週任務需求 */}
      <section>
        <SectionTitle icon={<Sliders size={16} />} title="每週任務需求（拖動調整你的使用強度）" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 rounded-2xl border border-gray-100 p-4">
          {TASK_TYPES.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-700" title={t.desc}>{t.icon} {t.nameZh}</span>
                <input
                  type="number"
                  min={0}
                  value={Math.round(demand[t.id] ?? 0)}
                  onChange={(e) => setDemand((d) => ({ ...d, [t.id]: Math.max(0, Number(e.target.value) || 0) }))}
                  className="w-16 text-right text-xs font-mono font-bold text-indigo-600 border border-gray-200 rounded px-1.5 py-0.5"
                />
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={Math.min(200, demand[t.id] ?? 0)}
                onChange={(e) => setDemand((d) => ({ ...d, [t.id]: Number(e.target.value) }))}
                className="w-full accent-indigo-600"
              />
              <div className="text-[10px] text-gray-400 mt-0.5">{t.unit} / 週</div>
            </div>
          ))}
        </div>
      </section>

      {/* 調配建議表 */}
      <section>
        <SectionTitle icon={<Cpu size={16} />} title="建議調配：每個任務該用哪個工具" />
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-bold">任務類型</th>
                <th className="text-right px-3 py-2 font-bold">每週需求</th>
                <th className="text-left px-3 py-2 font-bold">建議分配（能力分）</th>
                <th className="text-right px-3 py-2 font-bold">狀態</th>
              </tr>
            </thead>
            <tbody>
              {result.perTask.map((t) => {
                const meta = TASK_TYPES.find((x) => x.id === t.task)!;
                return (
                  <tr key={t.task} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-bold text-gray-700">{meta.icon} {meta.nameZh}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600">{Math.round(t.demand)}</td>
                    <td className="px-3 py-2">
                      {t.assignments.length === 0 ? (
                        <span className="text-gray-400">—（無支援此任務的方案）</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {t.assignments.map((a) => (
                            <span key={a.providerId} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-white text-[11px] font-bold ${PROVIDER_COLOR[a.providerId] ?? 'bg-gray-400'}`}>
                              {providerName(a.providerId)} · {Math.round(a.amount)}
                              <span className="opacity-70">({a.capability}/5)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {t.unmet > 0.5 ? (
                        <span className="text-red-600 font-bold">缺 {Math.round(t.unmet)}</span>
                      ) : t.demand === 0 ? (
                        <span className="text-gray-300">未規劃</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">✓ 足夠</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 訂閱清單（可編輯） */}
      <section>
        <SectionTitle icon={<Wallet size={16} />} title="訂閱清單（所有數字可編輯；方案變動時直接改這裡）" />
        <div className="grid lg:grid-cols-2 gap-3">
          {providers.map((p) => {
            const util = result.perProvider.find((x) => x.providerId === p.id)?.utilization ?? 0;
            return (
              <div key={p.id} className={`rounded-2xl border p-4 ${p.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${PROVIDER_COLOR[p.id] ?? 'bg-gray-400'}`} />
                    <div>
                      <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        {p.name}
                        {p.estimated && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded" title="含估算/待確認數值">估算</span>}
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600"><ExternalLink size={12} /></a>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">{p.vendor} · {p.plan}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => patchProvider(p.id, { enabled: !p.enabled })}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${p.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}
                  >
                    <Power size={12} /> {p.enabled ? '啟用中' : '已停用'}
                  </button>
                </div>

                {/* 可編輯：費用 / 帳號 */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <LabeledNumber label="月費 (USD)" value={p.billingUSD} onChange={(v) => patchProvider(p.id, { billingUSD: v })} />
                  <LabeledNumber label="帳號數" value={p.accounts} min={1} onChange={(v) => patchProvider(p.id, { accounts: Math.max(1, v) })} />
                </div>

                {/* 利用率 */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>綜合利用率（有限額度）</span>
                    <span className={util > 0.9 ? 'text-red-600 font-bold' : util < 0.3 ? 'text-amber-600 font-bold' : 'text-gray-600'}>{(util * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full ${util > 0.9 ? 'bg-red-500' : util < 0.3 ? 'bg-amber-400' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, util * 100)}%` }} />
                  </div>
                </div>

                {/* 可編輯：各額度 */}
                <div className="space-y-1.5">
                  {p.quotas.map((q) => (
                    <div key={q.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-gray-600 truncate flex items-center gap-1" title={q.note}>
                        {q.label}
                        {q.estimated && <span className="text-amber-500">*</span>}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {q.unlimited ? (
                          <span className="text-emerald-600 font-bold">無限</span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            value={q.limit}
                            onChange={(e) => patchQuota(p.id, q.id, Math.max(0, Number(e.target.value) || 0))}
                            className="w-20 text-right font-mono border border-gray-200 rounded px-1 py-0.5"
                          />
                        )}
                        <span className="text-gray-400 w-24">{q.unit}/{PERIOD_ZH[q.period]}{q.perAccount ? ' ×帳號' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 能力分 */}
                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                  {TASK_TYPES.filter((t) => (p.capability[t.id] ?? 0) > 0).map((t) => (
                    <span key={t.id} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" title={`每週可提供 ${fmtCap(providerCapacityForTask(p, t.id, settings))} ${t.unit}`}>
                      {t.icon}{p.capability[t.id]}
                    </span>
                  ))}
                </div>

                {p.notes && (
                  <p className="mt-2 text-[10px] text-gray-400 leading-relaxed flex gap-1">
                    <Info size={11} className="flex-shrink-0 mt-0.5" /> {p.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 調配假設 */}
      <section>
        <SectionTitle icon={<Sliders size={16} />} title="調配假設（影響換算）" />
        <div className="grid sm:grid-cols-2 gap-3 bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-gray-700">每週可用 5 小時 session 數</span>
              <span className="font-mono text-indigo-600">{settings.sessionsPerWeek}</span>
            </div>
            <input type="range" min={1} max={40} value={settings.sessionsPerWeek}
              onChange={(e) => setSettings((s) => ({ ...s, sessionsPerWeek: Number(e.target.value) }))}
              className="w-full accent-indigo-600" />
            <p className="text-[10px] text-gray-400 mt-0.5">用於把 Claude 的 session 制額度換算成每週容量。</p>
          </div>
          <div>
            <LabeledNumber label="匯率 USD → TWD" value={settings.usdToTwd} step={0.1}
              onChange={(v) => setSettings((s) => ({ ...s, usdToTwd: v }))} />
            <p className="text-[10px] text-gray-400 mt-1">僅用於顯示台幣估算。</p>
          </div>
        </div>
      </section>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        * 標示「估算」或「*」的數值為官方未公布精確值或第三方估算（查證日 2026-11-26）。各家方案額度與命名會變動，請以你帳號後台實際數字為準，直接在上方清單修改即可，設定會自動儲存於本機瀏覽器。
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 小元件
// -----------------------------------------------------------------------------
const PROVIDER_COLOR: Record<string, string> = {
  'claude-max': 'bg-orange-500',
  'google-one-pro': 'bg-blue-500',
  'monica-max': 'bg-violet-500',
  'proactor-pro': 'bg-teal-500',
};

const PERIOD_ZH: Record<string, string> = {
  day: '日', week: '週', month: '月', 'session-5h': 'session',
};

function KpiCard({ icon, label, value, sub, danger }: { icon: React.ReactNode; label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${danger ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-bold mb-1 ${danger ? 'text-red-500' : 'text-gray-400'}`}>{icon}{label}</div>
      <div className={`text-xl font-black ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-2">
      <span className="text-indigo-500">{icon}</span>{title}
    </h3>
  );
}

function LabeledNumber({ label, value, onChange, min = 0, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  return (
    <label className="block">
      <span className="text-[10px] text-gray-500 font-bold">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full mt-0.5 text-sm font-mono font-bold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 focus:border-indigo-400 focus:outline-none"
      />
    </label>
  );
}

function Legend({ providers }: { providers: AIProviderPlan[] }) {
  return (
    <div className="flex flex-wrap gap-3 pt-2 mt-1 border-t border-gray-200">
      {providers.filter((p) => p.enabled).map((p) => (
        <span key={p.id} className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className={`w-2.5 h-2.5 rounded-sm ${PROVIDER_COLOR[p.id] ?? 'bg-gray-400'}`} />{p.name}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
        <span className="w-0.5 h-3 bg-gray-900" /> 需求標線
      </span>
    </div>
  );
}
