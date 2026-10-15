/**
 * [INPUT]: 依赖 ./client 的 uploadCsv、submitInferenceTask、waitForTask、downloadText；依赖 ./config 的 isMockMode；
 *          依赖 @/lib/csv 的 parseCsv、toCsv；依赖 node:fs 读取 public/ 下的上下文表
 * [OUTPUT]: 导出 getContextInfo、getContextCsv、prepareContext、appendToContext、resetContext、predictInstant
 * [POS]: lib/limix 的「即时预估」编排：上下文表上传一次反复引用，每次只上传新记录。与 forecast.ts 平级，
 *        app/api/instant/route.ts 是唯一调用方。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { parseCsv, toCsv } from "@/lib/csv"
import type { ContextInfo, InstantRow, InstantSpec, PredictEvent, Prediction, StepName } from "@/lib/instant-types"

import { downloadText, submitInferenceTask, uploadCsv, waitForTask } from "./client"
import { isMockMode } from "./config"

const QUANTILES = [0.1, 0.5, 0.9]

// ──────────────────────────────────────────────────────────────
// 上下文状态：每个场景一份，挂在 globalThis 上。
// 开发模式热更新与不同路由的模块实例共用同一份，「加入上下文」后下一次预测立刻用上。
// gen 每次改动加一：上传途中上下文又变了，旧的上传结果作废，不会把过期版本当成当前版本。
// ──────────────────────────────────────────────────────────────

type ContextState = {
  columns: string[]
  base: Record<string, string>[]
  added: Record<string, string>[]
  gen: number
  versionId?: string
  uploadMs?: number
  uploading?: Promise<void>
}

const store = globalThis as typeof globalThis & { __limixInstant?: Map<string, ContextState> }
const contexts = (store.__limixInstant ??= new Map<string, ContextState>())

async function loadContext(spec: InstantSpec) {
  const cached = contexts.get(spec.slug)
  if (cached) return cached
  const table = parseCsv(await readFile(path.join(process.cwd(), "public", spec.contextFile), "utf8"))
  const columns = [...spec.features.map((f) => f.key), spec.target.key]
  const missing = columns.filter((c) => !table.columns.includes(c))
  if (missing.length) throw new Error(`上下文表缺少列：${missing.join("、")}`)
  const state: ContextState = { columns, base: table.rows, added: [], gen: 0 }
  contexts.set(spec.slug, state)
  return state
}

async function ensureVersion(spec: InstantSpec, state: ContextState) {
  while (!state.versionId) {
    if (!state.uploading) {
      const gen = state.gen
      const csv = toCsv(state.columns, [...state.base, ...state.added])
      const started = Date.now()
      state.uploading = uploadCsv(csv, `${spec.slug}-context.csv`)
        .then((up) => {
          if (gen !== state.gen) return
          state.versionId = up.data_version_id
          state.uploadMs = Date.now() - started
        })
        .finally(() => {
          state.uploading = undefined
        })
    }
    await state.uploading
  }
  return state.versionId
}

const info = (state: ContextState): ContextInfo => ({
  mode: isMockMode() ? "mock" : "live",
  rows: state.base.length + state.added.length,
  addedRows: state.added.length,
  uploadMs: isMockMode() ? undefined : state.uploadMs,
})

export async function getContextInfo(spec: InstantSpec) {
  return info(await loadContext(spec))
}

/** 当前上下文表（初始行 + 演示中加入的行），即上传给 LimiX 的同一份内容。 */
export async function getContextCsv(spec: InstantSpec) {
  const state = await loadContext(spec)
  return { csv: toCsv(state.columns, [...state.base, ...state.added]), rows: state.base.length + state.added.length }
}

/** 页面打开时调用：把上下文表上传到 LimiX（已上传则直接返回），让第一次预测不用等。 */
export async function prepareContext(spec: InstantSpec) {
  const state = await loadContext(spec)
  if (!isMockMode()) await ensureVersion(spec, state)
  return info(state)
}

/** 把一条带真值的记录加入上下文并立刻重新上传：不重新训练，下一次预测就用上。 */
export async function appendToContext(spec: InstantSpec, row: InstantRow) {
  const state = await loadContext(spec)
  state.added.push(Object.fromEntries(state.columns.map((c) => [c, String(row[c])])))
  return refresh(spec, state)
}

