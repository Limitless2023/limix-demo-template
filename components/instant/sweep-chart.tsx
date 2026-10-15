/**
 * [INPUT]: 依赖 @/components/ui/echart 的 EChart、chartTipRows；依赖 @/lib/instant-types 的 InstantSpec、Prediction；依赖 ./records 的 fmt
 * [OUTPUT]: 导出 SweepChart 组件与 SweepCurve 类型
 * [POS]: components/instant 的扫描曲线：同一组输入只改一列（如龄期），一次请求算出整条曲线；保留上一条做对照，
 *        用来演示「多加水，整条强度曲线往下走」。画法沿用 FanChart（P50 实线 + P10–P90 面积带）。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"

import { chartTipRows, EChart, type ChartTokens } from "@/components/ui/echart"
import type { InstantSpec, Prediction } from "@/lib/instant-types"

import { fmt } from "./records"

export type SweepCurve = { label: string; points: Prediction[] }

export function SweepChart({ spec, current, previous }: { spec: InstantSpec; current: SweepCurve; previous?: SweepCurve }) {
  const sweep = spec.sweep!
  const feature = spec.features.find((f) => f.key === sweep.key)!
  const unit = spec.target.unit
  const xs = sweep.values.map((v) => `${v} ${feature.unit}`)

  const option = React.useCallback(
    (t: ChartTokens) => ({
      grid: { left: 8, right: 24, top: 28, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        formatter: (ps: Array<{ dataIndex: number }>) => {
          const i = ps[0].dataIndex
          const p = current.points[i]
          return chartTipRows(`${feature.label} ${xs[i]}`, [
            { name: "本次 P50", value: `${fmt(p.p50)} ${unit}`, color: t["chart-1"] },
            { name: "P10–P90", value: `${fmt(p.low)} – ${fmt(p.high)} ${unit}`, color: t["chart-seq-1"] },
            previous ? { name: "上一次 P50", value: `${fmt(previous.points[i].p50)} ${unit}`, color: t["chart-3"], dashed: true } : null,
          ])
        },
      },
      xAxis: { type: "category", data: xs, boundaryGap: true }, // 两端留白，首尾点的数值标签不压纵轴
      yAxis: { type: "value", scale: true, name: unit, axisLabel: { formatter: (v: number) => fmt(v) } },
      series: [
        { name: "band-low", type: "line", data: current.points.map((p) => p.low), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, silent: true, z: 1 },
        {
          name: "P10–P90", type: "line", data: current.points.map((p) => p.high - p.low), stack: "band", symbol: "none",
          lineStyle: { opacity: 0 }, areaStyle: { color: t["chart-seq-1"], opacity: 1 }, silent: true, z: 1,
        },
        // 主题默认不画数据点（line.showSymbol = false）；标签挂在数据点上，所以两条 P50 线显式打开
        ...(previous
          ? [{ name: "上一次 P50", type: "line", data: previous.points.map((p) => p.p50), showSymbol: true, symbolSize: 4, lineStyle: { width: 2, type: "dashed", color: t["chart-3"] }, itemStyle: { color: t["chart-3"] }, z: 2 }]
          : []),
        {
          // 上一条曲线在这个点更高时，标签放到下方，避免压在虚线上
          name: "本次 P50", type: "line", showSymbol: true, symbolSize: 6, z: 3,
          data: current.points.map((p, i) => ({ value: p.p50, label: { position: previous && previous.points[i].p50 > p.p50 ? "bottom" : "top" } })),
          lineStyle: { width: 2, color: t["chart-1"] }, itemStyle: { color: t["chart-1"] },
          label: { show: true, color: t.foreground, fontFamily: t["font-mono"], fontSize: 11, formatter: (p: { value: number }) => fmt(p.value) },
        },
      ],
    }),
    [current, previous, xs, feature.label, unit],
  )

  const last = current.points[current.points.length - 1]
  return (
    <figure className="m-0 grid gap-2">
      <EChart option={option} height={260} ariaLabel={`${sweep.title}：${current.label}，${xs[0]} 时 P50 ${fmt(current.points[0].p50)} ${unit}，${xs[xs.length - 1]} 时 ${fmt(last.p50)} ${unit}`} />
      <ul aria-hidden="true" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs leading-4 text-muted-foreground">
        <li className="inline-flex items-center gap-1.5"><i className="h-0 w-4 border-t-2 border-[var(--chart-1)]" />本次：{current.label}</li>
        <li className="inline-flex items-center gap-1.5"><i className="h-2 w-4 rounded-[2px] bg-[var(--chart-seq-1)]" />P10–P90 区间</li>
        {previous ? <li className="inline-flex items-center gap-1.5"><i className="h-0 w-4 border-t-2 border-dashed border-[var(--chart-3)]" />上一次：{previous.label}</li> : null}
      </ul>
    </figure>
  )
}
