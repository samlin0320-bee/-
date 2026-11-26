// =============================================================================
// AI 算力調配模組 — 靜態資料庫 (Static Data / Inventory)
// =============================================================================
// 本檔為「只新增、不刪改既有功能」原則下新增的獨立模組，與占星功能完全解耦。
//
// ⚠️ 重要：以下所有數值皆為「可編輯預設值」。各家 AI 方案的額度與命名變動頻繁，
//          UI 上的每一格數字都可以由使用者自行修改並存入 localStorage。
//          凡標記 `estimated: true` 者，表示官方未公布精確數字或來源為第三方估算，
//          請以你自己帳號後台看到的實際額度為準。
//
// 事實來源（2025–2026，查證日 2026-11-26）：
//  - Claude Max：5 小時 session 窗 + 每週上限（官方未公布確切數字，業界估算）
//    https://support.claude.com/en/articles/11049741-about-claude-s-max-plan-usage
//  - Google AI Pro：Gemini 2.5 Pro 100 則/日、圖片 1000 張/日、Deep Research 20 份/日
//    https://9to5google.com/2025/09/06/gemini-usage-limits-sep-2025/
//  - Monica Max：基礎/進階查詢無限 + 每月 4,500 進階額度，多模型
//    https://monica.im/help/FAQs/rules_for_using_advanced_queries
//  - Proactor AI Pro：查無可靠公開規格 → 預設為佔位值，請自行修正。
// =============================================================================

/** 任務類型 ID */
export type TaskTypeId =
  | 'coding'    // 寫程式 / 重構 / Debug
  | 'reasoning' // 長文深度推理 / 複雜分析
  | 'research'  // 聯網研究 / Deep Research
  | 'writing'   // 寫作 / 翻譯 / 潤稿
  | 'data'      // 資料分析 / 試算表 / 表格
  | 'image'     // 影像生成
  | 'video'     // 影片生成
  | 'chat'      // 日常快問快答
  | 'agent';    // 自動化 / Agent / 瀏覽器操作

/** 計費/額度週期 */
export type QuotaPeriod = 'day' | 'week' | 'month' | 'session-5h';

/** 任務類型的顯示資訊 */
export interface TaskTypeMeta {
  id: TaskTypeId;
  nameZh: string;
  nameEn: string;
  icon: string;          // emoji
  unit: string;          // 需求輸入的單位（次/份/張…）
  defaultWeekly: number; // 預設每週需求（可調）
  desc: string;
}

export const TASK_TYPES: TaskTypeMeta[] = [
  { id: 'coding',    nameZh: '寫程式',     nameEn: 'Coding',     icon: '💻', unit: 'session', defaultWeekly: 25, desc: '寫程式、重構、除錯、Code Review' },
  { id: 'reasoning', nameZh: '深度推理',   nameEn: 'Reasoning',  icon: '🧠', unit: '次',     defaultWeekly: 15, desc: '長文分析、複雜邏輯、策略規劃' },
  { id: 'research',  nameZh: '聯網研究',   nameEn: 'Research',   icon: '🔎', unit: '份',     defaultWeekly: 7,  desc: 'Deep Research、資料蒐集、網頁彙整' },
  { id: 'writing',   nameZh: '寫作翻譯',   nameEn: 'Writing',    icon: '✍️', unit: '篇',     defaultWeekly: 20, desc: '文案、翻譯、潤稿、摘要' },
  { id: 'data',      nameZh: '資料分析',   nameEn: 'Data',       icon: '📊', unit: '次',     defaultWeekly: 10, desc: '試算表、資料清洗、圖表分析' },
  { id: 'image',     nameZh: '影像生成',   nameEn: 'Image',      icon: '🖼️', unit: '張',     defaultWeekly: 30, desc: '繪圖、插畫、素材生成' },
  { id: 'video',     nameZh: '影片生成',   nameEn: 'Video',      icon: '🎬', unit: '支',     defaultWeekly: 3,  desc: '短影片、動態素材' },
  { id: 'chat',      nameZh: '日常問答',   nameEn: 'Chat',       icon: '💬', unit: '次',     defaultWeekly: 60, desc: '快問快答、生活助理、雜項' },
  { id: 'agent',     nameZh: '自動化Agent', nameEn: 'Agent',     icon: '🤖', unit: '次',     defaultWeekly: 8,  desc: 'Agent 任務、瀏覽器操作、工作流自動化' },
];

/** 額度桶：某供應商的一條具體額度規則 */
export interface QuotaBucket {
  id: string;
  label: string;              // 顯示名稱，如「Gemini 2.5 Pro 提問」
  taskTypes: TaskTypeId[];    // 這條額度可支援哪些任務類型
  limit: number;              // 數量；若 unlimited 則此值僅作參考
  period: QuotaPeriod;        // 週期
  unit: string;               // 單位（prompts/images/credits/session…）
  perAccount?: boolean;       // true = 需乘上帳號數
  unlimited?: boolean;        // true = 視為不限量
  estimated?: boolean;        // true = 估算值/需確認
  note?: string;
}

/** 一個 AI 訂閱方案 */
export interface AIProviderPlan {
  id: string;
  name: string;
  vendor: string;
  plan: string;
  billingUSD: number;                            // 每月費用（美元，年繳者請換算月均）
  accounts: number;                              // 帳號/席次數
  enabled: boolean;                              // 是否納入調配
  models: string[];                              // 可用模型
  capability: Partial<Record<TaskTypeId, number>>; // 各任務類型能力分 0–5
  quotas: QuotaBucket[];
  link: string;
  estimated?: boolean;
  notes?: string;
}

