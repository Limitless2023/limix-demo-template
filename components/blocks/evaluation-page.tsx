"use client"

import * as React from "react"
import { ArrowLeft, Download, Info } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EChart, type ChartTokens } from "@/components/ui/echart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Stat } from "@/components/ui/stat"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

// 评估与结果页：返回 → 页面标题区 → 基线选择 → 指标卡行 → 模型对比表 → 预测与实际图 7 + 分工况表 5 → 弱项提示（规则见页型「评估与结果页」）。
// 放在 AppShell 的内容区里使用；基线是页面级状态，切换后指标卡、对比表差值列与分工况表即时重算。

type ModelKey = "ts2" | "ts1" | "xgb" | "mes"
type BaselineKey = Exclude<ModelKey, "ts2">
type Model = { name: string; type: string; mape: number; r2: number; rmse: number; train: number | null; infer: number; pred: number[] }

// 示例数据，不代表真实评测结果。pred 为验证集最近 11 个采样点的预测值（kN）。
const MODELS: Record<ModelKey, Model> = {
  ts2: { name: "LimiX-TS v2", type: "时序", mape: 2.1, r2: 0.96, rmse: 38.4, train: 6.2, infer: 12, pred: [1296, 1424, 1432, 1520, 1528, 1616, 1608, 1672, 1680, 1728, 1736] },
  ts1: { name: "LimiX-TS v1", type: "时序", mape: 2.6, r2: 0.94, rmse: 44.1, train: 5.8, infer: 11, pred: [1290, 1410, 1440, 1510, 1540, 1600, 1620, 1660, 1700, 1720, 1750] },
  xgb: { name: "XGBoost 基线", type: "表格", mape: 3.4, r2: 0.91, rmse: 55.6, train: 2.1, infer: 9, pred: [1360, 1392, 1472, 1480, 1560, 1552, 1640, 1624, 1712, 1688, 1760] },
  mes: { name: "MES 规则", type: "规则", mape: 5.6, r2: 0.78, rmse: 81.3, train: null, infer: 2, pred: [1380, 1380, 1460, 1460, 1540, 1540, 1620, 1620, 1700, 1700, 1760] },
}
const CURRENT: ModelKey = "ts2"
const ACTUAL = [1320, 1440, 1408, 1536, 1504, 1640, 1584, 1696, 1664, 1744, 1712]
const BASELINES: { value: BaselineKey; label: string }[] = [
  { value: "xgb", label: "XGBoost 基线" },
  { value: "mes", label: "MES 规则" },
  { value: "ts1", label: "上一版本 LimiX-TS v1" },
]
// 分工况 MAPE (%)，以及各工况误差最高的时段；高于弱项阈值时插入提示。
const CONDITIONS: { name: string; mape: Record<ModelKey, number>; peak: { slot: string; mape: number } }[] = [
  { name: "工况 A", mape: { ts2: 1.8, ts1: 2.2, xgb: 2.9, mes: 4.8 }, peak: { slot: "12–16", mape: 2.4 } },
  { name: "工况 B", mape: { ts2: 2.4, ts1: 2.9, xgb: 3.7, mes: 5.9 }, peak: { slot: "12–16", mape: 3.8 } },
  { name: "工况 C", mape: { ts2: 2.3, ts1: 2.8, xgb: 3.8, mes: 6.4 }, peak: { slot: "16–20", mape: 4.6 } },
]
const WEAK_THRESHOLD = 4.0

// 差值一律「当前 − 基线」，带正负号；好坏靠文案，不用红绿。
function diff(current: number, base: number, digits: number, lowerBetter: boolean) {
  const d = current - base
  const same = Math.abs(d) < 1e-9
  const text = `${same ? "" : d > 0 ? "+" : "−"}${Math.abs(d).toFixed(digits)}`
  const verdict = same ? "持平" : (d < 0) === lowerBetter ? "更好" : "更差"
  return { text, verdict }
}

// ---------- 预测与实际：当前 chart-1 2px，实际 chart-2 1.5px，基线预测 chart-baseline 虚线 ----------
// 用 Chart（ECharts）：悬停读出三条读数；切换基线只换虚线那一条。
const TIMES = ["13:10", "13:15", "13:20", "13:25", "13:30", "13:35", "13:40", "13:45", "13:50", "13:55", "14:00"]
const kN = (v: number) => v.toLocaleString("zh-CN")

