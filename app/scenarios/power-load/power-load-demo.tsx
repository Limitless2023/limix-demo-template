"use client"

import * as React from "react"
import { CircleAlert, Info, Play, Upload } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FanChart } from "@/components/ui/fan-chart"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Stat } from "@/components/ui/stat"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { parseCsv } from "@/lib/csv"
import type { ForecastResult } from "@/lib/forecast-types"

// 场景：电力负荷预测（能源电力 · 时序预测）。
// 数据契约：CSV 含时间列 time 与目标列 load_mw（逐小时）；其余列（如温度）原样上传，LimiX 会保留为历史输入。
const SAMPLE = { url: "/samples/power-load.csv", name: "华东某地区逐小时负荷（示例，合成数据）" }
const COL_DATE = "time"
const COL_TARGET = "load_mw"
const CONTEXT_SIZE = 168 // 一周
const HORIZONS = ["24", "48", "72"]
const SHOW_HISTORY = 72

type Source = { csv: string; name: string; filename: string }

export function PowerLoadDemo({ mock }: { mock: boolean }) {
  const [source, setSource] = React.useState<Source | null>(null)
  const [horizon, setHorizon] = React.useState("24")
  const [running, setRunning] = React.useState(false)
  const [result, setResult] = React.useState<ForecastResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetch(SAMPLE.url)
      .then((r) => r.text())
      .then((csv) => setSource({ csv, name: SAMPLE.name, filename: "power-load.csv" }))
      .catch(() => setError("示例数据加载失败"))
  }, [])

  const history = React.useMemo(() => {
    if (!source) return []
    return parseCsv(source.csv).rows.map((r) => ({ time: r[COL_DATE], value: Number(r[COL_TARGET]) }))
  }, [source])

  const run = async () => {
    if (!source) return
    setRunning(true)
    setError(null)
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: source.csv, filename: source.filename, colDate: COL_DATE, colTarget: COL_TARGET, horizon: Number(horizon), contextSize: CONTEXT_SIZE }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || `请求失败（HTTP ${res.status}）`)
      setResult(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : "预测失败")
    } finally {
      setRunning(false)
    }
  }

  const upload = async (file: File) => {
    const csv = await file.text()
    const { columns, rows } = parseCsv(csv)
    if (!columns.includes(COL_DATE) || !columns.includes(COL_TARGET)) {
      setError(`上传的文件需要包含 ${COL_DATE} 与 ${COL_TARGET} 两列，实际列为：${columns.join("、")}`)
      return
    }
    if (rows.length < CONTEXT_SIZE) {
      setError(`至少需要 ${CONTEXT_SIZE} 行历史数据（一周逐小时），实际 ${rows.length} 行`)
      return
    }
    setError(null)
    setResult(null)
    setSource({ csv, name: file.name, filename: file.name })
  }

  const recent = history.slice(-SHOW_HISTORY)
  const rows = result?.rows ?? []
  const peak = rows.reduce<(typeof rows)[number] | null>((best, r) => (!best || r.p50 > best.p50 ? r : best), null)
  const avgBand = rows.length ? rows.reduce((sum, r) => sum + (r.high - r.low), 0) / rows.length : 0
  const fmt = (v: number) => Math.round(v).toLocaleString("zh-CN")
  const hm = (t: string) => t.slice(5, 16) // MM-DD HH:mm

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="能源电力 · 时序预测"
        title="电力负荷预测"
        description="用最近一周的逐小时负荷作为上下文，预测未来 24–72 小时负荷与 P10–P90 区间，支撑日前调度与购电计划。"
        actions={
          <Button onClick={run} disabled={!source || running}>
            <Play data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
            {running ? "正在预测" : "运行预测"}
          </Button>
        }
      />

      {mock ? (
        <Alert role="status">
          <Info strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>模拟结果，未连接 LimiX</AlertTitle>
          <AlertDescription>没有配置 LIMIX_API_KEY，预测由近 7 天同一时刻的均值外推，只用于走通演示流程。配置 Key 后本页直接调用 LimiX。</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <CircleAlert strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>没有拿到预测结果</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>数据与参数</CardTitle>
          <CardDescription>上传自己的 CSV 时，需包含 {COL_DATE}（时间）与 {COL_TARGET}（负荷，MW）两列，逐小时、不少于一周。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1fr_auto]">
          <Field>
            <FieldLabel>数据</FieldLabel>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {source ? <span>{source.name}</span> : <Skeleton className="h-4 w-56" />}
              {source ? <Badge variant="outline">{history.length} 行</Badge> : null}
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
                上传 CSV
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void upload(file)
                  e.target.value = ""
                }}
              />
            </div>
            <FieldDescription>上下文窗口 {CONTEXT_SIZE} 小时（一周）。</FieldDescription>
          </Field>
          <Field className="w-auto">
            <FieldLabel id="horizon-label">预测步长</FieldLabel>
            <ToggleGroup variant="segmented" aria-labelledby="horizon-label" value={[horizon]} onValueChange={(next) => next[0] && setHorizon(next[0])}>
              {HORIZONS.map((h) => (
                <ToggleGroupItem key={h} value={h}>
                  {h} 小时
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="预测峰值" value={peak ? fmt(peak.p50) : "—"} unit="MW" note={peak ? `出现在 ${hm(peak.time)}` : "运行预测后显示"} />
        <Stat label="峰值上沿（P90）" value={peak ? fmt(peak.high) : "—"} unit="MW" note="留足备用容量的参考" />
        <Stat label="平均区间宽度" value={rows.length ? fmt(avgBand) : "—"} unit="MW" note="P10–P90，越窄越确定" />
        <Stat label="耗时" value={result ? (result.elapsedMs / 1000).toFixed(1) : "—"} unit="s" note={result ? (result.mode === "live" ? "LimiX 实时预测，免训练" : "模拟结果") : "上传 → 预测 → 取结果"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>负荷预测</CardTitle>
          <CardDescription>最近 {SHOW_HISTORY} 小时实际负荷与未来 {horizon} 小时预测；阴影为 P10–P90 区间。</CardDescription>
          {result ? (
            <CardAction>
              <Badge variant={result.mode === "live" ? "accent" : "outline"}>{result.mode === "live" ? "LimiX 实时结果" : "模拟结果"}</Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {running ? (
            <Skeleton className="h-[280px] w-full" />
          ) : rows.length ? (
            <FanChart
              history={recent.map((p) => p.value)}
              forecast={rows.map((r) => ({ p50: r.p50, low: r.low, high: r.high }))}
              labels={[...recent.map((p) => hm(p.time)), ...rows.map((r) => hm(r.time))]}
              unit="MW"
              format={fmt}
              height={280}
              zoom
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              点「运行预测」生成未来 {horizon} 小时负荷
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">P50（MW）</TableHead>
              <TableHead className="text-right">P10（MW）</TableHead>
              <TableHead className="text-right">P90（MW）</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 24).map((r) => (
              <TableRow key={r.time}>
                <TableCell className="font-mono tabular-nums">{r.time.slice(0, 16)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(r.p50)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(r.low)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(r.high)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>
            前 24 小时明细。{result?.mode === "live" ? `LimiX 任务 ${result.taskId}，结果版本 ${result.resultVersionId}。` : "模拟结果，仅用于演示流程。"}
          </TableCaption>
        </Table>
      ) : null}
    </div>
  )
}
