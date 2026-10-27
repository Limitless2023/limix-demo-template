/**
 * [INPUT]: 依赖 @/components/ui 的 Sheet、ToggleGroup、Switch、Button、DataGridPreview、Skeleton；
 *          依赖 @/lib/csv 的 parseCsv；依赖 @/lib/instant-types 的 InstantSpec、ContextInfo
 * [OUTPUT]: 导出 ContextDataSheet 组件
 * [POS]: components/instant 的「查看数据」侧滑面板，从上下文状态行的「查看数据」打开，两个 tab 共用。
 *        数据两份：当前上下文（含演示中加入的记录，新加入的排最前并标来源）与测试记录（模型没见过强度）。
 *        一张 DataGridPreview：表头带列分布（直方图，点柱子按档位筛选），可关掉只看明细；分页、搜索、排序都在表里。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DataGridPreview,
  type PreviewColumn,
} from "@/components/ui/data-grid-preview"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { parseCsv, type CsvTable } from "@/lib/csv"
import type { ContextInfo, InstantSpec } from "@/lib/instant-types"

type Dataset = "context" | "samples"
const SOURCE_KEY = "__source"

export function ContextDataSheet({
  spec,
  info,
  open,
  onOpenChange,
}: {
  spec: InstantSpec
  info: ContextInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [dataset, setDataset] = React.useState<Dataset>("context")
  const [profiles, setProfiles] = React.useState(true)
  const [tables, setTables] = React.useState<{
    context: CsvTable
    samples: CsvTable
  } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const contextHref = `/api/instant?scenario=${spec.slug}&download=context`

  // 打开时取数；上下文行数变了（加入或恢复）就重取，保证看到的是当前上下文
  const rowsNow = info?.rows
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    Promise.all([
      fetch(contextHref).then((r) => r.text()),
      fetch(`/${spec.samplesFile}`).then((r) => r.text()),
    ])
      .then(
        ([context, samples]) =>
          !cancelled &&
          setTables({ context: parseCsv(context), samples: parseCsv(samples) })
      )
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof Error ? e.message : "数据加载失败")
      )
    return () => {
      cancelled = true
    }
  }, [open, rowsNow, contextHref, spec.samplesFile])

  const data = React.useMemo(() => {
    if (!tables) return null
    const added = dataset === "context" ? (info?.addedRows ?? 0) : 0
    const source =
      dataset === "context" ? tables.context.rows : tables.samples.rows
    // 新加入的记录在表尾，挪到最前面并标来源
    const ordered = added
      ? [...source.slice(-added).reverse(), ...source.slice(0, -added)]
      : source
    const rows = ordered.map((r, i) => ({
      ...(added ? { [SOURCE_KEY]: i < added ? "新加入" : "初始" } : {}),
      ...r,
    }))
    const columns: PreviewColumn[] = [
      ...(added
        ? [{ key: SOURCE_KEY, label: "来源", numeric: false, type: "category" }]
        : []),
      ...columnsOf(spec),
    ]
    return { rows, columns, added }
  }, [tables, dataset, info?.addedRows, spec])

  const counts = tables
    ? {
        context: tables.context.rows.length,
        samples: tables.samples.rows.length,
      }
    : null
  const title = dataset === "context" ? "上下文数据" : "测试记录"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full data-[side=right]:sm:max-w-[min(1200px,94vw)]"
      >
        <SheetHeader>
          <SheetTitle>查看数据</SheetTitle>
          <SheetDescription>
            {dataset === "context"
              ? `LimiX 预测时参考的历史记录${data?.added ? `，演示中新加入的 ${data.added} 条排在最前面` : ""}。`
              : `模型没见过这些记录的${spec.target.label}，演示时用来对答案。`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap items-center gap-4 px-6 pt-4">
          <ToggleGroup
            variant="segmented"
            aria-label="数据"
            value={[dataset]}
            onValueChange={(next) => next[0] && setDataset(next[0] as Dataset)}
          >
            <ToggleGroupItem value="context">
              上下文{counts ? ` ${counts.context}` : ""}
            </ToggleGroupItem>
            <ToggleGroupItem value="samples">
              测试记录{counts ? ` ${counts.samples}` : ""}
            </ToggleGroupItem>
          </ToggleGroup>
          <label className="inline-flex items-center gap-2 text-[13px]">
            <Switch
              size="sm"
              checked={profiles}
              onCheckedChange={setProfiles}
            />
            列分布
          </label>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            render={
              <a
                href={
                  dataset === "context" ? contextHref : `/${spec.samplesFile}`
                }
                download
              />
            }
            nativeButton={false}
          >
            <Download
              data-icon="inline-start"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            下载 CSV
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 pt-4 pb-6">
          {error ? (
            <p className="m-0 text-sm text-destructive">{error}</p>
          ) : !data ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <DataGridPreview
              key={dataset}
              columns={data.columns}
              rows={data.rows}
              profiles={profiles}
              title={title}
              className="min-h-0 flex-1"
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// 输入列在前、目标列在后，标签带单位；目标列标「预测目标」。
function columnsOf(spec: InstantSpec): PreviewColumn[] {
  return [
    ...spec.features.map((f) => ({
      key: f.key,
      label: f.unit ? `${f.label}（${f.unit}）` : f.label,
      numeric: true,
      type: "numeric",
    })),
    {
      key: spec.target.key,
      label: spec.target.unit ? `${spec.target.label}（${spec.target.unit}）` : spec.target.label,
      numeric: true,
      type: "numeric",
      role: "target" as const,
    },
  ]
}
