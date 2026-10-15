/**
 * [INPUT]: 依赖 react 的 useState、useRef、useEffect、useCallback；依赖 @/lib/instant-types 的契约类型
 * [OUTPUT]: 导出 useInstant hook 与 PredictProgress 类型
 * [POS]: 「即时预估」页面与 /api/instant 之间的唯一桥梁。components/instant/instant-demo.tsx 调用它；
 *        它不持有推理记录，只管上下文状态、单次预测的进度与错误。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"

import type { ContextInfo, InstantRow, InstantSpec, PredictEvent, PredictResult, StepName } from "@/lib/instant-types"

export type PredictProgress = {
  /** 这次预测是什么：单条、6 个龄期、上游推送 3 条… */
  label: string
  startedAt: number
  steps: Partial<Record<StepName, number>>
  status?: string
  result?: PredictResult
  failed?: string
}

export function useInstant(spec: InstantSpec) {
  const [info, setInfo] = React.useState<ContextInfo | null>(null)
  // 打开页面即开始上传上下文，所以初值为 true
  const [contextBusy, setContextBusy] = React.useState(true)
  const [progress, setProgress] = React.useState<PredictProgress | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  // 同一时刻只跑一个预测：上游推送到点时若上一批还没回来，这一批跳过
  const predicting = React.useRef(false)
  const [busy, setBusy] = React.useState(false)

  // 打开页面时把上下文表传到 LimiX，第一次预测就不用等它
  React.useEffect(() => {
    let cancelled = false
    postContext(spec.slug, "prepare")
      .then((next) => !cancelled && setInfo(next))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "上下文上传失败"))
      .finally(() => !cancelled && setContextBusy(false))
    return () => {
      cancelled = true
    }
  }, [spec.slug])

  const contextAction = React.useCallback(
    async (action: "reset" | "append", row?: InstantRow) => {
      setContextBusy(true)
      try {
        setInfo(await postContext(spec.slug, action, row))
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : "上下文更新失败")
        return false
      } finally {
        setContextBusy(false)
      }
    },
    [spec.slug],
  )

  /** 预测一批记录；流式更新进度，返回结果或 null（失败时 error 已设置）。 */
  const predict = React.useCallback(
    async (rows: InstantRow[], label: string): Promise<PredictResult | null> => {
      if (predicting.current) return null
      predicting.current = true
      setBusy(true)
      setError(null)
      const startedAt = Date.now()
      setProgress({ label, startedAt, steps: {} })
      const update = (patch: Partial<PredictProgress>) => setProgress((p) => (p && p.startedAt === startedAt ? { ...p, ...patch } : p))
      try {
        const res = await fetch("/api/instant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario: spec.slug, action: "predict", rows }),
        })
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error || `请求失败（HTTP ${res.status}）`)
        }
        let result: PredictResult | null = null
        const steps: Partial<Record<StepName, number>> = {}
        for await (const event of readEvents(res.body)) {
          if (event.type === "step") {
            steps[event.step] = event.ms
            update({ steps: { ...steps } })
          } else if (event.type === "status") update({ status: event.status })
          else if (event.type === "result") result = event.result
          else throw new Error(event.message)
        }
        if (!result) throw new Error("预测中断，没有拿到结果")
        update({ result, steps: result.timings })
        return result
      } catch (e) {
        const message = e instanceof Error ? e.message : "预测失败"
        update({ failed: message })
        setError(message)
        return null
      } finally {
        predicting.current = false
        setBusy(false)
      }
    },
    [spec.slug],
  )

  return {
    info,
    contextBusy,
    progress,
    busy,
    error,
    clearError: () => setError(null),
    predict,
    append: (row: InstantRow) => contextAction("append", row),
    reset: () => contextAction("reset"),
  }
}

async function postContext(scenario: string, action: "prepare" | "reset" | "append", row?: InstantRow) {
  const res = await fetch("/api/instant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, action, row }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || `请求失败（HTTP ${res.status}）`)
  return body as ContextInfo
}

// NDJSON：按行切开，每行一个事件。
async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<PredictEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  for (;;) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) if (line.trim()) yield JSON.parse(line) as PredictEvent
    if (done) break
  }
  if (buffer.trim()) yield JSON.parse(buffer) as PredictEvent
}