function PredictionChart({ baseline }: { baseline: BaselineKey }) {
  const option = React.useCallback(
    (t: ChartTokens) => ({
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", valueFormatter: (v: number) => `${kN(v)} kN` },
      xAxis: { type: "category", data: TIMES, boundaryGap: false },
      yAxis: { type: "value", min: 1200, max: 1800, interval: 200, axisLabel: { formatter: kN } },
      series: [
        { name: "实际", type: "line", data: ACTUAL, lineStyle: { width: 1.5 }, color: t["chart-2"] },
        { name: `基线预测（${MODELS[baseline].name}）`, type: "line", data: MODELS[baseline].pred, lineStyle: { width: 1.5, type: "dashed" }, color: t["chart-baseline"] },
        { name: `${MODELS[CURRENT].name} 预测`, type: "line", data: MODELS[CURRENT].pred, lineStyle: { width: 2 }, color: t["chart-1"], z: 3 },
      ],
    }),
    [baseline],
  )
  return (
    <EChart
      height={200}
      ariaLabel={`验证集最近 11 个采样点，${MODELS[CURRENT].name} 预测比${MODELS[baseline].name}预测更贴近实际值`}
      option={option}
    />
  )
}

function KpiSkeleton({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("grid content-start gap-2 rounded-md border border-border bg-card px-4 pt-4 pb-3", className)}>
      <p className="text-[13px] leading-5 text-muted-foreground">{label}</p>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="w-36" />
    </div>
  )
}

