"use client"

import * as React from "react"
import { ArrowRight, Bell, Volume2, VolumeX } from "lucide-react"

import { cn } from "@/lib/utils"
import { AlarmMark, toPriority, type AlarmPriority } from "@/components/ui/alarm-mark"
import { alarmStates, type AlarmStateValue } from "@/components/ui/alarm-state"
import { Button } from "@/components/ui/button"

type AlarmItem = {
  id?: string | number
  priority: AlarmPriority | string
  message: string
  source?: string
  time?: string
  state?: AlarmStateValue
}

const activeStates: AlarmStateValue[] = ["unack-active", "ack-active", "unack-rtn", "latched"]
const borderColor: Record<AlarmPriority, string> = { 1: "border-[var(--alarm-p1)]", 2: "border-[var(--alarm-p2-edge)]", 3: "border-[var(--alarm-p3)]", 4: "border-[var(--alarm-p4)]" }

// 仍激活的未确认在前（异常还在、需要处理），其次是已恢复未确认（异常已消失、只差确认），再其次是已确认的；
// 同一档里优先级高的在前，再按传入顺序（最新在前）。已恢复的 P1 不会压过仍激活的 P2。
function pickTop(alarms: AlarmItem[]) {
  const rank = (a: AlarmItem) => {
    const state = a.state ?? "unack-active"
    return state === "unack-active" ? 0 : state === "unack-rtn" ? 1 : 2
  }
  return alarms
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank(x.a) - rank(y.a) || toPriority(x.a.priority) - toPriority(y.a.priority) || x.i - y.i)[0]?.a
}

// 顶栏告警横幅：只有左侧标记带色并在未确认时闪烁；静音只关蜂鸣，不等于确认。
function AlarmBanner({
  alarms,
  muted: mutedProp,
  onAcknowledge,
  onMute,
  onOpen,
  openLabel = "告警中心",
  emptyLabel = "无激活告警",
  className,
}: {
  alarms: AlarmItem[]
  muted?: boolean
  onAcknowledge?: (alarm: AlarmItem) => void
  onMute?: (muted: boolean) => void
  onOpen?: (alarm: AlarmItem | null) => void
  openLabel?: string
  emptyLabel?: string
  className?: string
}) {
  const [muted, setMuted] = React.useState(!!mutedProp)
  const active = alarms.filter((a) => activeStates.includes(a.state ?? "unack-active"))
  const top = pickTop(active)
  const topState = top?.state ?? "unack-active"
  const unacked = active.filter((a) => (a.state ?? "unack-active").startsWith("unack")).length
  const counts = ([1, 2, 3, 4] as AlarmPriority[]).map((n) => [n, active.filter((a) => toPriority(a.priority) === n).length] as const)
  return (
    <div
      role="region"
      aria-label="告警横幅"
      className={cn(
        "flex min-h-12 flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-border bg-card px-4 py-2 text-card-foreground",
        top && unacked > 0 && borderColor[toPriority(top.priority)],
        className,
      )}
    >
      <div aria-live="polite" className="flex min-w-0 flex-[1_1_240px] items-center gap-3">
        {top ? (
          <>
            <AlarmMark priority={top.priority} blink={topState === "unack-active"} variant={topState === "unack-rtn" ? "outline" : "solid"} />
            <div className="grid min-w-0">
              <strong className="truncate text-sm leading-5 font-semibold">{top.message}</strong>
              <span className="truncate font-mono text-xs text-muted-foreground">{[top.source, top.time, alarmStates[topState]?.label].filter(Boolean).join(" · ")}</span>
            </div>
          </>
        ) : (
          <>
            <Bell aria-hidden="true" className="size-[18px] text-[var(--icon-muted)]" strokeWidth={1.5} />
            <strong className="text-sm font-medium text-muted-foreground">{emptyLabel}</strong>
          </>
        )}
      </div>
      <ul aria-label="按优先级计数" className="m-0 flex list-none items-center gap-3 p-0">
        {counts.filter(([, c]) => c > 0).map(([n, c]) => (
          <li key={n}><AlarmMark priority={n} size="sm" count={c} /></li>
        ))}
        {active.length ? <li className="text-xs whitespace-nowrap text-muted-foreground">未确认 {unacked}</li> : null}
      </ul>
      <div className="ml-auto flex items-center gap-1">
        {top && onAcknowledge && (topState === "unack-active" || topState === "unack-rtn") ? (
          <Button variant="outline" size="sm" onClick={() => onAcknowledge(top)}>确认</Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={muted}
          aria-label={muted ? "取消静音" : "静音蜂鸣"}
          title={muted ? "蜂鸣已静音（告警仍需确认）" : "静音蜂鸣"}
          className={cn(muted && "text-muted-foreground")}
          onClick={() => { setMuted(!muted); onMute?.(!muted) }}
        >
          {muted ? <VolumeX className="size-4" strokeWidth={1.5} /> : <Volume2 className="size-4" strokeWidth={1.5} />}
        </Button>
        {onOpen ? (
          <Button variant="ghost" size="sm" onClick={() => onOpen(top ?? null)}>
            <ArrowRight className="size-4" strokeWidth={1.5} />
            {openLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export { AlarmBanner, type AlarmItem }
