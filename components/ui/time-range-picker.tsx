"use client"

import * as React from "react"
import { ChevronDown, Clock, Pause, Play, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type TimeUnit = "minute" | "hour" | "day"
type TimeRange =
  | { type: "relative"; amount: number; unit: TimeUnit }
  | { type: "absolute"; start: string; end: string }
type RefreshState = { interval: number; paused?: boolean }

const unitLabel: Record<TimeUnit, string> = { minute: "分钟", hour: "小时", day: "天" }
const defaultPresets: Array<{ amount: number; unit: TimeUnit }> = [
  { amount: 15, unit: "minute" }, { amount: 1, unit: "hour" }, { amount: 6, unit: "hour" },
  { amount: 24, unit: "hour" }, { amount: 7, unit: "day" }, { amount: 30, unit: "day" },
]
const rangeLabel = (r: TimeRange) =>
  r.type === "absolute" ? `${r.start.replace("T", " ")} – ${r.end.replace("T", " ")}` : `最近 ${r.amount} ${unitLabel[r.unit]}`
const intervalLabel = (s: number) => (s >= 60 ? `${s / 60} 分钟` : `${s} 秒`)

const field = "h-[var(--control-height-sm)] min-w-0 rounded-sm border border-input bg-background px-2 text-[13px] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
const smallButton = "inline-flex h-[var(--control-height-sm)] items-center justify-center gap-2 rounded-sm border border-input bg-background px-3 text-[13px] font-medium hover:bg-accent"

// 页面级时间范围：预设、相对与绝对区间，外加自动刷新。组件维护计时器并调用 onRefresh。
function TimeRangePicker({
  value,
  onValueChange,
  presets = defaultPresets,
  refresh: refreshProp = { interval: 0 },
  refreshOptions = [0, 10, 30, 60, 300],
  showRefresh = true,
  onRefresh,
  onRefreshChange,
  align = "start",
  className,
}: {
  value: TimeRange
  onValueChange?: (value: TimeRange) => void
  presets?: Array<{ amount: number; unit: TimeUnit }>
  refresh?: RefreshState
  refreshOptions?: number[]
  showRefresh?: boolean
  onRefresh?: () => void
  onRefreshChange?: (state: RefreshState) => void
  align?: "start" | "end"
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [refresh, setRefreshState] = React.useState<RefreshState>(refreshProp)
  const [amount, setAmount] = React.useState("3")
  const [unit, setUnit] = React.useState<TimeUnit>("hour")
  const [start, setStart] = React.useState(value.type === "absolute" ? value.start : "")
  const [end, setEnd] = React.useState(value.type === "absolute" ? value.end : "")
  const [absError, setAbsError] = React.useState(false)
  const tick = React.useRef(onRefresh)
  tick.current = onRefresh

  React.useEffect(() => {
    if (!refresh.interval || refresh.paused) return
    const timer = setInterval(() => tick.current?.(), refresh.interval * 1000)
    return () => clearInterval(timer)
  }, [refresh.interval, refresh.paused])

  const setRefresh = (next: RefreshState) => { setRefreshState(next); onRefreshChange?.(next) }
  const apply = (r: TimeRange) => { onValueChange?.(r); setOpen(false) }

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={smallButton}>
          <Clock className="size-4" strokeWidth={1.5} aria-hidden="true" />
          <span className="tabular-nums">{rangeLabel(value)}</span>
          <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align={align} sideOffset={8} className="w-[340px] max-w-[calc(100vw-2rem)] gap-0 p-0 text-[13px] leading-5">
          <PopoverTitle className="sr-only">时间范围</PopoverTitle>
          <section className="grid gap-2 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">常用</p>
            <div className="grid grid-cols-2 gap-0.5">
              {presets.map((p) => {
                const on = value.type === "relative" && value.amount === p.amount && value.unit === p.unit
                return (
                  <button key={`${p.amount}${p.unit}`} type="button" role="menuitemradio" aria-checked={on} className={cn("rounded-sm px-3 py-2 text-left text-[13px] hover:bg-accent", on && "bg-accent font-medium text-accent-foreground")} onClick={() => apply({ type: "relative", ...p })}>
                    {rangeLabel({ type: "relative", ...p })}
                  </button>
                )
              })}
            </div>
          </section>
          <section className="grid gap-2 border-t border-border px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">相对时间</p>
            <div className="flex items-center gap-2 text-[13px]">
              最近
              <input type="number" min={1} aria-label="数量" value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(field, "w-[72px] font-mono")} />
              <select aria-label="单位" value={unit} onChange={(e) => setUnit(e.target.value as TimeUnit)} className={cn(field, "flex-1")}>
                {Object.entries(unitLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <button type="button" className={smallButton} onClick={() => { const n = Math.round(Number(amount)); if (n >= 1) apply({ type: "relative", amount: n, unit }) }}>应用</button>
            </div>
          </section>
          <section className="grid gap-2 border-t border-border px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">绝对时间</p>
            <input type="datetime-local" aria-label="开始时间" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
            <div className="flex gap-2">
              <input type="datetime-local" aria-label="结束时间" value={end} onChange={(e) => setEnd(e.target.value)} className={cn(field, "flex-1")} />
              <button type="button" className={smallButton} onClick={() => { if (!start || !end || end <= start) return setAbsError(true); setAbsError(false); apply({ type: "absolute", start, end }) }}>应用</button>
            </div>
            {absError ? <p className="text-[13px] text-destructive">结束时间需晚于开始时间</p> : null}
          </section>
          {showRefresh ? (
            <section className="grid gap-2 border-t border-border px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">自动刷新</p>
              <ToggleGroup variant="segmented" size="sm" aria-label="自动刷新间隔" value={[String(refresh.interval)]} onValueChange={(v) => v[0] && setRefresh({ interval: Number(v[0]), paused: false })}>
                {refreshOptions.map((s) => <ToggleGroupItem key={s} value={String(s)}>{s ? intervalLabel(s) : "关闭"}</ToggleGroupItem>)}
              </ToggleGroup>
            </section>
          ) : null}
        </PopoverContent>
      </Popover>
      {showRefresh ? (
        <>
          <button type="button" aria-label="立即刷新" className={cn(smallButton, "w-8 px-0")} onClick={() => onRefresh?.()}>
            <RefreshCw className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
          {refresh.interval ? (
            <>
              <button type="button" aria-label={refresh.paused ? "继续自动刷新" : "暂停自动刷新"} className="inline-flex size-8 items-center justify-center rounded-sm hover:bg-accent" onClick={() => setRefresh({ ...refresh, paused: !refresh.paused })}>
                {refresh.paused ? <Play className="size-4" strokeWidth={1.5} aria-hidden="true" /> : <Pause className="size-4" strokeWidth={1.5} aria-hidden="true" />}
              </button>
              <span aria-live="polite" className="font-mono text-xs text-muted-foreground tabular-nums">
                {refresh.paused ? "自动刷新已暂停" : `每 ${intervalLabel(refresh.interval)}刷新`}
              </span>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export { TimeRangePicker, type TimeRange, type RefreshState }
