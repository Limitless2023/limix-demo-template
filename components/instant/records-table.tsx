/**
 * [INPUT]: 依赖 @/components/ui/table；依赖 ./records 与 ./record-actions；依赖 @/lib/instant-types 的 InstantSpec
 * [OUTPUT]: 导出 RecordsTable 组件
 * [POS]: components/instant 的推理记录：每条一行，新的在上。先看结果（输入、预估、区间、实测、误差），
 *        来源与时间放在后面，最后是行内操作；表注汇总平均绝对误差与区间命中数。
 *        「输入」只写摘要，悬停或键盘聚焦弹出全部输入项。误差 = 预估 − 实测，带正负号。场景配了警戒线时，越线的预估值标红并在悬停时说明。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { InstantSpec } from "@/lib/instant-types"

import { RecordActions } from "./record-actions"
import {
  fmt,
  fmtError,
  fmtInput,
  limitsOf,
  limitText,
  SOURCE_LABEL,
  summarize,
  type InferenceRecord,
} from "./records"

const SHOW = 50
const hms = (d: Date) => d.toLocaleTimeString("zh-CN", { hour12: false })

export function RecordsTable({
  spec,
  records,
  busy,
  onTruth,
  onAdd,
}: {
  spec: InstantSpec
  records: InferenceRecord[]
  busy: boolean
  onTruth: (id: number, value: number) => void
  onAdd: (id: number) => void
}) {
  const { unit, label } = spec.target
  const measured = records.filter((r) => r.truth != null)
  const mae = measured.length
    ? measured.reduce((s, r) => s + Math.abs(r.prediction.p50 - r.truth!), 0) /
      measured.length
    : null
  const inBand = measured.filter(
    (r) => r.truth! >= r.prediction.low && r.truth! <= r.prediction.high
  ).length
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>输入</TableHead>
          <TableHead className="text-right">LimiX（{unit}）</TableHead>
          <TableHead className="text-right">P10–P90</TableHead>
          <TableHead className="text-right">实测</TableHead>
          <TableHead className="text-right">误差</TableHead>
          <TableHead>来源</TableHead>
          <TableHead>时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.slice(0, SHOW).map((r) => {
          const limits = limitsOf(spec, r.row)
          const verdict = limits ? limitText(r.prediction.p50, limits) : null
          return (
          <TableRow key={r.id}>
            <TableCell>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      tabIndex={0}
                      className="cursor-default underline decoration-muted-foreground decoration-dotted underline-offset-4"
                    />
                  }
                >
                  {summarize(spec, r.row)}
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="grid max-w-none grid-cols-[auto_auto] gap-x-4 gap-y-0.5 py-2"
                >
                  {spec.features.map((f) => (
                    <span key={f.key} className="contents">
                      <span>
                        {f.unit ? `${f.label}（${f.unit}）` : f.label}
                      </span>
                      <span className="text-right font-mono tabular-nums">
                        {fmtInput(r.row[f.key])}
                      </span>
                    </span>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {limits && verdict?.out ? (
                <span
                  className="text-destructive"
                  title={`预估${verdict.text}（${fmt(limits.low)} – ${fmt(limits.high)}）`}
                >
                  {fmt(r.prediction.p50)}
                </span>
              ) : (
                fmt(r.prediction.p50)
              )}
            </TableCell>
            <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
              {fmt(r.prediction.low)} – {fmt(r.prediction.high)}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {r.truth != null ? fmt(r.truth) : "—"}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {r.truth != null ? fmtError(r.prediction.p50 - r.truth) : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {SOURCE_LABEL[r.source]}
            </TableCell>
            <TableCell className="font-mono text-muted-foreground tabular-nums">
              {hms(r.at)}
            </TableCell>
            <TableCell className="text-right">
              <RecordActions
                record={r}
                targetLabel={label}
                busy={busy}
                compact
                onTruth={(v) => onTruth(r.id, v)}
                onAdd={() => onAdd(r.id)}
              />
            </TableCell>
          </TableRow>
          )
        })}
      </TableBody>
      <TableCaption>
        共 {records.length} 条
        {records.length > SHOW ? `，显示最近 ${SHOW} 条` : ""}。
        {mae != null
          ? `其中 ${measured.length} 条有实测值：平均绝对误差 ${fmt(mae)} ${unit}，${inBand} 条落在 P10–P90 区间内。`
          : "录入实测值后，这里汇总平均绝对误差与区间命中。"}
      </TableCaption>
    </Table>
  )
}
