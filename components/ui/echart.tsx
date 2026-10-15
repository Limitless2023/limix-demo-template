"use client"

// 本库组件：ECharts 底座的完整图表（与站点版 StableAI.Chart 同一套主题与交互）。叫 EChart / echart.tsx，避开 shadcn 自带的 Recharts 版 chart。

import * as React from "react"
import * as echarts from "echarts/core"
import { BarChart, GraphChart, HeatmapChart, LineChart, ScatterChart } from "echarts/charts"
import {
  AriaComponent, AxisPointerComponent, DataZoomInsideComponent, DataZoomSliderComponent, DatasetComponent, GridComponent,
  LegendComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TitleComponent, TooltipComponent, VisualMapComponent,
} from "echarts/components"
import { CanvasRenderer, SVGRenderer } from "echarts/renderers"

import { cn } from "@/lib/utils"

// 与站点按需包（design-system/vendor/echarts/entry.js）同一组图型与组件。
echarts.use([
  LineChart, BarChart, ScatterChart, HeatmapChart, GraphChart,
  GridComponent, TooltipComponent, AxisPointerComponent, DataZoomInsideComponent, DataZoomSliderComponent,
  MarkLineComponent, MarkAreaComponent, MarkPointComponent, LegendComponent, VisualMapComponent, AriaComponent, DatasetComponent, TitleComponent,
  CanvasRenderer, SVGRenderer,
])

const KEYS = [
  "foreground", "muted-foreground", "border", "background", "muted", "popover", "popover-foreground", "primary", "destructive",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-baseline", "chart-grid", "chart-axis",
  "chart-seq-1", "chart-seq-2", "chart-seq-3", "chart-seq-4", "chart-seq-5", "font-sans", "font-mono", "duration-base",
  "alarm-p1", "alarm-p2", "alarm-p2-edge", "alarm-p3", "alarm-p4", "lit-shadow",
] as const
export type ChartTokens = Record<(typeof KEYS)[number], string>
type Option = echarts.EChartsCoreOption

const registered = new Set<string>()
const readTokens = (node: Element): ChartTokens => {
  const cs = getComputedStyle(node)
  return Object.fromEntries(KEYS.map((k) => [k, cs.getPropertyValue(`--${k}`).trim()])) as ChartTokens
}
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
const hashKey = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

// token → ECharts 主题：坐标轴与网格用 chart-grid / chart-axis，提示框用 popover 弹层，系列色按 chart-1…5。
function chartTheme(t: ChartTokens) {
  const axis = (split: boolean) => ({
    axisLine: { show: true, lineStyle: { color: t["chart-grid"] } },
    axisTick: { show: false },
    axisLabel: { color: t["chart-axis"], fontFamily: t["font-mono"], fontSize: 11 },
    splitLine: { show: split, lineStyle: { color: t["chart-grid"] } },
    splitArea: { show: false },
    nameTextStyle: { color: t["chart-axis"], fontSize: 11 },
  })
  return {
    color: [t["chart-1"], t["chart-2"], t["chart-3"], t["chart-4"], t["chart-5"]],
    backgroundColor: "transparent",
    textStyle: { fontFamily: t["font-sans"], color: t["muted-foreground"], fontSize: 12 },
    title: { textStyle: { color: t.foreground, fontSize: 14, fontWeight: 600 }, subtextStyle: { color: t["muted-foreground"], fontSize: 12 } },
    legend: { textStyle: { color: t["muted-foreground"], fontSize: 12 }, inactiveColor: t["chart-grid"], itemWidth: 16, itemHeight: 8, itemGap: 16 },
    categoryAxis: axis(false), valueAxis: axis(true), timeAxis: axis(false), logAxis: axis(true),
    tooltip: {
      backgroundColor: t.popover, borderColor: t.border, borderWidth: 1, padding: [8, 12],
      textStyle: { color: t["popover-foreground"], fontSize: 12, fontFamily: t["font-sans"] },
      extraCssText: "border-radius:8px;box-shadow:var(--shadow-md);",
      axisPointer: { lineStyle: { color: t["chart-axis"], type: "dashed", width: 1 }, crossStyle: { color: t["chart-axis"] }, shadowStyle: { color: t.muted, opacity: 0.6 } },
    },
    dataZoom: {
      borderColor: t.border, backgroundColor: "transparent", fillerColor: t.muted,
      handleStyle: { color: t.background, borderColor: t["chart-axis"] }, moveHandleStyle: { color: t["chart-grid"] },
      textStyle: { color: t["muted-foreground"] },
      dataBackground: { lineStyle: { color: t["chart-4"] }, areaStyle: { color: t.muted } },
      selectedDataBackground: { lineStyle: { color: t["chart-3"] }, areaStyle: { color: t["chart-grid"] } },
    },
    visualMap: { textStyle: { color: t["muted-foreground"] }, inRange: { color: [t["chart-seq-1"], t["chart-seq-2"], t["chart-seq-3"], t["chart-seq-4"], t["chart-seq-5"]] } },
    line: { symbol: "circle", symbolSize: 5, showSymbol: false, lineStyle: { width: 2 } },
    bar: { barMaxWidth: 32, itemStyle: { borderRadius: [2, 2, 0, 0] } },
  }
}

