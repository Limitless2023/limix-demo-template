import { cn } from "@/lib/utils"

// 无坐标轴迷你趋势：可叠加正常区间带与阈值虚线；末点用零长度圆头线段，拉伸宽度仍为圆点。
function Sparkline({
  values,
  width = 160,
  height = 32,
  band,
  baseline,
  min: minProp,
  max: maxProp,
  tone = "default",
  showLast = true,
  ariaLabel,
  className,
}: {
  values: number[]
  width?: number
  height?: number
  band?: [number, number]
  baseline?: number
  min?: number
  max?: number
  tone?: "default" | "neutral"
  showLast?: boolean
  ariaLabel?: string
  className?: string
}) {
  const data = values.filter((v) => Number.isFinite(v))
  const label = ariaLabel ?? (data.length ? `趋势：从 ${data[0].toLocaleString("zh-CN")} 到 ${data[data.length - 1].toLocaleString("zh-CN")}` : "无数据")
  const stroke = tone === "neutral" ? "var(--foreground)" : "var(--chart-1)"
  const domain = [...data, ...(band ?? []), ...(baseline != null ? [baseline] : [])]
  let min = minProp ?? Math.min(...domain)
  let max = maxProp ?? Math.max(...domain)
  if (max === min) { max += 1; min -= 1 }
  const pad = 2
  const x = (i: number) => (i / Math.max(1, data.length - 1)) * width
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (height - pad * 2)
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" height={height} className={cn("block w-full overflow-visible", className)}>
      {data.length >= 2 ? (
        <>
          {band ? <rect x={0} width={width} y={y(band[1])} height={Math.max(0, y(band[0]) - y(band[1]))} fill="var(--muted)" /> : null}
          {baseline != null ? <line x1={0} x2={width} y1={y(baseline)} y2={y(baseline)} stroke="var(--chart-baseline)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" /> : null}
          <polyline points={data.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {showLast ? <path d={`M${width} ${y(data[data.length - 1])}h0`} stroke={stroke} strokeWidth={5} strokeLinecap="round" vectorEffect="non-scaling-stroke" /> : null}
        </>
      ) : null}
    </svg>
  )
}

export { Sparkline }
