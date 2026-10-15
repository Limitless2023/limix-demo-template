import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

type StepStatus = "done" | "current" | "pending" | "error"
type StepItem = { label: string; description?: string; status?: StepStatus }

const statusText: Record<StepStatus, string> = { done: "已完成", current: "进行中", pending: "未开始", error: "出错" }

function Steps({
  items,
  current = -1,
  orientation = "horizontal",
  className,
  "aria-label": ariaLabel = "步骤",
}: {
  items: StepItem[]
  current?: number
  orientation?: "horizontal" | "vertical"
  className?: string
  "aria-label"?: string
}) {
  const vertical = orientation === "vertical"
  return (
    <ol aria-label={ariaLabel} className={cn("m-0 flex list-none p-0 text-[13px] leading-5", vertical ? "flex-col" : "gap-2", className)}>
      {items.map((item, i) => {
        const status = item.status ?? (i < current ? "done" : i === current ? "current" : "pending")
        const last = i === items.length - 1
        return (
          <li key={i} aria-current={status === "current" ? "step" : undefined} className={cn("grid min-w-0 flex-1", vertical ? "grid-cols-[24px_1fr] gap-x-3" : "gap-2")}>
            <div className={cn("flex items-center gap-2", vertical && "flex-col self-stretch gap-1")}>
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border border-input bg-background font-mono text-xs text-muted-foreground",
                  status === "done" && "border-foreground bg-foreground text-background",
                  status === "current" && "border-2 border-primary font-semibold text-foreground",
                  status === "error" && "border-destructive bg-destructive text-destructive-foreground",
                )}
              >
                {status === "done" ? <Check className="size-3.5" strokeWidth={1.5} /> : status === "error" ? <X className="size-3.5" strokeWidth={1.5} /> : i + 1}
              </span>
              {!last ? <span aria-hidden="true" className={cn("bg-border", vertical ? "mb-1 min-h-4 w-px flex-1" : "h-px flex-1", status === "done" && "bg-foreground")} /> : null}
            </div>
            <div className={cn("grid min-w-0 gap-0.5", vertical ? "pt-0.5 pb-4 last:pb-0" : "pr-2")}>
              <span className={cn("font-medium text-muted-foreground", status === "done" && "text-foreground", status === "current" && "font-semibold text-foreground", status === "error" && "text-destructive")}>
                {item.label}
                <span className="sr-only">（{statusText[status]}）</span>
              </span>
              {item.description ? <span className="text-xs leading-[18px] text-muted-foreground">{item.description}</span> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { Steps, type StepItem, type StepStatus }
