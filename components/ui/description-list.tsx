import * as React from "react"

import { cn } from "@/lib/utils"

type DescriptionItem = { label: string; value: React.ReactNode; mono?: boolean }

// 键值对列表：vertical 标签在上（可多列）；horizontal 同行并以分隔线分行。空值显示「—」。
function DescriptionList({
  items,
  layout = "vertical",
  columns = 1,
  className,
}: {
  items: DescriptionItem[]
  layout?: "vertical" | "horizontal"
  columns?: number
  className?: string
}) {
  const horizontal = layout === "horizontal"
  return (
    <dl
      // 多列：600px 以下自动回到一列
      className={cn("m-0 grid text-sm leading-5", horizontal ? "gap-0" : "gap-x-6 gap-y-3", !horizontal && columns > 1 && "min-[600px]:grid-cols-[repeat(var(--sa-dl-columns),minmax(0,1fr))]", className)}
      style={!horizontal && columns > 1 ? ({ "--sa-dl-columns": columns } as React.CSSProperties) : undefined}
    >
      {items.map((item) => {
        const empty = item.value == null || item.value === ""
        return (
          <div
            key={item.label}
            className={cn("grid min-w-0 content-start gap-1", horizontal && "grid-cols-[minmax(88px,36%)_minmax(0,1fr)] gap-4 border-b border-border py-2 first:pt-0 last:border-b-0 last:pb-0")}
          >
            <dt className="text-[13px] text-muted-foreground [overflow-wrap:anywhere]">{item.label}</dt>
            <dd className={cn("m-0 min-w-0 [overflow-wrap:anywhere]", item.mono && "font-mono text-[13px] tabular-nums")}>
              {empty ? "—" : typeof item.value === "number" ? item.value.toLocaleString("zh-CN") : item.value}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

export { DescriptionList, type DescriptionItem }
