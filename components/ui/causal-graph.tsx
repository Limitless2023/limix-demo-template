"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

type CausalNode = { id: string; label?: string; /** target 画在中心并用主色。 */ role?: "target" }
type CausalEdge = { source: string; target: string; /** 强度；线宽随 |weight| 变化。 */ weight: number }

const radius = (n: CausalNode) => (n.role === "target" ? 20 : 14)

// 因果图：唯一目标节点居中，其余节点环形排布；点选节点高亮它的关系，侧栏列出原因与影响，阈值滑块过滤弱边。
function CausalGraph({
  nodes,
  edges,
  directed = true,
  threshold: thresholdProp,
  defaultThreshold = 0,
  showThreshold = true,
  width: W = 480,
  height: H = 360,
  selected: selectedProp,
  defaultSelected = null,
  onSelect,
  onThresholdChange,
  className,
}: {
  nodes: CausalNode[]
  edges: CausalEdge[]
  directed?: boolean
  /** 受控阈值；不传则用 defaultThreshold 自管。低于该 |weight| 的边隐藏。 */
  threshold?: number
  defaultThreshold?: number
  showThreshold?: boolean
  width?: number
  height?: number
  /** 受控的选中节点 id；不传则用 defaultSelected 自管。 */
  selected?: string | null
  defaultSelected?: string | null
  onSelect?: (id: string | null) => void
  onThresholdChange?: (value: number) => void
  className?: string
}) {
  const [innerThreshold, setInnerThreshold] = React.useState(defaultThreshold)
  const [innerSelected, setInnerSelected] = React.useState<string | null>(defaultSelected)
  const threshold = thresholdProp ?? innerThreshold
  const selected = selectedProp !== undefined ? selectedProp : innerSelected
  const select = (id: string | null) => {
    if (selectedProp === undefined) setInnerSelected(id)
    onSelect?.(id)
  }
  const setThreshold = (v: number) => {
    if (thresholdProp === undefined) setInnerThreshold(v)
    onThresholdChange?.(v)
  }
  const maxW = Math.max(0.0001, ...edges.map((e) => Math.abs(e.weight)))
  const maxT = Math.round(maxW * 100) / 100
  const thresholdId = React.useId()
  const byId = React.useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<string, CausalNode>, [nodes])
  const pos = React.useMemo(() => {
    const targets = nodes.filter((n) => n.role === "target")
    const ring = targets.length === 1 ? nodes.filter((n) => n !== targets[0]) : nodes
    const cx = W / 2, cy = H / 2, rad = Math.min(W, H) / 2 - 44
    const out: Record<string, { x: number; y: number }> = {}
    if (targets.length === 1) out[targets[0].id] = { x: cx, y: cy }
    ring.forEach((n, i) => {
      const a = -Math.PI / 2 + (i / ring.length) * Math.PI * 2
      out[n.id] = { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) }
    })
    return out
  }, [nodes, W, H])
  const vis = edges.filter((e) => Math.abs(e.weight) >= threshold && byId[e.source] && byId[e.target])
  const pairs = new Set(vis.map((e) => `${e.source}>${e.target}`))
  const cx = W / 2, cy = H / 2
  // 曲线连线：连向中心目标的边保持直线；外圈之间的边若会穿过中心，向外弯绕开，否则轻微内弯避开外侧标签；
  // 一对双向边各向自己的左侧弯开，不再重叠。箭头沿曲线末端切线方向。
  const curve = (e: CausalEdge, hasReverse: boolean) => {
    const a = pos[e.source], b = pos[e.target]
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = -dy / len, ny = dx / len, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
    const radial = (a.x === cx && a.y === cy) || (b.x === cx && b.y === cy)
    const signed = (mx - cx) * nx + (my - cy) * ny
    const dist = Math.abs(signed), away = signed >= 0 ? 1 : -1
    let k = 0, side = 1
    if (hasReverse) k = len * 0.2
    else if (radial) k = 0
    else if (dist < 60) { k = Math.min(len * 0.6, (60 - dist) * 2 + 12); side = away }
    else { k = len * 0.15; side = -away }
    const qx = mx + nx * side * k, qy = my + ny * side * k
    const sx = qx - a.x, sy = qy - a.y, sl = Math.sqrt(sx * sx + sy * sy) || 1
    let tx = b.x - qx, ty = b.y - qy
    const tl = Math.sqrt(tx * tx + ty * ty) || 1
    tx /= tl; ty /= tl
    const ra = radius(byId[e.source]) + 2, rb = radius(byId[e.target]) + (directed ? 4 : 2)
    return { x1: a.x + (sx / sl) * ra, y1: a.y + (sy / sl) * ra, qx, qy, x2: b.x - tx * rb, y2: b.y - ty * rb, tx, ty }
  }
  const near: Record<string, boolean> = {}
  if (selected) {
    near[selected] = true
    vis.forEach((e) => { if (e.source === selected) near[e.target] = true; if (e.target === selected) near[e.source] = true })
  }
  const focus = !!selected
  const fade = "transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:transition-none"
  const byWeight = (a: CausalEdge, b: CausalEdge) => Math.abs(b.weight) - Math.abs(a.weight)
  const list = (title: string, arr: CausalEdge[], key: "source" | "target") => {
    if (!arr.length) return null
    return (
      <div key={title}>
        <p className="m-0 text-muted-foreground">{title}</p>
        <ul className="m-0 grid list-none gap-1 p-0">
          {[...arr].sort(byWeight).map((e, i) => {
            const other = byId[e[key]]
            return (
              <li key={i} className="flex justify-between gap-2">
                <span>{other.label ?? other.id}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{e.weight.toFixed(2)}</span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
  const node = selected ? byId[selected] : undefined
  const parts = !node
    ? []
    : directed
      ? [list("原因（指向它）", vis.filter((e) => e.target === selected), "source"), list("影响（它指向）", vis.filter((e) => e.source === selected), "target")]
      : [list("关联", vis.filter((e) => e.source === selected || e.target === selected).map((e) => (e.source === selected ? e : { source: e.target, target: e.source, weight: e.weight })), "target")]
  const note = <p className="m-0 text-muted-foreground">显示 {vis.length} / {edges.length} 条边。</p>
  return (
    <div data-focus={focus ? "" : undefined} className={cn("grid grid-cols-[minmax(0,1fr)_220px] items-start gap-4 max-sm:grid-cols-1", className)}>
      <svg role="group" aria-label={`${directed ? "有向" : "无向"}因果图，${nodes.length} 个变量`} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
        <g>
          {vis.map((e, i) => {
            const c = curve(e, directed && pairs.has(`${e.target}>${e.source}`))
            const { x1, y1, x2, y2, tx: ux, ty: uy } = c
            const isNear = !!selected && (e.source === selected || e.target === selected)
            const sw = 1 + (4 * Math.abs(e.weight)) / maxW
            const color = isNear ? "var(--foreground)" : "var(--chart-3)"
            const opacity = focus && !isNear ? 0.12 : 1
            const s = 4 + sw
            return (
              <React.Fragment key={i}>
                <path
                  d={`M${x1.toFixed(1)} ${y1.toFixed(1)}Q${c.qx.toFixed(1)} ${c.qy.toFixed(1)} ${(directed ? x2 - ux * 6 : x2).toFixed(1)} ${(directed ? y2 - uy * 6 : y2).toFixed(1)}`}
                  stroke={color}
                  strokeWidth={sw.toFixed(2)}
                  strokeLinecap="round"
                  fill="none"
                  style={{ opacity }}
                  className={fade}
                />
                {directed ? (
                  <polygon
                    points={[x2, y2, x2 - ux * s * 1.4 - uy * s * 0.7, y2 - uy * s * 1.4 + ux * s * 0.7, x2 - ux * s * 1.4 + uy * s * 0.7, y2 - uy * s * 1.4 - ux * s * 0.7].map((v) => v.toFixed(1)).join(",")}
                    fill={color}
                    style={{ opacity }}
                    className={fade}
                  />
                ) : null}
              </React.Fragment>
            )
          })}
        </g>
        <g>
          {nodes.map((n) => {
            const q = pos[n.id]
            const r = radius(n)
            // 外圈节点的标签沿半径向外放，避开汇向中心的边；中心节点标签放在下方。
            const cx = W / 2, cy = H / 2
            const ang = Math.atan2(q.y - cy, q.x - cx)
            const outer = !(q.x === cx && q.y === cy)
            const vertical = Math.abs(Math.cos(ang)) < 0.3
            const lx = outer ? Math.cos(ang) * (r + 6) : 0
            let ly = outer ? Math.sin(ang) * (r + 6) + 4 : r + 14
            if (outer && vertical) ly += Math.sin(ang) > 0 ? 8 : -4
            const anchor = !outer || vertical ? "middle" : Math.cos(ang) > 0 ? "start" : "end"
            const target = n.role === "target"
            const on = selected === n.id
            const count = vis.filter((e) => e.source === n.id || e.target === n.id).length
            return (
              <g
                key={n.id}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${n.label ?? n.id}${target ? "（目标）" : ""}，${count} 条关系`}
                data-role={n.role}
                transform={`translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`}
                style={{ opacity: focus && !near[n.id] ? 0.25 : 1 }}
                className={cn("group cursor-pointer outline-none", fade)}
                onClick={() => select(on ? null : n.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    select(on ? null : n.id)
                  }
                  if (event.key === "Escape") select(null)
                }}
              >
                <circle
                  r={r}
                  fill={target ? "var(--primary)" : "var(--background)"}
                  stroke={target ? "var(--primary)" : "var(--foreground)"}
                  strokeWidth={on ? 3 : 1.5}
                  className="group-focus-visible:stroke-[color:var(--ring)] group-focus-visible:[stroke-width:3]"
                />
                <text
                  x={lx.toFixed(1)}
                  y={ly.toFixed(1)}
                  textAnchor={anchor}
                  fill="var(--foreground)"
                  stroke="var(--background)"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  style={{ paintOrder: "stroke" }}
                  className="font-sans text-xs"
                >
                  {n.label ?? n.id}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      <div className="grid gap-3 text-[13px] leading-5">
        {showThreshold ? (
          // 标签行带等宽读数，滑轨下方标最小 / 最大值
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span id={thresholdId} className="text-[13px] leading-5 font-medium">强度阈值</span>
              <span aria-hidden="true" className="font-mono text-[13px] tabular-nums">{threshold.toFixed(2)}</span>
            </div>
            <Slider
              aria-labelledby={thresholdId}
              min={0}
              max={maxT}
              step={0.01}
              value={threshold}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              onValueChange={(v) => setThreshold(typeof v === "number" ? v : v[0])}
            />
            <div aria-hidden="true" className="flex justify-between font-mono text-[11px] leading-4 text-muted-foreground">
              <span>{(0).toFixed(2)}</span>
              <span>{maxT.toFixed(2)}</span>
            </div>
          </div>
        ) : null}
        {node ? (
          <div className="grid gap-3">
            <h4 className="m-0 text-sm font-semibold">{node.label ?? node.id}</h4>
            {parts.some(Boolean) ? parts : <p className="m-0 text-muted-foreground">当前阈值下没有关系。</p>}
            {note}
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="m-0 text-muted-foreground">点击节点查看它的关系。线宽表示强度{directed ? "，箭头由原因指向结果。" : "。"}</p>
            {note}
          </div>
        )}
      </div>
    </div>
  )
}

export { CausalGraph, type CausalNode, type CausalEdge }
