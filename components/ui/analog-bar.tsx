import { cn } from "@/lib/utils"
import { AlarmMark, alarmText, toPriority, type AlarmPriority } from "@/components/ui/alarm-mark"

type LimitKey = "ll" | "l" | "h" | "hh"
type AnalogLimits = Partial<Record<LimitKey, number>>

const unitSuffix = (u?: string) => (!u ? "" : u === "%" || u === "‰" ? u : ` ${u}`)
const fixed = (v: number | null | undefined, digits: number) =>
  v == null || Number.isNaN(v) ? "—" : v.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })
const borderColor: Record<AlarmPriority, string> = { 1: "border-[var(--alarm-p1)]", 2: "border-[var(--alarm-p2-edge)]", 3: "border-[var(--alarm-p3)]", 4: "border-[var(--alarm-p4)]" }

// 模拟量条：灰色轨道 + 正常区间带 + HH / H / L / LL 刻度 + 当前值指针 + 设定值空心菱形；越限加描边与优先级标记，数值不改色。
function AnalogBar({
  label,
  tag,
  value,
  min = 0,
  max = 100,
  unit,
  digits = 1,
  limits = {},
  limitPriority,
  normal,
  setpoint,
  alarmUnacked,
  showScale = true,
  ariaLabel,
  className,
}: {
  label?: string
  tag?: string
  value: number | null
  min?: number
  max?: number
  unit?: string
  digits?: number
  limits?: AnalogLimits
  limitPriority?: Partial<Record<LimitKey, AlarmPriority>>
  normal?: [number, number]
  setpoint?: number
  alarmUnacked?: boolean
  showScale?: boolean
  ariaLabel?: string
  className?: string
}) {
  const prio: Record<LimitKey, AlarmPriority> = { hh: 1, h: 3, l: 3, ll: 1, ...limitPriority }
  const u = unitSuffix(unit)
  const x = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min || 1)) * 100))
  let hit: LimitKey | null = null
  if (value != null) {
    if (limits.hh != null && value >= limits.hh) hit = "hh"
    else if (limits.ll != null && value <= limits.ll) hit = "ll"
    else if (limits.h != null && value >= limits.h) hit = "h"
    else if (limits.l != null && value <= limits.l) hit = "l"
  }
  const alarm = hit ? toPriority(prio[hit]) : null
  const keys = (["ll", "l", "h", "hh"] as LimitKey[]).filter((k) => limits[k] != null)
  const aria =
    ariaLabel ??
    [
      label,
      tag,
      `当前 ${fixed(value, digits)}${u}`,
      normal ? `正常区间 ${fixed(normal[0], digits)}–${fixed(normal[1], digits)}${u}` : "",
      setpoint != null ? `设定值 ${fixed(setpoint, digits)}${u}` : "",
      hit && alarm ? `越过 ${hit.toUpperCase()} 限 ${fixed(limits[hit], digits)}${u}，P${alarm} ${alarmText[alarm]}告警` : "",
    ].filter(Boolean).join("，")
  return (
    <div role="img" aria-label={aria} className={cn("grid min-w-0 gap-0.5 rounded-md border border-transparent px-3 py-2 text-[13px] leading-5", alarm && borderColor[alarm], className)}>
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2 text-muted-foreground">
          {label ? <span className="truncate">{label}</span> : null}
          {tag ? <span className="font-mono text-[11px] whitespace-nowrap">{tag}</span> : null}
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          {alarm ? <AlarmMark priority={alarm} size="sm" blink={alarmUnacked} /> : null}
          {hit ? <span className="font-mono text-[11px] font-bold">{hit.toUpperCase()}</span> : null}
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">{fixed(value, digits)}</span>
          {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
        </span>
      </div>
      <div aria-hidden="true" className="relative mt-2 h-2.5 rounded-[2px] border border-border bg-muted">
        {normal ? <span className="absolute inset-y-0 bg-border" style={{ left: `${x(normal[0])}%`, width: `${x(normal[1]) - x(normal[0])}%` }} /> : null}
        {keys.map((k) => (
          <span
            key={k}
            className={cn("absolute -inset-y-1", k === "hh" || k === "ll" ? "-ml-px w-0.5 bg-foreground" : "-ml-[0.5px] w-px bg-muted-foreground")}
            style={{ left: `${x(limits[k] as number)}%` }}
          />
        ))}
        {setpoint != null ? (
          <span title={`设定值 ${fixed(setpoint, digits)}${u}`} className="absolute -bottom-[9px] -ml-1 size-2 rotate-45 border-[1.5px] border-foreground bg-card" style={{ left: `${x(setpoint)}%` }} />
        ) : null}
        {value != null ? (
          <span className="absolute -top-[7px] -bottom-[3px] -ml-px w-0.5 bg-foreground before:absolute before:-top-px before:-left-1 before:border-[5px] before:border-b-0 before:border-transparent before:border-t-foreground before:content-['']" style={{ left: `${x(value)}%` }} />
        ) : null}
      </div>
      <div aria-hidden="true" className="relative mt-1 h-3.5 font-mono text-[10px] leading-[14px] text-muted-foreground">
        {keys.map((k) => (
          <span key={k} className={cn("absolute -translate-x-1/2", hit === k && "font-bold text-foreground")} style={{ left: `${x(limits[k] as number)}%` }}>
            {k.toUpperCase()}
          </span>
        ))}
      </div>
      {showScale ? (
        <div aria-hidden="true" className="flex justify-between gap-2 font-mono text-[11px] leading-[14px] text-muted-foreground">
          <span>{fixed(min, 0)}</span>
          {setpoint != null ? <span className="text-foreground">SP {fixed(setpoint, digits)}</span> : null}
          <span>{fixed(max, 0)}{u}</span>
        </div>
      ) : null}
    </div>
  )
}

export { AnalogBar, type AnalogLimits }
