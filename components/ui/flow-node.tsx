"use client"

import * as React from "react"
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { taskStatus } from "@/components/ui/task-status"
import { VersionChip, type VersionKind } from "@/components/ui/version-chip"

type FlowNodeData = {
  /** 步骤类型：数据接入、数据治理、预测任务、评估报告、扩展任务… */
  kind?: string
  icon?: React.ReactNode
  title: string
  /** LimiX 原始状态值（见 TaskStatus），或前端推断的 pending（未开始）/ skipped（已跳过）。 */
  status?: string
  statusMeta?: string
  queueAhead?: number
  /** 接口，如 POST /v1/inference/regression/tasks。 */
  endpoint?: string
  meta?: { label: string; value: string }[]
  /** 0–100；没有可靠进度时不传。 */
  progress?: number
  version?: { id: string; kind?: VersionKind }
}
type FlowNodeType = Node<
  FlowNodeData & { onSelect?: (id: string) => void; selectedId?: string | null; handles?: { in?: boolean; out?: boolean } },
  "flow"
>

// 质感靠层次而不是颜色：细边框 + 轻阴影，悬停抬一级；状态只改外框、图标块与一圈淡光晕，不给卡片铺底色。
const toneFrame: Record<string, string> = {
  active: "border-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent),var(--shadow-node)]",
  error: "border-destructive shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_12%,transparent),var(--shadow-node)]",
  neutral: "border-dashed border-muted-foreground shadow-none",
  success: "",
  warning: "",
}
const toneSelected: Record<string, string> = {
  active: "shadow-[0_0_0_1px_var(--primary),0_0_0_4px_color-mix(in_srgb,var(--primary)_14%,transparent),var(--shadow-md)]",
  error: "shadow-[0_0_0_1px_var(--destructive),0_0_0_4px_color-mix(in_srgb,var(--destructive)_12%,transparent),var(--shadow-md)]",
  neutral: "border-foreground shadow-[var(--shadow-md)]",
  success: "border-foreground shadow-[0_0_0_1px_var(--foreground),var(--shadow-md)]",
  warning: "border-foreground shadow-[0_0_0_1px_var(--foreground),var(--shadow-md)]",
}
// 图标块：默认 muted 底；运行中主色、失败 destructive、未开始等为描边空心
const toneIcon: Record<string, string> = {
  active: "bg-primary text-primary-foreground",
  error: "bg-destructive text-destructive-foreground",
  neutral: "bg-transparent text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]",
  success: "bg-muted text-foreground",
  warning: "bg-muted text-foreground",
}

