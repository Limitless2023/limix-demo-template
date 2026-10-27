/**
 * [INPUT]: 依赖 @/lib/limix/instant 的上下文与预测编排；依赖 @/lib/gtm 的会话与留痕上报；依赖 @/lib/instant-scenarios 的 findInstantSpec；
 *          依赖 ./validate 的入参校验；依赖 next/server 的 after、next/headers 的 cookies
 * [OUTPUT]: GET 返回上下文信息，带 download=context 时返回当前上下文 CSV；POST 按 action 执行 prepare / append / reset（JSON），predict 以 NDJSON 流逐步返回
 * [POS]: 「即时预估」的唯一 HTTP 入口，hooks/use-instant.ts 是唯一调用方。API Key 只在服务端使用。
 *        上下文按操作人各一份（会话里的 open_id；未接入中台时全站共用一份）。预测、加入、重置在响应发出后经 after() 留痕到 GTM 中台。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from "node:crypto"

import { cookies } from "next/headers"
import { after } from "next/server"

import { parseCsv, toCsv } from "@/lib/csv"
import { reportRun, type DemoRun, type RunFile } from "@/lib/gtm/runs"
import { readSession, SESSION_COOKIE, type Operator } from "@/lib/gtm/token"
import { LimixError } from "@/lib/limix/client"
import { isMockMode } from "@/lib/limix/config"
import { appendToContext, getContextCsv, getContextFile, getContextInfo, predictInstant, prepareContext, resetContext } from "@/lib/limix/instant"
import { findInstantSpec } from "@/lib/instant-scenarios"
import type { InstantRow, InstantSpec, PredictEvent, PredictResult, StepName } from "@/lib/instant-types"

import { parseBody, type RunMeta } from "./validate"

// 一次预测通常约 6 秒；轮询上限 90 秒（见 lib/limix/client.ts 的 waitForTask），这里留足。
export const maxDuration = 120

const SHARED = "shared"

async function currentOperator(): Promise<Operator | null> {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value)
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const spec = findInstantSpec(params.get("scenario") ?? "")
  if (!spec) return Response.json({ error: "未知场景" }, { status: 404 })
  const owner = (await currentOperator())?.openId ?? SHARED
  if (params.get("download") !== "context") return Response.json(await getContextInfo(spec, owner))
  // 下载当前上下文：带 BOM，Excel 直接打开不乱码；文件名带行数，演示中加入记录后能看出差别
  const { csv, rows } = await getContextCsv(spec, owner)
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${spec.slug}-context-${rows}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

export async function POST(request: Request) {
  const parsed = parseBody(await request.json().catch(() => null))
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 })
  const { spec, body, meta } = parsed
  const operator = await currentOperator()
  const owner = operator?.openId ?? SHARED
  const at = Date.now()

  if (body.action === "predict") {
    const outcome: { result?: PredictResult; error?: string; steps: Partial<Record<StepName, number>> } = { steps: {} }
    after(async () => reportRun(await predictRun(spec, owner, operator, meta, at, body.rows, outcome)))
    return streamPredict((emit) =>
      predictInstant(spec, owner, body.rows, (event) => {
        if (event.type === "step") outcome.steps[event.step] = event.ms
        if (event.type === "result") outcome.result = event.result
        emit(event)
      }),
    (message) => (outcome.error = message))
  }

  if (body.action === "prepare") {
    try {
      return Response.json(await prepareContext(spec, owner))
    } catch (error) {
      return failure(error)
    }
  }

  // 加入上下文 / 重置：成功与失败都留痕，附上变更后的上下文版本
  const action = body.action === "append" ? "加入上下文" : "重置上下文"
  let error: string | undefined
  try {
    return Response.json(body.action === "append" ? await appendToContext(spec, owner, body.row) : await resetContext(spec, owner))
  } catch (e) {
    error = message(e)
    return failure(e)
  } finally {
    after(async () =>
      reportRun({
        ...base(spec, operator, meta, at),
        action,
        count: body.action === "append" ? 1 : 0,
        ok: !error,
        error,
        mode: isMockMode() ? "模拟" : "LimiX",
        totalMs: Date.now() - at,
        context: await getContextFile(spec, owner),
      }),
    )
  }
}

function base(spec: InstantSpec, operator: Operator | null, meta: RunMeta, at: number) {
  return {
    scenario: { slug: spec.slug, name: spec.title, task: "回归" as const },
    operator: operator ?? { openId: "", name: "" },
    session: meta.session,
    at,
  }
}

async function predictRun(
  spec: InstantSpec,
  owner: string,
  operator: Operator | null,
  meta: RunMeta,
  at: number,
  rows: InstantRow[],
  outcome: { result?: PredictResult; error?: string; steps: Partial<Record<StepName, number>> },
): Promise<DemoRun> {
  const { result } = outcome
  const truths = meta.truths ?? rows.map(() => null)
  const measured = result ? truths.flatMap((t, i) => (t == null ? [] : [Math.abs(result.predictions[i].p50 - t)])) : []
  return {
    ...base(spec, operator, meta, at),
    action: "预测",
    source: meta.source,
    count: rows.length,
    ok: !!result,
    error: result ? undefined : (outcome.error ?? "预测中断"),
    mode: result ? (result.mode === "live" ? "LimiX" : "模拟") : isMockMode() ? "模拟" : "LimiX",
    totalMs: result?.totalMs ?? Date.now() - at,
    timings: {
      upload: outcome.steps.upload ?? 0,
      submit: outcome.steps.submit ?? 0,
      compute: outcome.steps.compute ?? 0,
      download: outcome.steps.download ?? 0,
    },
    mae: measured.length ? measured.reduce((a, b) => a + b, 0) / measured.length : undefined,
    taskId: result?.taskId,
    context: await getContextFile(spec, owner),
    upload: meta.upload ? uploadFile(meta.upload) : undefined,
    table: { name: `${spec.slug}-${stamp(at)}.csv`, csv: resultTable(spec, rows, truths, result) },
  }
}

// 输入与结果：每条一行，列名带单位；没有结果（失败）时只有输入与实测
function resultTable(spec: InstantSpec, rows: InstantRow[], truths: (number | null)[], result?: PredictResult) {
  const { label, unit } = spec.target
  const inputs = spec.features.map((f) => ({ key: f.key, name: `${f.label}（${f.unit}）` }))
  const outputs = [`${label}实测（${unit}）`, `P10（${unit}）`, `P50（${unit}）`, `P90（${unit}）`]
  const table = rows.map((row, i) => {
    const p = result?.predictions[i]
    return {
      ...Object.fromEntries(inputs.map((c) => [c.name, row[c.key]])),
      [outputs[0]]: truths[i] ?? "",
      [outputs[1]]: p ? round(p.low) : "",
      [outputs[2]]: p ? round(p.p50) : "",
      [outputs[3]]: p ? round(p.high) : "",
    }
  })
  return toCsv([...inputs.map((c) => c.name), ...outputs], table)
}

function uploadFile(upload: { name: string; text: string }): RunFile {
  const text = upload.text.replace(/^﻿/, "")
  const { columns, rows } = parseCsv(text)
  return {
    kind: "上传文件",
    name: upload.name,
    sha256: createHash("sha256").update(text).digest("hex"),
    rows: rows.length,
    columns,
    csv: text,
  }
}

const round = (v: number) => Math.round(v * 100) / 100
// 文件名里的时间：北京时间 yyyyMMdd-HHmmss
const stamp = (ms: number) => new Date(ms + 8 * 3600_000).toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15)

// NDJSON：一行一个事件。出错时补一行 error 事件再关闭，页面不用区分 HTTP 状态。
function streamPredict(run: (emit: (event: PredictEvent) => void) => Promise<void>, onError: (message: string) => void) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: PredictEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      try {
        await run(emit)
      } catch (error) {
        onError(message(error))
        emit({ type: "error", message: message(error) })
        console.error("[instant]", message(error))
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } })
}

function failure(error: unknown) {
  console.error("[instant]", message(error))
  return Response.json({ error: message(error) }, { status: error instanceof LimixError ? error.status : 500 })
}

const message = (error: unknown) => (error instanceof Error ? error.message : "请求失败")
