/**
 * [INPUT]: 依赖 @/lib/limix/instant 的上下文与预测编排；依赖 @/lib/instant-scenarios 的 findInstantSpec；依赖 ./validate 的入参校验
 * [OUTPUT]: GET 返回上下文信息，带 download=context 时返回当前上下文 CSV；POST 按 action 执行 prepare / append / reset（JSON），predict 以 NDJSON 流逐步返回
 * [POS]: 「即时预估」的唯一 HTTP 入口，hooks/use-instant.ts 是唯一调用方。API Key 只在服务端使用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { LimixError } from "@/lib/limix/client"
import { appendToContext, getContextCsv, getContextInfo, predictInstant, prepareContext, resetContext } from "@/lib/limix/instant"
import { findInstantSpec } from "@/lib/instant-scenarios"
import type { PredictEvent } from "@/lib/instant-types"

import { parseBody } from "./validate"

// 一次预测通常约 6 秒；轮询上限 90 秒（见 lib/limix/client.ts 的 waitForTask），这里留足。
export const maxDuration = 120

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const spec = findInstantSpec(params.get("scenario") ?? "")
  if (!spec) return Response.json({ error: "未知场景" }, { status: 404 })
  if (params.get("download") !== "context") return Response.json(await getContextInfo(spec))
  // 下载当前上下文：带 BOM，Excel 直接打开不乱码；文件名带行数，演示中加入记录后能看出差别
  const { csv, rows } = await getContextCsv(spec)
  return new Response("\uFEFF" + csv, {
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
  const { spec, body } = parsed

  if (body.action === "predict") return streamPredict((emit) => predictInstant(spec, body.rows, emit))
  try {
    if (body.action === "append") return Response.json(await appendToContext(spec, body.row))
    if (body.action === "reset") return Response.json(await resetContext(spec))
    return Response.json(await prepareContext(spec))
  } catch (error) {
    return failure(error)
  }
}

// NDJSON：一行一个事件。出错时补一行 error 事件再关闭，页面不用区分 HTTP 状态。
function streamPredict(run: (emit: (event: PredictEvent) => void) => Promise<void>) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: PredictEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      try {
        await run(emit)
      } catch (error) {
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
