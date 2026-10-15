/**
 * [INPUT]: 依赖 @/components/ui 的 Badge、Button、Skeleton；依赖 lucide-react 图标；依赖 @/lib/instant-types 的 ContextInfo
 * [OUTPUT]: 导出 ContextBar 组件
 * [POS]: components/instant 的上下文状态行：几条历史、新加入几条、上传中提示，以及下载当前上下文与恢复初始上下文。
 *        两个 tab 共用：案例介绍放在场景卡底部（末尾带「开始在线演示」），在线演示放在顶部小卡里。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type * as React from "react"
import { Database, Download, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { ContextInfo } from "@/lib/instant-types"

export function ContextBar({
  info,
  label,
  busy,
  downloadHref,
  onReset,
  action,
}: {
  info: ContextInfo | null
  label: string
  busy: boolean
  /** 下载当前上下文 CSV（含演示中加入的记录） */
  downloadHref: string
  onReset: () => void
  /** 行尾的额外操作，如「开始在线演示」 */
  action?: React.ReactNode
}) {
  // 上下文还在加载（或加载失败）时，行尾操作照常可用
  if (!info)
    return (
      <div className="flex w-full items-center gap-4">
        <Skeleton className="h-4 w-72" />
        <span className="ml-auto">{action}</span>
      </div>
    )
  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <Database className="size-5 text-[var(--icon-muted)]" strokeWidth={1.5} aria-hidden="true" />
      <span>
        上下文 <span className="font-mono tabular-nums">{info.rows}</span> 条{label}
      </span>
      {info.addedRows ? <Badge variant="accent">新加入 {info.addedRows} 条</Badge> : null}
      {busy ? <span className="text-muted-foreground">正在上传到 LimiX…</span> : null}
      <span className="ml-auto flex flex-wrap gap-2">
        {info.addedRows ? (
          <Button variant="ghost" size="sm" onClick={onReset} disabled={busy}>
            <RotateCcw data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
            恢复初始上下文
          </Button>
        ) : null}
        <Button variant="outline" size="sm" render={<a href={downloadHref} download />} nativeButton={false}>
          <Download data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
          下载上下文 CSV
        </Button>
        {action}
      </span>
    </div>
  )
}
