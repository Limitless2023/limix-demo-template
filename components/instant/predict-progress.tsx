/**
 * [INPUT]: 依赖 @/components/ui/steps 的 Steps；依赖 @/components/ui/card；依赖 @/hooks/use-instant 的 PredictProgress；
 *          依赖 @/lib/instant-types 的 STEP_NAMES
 * [OUTPUT]: 导出 PredictProgressCard 组件
 * [POS]: components/instant 的耗时小卡：一行标题写总用时，四个环节横排逐个点亮并写出秒数；超过 20 秒提示平台繁忙。
 *        真实耗时摆出来，是这个 demo 区别于回放式 demo 的地方，但它是辅助信息，所以收成小卡。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Steps, type StepItem } from "@/components/ui/steps"
import type { PredictProgress } from "@/hooks/use-instant"
import { STEP_NAMES, type StepName } from "@/lib/instant-types"

const STEP_LABEL: Record<StepName, string> = { upload: "上传", submit: "提交", compute: "计算", download: "取回" }
const SLOW_MS = 20_000
const sec = (ms: number) => `${(ms / 1000).toFixed(1)} 秒`

export function PredictProgressCard({ progress }: { progress: PredictProgress | null }) {
  const active = progress != null && !progress.result && !progress.failed
  const now = useNow(active)
  const done = progress ? STEP_NAMES.filter((s) => progress.steps[s] != null).length : 0
  const elapsed = progress ? (progress.result?.totalMs ?? Math.max(0, now - progress.startedAt)) : 0
  const mock = progress?.result?.mode === "mock"

  const items: StepItem[] = STEP_NAMES.map((name, i) => {
    const ms = progress?.steps[name]
    if (ms != null && !mock) return { label: STEP_LABEL[name], description: sec(ms), status: "done" }
    if (progress?.failed && i === done) return { label: STEP_LABEL[name], description: "出错", status: "error" }
    if (active && i === done) return { label: STEP_LABEL[name], description: "进行中", status: "current" }
    return { label: STEP_LABEL[name], status: mock && progress?.result ? "done" : "pending" }
  })

  const title = !progress
    ? "用时"
    : active
      ? `正在预测 · ${sec(elapsed)}`
      : progress.failed
        ? "预测失败"
        : mock
          ? "模拟结果，不计时"
          : `用时 ${sec(elapsed)}`

  return (
    <Card size="sm">
      <CardContent className="grid gap-3">
        <p className="m-0 flex flex-wrap items-baseline justify-between gap-x-3 text-[13px] leading-5">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground">
            {progress ? `${progress.label}${progress.result ? ` · 上下文 ${progress.result.contextRows} 条` : ""}` : "预测后显示各环节用时"}
          </span>
        </p>
        <Steps items={items} aria-label="预测环节用时" />
        {active && elapsed > SLOW_MS ? (
          <p className="m-0 text-[13px] text-muted-foreground">平台繁忙，结果会晚一些。任务仍在 LimiX 上运行，不会重复提交。</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

// 进行中每 200 毫秒刷新一次计时；结束后停表。刚开始的 200 毫秒内 now 可能早于 startedAt，调用方取 0。
function useNow(active: boolean) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [active])
  return now
}
