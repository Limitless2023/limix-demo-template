"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"

// 列表 / 数据页：页面标题区 → 筛选区 → 计数行 / 批量操作条 → 数据表 → 分页（规则见页型「列表 / 数据页」）。
// 放在 AppShell 的内容区里使用；示例数据换成真实接口后，保留结构与状态处理。

type Status = "done" | "running" | "failed" | "queued"
type Row = { id: number; name: string; dataset: string; model: string; status: Status; mape: number | null; samples: number; updatedAt: string }

const STATUS: Record<Status, { label: string; variant: "outline" | "accent" | "destructive" | "secondary" }> = {
  done: { label: "已完成", variant: "outline" },
  running: { label: "运行中", variant: "accent" },
  failed: { label: "失败", variant: "destructive" },
  queued: { label: "排队中", variant: "secondary" },
}

// 示例数据，不代表真实评测结果。
const SAMPLE: Row[] = [
  { id: 2041, name: "热轧轧制力预测", dataset: "热轧产线 · 工况数据集", model: "LimiX-TS v2", status: "done", mape: 2.1, samples: 128400, updatedAt: "2026-06-18 14:02" },
  { id: 2040, name: "锅炉负荷 24h 预测", dataset: "电厂 3 号机组", model: "LimiX-TS v2", status: "running", mape: null, samples: 96200, updatedAt: "2026-06-18 13:40" },
  { id: 2039, name: "连铸坯缺陷分类", dataset: "连铸质检 · 2026Q2", model: "LimiX-Tab v1", status: "done", mape: 3.4, samples: 41800, updatedAt: "2026-06-17 18:21" },
  { id: 2038, name: "脱硫塔 pH 回归", dataset: "化工 · 脱硫工段", model: "XGBoost 基线", status: "done", mape: 5.6, samples: 22150, updatedAt: "2026-06-17 09:05" },
  { id: 2037, name: "轧辊磨损趋势", dataset: "热轧产线 · 工况数据集", model: "LimiX-TS v1", status: "failed", mape: null, samples: 128400, updatedAt: "2026-06-16 22:10" },
  { id: 2036, name: "风机振动异常检测", dataset: "风电场 · 传感器", model: "LimiX-Tab v1", status: "queued", mape: null, samples: 310000, updatedAt: "2026-06-16 17:48" },
  { id: 2035, name: "加热炉煤气用量", dataset: "热轧产线 · 能耗", model: "LimiX-TS v2", status: "done", mape: 1.8, samples: 73500, updatedAt: "2026-06-15 11:30" },
  { id: 2034, name: "烧结矿碱度预测", dataset: "烧结 · 配料记录", model: "MES 规则", status: "done", mape: 7.2, samples: 15900, updatedAt: "2026-06-14 16:12" },
]

const DATASETS = Array.from(new Set(SAMPLE.map((row) => row.dataset))).map((value) => ({ value, label: value }))
const fmt = (value: number) => value.toLocaleString("zh-CN")

