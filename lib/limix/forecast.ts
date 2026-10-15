import "server-only"

import { parseCsv } from "@/lib/csv"
import type { ForecastRequest, ForecastResult, ForecastRow } from "@/lib/forecast-types"

import { downloadText, predictTimeseries, uploadCsv } from "./client"
import { isMockMode } from "./config"

const QUANTILES = [0.1, 0.5, 0.9]

// 时序预测的完整链路：上传 → 同步预测（P10 / P50 / P90）→ 下载结果 → 整理成前端直接画图的行。
// 没有 Key 时走模拟：按最近 7 天同一时刻的均值外推，区间按历史波动给出，结果标明 mode: "mock"。
export async function runForecast(req: ForecastRequest): Promise<ForecastResult> {
  const started = Date.now()
  if (isMockMode()) return { mode: "mock", rows: mockForecast(req), elapsedMs: Date.now() - started }

  const upload = await uploadCsv(req.csv, req.filename)
  const task = await predictTimeseries({
    trainDataVersionId: upload.data_version_id,
    colDate: req.colDate,
    colTarget: req.colTarget,
    horizon: req.horizon,
    contextSize: req.contextSize,
    quantileLevels: QUANTILES,
  })
  const table = parseCsv(await downloadText(task.result_version_id))
  const t = req.colTarget
  const rows: ForecastRow[] = table.rows.map((r) => ({
    time: r[req.colDate],
    p50: Number(r[`pred_q50_${t}`] ?? r[`pred_${t}`]),
    low: Number(r[`pred_q10_${t}`] ?? r[`pred_${t}`]),
    high: Number(r[`pred_q90_${t}`] ?? r[`pred_${t}`]),
  }))
  return { mode: "live", rows, elapsedMs: Date.now() - started, taskId: task.task_id, resultVersionId: task.result_version_id }
}

function mockForecast(req: ForecastRequest): ForecastRow[] {
  const { rows } = parseCsv(req.csv)
  const values = rows.map((r) => Number(r[req.colTarget]))
  const times = rows.map((r) => new Date(r[req.colDate].replace(" ", "T")))
  const step = times.length > 1 ? times[1].getTime() - times[0].getTime() : 3_600_000
  const period = Math.round(86_400_000 / step) || 24
  const out: ForecastRow[] = []
  for (let h = 1; h <= req.horizon; h++) {
    const same = [1, 2, 3, 4, 5, 6, 7].map((d) => values[values.length + h - 1 - d * period]).filter((v) => Number.isFinite(v))
    const mean = same.reduce((a, b) => a + b, 0) / same.length
    const sd = Math.sqrt(same.reduce((a, b) => a + (b - mean) ** 2, 0) / same.length)
    const spread = 1.28 * sd * (1 + h / req.horizon / 2)
    const time = new Date(times[times.length - 1].getTime() + h * step)
    out.push({ time: formatLocal(time), p50: round(mean), low: round(mean - spread), high: round(mean + spread) })
  }
  return out
}

const round = (v: number) => Math.round(v * 10) / 10
const pad = (n: number) => String(n).padStart(2, "0")
const formatLocal = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
