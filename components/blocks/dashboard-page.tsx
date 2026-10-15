"use client"

import * as React from "react"
import { TriangleAlert } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { EChart, type ChartTokens } from "@/components/ui/echart"
import { Skeleton } from "@/components/ui/skeleton"
import { Stat } from "@/components/ui/stat"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

// 总览 / 仪表盘：页面标题区（时间范围）→ 指标卡行 → 图表卡行（折线 8 + 柱状 4）→ 热力 7 + 最近记录 5（规则见页型「总览 / 仪表盘」）。
// 放在 AppShell 的内容区里使用；时间范围是页面级状态，所有卡片同步切换。
// 示例里各范围分别演示一种状态：近 24 小时 = 告警 + 热力无数据，近 7 天 = 正常，近 30 天 = 柱状卡失败可重试。

type RangeKey = "d1" | "d7" | "d30"
type Kpi = { label: string; value: string; unit: string; delta: string; note: string; trend: number[]; baseline?: number; alert?: boolean }
type RangeData = {
  kpi: Kpi[]
  series: [number[], number[], number[]]
  axis: string[]
  bars: number[]
  heat: number[][] | null
  barsFail?: boolean
}

const RANGES: { value: RangeKey; label: string }[] = [
  { value: "d1", label: "近 24 小时" },
  { value: "d7", label: "近 7 天" },
  { value: "d30", label: "近 30 天" },
]

const SERIES: { name: string; swatch: string; token: "chart-1" | "chart-2" | "chart-3"; width: number }[] = [
  { name: "LimiX-TS v2", swatch: "bg-chart-1", token: "chart-1", width: 2 },
  { name: "XGBoost 基线", swatch: "bg-chart-2", token: "chart-2", width: 1.5 },
  { name: "MES 规则", swatch: "bg-chart-3", token: "chart-3", width: 1.5 },
]
const THRESHOLD = 3.0
const CONDITIONS = ["工况 A", "工况 B", "工况 C"]
const SLOTS = ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"]
// 最近 7 个班次（示例）：横轴取班次首字，提示框读出完整「日期 班次」。
const SHIFTS = ["6/16 早班", "6/16 中班", "6/16 夜班", "6/17 早班", "6/17 中班", "6/17 夜班", "6/18 早班"]
const CHART_HEIGHT = 220
// 热力分档 chart-seq-1…5 浅到深；深两档上的数字用 primary-foreground。
const SEQ = [
  "bg-[var(--chart-seq-1)]",
  "bg-[var(--chart-seq-2)]",
  "bg-[var(--chart-seq-3)]",
  "bg-[var(--chart-seq-4)] text-primary-foreground",
  "bg-[var(--chart-seq-5)] text-primary-foreground",
]
const level = (value: number) => (value < 2 ? 0 : value < 2.5 ? 1 : value < 3 ? 2 : value < 4 ? 3 : 4)

