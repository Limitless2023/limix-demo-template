/**
 * [INPUT]: 依赖 @/lib/instant-scenarios 的 findInstantSpec；依赖 @/lib/instant-types 的 InstantRow、InstantSpec
 * [OUTPUT]: 导出 parseBody：把请求体校验成带场景配置的 InstantBody，或返回中文错误
 * [POS]: app/api/instant 的入参边界，与 route.ts 同目录。只校验形状与数值，不访问 LimiX。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { findInstantSpec } from "@/lib/instant-scenarios"
import type { InstantRow, InstantSpec } from "@/lib/instant-types"

const MAX_ROWS = 200

export type InstantBody =
  | { action: "prepare" }
  | { action: "reset" }
  | { action: "append"; row: InstantRow }
  | { action: "predict"; rows: InstantRow[] }

export function parseBody(raw: unknown): { spec: InstantSpec; body: InstantBody } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "请求体应为 JSON 对象" }
  const b = raw as Record<string, unknown>
  const spec = findInstantSpec(String(b.scenario ?? ""))
  if (!spec) return { error: "未知场景" }
  const featureKeys = spec.features.map((f) => f.key)

  switch (b.action) {
    case "prepare":
    case "reset":
      return { spec, body: { action: b.action } }
    case "append": {
      const row = readRow(b.row, [...featureKeys, spec.target.key])
      return typeof row === "string" ? { error: row } : { spec, body: { action: "append", row } }
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
      return { spec, body: { action: "predict", rows } }
    }
    default:
      return { error: "action 应为 prepare / predict / append / reset" }
  }
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
