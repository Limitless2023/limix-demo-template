/**
 * [INPUT]: 依赖 @/lib/instant-scenarios 的 findInstantSpec；依赖 @/lib/instant-types 的 InstantRow、InstantSpec
 * [OUTPUT]: 导出 parseBody：把请求体校验成带场景配置的 InstantBody 与留痕信息 RunMeta，或返回中文错误
 * [POS]: app/api/instant 的入参边界，与 route.ts 同目录。只校验形状与数值，不访问 LimiX。
 *        实测值（truths）与上传的原文件（upload）只用于留痕，不会上传给 LimiX。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { findInstantSpec } from "@/lib/instant-scenarios"
import type { InstantRow, InstantSpec } from "@/lib/instant-types"

const MAX_ROWS = 200
const MAX_UPLOAD_CHARS = 2_000_000

const SOURCES = {
  manual: "手动输入",
  sample: "测试记录",
  batch: "上传或粘贴",
  feed: "上游推送",
  sweep: "参数扫描",
} as const

/** 留痕用：页面会话、输入方式、每条的实测值、上传的原文件 */
export type RunMeta = {
  session: string
  source?: (typeof SOURCES)[keyof typeof SOURCES]
  truths?: (number | null)[]
  upload?: { name: string; text: string }
}

export type InstantBody =
  | { action: "prepare" }
  | { action: "reset" }
  | { action: "append"; row: InstantRow }
  | { action: "predict"; rows: InstantRow[] }

export function parseBody(raw: unknown): { spec: InstantSpec; body: InstantBody; meta: RunMeta } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "请求体应为 JSON 对象" }
  const b = raw as Record<string, unknown>
  const spec = findInstantSpec(String(b.scenario ?? ""))
  if (!spec) return { error: "未知场景" }
  const featureKeys = spec.features.map((f) => f.key)
  const meta = readMeta(b)

  switch (b.action) {
    case "prepare":
    case "reset":
      return { spec, body: { action: b.action }, meta }
    case "append": {
      const row = readRow(b.row, [...featureKeys, spec.target.key])
      return typeof row === "string" ? { error: row } : { spec, body: { action: "append", row }, meta }
    }
    case "predict": {
      if (!Array.isArray(b.rows) || b.rows.length === 0) return { error: "至少需要一条记录" }
      if (b.rows.length > MAX_ROWS) return { error: `一次最多预测 ${MAX_ROWS} 条，demo 请先截取` }
      const rows: InstantRow[] = []
      for (const [i, r] of b.rows.entries()) {
        const row = readRow(r, featureKeys)
        if (typeof row === "string") return { error: `第 ${i + 1} 条：${row}` }
        rows.push(row)
      }
      if (meta.truths && meta.truths.length !== rows.length) meta.truths = undefined
      return { spec, body: { action: "predict", rows }, meta }
    }
    default:
      return { error: "action 应为 prepare / predict / append / reset" }
  }
}

function readMeta(b: Record<string, unknown>): RunMeta {
  const source = typeof b.source === "string" && b.source in SOURCES ? SOURCES[b.source as keyof typeof SOURCES] : undefined
  const truths = Array.isArray(b.truths)
    ? b.truths.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null))
    : undefined
  const u = b.upload as Record<string, unknown> | undefined
  const upload =
    u && typeof u.name === "string" && typeof u.text === "string" && u.name.length <= 200 && u.text.length <= MAX_UPLOAD_CHARS
      ? { name: u.name, text: u.text }
      : undefined
  return { session: typeof b.session === "string" ? b.session.slice(0, 64) : "", source, truths, upload }
}

// 只保留需要的列，每列都必须是有限数值；多余的列（如前端带的 id、真值）在这里丢弃，不会被上传。
function readRow(raw: unknown, keys: string[]): InstantRow | string {
  if (!raw || typeof raw !== "object") return "记录应为对象"
  const r = raw as Record<string, unknown>
  const row: InstantRow = {}
  for (const k of keys) {
    const v = typeof r[k] === "string" ? Number(r[k]) : r[k]
    if (typeof v !== "number" || !Number.isFinite(v)) return `${k} 缺失或不是数值`
    row[k] = v
  }
  return row
}
