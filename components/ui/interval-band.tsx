import { cn } from "@/lib/utils"

// 单位前留一个空格（「38.4 kN」），百分号与千分号紧贴数字（「2.6%」）。
const unitSuffix = (u?: string) => (!u ? "" : u === "%" || u === "‰" ? u : ` ${u}`)

// 单点预测区间：数值 + 轨道上的区间带、P50 竖线与实际值圆环；同一列多行请传相同的 min / max。
function IntervalBand({
  value,
  low,
  high,
  actual,
  min: minProp,
  max: maxProp,
  unit,
  format,
  lowLabel = "P10",
  highLabel = "P90",
  showCaption = true,
  ariaLabel,
  className,
}: {
  value: number
  low: number
  high: number
  actual?: number
  min?: number
  max?: number
  unit?: string
  format?: (value: number) => string
  lowLabel?: string
  highLabel?: string
  showCaption?: boolean
  ariaLabel?: string
  className?: string
}) {
  const pad = (high - low) * 0.25 || 1
  const min = minProp ?? Math.min(low, value, actual ?? low) - pad
  const max = maxProp ?? Math.max(high, value, actual ?? high) + pad
  const fmt = format ?? ((n: number) => n.toLocaleString("zh-CN"))
  const u = unitSuffix(unit)
  const x = (n: number) => `${Math.max(0, Math.min(100, ((n - min) / (max - min || 1)) * 100))}%`
  const label = ariaLabel ?? `预测 ${fmt(value)}${u}，${lowLabel}–${highLabel} 区间 ${fmt(low)}–${fmt(high)}${u}${actual != null ? `，实际 ${fmt(actual)}${u}` : ""}`
  return (
    <div role="img" aria-label={label} title={label} className={cn("grid min-w-0 grid-cols-[auto_minmax(80px,1fr)] items-center gap-x-3 gap-y-2", className)}>
      <span className="text-right font-mono text-[13px] whitespace-nowrap tabular-nums">{fmt(value)}{u}</span>
      <span aria-hidden="true" className="relative h-4 before:absolute before:inset-x-0 before:top-[7px] before:h-0.5 before:rounded-[1px] before:bg-muted before:content-['']">
        <span className="absolute top-1 h-2 rounded-[2px] bg-[var(--chart-seq-2)]" style={{ left: x(low), width: `calc(${x(high)} - ${x(low)})` }} />
        <span className="absolute top-px -ml-px h-3.5 w-0.5 rounded-[1px] bg-foreground" style={{ left: x(value) }} />
        {actual != null ? <span className="absolute top-[3px] -ml-[5px] size-2.5 rounded-full border-2 border-[var(--chart-1)] bg-background" style={{ left: x(actual) }} /> : null}
      </span>
      {showCaption ? (
        <span aria-hidden="true" className="col-start-2 flex justify-between gap-2 font-mono text-[11px] leading-[14px] text-muted-foreground">
          <span>{lowLabel} {fmt(low)}</span>
          <span>{highLabel} {fmt(high)}</span>
        </span>
      ) : null}
    </div>
  )
}

export { IntervalBand }
