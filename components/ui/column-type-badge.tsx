import { Calendar, Hash, KeyRound, Tag, ToggleLeft, Type, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type ColumnType = "numeric" | "category" | "datetime" | "bool" | "text" | "id"
type ColumnRole = "target" | "time" | "covariate" | "feature" | "excluded"

// 语义类型；LimiX field_type 的 string 默认按类别处理，int / float 归入数值。
const columnTypes: Record<ColumnType, { icon: LucideIcon; label: string }> = {
  numeric: { icon: Hash, label: "数值" },
  category: { icon: Tag, label: "类别" },
  datetime: { icon: Calendar, label: "时间" },
  bool: { icon: ToggleLeft, label: "布尔" },
  text: { icon: Type, label: "文本" },
  id: { icon: KeyRound, label: "标识" },
}

const columnRoles: Record<ColumnRole, string> = { target: "目标", time: "时间列", covariate: "协变量", feature: "特征", excluded: "不使用" }

function colTypeOf(t?: string): ColumnType {
  if (t && t in columnTypes) return t as ColumnType
  if (t === "string") return "category"
  if (t === "int" || t === "float" || t === "number") return "numeric"
  if (t === "boolean") return "bool"
  return "text"
}

const roleTone: Partial<Record<ColumnRole, string>> = {
  target: "border-foreground bg-foreground text-background",
  covariate: "border-dashed",
  excluded: "text-muted-foreground line-through",
}

// 列类型标签；role 为 feature（默认）时不显示角色标签。
function ColumnTypeBadge({
  type,
  role,
  storage,
  className,
}: {
  type: ColumnType | string
  role?: ColumnRole
  storage?: string
  className?: string
}) {
  const t = colTypeOf(type)
  const Icon = columnTypes[t].icon
  const badge = (
    <span
      data-type={t}
      title={storage ? `存储类型：${storage}` : undefined}
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-sm border border-border px-1.5 text-xs leading-4 whitespace-nowrap text-muted-foreground",
        (!role || role === "feature") && className,
      )}
    >
      <Icon className="size-3" strokeWidth={1.5} aria-hidden="true" />
      {columnTypes[t].label}
    </span>
  )
  if (!role || role === "feature") return badge
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {badge}
      <span
        data-role={role}
        className={cn(
          "inline-flex h-5 items-center rounded-full border border-border px-2 text-[11px] leading-4 font-medium whitespace-nowrap text-foreground",
          roleTone[role],
        )}
      >
        {columnRoles[role] ?? role}
      </span>
    </span>
  )
}

export { ColumnTypeBadge, colTypeOf, columnTypes, columnRoles, type ColumnType, type ColumnRole }
