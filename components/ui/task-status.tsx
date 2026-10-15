import { cn } from "@/lib/utils"
import { StatusDot, type StatusTone } from "@/components/ui/status-dot"

// LimiX 四类任务的状态值不统一，这里统一映射为五种语气与中文名。
const taskStatus: Record<string, { tone: StatusTone; label: string; pulse?: boolean }> = {
  created: { tone: "neutral", label: "已创建" },
  accepted: { tone: "neutral", label: "已受理" },
  queued: { tone: "neutral", label: "排队中" },
  running: { tone: "active", label: "运行中", pulse: true },
  cancelling: { tone: "active", label: "取消中" },
  finished: { tone: "success", label: "已完成" },
  succeeded: { tone: "success", label: "已完成" },
  reused: { tone: "success", label: "已复用" },
  partially_succeeded: { tone: "warning", label: "部分成功" },
  degraded_succeeded: { tone: "warning", label: "降级完成" },
  failed: { tone: "error", label: "失败" },
  timeout: { tone: "error", label: "超时" },
  cancelled: { tone: "neutral", label: "已取消" },
  // 画布与流程用：API 不返回，由前端按上下游推断
  pending: { tone: "neutral", label: "未开始" },
  skipped: { tone: "neutral", label: "已跳过" },
}

// 任务状态：原始状态值保留在 data-status 与 title 上，便于排查。
function TaskStatus({
  status,
  label,
  queueAhead,
  meta,
  className,
}: {
  status: string
  label?: string
  queueAhead?: number
  meta?: string
  className?: string
}) {
  const s = taskStatus[status] ?? { tone: "neutral" as StatusTone, label: status || "未知" }
  const note = meta ?? (status === "queued" && queueAhead != null ? `前方约 ${queueAhead} 个` : undefined)
  return (
    <span data-status={status} title={status} className={cn("inline-flex", className)}>
      <StatusDot tone={s.tone} label={label ?? s.label} pulse={s.pulse} meta={note} />
    </span>
  )
}

export { TaskStatus, taskStatus }
