"use client"

import type * as React from "react"
import { BaseEdge, EdgeLabelRenderer, getBezierPath, Position, type Edge, type EdgeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"


type FlowEdgeState = "idle" | "done" | "active" | "error"
type FlowEdgeData = { label?: string; state?: FlowEdgeState; /** Canvas 的 auto 标签模式下由画布决定；单独使用时默认显示。 */ showLabel?: boolean }
type FlowEdgeType = Edge<FlowEdgeData, "flow">

// 线型写成内联样式：React Flow 的 .react-flow__edge-path 不在 Tailwind 的层里，优先级高于工具类，会把颜色盖回默认灰。
const stroke: Record<FlowEdgeState, React.CSSProperties> = {
  idle: { stroke: "var(--muted-foreground)", strokeWidth: 1.5, strokeDasharray: "4 4" },
  done: { stroke: "var(--muted-foreground)", strokeWidth: 1.5 },
  active: { stroke: "var(--primary)", strokeWidth: 2 },
  error: { stroke: "var(--destructive)", strokeWidth: 1.5, strokeDasharray: "4 4" },
}
const fill: Record<FlowEdgeState, string> = { idle: "fill-muted-foreground", done: "fill-muted-foreground", active: "fill-primary", error: "fill-destructive" }

// 流程连线：贝塞尔曲线 + 终点箭头 + 中点标签。idle 未流经（虚线）、done 已流经（实线）、active 正在流经（主色 + 流向点）、error 下游失败（destructive 虚线）。
function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<FlowEdgeType>) {
  const state = data?.state ?? "idle"
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  // 箭头尖落在终点，沿终点切线（左入 → 向右，上入 → 向下）
  const arrow = targetPosition === Position.Top ? `M${targetX},${targetY} l-4,-7 l8,0 z` : `M${targetX},${targetY} l-7,-4 l0,8 z`
  return (
    <>
      <BaseEdge id={id} path={path} style={stroke[state]} />
      <path d={arrow} className={fill[state]} />
      {state === "active"
        ? [0, 1].map((i) => (
            // 流向点：减少动态效果时隐藏，只靠箭头表达方向
            <circle key={i} r={3} className="fill-primary motion-reduce:hidden">
              <animateMotion dur="4.4s" repeatCount="indefinite" begin={`${-i * 2.2}s`} path={path} />
            </circle>
          ))
        : null}
      {data?.label ? (
        <EdgeLabelRenderer>
          <span
            className={cn(
              "nodrag nopan pointer-events-none absolute rounded-sm bg-[var(--canvas)] px-1 font-mono text-[11px] leading-4 text-muted-foreground transition-opacity duration-[var(--duration-fast)]",
              data.showLabel === false && "opacity-0",
            )}
            style={{ transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 4}px)` }}
          >
            {data.label}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

const flowEdgeTypes = { flow: FlowEdge }

export { FlowEdge, flowEdgeTypes, type FlowEdgeData, type FlowEdgeState, type FlowEdgeType }
