"use client"

import * as React from "react"
import {
  Background,
  BackgroundVariant,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  useStore,
  useStoreApi,
  useViewport,
  type NodeChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { FoldVertical, Minus, Plus, UnfoldVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { flowEdgeTypes, type FlowEdgeState, type FlowEdgeType } from "@/components/ui/flow-edge"
import { flowNodeTypes, type FlowNodeData, type FlowNodeType } from "@/components/ui/flow-node"
import { taskStatus } from "@/components/ui/task-status"

type CanvasNode = FlowNodeData & { id: string; x?: number; y?: number }
type CanvasEdge = { from: string; to: string; label?: string; state?: FlowEdgeState }
type Size = { w: number; h: number }

// 连线状态由两端推断：上游未完成 → idle；下游失败 → error；下游运行中 → active；其余 → done。
function edgeState(edge: CanvasEdge, byId: Map<string, CanvasNode>): FlowEdgeState {
  if (edge.state) return edge.state
  const up = taskStatus[byId.get(edge.from)?.status ?? ""]?.tone
  const down = taskStatus[byId.get(edge.to)?.status ?? ""]?.tone
  if (up !== "success" && up !== "warning") return "idle"
  if (down === "error") return "error"
  if (down === "active") return "active"
  return "done"
}

// 上下游：路径上的连线 = 两端都在上游链或都在下游链
function lineage(id: string, edges: CanvasEdge[]) {
  const up = new Set([id])
  const down = new Set([id])
  for (let grew = true; grew; ) {
    grew = false
    for (const e of edges) {
      if (up.has(e.to) && !up.has(e.from)) {
        up.add(e.from)
        grew = true
      }
      if (down.has(e.from) && !down.has(e.to)) {
        down.add(e.to)
        grew = true
      }
    }
  }
  return {
    nodes: new Set([...up, ...down]),
    edge: (e: CanvasEdge) => (up.has(e.from) && up.has(e.to)) || (down.has(e.from) && down.has(e.to)),
  }
}

// 自动分层排布：按最长路径分列；只有下游的输入节点贴着最近的下游放；列内按上游位置排序减少交叉。尺寸未测量前用估计值。
function layoutCanvas(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  { direction = "horizontal", gap = [80, 24], sizes = {} }: { direction?: "horizontal" | "vertical"; gap?: [number, number]; sizes?: Record<string, Size> } = {},
) {
  const ids = nodes.map((n) => n.id)
  const size = (id: string) => sizes[id] ?? { w: 220, h: 140 }
  const incoming = new Map<string, CanvasEdge[]>()
  const outgoing = new Map<string, CanvasEdge[]>()
  for (const e of edges) {
    incoming.set(e.to, [...(incoming.get(e.to) ?? []), e])
    outgoing.set(e.from, [...(outgoing.get(e.from) ?? []), e])
  }
  const rank: Record<string, number> = {}
  const indeg: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]))
  for (const e of edges) if (e.to in indeg && e.from in indeg) indeg[e.to]++
  const queue = ids.filter((id) => !indeg[id])
  for (const id of queue) rank[id] = 0
  while (queue.length) {
    const id = queue.shift()!
    for (const e of outgoing.get(id) ?? []) {
      if (!(e.to in indeg)) continue
      rank[e.to] = Math.max(rank[e.to] ?? 0, rank[id] + 1)
      if (--indeg[e.to] === 0) queue.push(e.to)
    }
  }
  for (const id of ids) rank[id] ??= 0
  for (const id of ids) {
    const outs = outgoing.get(id)
    if (incoming.has(id) || !outs) continue
    rank[id] = Math.max(0, Math.min(...outs.map((e) => rank[e.to])) - 1)
  }
  const cols: string[][] = []
  for (const id of ids) (cols[rank[id]] ??= []).push(id)
  const filled = cols.filter(Boolean)
  const pos: Record<string, number> = {}
  filled.forEach((col, ci) => {
    if (ci) {
      const avg = (id: string) => {
        const ins = (incoming.get(id) ?? []).filter((e) => pos[e.from] != null)
        return ins.length ? ins.reduce((s, e) => s + pos[e.from], 0) / ins.length : ids.indexOf(id)
      }
      col.sort((a, b) => avg(a) - avg(b))
    }
    col.forEach((id, i) => (pos[id] = i + ci * 0.001))
  })
  const vertical = direction === "vertical"
  const cross = (id: string) => (vertical ? size(id).w : size(id).h)
  const main = (id: string) => (vertical ? size(id).h : size(id).w)
  const extents = filled.map((col) => col.reduce((s, id) => s + cross(id), 0) + gap[1] * (col.length - 1))
  const tallest = Math.max(...extents)
  const out: Record<string, { x: number; y: number }> = {}
  let m = 0
  filled.forEach((col, ci) => {
    let c = (tallest - extents[ci]) / 2
    for (const id of col) {
      out[id] = vertical ? { x: c, y: m } : { x: m, y: c }
      c += cross(id) + gap[1]
    }
    m += Math.max(...col.map(main)) + gap[0]
  })
  return out
}

