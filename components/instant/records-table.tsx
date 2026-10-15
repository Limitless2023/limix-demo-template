/**
 * [INPUT]: 依赖 @/components/ui/table；依赖 ./records 与 ./record-actions；依赖 @/lib/instant-types 的 InstantSpec
 * [OUTPUT]: 导出 RecordsTable 组件
 * [POS]: components/instant 的推理记录：每条一行，新的在上。先看结果（输入、预估、区间、实测、差），
 *        来源与时间放在后面，最后是行内操作；表注汇总有实测值的记录的平均差与区间命中数。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InstantSpec } from "@/lib/instant-types"

import { RecordActions } from "./record-actions"
import { fmt, SOURCE_LABEL, summarize, type InferenceRecord } from "./records"

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
  const mae = measured.length ? measured.reduce((s, r) => s + Math.abs(r.prediction.p50 - r.truth!), 0) / measured.length : null
  const inBand = measured.filter((r) => r.truth! >= r.prediction.low && r.truth! <= r.prediction.high).length
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>输入</TableHead>
          <TableHead className="text-right">预估（{unit}）</TableHead>
          <TableHead className="text-right">P10–P90</TableHead>
          <TableHead className="text-right">实测</TableHead>
          <TableHead className="text-right">差</TableHead>
          <TableHead>来源</TableHead>
          <TableHead>时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.slice(0, SHOW).map((r) => (
          <TableRow key={r.id}>
            <TableCell>{summarize(spec, r.row)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{fmt(r.prediction.p50)}</TableCell>
            <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
              {fmt(r.prediction.low)} – {fmt(r.prediction.high)}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">{r.truth != null ? fmt(r.truth) : "—"}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{r.truth != null ? fmt(r.prediction.p50 - r.truth) : "—"}</TableCell>
            <TableCell className="text-muted-foreground">{SOURCE_LABEL[r.source]}</TableCell>
            <TableCell className="font-mono text-muted-foreground tabular-nums">{hms(r.at)}</TableCell>
            <TableCell className="text-right">
              <RecordActions record={r} targetLabel={label} busy={busy} compact onTruth={(v) => onTruth(r.id, v)} onAdd={() => onAdd(r.id)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableCaption>
        共 {records.length} 条{records.length > SHOW ? `，显示最近 ${SHOW} 条` : ""}。
        {mae != null ? `其中 ${measured.length} 条有实测值：平均差 ${fmt(mae)} ${unit}，${inBand} 条落在 P10–P90 区间内。` : "录入实测值后，这里汇总平均差与区间命中。"}
      </TableCaption>
    </Table>
  )
}