// 示例数据，不代表真实运行情况。
const HEAT = [
  [1.6, 1.8, 2.0, 2.4, 2.1, 1.9],
  [2.2, 2.6, 3.1, 3.8, 3.2, 2.7],
  [1.9, 2.3, 2.8, 3.4, 4.6, 3.0],
]
const DATA: Record<RangeKey, RangeData> = {
  d1: {
    kpi: [
      { label: "在线预测次数", value: "14,208", unit: "次", delta: "+3.2%", note: "较前 24 小时", trend: [1180, 1240, 1310, 1290, 1420, 1380, 1460] },
      { label: "平均 MAPE", value: "2.3", unit: "%", delta: "−0.2 pt", note: "优于阈值 3.0%", trend: [2.8, 2.6, 2.7, 2.4, 2.5, 2.2, 2.3, 2.1, 2.4, 2.2, 2.0, 2.3], baseline: THRESHOLD },
      { label: "告警", value: "4", unit: "条", delta: "+1", note: "2 条待处理", trend: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0] },
      { label: "数据延迟", value: "72", unit: "s", delta: "+34 s", note: "超过阈值 60 s，较前 24 小时", trend: [36, 38, 35, 40, 42, 39, 44, 48, 55, 61, 68, 72], baseline: 60, alert: true },
    ],
    series: [
      [2.8, 2.6, 2.7, 2.4, 2.5, 2.2, 2.3, 2.1, 2.4, 2.2, 2.0, 2.3],
      [3.4, 3.5, 3.3, 3.6, 3.4, 3.5, 3.7, 3.4, 3.3, 3.5, 3.6, 3.4],
      [5.2, 5.4, 5.1, 5.6, 5.3, 5.5, 5.8, 5.4, 5.2, 5.5, 5.7, 5.4],
    ],
    axis: ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"],
    bars: [1180, 1240, 1310, 1290, 1420, 1380, 1460],
    heat: null,
  },
  d7: {
    kpi: [
      { label: "在线预测次数", value: "98,640", unit: "次", delta: "+8.1%", note: "较前 7 天", trend: [8120, 8460, 8390, 8720, 8810, 9040, 9120] },
      { label: "平均 MAPE", value: "2.1", unit: "%", delta: "−0.4 pt", note: "优于阈值 3.0%", trend: [2.6, 2.4, 2.5, 2.2, 2.3, 2.0, 2.1], baseline: THRESHOLD },
      { label: "告警", value: "21", unit: "条", delta: "−5", note: "3 条待处理", trend: [4, 3, 5, 2, 3, 2, 2] },
      { label: "数据延迟", value: "41", unit: "s", delta: "+2 s", note: "阈值 60 s", trend: [39, 40, 42, 38, 41, 43, 41], baseline: 60 },
    ],
    series: [
      [2.6, 2.4, 2.5, 2.2, 2.3, 2.0, 2.1],
      [3.5, 3.4, 3.6, 3.4, 3.3, 3.5, 3.4],
      [5.6, 5.3, 5.5, 5.8, 5.4, 5.2, 5.5],
    ],
    axis: ["6/12", "6/13", "6/14", "6/15", "6/16", "6/17", "6/18"],
    bars: [8120, 8460, 8390, 8720, 8810, 9040, 9120],
    heat: HEAT,
  },
  d30: {
    kpi: [
      { label: "在线预测次数", value: "412,900", unit: "次", delta: "+12.4%", note: "较前 30 天", trend: [31200, 32800, 33100, 34600, 35900, 36400, 37800] },
      { label: "平均 MAPE", value: "2.2", unit: "%", delta: "−0.6 pt", note: "优于阈值 3.0%", trend: [3.0, 2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.2, 2.1], baseline: THRESHOLD },
      { label: "告警", value: "86", unit: "条", delta: "−18", note: "3 条待处理", trend: [11, 10, 9, 9, 8, 9, 8, 8, 7, 7] },
      { label: "数据延迟", value: "40", unit: "s", delta: "−3 s", note: "阈值 60 s", trend: [43, 42, 41, 41, 40, 40, 39, 40, 40, 40], baseline: 60 },
    ],
    series: [
      [3.0, 2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.2, 2.1],
      [3.6, 3.5, 3.5, 3.4, 3.4, 3.5, 3.4, 3.3, 3.4, 3.4],
      [5.8, 5.6, 5.5, 5.5, 5.4, 5.6, 5.3, 5.4, 5.5, 5.4],
    ],
    axis: ["5/20", "5/23", "5/26", "5/29", "6/1", "6/4", "6/7", "6/10", "6/13", "6/16"],
    bars: [31200, 32800, 33100, 34600, 35900, 36400, 37800],
    heat: HEAT,
    barsFail: true,
  },
}

