"use client"

import * as React from "react"
import { ArrowLeft, CircleAlert, LoaderCircle } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ColumnProfile, type ProfileBin, type ProfileValue } from "@/components/ui/column-profile"
import { type ColumnType } from "@/components/ui/column-type-badge"
import { DataGrid, type GridColumn } from "@/components/ui/data-grid"
import { DescriptionList } from "@/components/ui/description-list"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { EventList, type EventItem } from "@/components/ui/event-list"
import { IssueItem, type IssueSeverity, type IssueStatus } from "@/components/ui/issue-item"
import { QualityBar } from "@/components/ui/quality-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { Stat } from "@/components/ui/stat"
import { Steps } from "@/components/ui/steps"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskStatus } from "@/components/ui/task-status"
import { useToast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { VersionChip } from "@/components/ui/version-chip"

// 数据集详情：返回 → 头部摘要（标题 + 类型 + 当前版本；元信息；操作区）→ 摘要条 4 张 Stat
// → 列画像 / 数据预览 / 质量问题 / 版本 四个分区 8 列 + 属性栏 4 列（规则见页型「数据集详情」）。
// 放在 AppShell 的内容区里使用；state 用来查看各状态，接入真实接口后由请求结果决定。

type DatasetState = "ready" | "loading" | "parsing" | "governing" | "failed" | "clean" | "deleted" | "forbidden"

type Column = {
  name: string
  type: ColumnType
  missing: number
  unique: number
  bins?: ProfileBin[]
  topValues?: ProfileValue[]
  meta?: string[]
}

type Issue = { severity: IssueSeverity; title: string; description: string; columns: string[]; suggestion: string; acceptLabel?: string }

// ---------- 示例数据：干燥工段样本（不代表真实生产数据） ----------
const VERSION = "dv_20260918_0412"
const NEW_VERSION = "dv_20260923_0419"
const TARGET = "moisture_pct"
const TOTAL_ROWS = 12480

const bins = (counts: number[], from: number, step: number): ProfileBin[] =>
  counts.map((count, i) => ({ from: Math.round((from + i * step) * 10) / 10, to: Math.round((from + (i + 1) * step) * 10) / 10, count }))

const COLUMNS: Column[] = [
  { name: "record_time", type: "datetime", missing: 0, unique: 12480, bins: bins([980, 1040, 1010, 1060, 1020, 990, 1050, 1030, 1000, 1070, 1110, 1120], 1, 1), meta: ["09-01 至 09-12"] },
  { name: "line", type: "category", missing: 0, unique: 3, topValues: [{ label: "1# 线", count: 4210 }, { label: "2# 线", count: 3980 }, { label: "3# 线", count: 4290 }] },
  { name: "inlet_temp", type: "numeric", missing: 0.023, unique: 684, bins: bins([3, 8, 19, 40, 61, 48, 22, 9], 150, 4), meta: ["均值 165.2"] },
  { name: "outlet_temp", type: "numeric", missing: 0.004, unique: 612, bins: bins([6, 14, 33, 58, 49, 27, 12, 4], 44, 2), meta: ["均值 53.1"] },
  { name: "air_flow", type: "numeric", missing: 0, unique: 1203, bins: bins([5, 12, 30, 52, 60, 41, 20, 8], 3200, 150), meta: ["均值 3,812"] },
  { name: "feed_moisture", type: "numeric", missing: 0.212, unique: 388, bins: bins([4, 11, 26, 44, 39, 21, 9, 3], 18, 1), meta: ["均值 22.4"] },
  { name: "settle_flag", type: "bool", missing: 0, unique: 2, topValues: [{ label: "false", count: 11020 }, { label: "true", count: 1460 }] },
  { name: "operator_note", type: "text", missing: 0.37, unique: 2931 },
  { name: "moisture_pct", type: "numeric", missing: 0, unique: 540, bins: bins([4, 10, 27, 49, 55, 33, 15, 6], 10.5, 0.4), meta: ["均值 11.9"] },
]

const TYPE_FILTERS = [
  { value: "all", label: "全部" },
  { value: "numeric", label: "数值" },
  { value: "category", label: "类别" },
  { value: "datetime", label: "时间" },
  { value: "text", label: "文本" },
]

// 数据预览：示例只生成前 40 行（真实页面最多加载 200 行，完整数据走「下载」）；null 为缺失值，DataGrid 显示「—」。
const LINES = ["1# 线", "2# 线", "3# 线"]
const pad = (n: number) => String(n).padStart(2, "0")
const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits
const ROWS = Array.from({ length: 40 }, (_, i) => {
  const outlet = round(52 + Math.round(Math.sin(i / 3) * 60) / 10 + (i % 7) / 10, 1)
  return {
    record_time: `2026-09-${pad(1 + (i >> 3))} ${pad(8 + (i % 8))}:00`,
    line: LINES[i % 3],
    inlet_temp: i % 11 === 4 ? null : round(165 + Math.cos(i) * 6, 1),
    outlet_temp: outlet,
    air_flow: Math.round(3800 + Math.sin(i * 1.7) * 240),
    feed_moisture: i % 5 === 2 ? null : round(22 + Math.sin(i / 2) * 2, 1),
    settle_flag: i % 9 === 0 ? "true" : "false",
    moisture_pct: round(11.4 + (outlet - 52) * 0.21 + (i % 5) * 0.05, 2),
  }
})
// 自由文本列不进预览；表头带类型、角色与紧凑画像。
const GRID_COLUMNS: GridColumn[] = COLUMNS.filter((c) => c.type !== "text").map((c) => ({
  key: c.name,
  label: c.name,
  type: c.type,
  role: c.name === TARGET ? "target" : undefined,
  mono: c.type === "datetime",
  profile: c.bins || c.topValues ? { bins: c.bins, topValues: c.topValues?.slice(0, 3), missing: c.missing } : undefined,
}))

const ISSUES: Issue[] = [
  { severity: "high", title: "特征疑似泄漏目标", description: "settle_flag 与目标列 moisture_pct 的相关系数为 0.98，预测时通常无法获得该字段。", columns: ["settle_flag"], suggestion: "从特征中排除 settle_flag。" },
  { severity: "warning", title: "缺失率较高", description: "feed_moisture 缺失 21.2%，集中在 2# 线夜班。", columns: ["feed_moisture"], suggestion: "按线别与班次做插补，并保留缺失标记列。", acceptLabel: "采纳插补" },
  { severity: "info", title: "文本列不参与建模", description: "operator_note 为自由文本，唯一值 2,931 个。", columns: ["operator_note"], suggestion: "从特征中排除。" },
]

const VERSIONS: EventItem[] = [
  { id: "upload", time: "09-18 14:02", title: "上传", description: "dryer_train.xlsx · 12,480 行 × 9 列", meta: `${VERSION} · 当前`, tone: "success" },
  { id: "parse", time: "09-18 14:05", title: "解析与画像", description: "识别 9 列；发现 3 个质量问题", meta: "分析 an_7c21", tone: "success" },
  { id: "previous", time: "09-15 10:40", title: "上一份上传（已被替换）", description: "dryer_train_v0.xlsx · 9,860 行", meta: "dv_20260915_0107", tone: "neutral" },
]

// Tabs 用 line 变体：底部 2px 主色下划线；< sm 标签横向滚动。
// 摘要条：≥ lg 4 格一行，sm–lg 2 × 2，< sm 单列。
const statsGrid = "grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-4"
const note = "text-[13px] leading-5 text-muted-foreground"

// 分区内容未就绪（加载中 / 解析中）时的占位。
function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label={label}>
      <Skeleton className="h-[26px] w-72 max-w-full" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-2 rounded-md border border-border px-4 py-3">
            <Skeleton className="w-24" />
            <Skeleton className="h-[var(--control-height-md)]" />
            <Skeleton className="w-32 max-w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DatasetPage({ state = "ready" }: { state?: DatasetState }) {
  const toast = useToast()
  const [tab, setTab] = React.useState("profile")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [issueStates, setIssueStates] = React.useState<IssueStatus[]>(() => ISSUES.map(() => "open"))
  const [governing, setGoverning] = React.useState(state === "governing")
  const [versions, setVersions] = React.useState(VERSIONS)
  const [blocked, setBlocked] = React.useState(false)

  // 治理任务：示例用 4 秒模拟完成；完成后 Toast 提示，并在「版本」分区加一条来历。
  React.useEffect(() => {
    if (!governing) return
    const timer = window.setTimeout(() => {
      setGoverning(false)
      setVersions((list) =>
        list.some((item) => item.id === "governed")
          ? list
          : [{ id: "governed", time: "09-23 10:19", title: "治理 · 生成新版本", description: "按已采纳建议处理", meta: NEW_VERSION, tone: "success" }, ...list],
      )
      toast({ title: "已生成新版本", description: `${NEW_VERSION} 已加入「版本」分区（示例）` })
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [governing, toast])

  const back = (
    <div>
      <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-[var(--primary-text)]" onClick={() => toast({ title: "已返回数据集列表（示例）" })}>
        <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
        返回数据集列表
      </Button>
    </div>
  )

  // 版本已删除 / 无权限：整个内容区换成页面级状态块，只保留返回。
  if (state === "deleted" || state === "forbidden") {
    const deleted = state === "deleted"
    return (
      <>
        {back}
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{deleted ? "这个数据版本已删除" : "没有查看此数据集的权限"}</EmptyTitle>
            <EmptyDescription>
              {deleted
                ? `数据版本 ${VERSION} 已被删除，无法查看。可在数据集列表中打开「干燥工段样本」的其他版本。`
                : "「干燥工段样本」属于「干燥工段」项目，你不在该项目成员中。可联系项目负责人王工申请查看权限。"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => toast({ title: deleted ? "已打开版本列表（示例）" : "已发送权限申请（示例）" })}>
              {deleted ? "查看其他版本" : "申请权限"}
            </Button>
          </EmptyContent>
        </Empty>
      </>
    )
  }

  const loading = state === "loading"
  const parsing = state === "parsing"
  const failed = state === "failed"
  const clean = state === "clean"
  const pending = loading || parsing

  const issues = clean ? [] : ISSUES
  const statuses = clean ? [] : issueStates
  const accepted = statuses.filter((s) => s === "accepted").length
  const ignored = statuses.filter((s) => s === "ignored").length
  const open = statuses.filter((s) => s === "open").length
  const highOpen = issues.some((issue, i) => issue.severity === "high" && statuses[i] === "open")

  // 列画像：按类型筛选，缺失率高的列排在前面。
  const profiles = COLUMNS.filter((c) => typeFilter === "all" || c.type === typeFilter).sort((a, b) => b.missing - a.missing)

  const setIssue = (index: number, next: IssueStatus) => setIssueStates((list) => list.map((s, i) => (i === index ? next : s)))

  return (
    <>
      {back}

      {/* 头部摘要：加载中先用 Skeleton 占位；< sm 时 VersionChip 换行到标题下方，操作区独占一行、主操作靠右。 */}
      {loading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="正在加载数据集">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-[420px] max-w-full" />
        </div>
      ) : (
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              干燥工段样本
              <Badge variant="outline">表格</Badge>
              <span className="flex min-w-0 items-center gap-3 font-normal max-[599px]:basis-full">
                <VersionChip kind="upload" id={VERSION} onCopy={() => toast({ title: `已复制 ${VERSION}` })} />
                {parsing ? <TaskStatus status="running" label="解析中" /> : null}
              </span>
            </span>
          }
          description={
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <span>来源 dryer_train.xlsx · Sheet1</span>
              <span>上传于 2026-09-18 14:02 · 王工</span>
              <span>UTF-8 · 示例数据</span>
            </span>
          }
          actions={
            <>
              <Button variant="outline" disabled={failed} onClick={() => toast({ title: `开始下载 ${VERSION}.csv（示例）` })}>下载</Button>
              {/* 删除版本只在「更多」末尾；触发钮用 default 尺寸，对齐同排按钮。 */}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>更多</DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-40">
                  <DropdownMenuItem onClick={() => toast({ title: "已打开重命名（示例）" })}>重命名</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: `已复制 ${VERSION}` })}>复制版本号</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setBlocked(true)}>删除版本</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* 一页只有这一个 default 主按钮；解析未完成或失败时不可用。 */}
              <Button className="max-[599px]:ml-auto" disabled={pending || failed} onClick={() => toast({ title: "进入新建预测，已预填数据版本（示例）" })}>
                用此数据新建预测
              </Button>
            </>
          }
        />
      )}

      {/* 解析失败：头部下插入 destructive Alert，写明原因与重新上传入口；Tabs 不渲染。 */}
      {failed ? (
        <div className="relative">
          <Alert variant="destructive" className="pr-32 max-[599px]:pr-4">
            <CircleAlert strokeWidth={1.5} aria-hidden="true" />
            <AlertTitle>解析失败：表结构无法识别</AlertTitle>
            <AlertDescription>Sheet1 第 1–3 行为合并单元格的标题，未找到表头；也可能是编码不是 UTF-8 或 GBK。把表头放到第 1 行后重新上传。</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="absolute top-3 right-3 max-[599px]:static max-[599px]:mt-3" onClick={() => toast({ title: "已打开上传（示例）" })}>
            重新上传
          </Button>
        </div>
      ) : null}

      {/* 摘要条：加载中 Skeleton；解析中换成 Steps（上传 → 解析 → 画像）。 */}
      {failed ? null : loading ? (
        <div className={statsGrid} aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-2 rounded-md border border-border px-4 pt-4 pb-3">
              <Skeleton className="w-16" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="w-40 max-w-full" />
            </div>
          ))}
        </div>
      ) : parsing ? (
        <div className="rounded-md border border-border bg-card px-4 py-4">
          <Steps
            aria-label="数据集处理进度"
            current={1}
            items={[
              { label: "上传", description: "dryer_train.xlsx · 2.4 MB" },
              { label: "解析", description: "识别表头与列类型" },
              { label: "画像", description: "统计分布与质量问题" },
            ]}
          />
        </div>
      ) : (
        <div className={statsGrid}>
          <Stat label="行数" value={TOTAL_ROWS} note="有效 11,320 · 其余见数据质量" />
          <Stat label="列数" value={COLUMNS.length} note="数值 5 · 类别 1 · 时间 1 · 布尔 1 · 文本 1" />
          {/* Stat 不收子元素：外层画卡片，Stat 去掉自身边框，下方接 QualityBar。 */}
          <div className="grid min-w-0 content-start rounded-md border border-border bg-card">
            <Stat label="数据质量" value="90.7" unit="%" note="有效行占比" className="rounded-none border-0 bg-transparent pb-2" />
            <QualityBar valid={11320} invalid={640} empty={520} showLegend={false} className="px-4 pb-3" />
          </div>
          <Stat
            label="待处理问题"
            value={open}
            unit="项"
            state={open && highOpen ? "alert" : "default"}
            note={highOpen ? "含 1 项高风险：特征疑似泄漏目标" : open ? "无高风险问题" : "未发现待处理问题"}
          />
        </div>
      )}

      {/* 主体：≥ md 为 8 + 4 分栏，属性栏粘在顶栏之下；更窄时属性栏移到 Tabs 之下占整行。 */}
      {failed ? null : (
        <div className="grid items-start gap-[var(--layout-grid-gutter)] min-[820px]:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="min-w-0 gap-0">
            <TabsList variant="line">
              <TabsTrigger value="profile">列画像</TabsTrigger>
              <TabsTrigger value="preview">数据预览</TabsTrigger>
              <TabsTrigger value="issues">
                质量问题
                {!pending && open ? <span className="ml-1 font-mono tabular-nums">{open}</span> : null}
              </TabsTrigger>
              <TabsTrigger value="versions">版本</TabsTrigger>
            </TabsList>

            {/* 列画像：类型只用 ColumnTypeBadge 表达；缺失率 ≥ 20% 由 ColumnProfile 以 destructive 文字提示，不给卡片上色。 */}
            <TabsContent value="profile" className="min-w-0 pt-4">
              {pending ? (
                <PanelSkeleton label="正在生成列画像" />
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <ToggleGroup variant="segmented" size="sm" aria-label="按列类型筛选" value={[typeFilter]} onValueChange={(next) => next[0] && setTypeFilter(next[0])}>
                      {TYPE_FILTERS.map((it) => <ToggleGroupItem key={it.value} value={it.value}>{it.label}</ToggleGroupItem>)}
                    </ToggleGroup>
                    <p className={note}>
                      显示 <span className="font-mono tabular-nums">{profiles.length} / {COLUMNS.length}</span> 列 · 按缺失率排序 · 示例数据
                    </p>
                  </div>
                  {profiles.length ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                      {profiles.map((c) => (
                        <ColumnProfile
                          key={c.name}
                          name={c.name}
                          type={c.type}
                          role={c.name === TARGET ? "target" : undefined}
                          bins={c.bins}
                          topValues={c.topValues}
                          missing={c.missing}
                          unique={c.unique}
                          meta={c.meta}
                          className="rounded-md border border-border bg-card px-4 py-3"
                        />
                      ))}
                    </div>
                  ) : (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>没有该类型的列</EmptyTitle>
                        <EmptyDescription>换一个类型，或选「全部」查看所有列。</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </>
              )}
            </TabsContent>

            {/* 数据预览：只加载前 N 行，DataGrid 在自身容器内横向与纵向滚动。 */}
            <TabsContent value="preview" className="min-w-0 pt-4">
              {pending ? (
                <PanelSkeleton label="正在加载数据预览" />
              ) : (
                <DataGrid caption="干燥工段样本 · 数据预览" rowIndex totalRows={TOTAL_ROWS} maxHeight={380} footnote="完整数据请下载 · 示例数据" rows={ROWS} columns={GRID_COLUMNS} />
              )}
            </TabsContent>

            {/* 质量问题：采纳 / 忽略只改本页待提交方案；无采纳或治理运行中时生成按钮禁用。 */}
            <TabsContent value="issues" className="min-w-0 pt-4">
              {pending ? (
                <PanelSkeleton label="正在检查数据质量" />
              ) : issues.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>未发现质量问题</EmptyTitle>
                    <EmptyDescription>列类型、缺失率与泄漏检查均通过，可直接用此数据新建预测。示例数据。</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  {governing ? (
                    <div className="relative mb-4">
                      <Alert role="status" className="pr-32 max-[599px]:pr-4 max-[599px]:pb-11">
                        <LoaderCircle className="text-[var(--icon-default)] motion-safe:animate-spin" strokeWidth={1.5} aria-hidden="true" />
                        <AlertTitle>正在生成新版本</AlertTitle>
                        <AlertDescription>按已采纳的建议处理数据，完成后生成新的数据版本；当前版本保持不变。</AlertDescription>
                      </Alert>
                      <TaskStatus status="running" meta="G-0419" className="absolute top-4 right-4 max-[599px]:top-auto max-[599px]:bottom-4 max-[599px]:left-12" />
                    </div>
                  ) : null}
                  <div className="grid gap-3">
                    {issues.map((issue, i) => (
                      <IssueItem
                        key={issue.title}
                        severity={issue.severity}
                        title={issue.title}
                        description={issue.description}
                        columns={issue.columns}
                        suggestion={issue.suggestion}
                        acceptLabel={issue.acceptLabel}
                        status={statuses[i]}
                        locked={governing ? "生成中" : undefined}
                        onChange={(next) => setIssue(i, next)}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[13px] leading-5 text-muted-foreground">
                    <span>
                      已采纳 <strong className="font-mono font-semibold text-foreground tabular-nums">{accepted}</strong> 项 · 忽略{" "}
                      <span className="font-mono tabular-nums">{ignored}</span> 项 · 待处理 <span className="font-mono tabular-nums">{open}</span> 项
                    </span>
                    <Button
                      variant="outline"
                      disabled={!accepted || governing}
                      onClick={() => {
                        setGoverning(true)
                        toast({ title: "已提交治理任务，完成后生成新版本（示例）" })
                      }}
                    >
                      按已采纳建议生成新版本
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* 版本：自上而下写来历（上传 → 治理 → 生成），meta 放版本号。 */}
            <TabsContent value="versions" className="min-w-0 pt-4">
              <EventList ariaLabel="版本来历" items={versions} />
              <Button variant="outline" size="sm" className="mt-4" onClick={() => toast({ title: "进入版本对比（示例）" })}>对比版本</Button>
            </TabsContent>
          </Tabs>

          {/* 属性栏：版本号再显示一次完整值；被引用的版本不能删除。 */}
          <Card className="min-[820px]:sticky min-[820px]:top-[calc(var(--layout-topbar-height)+24px)]">
            <CardHeader>
              <CardTitle>属性</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-3" aria-busy="true" aria-label="正在加载属性">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-[minmax(88px,36%)_1fr] gap-4">
                      <Skeleton className="w-16" />
                      <Skeleton className="w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <DescriptionList
                    layout="horizontal"
                    items={[
                      { label: "数据版本", value: <VersionChip kind="upload" id={VERSION} onCopy={() => toast({ title: `已复制 ${VERSION}` })} /> },
                      { label: "版本类型", value: "上传" },
                      { label: "来源文件", value: "dryer_train.xlsx" },
                      { label: "解析配置", value: "UTF-8 · Sheet1 · 分隔符 —", mono: true },
                      { label: "行 / 列", value: parsing ? null : "12,480 / 9", mono: true },
                      {
                        label: "被引用任务",
                        value: parsing ? null : (
                          <span className="grid gap-1">
                            <span>3 个预测任务</span>
                            <TaskStatus status="finished" meta="T-0412" />
                          </span>
                        ),
                      },
                      { label: "备注", value: null },
                    ]}
                  />
                  <p className={`mt-3 ${note}`}>被任务引用的版本不能删除；需要替换数据时上传新版本。</p>
                </>
              )}
            </CardContent>
            {loading ? null : (
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "已打开编辑备注（示例）" })}>编辑备注</Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}

      {/* 被任务引用的版本（LimiX 返回 4108）：Dialog 只说明原因，不提供删除按钮。 */}
      <ConfirmDialog
        open={blocked}
        onOpenChange={setBlocked}
        title="这个版本不能删除"
        description={`数据版本 ${VERSION} 被 3 个预测任务引用。先删除或改用其他版本的任务，再删除本版本。`}
      >
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setBlocked(false)}>知道了</Button>
        </div>
      </ConfirmDialog>
    </>
  )
}

export { DatasetPage }
export type { DatasetState }
