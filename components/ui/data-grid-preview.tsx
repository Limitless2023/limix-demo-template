/**
 * [INPUT]: 依赖 @/components/ui 的 Button、Dialog、InputGroup、NativeSelect、ColumnProfile、ColumnTypeBadge；
 *          依赖 ./data-grid-preview-profile 的列画像计算；依赖 lucide-react 图标；依赖 @/lib/utils 的 cn
 * [OUTPUT]: 导出 DataGridPreview 组件与 PreviewColumn 类型
 * [POS]: 本仓库新增的原子组件（不来自 stable-ai-design registry）：移植自 limix-web 的同名组件，样式按 stable-ai-design 重做，
 *        再并入 DataGrid 的列画像——profiles 打开时表头画类型标签与直方图（点柱子按档位筛选，再点取消），关掉就是纯明细表。
 *        分页、全列搜索并高亮、行号是原始行序号（筛选后仍指向原来那一行）、数值舍入显示（原值在悬停提示）、放大预览。
 *        按列排序默认关闭（sortable 打开；场景演示里按原始顺序看数据，排序反而打乱叙事），limix-web 原版是常开。
 *        列可传 format 自定义单元格（如判定徽标），此时该列不做搜索高亮。不引入 TanStack / papaparse；limix-web 原版的列宽拖拽没有移植。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ColumnProfile } from "@/components/ui/column-profile"
import {
  ColumnTypeBadge,
  type ColumnRole,
  type ColumnType,
} from "@/components/ui/column-type-badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

import {
  buildColumnStats,
  matchesSelection,
  type ColumnStats,
} from "./data-grid-preview-profile"

type PreviewColumn = {
  key: string
  label?: string
  /** 右对齐等宽并按数值排序；不传时按前 50 行自动判断 */
  numeric?: boolean
  /** 表头类型标签；不传时数值列为 numeric、其余为 category */
  type?: ColumnType | string
  /** 表头角色标签，如 target（预测目标） */
  role?: ColumnRole
  /** 自定义单元格；传了就不做搜索高亮，搜索仍按原值匹配 */
  format?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

type Selection = number | string

const PAGE_SIZES = [10, 20, 50, 100]
const MAX_ROWS = 5_000

// ──────────────────────────────────────────────────────────────
// 取值工具：显示舍入（不改原值）、数值判断、排序比较
// ──────────────────────────────────────────────────────────────

const text = (v: unknown) => (v == null ? "" : String(v))
const zh = (n: number) => n.toLocaleString("zh-CN")

/** 小数最多 6 位，极小值转科学计数；整数与非数值原样显示。 */
function formatValue(v: unknown) {
  const s = text(v)
  if (!/^-?(?:\d+\.\d+|\d+(?:\.\d+)?e[+-]?\d+)$/i.test(s)) return s
  const n = Number(s)
  if (!Number.isFinite(n)) return s
  return n !== 0 && Math.abs(n) < 1e-6
    ? n.toExponential(4)
    : String(Number(n.toFixed(6)))
}

function looksNumeric(rows: Record<string, unknown>[], key: string) {
  let seen = 0
  let num = 0
  for (const r of rows.slice(0, 50)) {
    const s = text(r[key]).trim()
    if (!s) continue
    seen += 1
    if (Number.isFinite(Number(s))) num += 1
  }
  return seen > 0 && num / seen >= 0.8
}

function compare(a: unknown, b: unknown, numeric: boolean) {
  const sa = text(a).trim()
  const sb = text(b).trim()
  if (!sa || !sb) return sa ? -1 : sb ? 1 : 0 // 缺失值始终排在最后
  if (numeric) return Number(sa) - Number(sb)
  return sa.localeCompare(sb, "zh-CN", { numeric: true })
}

function Highlight({ value, query }: { value: string; query: string }) {
  const i = query ? value.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (i < 0) return <>{value}</>
  return (
    <>
      {value.slice(0, i)}
      <mark className="rounded-[2px] bg-accent px-0.5 text-accent-foreground">
        {value.slice(i, i + query.length)}
      </mark>
      {value.slice(i + query.length)}
    </>
  )
}

// ──────────────────────────────────────────────────────────────
// 组件
// ──────────────────────────────────────────────────────────────

