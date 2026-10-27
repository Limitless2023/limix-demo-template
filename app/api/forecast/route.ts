/**
 * [INPUT]: 依赖 @/lib/limix/forecast 的样例读取、回测日、预测计划与 runForecast；依赖 @/lib/forecast-scenarios 的 forecastSpecs、findForecastObject；
 *          依赖 @/lib/gtm 的会话与留痕上报；依赖 next/server 的 after、next/headers 的 cookies
 * [OUTPUT]: GET ?scenario=&object= 返回样例信息（名称、行数、可选的回测日）；POST 跑一次预测，返回预测行、历史与耗时
 * [POS]: 「时序预测」的唯一 HTTP 入口，components/forecast/forecast-demo.tsx 是唯一调用方。API Key 只在服务端使用。
 *        用样例时浏览器只传场景、对象、预测日，样例由服务端读（几 MB 的表不经浏览器）；上传自己的表时带 csv，限 4 MB。
 *        每次预测在响应发出后经 after() 留痕到 GTM 中台：预测对象、输入方式（样例数据 / 上传或粘贴）、样例或上传的文件、输入与结果 CSV、对账误差。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from "node:crypto"

import { cookies } from "next/headers"
import { after } from "next/server"

import { parseCsv, toCsv } from "@/lib/csv"
import { findForecastObject, forecastSpecs } from "@/lib/forecast-scenarios"
import type { ForecastObject, ForecastRequest, ForecastResult } from "@/lib/forecast-types"
import { reportRun, type DemoRun, type RunFile } from "@/lib/gtm/runs"
import { readSession, SESSION_COOKIE } from "@/lib/gtm/token"
import { LimixError } from "@/lib/limix/client"
import { isMockMode } from "@/lib/limix/config"
import { backtestDays, loadSample, planFromSample, planFromUpload, runForecast, sampleFile } from "@/lib/limix/forecast"

// 带已知输入的预测，上传加计算通常 10–40 秒，排队时更久；轮询上限 110 秒（见 lib/limix/forecast.ts）
export const maxDuration = 120

const MAX_CSV_CHARS = 4 * 1024 * 1024
// 留痕请求体有上限：超过这个大小的文件只记指纹与行列，不带内容
const MAX_ATTACH_CHARS = 1_500_000

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const obj = findForecastObject(params.get("scenario"), params.get("object"))
  if (!obj) return Response.json({ error: "未知场景或预测对象" }, { status: 404 })
  try {
    const table = await loadSample(obj.forecast.sample.path)
    return Response.json({ name: obj.forecast.sample.name, rows: table.rows.length, days: backtestDays(obj, table) })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ForecastRequest> | null
  const obj = findForecastObject(body?.scenario, body?.object)
  if (!body || !obj) return Response.json({ error: "未知场景或预测对象" }, { status: 400 })
  const { horizons } = obj.forecast
  if (body.horizon != null && !horizons.includes(body.horizon))
    return Response.json({ error: `预测步长应为 ${horizons.join(" / ")} 之一` }, { status: 400 })
  if (typeof body.csv === "string" && body.csv.length > MAX_CSV_CHARS)
    return Response.json({ error: "上传的表超过 4 MB，请先截取" }, { status: 400 })

  const at = Date.now()
  const outcome: { result?: ForecastResult; error?: string } = {}
  const operator = await readSession((await cookies()).get(SESSION_COOKIE)?.value)
  after(async () => reportRun(await forecastRun(body as ForecastRequest, obj, operator, at, outcome)))

  try {
    let plan
    if (typeof body.csv === "string") {
      plan = planFromUpload(obj, parseCsv(body.csv.replace(/^﻿/, "")), body.horizon)
    } else {
      const table = await loadSample(obj.forecast.sample.path)
      if (body.start && !backtestDays(obj, table).includes(body.start)) {
        outcome.error = `${body.start} 不在可选的预测日里`
        return Response.json({ error: outcome.error }, { status: 400 })
      }
      plan = planFromSample(obj, table, body.start, body.horizon)
    }
    outcome.result = await runForecast(obj, plan)
    return Response.json(outcome.result)
  } catch (error) {
    outcome.error = message(error)
    return failure(error)
  }
}

// 一次预测的留痕：样例按指纹记一份文件，上传的表记为上传文件；输入与结果 CSV 带上实测，便于事后对账
async function forecastRun(
  body: ForecastRequest,
  obj: ForecastObject,
  operator: { openId: string; name: string } | null,
  at: number,
  outcome: { result?: ForecastResult; error?: string },
): Promise<DemoRun> {
  const spec = forecastSpecs[body.scenario]
  const { result } = outcome
  const rows = result?.rows ?? []
  const withActual = rows.filter((r) => r.actual != null)
  const unit = obj.forecast.unit
  let context: RunFile | undefined
  let upload: RunFile | undefined
  if (typeof body.csv === "string") {
    upload = { ...fileOf(body.csv.replace(/^﻿/, ""), body.filename || "upload.csv"), kind: "上传文件" }
  } else {
    const sample = await sampleFile(obj.forecast.sample.path)
    context = {
      kind: "初始上下文",
      name: obj.forecast.sample.path.split("/").pop() ?? "sample.csv",
      sha256: sample.sha256,
      rows: sample.table.rows.length,
      columns: sample.table.columns,
      ...(sample.text.length <= MAX_ATTACH_CHARS ? { csv: sample.text } : {}),
    }
  }
  return {
    scenario: { slug: body.scenario, name: spec?.title ?? body.scenario, task: "时序" },
    operator: operator ?? { openId: "", name: "" },
    session: typeof body.session === "string" ? body.session.slice(0, 64) : "",
    at,
    action: "预测",
    source: typeof body.csv === "string" ? "上传或粘贴" : "样例数据",
    object: spec && spec.objects.length > 1 ? obj.name : undefined,
    count: rows.length,
    ok: !!result,
    error: result ? undefined : (outcome.error ?? "预测中断"),
    mode: result ? (result.mode === "live" ? "LimiX" : "模拟") : isMockMode() ? "模拟" : "LimiX",
    totalMs: result?.elapsedMs ?? Date.now() - at,
    mae: withActual.length ? withActual.reduce((s, r) => s + Math.abs(r.p50 - r.actual!), 0) / withActual.length : undefined,
    taskId: result?.taskId,
    context,
    upload,
    table: {
      name: `${body.scenario}-${obj.key}-${stamp(at)}.csv`,
      csv: toCsv(
        ["时间", `P10（${unit}）`, `P50（${unit}）`, `P90（${unit}）`, `实测（${unit}）`],
        rows.map((r) => ({
          时间: r.time,
          [`P10（${unit}）`]: round(r.low),
          [`P50（${unit}）`]: round(r.p50),
          [`P90（${unit}）`]: round(r.high),
          [`实测（${unit}）`]: r.actual ?? "",
        })),
      ),
    },
  }
}

function fileOf(text: string, name: string): Omit<RunFile, "kind"> {
  const { columns, rows } = parseCsv(text)
  return {
    name,
    sha256: createHash("sha256").update(text).digest("hex"),
    rows: rows.length,
    columns,
    ...(text.length <= MAX_ATTACH_CHARS ? { csv: text } : {}),
  }
}

const round = (v: number) => Math.round(v * 100) / 100
// 文件名里的时间：北京时间 yyyyMMdd-HHmmss
const stamp = (ms: number) => new Date(ms + 8 * 3600_000).toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15)

function failure(error: unknown) {
  console.error("[forecast]", message(error))
  return Response.json({ error: message(error) }, { status: error instanceof LimixError ? error.status : 500 })
}

const message = (error: unknown) => (error instanceof Error ? error.message : "预测失败")
