/**
 * [INPUT]: 无依赖（纯类型，客户端组件与服务端都可以引用）
 * [OUTPUT]: 导出 InstantSpec、FeatureSpec、InstantRow、Prediction、PredictEvent、PredictResult、ContextInfo、StepName、STEP_NAMES
 * [POS]: 「即时预估」链路的前后端契约。lib/limix/instant.ts 产出这些结构，hooks/use-instant.ts 与 components/instant/ 消费它们。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ──────────────────────────────────────────────────────────────
// 场景配置：一张固定的上下文表 + 一组可手填的输入列 + 一个目标列
// ──────────────────────────────────────────────────────────────

export type FeatureSpec = {
  key: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  /** 字段说明里的一句话含义 */
  note: string
}

/** 离线评估的单个方法成绩，字段名与 scripts/eval_instant.py 写出的 metrics.json 一致 */
export type EvalMetrics = { mae: number; rmse: number; r2: number; coverage_p10_p90?: number }

export type EvalSummary = {
  /** metrics.json 在仓库里的路径，页面上注明来源 */
  source: string
  result: { date: string; model: string; context_rows: number; test_rows: number; methods: Record<string, EvalMetrics> }
  /** 下面三个是 result.methods 的键：LimiX、需训练的参照模型、朴素参照 */
  limix: string
  reference: string
  naive: string
}

export type InstantSpec = {
  slug: string
  /** 目标列：上下文表里有真值，预测时不上传 */
  target: { key: string; label: string; unit: string; note: string }
  /** 输入列，顺序即上传给 LimiX 的列顺序 */
  features: FeatureSpec[]
  /** public/ 下的上下文表（含目标列）与测试记录（含真值，模型没见过） */
  contextFile: string
  samplesFile: string
  /** public/ 下的示例上传文件：中文表头 + 实测值，演示「上传或粘贴」时先下载再上传 */
  uploadFile: string
  evaluation?: EvalSummary
  /** 扫描曲线：固定其余输入，只改这一列，一次请求算完所有取值 */
  sweep?: { key: string; values: number[]; title: string }
  /** 推理记录里用来概括一条输入的列 */
  summaryKeys: string[]
  copy: {
    eyebrow: string
    title: string
    description: string
    /** 上下文表的内容，如「历史配比与实测强度」 */
    contextLabel: string
    /** 场景说明：场景、任务、上下文各一段，让售前和客户知道在预测什么、基于什么数据 */
    facts: { title: string; body: string }[]
    /** 页脚：数据来源与许可 */
    dataNote: string
  }
}

/** 一条输入记录：键为 FeatureSpec.key，值为数值 */
export type InstantRow = Record<string, number>

// ──────────────────────────────────────────────────────────────
// 预测：四个步骤逐个回报，最后给出结果
// ──────────────────────────────────────────────────────────────

export const STEP_NAMES = ["upload", "submit", "compute", "download"] as const
export type StepName = (typeof STEP_NAMES)[number]

/** P50 与 P10–P90 区间 */
export type Prediction = { p50: number; low: number; high: number }

export type PredictResult = {
  /** live = 真实调用 LimiX；mock = 未配置 Key 时的模拟结果，页面必须标明 */
  mode: "live" | "mock"
  predictions: Prediction[]
  /** 每个步骤的耗时（毫秒） */
  timings: Record<StepName, number>
  totalMs: number
  /** 本次预测使用的上下文行数 */
  contextRows: number
  taskId?: string
}

/** 预测接口以 NDJSON 逐行返回这些事件 */
export type PredictEvent =
  | { type: "step"; step: StepName; ms: number }
  | { type: "status"; status: string }
  | { type: "result"; result: PredictResult }
  | { type: "error"; message: string }

// ──────────────────────────────────────────────────────────────
// 上下文：初始行数 + 演示中新加入的行数
// ──────────────────────────────────────────────────────────────

export type ContextInfo = {
  mode: "live" | "mock"
  rows: number
  addedRows: number
  /** 最近一次把上下文表上传到 LimiX 的耗时（毫秒）；模拟模式或尚未上传时为空 */
  uploadMs?: number
}
