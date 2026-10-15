"use client"

import * as React from "react"
import { ArrowLeft, CircleAlert } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { EChart, type ChartTokens } from "@/components/ui/echart"
import { DescriptionList } from "@/components/ui/description-list"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"

// 详情页：返回 → 头部摘要（标题行 + 元信息 + 操作区）→ 指标条 → Tabs 分区 8 列 + 属性栏 4 列（规则见页型「详情页」）。
// 放在 AppShell 的内容区里使用；state 用来查看各状态，接入真实接口后由请求结果决定。

type DetailState = "done" | "running" | "failed" | "loading" | "forbidden"

const STATUS: Record<"done" | "running" | "failed", { label: string; variant: "outline" | "accent" | "destructive" }> = {
  done: { label: "已完成", variant: "outline" },
  running: { label: "运行中", variant: "accent" },
  failed: { label: "失败", variant: "destructive" },
}

// 示例数据，不代表真实评测结果。
const METRICS = [
  { label: "MAPE", value: "2.1%", note: "基线 3.4% · −1.3 pt" },
  { label: "R²", value: "0.96", note: "基线 0.91 · +0.05" },
  { label: "RMSE", value: "38.4 kN", note: "基线 55.6 kN · −17.2 kN" },
  { label: "样本数", value: "128,400", note: "近 90 天 · 1 min" },
]

const FEATURES = [
  { name: "入口厚度", source: "PLC", importance: 0.31, missing: 0.0 },
  { name: "轧制温度", source: "热电偶", importance: 0.24, missing: 0.4 },
  { name: "轧制速度", source: "PLC", importance: 0.18, missing: 0.0 },
  { name: "钢种代码", source: "MES", importance: 0.12, missing: 1.2 },
  { name: "辊径", source: "手工录入", importance: 0.07, missing: 6.8 },
]

const LOG = [
  { time: "2026-06-18 14:02", event: "评估完成，MAPE 2.1%，用时 6 min 12 s" },
  { time: "2026-06-18 13:56", event: "开始推理：验证集 12,840 条" },
  { time: "2026-06-18 13:55", event: "特征校验通过；「辊径」缺失率 6.8%，已按前值填充" },
  { time: "2026-06-18 13:54", event: "周衡 创建评估，复制自 #2035 配置" },
]

const CONFIG = [
  { label: "目标列", value: "rolling_force", mono: true },
  { label: "时间列", value: "ts", mono: true },
  { label: "预测步长", value: "24 步（24 min）" },
  { label: "训练窗口", value: "近 90 天" },
  { label: "输出", value: "点预测 + 90% 置信区间" },
  { label: "基线", value: "XGBoost（默认参数）" },
]

// 预测与实际：验证集最近 11 个采样点（kN）。用 Chart（ECharts），悬停读出每个采样点的两条读数。
const TIMES = ["13:10", "13:15", "13:20", "13:25", "13:30", "13:35", "13:40", "13:45", "13:50", "13:55", "14:00"]
const ACTUAL = [1320, 1440, 1408, 1536, 1504, 1640, 1584, 1696, 1664, 1744, 1712]
const PREDICTED = [1296, 1424, 1432, 1520, 1528, 1616, 1608, 1672, 1680, 1728, 1736]
const kN = (v: number) => v.toLocaleString("zh-CN")
const forecastOption = (t: ChartTokens) => ({
  grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
  tooltip: { trigger: "axis", valueFormatter: (v: number) => `${kN(v)} kN` },
  xAxis: { type: "category", data: TIMES, boundaryGap: false },
  yAxis: { type: "value", min: 1200, max: 1800, interval: 200, axisLabel: { formatter: kN } },
  series: [
    { name: "实际", type: "line", data: ACTUAL, lineStyle: { width: 1.5 }, color: t["chart-2"] },
    // 本方模型用 chart-1、线更粗并压在最上层。
    { name: "预测（LimiX-TS v2）", type: "line", data: PREDICTED, lineStyle: { width: 2 }, color: t["chart-1"], z: 3 },
  ],
})

// Tabs 用 line 变体：底部 2px 主色下划线，不用默认的灰底胶囊。

