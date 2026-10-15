"use client"

import * as React from "react"
import { Info, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusDot } from "@/components/ui/status-dot"

type IssueSeverity = "info" | "warning" | "high"
type IssueStatus = "open" | "accepted" | "ignored"

const severityMap: Record<IssueSeverity, { icon: LucideIcon; label: string }> = {
  info: { icon: Info, label: "提示" },
  warning: { icon: TriangleAlert, label: "警告" },
  high: { icon: OctagonAlert, label: "高风险" },
}

// 数据质量问题：采纳 / 忽略 / 撤销；高风险只描边与图标用 destructive，不用彩色左边条。
function IssueItem({
  title,
  severity: severityProp = "warning",
  description,
  columns,
  suggestion,
  status: statusProp,
  defaultStatus = "open",
  acceptLabel = "采纳建议",
  locked,
  onChange,
  className,
}: {
  title: string
  severity?: IssueSeverity
  description?: string
  columns?: string[]
  suggestion?: string
  /** 受控状态；不传则用 defaultStatus 自管。 */
  status?: IssueStatus
  defaultStatus?: IssueStatus
  acceptLabel?: string
  /** 设置后操作区改为显示该原因（LimiX unselectable_reason）。 */
  locked?: string
  onChange?: (status: IssueStatus) => void
  className?: string
}) {
  const severity: IssueSeverity = severityProp in severityMap ? severityProp : "warning"
  const [inner, setInner] = React.useState<IssueStatus>(defaultStatus)
  const status = statusProp ?? inner
  const set = (next: IssueStatus) => {
    if (statusProp === undefined) setInner(next)
    onChange?.(next)
  }
  const sev = severityMap[severity]
  const Icon = sev.icon
  const high = severity === "high"
  const ignored = status === "ignored"
  return (
    <div
      role="group"
      aria-label={`${sev.label}：${title}`}
      data-severity={severity}
      data-status={status}
      className={cn(
        "grid grid-cols-[20px_minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-md border border-border bg-background px-4 py-3 text-[13px] leading-5",
        high && "border-destructive",
        className,
      )}
    >
      <Icon className={cn("mt-px size-[18px] text-[var(--icon-default)]", high && "text-destructive", ignored && "opacity-[.55]")} strokeWidth={1.5} aria-hidden="true" />
      <div className={cn("grid min-w-0 gap-1", ignored && "opacity-[.55]")}>
        <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
          {title}
          <span className={cn("text-xs font-medium text-muted-foreground", high && "text-destructive")}>{sev.label}</span>
        </p>
        {description ? <p className="m-0 text-muted-foreground">{description}</p> : null}
        {columns?.length ? (
          <div aria-label="涉及列" className="flex flex-wrap gap-1">
            {columns.slice(0, 5).map((c) => (
              <code key={c} className="rounded-sm bg-muted px-1.5 font-mono text-xs leading-5">{c}</code>
            ))}
            {columns.length > 5 ? <span className="text-muted-foreground">等 {columns.length} 列</span> : null}
          </div>
        ) : null}
        {suggestion ? <p className="m-0 text-foreground">建议：{suggestion}</p> : null}
      </div>
      <div className="flex items-start gap-1">
        {locked ? (
          <span className="text-muted-foreground">{locked}</span>
        ) : status === "open" ? (
          <>
            <Button variant="outline" size="sm" onClick={() => set("accepted")}>{acceptLabel}</Button>
            <Button variant="ghost" size="sm" onClick={() => set("ignored")}>忽略</Button>
          </>
        ) : (
          <>
            <StatusDot tone={status === "accepted" ? "success" : "neutral"} label={status === "accepted" ? "已采纳" : "已忽略"} />
            <Button variant="ghost" size="sm" onClick={() => set("open")}>撤销</Button>
          </>
        )}
      </div>
    </div>
  )
}

export { IssueItem, type IssueSeverity, type IssueStatus }
