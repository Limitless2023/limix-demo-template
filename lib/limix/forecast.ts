/**
 * [INPUT]: 依赖 ./client 的 uploadCsv、submitInferenceTask、waitForTask、downloadText；依赖 ./config 的 isMockMode；
 *          依赖 @/lib/csv 的 parseCsv、toCsv；依赖 node:fs 读取 public/ 下的样例
 * [OUTPUT]: 导出 loadSample、sampleFile、backtestDays、planFromSample、planFromUpload、runForecast 与 ForecastPlan 类型
 * [POS]: lib/limix 的「时序预测」编排，app/api/forecast/route.ts 是唯一调用方。与 instant.ts 平级。
 *        一次预测 = 历史（时间、目标、已知输入）+ 未来点位（时间、已知输入）→ 异步时序任务（P10 / P50 / P90）→ 取回。
 *        已知输入是预测时就能拿到的未来数据（如日前公布的负荷预测、气象预报），LimiX 里叫协变量；没有时只传历史。
 *        样例按预测日回测时，未来点位的实测值一并带回，页面拿来对账。目标值有公布延迟的对象（gapDays）历史只用到延迟之前。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import "server-only"

import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { parseCsv, toCsv, type CsvTable } from "@/lib/csv"
import type { ForecastObject, ForecastResult, ForecastRow } from "@/lib/forecast-types"

import { downloadText, submitInferenceTask, uploadCsv, waitForTask } from "./client"
import { isMockMode } from "./config"

const QUANTILES = [0.1, 0.5, 0.9]

type Row = Record<string, string>

export type ForecastPlan = {
  history: Row[]
  /** 要预测的点位：时间与已知输入；只用历史、预测样例结束之后时为空，由 horizon 决定步数 */
  future: Row[]
  horizon: number
  known: string[]
  /** 未来点位的实测值（回测时有） */
  actual?: (number | null)[]
  /** 未来点位里开头几行是间隔（目标值预测时还拿不到的那几天），只为接上历史，预测后丢掉 */
  skip?: number
}

// ──────────────────────────────────────────────────────────────
// 样例：public/ 下的 CSV，按路径缓存在 globalThis，只读一次
// ──────────────────────────────────────────────────────────────

type Sample = { text: string; sha256: string; table: CsvTable }

const store = globalThis as typeof globalThis & { __limixForecastSamples?: Map<string, Promise<Sample>> }
const samples = (store.__limixForecastSamples ??= new Map<string, Promise<Sample>>())

/** 样例原文、指纹与解析结果；留痕时用指纹去重 */
export function sampleFile(file: string) {
  let sample = samples.get(file)
  if (!sample) {
    sample = readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", file), "utf8").then((text) => ({
      text,
      sha256: createHash("sha256").update(text).digest("hex"),
      table: parseCsv(text),
    }))
    sample.catch(() => samples.delete(file))
    samples.set(file, sample)
  }
  return sample
}

export const loadSample = (file: string) => sampleFile(file).then((s) => s.table)

const filled = (v: string | undefined) => v != null && v.trim() !== ""

/** 回测可选的预测日：样例最后 backtestDays 天里，目标列整天都有值的日子（新的在前） */
export function backtestDays(obj: ForecastObject, table: CsvTable): string[] {
  const { colDate, colTarget, perDay, backtestDays: n } = obj.forecast
  if (!n) return []
  const byDay = new Map<string, Row[]>()
  for (const r of table.rows) {
    const day = r[colDate].slice(0, 10)
    byDay.set(day, [...(byDay.get(day) ?? []), r])
  }
  return [...byDay.keys()]
    .slice(-n)
    .filter((d) => byDay.get(d)!.length === perDay && byDay.get(d)!.every((r) => filled(r[colTarget])))
    .reverse()
}

// 已知输入偶有空值：先用前一个值补，开头的空值用后一个值补
function fillGaps(rows: Row[], cols: string[]): Row[] {
  const out = rows.map((r) => ({ ...r }))
  for (const c of cols) {
    let last: string | undefined
    for (const r of out) {
      if (filled(r[c])) last = r[c]
      else if (last != null) r[c] = last
    }
    const first = out.find((r) => filled(r[c]))?.[c]
    if (first != null) for (const r of out) if (!filled(r[c])) r[c] = first
  }
  return out
}

/**
 * 用样例：预测日之前的 contextSize 行做历史；预测日起 horizon 行带已知输入做未来，实测值一并带回。不给预测日则预测样例结束之后。
 * 有 gapDays 时历史只用到预测日前 gapDays 天之前，间隔的这几天也放进未来点位（它们的已知输入照样有），预测后丢掉。
 */
export function planFromSample(obj: ForecastObject, table: CsvTable, start?: string, horizon?: number): ForecastPlan {
  const { colDate, colTarget, contextSize, known, horizons, perDay, gapDays = 0 } = obj.forecast
  const steps = horizon ?? horizons[0]
  const at = start ? table.rows.findIndex((r) => r[colDate] >= start) : table.rows.length
  if (at < 0) throw new Error(`样例里没有 ${start} 之后的数据`)
  const skip = start ? Math.min(gapDays * perDay, at) : 0
  const cut = at - skip
  const history = fillGaps(table.rows.slice(Math.max(0, cut - contextSize), cut), known)
  if (!start) return { history, future: [], horizon: steps, known: [] }
  const future = fillGaps(table.rows.slice(cut, at + steps), known)
  if (future.length < skip + steps) throw new Error(`${start} 之后不足 ${steps} 个点位`)
  return {
    history,
    future,
    horizon: skip + steps,
    known,
    skip,
    actual: future.map((r) => (filled(r[colTarget]) ? Number(r[colTarget]) : null)),
  }
}

