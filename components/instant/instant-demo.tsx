/**
 * [INPUT]: 依赖 @/hooks/use-instant 的 useInstant；依赖同目录的 ScenarioCard、FeatureForm、BatchInput、FeedPanel、ResultCard、
 *          PredictProgressCard、SweepChart、RecordsTable 与 records.ts；依赖 @/components/blocks/app-shell 的 PageHeader
 * [OUTPUT]: 导出 InstantDemo 组件
 * [POS]: components/instant 的整页编排，「即时预估」场景页只渲染它。分两个 tab：「案例介绍」先讲场景与效果，「在线演示」现场预测；
 *        当前 tab 写进地址 ?tab=demo，刷新与转发停在同一页。持有输入表单、推理记录、扫描曲线三份状态（切 tab 不丢）；
 *        三种输入（手动、批量、上游推送）都汇到 run()，同一条预测链路、同一份记录。场景差异全部来自 InstantSpec。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { ChartSpline, CircleAlert, Info, Play, Shuffle } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useInstant } from "@/hooks/use-instant"
import type { InstantRow, InstantSpec } from "@/lib/instant-types"

import { BatchInput } from "./batch-input"
import { ContextBar } from "./context-bar"
import { FeatureForm } from "./feature-form"
import { FeedPanel } from "./feed-panel"
import { PredictProgressCard } from "./predict-progress"
import {
  parseTable,
  summarize,
  type InferenceRecord,
  type RecordSource,
  type Sample,
} from "./records"
import { RecordsTable } from "./records-table"
import { ResultCard } from "./result-card"
import { ScenarioCard } from "./scenario-card"
import { SweepChart, type SweepCurve } from "./sweep-chart"

export type InstantTab = "case" | "demo"
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
  mock,
  initialTab,
}: {
  spec: InstantSpec
  mock: boolean
  initialTab: InstantTab
}) {
  const api = useInstant(spec)
  const [tab, setTab] = React.useState<InstantTab>(initialTab)
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
  const nextId = React.useRef(1)
  const feedCursor = React.useRef(0)

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
  // 预测：三种输入都走这里，结果写成记录（新的在上）
  // ──────────────────────────────────────────────────────────────

  const run = async (source: RecordSource, items: Sample[], label: string) => {
    const result = await api.predict(
      items.map((s) => s.row),
      label
    )
    if (!result) return
    const at = new Date()
    const made = items.map((s, i): InferenceRecord => ({
      id: nextId.current++,
      at,
      source,
      row: s.row,
      truth: s.truth,
      prediction: result.predictions[i],
      added: false,
    }))
    setRecords((prev) => [...made.reverse(), ...prev])
    setLastBatch(items.length)
  }

  const pickSample = () => {
    const s = samples[Math.floor(Math.random() * samples.length)]
    setForm({ values: s.row, truth: s.truth, source: "sample" })
  }

  const feedTick = (n: number) => {
    const items = Array.from(
      { length: n },
      () => samples[feedCursor.current++ % samples.length]
    )
    return run("feed", items, `上游推送 ${n} 条`)
  }

  const runSweep = async () => {
    const sw = spec.sweep!
    const result = await api.predict(
      sw.values.map((v) => ({ ...form.values, [sw.key]: v })),
      `${sw.title} · ${sw.values.length} 个点`
    )
    if (!result) return
    const label = summarize(
      { ...spec, summaryKeys: spec.summaryKeys.filter((k) => k !== sw.key) },
      form.values
    )
    setSweep((prev) => ({
      current: { label, points: result.predictions },
      previous: prev?.current,
    }))
  }

  // ──────────────────────────────────────────────────────────────
  // 记录操作：录入实测值 / 加入上下文
  // ──────────────────────────────────────────────────────────────

  const patch = (id: number, change: Partial<InferenceRecord>) =>
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, ...change } : r)))
  const addToContext = async (id: number) => {
    const r = records.find((x) => x.id === id)
    if (!r || r.truth == null) return
    if (await api.append({ ...r.row, [spec.target.key]: r.truth }))
      patch(id, { added: true })
  }
  const resetContext = async () => {
    if (await api.reset())
      setRecords((rs) => rs.map((r) => ({ ...r, added: false })))
  }
  const handlers = (id: number) => ({
    onTruth: (v: number) => patch(id, { truth: v }),
    onAdd: () => void addToContext(id),
  })

  // 切 tab 时只改地址栏，不触发路由：刷新或转发链接时停在同一个 tab
  const switchTab = (next: InstantTab) => {
    setTab(next)
    const url = new URL(window.location.href)
    if (next === "demo") url.searchParams.set("tab", "demo")
    else url.searchParams.delete("tab")
    window.history.replaceState(null, "", url)
  }

  const latest = records[0] ?? null
  const error = loadError ?? api.error
  const contextBar = (action?: React.ReactNode) => (
    <ContextBar
      info={api.info}
      label={spec.copy.contextLabel}
      busy={api.contextBusy}
      downloadHref={`/api/instant?scenario=${spec.slug}&download=context`}
      onReset={() => void resetContext()}
      action={action}
    />
  )
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={spec.copy.eyebrow}
        title={spec.copy.title}
        description={spec.copy.description}
      />

      {mock ? (
        <Alert role="status">
          <Info strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>模拟结果，未连接 LimiX</AlertTitle>
          <AlertDescription>
            没有配置 LIMIX_API_KEY，预测取上下文表里最相近 7
            条记录的均值，只用于走通演示流程。
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <CircleAlert strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>出了点问题</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(next) => switchTab(next as InstantTab)}
        className="gap-6"
      >
        <TabsList variant="line">
          <TabsTrigger value="case">案例介绍</TabsTrigger>
          <TabsTrigger value="demo">在线演示</TabsTrigger>
        </TabsList>

        <TabsContent value="case">
          <ScenarioCard
            spec={spec}
            footer={contextBar(
              <Button size="sm" onClick={() => switchTab("demo")}>
                <Play
                  data-icon="inline-start"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                开始在线演示
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="demo" className="flex flex-col gap-6">
          <Card size="sm">
            <CardContent>{contextBar()}</CardContent>
          </Card>

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
                    onValueChange={(next) =>
                      next[0] && setMode(next[0] as Mode)
                    }
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
                    onSubmit={(items) =>
                      void run("batch", items, `批量 ${items.length} 条`)
                    }
                  />
                ) : (
                  <FeedPanel busy={api.busy} onTick={feedTick} />
                )}
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
                  {spec.features.find((f) => f.key === spec.sweep!.key)?.label}
                  ；{spec.sweep.values.length}{" "}
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
              {records.length ? (
                <RecordsTable
                  spec={spec}
                  records={records}
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
        </TabsContent>
      </Tabs>

      <p className="m-0 text-[13px] leading-5 text-muted-foreground">
        {spec.copy.dataNote}
      </p>
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
