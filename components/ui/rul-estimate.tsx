import type * as React from "react"
import { Activity } from "lucide-react"

import { cn } from "@/lib/utils"
import { IntervalBand } from "@/components/ui/interval-band"

const unitSuffix = (u?: string) => (!u ? "" : u === "%" || u === "‰" ? u : ` ${u}`)
const fmt = (n: number) => Math.round(n).toLocaleString("zh-CN")

// 剩余寿命：基于 IntervalBand，轨道从「今天」起；计划检修画成虚线。区间下沿早于检修时给出 LimiX 预警文案（描边 + 图标），不用 alarm-*。
function RulEstimate({
  value,
  low,
  high,
  unit = "天",
  label = "剩余寿命",
  horizon: horizonProp,
  plannedIn,
  lowLabel = "P10",
  highLabel = "P90",
  meta,
  tone = "default",
  className,
}: {
  value: number
  low: number
  high: number
  unit?: string
  label?: string
  horizon?: number
  plannedIn?: number
  lowLabel?: string
  highLabel?: string
  meta?: string
  tone?: "default" | "neutral"
  className?: string
}) {
  const u = unitSuffix(unit)
  const horizon = horizonProp ?? Math.ceil((Math.max(high, plannedIn ?? 0) * 1.2) / 10) * 10
  const early = plannedIn != null && low < plannedIn
  const planPct = plannedIn != null ? Math.max(0, Math.min(100, (plannedIn / horizon) * 100)) : 0
  return (
    <div data-early={early || undefined} className={cn("grid min-w-0 gap-2 rounded-md border bg-card p-4 text-card-foreground", early ? "border-foreground" : "border-border", className)}>
      <div className="flex justify-between gap-2 text-[13px] leading-5 text-muted-foreground">
        <span>{label}</span>
        {meta ? <span className="font-mono text-[11px]">{meta}</span> : null}
      </div>
      <p className="m-0 text-sm leading-[22px]">
        预计 <b className="font-mono text-xl font-semibold tabular-nums">{fmt(value)}</b>{u}，区间{" "}
        <b className="font-mono text-xl font-semibold tabular-nums">{fmt(low)}–{fmt(high)}</b>{u}
        <span className="text-xs text-muted-foreground">（{lowLabel}–{highLabel}）</span>
      </p>
      {/* neutral：在本组件作用域里把区间色换成中性灰，用于监控与大屏 */}
      <div className="relative" style={tone === "neutral" ? ({ "--chart-seq-2": "var(--border)" } as React.CSSProperties) : undefined}>
        <IntervalBand
          value={value}
          low={low}
          high={high}
          min={0}
          max={horizon}
          unit={unit}
          format={fmt}
          lowLabel={lowLabel}
          highLabel={highLabel}
          showCaption={false}
          ariaLabel={`剩余寿命预计 ${fmt(value)}${u}，${lowLabel}–${highLabel} 区间 ${fmt(low)}–${fmt(high)}${u}${plannedIn != null ? `，计划检修在第 ${fmt(plannedIn)}${u}` : ""}`}
          className="grid-cols-[minmax(0,1fr)] [&>span:first-child]:hidden"
        />
        {plannedIn != null ? (
          <span aria-hidden="true" title={`计划检修：第 ${fmt(plannedIn)}${u}`} className="absolute -top-[3px] -bottom-[3px] -ml-px border-l-2 border-dashed border-foreground" style={{ left: `${planPct}%` }} />
        ) : null}
      </div>
      <div aria-hidden="true" className="relative flex justify-between gap-2 font-mono text-[11px] leading-[14px] text-muted-foreground">
        <span>今天</span>
        {plannedIn != null ? (
          <span
            className="absolute top-0 whitespace-nowrap text-foreground"
            style={{ left: `${planPct}%`, transform: planPct < 20 ? "none" : planPct > 80 ? "translateX(-100%)" : "translateX(-50%)" }}
          >
            检修 · {fmt(plannedIn)}{u}
          </span>
        ) : null}
        <span>{fmt(horizon)}{u}</span>
      </div>
      {plannedIn != null ? (
        early ? (
          <p className="m-0 flex items-start gap-1 text-xs leading-[18px] font-medium text-foreground">
            <Activity aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} />
            区间下沿（{fmt(low)}{u}）早于计划检修（第 {fmt(plannedIn)}{u}），建议提前安排
          </p>
        ) : (
          <p className="m-0 text-xs leading-[18px] text-muted-foreground">计划检修（第 {fmt(plannedIn)}{u}）前余量 {fmt(low - plannedIn)}{u}（按 {lowLabel}）</p>
        )
      ) : null}
    </div>
  )
}

export { RulEstimate }