function ListPage() {
  const toast = useToast()
  const datasetId = React.useId()
  const [rows, setRows] = React.useState(SAMPLE)
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [dataset, setDataset] = React.useState("")
  const [range, setRange] = React.useState("30")
  const [selected, setSelected] = React.useState<Set<number>>(new Set())
  const [confirm, setConfirm] = React.useState(false)
  // Combobox 内部管理输入文字，重置时换 key 让它清空。
  const [resetKey, setResetKey] = React.useState(0)
  const [page, setPage] = React.useState(1)

  // 输入框保留用户打的空格，只在匹配时去掉首尾空白
  const q = query.trim()
  const filtered = Boolean(q || status || dataset)
  const visible = rows.filter(
    (row) =>
      (!q || `${row.name}${row.id}`.includes(q)) && (!status || row.status === status) && (!dataset || row.dataset === dataset),
  )
  const allChecked = visible.length > 0 && visible.every((row) => selected.has(row.id))
  // 示例数据只有一页；接真实接口时 pageCount = ceil(total / 每页条数)
  const pageCount = Math.max(1, Math.ceil(visible.length / 20))

  const reset = () => {
    setQuery("")
    setStatus("")
    setDataset("")
    setRange("30")
    setResetKey((key) => key + 1)
  }
  const toggle = (id: number, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const remove = () => {
    const count = selected.size
    setRows((current) => current.filter((row) => !selected.has(row.id)))
    setSelected(new Set())
    setConfirm(false)
    toast({ title: `已删除 ${count} 项评估（示例）` })
  }

  return (
    <>
      <PageHeader
        title="评估"
        description="所有评估任务；按数据集、模型或状态筛选后可批量导出、对比或删除。"
        actions={
          <>
            <Button variant="outline">导入结果</Button>
            <Button onClick={() => toast({ title: "已打开新建评估（示例）" })}>新建评估</Button>
          </>
        }
      />

      {/* 筛选区：即时生效，不设「查询」按钮；搜索框最宽。 */}
      <div className="grid grid-cols-2 items-end gap-3 min-[600px]:grid-cols-3 min-[1100px]:grid-cols-[minmax(220px,2fr)_repeat(3,minmax(140px,1fr))_auto]">
        <label className="col-span-full grid gap-2 text-[13px] font-medium min-[1100px]:col-span-1">
          搜索
          <Input placeholder="评估名称或编号" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="grid gap-2 text-[13px] font-medium">
          状态
          <NativeSelect className="w-full" value={status} onChange={(event) => setStatus(event.target.value)}>
            <NativeSelectOption value="">全部状态</NativeSelectOption>
            {Object.entries(STATUS).map(([value, item]) => (
              <NativeSelectOption key={value} value={value}>{item.label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <div className="grid gap-2">
          <label htmlFor={datasetId} className="text-[13px] font-medium">数据集</label>
          <Combobox<(typeof DATASETS)[number]> key={resetKey} items={DATASETS} onValueChange={(option) => setDataset(option?.value ?? "")}>
            <ComboboxInput id={datasetId} placeholder="全部数据集" className="w-full" />
            <ComboboxContent>
              <ComboboxEmpty>没有匹配项</ComboboxEmpty>
              <ComboboxList>
                {(option: (typeof DATASETS)[number]) => (
                  <ComboboxItem key={option.value} value={option}>{option.label}</ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <label className="grid gap-2 text-[13px] font-medium">
          时间范围
          <NativeSelect className="w-full" value={range} onChange={(event) => setRange(event.target.value)}>
            <NativeSelectOption value="7">近 7 天</NativeSelectOption>
            <NativeSelectOption value="30">近 30 天</NativeSelectOption>
            <NativeSelectOption value="90">近 90 天</NativeSelectOption>
          </NativeSelect>
        </label>
        <Button variant="ghost" onClick={reset}>重置</Button>
      </div>

      {/* 批量操作条：只在有勾选时出现；条目数在分页左侧，数据更新时间在表格说明里。 */}
      {selected.size > 0 ? (
        <div className="flex min-h-10 flex-wrap items-center gap-3 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground">
          <span>
            已选 <strong className="font-medium text-foreground">{selected.size}</strong> 项
          </span>
          <span className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => toast({ title: `已导出 ${selected.size} 项指标 CSV（示例）` })}>导出</Button>
          <Button variant="outline" size="sm" disabled={selected.size < 2}>对比</Button>
          <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>删除</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>取消选择</Button>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <Empty className="items-start text-left">
          <EmptyHeader className="max-w-xl items-start">
            <EmptyTitle>没有符合条件的评估</EmptyTitle>
            <EmptyDescription>放宽时间范围或清除筛选条件后再查。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="items-start">
            <Button variant="outline" size="sm" onClick={reset}>清除筛选</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <Table>
            <TableCaption>数据更新于 2026-06-18 14:05。示例数据：MAPE 为验证集指标；样本数为原始记录条数。</TableCaption>
            <TableHeader>
              <TableRow className="whitespace-nowrap hover:bg-transparent">
                <TableHead className="w-10 pr-0">
                  <Checkbox
                    aria-label="选择本页全部"
                    checked={allChecked}
                    onCheckedChange={(checked) => visible.forEach((row) => toggle(row.id, checked))}
                  />
                </TableHead>
                <TableHead>评估</TableHead>
                <TableHead>数据集</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">MAPE (%)</TableHead>
                <TableHead className="text-right">样本数</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row.id} data-state={selected.has(row.id) ? "selected" : undefined}>
                  <TableCell className="w-10 pr-0">
                    <Checkbox aria-label={`选择 ${row.name}`} checked={selected.has(row.id)} onCheckedChange={(checked) => toggle(row.id, checked)} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button variant="link" render={<a href={`#${row.id}`} />} nativeButton={false} className="text-sm font-normal">{row.name}</Button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{row.dataset}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.model}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={STATUS[row.status].variant}>{STATUS[row.status].label}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.mape == null ? "—" : row.mape.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{fmt(row.samples)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{row.updatedAt}</TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">
                      <Button variant="ghost" size="sm" aria-label={`查看 ${row.name}`} onClick={() => toast({ title: `已打开「${row.name}」（示例）` })}>查看</Button>
                      <Button variant="ghost" size="sm" aria-label={`复制 ${row.name} 的配置`} onClick={() => toast({ title: `已复制「${row.name}」的配置（示例）` })}>复制配置</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`删除 ${row.name}`}
                        onClick={() => {
                          setSelected(new Set([row.id]))
                          setConfirm(true)
                        }}
                      >
                        删除
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] text-muted-foreground max-[599px]:flex-col max-[599px]:items-start">
            <span>第 1–{visible.length} 条，共 {fmt(visible.length)} 条{filtered ? "（已筛选）" : ""}</span>
            {/* 上一页 / 下一页：ghost 文字按钮 + 方向图标，不用描边按钮。 */}
            <Pagination className="mx-0 w-auto">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <Button variant="ghost" size="sm" className="gap-1 px-2 font-normal" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="size-3.5" aria-hidden="true" />上一页
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="block min-w-16 text-center text-[13px] text-muted-foreground tabular-nums">{page} / {pageCount}</span>
                </PaginationItem>
                <PaginationItem>
                  <Button variant="ghost" size="sm" className="gap-1 px-2 font-normal" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
                    下一页<ChevronRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      {/* 删除不可逆：Dialog 二次确认并说明后果，成功后 Toast 报数量。 */}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="删除选中的评估？" description="删除后无法恢复，关联的报告与导出文件会一并移除。">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(false)}>取消</Button>
          <Button variant="destructive" onClick={remove}>删除</Button>
        </div>
      </ConfirmDialog>
    </>
  )
}

export { ListPage }
