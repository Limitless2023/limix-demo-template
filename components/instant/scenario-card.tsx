/**
 * [INPUT]: 依赖 @/components/ui 的 Button、Card、Stat、Table；依赖 ./records 的 fmt；依赖 @/lib/instant-types 的 InstantSpec
 * [OUTPUT]: 导出 ScenarioCard 组件
 * [POS]: components/instant 的「场景与数据」卡：场景、任务、上下文三段说明，可展开的字段说明，离线评估成绩，
 *        底部由调用方传入（上下文状态行 + 开始在线演示）。是「案例介绍」tab 的全部内容：先讲清基于什么数据、预测什么、效果怎样。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Stat } from "@/components/ui/stat"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InstantSpec } from "@/lib/instant-types"

import { fmt } from "./records"

export function ScenarioCard({ spec, footer }: { spec: InstantSpec; footer: React.ReactNode }) {
  const [showFields, setShowFields] = React.useState(false)
  const columns = [...spec.features, spec.target]
  return (
    <Card>
      <CardHeader>
        <CardTitle>场景与数据</CardTitle>
        <CardDescription>基于什么数据、预测什么、效果怎样。</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setShowFields((v) => !v)} aria-expanded={showFields}>
            {showFields ? <ChevronUp data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" /> : <ChevronDown data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />}
            字段说明（{columns.length} 列）
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-3">
          {spec.copy.facts.map((f) => (
            <div key={f.title} className="grid content-start gap-1">
              <h3 className="m-0 text-[13px] leading-5 font-medium text-muted-foreground">{f.title}</h3>
              <p className="m-0 text-sm leading-[22px]">{f.body}</p>
            </div>
          ))}
        </div>

        {showFields ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>字段</TableHead>
                <TableHead>列名</TableHead>
                <TableHead>含义</TableHead>
                <TableHead className="text-right">单位</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map((c) => (
                <TableRow key={c.key}>
                  <TableCell className="font-medium">{c.label}{c.key === spec.target.key ? "（预测目标）" : ""}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{c.key}</TableCell>
                  <TableCell>{c.note}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{c.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        {spec.evaluation ? <Evaluation spec={spec} /> : null}
      </CardContent>
      <CardFooter className="border-t border-border pt-[var(--card-spacing)]">{footer}</CardFooter>
    </Card>
  )
}

// 离线评估：三张指标卡 + 一行口径说明。数字全部取自 metrics.json（spec.evaluation.source），不手抄；路径不展示给客户。
function Evaluation({ spec }: { spec: InstantSpec }) {
  const ev = spec.evaluation!
  const { result } = ev
  const limix = result.methods[ev.limix]
  const ref = result.methods[ev.reference]
  const naive = result.methods[ev.naive]
  const unit = spec.target.unit
  return (
    <div className="grid gap-3">
      <h3 className="m-0 text-[13px] leading-5 font-medium text-muted-foreground">效果</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="平均误差"
          value={fmt(limix.mae)}
          unit={unit}
          note={`${ev.naive} ${fmt(naive.mae)} ${unit}${ref ? `；${ev.reference} ${fmt(ref.mae)} ${unit}` : ""}`}
        />
        <Stat label="R²" value={limix.r2.toFixed(2)} note={ref ? `${ev.reference} ${ref.r2.toFixed(2)}` : "越接近 1 越准"} />
        {limix.coverage_p10_p90 != null ? (
          <Stat label="实测落在 P10–P90 区间内" value={Math.round(limix.coverage_p10_p90 * 100)} unit="%" note="P10–P90 是八成区间，理应覆盖约 80%" />
        ) : null}
      </div>
      <p className="m-0 text-[13px] leading-5 text-muted-foreground">
        {result.date} 用 {result.model} 在 {result.test_rows} 条测试记录上离线评估（上下文 {result.context_rows} 条，单次切分）。LimiX 不训练，
        {ev.reference}在同一份上下文上训练后预测。
      </p>
    </div>
  )
}
