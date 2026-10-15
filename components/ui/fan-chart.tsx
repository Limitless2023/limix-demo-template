"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { EChart, chartTipRows, chartZoom, type ChartTokens } from "@/components/ui/echart"

type ForecastPoint = { p50: number; low: number; high: number; actual?: number }

// 单位前留一个空格（「38.4 kN」），百分号与千分号紧贴数字（「2.6%」）。
const unitSuffix = (u?: string) => (!u ? "" : u === "%" || u === "‰" ? u : ` ${u}`)

// 扇形预测图：历史实际值 + 预测 P50 + 分位区间带，竖虚线标预测起点；预测期里已到达的实测用虚线加圆点单独标出。
// 用 Chart（ECharts）渲染：悬停读出每一步的实测、P50 与区间；zoom 打开缩放。neutral 用于监控大屏。
function FanChart({
  history,
  forecast,
  labels = [],
  unit,
  format,
  lowLabel = "P10",
  highLabel = "P90",
  tone = "default",
  height = 240,
  zoom = false,
  showLegend = true,
  ariaLabel,
  className,
}: {
  history: number[]
  forecast: ForecastPoint[]
  labels?: string[]
  unit?: string
  format?: (value: number) => string
  lowLabel?: string
  highLabel?: string
  tone?: "default" | "neutral"
  /** @deprecated 宽度随容器，已忽略。 */
  width?: number
  height?: number
  zoom?: boolean
  showLegend?: boolean
  ariaLabel?: string
  className?: string
}) {
  const neutral = tone === "neutral"
  const fmt = React.useMemo(() => format ?? ((v: number) => (Math.round(v * 100) / 100).toLocaleString("zh-CN")), [format])
  const u = unitSuffix(unit)
  const h0 = history.length - 1
  const n = history.length + forecast.length
  const xs = Array.from({ length: n }, (_, i) => (labels[i] != null ? String(labels[i]) : String(i + 1)))
  const f = (i: number) => forecast[i - h0 - 1]
  const arrived = forecast.some((x) => x.actual != null)
  const last = forecast[forecast.length - 1]
  const label = ariaLabel ?? `历史 ${history.length} 点，预测 ${forecast.length} 步${last ? `；末步 P50 ${fmt(last.p50)}${u}（${lowLabel} ${fmt(last.low)} – ${highLabel} ${fmt(last.high)}）` : ""}`

  const option = React.useCallback(
    (t: ChartTokens) => {
      const p50c = neutral ? t.foreground : t["chart-1"]
      const band = neutral ? t.muted : t["chart-seq-1"]
      const at = (i: number, before: number | null, pick: (x: ForecastPoint) => number | null | undefined) =>
        i < h0 ? before : i === h0 ? history[h0] : pick(f(i)) ?? null
      return {
        grid: { left: 8, right: 16, top: 28, bottom: zoom ? 40 : 8, containLabel: true },
        tooltip: {
          trigger: "axis",
          formatter: (ps: Array<{ dataIndex: number }>) => {
            const i = ps[0].dataIndex
            if (i <= h0) return chartTipRows(xs[i], [{ name: "实际值", value: `${fmt(history[i])}${u}`, color: t["chart-2"] }])
            const x = f(i)
            return chartTipRows(xs[i], [
              x.actual != null ? { name: "已到达实测", value: `${fmt(x.actual)}${u}`, color: t["chart-2"], dashed: true } : null,
              { name: "预测 P50", value: `${fmt(x.p50)}${u}`, color: p50c },
              { name: `${lowLabel}–${highLabel}`, value: `${fmt(x.low)} – ${fmt(x.high)}${u}`, color: band },
            ])
          },
        },
        xAxis: { type: "category", data: xs, boundaryGap: false, axisLabel: { hideOverlap: true } },
        yAxis: { type: "value", scale: true, axisLabel: { formatter: (v: number) => fmt(v) } },
        dataZoom: zoom ? chartZoom({ slider: true }) : undefined,
        series: [
          // 区间带：下沿 + 宽度两条堆叠线，只填充上面一条
          { name: "band-low", type: "line", data: xs.map((_, i) => at(i, null, (x) => x.low)), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, silent: true, z: 1 },
          { name: `${lowLabel}–${highLabel}`, type: "line", data: xs.map((_, i) => (i < h0 ? null : i === h0 ? 0 : f(i).high - f(i).low)), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, areaStyle: { color: band, opacity: 1 }, silent: true, z: 1 },
          { name: "实际值", type: "line", data: xs.map((_, i) => (i <= h0 ? history[i] : null)), lineStyle: { width: 1.5, color: t["chart-2"] }, itemStyle: { color: t["chart-2"] }, z: 3 },
          ...(arrived
            ? [{ name: "已到达实测", type: "line", data: xs.map((_, i) => (i === h0 ? history[h0] : i > h0 ? f(i).actual ?? null : null)), showSymbol: true, symbolSize: 5, lineStyle: { width: 1.5, type: "dashed", color: t["chart-2"] }, itemStyle: { color: t["chart-2"] }, z: 4 }]
            : []),
          {
            name: "预测 P50", type: "line", data: xs.map((_, i) => at(i, null, (x) => x.p50)), z: 3,
            lineStyle: { width: 2, color: p50c, type: neutral ? "dashed" : "solid" }, itemStyle: { color: p50c },
            markLine: h0 >= 0 && forecast.length
              ? { symbol: "none", silent: true, lineStyle: { color: t["chart-baseline"], type: "dashed", width: 1 }, label: { formatter: "预测起点", position: "end", distance: 4, color: t["chart-axis"], fontSize: 11 }, data: [{ xAxis: h0 }] }
              : undefined,
          },
        ],
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, forecast, labels, neutral, zoom, lowLabel, highLabel, u, fmt]
  )

  const bandFill = neutral ? "var(--muted)" : "var(--chart-seq-1)"
  return (
    <figure data-tone={tone} className={cn("m-0 grid gap-2", className)}>
      <EChart option={option} height={height} ariaLabel={label} />
      {showLegend ? (
        <ul aria-hidden="true" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs leading-4 text-muted-foreground">
          <li className="inline-flex items-center gap-1.5"><i className="h-0 w-4 border-t-[1.5px] border-[var(--chart-2)]" />实际值</li>
          {arrived ? <li className="inline-flex items-center gap-1.5"><i className="h-0 w-4 border-t-[1.5px] border-dashed border-[var(--chart-2)]" />已到达实测</li> : null}
          <li className="inline-flex items-center gap-1.5"><i className={cn("h-0 w-4 border-t-2", neutral ? "border-dashed border-foreground" : "border-[var(--chart-1)]")} />预测 P50</li>
          <li className="inline-flex items-center gap-1.5"><i className="h-2 w-4 rounded-[2px]" style={{ background: bandFill }} />{lowLabel}–{highLabel} 区间</li>
          <li className="inline-flex items-center gap-1.5"><i className="h-0 w-4 border-t border-dashed border-[var(--chart-baseline)]" />预测起点</li>
        </ul>
      ) : null}
    </figure>
  )
}

export { FanChart, type ForecastPoint }
