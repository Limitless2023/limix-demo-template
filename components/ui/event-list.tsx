"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { StatusDot, type StatusTone } from "@/components/ui/status-dot"

type EventItem = {
  id?: string | number
  time: string
  datetime?: string
  title: string
  description?: string
  meta?: string
  tone?: StatusTone
}

const toneText: Record<StatusTone, string> = { neutral: "记录", active: "进行中", success: "完成", warning: "需关注", error: "异常" }

// 事件列表：时间 + 状态点 + 竖线时间轴，不用彩色左边条；传 onSelect 后每行可点选。
function EventList({
  items,
  onSelect,
  selected: selectedProp,
  defaultSelected,
  ariaLabel = "事件",
  className,
}: {
  items: EventItem[]
  onSelect?: (item: EventItem) => void
  /** 受控的选中行 id（无 id 时为序号）；不传则用 defaultSelected 自管。 */
  selected?: string | number
  defaultSelected?: string | number
  ariaLabel?: string
  className?: string
}) {
  const [inner, setInner] = React.useState(defaultSelected)
  const selected = selectedProp !== undefined ? selectedProp : inner
  return (
    <ol aria-label={ariaLabel} className={cn("m-0 list-none p-0 text-[13px] leading-5", className)}>
      {items.map((it, i) => {
        const tone = it.tone ?? "neutral"
        const key = it.id ?? i
        const content = (
          <>
            <span className={cn("font-medium text-foreground", tone === "error" && "text-destructive")}>{it.title}</span>
            {it.description ? <span className="text-muted-foreground">{it.description}</span> : null}
            {it.meta ? <span className="font-mono text-[11px] text-muted-foreground">{it.meta}</span> : null}
          </>
        )
        return (
          <li
            key={key}
            data-tone={tone}
            className="relative grid grid-cols-[72px_8px_minmax(0,1fr)] gap-x-3 pb-3 before:absolute before:top-4 before:bottom-0 before:left-[calc(72px+0.75rem+3.5px)] before:w-px before:bg-border before:content-[''] last:pb-0 last:before:hidden"
          >
            <time dateTime={it.datetime} className="text-right font-mono text-xs text-muted-foreground tabular-nums">{it.time}</time>
            {/* 状态点只留点，语气文字给读屏 */}
            <StatusDot tone={tone} label={toneText[tone]} className="mt-1.5 self-start gap-0 [&>span:nth-child(2)]:sr-only" />
            <div className="grid min-w-0 gap-0.5">
              {onSelect ? (
                <button
                  type="button"
                  aria-current={key === selected ? "true" : undefined}
                  className={cn(
                    "-mx-2 -my-0.5 grid w-full cursor-pointer gap-0.5 rounded-sm border-0 bg-transparent px-2 py-0.5 text-left text-inherit hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
                    key === selected && "bg-accent hover:bg-accent",
                  )}
                  onClick={() => {
                    if (selectedProp === undefined) setInner(key)
                    onSelect(it)
                  }}
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { EventList, type EventItem }
