/**
 * [INPUT]: 依赖 @/components/ui 的 Badge、Button、Card、Table、ToggleGroup、Switch、Skeleton、DataGridPreview；
 *          依赖 @/lib/csv 的 parseCsv；依赖 @/lib/scenario-spec 的 ScenarioSpec 与各标签常量
 * [OUTPUT]: 导出 DataTab 组件
 * [POS]: components/scenario 的「数据」标签页，回答「这个场景到底有哪些数据」：口径条（来源、规模、时间范围、许可）、
 *        原始数据的说明文档（spec.data.doc，飞书链接）、披露时点（时序场景：预测时拿得到哪些数据，spec.data.timing）、字段表、文件清单（public/samples 可下载）、数据预览（DataGridPreview，可切文件、开关列分布）。
 *        取值范围、时间范围不手写，打开时从上下文文件现算；文件按原样展示，演示中加入的记录只在在线预测的「查看数据」里看。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { Download, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DataGridPreview,
  type PreviewColumn,
} from "@/components/ui/data-grid-preview"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { parseCsv, type CsvTable } from "@/lib/csv"
import {
  FIELD_ROLE_LABEL,
  FILE_ROLE_LABEL,
  resolveObject,
  type FieldDoc,
  type ScenarioSpec,
} from "@/lib/scenario-spec"

export function DataTab({
  spec,
  objectKey,
}: {
  spec: ScenarioSpec
  /** 当前预测对象：文件与字段按对象取 */
  objectKey?: string
}) {
  const { files, fields } = resolveObject(spec, objectKey)
  const [tables, setTables] = React.useState<Record<string, CsvTable> | null>(
    null
  )
  const [error, setError] = React.useState<string | null>(null)
  const [current, setCurrent] = React.useState(files[0]?.path ?? "")
  const [profiles, setProfiles] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    Promise.all(
      files.map((f) =>
        fetch(`/${f.path}`)
          .then((r) => {
            if (!r.ok) throw new Error(`${f.name} 读取失败（HTTP ${r.status}）`)
            return r.text()
          })
          .then((text) => [f.path, parseCsv(text.replace(/^﻿/, ""))] as const)
      )
    )
      .then((entries) => !cancelled && setTables(Object.fromEntries(entries)))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof Error ? e.message : "数据加载失败")
      )
    return () => {
      cancelled = true
    }
  }, [files])

  const context = files.find((f) => f.role === "context")
  const ranges = React.useMemo(
    () => (tables && context ? rangesOf(fields, tables[context.path]) : null),
    [tables, context, fields]
  )
  const timeField = fields.find((f) => f.role === "time")
  const table = tables?.[current]
  const currentFile = files.find((f) => f.path === current)

  return (
    <div className="flex flex-col gap-6">
      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Badge variant="accent">{spec.data.basis}</Badge>
          {files.map((f) => (
            <span key={f.path}>
              {FILE_ROLE_LABEL[f.role]}{" "}
              <span className="font-mono tabular-nums">{f.rows}</span> 条
            </span>
          ))}
          {timeField ? (
            <span>
              时间范围{" "}
              {ranges ? (
                <span className="font-mono tabular-nums">
                  {ranges[timeField.key]}
                </span>
              ) : (
                <Skeleton className="inline-block h-4 w-40 align-middle" />
              )}
            </span>
          ) : null}
          <span className="text-muted-foreground">
            来源：{spec.data.source} · 许可：{spec.data.license}
          </span>
          {spec.data.doc ? (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              render={<a href={spec.data.doc.url} target="_blank" rel="noreferrer" title={spec.data.doc.name} />}
              nativeButton={false}
            >
              <FileText data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
              数据说明
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {spec.data.timing ? (
        <Card>
          <CardHeader>
            <CardTitle>预测时拿得到哪些数据</CardTitle>
            <CardDescription>{spec.data.timing.note}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>数据</TableHead>
                  <TableHead>什么时候公布</TableHead>
                  <TableHead>本场景怎么用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spec.data.timing.rows.map((t) => (
                  <TableRow key={t.data}>
                    <TableCell className="w-[42%] font-medium whitespace-normal">{t.data}</TableCell>
                    <TableCell className="w-[22%] whitespace-normal">{t.when}</TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">{t.use}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>字段</CardTitle>
          <CardDescription>取值范围按上下文文件统计。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>列名</TableHead>
                <TableHead>字段</TableHead>
                <TableHead>含义</TableHead>
                <TableHead>单位</TableHead>
                <TableHead>角色</TableHead>
                <TableHead className="text-right">取值范围</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((f) => (
                <TableRow key={f.key}>
                  <TableCell className="font-mono text-muted-foreground">
                    {f.key}
                  </TableCell>
                  <TableCell className="font-medium">{f.label}</TableCell>
                  <TableCell>{f.note}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {f.unit || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={f.role === "target" ? "accent" : "outline"}>
                      {FIELD_ROLE_LABEL[f.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono whitespace-nowrap tabular-nums">
                    {ranges ? (
                      ranges[f.key]
                    ) : error ? (
                      (f.range ?? "—")
                    ) : (
                      <Skeleton className="ml-auto h-4 w-24" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>文件</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件</TableHead>
                <TableHead>用途</TableHead>
                <TableHead className="text-right">行数</TableHead>
                <TableHead className="text-right">下载</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((f) => (
                <TableRow key={f.path}>
                  <TableCell className="font-mono">{f.name}</TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {FILE_ROLE_LABEL[f.role]}
                    </span>
                    <span className="text-muted-foreground">：{f.note}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {f.rows}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<a href={`/${f.path}`} download={f.name} />}
                      nativeButton={false}
                    >
                      <Download
                        data-icon="inline-start"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      下载
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>数据预览</CardTitle>
          <CardDescription>点直方图的柱子可按档位筛选。</CardDescription>
          <CardAction className="flex flex-wrap items-center gap-4">
            {files.length > 1 ? (
              <ToggleGroup
                variant="segmented"
                aria-label="文件"
                value={[current]}
                onValueChange={(next) => next[0] && setCurrent(next[0])}
              >
                {files.map((f) => (
                  <ToggleGroupItem key={f.path} value={f.path}>
                    {FILE_ROLE_LABEL[f.role]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}
            <label className="inline-flex items-center gap-2 text-[13px]">
              <Switch
                size="sm"
                checked={profiles}
                onCheckedChange={setProfiles}
              />
              列分布
            </label>
          </CardAction>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="m-0 text-sm text-destructive">{error}</p>
          ) : !table ? (
            <Skeleton className="h-[560px] w-full" />
          ) : (
            <DataGridPreview
              key={current}
              columns={columnsOf(table, fields)}
              rows={table.rows}
              profiles={profiles}
              title={currentFile?.name ?? "数据预览"}
              className="h-[560px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// 表头匹配字段：列名等于字段 key，或等于中文表头「标签（单位）」（上传样例用中文表头）；匹配不上的列原样显示
function columnsOf(table: CsvTable, fields: FieldDoc[]): PreviewColumn[] {
  return table.columns.map((col) => {
    const f = fields.find(
      (x) => x.key === col || col === headerOf(x) || col === x.label
    )
    if (!f) return { key: col, label: col }
    return {
      key: col,
      label: headerOf(f),
      ...(f.role === "time" ? { numeric: false, type: "datetime" } : {}),
      ...(f.role === "target" ? { role: "target" as const } : {}),
      ...(f.role === "time" ? { role: "time" as const } : {}),
    }
  })
}

const headerOf = (f: FieldDoc) => (f.unit ? `${f.label}（${f.unit}）` : f.label)

// 取值范围：数值列取最小到最大，时间列取首尾（精确到分钟）；文件里没有这一列时用字段配置的 range
function rangesOf(
  fields: FieldDoc[],
  table?: CsvTable
): Record<string, string> {
  return Object.fromEntries(
    fields.map((f) => {
      const values = table?.columns.includes(f.key)
        ? table.rows.map((r) => r[f.key]).filter((v) => v !== "" && v != null)
        : []
      if (!values.length) return [f.key, f.range ?? "—"]
      if (f.role === "time")
        return [
          f.key,
          `${values[0].slice(0, 16)} 至 ${values[values.length - 1].slice(0, 16)}`,
        ]
      const nums = values.map(Number).filter(Number.isFinite)
      if (!nums.length) return [f.key, f.range ?? "—"]
      return [f.key, `${num(Math.min(...nums))} – ${num(Math.max(...nums))}`]
    })
  )
}

const num = (v: number) => String(Number(v.toFixed(2)))
