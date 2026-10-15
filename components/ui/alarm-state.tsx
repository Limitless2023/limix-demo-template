import { Ban, EyeOff, Hourglass, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import { AlarmMark, type AlarmPriority } from "@/components/ui/alarm-mark"

type AlarmStateValue = "unack-active" | "ack-active" | "unack-rtn" | "ack-rtn" | "latched" | "shelved" | "suppressed" | "out-of-service"

// ISA-18.2：只有「未确认激活」闪烁；搁置、设计抑制、停用退为灰色虚线，不再像激活告警。
const alarmStates: Record<AlarmStateValue, { label: string; variant: "solid" | "outline" | "muted"; blink?: boolean; Icon?: typeof Lock }> = {
  "unack-active": { label: "未确认", variant: "solid", blink: true },
  "ack-active": { label: "已确认", variant: "solid" },
  "unack-rtn": { label: "已恢复 · 未确认", variant: "outline" },
  // 已恢复且已确认：回到正常、移出激活列表，只在「已恢复」页签与处置记录里出现，画成灰色
  "ack-rtn": { label: "已恢复 · 已确认", variant: "muted" },
  latched: { label: "闭锁", variant: "solid", Icon: Lock },
  shelved: { label: "搁置", variant: "muted", Icon: Hourglass },
  suppressed: { label: "设计抑制", variant: "muted", Icon: EyeOff },
  "out-of-service": { label: "停用", variant: "muted", Icon: Ban },
}

function AlarmState({
  state,
  priority,
  label,
  meta,
  className,
}: {
  state: AlarmStateValue
  priority?: AlarmPriority | string
  label?: string
  meta?: string
  className?: string
}) {
  const s = alarmStates[state] ?? alarmStates["ack-active"]
  const quiet = s.variant === "muted"
  return (
    <span data-state={state} className={cn("inline-flex items-center gap-2 text-[13px] leading-5 whitespace-nowrap", quiet ? "text-muted-foreground" : "text-foreground", className)}>
      {priority != null ? (
        <AlarmMark priority={priority} variant={s.variant} blink={s.blink} size="sm" />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "size-2 shrink-0 rounded-full",
            quiet ? "shadow-[inset_0_0_0_1.5px_var(--muted-foreground)]" : state === "unack-rtn" ? "shadow-[inset_0_0_0_1.5px_var(--foreground)]" : "bg-foreground",
            s.blink && "sa-motion-blink",
          )}
        />
      )}
      <span className={cn(state === "unack-active" && "font-semibold")}>{label ?? s.label}</span>
      {s.Icon ? <s.Icon aria-hidden="true" className="size-3.5 text-[var(--icon-muted)]" strokeWidth={1.5} /> : null}
      {meta ? <span className="font-mono text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
    </span>
  )
}

export { AlarmState, alarmStates, type AlarmStateValue }
