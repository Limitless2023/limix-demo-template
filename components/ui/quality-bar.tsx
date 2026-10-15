"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type QualityKind = "valid" | "invalid" | "empty"

// 有效安静、无效 destructive、空值斜纹
const kinds: Array<{ key: QualityKind; label: string; fill: string }> = [
  { key: "valid", label: "有效", fill: "var(--chart-3)" },
  { key: "invalid", label: "无效", fill: "var(--destructive)" },
  { key: "empty", label: "空值", fill: "repeating-linear-gradient(135deg, var(--chart-4) 0 2px, transparent 2px 4px)" },
]

const pct = (n: number, total: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : "—")

// 数据质量条：有效 / 无效 / 空值占比；传 onSelect 后分段与图例可点选筛选，再点取消。
function QualityBar({
  valid = 0,
  invalid = 0,
  empty = 0,
  unit = " 行",
  label = "数据质量",
  showLegend = true,
  selected: selectedProp,
  onSelect,
  className,
}: {
  valid?: number
  invalid?: number
  empty?: number
  unit?: string
  label?: string
  showLegend?: boolean
  /** 受控的选中分类；null 为未选。不传则组件自管。 */
  selected?: QualityKind | null
  onSelect?: (kind: QualityKind | null) => void
  className?: string
}) {
  const counts: Record<QualityKind, number> = { valid, invalid, empty }
  const total = valid + invalid + empty
  const interactive = typeof onSelect === "function"
  const [inner, setInner] = React.useState<QualityKind | null>(null)
  const selected = selectedProp !== undefined ? selectedProp : inner
  const pick = (kind: QualityKind) => {
    const next = selected === kind ? null : kind
    if (selectedProp === undefined) setInner(next)
    onSelect?.(next)
  }
  const focusRing = "focus-visible:outline-2 focus-visible:outline-ring"
  return (
    <div className={cn("grid gap-2 text-xs leading-4", className)}>
      <div
        role={interactive ? "group" : "img"}
        aria-label={`${label}：${kinds.map((k) => `${k.label} ${pct(counts[k.key], total)}`).join("，")}`}
        className="flex h-2 overflow-hidden rounded-full bg-muted"
      >
        {kinds.map((k) => {
          const n = counts[k.key]
          if (n <= 0) return null
          const text = `${k.label} ${n.toLocaleString("zh-CN")}${unit}（${pct(n, total)}）`
          const style = { width: `${(n / total) * 100}%`, background: k.fill }
          return interactive ? (
            <button
              key={k.key}
              type="button"
              tabIndex={-1}
              data-kind={k.key}
              title={text}
              aria-label={`筛选${text}`}
              aria-pressed={selected === k.key}
              style={style}
              className={cn("h-full min-w-0 cursor-pointer border-0 p-0 focus-visible:outline-offset-1", focusRing)}
              onClick={() => pick(k.key)}
            />
          ) : (
            <span key={k.key} data-kind={k.key} title={text} style={style} className="h-full min-w-0" />
          )
        })}
      </div>
      {showLegend ? (
        <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-muted-foreground">
          {kinds.map((k) => {
            const n = counts[k.key]
            const text = `${k.label} ${n.toLocaleString("zh-CN")}${unit}（${pct(n, total)}）`
            const content = (
              <>
                <i aria-hidden="true" className="size-2 rounded-[2px]" style={{ background: k.fill }} />
                {k.label}
                <span className="font-mono text-foreground tabular-nums">{pct(n, total)}</span>
              </>
            )
            return (
              <li key={k.key} className="inline-flex items-center gap-1.5">
                {interactive && n > 0 ? (
                  <button
                    type="button"
                    data-kind={k.key}
                    aria-pressed={selected === k.key}
                    aria-label={`筛选${text}`}
                    className={cn("inline-flex cursor-pointer items-center gap-1.5 rounded-[2px] border-0 bg-transparent p-0 text-inherit focus-visible:outline-offset-2", focusRing, selected === k.key && "font-semibold text-foreground")}
                    onClick={() => pick(k.key)}
                  >
                    {content}
                  </button>
                ) : (
                  <span title={text} className="inline-flex items-center gap-1.5">{content}</span>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export { QualityBar, type QualityKind }
