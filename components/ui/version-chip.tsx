"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

type VersionKind = "upload" | "governed" | "generated" | "imputed" | "result"

const versionKind: Record<VersionKind, string> = { upload: "上传", governed: "治理", generated: "生成", imputed: "插补", result: "结果" }

// 数据版本 / 结果版本号：类型 + mono 编号 + 复制按钮；复制成功 1.5 秒内显示对勾并播报「已复制」。
function VersionChip({
  id,
  kind,
  label,
  copyable = true,
  onCopy,
  className,
}: {
  id: string
  kind?: VersionKind
  label?: string
  copyable?: boolean
  onCopy?: (id: string) => void
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])
  const finish = () => {
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
    onCopy?.(id)
  }
  // 剪贴板 API 不可用时退回 execCommand
  const fallback = () => {
    const t = document.createElement("textarea")
    t.value = id
    t.setAttribute("aria-hidden", "true")
    t.style.position = "fixed"
    t.style.opacity = "0"
    document.body.appendChild(t)
    t.select()
    try {
      if (document.execCommand("copy")) finish()
    } catch {
      // 复制失败时保持原样
    }
    t.remove()
  }
  const copy = () => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(id).then(finish, fallback)
    else fallback()
  }
  const Icon = copied ? Check : Copy
  return (
    <span title={id} className={cn("inline-flex h-[22px] max-w-full items-stretch overflow-hidden rounded-sm border border-border bg-background text-xs leading-5", className)}>
      <span className="border-r border-border bg-muted px-2 whitespace-nowrap text-muted-foreground">{label ?? (kind ? versionKind[kind] : undefined) ?? "版本"}</span>
      <span className="min-w-0 truncate px-2 font-mono text-foreground">{id}</span>
      <span className="sr-only" aria-live="polite">{copied ? "已复制" : ""}</span>
      {copyable ? (
        <button
          type="button"
          aria-label={`复制 ${id}`}
          className="inline-flex w-6 flex-none cursor-pointer items-center justify-center border-0 border-l border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          onClick={copy}
        >
          <Icon className="size-3" strokeWidth={1.5} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  )
}

export { VersionChip, type VersionKind }