/** 調配設定（可調整的轉換假設） */
export interface AllocatorSettings {
  sessionsPerWeek: number; // 每個 5 小時 session 窗，一週實際可用幾個（估算用）
  usdToTwd: number;        // 匯率，用於顯示台幣
}

export const DEFAULT_SETTINGS: AllocatorSettings = {
  sessionsPerWeek: 20,
  usdToTwd: 32.5,
};

// -----------------------------------------------------------------------------
// 預設訂閱清單（你目前擁有的四項）
// -----------------------------------------------------------------------------
export const DEFAULT_PROVIDERS: AIProviderPlan[] = [
  {
    id: 'claude-max',
    name: 'Claude Code Max',
    vendor: 'Anthropic',
    plan: 'Max (20x)',
    billingUSD: 200,
    accounts: 1,
    enabled: true,
    models: ['Claude Opus', 'Claude Sonnet', 'Claude Haiku'],
    capability: { coding: 5, reasoning: 5, agent: 5, writing: 4, data: 4, research: 3, chat: 4, image: 0, video: 0 },
    link: 'https://claude.com/blog/max-plan',
    estimated: true,
    notes: '頂規寫程式/Agent 主力。官方未公布每週精確額度；下列為業界估算，請依實際用量微調。',
    quotas: [
      { id: 'claude-session', label: 'Opus/Sonnet 重任務 session', taskTypes: ['coding', 'reasoning', 'agent'], limit: 1, period: 'session-5h', unit: 'session', estimated: true, note: '每 5 小時重置；sessionsPerWeek 控制一週可用幾個' },
      { id: 'claude-weekly-sonnet', label: '每週 Sonnet 工時（估）', taskTypes: ['coding', 'writing', 'data', 'chat'], limit: 300, period: 'week', unit: 'hours', estimated: true, note: 'Max 20x 業界估 240–480 Sonnet 小時/週' },
    ],
  },
  {
    id: 'google-one-pro',
    name: 'Google One（Pro 群組）',
    vendor: 'Google',
    plan: 'Google AI Pro ×4 帳號',
    billingUSD: 20, // 群組共享，依實際分攤調整；此為代表值
    accounts: 4,
    enabled: true,
    models: ['Gemini 2.5 Pro', 'Imagen', 'Veo', 'Deep Research'],
    capability: { research: 5, image: 5, chat: 5, writing: 4, reasoning: 4, data: 4, video: 3, coding: 3, agent: 3 },
    link: 'https://one.google.com/',
    notes: '4 個帳號 = 額度 ×4，影像與研究的算力王牌。費用請依群組實際分攤修改。',
    quotas: [
      { id: 'gem-pro', label: 'Gemini 2.5 Pro 提問', taskTypes: ['reasoning', 'coding', 'data', 'chat', 'writing'], limit: 100, period: 'day', unit: 'prompts', perAccount: true, note: '2025 官方：100 則/日/帳號' },
      { id: 'gem-img', label: 'Imagen 影像生成', taskTypes: ['image'], limit: 1000, period: 'day', unit: 'images', perAccount: true, note: '2025 官方：1000 張/日/帳號' },
      { id: 'gem-dr', label: 'Deep Research 報告', taskTypes: ['research'], limit: 20, period: 'day', unit: 'reports', perAccount: true, note: '2025 官方：20 份/日/帳號' },
      { id: 'gem-video', label: 'Veo 影片生成', taskTypes: ['video'], limit: 5, period: 'day', unit: 'videos', perAccount: true, estimated: true, note: 'Pro 影片額度隨方案變動，請確認' },
    ],
  },
  {
    id: 'monica-max',
    name: 'Monica Max',
    vendor: 'Monica.im',
    plan: 'Max',
    billingUSD: 25,
    accounts: 1,
    enabled: true,
    models: ['GPT 系列', 'Claude 系列', 'Gemini 系列'],
    capability: { writing: 5, chat: 5, research: 4, image: 4, coding: 4, reasoning: 4, data: 4, agent: 4, video: 3 },
    link: 'https://monica.im/billing',
    notes: '多模型聚合器：基礎/進階查詢無限，另有每月 4,500 進階額度（Deep Research/簡報/影像影片/Browser Operator 共用）。適合日常與寫作主力。',
    quotas: [
      { id: 'monica-basic', label: '基礎查詢（GPT/Claude/Gemini）', taskTypes: ['chat', 'writing', 'coding', 'reasoning', 'data'], limit: 0, period: 'month', unit: 'queries', unlimited: true, note: '官方標示無限' },
      { id: 'monica-advanced', label: '進階額度（研究/簡報/影像/Agent）', taskTypes: ['research', 'image', 'video', 'agent'], limit: 4500, period: 'month', unit: 'credits', note: '每月 4,500，各進階功能共用' },
    ],
  },
  {
    id: 'proactor-pro',
    name: 'Proactor AI Pro',
    vendor: 'Proactor',
    plan: 'Pro',
    billingUSD: 20,
    accounts: 1,
    enabled: true,
    models: ['(待確認)'],
    capability: { agent: 4, chat: 3, writing: 3, research: 3 },
    link: '',
    estimated: true,
    notes: '⚠️ 查無可靠公開規格：以下為佔位值，請依你帳號後台的實際額度、模型與費用修改後再納入調配。',
    quotas: [
      { id: 'proactor-credits', label: '通用額度（佔位，待確認）', taskTypes: ['agent', 'chat', 'writing', 'research'], limit: 500, period: 'month', unit: 'credits', estimated: true, note: '佔位值，請自行修正' },
    ],
  },
];

/** localStorage 鍵 */
export const AI_COMPUTE_STORAGE_KEY = 'aiComputeConfig.v1';