type DetailMode = "auto" | "compact" | "full"

// 适应画布（与站点版 Canvas 一致）：放得下时居中；到最小比例仍放不下时从起点（左 / 上）开始显示，保证流程的第一步可见。
// 下方留 48px 给控件条。React Flow 自带的 fitView 在放不下时居中，会把第一步切掉，所以自己算视口。
function useFitFromStart(minZoom = 0.4, maxZoom = 2) {
  const flow = useReactFlow()
  const store = useStoreApi()
  return React.useCallback(() => {
    const nodes = flow.getNodes()
    const { width: W, height: H } = store.getState()
    if (!nodes.length || !W || !H) return
    const b = flow.getNodesBounds(nodes)
    const pad = 32
    const bottom = 48
    const k = Math.max(minZoom, Math.min(maxZoom, 1, (W - pad * 2) / Math.max(1, b.width), (H - pad - bottom) / Math.max(1, b.height)))
    const wFit = b.width * k <= W - pad * 2
    const hFit = b.height * k <= H - pad - bottom
    const x = (wFit ? (W - b.width * k) / 2 : pad) - b.x * k
    const y = (hFit ? Math.max(pad, (H - bottom - b.height * k) / 2 + pad / 2) : pad) - b.y * k
    flow.setViewport({ x, y, zoom: k })
  }, [flow, store, minZoom, maxZoom])
}

