import { cn } from "@/lib/utils"

type EquipmentState = "running" | "idle" | "stopped" | "fault" | "maintenance" | "offline"

const equipmentText: Record<EquipmentState, string> = {
  running: "运行",
  idle: "待机",
  stopped: "计划停机",
  fault: "故障停机",
  maintenance: "维护",
  offline: "离线",
}

// ISA-101：运行态靠明暗与形状区分，运行 / 停止不用红绿；只有故障取告警红（status-fault = alarm-p1）。
// 故障用叉形，不用菱形：菱形是 P1 告警的形状，资产树里设备故障与 P1 告警会并排出现；
// 也不用八角形：10px 的八角形看起来像圆，红绿色弱时与「运行」的实心圆分不开。
const shape: Record<EquipmentState, string> = {
  running: "size-2.5 rounded-full bg-[var(--status-running)]",
  idle: "size-2.5 rounded-full shadow-[inset_0_0_0_2.5px_var(--status-idle)]",
  stopped: "size-[9px] rounded-[1px] bg-[var(--status-stopped)]",
  fault: "size-2.5 bg-[var(--status-fault)] [clip-path:polygon(20%_0,50%_30%,80%_0,100%_20%,70%_50%,100%_80%,80%_100%,50%_70%,20%_100%,0_80%,30%_50%,0_20%)]",
  maintenance: "size-[9px] rounded-[1px] shadow-[inset_0_0_0_1.5px_var(--status-maintenance)]",
  offline: "size-2.5 rounded-full border-[1.5px] border-dashed border-[var(--status-offline)]",
}

// 设备运行态：与 StatusDot 同结构（图形 + 文字 + mono 次要信息），必须带文字。
function EquipmentStatus({
  state,
  label,
  meta,
  hideLabel,
  className,
}: {
  state: EquipmentState
  label?: string
  meta?: string
  /** 空间紧张时只露图形，文字留给读屏器。 */
  hideLabel?: boolean
  className?: string
}) {
  const s = equipmentText[state] ? state : "offline"
  return (
    <span data-state={s} className={cn("inline-flex items-center gap-2 text-[13px] leading-5 whitespace-nowrap text-foreground", className)}>
      <span aria-hidden="true" className={cn("relative shrink-0", shape[s])} />
      <span className={cn(hideLabel && "sr-only", s === "fault" && "font-semibold", (s === "offline" || s === "stopped") && "text-muted-foreground")}>
        {label ?? equipmentText[s]}
      </span>
      {meta ? <span className="font-mono text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
    </span>
  )
}

export { EquipmentStatus, equipmentText, type EquipmentState }
