/**
 * [INPUT]: 依赖 ./token 的 isGtmLinked、gtmUrl、signRunBody
 * [OUTPUT]: 导出 DemoRun、RunFile 类型与 reportRun
 * [POS]: lib/gtm 的留痕上报：把一次调用发给 GTM 中台 POST /api/demo-runs，由中台写飞书「场景 Demo · 运行留痕」。
 *        契约与中台 src/modules/demo-runs/types.ts 一致。本实例已成功发过的文件只带指纹、不再带内容（中台按指纹去重）。
 *        只在 after() 里调用：页面先拿到结果，留痕失败只打日志，不影响演示。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import "server-only"

import { gtmUrl, isGtmLinked, signRunBody } from "./token"

export type RunFile = {
  kind: "初始上下文" | "更新后上下文" | "上传文件"
  name: string
  sha256: string
  rows: number
  columns: string[]
  dataVersionId?: string
  parentSha256?: string
  change?: string
  csv?: string
}

export type DemoRun = {
  scenario: { slug: string; name: string; task: "回归" | "分类" | "时序" }
  operator: { openId: string; name: string }
  session: string
  at: number
  action: "预测" | "加入上下文" | "重置上下文"
  source?: "手动输入" | "测试记录" | "上传或粘贴" | "上游推送" | "参数扫描" | "样例数据"
  /** 预测对象：一页有几个预测目标时（如日前电价 / 实时电价）这次预测的是哪个 */
  object?: string
  count: number
  ok: boolean
  error?: string
  mode?: "LimiX" | "模拟"
  totalMs?: number
  timings?: { upload: number; submit: number; compute: number; download: number }
  mae?: number
  taskId?: string
  context?: RunFile
  upload?: RunFile
  table?: { name: string; csv: string }
}

const store = globalThis as typeof globalThis & { __gtmSentFiles?: Set<string> }
const sent = (store.__gtmSentFiles ??= new Set<string>())

export async function reportRun(run: DemoRun) {
  if (!isGtmLinked()) return
  const files = [run.context, run.upload].filter((f): f is RunFile => !!f)
  for (const f of files) if (sent.has(f.sha256)) delete f.csv
  const body = JSON.stringify(run)
  const timestamp = String(Date.now())
  try {
    const res = await fetch(`${gtmUrl()}/api/demo-runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-timestamp": timestamp,
        "x-demo-signature": await signRunBody(timestamp, body),
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || data?.code !== 0) throw new Error(data?.message || `HTTP ${res.status}`)
    for (const f of files) if (f.csv) sent.add(f.sha256)
  } catch (error) {
    console.warn("[gtm] 留痕失败：", error instanceof Error ? error.message : error)
  }
}
