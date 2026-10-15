import { cn } from "@/lib/utils"

type AlarmPriority = 1 | 2 | 3 | 4

const alarmText: Record<AlarmPriority, string> = { 1: "紧急", 2: "高", 3: "中", 4: "低" }

// 告警专用色：只画告警，不得复用于按钮、装饰或图表系列。P4 为中性，靠空心圆与编号区分。
// edge：形状描边；P2 浅色主题亮黄填充靠 --alarm-p2-edge 识别。
const alarmColor: Record<AlarmPriority, { fill: string; fg: string; edge?: string }> = {
  1: { fill: "var(--alarm-p1)", fg: "var(--alarm-p1-foreground)" },
  2: { fill: "var(--alarm-p2)", fg: "var(--alarm-p2-foreground)", edge: "var(--alarm-p2-edge)" },
  3: { fill: "var(--alarm-p3)", fg: "var(--alarm-p3-foreground)" },
  4: { fill: "var(--alarm-p4)", fg: "var(--alarm-p4)" },
}

const toPriority = (v: AlarmPriority | string): AlarmPriority => {
  const n = typeof v === "string" ? parseInt(v.replace(/^p/i, ""), 10) : v
  return n >= 1 && n <= 4 ? (Math.round(n) as AlarmPriority) : 4
}

// 20 × 20 图形：P1 菱形、P2 三角形、P3 方形、P4 空心圆。
function AlarmShape({ priority, stroke, fill, dashed }: { priority: AlarmPriority; stroke: string; fill: string; dashed?: boolean }) {
  const common = { fill, stroke, strokeWidth: 1.5, strokeLinejoin: "round" as const, strokeDasharray: dashed ? "2 2" : undefined, className: "sa-alarm-shape" }
  if (priority === 1) return <path d="M10 1.4 18.6 10 10 18.6 1.4 10Z" {...common} />
  if (priority === 2) return <path d="M10 1.6 18.9 17.8H1.1Z" {...common} />
  if (priority === 3) return <rect x={2.4} y={2.4} width={15.2} height={15.2} rx={1.5} {...common} />
  return <circle cx={10} cy={10} r={8.2} {...common} />
}

// 告警优先级标记：颜色 + 形状 + 编号三重编码。blink 只给「未确认激活」，需要主题文件里的 .sa-motion-blink。
function AlarmMark({
  priority: priorityProp,
  variant = "solid",
  size = "default",
  blink,
  showLabel,
  count,
  className,
}: {
  priority: AlarmPriority | string
  variant?: "solid" | "outline" | "muted"
  size?: "sm" | "default" | "lg"
  blink?: boolean
  showLabel?: boolean
  count?: number
  className?: string
}) {
  const priority = toPriority(priorityProp)
  const color = alarmColor[priority]
  const muted = variant === "muted"
  const hollow = priority === 4 || variant === "outline" || muted
  const stroke = muted ? "var(--muted-foreground)" : color.edge ?? color.fill
  const num = muted ? "var(--muted-foreground)" : variant === "outline" ? "var(--foreground)" : color.fg
  const name = `P${priority} ${alarmText[priority]}告警${blink ? "，未确认" : ""}${count != null ? `，共 ${count} 条` : ""}`
  const px = size === "sm" ? 16 : size === "lg" ? 24 : 20
  return (
    <span title={name} className={cn("inline-flex items-center gap-1 align-middle text-xs leading-4 whitespace-nowrap text-foreground", className)}>
      <svg
        viewBox="0 0 20 20"
        width={px}
        height={px}
        focusable="false"
        role={showLabel ? undefined : "img"}
        aria-label={showLabel ? undefined : name}
        aria-hidden={showLabel ? true : undefined}
        className={cn("shrink-0 overflow-visible", blink && "sa-motion-blink")}
      >
        <AlarmShape priority={priority} stroke={stroke} fill={hollow ? "none" : color.fill} dashed={muted} />
        <text x={10} y={priority === 2 ? 12.6 : 10.4} textAnchor="middle" dominantBaseline="central" fill={num} className="font-mono text-[11px] font-bold">
          {priority}
        </text>
      </svg>
      {showLabel ? <span className="font-medium">P{priority} {alarmText[priority]}{blink ? <span className="sr-only">，未确认</span> : null}</span> : null}
      {count != null ? <span aria-hidden={showLabel ? undefined : true} className="font-mono tabular-nums">{count}</span> : null}
    </span>
  )
}

export { AlarmMark, alarmText, toPriority, type AlarmPriority }
