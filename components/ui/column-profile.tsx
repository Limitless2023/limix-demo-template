"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ColumnTypeBadge, colTypeOf, type ColumnRole, type ColumnType } from "@/components/ui/column-type-badge"

type ProfileBin = { from: number; to: number; count: number }
type ProfileValue = { label: string; count: number }
type ProfileSelection = number | string | null

const fmtNumber = (v: number) => v.toLocaleString("zh-CN")

// 列画像：数值 / 时间列画直方图，类别列画前 5 个高频取值；传 onFilter 后柱与取值可点选筛选，再点取消。
function ColumnProfile({
  name,
  type,
  role,
  bins,
  topValues,
  missing,
  missingWarn = 0.2,
  unique,
  meta,
  compact,
  selected: selectedProp,
  onFilter,
  className,
}: {
  name?: string
  type?: ColumnType | string
  role?: ColumnRole
  bins?: ProfileBin[]
  topValues?: ProfileValue[]
  missing?: number
  missingWarn?: number
  unique?: number
  meta?: string[]
  compact?: boolean
  /** 受控的选中项：柱序号或取值；null 为未选。不传则组件自管。 */
  selected?: ProfileSelection
  onFilter?: (selection: ProfileSelection) => void
  className?: string
}) {
  const t = colTypeOf(type)
  const interactive = typeof onFilter === "function"
  const [inner, setInner] = React.useState<ProfileSelection>(null)
  const selected = selectedProp !== undefined ? selectedProp : inner
  const pick = (key: number | string) => {
    const next = selected === key ? null : key
    if (selectedProp === undefined) setInner(next)
    onFilter?.(next)
  }
  const top = (topValues ?? []).slice(0, 5)
  const maxBin = bins?.length ? Math.max(...bins.map((b) => b.count)) || 1 : 1
  const maxTop = top.length ? Math.max(...top.map((v) => v.count)) || 1 : 1
  const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
  return (
    <div className={cn("grid min-w-[150px] content-start gap-2 text-xs leading-4", className)}>
      {!compact ? (
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span title={name} className="truncate font-mono text-[13px] font-semibold text-foreground">{name}</span>
          <ColumnTypeBadge type={t} role={role} />
        </div>
      ) : null}
      {bins?.length ? (
        <>
          <div role="group" aria-label={`${name ?? ""} 数值分布`} className="flex h-9 items-end gap-px">
            {bins.map((b, i) => {
              const text = `${fmtNumber(b.from)}–${fmtNumber(b.to)}：${fmtNumber(b.count)} 行`
              const bar = cn(
                "min-w-[2px] flex-1 rounded-t-[1px] border-0 p-0 bg-[var(--chart-4)] hover:bg-[var(--chart-3)]",
                interactive && selected === i && "bg-primary hover:bg-primary",
              )
              const style = { height: `${Math.max(6, (b.count / maxBin) * 100)}%` }
              return interactive ? (
                <button key={i} type="button" aria-pressed={selected === i} aria-label={text} title={text} style={style} className={cn(bar, "cursor-pointer", focusRing)} onClick={() => pick(i)} />
              ) : (
                <span key={i} title={text} style={style} className={bar} />
              )
            })}
          </div>
          <div aria-hidden="true" className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>{fmtNumber(bins[0].from)}</span>
            <span>{fmtNumber(bins[bins.length - 1].to)}</span>
          </div>
        </>
      ) : top.length ? (
        <ul aria-label={`${name ?? ""} 高频取值`} className="m-0 grid list-none gap-[3px] p-0">
          {top.map((v) => {
            const on = interactive && selected === v.label
            const body = (
              <>
                <span className="relative block h-[18px] truncate pl-1 leading-[18px]">
                  <i className={cn("absolute inset-y-0 left-0 z-0 rounded-[2px] bg-muted", on && "bg-[var(--chart-seq-2)]")} style={{ width: `${(v.count / maxTop) * 100}%` }} />
                  <span className="relative z-[1]">{v.label}</span>
                </span>
                <span className="text-right font-mono text-[11px] text-muted-foreground">{fmtNumber(v.count)}</span>
              </>
            )
            const row = "grid w-full grid-cols-[minmax(0,1fr)_36px] items-center gap-2 border-0 bg-transparent py-px text-left text-foreground"
            return (
              <li key={v.label}>
                {interactive ? (
                  <button type="button" aria-pressed={on} aria-label={`${v.label}：${fmtNumber(v.count)} 行`} className={cn(row, "cursor-pointer rounded-[2px]", focusRing)} onClick={() => pick(v.label)}>
                    {body}
                  </button>
                ) : (
                  <div className={row}>{body}</div>
                )}
              </li>
            )
          })}
          {unique != null && unique > top.length ? (
            <li className="text-right font-mono text-[11px] text-muted-foreground">其余 {fmtNumber(unique - top.length)} 类</li>
          ) : null}
        </ul>
      ) : null}
      {missing != null || unique != null || meta?.length ? (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
          {missing != null ? <span className={cn(missing >= missingWarn && "text-destructive")}>缺失 {(missing * 100).toFixed(1)}%</span> : null}
          {unique != null ? <span>唯一 {fmtNumber(unique)}</span> : null}
          {meta?.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      ) : null}
    </div>
  )
}

export { ColumnProfile, type ProfileBin, type ProfileValue, type ProfileSelection }
