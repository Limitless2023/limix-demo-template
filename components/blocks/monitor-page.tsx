"use client"

import * as React from "react"

import { AlarmMark, type AlarmPriority } from "@/components/ui/alarm-mark"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EChart, type ChartTokens } from "@/components/ui/echart"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Stat } from "@/components/ui/stat"
import { StatusDot, type StatusTone } from "@/components/ui/status-dot"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import limixMark from "@/lib/brand/limix-mark"
// 24px 显示：用小图，不把高清图打进包里
import logoMark from "@/lib/brand/logo-mark-sm"
import { cn } from "@/lib/utils"

// 「运行中描边」要让 --sa-sweep 角度可以动画，需注册为 <angle>。registry 主题不写 @property
// （shadcn 重装时会重复追加），在用到它的这里注册一次；重复注册会抛错，忽略即可。
if (typeof window !== "undefined" && typeof CSS !== "undefined" && "registerProperty" in CSS) {
  try {
    CSS.registerProperty({ name: "--sa-sweep", syntax: "<angle>", inherits: false, initialValue: "0deg" })
  } catch {
    // 已注册
  }
}

// 监控大屏：屏头 → 指标行 → 拓扑与运行行 → 趋势与告警行 → 可选图像底图（规则见页型「监控大屏」）。
// 全屏页，不放进 AppShell：组件自己占满视口，并且只用品牌黑。
// 主题：主题 CSS 的选择器是 [data-theme="orange-dark"] / [data-theme="blue-dark"]，可设在任意元素上，
// 所以直接写在根元素上，只影响本组件子树；主色跟随页面（html 为 blue-* 时用 blue-dark），其余一律 orange-dark。
// 四种大屏效果只在这里用、各对应状态或数据、同屏一处：
//   运行中描边 .sa-motion-sweep（正在推理的模型）· 数据流向（拓扑连线，点数与速度由流量换算）
//   强调光晕 --glow（本屏最重要的一个数）· 玻璃面板 --surface-glass + --blur-glass（只在打开图像底图后）

type Mode = "live" | "stale" | "loading"

// .sa-glow / .sa-glass 不在主题文件里，这里按 bundle.css 的同等写法直接消费主题变量。
const GLOW = "bg-[radial-gradient(120%_90%_at_0%_0%,var(--glow)_0%,transparent_62%)]"
const GLASS = "bg-[var(--surface-glass)] backdrop-blur-[var(--blur-glass)] backdrop-saturate-[1.2]"

// 示例数据，不代表真实产线读数。
const STATS: { label: string; value: string | number; unit?: string; delta?: string; note: string; hero?: boolean; alert?: boolean; alarmPriority?: 1 | 2 | 3 | 4 }[] = [
  { label: "当班产量", value: 1284, unit: "t", note: "计划 1,350 t · 完成 95.1%", hero: true },
  { label: "厚度预测 MAPE", value: "1.8", unit: "%", delta: "−1.3 pt", note: "较基线模型" },
  { label: "在线模型", value: 3, unit: "/ 4", note: "1 个推理中" },
  { label: "未处理告警", value: 2, note: "P2 高 1 · P3 中 1", alert: true, alarmPriority: 2 },
]

// 产线拓扑：节点 [x, y, 名称, 读数, 是否正在预测]；连线 [起, 止, 流量 t/h, 标签, 走向]。
const NODE_W = 110
const NODE_H = 46
const NODES: Record<string, [number, number, string, string, boolean?]> = {
  gas: [70, 40, "燃气", "1.8 万 m³/h"],
  fur: [70, 150, "加热炉", "1,180 °C"],
  r1: [220, 150, "粗轧 R1", "5 道次"],
  fm: [380, 150, "精轧 F1–F7", "预测中", true],
  cool: [540, 150, "层流冷却", "32 °C 水"],
  coil: [690, 150, "卷取机", "2 台"],
  qc: [540, 228, "质检", "板形 / 表面"],
}
// 流量 → rate：以 320 t/h 为满量程。
const FULL_SCALE = 320
const LINKS: [string, string, number, string?, ("v" | "b")?][] = [
  ["gas", "fur", 120, "燃气", "v"],
  ["fur", "r1", 312],
  ["r1", "fm", 306],
  ["fm", "cool", 301],
  ["cool", "coil", 298],
  ["fm", "qc", 40, "抽检 40", "b"],
]
const TOPOLOGY = LINKS.map(([from, to, flow, label, dir]) => {
  const [ax, ay] = NODES[from]
  const [bx, by] = NODES[to]
  const half = NODE_W / 2
  const d =
    dir === "v" ? `M${ax} ${ay + NODE_H / 2}V${by - NODE_H / 2}` : dir === "b" ? `M${ax} ${ay + NODE_H / 2}V${by}H${bx - half}` : `M${ax + half} ${ay}H${bx - half}`
  const x = dir === "v" ? ax + 10 : dir === "b" ? ax + 12 : (ax + bx) / 2
  const y = dir === "v" ? (ay + by) / 2 + 4 : dir === "b" ? by - 8 : ay - 10
  return { key: `${from}-${to}`, d, x, y, anchor: (dir ? "start" : "middle") as "start" | "middle", label: label ?? String(flow), rate: flow / FULL_SCALE }
})

