"use client"

import * as React from "react"
import { FileText, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { StatusDot, type StatusTone } from "@/components/ui/status-dot"

type FileStatus = "uploading" | "parsing" | "success" | "reused" | "error"
type FileItem = { id: string; name: string; size?: number; status: FileStatus; progress?: number; message?: string }

const statusMap: Record<FileStatus, { tone: StatusTone; label: string; pulse?: boolean }> = {
  uploading: { tone: "active", label: "上传中", pulse: true },
  parsing: { tone: "active", label: "解析中", pulse: true },
  success: { tone: "success", label: "已上传" },
  reused: { tone: "success", label: "已复用" },
  error: { tone: "error", label: "失败" },
}

const formatSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`)

// 拖放或点击选择文件；文件行的状态由调用方通过 files 受控传入。格式与大小不符的文件交给 onReject。
function FileDropzone({
  accept = ".csv,.tsv,.xls,.xlsx,.parquet",
  multiple,
  maxSizeMB,
  hint,
  disabled,
  files = [],
  onFiles,
  onReject,
  onRemove,
  className,
}: {
  accept?: string
  multiple?: boolean
  maxSizeMB?: number
  hint?: string
  disabled?: boolean
  files?: FileItem[]
  onFiles?: (files: File[]) => void
  onReject?: (file: File, reason: string) => void
  onRemove?: (item: FileItem) => void
  className?: string
}) {
  const input = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const hintId = React.useId()
  const exts = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  const take = (list: FileList | null) => {
    if (!list || disabled) return
    const ok: File[] = []
    for (const file of Array.from(list)) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (exts.length && !exts.includes(ext)) onReject?.(file, "格式不支持")
      else if (maxSizeMB && file.size > maxSizeMB * 1048576) onReject?.(file, `超过 ${maxSizeMB} MB`)
      else ok.push(file)
    }
    if (ok.length) onFiles?.(multiple ? ok : ok.slice(0, 1))
  }
  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={hintId}
        className={cn(
          "grid cursor-pointer justify-items-center gap-1 rounded-md border border-dashed border-input bg-[var(--surface)] px-4 py-6 text-center text-[13px] leading-5 text-muted-foreground transition-colors hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          dragging && "border-solid border-primary bg-accent text-accent-foreground",
          disabled && "cursor-default opacity-50",
        )}
        onClick={() => !disabled && input.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            if (!disabled) input.current?.click()
          }
        }}
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); take(event.dataTransfer.files) }}
      >
        <Upload className="mb-1 size-5 text-[var(--icon-default)]" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">
          拖入文件，或<u className="decoration-primary decoration-2 underline-offset-[3px]">点击选择</u>
        </span>
        <span id={hintId}>{hint ?? `支持 ${exts.map((e) => e.slice(1).toUpperCase()).join(" / ")}${maxSizeMB ? `，单个不超过 ${maxSizeMB} MB` : ""}`}</span>
      </div>
      <input ref={input} type="file" accept={accept} multiple={multiple} hidden tabIndex={-1} onChange={(event) => { take(event.target.files); event.target.value = "" }} />
      {files.length ? (
        <ul aria-live="polite" className="mt-3 grid list-none gap-2 p-0">
          {files.map((f) => {
            const st = statusMap[f.status]
            return (
              <li key={f.id} className={cn("grid grid-cols-[16px_1fr_auto] items-center gap-x-3 gap-y-1 rounded-sm border border-border bg-background p-3 text-[13px] leading-5", f.status === "error" && "border-destructive")}>
                <FileText className="size-4 text-[var(--icon-default)]" strokeWidth={1.5} aria-hidden="true" />
                <span title={f.name} className="truncate font-medium">{f.name}</span>
                <button type="button" aria-label={`移除 ${f.name}`} className="inline-flex size-[var(--control-height-md)] items-center justify-center rounded-md hover:bg-accent" onClick={() => onRemove?.(f)}>
                  <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
                <span className={cn("col-[2/-1] flex flex-wrap gap-x-3 gap-y-1 text-xs leading-[18px] text-muted-foreground", f.status === "error" && "text-destructive")}>
                  <StatusDot tone={st.tone} pulse={st.pulse} label={st.label + (f.status === "uploading" && f.progress != null ? ` ${Math.round(f.progress)}%` : "")} />
                  {f.size != null ? <span className="font-mono tabular-nums">{formatSize(f.size)}</span> : null}
                  {f.message ? <span>{f.message}</span> : null}
                </span>
                {f.status === "uploading" ? <Progress className="col-[2/-1] *:data-[slot=progress-track]:h-1" value={f.progress ?? 0} aria-label={`${f.name} 上传进度`} /> : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export { FileDropzone, type FileItem, type FileStatus }
