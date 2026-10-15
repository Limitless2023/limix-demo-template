"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { ColumnTypeBadge, colTypeOf, type ColumnRole, type ColumnType } from "@/components/ui/column-type-badge"
import { ColumnProfile } from "@/components/ui/column-profile"

type GridColumn = {
  key: string
  label?: string
  type?: ColumnType | string
  role?: ColumnRole
  /** 右对齐 mono；type 为 numeric 时默认开启。 */
  numeric?: boolean
  mono?: boolean
  format?: (value: unknown) => React.ReactNode
  /** 画在表头下方的列画像。 */
  profile?: Omit<React.ComponentProps<typeof ColumnProfile>, "compact" | "name" | "type">
}
type SortDirection = "asc" | "desc" | null

const fmtNumber = (v: number) => v.toLocaleString("zh-CN")
const numFmt = (v: number) => v.toLocaleString("zh-CN", { maximumFractionDigits: 4 })
const isEmpty = (v: unknown) => v == null || v === "" || (typeof v === "number" && Number.isNaN(v))

// 数据预览表：表头吸顶、首列吸左；点表头按 升序 → 降序 → 取消 循环排序，缺失值始终排在最后。
function DataGrid({
  columns,
  rows,
  rowIndex,
  sortable = true,
  maxHeight = 360,
  totalRows,
  caption,
  footnote,
  showFooter = true,
  onSort,
  className,
}: {
  columns: GridColumn[]
  rows: Array<Record<string, unknown>>
  rowIndex?: boolean
  sortable?: boolean
  /** 滚动高度 px，0 为不限。 */
  maxHeight?: number
  totalRows?: number
  caption?: string
  footnote?: string
  showFooter?: boolean
  onSort?: (key: string | null, direction: SortDirection) => void
  className?: string
}) {
  const [sort, setSort] = React.useState<{ key: string | null; dir: 0 | 1 | 2 }>({ key: null, dir: 0 })
  const numeric = (c: GridColumn) => c.numeric || colTypeOf(c.type) === "numeric"
  const list = React.useMemo(() => {
    const indexed = rows.map((data, index) => ({ data, index }))
    if (!sort.key || !sort.dir) return indexed
    const key = sort.key
    const dir = sort.dir === 1 ? 1 : -1
    return indexed.sort((a, b) => {
      const x = a.data[key]
      const y = b.data[key]
      if (isEmpty(x) && isEmpty(y)) return a.index - b.index
      if (isEmpty(x)) return 1
      if (isEmpty(y)) return -1
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "zh-CN")
      return r * dir || a.index - b.index
    })
  }, [rows, sort])
  const toggle = (key: string) => {
    const dir = (sort.key === key ? (sort.dir + 1) % 3 : 1) as 0 | 1 | 2
    const next = { key: dir ? key : null, dir }
    setSort(next)
    onSort?.(next.key, dir === 1 ? "asc" : dir === 2 ? "desc" : null)
  }
  const cell = "border-b border-border bg-background px-3 py-2 text-left align-top whitespace-nowrap"
  const sticky = "sticky left-0 z-[1] border-r border-border"
  const num = "text-right font-mono tabular-nums"
  const indexCell = "text-right font-mono text-xs text-muted-foreground"
  const shown = rows.length
  return (
    <div className={cn("grid", className)}>
      <div
        tabIndex={0}
        role="region"
        aria-label={caption ?? "数据预览"}
        style={maxHeight !== 0 ? { maxHeight } : undefined}
        className="relative overflow-auto rounded-md border border-border bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <table aria-rowcount={(totalRows ?? shown) + 1} className="w-max min-w-full border-separate border-spacing-0 text-[13px] leading-5">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {rowIndex ? <th scope="col" className={cn(cell, "sticky top-0 bg-muted align-bottom font-medium text-foreground", sticky, "z-[3]", indexCell)}>#</th> : null}
              {columns.map((c, ci) => {
                const on = sort.key === c.key && sort.dir !== 0
                const SortIcon = on ? (sort.dir === 1 ? ArrowUp : ArrowDown) : ArrowUpDown
                const label = c.label ?? c.key
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={!sortable ? undefined : on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                    className={cn(cell, "sticky top-0 z-[2] bg-muted align-bottom font-medium text-foreground", numeric(c) && num, !rowIndex && ci === 0 && cn(sticky, "z-[3]"))}
                  >
                    <div className="grid gap-2">
                      <div className="flex items-center gap-1">
                        {sortable ? (
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-[2px] border-0 bg-transparent p-0 font-medium text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            onClick={() => toggle(c.key)}
                          >
                            {label}
                            <SortIcon className={cn("size-3.5 text-[var(--icon-muted)]", on && "text-foreground")} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        ) : (
                          <span>{label}</span>
                        )}
                      </div>
                      {c.type ? <ColumnTypeBadge type={c.type} role={c.role} /> : null}
                      {c.profile ? <ColumnProfile compact name={label} type={c.type} {...c.profile} /> : null}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child_td]:border-b-0">
            {list.map((r) => (
              <tr key={r.index} className="group">
                {rowIndex ? <td className={cn(cell, sticky, indexCell, "group-hover:bg-[var(--surface)]")}>{r.index + 1}</td> : null}
                {columns.map((c, ci) => {
                  const v = r.data[c.key]
                  const content = React.isValidElement(v) ? (
                    v
                  ) : isEmpty(v) ? (
                    <span title="缺失" className="text-muted-foreground">—</span>
                  ) : c.format ? (
                    c.format(v)
                  ) : typeof v === "number" ? (
                    numFmt(v)
                  ) : (
                    String(v)
                  )
                  return (
                    <td key={c.key} className={cn(cell, "group-hover:bg-[var(--surface)]", numeric(c) && num, c.mono && "font-mono", !rowIndex && ci === 0 && sticky)}>
                      {content}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showFooter ? (
        <div className="flex justify-between gap-3 pt-2 text-xs text-muted-foreground">
          <span>{totalRows && totalRows > shown ? `预览前 ${fmtNumber(shown)} 行，共 ${fmtNumber(totalRows)} 行` : `共 ${fmtNumber(shown)} 行`}</span>
          {footnote ? <span>{footnote}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { DataGrid, type GridColumn, type SortDirection }