const RUNS: { name: string; scope: string; tone: StatusTone; status: string; running?: boolean }[] = [
  { name: "轧制力预测", scope: "LimiX-TS v2 · 精轧 F1–F7", tone: "active", status: "推理中", running: true },
  { name: "板形缺陷分类", scope: "LimiX-Tab v1 · 质检", tone: "neutral", status: "空闲" },
  { name: "加热炉能耗预测", scope: "LimiX-TS v2 · 加热炉", tone: "success", status: "2 分钟前完成" },
]

// 近 60 分钟轧制力（13:02–14:01）：实测 chart-2 实线 vs LimiX 预测 foreground 虚线，第 38 分钟（13:40）F3 偏差。
// 监控与大屏不用品牌橙画预测线：橙色在监控画面里会被读成告警（2026-09-23 用户决定）。
const ACTUAL: number[] = []
const PREDICTED: number[] = []
for (let i = 0; i < 60; i++) {
  const base = 2150 + 140 * Math.sin(i / 9) + 60 * Math.sin(i / 3.3)
  ACTUAL.push(base + Math.sin(i * 1.7) * 38 + (i === 38 ? 170 : i === 39 ? 120 : 0))
  PREDICTED.push(base + Math.cos(i * 1.3) * 18)
}
const MINUTES = ACTUAL.map((_, i) => {
  const m = 13 * 60 + 2 + i
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`
})
const ANOMALY = 38
// Chart（ECharts）：悬停读出每分钟的实测与预测；F3 偏差告警点用 alarm-p2 三角标出（P2 的形状与颜色，告警色只给告警）。
const trendOption = (t: ChartTokens) => ({
  grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
  tooltip: { trigger: "axis", valueFormatter: (v: number) => `${Math.round(v).toLocaleString("zh-CN")} kN` },
  xAxis: { type: "category", data: MINUTES, boundaryGap: false, axisLabel: { interval: 14 } },
  yAxis: { type: "value", min: 1800, max: 2600, interval: 200 },
  series: [
    {
      name: "实测",
      type: "line",
      data: ACTUAL,
      lineStyle: { width: 1.5 },
      color: t["chart-2"],
      markPoint: {
        symbol: "triangle",
        symbolSize: 12,
        silent: true,
        itemStyle: { color: t["alarm-p2"], borderColor: t["alarm-p2-edge"], borderWidth: 1.5 },
        label: { show: false },
        data: [{ coord: [ANOMALY, ACTUAL[ANOMALY]] }],
      },
    },
    { name: "LimiX 预测", type: "line", data: PREDICTED, lineStyle: { width: 2, type: "dashed" }, color: t.foreground, z: 3 },
  ],
})

// 告警列表：AlarmMark 三重编码（颜色 + 形状 + 编号）；未确认的一条闪烁，已恢复的画空心。
const ALERTS: { title: string; time: string; priority: AlarmPriority; blink?: boolean; recovered?: boolean }[] = [
  { title: "F3 机架轧制力偏差 > 8%", time: "14:02", priority: 2, blink: true },
  { title: "层流冷却 3 区水温偏高", time: "13:47", priority: 3 },
  { title: "卷取张力波动（已恢复）", time: "13:20", priority: 4, recovered: true },
]

// 品牌黑主题：跟随页面主色（blue-* → blue-dark），模式恒为深色。
function useDarkTheme() {
  const [theme, setTheme] = React.useState<"orange-dark" | "blue-dark">("orange-dark")
  React.useEffect(() => {
    const root = document.documentElement
    const sync = () => setTheme((root.getAttribute("data-theme") || "").startsWith("blue") ? "blue-dark" : "orange-dark")
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])
  return theme
}

// 系统「减少动态效果」：开启时不生成流向点（路径箭头已表达方向）。
function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])
  return reduced
}

// 实时时钟：首帧显示占位，挂载后每秒更新。
function useClock() {
  const [time, setTime] = React.useState("--:--:--")
  React.useEffect(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 8))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])
  return time
}

// 数据流向：与 StableAI.motion.flow 同一换算——点数 = round(rate × 4)，一圈 6 − rate × 4 秒，相位均分。
// 用 SVG <animateMotion> 沿连线移动；不渲染即停止（流量为 0、采集中断、加载中、减少动态效果）。
function FlowDots({ d, rate }: { d: string; rate: number }) {
  const r = Math.max(0.05, Math.min(1, rate))
  const count = Math.max(1, Math.round(r * 4))
  const dur = 6 - r * 4
  return (
    <>
      {Array.from({ length: count }, (_, k) => (
        <circle key={k} r={3} className="sa-motion-flow-dot">
          <animateMotion path={d} dur={`${dur.toFixed(2)}s`} begin={`${((-k * dur) / count).toFixed(2)}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  )
}