// 节点状态图形（16×16）：比 StatusDot 多一层形状区分，颜色只用 success / muted-foreground / primary / destructive。
// 已完成绿色实心对勾、已复用绿色空心对勾、运行中主色转圈、排队钟面、未开始虚线圈、已跳过横线、已取消斜线、失败实心叉、超时实心钟面、部分成功空心叹号。
const markOf: Record<string, string> = {
  finished: "done", succeeded: "done", reused: "reused", running: "running", cancelling: "running",
  queued: "queued", created: "queued", accepted: "queued", pending: "pending", skipped: "skipped",
  cancelled: "cancelled", failed: "failed", timeout: "timeout", partially_succeeded: "warning", degraded_succeeded: "warning",
}
const ring = "fill-none stroke-[1.4]"
const line = "fill-none stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]"
function FlowStatusMark({ status }: { status?: string }) {
  const kind = markOf[status ?? ""] ?? "pending"
  const check = "M5.2 8.3l1.9 1.9 3.8-4"
  const clock = "M8 5v3.2l2 1.2"
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0 overflow-visible">
      {kind === "done" ? <><circle cx="8" cy="8" r="6.5" className="fill-[var(--success)]" /><path d={check} className={cn(line, "stroke-[var(--success-foreground)]")} /></> : null}
      {kind === "reused" ? <><circle cx="8" cy="8" r="6" className={cn(ring, "stroke-[var(--success)]")} /><path d={check} className={cn(line, "stroke-[var(--success)]")} /></> : null}
      {kind === "running" ? (
        <>
          <circle cx="8" cy="8" r="6" className="fill-none stroke-border stroke-[1.8]" />
          <path d="M8 2a6 6 0 0 1 6 6" className="origin-center fill-none stroke-primary stroke-[1.8] [stroke-linecap:round] motion-safe:animate-spin" />
        </>
      ) : null}
      {kind === "queued" ? <><circle cx="8" cy="8" r="6" className={cn(ring, "stroke-muted-foreground")} /><path d={clock} className={cn(line, "stroke-muted-foreground stroke-[1.4]")} /></> : null}
      {kind === "pending" ? <circle cx="8" cy="8" r="6" strokeDasharray="2.4 2.2" className={cn(ring, "stroke-muted-foreground")} /> : null}
      {kind === "skipped" ? <><circle cx="8" cy="8" r="6" className={cn(ring, "stroke-muted-foreground")} /><path d="M5.3 8h5.4" className={cn(line, "stroke-muted-foreground stroke-[1.4]")} /></> : null}
      {kind === "cancelled" ? <><circle cx="8" cy="8" r="6" className={cn(ring, "stroke-muted-foreground")} /><path d="M4 12 12 4" className={cn(line, "stroke-muted-foreground stroke-[1.4]")} /></> : null}
      {kind === "failed" ? <><circle cx="8" cy="8" r="6.5" className="fill-destructive" /><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" className={cn(line, "stroke-destructive-foreground")} /></> : null}
      {kind === "timeout" ? <><circle cx="8" cy="8" r="6.5" className="fill-destructive" /><path d="M8 4.8v3.4l2 1.2" className={cn(line, "stroke-destructive-foreground")} /></> : null}
      {kind === "warning" ? (
        <>
          <circle cx="8" cy="8" r="6" className={cn(ring, "stroke-destructive")} />
          <path d="M8 4.8v3.6" className={cn(line, "stroke-destructive")} />
          <circle cx="8" cy="10.9" r="0.9" className="fill-destructive" />
        </>
      ) : null}
    </svg>
  )
}

// 节点头部的状态：图形 + 中文名（沿用 TaskStatus 的映射）+ 耗时或排队数
function FlowStatus({ status, meta, queueAhead }: { status: string; meta?: string; queueAhead?: number }) {
  const s = taskStatus[status] ?? { tone: "neutral", label: status || "未知" }
  const note = meta ?? (status === "queued" && queueAhead != null ? `前方约 ${queueAhead} 个` : undefined)
  return (
    <span
      data-status={status}
      title={status}
      className={cn(
        "inline-flex items-center gap-[5px] text-xs leading-4 whitespace-nowrap",
        s.tone === "neutral" ? "text-muted-foreground" : s.tone === "error" || s.tone === "warning" ? "text-destructive" : "text-foreground",
      )}
    >
      <FlowStatusMark status={status} />
      {s.label}
      {note ? <span className="font-mono text-muted-foreground tabular-nums">{note}</span> : null}
    </span>
  )
}

// 接口路径只在「/」后断行，不把单词拆开
function Endpoint({ value }: { value: string }) {
  return (
    <code className="font-mono text-[11px] leading-4 text-muted-foreground in-data-[detail=compact]:hidden">
      {value.split("/").map((part, i) => (
        <React.Fragment key={i}>
          {i ? <>/<wbr /></> : null}
          {part}
        </React.Fragment>
      ))}
    </code>
  )
}