const RECENT: { name: string; status: string; variant: "outline" | "accent" | "destructive"; mape: number | null }[] = [
  { name: "热轧轧制力预测", status: "已完成", variant: "outline", mape: 2.1 },
  { name: "锅炉负荷 24h 预测", status: "运行中", variant: "accent", mape: null },
  { name: "连铸坯缺陷分类", status: "已完成", variant: "outline", mape: 3.4 },
  { name: "轧辊磨损趋势", status: "失败", variant: "destructive", mape: null },
]

const fmt = (value: number) => value.toLocaleString("zh-CN")

// ---------- 卡片外壳：< sm 内边距收为 space-4 ----------
function ChartCard({
  title,
  description,
  footer,
  className,
  children,
}: {
  title: string
  description?: string
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn("min-w-0 gap-4 max-[599px]:py-4", className)}>
      <CardHeader className="max-[599px]:px-4">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="max-[599px]:px-4">{children}</CardContent>
      {footer ? <CardFooter className="max-[599px]:px-4">{footer}</CardFooter> : null}
    </Card>
  )
}

function Legend({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-5 text-muted-foreground">{children}</div>
}

// ---------- 主图：多系列折线 + 阈值虚线（Chart / ECharts，悬停读出三套模型同一时点的 MAPE） ----------
function MapeChart({ data }: { data: RangeData }) {
  const option = React.useCallback(
    (t: ChartTokens) => ({
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", valueFormatter: (v: number) => `${v.toFixed(1)}%` },
      xAxis: { type: "category", data: data.axis, boundaryGap: false },
      yAxis: { type: "value", min: 1, max: 6, interval: 1, axisLabel: { formatter: "{value}%" } },
      // 主系列 chart-1 线更粗且压在最上层；阈值 3.0% 为 chart-baseline 虚线。
      series: data.series.map((values, i) => ({
        name: SERIES[i].name,
        type: "line",
        data: values,
        z: 3 - i,
        color: t[SERIES[i].token],
        lineStyle: { width: SERIES[i].width },
        markLine:
          i === 0
            ? { symbol: "none", silent: true, lineStyle: { color: t["chart-baseline"], type: "dashed", width: 1.5 }, label: { show: false }, data: [{ yAxis: THRESHOLD }] }
            : undefined,
      })),
    }),
    [data],
  )
  return <EChart height={CHART_HEIGHT} ariaLabel="三套模型的验证 MAPE 折线，LimiX-TS v2 全程低于阈值 3.0%" option={option} />
}

// ---------- 副图：最近 7 个班次调用量柱状，数值标在柱顶；横轴只写班次，悬停读出日期与班次 ----------
function ShiftChart({ values }: { values: number[] }) {
  const option = React.useCallback(
    (t: ChartTokens) => ({
      grid: { left: 8, right: 8, top: 24, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v: number) => `${fmt(v)} 次` },
      xAxis: { type: "category", data: SHIFTS, axisLabel: { formatter: (v: string) => v.split(" ")[1].charAt(0) } },
      yAxis: { type: "value", show: false },
      series: [
        {
          name: "推理次数",
          type: "bar",
          data: values,
          barMaxWidth: 24,
          color: t["chart-1"],
          label: { show: true, position: "top", color: t["chart-axis"], fontFamily: t["font-mono"], fontSize: 10, formatter: (p: { value: number }) => fmt(p.value) },
        },
      ],
    }),
    [values],
  )
  return <EChart height={CHART_HEIGHT} ariaLabel={`最近 7 个班次的推理次数，数值标在柱顶：${values.map(fmt).join("、")}`} option={option} />
}

