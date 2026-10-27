/**
 * [INPUT]: 依赖 @/components/ui 的 Badge、Button、Input；依赖 ./records 的 InferenceRecord
 * [OUTPUT]: 导出 RecordActions 组件
 * [POS]: components/instant 中一条推理记录的下一步操作，结果卡片与推理记录表共用。
 *        状态机：没有实测值 → 录入实测值；有实测值 → 加入上下文 → 已加入。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { InferenceRecord } from "./records"

export function RecordActions({
  record,
  targetLabel,
  busy,
  compact,
  onTruth,
  onAdd,
}: {
  record: InferenceRecord
  targetLabel: string
  busy: boolean
  /** 表格行内用文字按钮，结果卡片用描边按钮 */
  compact?: boolean
  onTruth: (value: number) => void
  onAdd: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const variant = compact ? "ghost" : "outline"

  if (record.added) return <Badge variant="outline">已加入上下文</Badge>
  if (record.truth == null) {
    if (!editing)
      return (
        <Button variant={variant} size="sm" onClick={() => setEditing(true)}>
          录入实测值
        </Button>
      )
    const value = Number(draft)
    const valid = draft.trim() !== "" && Number.isFinite(value)
    return (
      <span className="inline-flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          autoFocus
          aria-label={`实测${targetLabel}`}
          className="h-[var(--control-height-sm)] w-24 text-right font-mono"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid) onTruth(value)
            if (e.key === "Escape") setEditing(false)
          }}
        />
        <Button variant={variant} size="sm" disabled={!valid} onClick={() => onTruth(value)}>
          确认
        </Button>
      </span>
    )
  }
  return (
    <Button variant={variant} size="sm" disabled={busy} onClick={onAdd}>
      加入上下文
    </Button>
  )
}
