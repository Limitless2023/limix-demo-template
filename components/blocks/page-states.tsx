"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

// 页面级状态：空态、首次加载、局部加载、错误、无权限（规则见页型「页面级状态」）。
// 放在 AppShell 的内容区里使用。状态只替换内容区正文，页面标题保持原位；标题区主操作的去留由状态决定。
// 顶部的演示切换只用于展示，真实页面由数据与权限决定进入哪种状态。

type PageState = "empty" | "loading" | "partial" | "error" | "forbidden" | "ready"

const STATES: { value: PageState; label: string }[] = [
  { value: "empty", label: "空态" },
  { value: "loading", label: "首次加载" },
  { value: "partial", label: "局部加载" },
  { value: "error", label: "错误" },
  { value: "forbidden", label: "无权限" },
  { value: "ready", label: "正常" },
]

// 示例数据，不代表真实评测结果。
const ROWS: { name: string; dataset: string; status: "done" | "running"; mape: string }[] = [
  { name: "热轧轧制力预测", dataset: "热轧产线 · 工况数据集", status: "done", mape: "2.1" },
  { name: "锅炉负荷 24h 预测", dataset: "电厂 3 号机组", status: "running", mape: "—" },
  { name: "连铸坯缺陷分类", dataset: "连铸质检 · 2026Q2", status: "done", mape: "3.4" },
  { name: "脱硫塔 pH 回归", dataset: "化工 · 脱硫工段", status: "done", mape: "5.6" },
]

