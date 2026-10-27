/**
 * [INPUT]: 依赖 @/components/ui 的 Badge、Card、IntervalBand；依赖 ./records 与 ./record-actions；依赖 @/lib/instant-types 的 InstantSpec
 * [OUTPUT]: 导出 ResultCard 组件
 * [POS]: components/instant 的主读数：最新一条记录的 P50 大字、P10–P90 区间带、这条记录的警戒线区间与预估是否越线（场景配了 limits 时）、
 *        实测值（有则显示）与误差，以及下一步操作。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IntervalBand } from "@/components/ui/interval-band"
import type { InstantSpec } from "@/lib/instant-types"

import { RecordActions } from "./record-actions"
import {
  fmt,
  fmtError,
  limitsOf,
  limitText,
  SOURCE_LABEL,
  summarize,
  type InferenceRecord,
} from "./records"

export function ResultCard({
  spec,
  record,
  batchSize,
  mode,
  busy,
  onTruth,
  onAdd,
}: {
  spec: InstantSpec
  record: InferenceRecord | null
  /** 最新一批的条数；大于 1 时提示其余记录在下方 */
  batchSize: number
  mode: "live" | "mock" | null
  busy: boolean
  onTruth: (value: number) => void
  onAdd: () => void
}) {
  const { target } = spec
  const shown = record?.truth
  const limits = record ? limitsOf(spec, record.row) : null
  const verdict = record && limits ? limitText(record.prediction.p50, limits) : null
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>预估{target.label}</CardTitle>
        {record ? (
          <CardDescription>{`${SOURCE_LABEL[record.source]} · ${summarize(spec, record.row)}`}</CardDescription>
        ) : null}
        {mode ? (
          <CardAction>
            <Badge variant={mode === "live" ? "accent" : "outline"}>
              {mode === "live" ? "LimiX 实时结果" : "模拟结果"}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        {record ? (
          <p className="m-0 flex items-baseline gap-2">
            <span className="font-mono text-[40px] leading-[48px] tabular-nums">
              {fmt(record.prediction.p50)}
            </span>
            <span className="text-sm text-muted-foreground">{target.unit}</span>
          </p>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">
            点「预测」后，这里显示中位预估 P50 和 P10–P90 区间。
          </p>
        )}
        {record ? (
          <IntervalBand
            value={record.prediction.p50}
            low={record.prediction.low}
            high={record.prediction.high}
            actual={shown}
            unit={target.unit}
            format={(v) => fmt(v)}
          />
        ) : null}
        {record && limits && verdict ? (
          <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
            <span>
              这批的{limits.label}{" "}
              <span className="font-mono text-foreground tabular-nums">
                {fmt(limits.low)} – {fmt(limits.high)}
              </span>
              {target.unit}
            </span>
            <Badge variant={verdict.out ? "destructive" : "outline"}>
              预估{verdict.text}
            </Badge>
          </p>
        ) : null}
        {record && shown != null ? (
          <p className="m-0 text-[13px] text-muted-foreground">
            实测{" "}
            <span className="font-mono text-foreground tabular-nums">
              {fmt(shown)}
            </span>{" "}
            {target.unit}，误差{" "}
            <span className="font-mono text-foreground tabular-nums">
              {fmtError(record.prediction.p50 - shown)}
            </span>
            {shown >= record.prediction.low && shown <= record.prediction.high
              ? "，落在区间内"
              : "，落在区间外"}
          </p>
        ) : null}
        {batchSize > 1 ? (
          <p className="m-0 text-[13px] text-muted-foreground">
            本批 {batchSize} 条，这里显示最后一条，全部见下方推理记录。
          </p>
        ) : null}
      </CardContent>
      {record ? (
        <CardFooter>
          <RecordActions
            record={record}
            targetLabel={target.label}
            busy={busy}
            onTruth={onTruth}
            onAdd={onAdd}
          />
        </CardFooter>
      ) : null}
    </Card>
  )
}