// 流程节点卡片：类型 + 状态、标题、接口、两三行关键值、产出版本。可单独使用；放进 Canvas 时由 FlowNodeHandles 包上连接点。
function FlowNode({
  id,
  kind,
  icon,
  title,
  status,
  statusMeta,
  queueAhead,
  endpoint,
  meta,
  progress,
  version,
  selected,
  onSelect,
  className,
}: FlowNodeData & { id?: string; selected?: boolean; onSelect?: (id: string) => void; className?: string }) {
  const tone = (status && taskStatus[status]?.tone) || "neutral"
  const select = () => id && onSelect?.(id)
  return (
    <div
      data-status={status}
      data-selected={selected ? "" : undefined}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button, a")) select()
      }}
      className={cn(
        "relative grid w-[220px] rounded-md border border-border bg-card text-card-foreground shadow-[var(--shadow-node)] transition-shadow duration-[var(--duration-fast)]",
        // 已跳过 / 已取消：卡面退成画布底色，与「未开始」的白底虚线卡区分
        (status === "skipped" || status === "cancelled") && "bg-[var(--canvas)]",
        onSelect && "hover:shadow-[var(--shadow-md)]",
        toneFrame[tone],
        // 选中：不另加外圈，只把自身描边加粗并抬起阴影；描边颜色仍跟状态走，始终只有一圈
        selected && toneSelected[tone],
        className,
      )}
    >
      {/* 三段：头部（图标块 + 类型 + 状态）、主体（标题、接口、关键值内衬面板）、底部（产出版本） */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 pt-2.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
          {icon ? <span aria-hidden="true" className={cn("inline-grid size-[22px] shrink-0 place-items-center rounded-sm [&_svg]:size-3.5", toneIcon[tone])}>{icon}</span> : null}
          {kind}
        </span>
        {status ? <FlowStatus status={status} meta={statusMeta} queueAhead={queueAhead} /> : null}
      </div>
      <div className="grid min-w-0 gap-0.5 px-3 pt-2 pb-3">
        {onSelect ? (
          <button
            type="button"
            aria-pressed={!!selected}
            onClick={select}
            className={cn(
              "text-left text-sm leading-5 font-semibold tracking-[-0.01em] in-data-[detail=compact]:text-[17px] in-data-[detail=compact]:leading-6 focus-visible:rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              tone === "neutral" ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {title}
          </button>
        ) : (
          <strong className={cn("text-sm leading-5 font-semibold tracking-[-0.01em]", tone === "neutral" ? "text-muted-foreground" : "text-foreground")}>{title}</strong>
        )}
        {endpoint ? <Endpoint value={endpoint} /> : null}
        {meta?.length ? (
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] in-data-[detail=compact]:hidden gap-x-3 gap-y-0.5 rounded-sm bg-muted px-2 py-1.5 text-xs leading-[18px]">
            {meta.map((m) => (
              <React.Fragment key={m.label}>
                <dt className="text-muted-foreground">{m.label}</dt>
                <dd className="m-0 text-right font-mono tabular-nums [overflow-wrap:anywhere]">{m.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        ) : null}
        {progress != null ? <Progress value={progress} aria-label={`${title} 进度`} className="mt-2 in-data-[detail=compact]:hidden *:data-[slot=progress-track]:h-1" /> : null}
      </div>
      {version ? (
        // nodrag：从版本号上按下不开始拖动，方便复制
        <div className={cn("nodrag min-w-0 cursor-default border-t border-border px-3 py-2 in-data-[detail=compact]:hidden", tone === "neutral" && "border-dashed")}>
          <VersionChip id={version.id} kind={version.kind} className="max-w-full" />
        </div>
      ) : null}
    </div>
  )
}

const handle = "!size-2 !min-h-0 !min-w-0 !rounded-full !border-[1.5px] !border-muted-foreground !bg-card"

// React Flow 节点类型：卡片 + 连接点（左入右出，竖排为上入下出；只表示方向，不可拖拽连线）。
function FlowNodeHandles({ id, data, targetPosition = Position.Left, sourcePosition = Position.Right }: NodeProps<FlowNodeType>) {
  const { onSelect, selectedId, handles, ...card } = data
  return (
    <>
      {handles?.in !== false ? <Handle type="target" position={targetPosition} isConnectable={false} className={handle} /> : null}
      <FlowNode id={id} {...card} selected={selectedId === id} onSelect={onSelect} />
      {handles?.out !== false ? <Handle type="source" position={sourcePosition} isConnectable={false} className={handle} /> : null}
    </>
  )
}

const flowNodeTypes = { flow: FlowNodeHandles }

export { FlowNode, FlowNodeHandles, flowNodeTypes, type FlowNodeData, type FlowNodeType }