// ---------- 热力图：工况 × 时段，原生表格便于读屏 ----------
function Heatmap({ rows }: { rows: number[][] }) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 text-xs tracking-[0.04em] text-muted-foreground">
          <caption className="sr-only">分工况 MAPE (%)，行为工况，列为时段</caption>
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">工况</span></th>
              {SLOTS.map((slot) => (
                <th key={slot} scope="col" className="px-1 py-1 font-normal whitespace-nowrap max-[599px]:text-[10px]">{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={CONDITIONS[r]}>
                <th scope="row" className="pr-2 text-left font-normal whitespace-nowrap">{CONDITIONS[r]}</th>
                {row.map((value, c) => (
                  <td
                    key={SLOTS[c]}
                    className={cn(
                      "h-7 rounded-[2px] text-center font-mono text-[11px] tracking-normal text-foreground tabular-nums max-[599px]:h-6 max-[599px]:text-[10px]",
                      SEQ[level(value)],
                    )}
                  >
                    {value.toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 色阶标尺与范围说明必须在图下。 */}
      <div className="mt-3 flex flex-wrap items-center gap-1 text-xs tracking-[0.04em] text-muted-foreground">
        <span className="mr-1">&lt; 2.0</span>
        {SEQ.map((tone) => (
          <i key={tone} aria-hidden="true" className={cn("inline-block h-2.5 w-5 rounded-[2px]", tone)} />
        ))}
        <span className="ml-1">≥ 4.0</span>
        <span className="ml-3">分档：2.0 / 2.5 / 3.0 / 4.0</span>
      </div>
    </>
  )
}

function KpiSkeleton({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("grid content-start gap-2 rounded-md border border-border bg-card px-4 pt-4 pb-3", className)}>
      <p className="text-[13px] leading-5 text-muted-foreground">{label}</p>
      <Skeleton className="h-8 w-28" />
      <Skeleton className="w-36" />
      <Skeleton className="mt-2 h-8 w-full" />
    </div>
  )
}

function DashboardPage() {
  const toast = useToast()
  const [range, setRange] = React.useState<RangeKey>("d7")
  const [pending, setPending] = React.useState<RangeKey | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [barsRetried, setBarsRetried] = React.useState(false)
  const [barsLoading, setBarsLoading] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)

  // 示例：首屏模拟一次加载，演示 Skeleton 占位；接真实接口时换成请求状态。
  React.useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 800)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(timer.current)
    }
  }, [])

  // 切换范围：旧图保留并降低不透明度，Tabs 保持可用；新数据到达后整体替换。
  const changeRange = (value: string) => {
    const next = value as RangeKey
    window.clearTimeout(timer.current)
    if (next === range) {
      setPending(null)
      return
    }
    setPending(next)
    timer.current = window.setTimeout(() => {
      setRange(next)
      setPending(null)
    }, 600)
  }
  const retryBars = () => {
    setBarsLoading(true)
    window.setTimeout(() => {
      setBarsRetried(true)
      setBarsLoading(false)
    }, 600)
  }

  const data = DATA[range]
  const label = RANGES.find((item) => item.value === range)?.label
  const switching = pending !== null
  const dim = cn("transition-opacity duration-[var(--duration-base)] motion-reduce:transition-none", switching && "opacity-50")
  const chartSkeleton = <Skeleton className="h-[220px] w-full" />

  let bars: React.ReactNode
  if (loading || barsLoading) bars = chartSkeleton
  else if (data.barsFail && !barsRetried)
    bars = (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-[13px] leading-5">
        <TriangleAlert className="size-4 shrink-0 text-destructive" strokeWidth={1.5} aria-hidden="true" />
        <span className="flex-1">班次数据加载失败：数据服务响应超时。</span>
        <Button variant="outline" size="sm" onClick={retryBars}>重试</Button>
      </div>
    )
  else bars = <ShiftChart values={data.bars} />

  return (
    <>
      <PageHeader
        title="总览"
        description="热轧产线 2 · 在线模型运行情况。示例数据，不代表真实运行情况。"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* 时间范围决定所有卡片的口径；Tabs 只作分段控件，不带内容面板。 */}
            <Tabs value={pending ?? range} onValueChange={changeRange}>
              <TabsList aria-label="时间范围">
                {RANGES.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <span className="text-[13px] leading-5 text-muted-foreground tabular-nums" aria-live="polite">
              {switching ? "正在更新…" : `更新于 2026-06-18 14:05 · ${label}`}
            </span>
            <Button variant="outline" size="sm" onClick={() => toast({ title: `已导出总览快照（${label}，示例）` })}>导出快照</Button>
          </div>
        }
      />

      {/* 12 列栅格：指标卡 4 × 3；主图 8 + 副图 4；热力 7 + 表 5。md 指标卡 2 × 6、其余整行；< sm 全部整行。 */}
      <div aria-busy={loading || switching} className="grid grid-cols-12 gap-[var(--layout-grid-gutter)] max-[599px]:gap-4">
        {data.kpi.map((kpi) =>
          loading ? (
            <KpiSkeleton key={kpi.label} label={kpi.label} className="col-span-12 min-[600px]:col-span-6 min-[1100px]:col-span-3" />
          ) : (
            <Stat
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              delta={kpi.delta}
              note={kpi.note}
              trend={kpi.trend}
              trendBaseline={kpi.baseline}
              state={kpi.alert ? "alert" : "default"}
              className={cn("col-span-12 min-[600px]:col-span-6 min-[1100px]:col-span-3", dim)}
            />
          ),
        )}

        <ChartCard
          title="验证 MAPE 走势"
          description={`三套模型在同一验证窗口的 MAPE (%)，${label}；越低越好。示例数据。`}
          className={cn("col-span-12 min-[1100px]:col-span-8", dim)}
        >
          {loading ? chartSkeleton : <MapeChart data={data} />}
          <Legend>
            {SERIES.map((item) => (
              <span key={item.name} className="inline-flex items-center gap-1">
                <i aria-hidden="true" className={cn("inline-block h-0.5 w-3", item.swatch)} />
                {item.name}
              </span>
            ))}
            <span className="inline-flex items-center gap-1">
              <i aria-hidden="true" className="inline-block h-0 w-3 border-t-2 border-dashed border-[var(--chart-baseline)]" />
              阈值 3.0%
            </span>
          </Legend>
        </ChartCard>

        <ChartCard title="按班次调用量" description="最近 7 个班次的推理次数；悬停查看日期。示例数据。" className={cn("col-span-12 min-[1100px]:col-span-4", dim)}>
          {bars}
        </ChartCard>

        <ChartCard
          title="分工况 MAPE 热力"
          description="行为工况，列为 4 小时时段；数值为 MAPE (%)，颜色由浅到深表示误差由低到高。示例数据。"
          className={cn("col-span-12 min-[1100px]:col-span-7", dim)}
        >
          {loading ? (
            <div className="grid gap-1">
              {CONDITIONS.map((name) => <Skeleton key={name} className="h-7 w-full" />)}
            </div>
          ) : data.heat ? (
            <Heatmap rows={data.heat} />
          ) : (
            // 无数据：不画空坐标轴，只给一句说明。
            <p className="py-6 text-center text-[13px] leading-5 text-muted-foreground">该范围内没有数据：分工况统计按日汇总，近 24 小时尚未生成。</p>
          )}
        </ChartCard>

        <ChartCard
          title="最近评估"
          className={cn("col-span-12 min-[1100px]:col-span-5", dim)}
          footer={<Button variant="link" render={<a href="#" />} nativeButton={false} className="text-[13px]">查看全部评估</Button>}
        >
          <Table>
            <TableHeader>
              <TableRow className="whitespace-nowrap hover:bg-transparent">
                <TableHead>评估</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">MAPE (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENT.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="whitespace-nowrap">{loading ? <Skeleton className="w-28" /> : row.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{loading ? <Skeleton className="w-12" /> : <Badge variant={row.variant}>{row.status}</Badge>}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{loading ? <Skeleton className="ml-auto w-8" /> : row.mape == null ? "—" : row.mape.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartCard>
      </div>
    </>
  )
}

export { DashboardPage }
