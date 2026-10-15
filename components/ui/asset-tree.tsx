"use client"

import * as React from "react"
import { ChevronRight, Cog, Factory, Warehouse, Workflow } from "lucide-react"

import { cn } from "@/lib/utils"
import { AlarmMark, toPriority, type AlarmPriority } from "@/components/ui/alarm-mark"
import { EquipmentStatus, type EquipmentState } from "@/components/ui/equipment-status"

type AssetKind = "plant" | "workshop" | "line" | "equipment"
type AssetNode = {
  id: string
  label: string
  kind?: AssetKind
  status?: EquipmentState
  health?: number
  /** 本节点自身的激活告警优先级；父节点汇聚子树里最高的一级与总条数。 */
  alarms?: Array<AlarmPriority | string>
  children?: AssetNode[]
}
type Flat = { node: AssetNode; level: number; parent: string | null; best: AlarmPriority | null; count: number }

const kindIcon = { plant: Factory, workshop: Warehouse, line: Workflow, equipment: Cog }

function flatten(nodes: AssetNode[], level = 1, parent: string | null = null, out: Flat[] = []) {
  for (const node of nodes) {
    const item: Flat = { node, level, parent, best: null, count: 0 }
    out.push(item)
    for (const a of node.alarms ?? []) {
      const p = toPriority(a)
      item.count++
      if (item.best == null || p < item.best) item.best = p
    }
    const start = out.length
    flatten(node.children ?? [], level + 1, node.id, out)
    for (const c of out.slice(start)) {
      if (c.parent !== node.id) continue
      item.count += c.count
      if (c.best != null && (item.best == null || c.best < item.best)) item.best = c.best
    }
  }
  return out
}

// 资产树：厂 → 车间 → 产线 → 设备。树上不闪烁；选中行用 surface 底 + 描边，不用 accent（深色下 P1 红在其上不足 3:1）。
function AssetTree({
  nodes,
  selected: selectedProp,
  expanded: expandedProp,
  showHealth = true,
  onSelect,
  ariaLabel = "资产",
  className,
}: {
  nodes: AssetNode[]
  selected?: string
  expanded?: string[]
  showHealth?: boolean
  onSelect?: (node: AssetNode) => void
  ariaLabel?: string
  className?: string
}) {
  // flatten 先递归子树再汇总直接子节点，所以每个节点的 best / count 已含整棵子树。
  const flat = React.useMemo(() => flatten(nodes), [nodes])
  const byId = React.useMemo(() => new Map(flat.map((f) => [f.node.id, f])), [flat])
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(expandedProp ?? flat.filter((f) => f.level < 3 && f.node.children?.length).map((f) => f.node.id)),
  )
  const [selected, setSelected] = React.useState(selectedProp)
  const [focusId, setFocusId] = React.useState(selectedProp ?? flat[0]?.node.id)
  const refs = React.useRef(new Map<string, HTMLLIElement>())

  const isVisible = (f: Flat) => {
    for (let p = f.parent; p; p = byId.get(p)?.parent ?? null) if (!expanded.has(p)) return false
    return true
  }
  const visible = flat.filter(isVisible)
  const toggle = (id: string, open?: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (open ?? !next.has(id)) next.add(id)
      else next.delete(id)
      return next
    })
  const focus = (id?: string | null) => {
    if (!id) return
    setFocusId(id)
    refs.current.get(id)?.focus()
  }
  const choose = (f: Flat) => {
    setSelected(f.node.id)
    onSelect?.(f.node)
  }
  const onKeyDown = (e: React.KeyboardEvent, f: Flat) => {
    const i = visible.indexOf(f)
    const hasKids = !!f.node.children?.length
    const open = expanded.has(f.node.id)
    let handled = true
    if (e.key === "ArrowDown") focus(visible[i + 1]?.node.id)
    else if (e.key === "ArrowUp") focus(visible[i - 1]?.node.id)
    else if (e.key === "Home") focus(visible[0]?.node.id)
    else if (e.key === "End") focus(visible[visible.length - 1]?.node.id)
    else if (e.key === "ArrowRight") { if (hasKids && !open) toggle(f.node.id, true); else if (hasKids) focus(visible[i + 1]?.node.id) }
    else if (e.key === "ArrowLeft") { if (hasKids && open) toggle(f.node.id, false); else focus(f.parent) }
    else if (e.key === "Enter" || e.key === " ") choose(f)
    else handled = false
    if (handled) { e.preventDefault(); e.stopPropagation() }
  }

  const render = (parent: string | null): React.ReactNode =>
    flat
      .filter((f) => f.parent === parent)
      .map((f) => {
        const hasKids = !!f.node.children?.length
        const open = expanded.has(f.node.id)
        const Icon = kindIcon[f.node.kind ?? "equipment"]
        return (
          <li
            key={f.node.id}
            ref={(el) => { if (el) refs.current.set(f.node.id, el); else refs.current.delete(f.node.id) }}
            role="treeitem"
            aria-level={f.level}
            aria-expanded={hasKids ? open : undefined}
            aria-selected={selected === f.node.id}
            tabIndex={focusId === f.node.id ? 0 : -1}
            onKeyDown={(e) => { if (e.target === e.currentTarget) onKeyDown(e, f) }}
            onFocus={(e) => { if (e.target === e.currentTarget) setFocusId(f.node.id) }}
            className="group/item outline-none"
          >
            <div
              onClick={(e) => {
                if (hasKids && (e.target as HTMLElement).closest("[data-toggle]")) toggle(f.node.id)
                else choose(f)
                focus(f.node.id)
              }}
              style={{ paddingLeft: `calc(${f.level - 1} * var(--space-4, 16px) + 4px)` }}
              className={cn(
                "flex min-h-8 cursor-pointer items-center gap-2 rounded-sm pr-2 hover:shadow-[inset_0_0_0_1px_var(--border)]",
                "group-focus-visible/item:outline-2 group-focus-visible/item:-outline-offset-2 group-focus-visible/item:outline-ring",
                selected === f.node.id && "bg-[var(--surface)] font-semibold shadow-[inset_0_0_0_1px_var(--muted-foreground)] hover:shadow-[inset_0_0_0_1px_var(--muted-foreground)]",
              )}
            >
              <span data-toggle aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center">
                {hasKids ? <ChevronRight className={cn("size-3.5 text-[var(--icon-muted)] transition-transform motion-reduce:transition-none", open && "rotate-90")} strokeWidth={1.5} /> : null}
              </span>
              <Icon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--icon-default)]" strokeWidth={1.5} />
              <span className="min-w-0 flex-1 truncate">{f.node.label}</span>
              {f.node.status ? <EquipmentStatus state={f.node.status} hideLabel /> : null}
              {f.node.health != null && showHealth ? (
                <span title="健康度" className="min-w-[2ch] text-right font-mono text-xs font-normal text-muted-foreground tabular-nums">{Math.round(f.node.health)}</span>
              ) : null}
              {f.best != null ? <AlarmMark priority={f.best} size="sm" count={f.count} /> : null}
            </div>
            {hasKids ? (
              <ul role="group" hidden={!open} className="m-0 list-none p-0">
                {render(f.node.id)}
              </ul>
            ) : null}
          </li>
        )
      })

  return (
    <ul role="tree" aria-label={ariaLabel} className={cn("m-0 list-none p-0 text-[13px] leading-5", className)}>
      {render(null)}
    </ul>
  )
}

export { AssetTree, type AssetNode }
