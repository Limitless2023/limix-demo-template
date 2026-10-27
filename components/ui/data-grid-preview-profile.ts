/**
 * [INPUT]: 依赖 @/components/ui/column-profile 的 ProfileBin、ProfileValue 类型
 * [OUTPUT]: 导出 ColumnStats、buildColumnStats、matchesSelection
 * [POS]: data-grid-preview.tsx 的纯函数层：按列算画像（数值列等宽直方图、类别列高频取值、缺失比例、均值与中位数），
 *        以及判断一行是否落在点选的直方图档位或取值里。不含 React，画像在全量数据上算，不随搜索变化。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ProfileBin, ProfileValue } from "@/components/ui/column-profile"

const BINS = 10
const TOP = 5

export type ColumnStats =
  | {
      kind: "numeric"
      bins: ProfileBin[]
      edges: number[]
      missing: number
      meta: string[]
    }
  | {
      kind: "category"
      topValues: ProfileValue[]
      unique: number
      missing: number
    }

const text = (v: unknown) => (v == null ? "" : String(v).trim())
const round = (v: number) => String(Math.round(v * 10) / 10)

export function buildColumnStats(
  values: unknown[],
  numeric: boolean
): ColumnStats {
  const present = values.map(text).filter(Boolean)
  const missing = values.length ? 1 - present.length / values.length : 0

  if (numeric) {
    const nums = present
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
    if (!nums.length)
      return { kind: "numeric", bins: [], edges: [], missing, meta: [] }
    const min = nums[0]
    const max = nums[nums.length - 1]
    const width = (max - min) / BINS || 1
    const edges = Array.from({ length: BINS + 1 }, (_, i) => min + i * width)
    const bins = edges
      .slice(0, -1)
      .map((from, i) => ({ from, to: edges[i + 1], count: 0 }))
    for (const v of nums) bins[binOf(v, edges)].count += 1
    const mean = nums.reduce((s, v) => s + v, 0) / nums.length
    return {
      kind: "numeric",
      bins,
      edges,
      missing,
      meta: [
        `均值 ${round(mean)}`,
        `中位 ${round(nums[Math.floor(nums.length / 2)])}`,
      ],
    }
  }

  const counts = new Map<string, number>()
  for (const v of present) counts.set(v, (counts.get(v) ?? 0) + 1)
  const topValues = [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP)
    .map(([label, count]) => ({ label, count }))
  return { kind: "category", topValues, unique: counts.size, missing }
}

// 最后一档包含右端点，其余档左闭右开
function binOf(v: number, edges: number[]) {
  const last = edges.length - 2
  for (let i = 0; i < last; i++) if (v < edges[i + 1]) return i
  return last
}

/** 点选的是直方图档位（序号）或类别取值（文字）；缺失值不属于任何档位。 */
export function matchesSelection(
  value: unknown,
  stats: ColumnStats,
  selection: number | string
) {
  const s = text(value)
  if (!s) return false
  if (stats.kind === "category") return s === selection
  const v = Number(s)
  return (
    Number.isFinite(v) &&
    typeof selection === "number" &&
    binOf(v, stats.edges) === selection
  )
}
