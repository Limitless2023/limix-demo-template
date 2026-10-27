/**
 * [INPUT]: 依赖 @/hooks/use-instant 的 InstantApi（由 components/scenario/scenario-page.tsx 创建并传入）；依赖同目录的 FeatureForm、
 *          BatchInput、FeedPanel、ResultCard、PredictProgressCard、SweepChart、RecordsTable 与 records.ts
 * [OUTPUT]: 导出 InstantDemo 组件
 * [POS]: components/instant 的「即时预估」演示主体，场景页「在线预测」标签页的内容。标签页、页头、上下文状态条、模拟标识与报错
 *        都在 components/scenario；这里只管输入、结果、扫描曲线与推理记录。标签页切走时不卸载（状态不丢），上游推送随之停止。
 *        三种输入（手动、批量、上游推送）都汇到 run()，同一条预测链路、同一份记录。场景差异全部来自 InstantSpec。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { ChartSpline, CircleAlert, Play, Shuffle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { InstantApi } from "@/hooks/use-instant"
import type { InstantRow, InstantSpec } from "@/lib/instant-types"

import { BatchInput } from "./batch-input"
import { FeatureForm } from "./feature-form"
import { FeedPanel, type FeedEntry } from "./feed-panel"
import { PredictProgressCard } from "./predict-progress"
import {
  limitsOf,
  parseTable,
  summarize,
  type InferenceRecord,
  type RecordSource,
  type Sample,
} from "./records"
import { RecordsTable } from "./records-table"
import { ResultCard } from "./result-card"
import { SweepChart, type SweepCurve } from "./sweep-chart"

type Mode = "manual" | "batch" | "feed"
const MODES: { value: Mode; label: string }[] = [
  { value: "manual", label: "手动输入" },
  { value: "batch", label: "上传或粘贴" },
  { value: "feed", label: "模拟上游推送" },
]

/** 表单当前内容。来自测试记录时带着实测值（只用于对比）；一旦改动任何一格，就变成手动输入、实测值作废。 */
type FormState = { values: InstantRow; truth?: number; source: RecordSource }

