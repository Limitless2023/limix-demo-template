import { Bell } from "lucide-react"

import { cn } from "@/lib/utils"
import { AlarmMark, toPriority, type AlarmPriority } from "@/components/ui/alarm-mark"
import { Badge } from "@/components/ui/badge"
import { Sparkline } from "@/components/ui/sparkline"

// 指标卡：数值 mono；差值用 delta Badge；需关注时加图标与底边线，数值不改色。
// 一般的「需关注」用铃铛 + destructive；监控类页面的告警数传 alarmPriority，图标换成该优先级的 AlarmMark、底边线用 alarm-*，
// 不用三角形（那是 P2 的形状）配红色（P1 的颜色）。
const alarmBar: Record<AlarmPriority, string> = { 1: "bg-[var(--alarm-p1)]", 2: "bg-[var(--alarm-p2-edge)]", 3: "bg-[var(--alarm-p3)]", 4: "bg-[var(--alarm-p4)]" }
function Stat({
  label,
  value,
  unit,
  delta,
  note,
  trend,
  trendBand,
  trendBaseline,
  trendTone,
  state = "default",
  alarmPriority,
  className,
}: {
  label: string
  value: string | number
  unit?: string
  delta?: string
  note?: string
  trend?: number[]
  trendBand?: [number, number]
  trendBaseline?: number
  trendTone?: "default" | "neutral"
  state?: "default" | "alert"
  /** 告警数这类指标：state="alert" 时按该优先级画 AlarmMark 与底边线。 */
  alarmPriority?: AlarmPriority | string
  className?: string
}) {
  const alert = state === "alert"
  const priority = alert && alarmPriority != null ? toPriority(alarmPriority) : null
  // 百分号与千分号紧贴数值，其他单位另起一段。
  const tight = unit === "%" || unit === "‰"
  return (
    <div className={cn("relative grid min-w-0 content-start gap-1 overflow-hidden rounded-md border border-border bg-card px-4 pt-4 pb-3 text-card-foreground", className)}>
      <p className="flex items-center gap-1 text-[13px] leading-5 text-muted-foreground">
        {priority ? <AlarmMark priority={priority} size="sm" /> : alert ? <Bell className="size-3.5 text-destructive" strokeWidth={1.5} role="img" aria-label="需关注" /> : null}
        {label}
      </p>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-2xl leading-8 font-semibold tracking-[-0.01em] tabular-nums">
          {typeof value === "number" ? value.toLocaleString("zh-CN") : value}
          {tight ? unit : null}
        </span>
        {unit && !tight ? <span className="text-[13px] text-muted-foreground">{unit}</span> : null}
        {delta ? <Badge variant="delta">{delta}</Badge> : null}
      </p>
      {note ? <p className={cn("text-xs leading-[18px] text-muted-foreground", alert && "text-foreground")}>{note}</p> : null}
      {trend ? <Sparkline className="mt-2" values={trend} band={trendBand} baseline={trendBaseline} tone={trendTone} ariaLabel={`${label} 趋势`} /> : null}
      {alert ? <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-0.5", priority ? alarmBar[priority] : "bg-destructive")} /> : null}
    </div>
  )
}

export { Stat }