/**
 * 上传的数据：尾部目标列为空的行就是要预测的点位，这些行里有值的其他列算已知输入；没有这样的行时只用历史、预测 horizon 步。
 * 历史至少一天，最多取 contextSize 行。
 */
export function planFromUpload(obj: ForecastObject, table: CsvTable, horizon?: number): ForecastPlan {
  const { colDate, colTarget, contextSize, perDay, horizons } = obj.forecast
  for (const c of [colDate, colTarget])
    if (!table.columns.includes(c)) throw new Error(`上传的表需要包含 ${colDate}（时间）与 ${colTarget} 两列，实际列为：${table.columns.join("、")}`)
  let cut = table.rows.length
  while (cut > 0 && !filled(table.rows[cut - 1][colTarget])) cut--
  const future = table.rows.slice(cut)
  const history = table.rows.slice(Math.max(0, cut - contextSize), cut)
  if (history.length < perDay) throw new Error(`历史至少需要 ${perDay} 行（一天），实际 ${history.length} 行`)
  if (!future.length) return { history, future: [], horizon: horizon ?? horizons[0], known: [] }
  const known = table.columns.filter((c) => c !== colDate && c !== colTarget && future.every((r) => filled(r[c])))
  return { history: fillGaps(history, known), future, horizon: future.length, known }
}

// ──────────────────────────────────────────────────────────────
// 预测：上传历史（与未来点位）→ 异步时序任务 → 轮询 → 取回 P10 / P50 / P90
// ──────────────────────────────────────────────────────────────

export async function runForecast(obj: ForecastObject, plan: ForecastPlan): Promise<ForecastResult> {
  const { colDate, colTarget, showHistory } = obj.forecast
  const started = Date.now()
  const history = plan.history
    .slice(-showHistory)
    .map((r) => ({ time: r[colDate], value: Number(r[colTarget]) }))
  const base = { history, knownCount: plan.known.length, contextRows: plan.history.length }

  const skip = plan.skip ?? 0
  if (isMockMode()) {
    return { ...base, mode: "mock", rows: withActual(mockForecast(obj, plan), plan).slice(skip), elapsedMs: Date.now() - started }
  }

  const train = await uploadCsv(toCsv([colDate, colTarget, ...plan.known], plan.history), "history.csv")
  const predict = plan.known.length ? await uploadCsv(toCsv([colDate, ...plan.known], plan.future), "future.csv") : null
  const task = await submitInferenceTask("timeseries", {
    train_data_version_id: train.data_version_id,
    ...(predict ? { predict_data_version_id: predict.data_version_id, col_covariates: plan.known } : {}),
    context_size: plan.history.length,
    horizon: plan.horizon,
    col_target: colTarget,
    col_date: colDate,
    quantile: true,
    quantile_levels: QUANTILES,
  })
  // 带已知输入时上传与计算更久，排队时可能到一分钟以上；接口函数时长 120 秒，这里留出余量
  const done = await waitForTask(task.task_id, { timeoutMs: 110_000 })
  const table = parseCsv(await downloadText(done.result_version_id))
  const pick = (tag: string) => table.columns.find((c) => c.startsWith("pred_") && c.includes(tag))
  const p50 = pick("q50") ?? table.columns.find((c) => c.startsWith("pred_"))
  if (!p50) throw new Error("结果里没有预测列")
  const p10 = pick("q10") ?? p50
  const p90 = pick("q90") ?? p50
  const rows: ForecastRow[] = table.rows.map((r, i) => ({
    time: r[colDate] ?? plan.future[i]?.[colDate] ?? "",
    p50: Number(r[p50]),
    low: Number(r[p10]),
    high: Number(r[p90]),
  }))
  return { ...base, mode: "live", rows: withActual(rows, plan).slice(skip), elapsedMs: Date.now() - started, taskId: task.task_id }
}

function withActual(rows: ForecastRow[], plan: ForecastPlan): ForecastRow[] {
  if (!plan.actual) return rows
  return rows.map((r, i) => (plan.actual![i] != null ? { ...r, actual: plan.actual![i]! } : r))
}

// 模拟：近 7 天同一时刻的均值外推，区间按这 7 个值的波动给出。只用于没有 Key 时走通流程，结果标明 mode: "mock"。
function mockForecast(obj: ForecastObject, plan: ForecastPlan): ForecastRow[] {
  const { colDate, colTarget, perDay } = obj.forecast
  const values = plan.history.map((r) => Number(r[colTarget]))
  const times = plan.future.length
    ? plan.future.map((r) => r[colDate])
    : nextTimes(plan.history.map((r) => r[colDate]), plan.horizon)
  return times.map((time, h) => {
    const same = [1, 2, 3, 4, 5, 6, 7]
      .map((d) => values[values.length + h - d * perDay])
      .filter((v) => Number.isFinite(v))
    const mean = same.reduce((a, b) => a + b, 0) / (same.length || 1)
    const sd = Math.sqrt(same.reduce((a, b) => a + (b - mean) ** 2, 0) / (same.length || 1))
    return { time, p50: round(mean), low: round(mean - 1.28 * sd), high: round(mean + 1.28 * sd) }
  })
}

function nextTimes(times: string[], n: number) {
  const last = new Date(times[times.length - 1].replace(" ", "T"))
  const step = times.length > 1 ? last.getTime() - new Date(times[times.length - 2].replace(" ", "T")).getTime() : 3_600_000
  return Array.from({ length: n }, (_, i) => formatLocal(new Date(last.getTime() + (i + 1) * step)))
}

const round = (v: number) => Math.round(v * 10) / 10
const pad = (n: number) => String(n).padStart(2, "0")
const formatLocal = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
