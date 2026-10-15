import { Ban, Clock, Hand } from "lucide-react"

import { cn } from "@/lib/utils"
import { AlarmMark, alarmText, type AlarmPriority } from "@/components/ui/alarm-mark"
import { Sparkline } from "@/components/ui/sparkline"

type DataQuality = "good" | "bad" | "stale" | "manual"

const qualityMeta = {
  bad: { Icon: Ban, label: "坏值", className: "text-[var(--quality-bad)]" },
  stale: { Icon: Clock, label: "陈旧", className: "text-[var(--quality-stale)]" },
  manual: { Icon: Hand, label: "手动", className: "border-dashed text-[var(--quality-manual)]" },
}

const fixed = (v: number | null | undefined, digits: number) =>
  v == null || Number.isNaN(v) ? "—" : v.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })

// 测点读数：数值用前景色 mono，不用品牌色；数据质量用图标 + 文字标签，坏值删除线加斜线底，陈旧压暗。
function ProcessValue({
  label,
  tag,
  value,
  unit,
  digits = 1,
  quality = "good",
  qualityNote,
  alarm,
  alarmUnacked,
  trend,
  trendBand,
  variant = "tile",
  size = "default",
  className,
}: {
  label?: string
  tag?: string
  value: number | null
  unit?: string
  digits?: number
  quality?: DataQuality
  qualityNote?: string
  alarm?: AlarmPriority
  alarmUnacked?: boolean
  trend?: number[]
  trendBand?: [number, number]
  variant?: "tile" | "inline"
  size?: "default" | "lg"
  className?: string
}) {
  const q = quality !== "good" ? qualityMeta[quality] : null
  const tight = unit === "%" || unit === "‰"
  const text = fixed(value, digits)
  const inline = variant === "inline"
  const aria = [label, tag, `${text}${unit ? (tight ? unit : ` ${unit}`) : ""}`, q ? `数据质量${q.label}${qualityNote ? `，${qualityNote}` : ""}` : "", alarm ? `P${alarm} ${alarmText[alarm]}告警` : ""].filter(Boolean).join("，")
  return (
    <div
      role="group"
      aria-label={aria}
      data-quality={quality}
      className={cn(
        "min-w-0",
        inline ? "inline-flex flex-wrap items-center gap-2" : "grid content-start gap-1 rounded-md border border-border bg-card px-4 py-3 text-card-foreground",
        className,
      )}
    >
      {inline ? null : (
        <div className="flex min-w-0 items-baseline gap-2 text-[13px] leading-5">
          {label ? <span className="truncate text-muted-foreground">{label}</span> : null}
          {tag ? <span className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">{tag}</span> : null}
        </div>
      )}
      {inline && tag ? <span className="font-mono text-[11px] text-muted-foreground">{tag}</span> : null}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "font-mono font-semibold tracking-[-0.01em] tabular-nums text-foreground",
            inline ? "text-sm leading-5" : size === "lg" ? "text-[32px] leading-10" : "text-[22px] leading-[30px]",
            quality === "stale" && "font-medium text-[var(--quality-stale)]",
            quality === "bad" && "rounded-sm bg-[repeating-linear-gradient(135deg,transparent_0_4px,var(--border)_4px_5px)] px-1 text-[var(--quality-stale)] line-through decoration-2",
          )}
        >
          {text}
          {tight ? unit : null}
        </span>
        {unit && !tight ? <span className="text-[13px] text-muted-foreground">{unit}</span> : null}
        {alarm ? <AlarmMark priority={alarm} size="sm" blink={alarmUnacked} /> : null}
      </div>
      {q ? (
        <span className={cn("inline-flex h-[22px] items-center gap-1 justify-self-start rounded-full border border-current px-2 text-xs font-medium whitespace-nowrap", q.className)}>
          <q.Icon aria-hidden="true" className="size-3" strokeWidth={1.5} />
          {q.label}{qualityNote ? ` · ${qualityNote}` : ""}
        </span>
      ) : null}
      {trend && !inline ? <Sparkline className="mt-1" values={trend} band={trendBand} tone="neutral" height={24} ariaLabel={`${label ?? tag ?? ""} 趋势`} /> : null}
    </div>
  )
}

export { ProcessValue, type DataQuality }
