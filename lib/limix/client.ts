/**
 * [INPUT]: 依赖 ./config 的 limixConfig（地址、Key、模型规格）
 * [OUTPUT]: 导出 LimixError、uploadCsv、predictTimeseries、submitInferenceTask、waitForTask、downloadText
 * [POS]: lib/limix 的 HTTP 层，唯一直接请求 LimiX 开放平台的文件。forecast.ts 与 instant.ts 编排完整链路。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import "server-only"

import { limixConfig } from "./config"

// LimiX 开放平台的服务端调用。接口文档：https://api-docs.stable-ai.cn/
// 约定：请求头只有 X-API-KEY；成功返回 { code: 0, message, data }，code ≠ 0 抛 LimixError（带原始错误码）。
// Node 的 fetch 默认复用连接：连续请求省掉重复的 TLS 握手（2026-10-15 实测每次新建连接约 0.8 秒）。

export class LimixError extends Error {
  constructor(
    message: string,
    readonly code: number | string,
    readonly status = 502,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${limixConfig.baseUrl}${path}`, {
    ...init,
    headers: { "X-API-KEY": limixConfig.apiKey, ...init.headers },
    cache: "no-store",
  })
  const body = await res.json().catch(() => null)
  if (!body) throw new LimixError(`LimiX 返回了无法解析的响应（HTTP ${res.status}）`, res.status)
  if (body.code !== 0) throw new LimixError(`LimiX 错误 ${body.code}：${body.message}`, body.code, res.status >= 400 ? res.status : 502)
  return body.data as T
}

const postJson = <T>(path: string, json: unknown) =>
  request<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) })

/** 上传 CSV，返回数据版本 ID（后续预测、评估的入口）。 */
export async function uploadCsv(csv: string, filename = "data.csv") {
  const form = new FormData()
  form.append("file", new Blob([csv], { type: "text/csv" }), filename)
  form.append("encoding", "utf-8")
  form.append("delimiter", ",")
  const data = await request<{ data_version_id: string; row_count: number; columns: string[] }>("/v1/data/files", {
    method: "POST",
    body: form,
  })
  return data
}

export type TimeseriesParams = {
  trainDataVersionId: string
  colDate: string
  colTarget: string
  horizon: number
  contextSize: number
  quantileLevels?: number[]
}

/** 时序同步预测（适合 demo 的小数据量），返回结果版本 ID。大数据量改用 /v1/inference/timeseries/tasks + 轮询。 */
export async function predictTimeseries(p: TimeseriesParams) {
  return postJson<{ task_id: string; status: string; result_version_id: string }>("/v1/inference/timeseries/predict", {
    train_data_version_id: p.trainDataVersionId,
    col_date: p.colDate,
    col_target: p.colTarget,
    horizon: p.horizon,
    context_size: p.contextSize,
    quantile: Boolean(p.quantileLevels?.length),
    ...(p.quantileLevels?.length ? { quantile_levels: p.quantileLevels } : {}),
    model_type: limixConfig.modelType,
  })
}

// ──────────────────────────────────────────────────────────────
// 异步任务：提交 → 轮询 → 拿结果版本。生产推荐异步，同步接口官方标为调试用。
// ──────────────────────────────────────────────────────────────

export type InferenceKind = "classification" | "regression" | "timeseries"

export type TaskSnapshot = {
  task_id: string
  status: string
  is_ready: boolean
  result_version_id?: string
  error_code?: string | number
  error_message?: string
}

/** 提交异步预测任务，返回 task_id。body 为接口字段（train_data_version_id 等），模型规格取环境变量。 */
export async function submitInferenceTask(kind: InferenceKind, body: Record<string, unknown>) {
  return postJson<{ task_id: string; status: string; queued_snapshot_ahead_count?: number }>(`/v1/inference/${kind}/tasks`, {
    model_type: limixConfig.modelType,
    ...body,
  })
}

/**
 * 轮询任务直到 is_ready（官方判据）。查询失败按网络抖动重试两次；超时抛错但任务仍在服务端运行，不自动重提。
 *
 * 轮询节奏来自 2026-10-15 实测（单条回归，16M）：
 * - 任务运行中查得太密，状态查询本身会挂住 30 秒以上，并返回过期的 running；每秒查一次几乎必现，挂住期间重查只会更久。
 * - 提交后先等 4 秒再查、之后每 3 秒查一次：5 次全部 4.7 秒完成，每次只查 1 次。
 * - 偶有 is_ready 为真而 status 仍是 running，结果版本照常可下载，所以以 result_version_id 为准。
 */
export async function waitForTask(
  taskId: string,
  {
    firstDelayMs = 4000,
    intervalMs = 3000,
    timeoutMs = 90_000,
    onStatus,
  }: { firstDelayMs?: number; intervalMs?: number; timeoutMs?: number; onStatus?: (status: string) => void } = {},
) {
  const deadline = Date.now() + timeoutMs
  let last = ""
  let failures = 0
  await sleep(firstDelayMs)
  while (Date.now() < deadline) {
    let task: TaskSnapshot
    try {
      task = await request<TaskSnapshot>(`/v1/inference/tasks/${encodeURIComponent(taskId)}`)
      failures = 0
    } catch (error) {
      if (error instanceof LimixError || ++failures > 2) throw error
      await sleep(intervalMs)
      continue
    }
    if (task.status !== last) onStatus?.((last = task.status))
    if (task.is_ready) {
      if (task.result_version_id) return { ...task, result_version_id: task.result_version_id }
      throw new LimixError(`预测未成功：${task.status}${task.error_message ? `，${task.error_message}` : ""}`, task.error_code ?? task.status)
    }
    await sleep(intervalMs)
  }
  throw new LimixError(`等待超过 ${Math.round(timeoutMs / 1000)} 秒，任务 ${taskId} 仍在运行`, "timeout", 504)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 下载数据版本或结果版本的文件内容（CSV 文本）。 */
export async function downloadText(downloadId: string) {
  const res = await fetch(`${limixConfig.baseUrl}/v1/data/download/${encodeURIComponent(downloadId)}`, {
    headers: { "X-API-KEY": limixConfig.apiKey },
    cache: "no-store",
  })
  const type = res.headers.get("content-type") || ""
  if (!res.ok || type.includes("application/json")) {
    const body = await res.json().catch(() => null)
    throw new LimixError(`下载结果失败：${body?.message ?? `HTTP ${res.status}`}`, body?.code ?? res.status)
  }
  return res.text()
}
