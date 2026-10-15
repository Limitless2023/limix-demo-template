import { Activity } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Sparkline } from "@/components/ui/sparkline"

type HealthLevel = "good" | "watch" | "warning" | "critical"
const levelText: Record<HealthLevel, string> = { good: "良好", watch: "关注", warning: "预警", critical: "高风险" }

// 健康度是 LimiX 预警：预警与高风险用描边 + 图标 + 文案表达，不用 alarm-*、不用红绿、不闪烁。
function HealthScore({
  score: scoreProp,
  label,
  level: levelProp,
  thresholds = [40, 60, 80],
  delta,
  note,
  trend,
  meta,
  layout = "card",
  className,
}: {
  score: number
  label?: string
  level?: HealthLevel
  thresholds?: [number, number, number]
  delta?: string
  note?: string
  trend?: number[]
  meta?: string
  layout?: "card" | "row"
  className?: string
}) {
  const score = Math.max(0, Math.min(100, scoreProp))
  const level: HealthLevel = levelProp ?? (score >= thresholds[2] ? "good" : score >= thresholds[1] ? "watch" : score >= thresholds[0] ? "warning" : "critical")
  const alertish = level === "warning" || level === "critical"
  const aria = `${label ? `${label}，` : ""}健康度 ${Math.round(score)} 分，${levelText[level]}${note ? `，${note}` : ""}`
  const meter = (
    <span aria-hidden="true" className="relative block h-1.5 overflow-hidden rounded-full bg-muted">
      <span className="absolute inset-y-0 left-0 rounded-full bg-foreground" style={{ width: `${score}%` }} />
      {thresholds.map((t) => <span key={t} className="absolute inset-y-0 -ml-px w-0.5 bg-card" style={{ left: `${t}%` }} />)}
    </span>
  )
  const levelNode = (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-foreground", level === "critical" && "font-bold")}>
      {alertish ? <Activity aria-hidden="true" className="size-3.5" strokeWidth={1.5} /> : null}
      {levelText[level]}
    </span>
  )
  const frame = cn("min-w-0 rounded-md border bg-card text-card-foreground", alertish ? "border-foreground" : "border-border")
  if (layout === "row") {
    return (
      <div role="group" aria-label={aria} data-level={level} className={cn(frame, "grid grid-cols-[minmax(0,1fr)_3ch_auto] items-center gap-3 px-3 py-2 sm:grid-cols-[minmax(96px,1.4fr)_minmax(64px,1fr)_3ch_auto]", className)}>
        <span className="grid min-w-0 text-[13px] leading-[18px]">
          <span className="truncate">{label}</span>
          {meta ? <small className="font-mono text-[11px] text-muted-foreground">{meta}</small> : null}
        </span>
        <span className="order-last col-span-full sm:order-none sm:col-span-1">{meter}</span>
        <span className="text-right font-mono text-sm font-semibold tabular-nums">{Math.round(score)}</span>
        {levelNode}
      </div>
    )
  }
  return (
    <div role="group" aria-label={aria} data-level={level} className={cn(frame, "grid gap-2 p-4", className)}>
      <div className="flex items-baseline justify-between gap-2 text-[13px] leading-5">
        <span className="truncate text-muted-foreground">{label ?? "健康度"}</span>
        {levelNode}
      </div>
      <p className="m-0 flex items-baseline gap-2">
        <span className="font-mono text-[28px] leading-9 font-semibold tabular-nums">{Math.round(score)}</span>
        <span className="text-[13px] text-muted-foreground">/ 100</span>
        {delta ? <Badge variant="delta">{delta}</Badge> : null}
      </p>
      {meter}
      {note ? <p className="m-0 text-xs leading-[18px] text-foreground">{note}</p> : null}
      {trend ? <Sparkline values={trend} tone="neutral" baseline={thresholds[0]} height={28} ariaLabel={`${label ?? ""} 健康度趋势`} /> : null}
      {meta ? <p className="m-0 font-mono text-[11px] text-muted-foreground">{meta}</p> : null}
    </div>
  )
}

export { HealthScore, type HealthLevel }
