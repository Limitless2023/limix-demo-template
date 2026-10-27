/**
 * [INPUT]: 依赖 @/components/ui 的 Button、Field、Table、ToggleGroup；依赖 ./records 的 fmt、fmtInput、Sample；
 *          依赖 @/lib/instant-types 的 InstantSpec；依赖 react 的计时与 ref
 * [OUTPUT]: 导出 FeedPanel 组件与 FeedEntry 类型
 * [POS]: components/instant 的模拟上游推送：按间隔把一批测试记录当作上游系统的新数据推过来。
 *        管节奏（间隔、每批条数、倒计时、跳过），并把收到的数据逐条列出（收到时间、预估状态、实测、全部输入列）。
 *        取哪几条、怎么预测、收到的数据（log）都由 instant-demo.tsx 持有，切换输入方式不丢。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { Pause, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { InstantSpec } from "@/lib/instant-types"

import { fmt, fmtInput, type Sample } from "./records"

// 一次预测约 6 秒（2026-10-15 实测），最短间隔 10 秒，保证上一批回来再推下一批。
const INTERVALS = ["10", "15", "30"]
const SIZES = ["1", "3", "5"]
const SHOW = 50
const hms = (d: Date) => d.toLocaleTimeString("zh-CN", { hour12: false })

/** 上游推来的一条数据：收到即列出，预测回来后补上 P50；新的在上 */
export type FeedEntry = {
  key: string
  batch: number
  at: Date
  sample: Sample
  status: "pending" | "done" | "failed"
  p50?: number
}

export function FeedPanel({
  spec,
  busy,
  log,
  onTick,
}: {
  spec: InstantSpec
  busy: boolean
  log: FeedEntry[]
  onTick: (batchSize: number) => Promise<void>
}) {
  const [running, setRunning] = React.useState(false)
  const [period, setPeriod] = React.useState("15")
  const [size, setSize] = React.useState("3")
  const [left, setLeft] = React.useState(0)
  const [skipped, setSkipped] = React.useState(0)
  const pushed = log[0]?.batch ?? 0
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
          <ToggleGroup
            variant="segmented"
            aria-labelledby="feed-interval"
            value={[period]}
            onValueChange={(next) => next[0] && setPeriod(next[0])}
          >
            {INTERVALS.map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {s} 秒
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field className="w-auto">
          <FieldLabel id="feed-size">每批条数</FieldLabel>
          <ToggleGroup
            variant="segmented"
            aria-labelledby="feed-size"
            value={[size]}
            onValueChange={(next) => next[0] && setSize(next[0])}
          >
            {SIZES.map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {s} 条
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </div>
      <FieldDescription>
        模拟上游系统（如配料系统、DCS）定时推来新记录，每批一次请求。
      </FieldDescription>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          {running
            ? `已推送 ${pushed} 批 · 下一批 ${left} 秒后`
            : pushed
              ? `已停止，共推送 ${pushed} 批`
              : "未开始"}
          {skipped ? ` · ${skipped} 批因上一批未返回而跳过` : ""}
        </span>
        <Button
          className="ml-auto"
          variant={running ? "outline" : "default"}
          onClick={toggle}
        >
          {running ? (
            <Pause
              data-icon="inline-start"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ) : (
            <Play
              data-icon="inline-start"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
          {running ? "停止推送" : "开始推送"}
        </Button>
      </div>
      {log.length ? (
        <FeedTable spec={spec} log={log} />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          开始推送后，上游推来的数据逐条列在这里
        </div>
      )}
    </div>
  )
}

// 收到的数据：一行一条。收到时间之后先放预估与实测（窄屏横向滚动时也看得到），再列全部输入（表头带单位）。同一批的收到时间相同。
function FeedTable({ spec, log }: { spec: InstantSpec; log: FeedEntry[] }) {
  const { target } = spec
  return (
    <div className="grid gap-2">
      <p className="m-0 text-[13px] text-muted-foreground">
        收到的数据 · 共 {log.length} 条
        {log.length > SHOW ? `，显示最近 ${SHOW} 条` : ""}
      </p>
      <div className="max-h-[320px] overflow-y-auto rounded-md">
        {/* 11 列数字：单元格内边距收窄，常见宽度下一屏放得下 */}
        <Table className="[&_td]:px-2 [&_td:first-child]:pl-3 [&_td:last-child]:pr-3 [&_th]:px-2 [&_th:first-child]:pl-3 [&_th:last-child]:pr-3">
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="align-bottom">收到时间</TableHead>
              <TableHead className="text-right align-bottom">
                <span className="block">LimiX</span>
                <span className="block text-xs font-normal">{target.unit}</span>
              </TableHead>
              <TableHead className="text-right align-bottom">
                <span className="block">实测</span>
                <span className="block text-xs font-normal">{target.unit}</span>
              </TableHead>
              {spec.features.map((f) => (
                <TableHead key={f.key} className="text-right align-bottom">
                  <span className="block">{f.label}</span>
                  <span className="block text-xs font-normal">{f.unit}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {log.slice(0, SHOW).map((e) => (
              <TableRow key={e.key}>
                <TableCell className="font-mono text-muted-foreground tabular-nums">
                  {hms(e.at)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {e.status === "done" && e.p50 != null ? (
                    fmt(e.p50)
                  ) : e.status === "failed" ? (
                    <span className="font-sans text-destructive">失败</span>
                  ) : (
                    <span className="font-sans text-muted-foreground">
                      预测中
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                  {e.sample.truth != null ? fmt(e.sample.truth) : "—"}
                </TableCell>
                {spec.features.map((f) => (
                  <TableCell
                    key={f.key}
                    className="text-right font-mono tabular-nums"
                  >
                    {fmtInput(e.sample.row[f.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
