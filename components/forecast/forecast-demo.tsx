/**
 * [INPUT]: 依赖 @/components/ui 的 Alert、Badge、Button、Card、FanChart、Field、Stat、Table、ToggleGroup、Skeleton；
 *          依赖 @/lib/forecast-types 的 ForecastSpec、ForecastObject、ForecastResult；调用本站 GET / POST /api/forecast
 * [OUTPUT]: 导出 ForecastDemo 组件
 * [POS]: 「时序预测」演示模式的主体，场景页「在线预测」标签页的内容（components/scenario/scenario-page.tsx 按 mode 分发，按预测对象重挂）。
 *        用样例时选预测日（样例最后几天、有实测的），预测日之前的历史与当天的已知输入一起交给 LimiX，结果与实测对账；
 *        也可以上传自己的表：目标列为空的尾部行就是要预测的点位。页头与模拟提示在 components/scenario。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { CircleAlert, Play, RotateCcw, Upload } from "lucide-react"

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
import type { ForecastResult, ForecastSpec } from "@/lib/forecast-types"
import { PAGE_SESSION } from "@/lib/page-session"

const MAX_UPLOAD_CHARS = 4 * 1024 * 1024
const TABLE_ROWS = 24

type SampleInfo = { name: string; rows: number; days: string[] }
type Upload = { name: string; csv: string }

export function ForecastDemo({ spec, objectKey }: { spec: ForecastSpec; objectKey: string }) {
  const obj = spec.objects.find((o) => o.key === objectKey) ?? spec.objects[0]
  const f = obj.forecast
  const [info, setInfo] = React.useState<SampleInfo | null>(null)
  const [day, setDay] = React.useState<string | null>(null)
  const [horizon, setHorizon] = React.useState(String(f.horizons[0]))
  const [upload, setUpload] = React.useState<Upload | null>(null)
  const [running, setRunning] = React.useState<number | null>(null)
  const [now, setNow] = React.useState(0)
  const [result, setResult] = React.useState<ForecastResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetch(`/api/forecast?scenario=${spec.slug}&object=${obj.key}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.error) throw new Error(body.error)
        setInfo(body)
        setDay(body.days[0] ?? null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "样例信息加载失败"))
  }, [spec.slug, obj.key])

  // 预测进行中每秒刷新一次已用时间
  React.useEffect(() => {
    if (running == null) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  const run = async () => {
    const started = Date.now()
    setRunning(started)
    setNow(started)
    setError(null)
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: spec.slug,
          object: obj.key,
          horizon: Number(horizon),
          session: PAGE_SESSION,
          ...(upload ? { csv: upload.csv, filename: upload.name } : day ? { start: day } : {}),
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || `请求失败（HTTP ${res.status}）`)
      setResult(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : "预测失败")
    } finally {
      setRunning(null)
    }
  }

  const pick = async (file: File) => {
    const csv = await file.text()
    if (csv.length > MAX_UPLOAD_CHARS) return setError("上传的表超过 4 MB，请先截取")
    setError(null)
    setResult(null)
    setUpload({ name: file.name, csv })
  }

  const rows = result?.rows ?? []
  const withActual = rows.filter((r) => r.actual != null)
  const mae = withActual.length ? withActual.reduce((s, r) => s + Math.abs(r.p50 - r.actual!), 0) / withActual.length : null
  const inBand = withActual.filter((r) => r.actual! >= r.low && r.actual! <= r.high).length
  const peak = rows.reduce<(typeof rows)[number] | null>((best, r) => (!best || r.p50 > best.p50 ? r : best), null)
  const avgBand = rows.length ? rows.reduce((s, r) => s + (r.high - r.low), 0) / rows.length : 0
  const fmt = (v: number) => Math.round(v).toLocaleString("zh-CN")
  const hm = (t: string) => t.slice(5, 16)
  const md = (d: string) => `${Number(d.slice(5, 7))} 月 ${Number(d.slice(8, 10))} 日`
  const contextDays = Math.round(f.contextSize / f.perDay)
  const elapsed = running != null ? Math.max(0, Math.round((now - running) / 1000)) : 0

  return (
    <div className="flex flex-col gap-6">
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
          <CardDescription>
            {upload
              ? `用上传的表预测：${f.colDate}（时间）与 ${f.colTarget}（${f.targetLabel}）两列必填；要预测的点位放在最后、${f.colTarget} 留空，其他列填上已知的未来数据。`
              : f.known.length
                ? `预测日之前 ${contextDays} 天作历史，预测日当天的 ${f.known.length} 列已知数据随点位一起上传。`
                : `最近 ${f.contextSize} ${f.step}作历史，只用${f.targetLabel}本身。`}
          </CardDescription>
          <CardAction>
            <Button onClick={() => void run()} disabled={running != null || (!upload && !info)}>
              <Play data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
              {running != null ? `正在预测 · ${elapsed} 秒` : "运行预测"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-x-8 gap-y-6">
          <Field className="w-auto min-w-0 flex-1">
            <FieldLabel>数据</FieldLabel>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {upload ? <span>{upload.name}</span> : info ? <span>{info.name}</span> : <Skeleton className="h-4 w-56" />}
              {!upload && info ? <Badge variant="outline">{info.rows.toLocaleString("zh-CN")} 行</Badge> : null}
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
                上传 CSV
              </Button>
              {upload ? (
                <Button variant="ghost" size="sm" onClick={() => (setUpload(null), setResult(null))}>
                  <RotateCcw data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
                  换回样例
                </Button>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void pick(file)
                  e.target.value = ""
                }}
              />
            </div>
          </Field>
          {!upload && info?.days.length ? (
            <Field className="w-auto">
              <FieldLabel id="forecast-day">预测日</FieldLabel>
              <ToggleGroup variant="segmented" aria-labelledby="forecast-day" value={day ? [day] : []} onValueChange={(next) => next[0] && setDay(next[0])}>
                {[...info.days].reverse().map((d) => (
                  <ToggleGroupItem key={d} value={d}>
                    {md(d)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription>这几天都有实测值，预测后直接对账。</FieldDescription>
            </Field>
          ) : null}
          {f.horizons.length > 1 ? (
            <Field className="w-auto">
              <FieldLabel id="forecast-horizon">预测步长</FieldLabel>
              <ToggleGroup variant="segmented" aria-labelledby="forecast-horizon" value={[horizon]} onValueChange={(next) => next[0] && setHorizon(next[0])}>
                {f.horizons.map((h) => (
                  <ToggleGroupItem key={h} value={String(h)}>
                    {h} {f.step}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {mae != null ? (
          <Stat label="与实测对账：平均绝对误差" value={fmt(mae)} unit={f.unit} note={`${inBand} / ${withActual.length} 个点落在 P10–P90 内`} />
        ) : (
          <Stat label="峰值上沿（P90）" value={peak ? fmt(peak.high) : "—"} unit={f.unit} note="留足余量的参考" />
        )}
        <Stat label="预测峰值" value={peak ? fmt(peak.p50) : "—"} unit={f.unit} note={peak ? `出现在 ${hm(peak.time)}` : "运行预测后显示"} />
        <Stat label="平均区间宽度" value={rows.length ? fmt(avgBand) : "—"} unit={f.unit} note="P10–P90，越窄越确定" />
        <Stat
          label="耗时"
          value={result ? (result.elapsedMs / 1000).toFixed(1) : "—"}
          unit="s"
          note={result ? (result.mode === "live" ? `LimiX 实时预测，免训练${result.knownCount ? ` · 带 ${result.knownCount} 列已知输入` : ""}` : "模拟结果") : "上传 → 预测 → 取回"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{f.targetLabel}预测</CardTitle>
          <CardDescription>
            预测起点之前 {result?.history.length ?? f.showHistory} {f.step}的实际{f.targetLabel}与 {rows.length || f.horizons[0]} {f.step}预测；阴影为 P10–P90 区间
            {withActual.length ? "，预测段的实线是实测值" : ""}。
            {!upload && f.gapDays ? `历史只到预测日前 ${f.gapDays + 1} 天：中间 ${f.gapDays} 天的${f.targetLabel}预测时还没公布，图上历史与预测之间隔了这段。` : ""}
          </CardDescription>
          {result ? (
            <CardAction>
              <Badge variant={result.mode === "live" ? "accent" : "outline"}>{result.mode === "live" ? "LimiX 实时结果" : "模拟结果"}</Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {running != null ? (
            <Skeleton className="h-[300px] w-full" />
          ) : result && rows.length ? (
            <FanChart
              history={result.history.map((p) => p.value)}
              forecast={rows.map((r) => ({ p50: r.p50, low: r.low, high: r.high, actual: r.actual }))}
              labels={[...result.history.map((p) => hm(p.time)), ...rows.map((r) => hm(r.time))]}
              unit={f.unit}
              format={fmt}
              height={300}
              zoom
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              点「运行预测」生成{upload ? "" : day ? ` ${md(day)} ` : ""}{f.targetLabel}预测
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">P50（{f.unit}）</TableHead>
              <TableHead className="text-right">P10–P90</TableHead>
              {withActual.length ? <TableHead className="text-right">实测</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, TABLE_ROWS).map((r) => (
              <TableRow key={r.time}>
                <TableCell className="font-mono tabular-nums">{r.time.slice(0, 16)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{fmt(r.p50)}</TableCell>
                <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                  {fmt(r.low)} – {fmt(r.high)}
                </TableCell>
                {withActual.length ? <TableCell className="text-right font-mono tabular-nums">{r.actual != null ? fmt(r.actual) : "—"}</TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>
            前 {Math.min(TABLE_ROWS, rows.length)} 个点，共 {rows.length} 个。{result?.mode === "live" ? `LimiX 任务 ${result.taskId}。` : "模拟结果，仅用于演示流程。"}
          </TableCaption>
        </Table>
      ) : null}
    </div>
  )
}
