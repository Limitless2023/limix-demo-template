/**
 * [INPUT]: 依赖 @/components/ui 的 Button、Field、ToggleGroup；依赖 react 的计时与 ref
 * [OUTPUT]: 导出 FeedPanel 组件
 * [POS]: components/instant 的模拟上游推送：按间隔把一批测试记录当作上游系统的新数据推过来。
 *        只管节奏（间隔、每批条数、倒计时、跳过），取哪几条、怎么预测由 instant-demo.tsx 的 onTick 决定。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { Pause, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// 一次预测约 6 秒（2026-10-15 实测），最短间隔 10 秒，保证上一批回来再推下一批。
const INTERVALS = ["10", "15", "30"]
const SIZES = ["1", "3", "5"]

export function FeedPanel({ busy, onTick }: { busy: boolean; onTick: (batchSize: number) => Promise<void> }) {
  const [running, setRunning] = React.useState(false)
  const [period, setPeriod] = React.useState("15")
  const [size, setSize] = React.useState("3")
  const [left, setLeft] = React.useState(0)
  const [pushed, setPushed] = React.useState(0)
  const [skipped, setSkipped] = React.useState(0)
  // 计时器里读最新的 busy、onTick、条数与间隔，不因它们变化而重建计时器
  const latest = React.useRef({ busy, onTick, size, period })
  React.useEffect(() => {
    latest.current = { busy, onTick, size, period }
  })
  const remaining = React.useRef(0)

  // 推一批：上一批还没回来就跳过这一批，不排队
  const push = React.useCallback(() => {
    const { busy, onTick, size } = latest.current
    if (busy) {
      setSkipped((n) => n + 1)
      return
    }
    setPushed((n) => n + 1)
    void onTick(Number(size))
  }, [])

  const toggle = () => {
    if (running) return setRunning(false)
    push()
    remaining.current = Number(period)
    setLeft(remaining.current)
    setRunning(true)
  }

  React.useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      remaining.current -= 1
      if (remaining.current <= 0) {
        push()
        remaining.current = Number(latest.current.period)
      }
      setLeft(remaining.current)
    }, 1000)
    return () => clearInterval(timer)
  }, [running, push])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-6">
        <Field className="w-auto">
          <FieldLabel id="feed-interval">推送间隔</FieldLabel>
          <ToggleGroup variant="segmented" aria-labelledby="feed-interval" value={[period]} onValueChange={(next) => next[0] && setPeriod(next[0])}>
            {INTERVALS.map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {s} 秒
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field className="w-auto">
          <FieldLabel id="feed-size">每批条数</FieldLabel>
          <ToggleGroup variant="segmented" aria-labelledby="feed-size" value={[size]} onValueChange={(next) => next[0] && setSize(next[0])}>
            {SIZES.map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {s} 条
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </div>
      <FieldDescription>
        模拟上游系统（如配料系统、DCS）定时推来新记录，每批一次请求。一批 5 条和 1 条一样快。数据取自测试记录，附实测值做对比（不上传给 LimiX）。
      </FieldDescription>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          {running ? `已推送 ${pushed} 批 · 下一批 ${left} 秒后` : pushed ? `已停止，共推送 ${pushed} 批` : "未开始"}
          {skipped ? ` · ${skipped} 批因上一批未返回而跳过` : ""}
        </span>
        <Button className="ml-auto" variant={running ? "outline" : "default"} onClick={toggle}>
          {running ? <Pause data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" /> : <Play data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />}
          {running ? "停止推送" : "开始推送"}
        </Button>
      </div>
    </div>
  )
}