function EvaluationTable({ className, busy }: { className?: string; busy?: boolean }) {
  return (
    <div aria-busy={busy || undefined} className={className}>
      <Table>
        <TableCaption>示例数据。</TableCaption>
        <TableHeader>
          <TableRow className="whitespace-nowrap hover:bg-transparent">
            <TableHead>评估</TableHead>
            <TableHead>数据集</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">MAPE (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="whitespace-nowrap">{row.name}</TableCell>
              <TableCell className="whitespace-nowrap">{row.dataset}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.status === "done" ? <Badge variant="outline">已完成</Badge> : <Badge variant="accent">运行中</Badge>}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">{row.mape}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PageStates() {
  const toast = useToast()
  const [state, setState] = React.useState<PageState>("empty")
  const [retrying, setRetrying] = React.useState(false)
  // 重试计时器：切换状态或卸载时取消，避免过期回调把页面切回「正常」。
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const create = () => toast({ title: "已打开新建评估（示例）" })
  const change = (next: string) => {
    window.clearTimeout(timer.current)
    setRetrying(false)
    setState(next as PageState)
  }
  // 重试中按钮禁用并改文案；成功后回到正常内容。
  const retry = () => {
    setRetrying(true)
    timer.current = window.setTimeout(() => {
      setRetrying(false)
      setState("ready")
      toast({ title: "已恢复" })
    }, 900)
  }

  // 标题区主操作：空态由 Empty 承担、无权限不显示；首次加载用 Skeleton 占位；其余保留。
  const actions =
    state === "empty" || state === "forbidden" ? undefined : state === "loading" ? (
      <Skeleton className="h-[var(--control-height-md)] w-28" />
    ) : (
      <Button onClick={create}>新建评估</Button>
    )

  return (
    <>
      <PageHeader title="评估" description="所有评估任务；按数据集、模型或状态筛选。" actions={actions} />

      {/* 演示切换条：只属于本示例，真实页面没有它。 */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-border px-4 py-3 text-[13px] leading-5 text-muted-foreground">
        <span>演示：切换页面状态</span>
        <ToggleGroup variant="segmented" aria-label="页面状态" className="flex-wrap" value={[state]} onValueChange={(next) => next[0] && change(next[0])}>
          {STATES.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>{item.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* 状态切换不改变滚动位置；内容用 fade 动效替换。 */}
      <div key={state} data-motion="fade" data-state="open" className="grid gap-6 max-[599px]:gap-4 [&>*]:min-w-0">
        {state === "empty" ? (
          // 空态：标题「还没有 ×」，说明写创建后能得到什么，动作即主操作；居中，上下留 space-16。
          <Empty className="py-16 max-[599px]:py-8">
            <EmptyHeader className="max-w-xl">
              <EmptyTitle>还没有评估任务</EmptyTitle>
              <EmptyDescription>创建第一个评估后，这里会列出每次评估的模型、数据集与指标。</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={create}>新建评估</Button>
            </EmptyContent>
          </Empty>
        ) : null}

        {state === "loading" ? (
          // 首次加载：Skeleton 复刻最终布局（筛选、表头 + 5 行），不用转圈、不用整页遮罩。
          <>
            <div aria-hidden="true" className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-[2fr_repeat(3,1fr)]">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[var(--control-height-md)]" />
              ))}
            </div>
            <div aria-busy="true" aria-label="正在加载评估列表" className="overflow-hidden rounded-md border border-border">
              {Array.from({ length: 6 }, (_, row) => (
                <div
                  key={row}
                  className={cn(
                    "grid grid-cols-[2fr_1fr] gap-4 border-b border-border px-4 py-3 last:border-b-0 min-[600px]:grid-cols-[2fr_2fr_1fr_1fr]",
                    row === 0 && "bg-muted",
                  )}
                >
                  {Array.from({ length: 4 }, (_, col) => (
                    // 表头行底色是 muted，占位条改用 border 色才看得见。
                    <Skeleton key={col} className={cn("w-full", row === 0 ? "bg-border" : "h-3.5", col > 1 && "max-[599px]:hidden")} />
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {state === "partial" ? (
          // 局部加载：旧内容保留并降到 60% 不透明度、暂不可操作；进度可知时写百分比。
          <>
            <div className="flex flex-wrap items-center gap-3 text-[13px] leading-5 text-muted-foreground">
              <Progress value={62} aria-label="正在刷新" className="w-40" />
              <span>正在刷新指标（62%）…</span>
            </div>
            <EvaluationTable busy className="pointer-events-none opacity-60" />
          </>
        ) : null}

        {state === "error" ? (
          // 错误：标题「无法 + 动作 + 对象」，说明写原因（含错误码）与预期恢复；左对齐，不超过正文宽度。
          <div className="grid max-w-[var(--layout-prose-max-width)] gap-4">
            <Alert variant="destructive">
              <CircleAlert strokeWidth={1.5} aria-hidden="true" />
              <AlertTitle>无法加载评估列表</AlertTitle>
              <AlertDescription>请求超时（504）。服务可能正在重启，通常 1 分钟内恢复。</AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={retrying} onClick={retry}>
                {retrying ? "正在重试…" : "重试"}
              </Button>
              <Button variant="ghost">查看服务状态</Button>
            </div>
            <p className="font-mono text-[13px] leading-5 text-muted-foreground tabular-nums">请求 ID：req_8f2a…c31 · 2026-06-18 14:05</p>
          </div>
        ) : null}

        {state === "forbidden" ? (
          // 无权限：不显示主操作、不暴露对象内容；说明范围与申请方式，动作为申请入口与返回。
          <Empty className="max-w-[var(--layout-prose-max-width)] items-start text-left">
            <EmptyHeader className="max-w-xl items-start">
              <EmptyTitle>没有查看权限</EmptyTitle>
              <EmptyDescription>评估列表仅对「热轧产线 2」项目成员开放。向项目负责人申请后刷新本页。</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="max-w-none flex-row flex-wrap gap-2">
              <Button variant="outline" onClick={() => toast({ title: "申请已发送给项目负责人（示例）" })}>申请权限</Button>
              <Button variant="ghost">返回工作台</Button>
            </EmptyContent>
          </Empty>
        ) : null}

        {state === "ready" ? (
          <>
            <EvaluationTable />
          </>
        ) : null}
      </div>
    </>
  )
}

export { PageStates }
