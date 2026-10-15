import * as React from "react"

import { cn } from "@/lib/utils"

type Contribution = {
  label: string
  /** 带符号的贡献，单位同目标。 */
  value: number
  /** 该样本的特征取值，如 = 172 ℃。 */
  feature?: string
}

// 四舍五入后为 0 时写 ±，避免出现「−0.00」。
const signed = (v: number, digits: number) => {
  const s = Math.abs(v).toFixed(digits)
  return Number(s) === 0 ? `±${s}` : (v > 0 ? "+" : "−") + s
}

const barTone = {
  pos: "bg-[var(--chart-1)]",
  neg: "bg-[var(--chart-3)]",
  base: "bg-[var(--chart-4)]",
  total: "bg-foreground",
}

// 单位前留一个空格（「38.4 kN」），百分号与千分号紧贴数字（「2.6%」）。
const unitSuffix = (u?: string) => (!u ? "" : u === "%" || u === "‰" ? u : ` ${u}`)

// 贡献瀑布：从基准值逐项累加到预测值；按 |贡献| 从大到小，超出 maxItems 的合并为「其余 N 个特征」。
function ContributionWaterfall({
  base,
  items,
  maxItems = 8,
  unit,
  digits = 2,
  format,
  baseLabel = "基准值",
  totalLabel = "预测值",
  ariaLabel = "特征贡献",
  className,
}: {
  base: number
  items: Contribution[]
  maxItems?: number
  unit?: string
  digits?: number
  format?: (value: number) => string
  baseLabel?: string
  totalLabel?: string
  ariaLabel?: string
  className?: string
}) {
  const fmt = format ?? ((v: number) => (Math.round(v * 100) / 100).toLocaleString("zh-CN"))
  const u = unitSuffix(unit)
  const sorted = [...items].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  const shown: Array<Contribution & { rest?: boolean }> = sorted.slice(0, maxItems)
  const rest = sorted.slice(maxItems)
  if (rest.length) shown.push({ label: `其余 ${rest.length} 个特征`, value: rest.reduce((s, it) => s + it.value, 0), rest: true })
  let cum = base
  const steps = shown.map((it) => {
    const step = { it, from: cum, to: cum + it.value }
    cum += it.value
    return step
  })
  const total = cum
  const points = [base, total, ...steps.map((s) => s.to)]
  let lo = Math.min(...points)
  let hi = Math.max(...points)
  const pad = (hi - lo) * 0.06 || 1
  lo -= pad
  hi += pad
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100
  const grid = "grid grid-cols-[minmax(96px,30%)_minmax(0,1fr)_72px] gap-3 max-sm:grid-cols-[minmax(80px,38%)_minmax(0,1fr)_60px]"
  const row = (key: React.Key, label: string, feature: string | undefined, from: number, to: number, tone: keyof typeof barTone, value: string, kind?: "base" | "total", isRest?: boolean) => (
    <div key={key} data-kind={kind} className={cn(grid, "min-h-7 items-center", kind && "font-semibold", kind === "total" && "mt-1 border-t border-border pt-1")}>
      <span className="flex min-w-0 items-baseline gap-2">
        <span title={label} className={cn("truncate", isRest && "text-muted-foreground")}>{label}</span>
        {feature ? <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">{feature}</span> : null}
      </span>
      <span aria-hidden="true" className="relative h-4">
        <span className={cn("absolute inset-y-0.5 min-w-[2px] rounded-[2px]", barTone[tone])} style={{ left: `${Math.min(x(from), x(to))}%`, width: `${Math.abs(x(to) - x(from))}%` }} />
      </span>
      <span className="text-right font-mono whitespace-nowrap tabular-nums">{value}</span>
    </div>
  )
  return (
    <div role="figure" aria-label={`${ariaLabel}：基准 ${fmt(base)}${u}，预测 ${fmt(total)}${u}`} className={cn("grid gap-0.5 text-[13px] leading-5", className)}>
      {row("base", baseLabel, undefined, base, base, "base", `${fmt(base)}${u}`, "base")}
      {steps.map((s, i) => row(i, s.it.label, s.it.feature, s.from, s.to, s.it.value >= 0 ? "pos" : "neg", signed(s.it.value, digits), undefined, s.it.rest))}
      {row("total", totalLabel, undefined, total, total, "total", `${fmt(total)}${u}`, "total")}
      <div aria-hidden="true" className={cn(grid, "font-mono text-[11px] text-[var(--chart-axis)]")}>
        <span />
        <span className="flex justify-between">
          <span>{fmt(lo)}</span>
          <span>{fmt(hi)}</span>
        </span>
        <span />
      </div>
    </div>
  )
}

export { ContributionWaterfall, type Contribution }