export async function resetContext(spec: InstantSpec) {
  const state = await loadContext(spec)
  state.added = []
  return refresh(spec, state)
}

async function refresh(spec: InstantSpec, state: ContextState) {
  state.gen += 1
  state.versionId = undefined
  if (!isMockMode()) await ensureVersion(spec, state)
  return info(state)
}

// ──────────────────────────────────────────────────────────────
// 预测：上传新记录 → 提交异步回归任务（P10 / P50 / P90）→ 轮询 → 取回。
// 每完成一步 emit 一次耗时，页面据此逐步点亮进度。新记录不带目标列，也不带任何 ID 列（LimiX 会把 ID 当特征）。
// ──────────────────────────────────────────────────────────────

export async function predictInstant(spec: InstantSpec, rows: InstantRow[], emit: (event: PredictEvent) => void) {
  const state = await loadContext(spec)
  const started = Date.now()
  const timings: Record<StepName, number> = { upload: 0, submit: 0, compute: 0, download: 0 }
  const contextRows = state.base.length + state.added.length

  if (isMockMode()) {
    const predictions = mockPredict(spec, state, rows)
    emit({ type: "result", result: { mode: "mock", predictions, timings, totalMs: Date.now() - started, contextRows } })
    return
  }

  const trainId = await ensureVersion(spec, state)
  const step = async <T>(name: StepName, run: () => Promise<T>) => {
    const t = Date.now()
    const value = await run()
    timings[name] = Date.now() - t
    emit({ type: "step", step: name, ms: timings[name] })
    return value
  }

  const featureKeys = spec.features.map((f) => f.key)
  const upload = await step("upload", () => uploadCsv(toCsv(featureKeys, rows), `${spec.slug}-predict.csv`))
  const task = await step("submit", () =>
    submitInferenceTask("regression", {
      train_data_version_id: trainId,
      predict_data_version_id: upload.data_version_id,
      target_column: spec.target.key,
      quantile: true,
      quantile_levels: QUANTILES,
    }),
  )
  const done = await step("compute", () => waitForTask(task.task_id, { onStatus: (status) => emit({ type: "status", status }) }))
  const csv = await step("download", () => downloadText(done.result_version_id))
  const predictions = readPredictions(csv, rows.length)
  emit({ type: "result", result: { mode: "live", predictions, timings, totalMs: Date.now() - started, contextRows, taskId: task.task_id } })
}

// 结果文件：pred_label 为点预测，分位列名形如 pred_q10（容忍带后缀或小数写法）。行序与上传顺序一致。
function readPredictions(csv: string, expected: number): Prediction[] {
  const { columns, rows } = parseCsv(csv)
  const find = (level: number) =>
    columns.find((c) => new RegExp(`^pred_q(${Math.round(level * 100)}|${level})(_|$)`).test(c)) ?? "pred_label"
  const [lo, mid, hi] = QUANTILES.map(find)
  if (rows.length !== expected) throw new Error(`结果行数 ${rows.length} 与上传的 ${expected} 条不一致`)
  return rows.map((r) => {
    const p50 = Number(r[mid] ?? r.pred_label)
    return { p50, low: Number(r[lo] ?? p50), high: Number(r[hi] ?? p50) }
  })
}

// 模拟：在上下文表里按标准化距离找 7 个最近邻，均值为 P50，±1.28 倍标准差为区间。只用于没有 Key 时走通流程。
function mockPredict(spec: InstantSpec, state: ContextState, rows: InstantRow[]): Prediction[] {
  const table = [...state.base, ...state.added]
  const keys = spec.features.map((f) => f.key)
  const scale = Object.fromEntries(spec.features.map((f) => [f.key, f.max - f.min || 1]))
  return rows.map((row) => {
    const near = table
      .map((r) => ({ y: Number(r[spec.target.key]), d: keys.reduce((s, k) => s + ((Number(r[k]) - row[k]) / scale[k]) ** 2, 0) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 7)
      .map((n) => n.y)
    const mean = near.reduce((a, b) => a + b, 0) / near.length
    const sd = Math.sqrt(near.reduce((a, b) => a + (b - mean) ** 2, 0) / near.length)
    return { p50: mean, low: mean - 1.28 * sd, high: mean + 1.28 * sd }
  })
}
