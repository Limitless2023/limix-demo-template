/**
 * [INPUT]: 依赖 ./scenario-spec 的 ScenarioSpec（纯类型，客户端组件与服务端都可以引用）
 * [OUTPUT]: 导出 InstantSpec、FeatureSpec、InstantRow、Prediction、PredictEvent、PredictResult、ContextInfo、StepName、STEP_NAMES
 * [POS]: 「即时预估」模式的前后端契约。lib/limix/instant.ts 产出这些结构，hooks/use-instant.ts 与 components/instant/ 消费它们。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { ScenarioSpec } from "./scenario-spec"

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

/** 「即时预估」模式的场景：公共 ScenarioSpec 加上即时预估要的输入列、目标列、三份 CSV 与扫描曲线。
 *  data.fields 由 features 与 target 派生（lib/instant-scenarios.ts 的 instantFields），不另写一份。 */
export type InstantSpec = ScenarioSpec & {
  mode: "instant"
  /** 目标列：上下文表里有真值，预测时不上传 */
  target: { key: string; label: string; unit: string; note: string }
  /** 输入列，顺序即上传给 LimiX 的列顺序 */
  features: FeatureSpec[]
  /** public/ 下的上下文表（含目标列）与测试记录（含真值，模型没见过） */
  contextFile: string
  samplesFile: string
  /** public/ 下的示例上传文件：中文表头 + 实测值，演示「上传或粘贴」时先下载再上传 */
  uploadFile: string
  /** 上下文表的内容，如「历史配比与实测强度」，上下文状态条上用 */
  contextLabel: string
  /** 扫描曲线：固定其余输入，只改这一列，一次请求算完所有取值 */
  sweep?: { key: string; values: number[]; title: string }
  /** 推理记录里用来概括一条输入的列 */
  summaryKeys: string[]
  /** 警戒线：输入列里这条记录的下限与上限（如抽检的上下警戒线），结果卡、记录表与扫描曲线据此标出预估是否越线；没有的场景不写 */
  limits?: { lowKey: string; highKey: string; label: string }
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
