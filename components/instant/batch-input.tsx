/**
 * [INPUT]: 依赖 @/components/ui 的 Button、Field、Textarea；依赖 ./records 的 parseTable、Sample；依赖 @/lib/instant-types 的 InstantSpec
 * [OUTPUT]: 导出 BatchInput 组件
 * [POS]: components/instant 的批量输入：上传 CSV，或从 Excel 复制粘贴（制表符分隔）。解析与校验在 records.ts，本组件只管输入与提交。
 *        每个场景备一份示例 CSV（spec.uploadFile），演示时先下载、再上传。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { ClipboardPaste, Download, Play, Upload } from "lucide-react"

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
  onSubmit: (samples: Sample[]) => void
}) {
  const [text, setText] = React.useState("")
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
            第一行是表头，列名写中文或英文都行。带「{spec.target.label}」列时，记录里显示实测值做对比，这一列不上传给 LimiX。一次最多 {MAX_ROWS} 条。
            演示上传：先下载示例 CSV（测试记录，中文表头，带实测值），再点「上传 CSV」选它。
          </FieldDescription>
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" render={<a href={`/${spec.uploadFile}`} download />} nativeButton={false}>
          <Download data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
          下载示例 CSV
        </Button>
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
            if (file) setText(await file.text())
            e.target.value = ""
          }}
        />
        <Button className="ml-auto" disabled={busy || !!error || !rows.length} onClick={() => onSubmit(rows)}>
          <Play data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
          {rows.length ? `预测 ${rows.length} 条` : "预测"}
        </Button>
      </div>
    </div>
  )
}