function EvaluationPage() {
  const toast = useToast()
  const [baseline, setBaseline] = React.useState<BaselineKey>("xgb")
  const [loading, setLoading] = React.useState(true)
  const [exporting, setExporting] = React.useState(false)

  // 示例：首屏模拟一次加载，演示 Skeleton 与禁用的基线选择；接真实接口时换成请求状态。
  React.useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 800)
    return () => window.clearTimeout(id)
  }, [])

  const current = MODELS[CURRENT]
  const base = MODELS[baseline]
  const keys = Object.keys(MODELS) as ModelKey[]
  const list = keys.map((key) => MODELS[key])
  const trains = list.map((m) => m.train).filter((v): v is number => v != null)
  // 每列最优值加粗，不上色。
  const best = {
    mape: Math.min(...list.map((m) => m.mape)),
    r2: Math.max(...list.map((m) => m.r2)),
    rmse: Math.min(...list.map((m) => m.rmse)),
    train: Math.min(...trains),
    infer: Math.min(...list.map((m) => m.infer)),
  }
  const bold = (on: boolean) => (on ? "font-semibold" : undefined)

  const mape = diff(current.mape, base.mape, 1, true)
  const r2 = diff(current.r2, base.r2, 2, false)
  const rmse = diff(current.rmse, base.rmse, 1, true)
  const infer = diff(current.infer, base.infer, 0, true)
  const kpis = [
    { label: "MAPE", value: current.mape.toFixed(1), unit: "%", delta: `${mape.text} pt`, note: `基线 ${base.mape.toFixed(1)}% · ${mape.verdict}（越低越好）` },
    { label: "R²", value: current.r2.toFixed(2), unit: "", delta: r2.text, note: `基线 ${base.r2.toFixed(2)} · ${r2.verdict}（越高越好）` },
    { label: "RMSE", value: current.rmse.toFixed(1), unit: "kN", delta: `${rmse.text} kN`, note: `基线 ${base.rmse.toFixed(1)} kN · ${rmse.verdict}（越低越好）` },
    { label: "推理耗时", value: String(current.infer), unit: "ms", delta: `${infer.text} ms`, note: `基线 ${base.infer} ms · ${infer.verdict}（越低越好）` },
  ]
  const weak = CONDITIONS.filter((c) => c.peak.mape > WEAK_THRESHOLD)

  const exportReport = () => {
    setExporting(true)
    window.setTimeout(() => {
      setExporting(false)
      toast({ title: "报告已生成", description: "评估结果-热轧轧制力预测.pdf 正在下载（示例）" })
    }, 1200)
  }

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" render={<a href="#" />} nativeButton={false} className="-ml-3">
          <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
          返回评估详情
        </Button>
      </div>

      <PageHeader
        // < sm：操作区独占一行，主操作靠右。
        title={
          <>
            评估结果 · 热轧轧制力预测
            <span className="ml-3 inline-flex gap-2 align-middle">
              <Badge variant="outline">验证集</Badge>
              <Badge variant="secondary">12,840 条</Badge>
            </span>
          </>
        }
        description="LimiX-TS v2 对照三个基线；指标为验证集 2026-06-01 至 06-17，预测步长 24。示例数据，不代表真实评测结果。"
        actions={
          <>
            <Button variant="outline" onClick={() => toast({ title: "已打开新建评估，并预填当前配置（示例）" })}>重新评估</Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>更多</DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-40">
                <DropdownMenuItem onClick={() => toast({ title: "已导出 metrics.csv（示例）" })}>导出指标 CSV</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast({ title: "导出失败", description: "predictions.json 超过 50 MB，缩短时间窗口后重试（示例）", variant: "destructive" })
                  }
                >
                  导出预测 JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ title: "链接已复制（示例）" })}>复制分享链接</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ title: "已归档（示例）" })}>归档结果</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="max-[599px]:ml-auto" disabled={exporting || loading} onClick={exportReport}>
              <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
              {exporting ? "正在生成…" : "导出报告"}
            </Button>
          </>
        }
      />

      {/* 基线选择：一行，切换后差值即时重算，不出现加载态。 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] leading-5 text-muted-foreground">
        <label htmlFor="eval-baseline" className="font-medium text-foreground">对照基线</label>
        <NativeSelect id="eval-baseline" value={baseline} disabled={loading} className="w-60 max-[599px]:w-full" onChange={(event) => setBaseline(event.target.value as BaselineKey)}>
          {BASELINES.map((item) => (
            <NativeSelectOption key={item.value} value={item.value}>{item.label}</NativeSelectOption>
          ))}
        </NativeSelect>
        <span>指标卡与对比表的差值都相对所选基线计算：当前 − 基线。</span>
      </div>

      <div aria-busy={loading} className="grid grid-cols-12 gap-[var(--layout-grid-gutter)] max-[599px]:gap-4">
        {kpis.map((kpi) =>
          loading ? (
            <KpiSkeleton key={kpi.label} label={kpi.label} className="col-span-12 min-[600px]:col-span-6 min-[1100px]:col-span-3" />
          ) : (
            <Stat
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit || undefined}
              delta={kpi.delta}
              note={kpi.note}
              className="col-span-12 min-[600px]:col-span-6 min-[1100px]:col-span-3"
            />
          ),
        )}

        {/* 模型对比表：整行；当前模型为选中行，基线行不高亮；窄屏横向滚动，模型列固定在最左。 */}
        <Card className="col-span-12 min-w-0 gap-4 max-[599px]:py-4">
          <CardHeader className="max-[599px]:px-4">
            <CardTitle>模型对比</CardTitle>
            <CardDescription>当前模型与全部基线在同一验证集上的指标；每列最优值加粗。</CardDescription>
          </CardHeader>
          <CardContent className="max-[599px]:px-4">
            <Table>
              <TableCaption>示例数据：训练耗时为单次全量训练，MES 规则无训练记为「—」；MAPE、RMSE、耗时越低越好，R² 越高越好。</TableCaption>
              <TableHeader>
                <TableRow className="whitespace-nowrap hover:bg-transparent">
                  <TableHead className="sticky left-0 z-[var(--z-raised)] bg-muted">模型</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead className="text-right">MAPE (%)</TableHead>
                  <TableHead className="text-right">较基线 (pt)</TableHead>
                  <TableHead className="text-right">R²</TableHead>
                  <TableHead className="text-right">RMSE (kN)</TableHead>
                  <TableHead className="text-right">训练 (min)</TableHead>
                  <TableHead className="text-right">推理 (ms)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? keys.map((key) => (
                      <TableRow key={key}>
                        {Array.from({ length: 8 }, (_, i) => (
                          <TableCell key={i}>
                            <Skeleton className={i === 0 ? "w-28" : "ml-auto w-10"} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : keys.map((key) => {
                      const m = MODELS[key]
                      const isCurrent = key === CURRENT
                      return (
                        <TableRow key={key} data-state={isCurrent ? "selected" : undefined} className="group">
                          <TableCell className="sticky left-0 z-[var(--z-raised)] bg-card whitespace-nowrap group-hover:bg-muted group-data-[state=selected]:bg-accent">
                            <span className="inline-flex items-center gap-2">
                              {m.name}
                              {isCurrent ? <Badge variant="outline" className="bg-background">当前</Badge> : null}
                              {key === baseline ? <Badge variant="outline">基线</Badge> : null}
                            </span>
                          </TableCell>
                          <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                          <TableCell className={cn("text-right font-mono tabular-nums", bold(m.mape === best.mape))}>{m.mape.toFixed(1)}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">{key === baseline ? "—" : diff(m.mape, base.mape, 1, true).text}</TableCell>
                          <TableCell className={cn("text-right font-mono tabular-nums", bold(m.r2 === best.r2))}>{m.r2.toFixed(2)}</TableCell>
                          <TableCell className={cn("text-right font-mono tabular-nums", bold(m.rmse === best.rmse))}>{m.rmse.toFixed(1)}</TableCell>
                          <TableCell className={cn("text-right font-mono tabular-nums", bold(m.train === best.train))}>{m.train == null ? "—" : m.train.toFixed(1)}</TableCell>
                          <TableCell className={cn("text-right font-mono tabular-nums", bold(m.infer === best.infer))}>{m.infer}</TableCell>
                        </TableRow>
                      )
                    })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-12 min-w-0 gap-4 max-[599px]:py-4 min-[1100px]:col-span-7">
          <CardHeader className="max-[599px]:px-4">
            <CardTitle>预测与实际</CardTitle>
            <CardDescription>验证集最近 11 个采样点，轧制力单位 kN。示例数据。</CardDescription>
          </CardHeader>
          <CardContent className="max-[599px]:px-4">
            {loading ? <Skeleton className="h-[200px] w-full" /> : <PredictionChart baseline={baseline} />}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-5 text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <i aria-hidden="true" className="inline-block h-0.5 w-3 bg-chart-1" />
                {current.name} 预测
              </span>
              <span className="inline-flex items-center gap-1">
                <i aria-hidden="true" className="inline-block h-0.5 w-3 bg-chart-2" />
                实际
              </span>
              <span className="inline-flex items-center gap-1">
                <i aria-hidden="true" className="inline-block h-0 w-3 border-t-2 border-dashed border-[var(--chart-baseline)]" />
                基线预测（{base.name}）
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 min-w-0 gap-4 max-[599px]:py-4 min-[1100px]:col-span-5">
          <CardHeader className="max-[599px]:px-4">
            <CardTitle>分工况 MAPE (%)</CardTitle>
            <CardDescription>按工况拆分，找出模型的弱项；差值为当前 − 基线。</CardDescription>
          </CardHeader>
          <CardContent className="max-[599px]:px-4">
            <Table>
              <TableHeader>
                <TableRow className="whitespace-nowrap hover:bg-transparent">
                  <TableHead>工况</TableHead>
                  <TableHead className="text-right">当前 (%)</TableHead>
                  <TableHead className="text-right">基线 (%)</TableHead>
                  <TableHead className="text-right">差值 (pt)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CONDITIONS.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="whitespace-nowrap">{c.name}</TableCell>
                    {loading ? (
                      [0, 1, 2].map((i) => (
                        <TableCell key={i}>
                          <Skeleton className="ml-auto w-8" />
                        </TableCell>
                      ))
                    ) : (
                      <>
                        <TableCell className="text-right font-mono tabular-nums">{c.mape[CURRENT].toFixed(1)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{c.mape[baseline].toFixed(1)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{diff(c.mape[CURRENT], c.mape[baseline], 1, true).text}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 弱项提示：某工况时段 MAPE 高于阈值时插入，放在网格最后一行；没有弱项时不渲染。 */}
        {!loading
          ? weak.map((c) => {
              const verdict = diff(c.mape[CURRENT], c.mape[baseline], 1, true).verdict
              return (
                <Alert key={c.name} role="status" className="col-span-12">
                  <Info strokeWidth={1.5} aria-hidden="true" />
                  <AlertTitle>{`${c.name} ${c.peak.slot} 时段误差偏高`}</AlertTitle>
                  <AlertDescription>
                    {`整体 MAPE ${c.mape[CURRENT].toFixed(1)}%，较${base.name}${verdict}，但 ${c.peak.slot} 时段达 ${c.peak.mape.toFixed(1)}%（弱项阈值 ${WEAK_THRESHOLD.toFixed(1)}%）；建议补充该时段样本后重新评估。示例数据。`}
                  </AlertDescription>
                </Alert>
              )
            })
          : null}
      </div>
    </>
  )
}

export { EvaluationPage }
