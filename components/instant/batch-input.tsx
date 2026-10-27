/**
 * [INPUT]: 依赖 @/components/ui 的 Button、Field、Textarea；依赖 ./records 的 parseTable、Sample；依赖 @/lib/instant-types 的 InstantSpec
 * [OUTPUT]: 导出 BatchInput 组件
 * [POS]: components/instant 的批量输入：上传 CSV，或从 Excel 复制粘贴（制表符分隔）。解析与校验在 records.ts，本组件只管输入与提交。
 *        内容来自上传且没改过时，提交时带上原文件（文件名 + 原文），服务端留痕存档。
 *        主操作是上传 CSV；示例 CSV（spec.uploadFile）是辅助，放在说明文字末尾做链接，不和按钮平级。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { ClipboardPaste, Play, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import type { InstantSpec } from "@/lib/instant-types"

import { fmt, parseTable, type Sample } from "./records"

const MAX_ROWS = 200

export function BatchInput({
  spec,
  samples,
  busy,
  onSubmit,
}: {
  spec: InstantSpec
  /** 用来填示例：从测试记录里取 5 条，按 Excel 复制出来的格式写进文本框 */
  samples: Sample[]
  busy: boolean
  onSubmit: (samples: Sample[], upload?: { name: string; text: string }) => void
}) {
  const [text, setText] = React.useState("")
  const [uploaded, setUploaded] = React.useState<{ name: string; text: string } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const parsed = React.useMemo(() => (text.trim() ? parseTable(spec, text) : null), [spec, text])
  const error = parsed && "error" in parsed ? parsed.error : parsed && parsed.samples.length > MAX_ROWS ? `一次最多 ${MAX_ROWS} 条` : null
  const rows = parsed && "samples" in parsed ? parsed.samples : []

  const fillExample = () => {
    const header = [...spec.features.map((f) => f.label), spec.target.label].join("\t")
    const picked = Array.from({ length: 5 }, () => samples[Math.floor(Math.random() * samples.length)])
    const lines = picked.map((s) => [...spec.features.map((f) => fmt(s.row[f.key], 2)), s.truth != null ? fmt(s.truth, 2) : ""].join("\t"))
    setText([header, ...lines].join("\n"))
  }

  return (
    <div className="grid gap-4">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="batch-table">粘贴表格或上传 CSV</FieldLabel>
        <Textarea
          id="batch-table"
          rows={7}
          className="font-mono text-[13px]"
          placeholder={[spec.features.map((f) => f.label).join("\t"), "…"].join("\n")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>
            第一行是表头，中英文列名都行；「{spec.target.label}」列只用来对比，不上传。一次最多 {MAX_ROWS} 条。没有文件可先
            <a href={`/${spec.uploadFile}`} download className="mx-0.5 text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground">
              下载示例 CSV
            </a>
            。
          </FieldDescription>
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
          上传 CSV
        </Button>
        <Button variant="outline" onClick={fillExample} disabled={!samples.length}>
          <ClipboardPaste data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
          填入 5 条测试记录
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) {
              const content = await file.text()
              setText(content)
              setUploaded({ name: file.name, text: content })
            }
            e.target.value = ""
          }}
        />
        <Button className="ml-auto" disabled={busy || !!error || !rows.length} onClick={() => onSubmit(rows, uploaded && uploaded.text === text ? uploaded : undefined)}>
          <Play data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
          {rows.length ? `预测 ${rows.length} 条` : "预测"}
        </Button>
      </div>
    </div>
  )
}