/** 标准缩放：按住 Ctrl / ⌘ 滚轮或触控板双指捏合缩放，拖动平移；普通滚轮留给页面滚动。 */
export function chartZoom({ slider = false, start, end }: { slider?: boolean; start?: number; end?: number } = {}) {
  const z: object[] = [{ type: "inside", zoomOnMouseWheel: "ctrl", moveOnMouseWheel: false, moveOnMouseMove: true, start, end }]
  if (slider) z.push({ type: "slider", height: 20, bottom: 8, start, end, brushSelect: false, showDetail: false })
  return z
}

/** 提示框 HTML：标题 + 每行「色块 名称 数值」，与站点版一致。 */
export function chartTipRows(title: string, rows: Array<{ name: string; value: string; color?: string; dashed?: boolean } | null>) {
  const body = rows
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => {
      const key = r.dashed
        ? `border-top:2px dashed ${esc(r.color ?? "currentColor")};height:0`
        : `background:${esc(r.color ?? "transparent")};height:2px`
      return `<div style="display:grid;grid-template-columns:12px minmax(0,1fr) auto;align-items:center;gap:8px;color:var(--muted-foreground)"><i style="width:12px;border-radius:1px;${key}"></i><span>${esc(r.name)}</span><b style="font-family:var(--font-mono);font-weight:500;color:var(--popover-foreground)">${esc(r.value)}</b></div>`
    })
    .join("")
  return `<div style="display:grid;gap:4px;min-width:140px;font-size:12px;line-height:18px"><div style="font-weight:500">${esc(title)}</div>${body}</div>`
}

// 完整图表的统一底座：主题取所在位置的 token，主题切换时重绘，跟随容器尺寸，减少动态效果时关闭动画。
function EChart({
  option,
  height = 280,
  ariaLabel,
  renderer = "canvas",
  onReady,
  className,
}: {
  /** ECharts option；传函数可读 token，主题变化时重新计算。画布不解析 CSS 变量，颜色与字体都从 t 取。 */
  option: Option | ((t: ChartTokens) => Option)
  height?: number
  /** 必填：画了什么、关键读数是多少。 */
  ariaLabel: string
  renderer?: "canvas" | "svg"
  onReady?: (instance: echarts.ECharts) => void
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const optionRef = React.useRef(option)
  optionRef.current = option
  const chartRef = React.useRef<echarts.ECharts | null>(null)
  const keyRef = React.useRef("")

  const render = React.useCallback(() => {
    const box = ref.current
    if (!box || !box.clientWidth) return
    const t = readTokens(box)
    const key = JSON.stringify(t) + reducedMotion()
    if (!chartRef.current || key !== keyRef.current) {
      chartRef.current?.dispose()
      const name = `sa-${hashKey(key)}`
      if (!registered.has(name)) { echarts.registerTheme(name, chartTheme(t)); registered.add(name) }
      chartRef.current = echarts.init(box, name, { renderer })
      keyRef.current = key
      onReady?.(chartRef.current)
    }
    const o = typeof optionRef.current === "function" ? optionRef.current(t) : optionRef.current
    const duration = parseFloat(t["duration-base"]) || 200
    chartRef.current.setOption({
      animation: !reducedMotion(), animationDuration: duration, animationDurationUpdate: duration,
      aria: { enabled: true, label: { description: ariaLabel } },
      ...o,
    }, true)
  }, [ariaLabel, renderer, onReady])

  React.useEffect(() => {
    const box = ref.current
    if (!box) return
    render()
    const ro = new ResizeObserver(() => (chartRef.current ? chartRef.current.resize() : render()))
    ro.observe(box)
    // 主题可能挂在 html，也可能挂在最近的 [data-theme] 祖先上（品牌黑作用域）
    const mo = new MutationObserver(() => render())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] })
    const scope = box.parentElement?.closest("[data-theme]")
    if (scope && scope !== document.documentElement) mo.observe(scope, { attributes: true, attributeFilter: ["data-theme"] })
    return () => { ro.disconnect(); mo.disconnect(); chartRef.current?.dispose(); chartRef.current = null }
  }, [render])

  // option 变化时重画（不重建实例）
  React.useEffect(() => { render() }, [option, render])

  return <div ref={ref} aria-label={ariaLabel} className={cn("relative w-full min-w-0", className)} style={{ height }} />
}

export { EChart }