function DetailPage({ state: initialState = "done" }: { state?: DetailState }) {
  const toast = useToast()
  const [state, setState] = React.useState<DetailState>(initialState)
  const [confirm, setConfirm] = React.useState(false)
  const [tab, setTab] = React.useState("overview")

  const back = (
    <div>
      <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-[var(--primary-text)]" onClick={() => toast({ title: "已返回评估列表（示例）" })}>
        <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
        返回评估列表
      </Button>
    </div>
  )

  // 对象不存在 / 无权限：整个内容区换成页面级状态块，只保留返回。
  if (state === "forbidden") {
    return (
      <>
        {back}
        <Empty>
          <EmptyHeader>
            <EmptyTitle>没有查看此评估的权限</EmptyTitle>
            <EmptyDescription>评估 #2041 属于「热轧产线」项目，你不在该项目成员中。可联系项目负责人周衡申请查看权限。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "已发送权限申请（示例）" })}>申请权限</Button>
          </EmptyContent>
        </Empty>
      </>
    )
  }

  // 加载中：头部与指标条先用 Skeleton 占位；Tabs 与属性栏等数据到达后再渲染。
  if (state === "loading") {
    return (
      <>
        {back}
        <div className="grid gap-3" aria-busy="true" aria-label="正在加载评估">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-[420px] max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border min-[1100px]:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.label} className="grid gap-2 bg-background px-6 py-4 max-[599px]:px-4 max-[599px]:py-3">
              <Skeleton className="w-12" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="w-28 max-w-full" />
            </div>
          ))}
        </div>
      </>
    )
  }

  const status = STATUS[state]
  const running = state === "running"
  const failed = state === "failed"

  const remove = () => {
    setConfirm(false)
    toast({ title: "已删除评估 #2041（示例）" })
  }

  return (
    <>
      {back}

      {/* 头部摘要：标题不重复面包屑，只多状态与类型 Badge；< sm 时操作区独占一行、主操作靠右。 */}
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            热轧轧制力预测
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="secondary">时序</Badge>
          </span>
        }
        description={
          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-mono tabular-nums">评估 #2041</span>
            <span>数据集：热轧产线 · 工况数据集</span>
            <span>模型：LimiX-TS v2</span>
            <span>创建于 2026-06-18 14:02 · 周衡</span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => toast({ title: "已复制评估配置到新建页（示例）" })}>复制配置</Button>
            {/* 删除、归档等不可逆或低频操作只放在「更多」里；删除经 Dialog 确认。 */}
            {/* 触发钮用 default 尺寸，对齐同排按钮。 */}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>更多</DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-40">
                <DropdownMenuItem onClick={() => setState("running")}>重新评估</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ title: "已归档评估 #2041（示例）" })}>归档</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setConfirm(true)}>删除</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {running ? (
              // 进行中：主操作换成 outline「取消评估」，不给 destructive。
              <Button
                variant="outline"
                className="max-[599px]:ml-auto"
                onClick={() => {
                  setState("done")
                  toast({ title: "已取消评估，保留上一次结果（示例）" })
                }}
              >
                取消评估
              </Button>
            ) : (
              <Button className="max-[599px]:ml-auto" disabled={failed} onClick={() => toast({ title: "报告已生成，正在下载（示例）" })}>
                导出报告
              </Button>
            )}
          </>
        }
      />

      {/* 失败：头部下方插入 destructive Alert，给出原因与重试入口；已有的部分结果照常展示。 */}
      {failed ? (
        <div className="relative">
          <Alert variant="destructive" className="pr-32 max-[599px]:pr-4">
            <CircleAlert strokeWidth={1.5} aria-hidden="true" />
            <AlertTitle>评估失败：推理阶段超时</AlertTitle>
            <AlertDescription>验证集第 9,612 条起 PLC 数据断档 42 min，推理在 30 min 限时内未完成。补齐数据或缩短训练窗口后重试；已完成部分的指标仍可查看。</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="absolute top-3 right-3 max-[599px]:static max-[599px]:mt-3" onClick={() => setState("running")}>
            重新评估
          </Button>
        </div>
      ) : null}

      {/* 指标条：≥ lg 4 格一行，其余 2 × 2；数值带单位，对照说明写基线与差值。 */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border min-[1100px]:grid-cols-4">
        {METRICS.map((metric, index) => {
          const pending = index < 3 && (running || failed)
          return (
            <div key={metric.label} className="grid content-start gap-1 bg-background px-6 py-4 max-[599px]:px-4 max-[599px]:py-3">
              <span className="text-xs tracking-[0.04em] text-muted-foreground">{metric.label}</span>
              <strong className="font-mono text-lg leading-[26px] font-semibold tabular-nums">
                {pending ? (running ? "计算中" : "—") : metric.value}
              </strong>
              {pending && running ? (
                <Progress value={62} aria-label={`${metric.label} 计算进度`} className="mt-1" />
              ) : (
                <small className="text-[13px] leading-5 text-muted-foreground">{pending ? "推理未完成，无结果" : metric.note}</small>
              )}
            </div>
          )
        })}
      </div>

      {/* 主体：≥ md 为 8 + 4 分栏，属性栏粘在顶栏之下；更窄时属性栏移到 Tabs 之下占整行。 */}
      <div className="grid items-start gap-[var(--layout-grid-gutter)] min-[820px]:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="min-w-0 gap-0">
          <TabsList variant="line">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="features">特征</TabsTrigger>
            <TabsTrigger value="log">评估记录</TabsTrigger>
            <TabsTrigger value="config">配置</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="min-w-0 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>预测与实际</CardTitle>
                <CardDescription>验证集最近 11 个采样点，单位 kN。示例数据。</CardDescription>
              </CardHeader>
              <CardContent>
                <EChart
                  height={200}
                  ariaLabel="验证集最近 11 个采样点的预测值与实际值，两条线走势一致，末点预测 1,736 kN、实际 1,712 kN"
                  option={forecastOption}
                />
                <div className="mt-2 flex flex-wrap gap-4 text-[13px] leading-5 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <i className="inline-block h-0.5 w-3 bg-[var(--chart-1)]" aria-hidden="true" />
                    预测（LimiX-TS v2）
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <i className="inline-block h-0.5 w-3 bg-[var(--chart-2)]" aria-hidden="true" />
                    实际
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="min-w-0 pt-4">
            <Table>
              <TableCaption>示例数据：特征重要性按 SHAP 均值排序。</TableCaption>
              <TableHeader>
                <TableRow className="whitespace-nowrap hover:bg-transparent">
                  <TableHead>特征</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead className="text-right">重要性</TableHead>
                  <TableHead className="text-right">缺失率 (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FEATURES.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="whitespace-nowrap">{row.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.source}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{row.importance.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{row.missing.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* 记录类内容：「时间 / 事件」两列，< sm 上下排列。 */}
          <TabsContent value="log" className="min-w-0 pt-4">
            <ol className="m-0 grid list-none gap-3 p-0 text-sm leading-[22px]">
              {LOG.map((row) => (
                <li key={row.time} className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-b border-border pb-3 max-[599px]:grid-cols-1 max-[599px]:gap-1">
                  <time className="font-mono text-xs leading-[22px] text-muted-foreground tabular-nums">{row.time}</time>
                  <span>{row.event}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[13px] leading-5 text-muted-foreground">示例数据。</p>
          </TabsContent>

          <TabsContent value="config" className="min-w-0 pt-4">
            <DescriptionList layout="horizontal" items={CONFIG} />
          </TabsContent>
        </Tabs>

        {/* 属性栏：只放静态键值，编辑入口除外；长文本换行不截断。 */}
        <Card className="min-[820px]:sticky min-[820px]:top-[calc(var(--layout-topbar-height)+24px)]">
          <CardHeader>
            <CardTitle>属性</CardTitle>
          </CardHeader>
          <CardContent>
            <DescriptionList
              layout="horizontal"
              items={[
                { label: "状态", value: status.label },
                { label: "负责人", value: "周衡" },
                { label: "工况", value: "A / B / C（三班）" },
                { label: "采样频率", value: "1 min" },
                { label: "数据范围", value: "2026-03-20 至 2026-06-17" },
                { label: "标签", value: "热轧 · 轧制力 · 产线 2" },
                {
                  label: "进度",
                  value: (
                    <span className="grid gap-1 pt-1.5">
                      <Progress value={running ? 62 : failed ? 74 : 100} aria-label="评估进度" />
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">{running ? "62%" : failed ? "74%，已中止" : "100%"}</span>
                    </span>
                  ),
                },
              ]}
            />
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "已打开编辑属性（示例）" })}>编辑属性</Button>
          </CardFooter>
        </Card>
      </div>

      {/* 删除不可逆：Dialog 二次确认并说明后果。 */}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="删除评估 #2041？" description="删除后无法恢复，关联的报告与导出文件会一并移除。" confirmLabel="删除" destructive onConfirm={remove} />
    </>
  )
}

export { DetailPage }
export type { DetailState }