function MonitorPage() {
  const theme = useDarkTheme()
  const reduced = useReducedMotion()
  const clock = useClock()
  const [backdrop, setBackdrop] = React.useState(false)
  const [mode, setMode] = React.useState<Mode>("live")
  const [lastAt, setLastAt] = React.useState("")
  // SVG 的 id 要能放进 url(#…)，去掉 useId 里的特殊字符。
  const uid = React.useId().replace(/[^a-zA-Z0-9-]/g, "")

  const loading = mode === "loading"
  const stale = mode === "stale"
  const flowing = mode === "live" && !reduced
  // 有图像底时所有面板改用玻璃面；纯色底保持 card 实色。
  const panel = backdrop ? GLASS : undefined

  const changeMode = (next: string) => {
    if (next === "stale") setLastAt(new Date().toTimeString().slice(0, 5))
    setMode(next as Mode)
  }

  return (
    <div data-theme={theme} className="relative isolate min-h-dvh overflow-hidden bg-background text-foreground [--sa-flow-dot:var(--foreground)] [color-scheme:dark]">
      {/* 图像底图：地图 / 产线视频 / 热力图的替身，只在打开开关后显示。 */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-standard)]",
          backdrop && "opacity-100",
        )}
      >
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="block size-full">
          <defs>
            <radialGradient id={`${uid}-heat-a`}>
              <stop offset="0" stopColor="var(--chart-seq-4)" stopOpacity={0.9} />
              <stop offset="0.45" stopColor="var(--chart-seq-3)" stopOpacity={0.5} />
              <stop offset="1" stopColor="var(--chart-seq-1)" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${uid}-heat-b`}>
              <stop offset="0" stopColor="var(--chart-seq-3)" stopOpacity={0.7} />
              <stop offset="1" stopColor="var(--chart-seq-1)" stopOpacity={0} />
            </radialGradient>
            <pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="var(--border)" />
            </pattern>
          </defs>
          <rect width="1200" height="800" fill={`url(#${uid}-grid)`} opacity={0.7} />
          <ellipse cx="180" cy="470" rx="260" ry="190" fill={`url(#${uid}-heat-a)`} />
          <ellipse cx="540" cy="460" rx="220" ry="150" fill={`url(#${uid}-heat-b)`} />
          <ellipse cx="840" cy="480" rx="180" ry="120" fill={`url(#${uid}-heat-b)`} opacity={0.7} />
        </svg>
      </div>

      <div className="relative z-[1] mx-auto grid w-full max-w-[var(--layout-content-max-width)] gap-4 p-6 max-[599px]:p-4 [&>*]:min-w-0">
        {/* 屏头：屏名与口径；右侧采集状态、实时时钟与图像底图开关。 */}
        <header className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <img
              src={theme === "blue-dark" ? limixMark : logoMark}
              alt={theme === "blue-dark" ? "LimiX" : "稳准智能"}
              width={24}
              height={24}
              className="size-6 shrink-0 rounded-sm bg-white object-contain p-0.5"
            />
            <h1 className="text-lg leading-6 font-semibold">热轧 2250 产线 · 实时监控</h1>
            <span className="text-[13px] leading-5 text-muted-foreground">LimiX-TS v2 轧制力预测 · 示例数据</span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground max-[599px]:ml-0">
            {stale ? (
              <StatusDot tone="error" label={`采集中断 · 最后更新 ${lastAt}`} />
            ) : loading ? (
              <StatusDot tone="neutral" label="正在连接数据源" />
            ) : (
              <StatusDot tone="active" pulse label="数据采集正常" />
            )}
            <span className="font-mono text-foreground tabular-nums">{clock}</span>
            <Label className="font-normal">
              <Switch checked={backdrop} onCheckedChange={(checked) => setBackdrop(checked)} />
              图像底图
            </Label>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4 [&>*]:min-w-0">
          {/* 指标行：只有本屏最重要的一个指标（当班产量）加强调光晕。 */}
          {loading
            ? STATS.map((item) => (
                <div
                  key={item.label}
                  aria-busy="true"
                  aria-label={`正在加载${item.label}`}
                  className={cn(
                    "col-span-12 grid content-start gap-2 rounded-md border border-border bg-card px-4 pt-4 pb-3 min-[600px]:col-span-6 min-[1100px]:col-span-3",
                    panel,
                  )}
                >
                  <Skeleton className="w-20" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="w-36" />
                </div>
              ))
            : STATS.map((item) => (
                <Stat
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  unit={item.unit}
                  delta={item.delta}
                  note={stale ? `${item.note} · 截至 ${lastAt}` : item.note}
                  state={item.alert ? "alert" : "default"}
                  alarmPriority={item.alarmPriority}
                  className={cn(
                    "col-span-12 min-[600px]:col-span-6 min-[1100px]:col-span-3",
                    panel,
                    // 主指标数值放大到 32/40，与原生版 .hero 一致。
                    item.hero && [GLOW, "[&_.font-mono]:text-[32px] [&_.font-mono]:leading-10"],
                  )}
                />
              ))}

          {/* 产线拓扑：连线数字为物料流量，流向点只放在有流量含义的连线上。 */}
          <Card className={cn("col-span-12 min-[1100px]:col-span-8", panel)}>
            <CardHeader>
              <CardTitle>产线拓扑与物料流</CardTitle>
              <CardDescription>连线数字为物料流量 t/h；流向点越多越快表示流量越大。</CardDescription>
            </CardHeader>
            {/* 拓扑最小 640px 宽：再窄就在卡片内横向滚动，不让 viewBox 把 11px 字压到约 5px */}
            <CardContent className="overflow-x-auto">
              <svg viewBox="0 0 760 256" role="img" aria-label="加热炉到卷取机的物料流，单位 t/h" className="block h-auto w-full min-w-[640px]">
                <defs>
                  <marker id={`${uid}-arrow`} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} markerUnits="userSpaceOnUse" orient="auto">
                    <path d="M0 0L8 4L0 8Z" className="fill-muted-foreground" />
                  </marker>
                </defs>
                <g>
                  {TOPOLOGY.map((link) => (
                    <React.Fragment key={link.key}>
                      <path d={link.d} fill="none" strokeWidth={2} className="stroke-border" markerEnd={`url(#${uid}-arrow)`} />
                      <text x={link.x} y={link.y} textAnchor={link.anchor} className="fill-muted-foreground font-mono text-[11px]">
                        {link.label}
                      </text>
                      {flowing && link.rate > 0 ? <FlowDots d={link.d} rate={link.rate} /> : null}
                    </React.Fragment>
                  ))}
                </g>
                <g>
                  {Object.entries(NODES).map(([id, [x, y, name, reading, active]]) => (
                    <g key={id}>
                      <rect
                        x={x - NODE_W / 2}
                        y={y - NODE_H / 2}
                        width={NODE_W}
                        height={NODE_H}
                        rx={6}
                        className={cn("fill-card", active ? "stroke-primary" : "stroke-border")}
                      />
                      <text x={x} y={y - 3} textAnchor="middle" className="fill-foreground text-xs">
                        {name}
                      </text>
                      <text x={x} y={y + 13} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                        {reading}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            </CardContent>
          </Card>

          {/* 模型运行：只有正在推理的一项加运行中描边，其余用 StatusDot 表达。 */}
          <Card className={cn("col-span-12 min-[1100px]:col-span-4", panel)}>
            <CardHeader>
              <CardTitle>模型运行</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {loading
                ? RUNS.map((run) => (
                    <div key={run.name} aria-hidden="true" className="grid gap-2 rounded-md border border-border p-3">
                      <Skeleton className="w-24" />
                      <Skeleton className="w-40" />
                    </div>
                  ))
                : RUNS.map((run) => (
                    <div key={run.name} className={cn("grid gap-1 rounded-md border border-border p-3", run.running && "sa-motion-sweep")}>
                      <strong className="text-sm font-medium">{run.name}</strong>
                      <small className="text-[13px] leading-5 text-muted-foreground">{run.scope}</small>
                      <StatusDot tone={run.tone} pulse={run.running} label={run.status} />
                    </div>
                  ))}
            </CardContent>
          </Card>

          {/* 趋势：实测 chart-2 实线，LimiX 预测 foreground 虚线；黄色三角（alarm-p2）标 F3 偏差告警。 */}
          <Card className={cn("col-span-12 min-[1100px]:col-span-8", panel)}>
            <CardHeader>
              <CardTitle>轧制力：实测 vs 预测</CardTitle>
              <CardDescription>近 60 分钟，单位 kN；黄色三角为 F3 偏差告警（P2）。</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <>
                  <EChart
                    height={200}
                    ariaLabel="近 60 分钟轧制力实测与 LimiX 预测，两者基本重合；13:40 实测偏离预测约 8%，触发 F3 偏差告警"
                    option={trendOption}
                  />
                  <div className="mt-2 flex gap-4 text-[13px] leading-5 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <i aria-hidden="true" className="inline-block h-0 w-4 border-t-[1.5px] border-[var(--chart-2)]" />
                      实测
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <i aria-hidden="true" className="inline-block h-0 w-4 border-t-2 border-dashed border-foreground" />
                      LimiX 预测
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 告警：新告警插在顶部，不弹 Toast、不闪屏。 */}
          <Card className={cn("col-span-12 min-[1100px]:col-span-4", panel)}>
            <CardHeader>
              <CardTitle>告警</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div aria-hidden="true" className="grid gap-3">
                  <Skeleton className="w-full" />
                  <Skeleton className="w-4/5" />
                  <Skeleton className="w-3/5" />
                </div>
              ) : (
                <ul className="text-[13px] leading-5">
                  {ALERTS.map((item) => (
                    <li key={item.title} className="flex items-center gap-2 border-t border-border py-2 first:border-t-0 first:pt-0">
                      <AlarmMark priority={item.priority} size="sm" blink={item.blink} variant={item.recovered ? "outline" : "solid"} />
                      <span className="min-w-0 flex-1">{item.title}</span>
                      <time className="font-mono whitespace-nowrap text-muted-foreground tabular-nums">{item.time}</time>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 页脚：示例数据标注与演示切换（真实大屏由数据源决定状态，没有这个切换）。 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[var(--layout-prose-max-width)] text-[13px] leading-5 text-muted-foreground">
            示例数据。四种大屏效果：运行中描边（推理中的模型）、数据流向（拓扑连线）、强调光晕（当班产量）、玻璃面板（打开「图像底图」后）。
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <span>演示状态</span>
            <ToggleGroup
              variant="segmented"
              size="sm"
              aria-label="演示状态"
              value={[mode]}
              onValueChange={(next) => next[0] && changeMode(next[0])}
            >
              <ToggleGroupItem value="live">实时</ToggleGroupItem>
              <ToggleGroupItem value="stale">采集中断</ToggleGroupItem>
              <ToggleGroupItem value="loading">加载中</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
    </div>
  )
}

export { MonitorPage }