// 左下角控件条：缩小、当前比例、放大、简版 / 丰富版、适应画布、一键整理。
function CanvasControls({ onArrange, onFit, compact, onToggleDetail }: { onArrange: () => void; onFit: () => void; compact: boolean; onToggleDetail: () => void }) {
  const flow = useReactFlow()
  const { zoom } = useViewport()
  return (
    <Panel position="bottom-left" className="!m-3 flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 shadow-[var(--shadow-sm)] [&_svg]:size-4">
      <Button variant="ghost" size="icon-sm" aria-label="缩小" onClick={() => flow.zoomOut()}>
        <Minus aria-hidden="true" />
      </Button>
      <span className="min-w-[3.5em] text-center font-mono text-xs text-muted-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="icon-sm" aria-label="放大" onClick={() => flow.zoomIn()}>
        <Plus aria-hidden="true" />
      </Button>
      <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" />
      {/* 简版 / 丰富版：图标表示点下去会变成的样子；点过之后固定，不再随缩放变 */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="简版"
        aria-pressed={compact}
        title={compact ? "简版（点击显示丰富版：接口、关键值与版本）" : "丰富版（点击切到简版：只看标题与状态）"}
        onClick={onToggleDetail}
      >
        {compact ? <UnfoldVertical aria-hidden="true" /> : <FoldVertical aria-hidden="true" />}
      </Button>
      <Button variant="ghost" size="sm" className="font-normal" onClick={onFit}>
        适应画布
      </Button>
      <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" className="font-normal" onClick={onArrange}>
        一键整理
      </Button>
    </Panel>
  )
}

type CanvasProps = {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  direction?: "horizontal" | "vertical"
  /** 画布高度（px），默认 420。 */
  height?: number
  /** [列间距, 列内间距]，默认 [80, 24]。 */
  gap?: [number, number]
  /** 受控选中；不传时组件自己记。 */
  selected?: string | null
  /** 节点可拖动，默认 true；拖过之后暂停自动排布，直到「一键整理」。 */
  draggable?: boolean
  onSelect?: (id: string | null, node: CanvasNode | null) => void
  /** 节点拖到新位置后（画布坐标），可用来保存用户调整过的布局。 */
  onMove?: (id: string, position: { x: number; y: number }) => void
  /** 「一键整理」重新自动排布之后。 */
  onArrange?: () => void
  /** 缩放范围，默认 0.4–2（与站点版一致）。 */
  minZoom?: number
  maxZoom?: number
  /** 连线标签：auto（默认）平时隐藏，选中路径上、悬停节点相连的线才显示；always 一直显示。 */
  edgeLabels?: "auto" | "always"
  /** 卡片细节：auto（默认）缩到 85% 以下简版、92% 以上丰富版；compact / full 固定。控件条按钮点过后也会固定。 */
  detail?: DetailMode
  onDetailChange?: (mode: DetailMode) => void
  ariaLabel?: string
  className?: string
}

function CanvasInner({
  nodes,
  edges,
  direction = "horizontal",
  height = 420,
  gap = [80, 24],
  selected,
  draggable = true,
  onSelect,
  onMove,
  onArrange,
  edgeLabels = "auto",
  detail = "auto",
  onDetailChange,
  minZoom = 0.4,
  maxZoom = 2,
  ariaLabel = "流程画布",
  className,
}: CanvasProps) {
  // 细节层级：缩到 85% 以下只留标题与状态，回到 92% 以上恢复；两道阈值防来回跳
  const zoom = useStore((s) => s.transform[2])
  const [detailMode, setDetailMode] = React.useState<DetailMode>(detail)
  React.useEffect(() => setDetailMode(detail), [detail])
  const [autoCompact, setAutoCompact] = React.useState(false)
  React.useEffect(() => setAutoCompact((c) => (c ? zoom < 0.92 : zoom < 0.85)), [zoom])
  const compact = detailMode === "auto" ? autoCompact : detailMode === "compact"
  const toggleDetail = () => {
    const next: DetailMode = compact ? "full" : "compact"
    setDetailMode(next)
    onDetailChange?.(next)
  }
  const compactRef = React.useRef(compact)
  compactRef.current = compact
  const [hovered, setHovered] = React.useState<string | null>(null)
  const flow = useReactFlow()
  const fitStart = useFitFromStart(minZoom, maxZoom)
  const initialized = useNodesInitialized()
  const [sizes, setSizes] = React.useState<Record<string, Size>>({})
  const [innerSelected, setInnerSelected] = React.useState<string | null>(null)
  const selectedId = selected !== undefined ? selected : innerSelected
  const byId = React.useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const auto = nodes.some((n) => n.x == null || n.y == null)
  // 拖过的布局：第一次拖动时把当前全部位置冻结下来，之后节点尺寸变化也不再重排；「一键整理」清空后恢复自动排布
  const [frozen, setFrozen] = React.useState<Record<string, { x: number; y: number }> | null>(null)
  const [arrangeAll, setArrangeAll] = React.useState(false)
  const base = React.useMemo(
    () => (auto || arrangeAll ? layoutCanvas(nodes, edges, { direction, gap, sizes }) : Object.fromEntries(nodes.map((n) => [n.id, { x: n.x!, y: n.y! }]))),
    [auto, arrangeAll, nodes, edges, direction, gap, sizes],
  )
  const positions = frozen ? { ...base, ...frozen } : base
  const latest = React.useRef(positions)
  latest.current = positions
  const arrange = React.useCallback(() => {
    setFrozen(null)
    setArrangeAll(true)
    requestAnimationFrame(fitStart)
    onArrange?.()
  }, [fitStart, onArrange])
  const select = React.useCallback(
    (id: string | null) => {
      setInnerSelected(id)
      onSelect?.(id, id ? byId.get(id) ?? null : null)
    },
    [byId, onSelect],
  )
  const vertical = direction === "vertical"
  const hasIn = new Set(edges.map((e) => e.to))
  const hasOut = new Set(edges.map((e) => e.from))
  // 选中节点的上下游：沿连线向上、向下各走到底；有选中时路径外的节点与连线调淡
  const line = React.useMemo(() => (selectedId && byId.has(selectedId) ? lineage(selectedId, edges) : null), [selectedId, edges, byId])
  const rfNodes: FlowNodeType[] = nodes.map(({ id, x: _x, y: _y, ...data }) => ({
    id,
    type: "flow",
    position: positions[id] ?? { x: 0, y: 0 },
    targetPosition: vertical ? Position.Top : Position.Left,
    sourcePosition: vertical ? Position.Bottom : Position.Right,
    draggable,
    connectable: false,
    // 受控节点要带上已测尺寸，否则每次重渲染都会被当成未测量而隐藏
    measured: sizes[id] ? { width: sizes[id].w, height: sizes[id].h } : undefined,
    style: { opacity: line && !line.nodes.has(id) ? 0.4 : 1, transition: "opacity var(--duration-fast) var(--ease-standard)" },
    data: { ...data, onSelect: select, selectedId, handles: { in: hasIn.has(id), out: hasOut.has(id) } },
  }))
  const rfEdges: FlowEdgeType[] = edges.map((e) => ({
    id: `${e.from}->${e.to}`,
    source: e.from,
    target: e.to,
    type: "flow",
    selectable: false,
    className: cn("transition-opacity duration-[var(--duration-fast)]", line && !line.edge(e) && "opacity-20"),
    data: {
      label: e.label,
      state: edgeState(e, byId),
      showLabel: edgeLabels === "always" || (!!line && line.edge(e)) || (!!hovered && (e.from === hovered || e.to === hovered)),
    },
  }))
  // 记录实测尺寸（自动排布据此重算）与拖动后的位置；其余变化由本组件决定，不回写
  const onNodesChange = React.useCallback(
    (changes: NodeChange<FlowNodeType>[]) => {
      const next: Record<string, Size> = {}
      for (const c of changes) {
        // 排布与适应画布用完整细节下的尺寸：精简模式下不记录，切换层级时节点位置不动
        if (c.type === "dimensions" && c.dimensions && !compactRef.current) next[c.id] = { w: c.dimensions.width, h: c.dimensions.height }
        if (c.type === "position" && c.position) {
          const pos = c.position
          setFrozen((prev) => ({ ...(prev ?? latest.current), [c.id]: pos }))
          if (c.dragging === false) onMove?.(c.id, pos)
        }
        if (c.type === "position" && c.dragging === false && !c.position) {
          const pos = latest.current[c.id]
          if (pos) onMove?.(c.id, pos)
        }
      }
      if (Object.keys(next).length) setSizes((prev) => ({ ...prev, ...next }))
    },
    [onMove],
  )
  // 首次测量完成后按实测尺寸适应一次
  const fitted = React.useRef(false)
  React.useEffect(() => {
    if (!initialized || fitted.current) return
    fitted.current = true
    requestAnimationFrame(fitStart)
  }, [initialized, fitStart])

  // 画布获得焦点时：方向键平移，+ / − 缩放，0 适应画布
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && selectedId) {
      select(null)
      event.preventDefault()
      return
    }
    if (event.target !== event.currentTarget) return
    const v = flow.getViewport()
    const step = 40
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    if (moves[event.key]) flow.setViewport({ ...v, x: v.x + moves[event.key][0], y: v.y + moves[event.key][1] })
    else if (event.key === "+" || event.key === "=") flow.zoomIn()
    else if (event.key === "-") flow.zoomOut()
    else if (event.key === "0") fitStart()
    else return
    event.preventDefault()
  }

  return (
    <div
      role="region"
      tabIndex={0}
      aria-label={`${ariaLabel}。方向键平移，加减号缩放，0 适应画布，Esc 取消选中`}
      data-detail={compact ? "compact" : "full"}
      onKeyDown={onKeyDown}
      style={{ height }}
      className={cn(
        "relative overflow-hidden rounded-md border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        // React Flow 主题变量接本系统语义色
        "[--xy-background-color:var(--canvas)] [--xy-edge-label-background-color:var(--canvas)] [--xy-node-border-radius:var(--radius-md)]",
        className,
      )}
    >
      <ReactFlow<FlowNodeType, FlowEdgeType>
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={flowNodeTypes}
        edgeTypes={flowEdgeTypes}
        onNodesChange={onNodesChange}
        onPaneClick={() => select(null)}
        // 悬停节点：显示与它相连的连线标签
        onNodeMouseEnter={(_, node) => setHovered(node.id)}
        onNodeMouseLeave={() => setHovered(null)}
        nodesDraggable={draggable}
        nodesConnectable={false}
        elementsSelectable={false}
        // 普通滚轮留给页面；按住 Ctrl / ⌘ 滚轮或捏合缩放，拖动空白处平移
        zoomOnScroll={false}
        preventScrolling={false}
        zoomOnDoubleClick={false}
        minZoom={minZoom}
        maxZoom={maxZoom}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={0.9} color="var(--canvas-dot)" />
        <CanvasControls onArrange={arrange} onFit={fitStart} compact={compact} onToggleDetail={toggleDetail} />
      </ReactFlow>
    </div>
  )
}

// 流程画布：LimiX 任务管线、数据版本血缘、Agent 执行记录这类「看过程」的画面；只读，不拖拽节点、不手动连线。基于 React Flow（@xyflow/react）。
function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}

export { Canvas, layoutCanvas, type CanvasEdge, type CanvasNode, type CanvasProps, type DetailMode }