function DataGridPreview({
  columns,
  rows,
  title = "数据预览",
  profiles = false,
  sortable = false,
  expandable = true,
  defaultPageSize = 20,
  className,
}: {
  columns: PreviewColumn[]
  rows: Record<string, unknown>[]
  /** 放大预览弹窗的标题，也是表格区域的无障碍名称 */
  title?: string
  /** 表头画类型标签与列画像（直方图 / 高频取值），点选可筛选 */
  profiles?: boolean
  /** 点表头按列排序（升序 → 降序 → 取消）；默认关闭 */
  sortable?: boolean
  expandable?: boolean
  defaultPageSize?: number
  className?: string
}) {
  const [query, setQuery] = React.useState("")
  const [selections, setSelections] = React.useState<Record<string, Selection>>(
    {}
  )
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(
    null
  )
  const [pageSize, setPageSize] = React.useState(defaultPageSize)
  const [page, setPage] = React.useState(0)

  const body = React.useMemo(() => rows.slice(0, MAX_ROWS), [rows])
  const truncated = rows.length > MAX_ROWS
  const numeric = React.useMemo(
    () =>
      Object.fromEntries(
        columns.map((c) => [c.key, c.numeric ?? looksNumeric(body, c.key)])
      ),
    [columns, body]
  )
  // 画像在全量数据上算，不随搜索与筛选变化
  const stats = React.useMemo<Record<string, ColumnStats>>(
    () =>
      profiles
        ? Object.fromEntries(
            columns.map((c) => [
              c.key,
              buildColumnStats(
                body.map((r) => r[c.key]),
                numeric[c.key]
              ),
            ])
          )
        : {},
    [profiles, columns, body, numeric]
  )

  // 行号是原始序号：排序与筛选后仍指向原来的第几行
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const picks = Object.entries(selections).filter(([key]) => stats[key])
    const hit = body
      .map((data, index) => ({ data, index }))
      .filter(
        ({ data }) =>
          !q || columns.some((c) => text(data[c.key]).toLowerCase().includes(q))
      )
      .filter(({ data }) =>
        picks.every(([key, sel]) =>
          matchesSelection(data[key], stats[key], sel)
        )
      )
    if (!sortable || !sort) return hit
    return [...hit].sort(
      (a, b) =>
        sort.dir *
          compare(a.data[sort.key], b.data[sort.key], numeric[sort.key]) ||
        a.index - b.index
    )
  }, [body, columns, query, selections, stats, sortable, sort, numeric])

  const narrowed = query.trim() !== "" || Object.keys(selections).length > 0
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages - 1)
  const pageRows = filtered.slice(current * pageSize, (current + 1) * pageSize)

  const toggleSort = (key: string) => {
    setSort((s) =>
      s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null
    )
    setPage(0)
  }
  const select = (key: string, sel: Selection | null) => {
    setSelections((prev) => {
      const next = { ...prev }
      if (sel == null) delete next[key]
      else next[key] = sel
      return next
    })
    setPage(0)
  }

  const cell =
    "border-b border-r border-border px-3 py-2 text-left whitespace-nowrap last:border-r-0"
  const indexCell =
    "sticky left-0 border-r border-border text-right font-mono text-xs text-muted-foreground"

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-background",
        className
      )}
    >
      {/* ── 工具条：计数与清除筛选在左，搜索与放大在右 ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {zh(filtered.length)} 行
          {narrowed ? `（筛选自 ${zh(body.length)} 行）` : ""} ·{" "}
          {columns.length} 列{truncated ? ` · 只显示前 ${zh(MAX_ROWS)} 行` : ""}
        </span>
        {Object.keys(selections).length ? (
          <Button variant="ghost" size="sm" onClick={() => setSelections({})}>
            <X data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
            清除列筛选
          </Button>
        ) : null}
        <InputGroup className="ml-auto w-64 max-w-full">
          <InputGroupAddon>
            <Search strokeWidth={1.5} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            placeholder="搜索全部列"
            aria-label="搜索全部列"
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
        </InputGroup>
        {expandable ? (
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`放大预览：${title}`}
                />
              }
            >
              <Maximize2 strokeWidth={1.5} aria-hidden="true" />
            </DialogTrigger>
            <DialogContent className="flex h-[90dvh] w-[96vw] max-w-[96vw] flex-col gap-4 sm:max-w-[96vw]">
              <DialogTitle>{title}</DialogTitle>
              <DataGridPreview
                columns={columns}
                rows={rows}
                title={title}
                profiles={profiles}
                sortable={sortable}
                expandable={false}
                defaultPageSize={50}
                className="min-h-0 flex-1"
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {/* ── 表格：表头与行号列吸附，横纵双向滚动 ── */}
      <div
        tabIndex={0}
        role="region"
        aria-label={title}
        className="min-h-0 flex-1 overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <table className="w-max min-w-full border-separate border-spacing-0 text-[13px] leading-5">
          <thead>
            <tr>
              <th
                scope="col"
                className={cn(
                  cell,
                  indexCell,
                  "top-0 z-[3] bg-muted align-bottom font-medium"
                )}
              >
                #
              </th>
              {columns.map((c) => {
                const on = sortable && sort?.key === c.key
                const Icon = on
                  ? sort?.dir === 1
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown
                const label = c.label ?? c.key
                const type = c.type ?? (numeric[c.key] ? "numeric" : "category")
                const st = stats[c.key]
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      !sortable
                        ? undefined
                        : on
                          ? sort?.dir === 1
                            ? "ascending"
                            : "descending"
                          : "none"
                    }
                    className={cn(
                      cell,
                      "sticky top-0 z-[2] bg-muted align-bottom font-medium text-foreground",
                      numeric[c.key] && "text-right",
                      st && "min-w-36"
                    )}
                  >
                    <div className="grid gap-2">
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-1 rounded-[2px] border-0 bg-transparent p-0 font-medium text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                            numeric[c.key] && "justify-self-end"
                          )}
                        >
                          {label}
                          <Icon
                            className={cn(
                              "size-3.5 text-[var(--icon-muted)]",
                              on && "text-foreground"
                            )}
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <span
                          className={cn(numeric[c.key] && "justify-self-end")}
                        >
                          {label}
                        </span>
                      )}
                      {st ? (
                        <>
                          <ColumnTypeBadge
                            type={type}
                            role={c.role}
                            className="justify-self-start"
                          />
                          <ColumnProfile
                            compact
                            name={label}
                            type={type}
                            {...(st.kind === "numeric"
                              ? { bins: st.bins, meta: st.meta }
                              : { topValues: st.topValues, unique: st.unique })}
                            missing={st.missing}
                            selected={selections[c.key] ?? null}
                            onFilter={(sel) => select(c.key, sel)}
                            className="text-left font-normal"
                          />
                        </>
                      ) : null}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map(({ data, index }) => (
              <tr key={index} className="group">
                <td
                  className={cn(
                    cell,
                    indexCell,
                    "z-[1] bg-background group-hover:bg-[var(--surface)]"
                  )}
                >
                  {index + 1}
                </td>
                {columns.map((c) => {
                  const raw = text(data[c.key])
                  const shown = query.trim() ? raw : formatValue(raw)
                  return (
                    <td
                      key={c.key}
                      title={raw}
                      className={cn(
                        cell,
                        "max-w-[20rem] overflow-hidden text-ellipsis group-hover:bg-[var(--surface)]",
                        numeric[c.key] && "text-right font-mono tabular-nums"
                      )}
                    >
                      {c.format ? (
                        c.format(data[c.key], data)
                      ) : raw ? (
                        <Highlight value={shown} query={query.trim()} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!pageRows.length ? (
          <p className="m-0 p-6 text-center text-sm text-muted-foreground">
            没有匹配的行
          </p>
        ) : null}
      </div>

      {/* ── 底栏：每页行数与翻页 ── */}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <label className="inline-flex items-center gap-2">
          每页
          <NativeSelect
            size="sm"
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(0)
            }}
          >
            {PAGE_SIZES.map((s) => (
              <NativeSelectOption key={s} value={String(s)}>
                {s} 行
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <span>
          第 {current + 1} / {pages} 页
        </span>
        <span className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="第一页"
            disabled={current === 0}
            onClick={() => setPage(0)}
          >
            <ChevronFirst strokeWidth={1.5} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="上一页"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft strokeWidth={1.5} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="下一页"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight strokeWidth={1.5} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="最后一页"
            disabled={current >= pages - 1}
            onClick={() => setPage(pages - 1)}
          >
            <ChevronLast strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </span>
      </div>
    </div>
  )
}

export { DataGridPreview, type PreviewColumn }