export function InstantDemo({
  spec,
  api,
  active,
}: {
  spec: InstantSpec
  api: InstantApi
  /** 「在线预测」标签页正显示着；切走时上游推送停下 */
  active: boolean
}) {
  const [mode, setMode] = React.useState<Mode>("manual")
  const [samples, setSamples] = React.useState<Sample[]>([])
  const [form, setForm] = React.useState<FormState>(() => ({
    values: midpoint(spec),
    source: "manual",
  }))
  const [records, setRecords] = React.useState<InferenceRecord[]>([])
  const [lastBatch, setLastBatch] = React.useState(0)
  const [sweep, setSweep] = React.useState<{
    current: SweepCurve
    previous?: SweepCurve
  } | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [feedLog, setFeedLog] = React.useState<FeedEntry[]>([])
  const nextId = React.useRef(1)
  const feedCursor = React.useRef(0)
  const feedBatch = React.useRef(0)

  // 测试记录：表单默认填第一条，上游推送从随机位置依次取
  React.useEffect(() => {
    fetch(`/${spec.samplesFile}`)
      .then((r) => r.text())
      .then((text) => {
        const parsed = parseTable(spec, text)
        if ("error" in parsed) throw new Error(parsed.error)
        setSamples(parsed.samples)
        feedCursor.current = Math.floor(Math.random() * parsed.samples.length)
        setForm({
          values: parsed.samples[0].row,
          truth: parsed.samples[0].truth,
          source: "sample",
        })
      })
      .catch((e) =>
        setLoadError(`测试记录加载失败：${e instanceof Error ? e.message : e}`)
      )
  }, [spec])

  // ──────────────────────────────────────────────────────────────
  // 预测：三种输入都走这里，结果写成记录（新的在上）；返回预测，失败返回 null
  // ──────────────────────────────────────────────────────────────

  const run = async (
    source: RecordSource,
    items: Sample[],
    label: string,
    upload?: { name: string; text: string }
  ) => {
    const result = await api.predict(
      items.map((s) => s.row),
      label,
      { source, truths: items.map((s) => s.truth ?? null), upload }
    )
    if (!result) return null
    const at = new Date()
    const made = items.map((s, i): InferenceRecord => ({
      id: nextId.current++,
      at,
      source,
      row: s.row,
      truth: s.truth,
      prediction: result.predictions[i],
    }))
    setRecords((prev) => [...made.reverse(), ...prev])
    setLastBatch(items.length)
    return result.predictions
  }

  const pickSample = () => {
    const s = samples[Math.floor(Math.random() * samples.length)]
    setForm({ values: s.row, truth: s.truth, source: "sample" })
  }

  // 上游推送：收到即列进 feedLog（预测中），预测回来补上 P50
  const feedTick = async (n: number) => {
    const items = Array.from(
      { length: n },
      () => samples[feedCursor.current++ % samples.length]
    )
    const batch = ++feedBatch.current
    const at = new Date()
    const keys = items.map((_, i) => `${batch}-${i}`)
    const received = items.map((sample, i): FeedEntry => ({
      key: keys[i],
      batch,
      at,
      sample,
      status: "pending",
    }))
    setFeedLog((log) => [...received.reverse(), ...log])
    const predictions = await run("feed", items, `上游推送 ${n} 条`)
    setFeedLog((log) =>
      log.map((e) => {
        const i = keys.indexOf(e.key)
        if (i < 0) return e
        return predictions
          ? { ...e, status: "done", p50: predictions[i].p50 }
          : { ...e, status: "failed" }
      })
    )
  }

  const runSweep = async () => {
    const sw = spec.sweep!
    const result = await api.predict(
      sw.values.map((v) => ({ ...form.values, [sw.key]: v })),
      `${sw.title} · ${sw.values.length} 个点`,
      { source: "sweep" }
    )
    if (!result) return
    const label = summarize(
      { ...spec, summaryKeys: spec.summaryKeys.filter((k) => k !== sw.key) },
      form.values
    )
    setSweep((prev) => ({
      current: {
        label,
        points: result.predictions,
        limits: limitsOf(spec, form.values) ?? undefined,
      },
      previous: prev?.current,
    }))
  }

  // ──────────────────────────────────────────────────────────────
  // 记录操作：录入实测值 / 加入上下文。「已加入」记的是加入时的重置轮次：
  // 上下文状态条上点了「恢复初始上下文」（api.resets 加一）后，之前加入的记录自动不再算已加入。
  // ──────────────────────────────────────────────────────────────

  const patch = (id: number, change: Partial<InferenceRecord>) =>
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, ...change } : r)))
  const addToContext = async (id: number) => {
    const r = records.find((x) => x.id === id)
    if (!r || r.truth == null) return
    if (await api.append({ ...r.row, [spec.target.key]: r.truth }))
      patch(id, { addedEpoch: api.resets })
  }
  const handlers = (id: number) => ({
    onTruth: (v: number) => patch(id, { truth: v }),
    onAdd: () => void addToContext(id),
  })

  const view = records.map((r) => ({
    ...r,
    added: r.addedEpoch === api.resets,
  }))
  const latest = view[0] ?? null
  return (
    <div className="flex flex-col gap-6">
      {loadError ? (
        <Alert variant="destructive">
          <CircleAlert strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>测试记录没有加载出来</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>新记录</CardTitle>
            <CardDescription>
              上下文不动，每次只把新记录传给 LimiX。
            </CardDescription>
            <CardAction>
              <ToggleGroup
                variant="segmented"
                aria-label="输入方式"
                value={[mode]}
                onValueChange={(next) => next[0] && setMode(next[0] as Mode)}
              >
                {MODES.map((m) => (
                  <ToggleGroupItem key={m.value} value={m.value}>
                    {m.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent>
            {mode === "manual" ? (
              <div className="grid gap-6">
                <FeatureForm
                  spec={spec}
                  values={form.values}
                  onChange={(key, v) =>
                    setForm((f) => ({
                      values: { ...f.values, [key]: v },
                      source: "manual",
                    }))
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={pickSample}
                    disabled={!samples.length}
                  >
                    <Shuffle
                      data-icon="inline-start"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    抽一条测试记录
                  </Button>
                  {spec.sweep ? (
                    <Button
                      variant="outline"
                      onClick={() => void runSweep()}
                      disabled={api.busy}
                    >
                      <ChartSpline
                        data-icon="inline-start"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      {spec.sweep.title}
                    </Button>
                  ) : null}
                  <Button
                    className="ml-auto"
                    onClick={() =>
                      void run(
                        form.source,
                        [{ row: form.values, truth: form.truth }],
                        "单条预测"
                      )
                    }
                    disabled={api.busy}
                  >
                    <Play
                      data-icon="inline-start"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {api.busy ? "正在预测" : "预测"}
                  </Button>
                </div>
              </div>
            ) : mode === "batch" ? (
              <BatchInput
                spec={spec}
                samples={samples}
                busy={api.busy}
                onSubmit={(items, upload) =>
                  void run("batch", items, `批量 ${items.length} 条`, upload)
                }
              />
            ) : active ? (
              <FeedPanel
                spec={spec}
                busy={api.busy}
                log={feedLog}
                onTick={feedTick}
              />
            ) : null}
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <ResultCard
            spec={spec}
            record={latest}
            batchSize={lastBatch}
            mode={api.progress?.result?.mode ?? null}
            busy={api.contextBusy}
            {...(latest ? handlers(latest.id) : NOOP)}
          />
          <PredictProgressCard progress={api.progress} />
        </div>
      </div>

      {sweep && spec.sweep ? (
        <Card>
          <CardHeader>
            <CardTitle>{spec.sweep.title}</CardTitle>
            <CardDescription>
              其余输入不变，只改
              {spec.features.find((f) => f.key === spec.sweep!.key)?.label}；
              {spec.sweep.values.length}{" "}
              个点一次请求算完。改了输入再点一次，上一条曲线留作对照。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SweepChart
              spec={spec}
              current={sweep.current}
              previous={sweep.previous}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>推理记录</CardTitle>
        </CardHeader>
        <CardContent>
          {view.length ? (
            <RecordsTable
              spec={spec}
              records={view}
              busy={api.contextBusy}
              onTruth={(id, v) => handlers(id).onTruth(v)}
              onAdd={(id) => handlers(id).onAdd()}
            />
          ) : (
            <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              每次预测的记录会出现在这里
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const NOOP = { onTruth: () => {}, onAdd: () => {} }

// 表单初值：各输入列取范围中点并对齐步长；测试记录加载完会被第一条覆盖。
function midpoint(spec: InstantSpec): InstantRow {
  return Object.fromEntries(
    spec.features.map((f) => [
      f.key,
      Math.round((f.min + f.max) / 2 / f.step) * f.step,
    ])
  )
}
