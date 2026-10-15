"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ColumnTypeBadge, colTypeOf, columnRoles, type ColumnRole, type ColumnType } from "@/components/ui/column-type-badge"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

type TaskKind = "classification" | "regression" | "timeseries"
type RoleValue = { target?: string | null; time?: string | null; covariates?: string[]; features?: string[]; excluded?: string[] }
type RoleState = { target: string | null; time: string | null; covariates: string[]; features: string[]; excluded: string[]; valid: boolean; problems: string[] }

// 各任务可用的角色与目标列类型约束；与 LimiX 分类 / 回归 / 时序接口的输入契约一致。
const taskRules: Record<TaskKind, { roles: ColumnRole[]; fallback: ColumnRole } & Partial<Record<ColumnRole, ColumnType[]>>> = {
  classification: { roles: ["feature", "target", "excluded"], fallback: "feature", target: ["category", "bool", "numeric"] },
  regression: { roles: ["feature", "target", "excluded"], fallback: "feature", target: ["numeric"] },
  timeseries: { roles: ["excluded", "target", "time", "covariate"], fallback: "excluded", target: ["numeric"], time: ["datetime"], covariate: ["numeric"] },
}

// 由列与取值推出每列角色；标识列默认不使用，不合规的角色退回默认角色。
function resolveRoles(columns: Array<{ name: string; type: string }>, task: TaskKind, v: RoleValue): ColumnRole[] {
  const rule = taskRules[task]
  return columns.map((c) => {
    const type = colTypeOf(c.type)
    const r: ColumnRole =
      c.name === v.target ? "target"
      : c.name === v.time ? "time"
      : v.covariates?.includes(c.name) ? "covariate"
      : v.excluded?.includes(c.name) ? "excluded"
      : v.features?.includes(c.name) ? "feature"
      : type === "id" ? "excluded"
      : rule.fallback
    const allowed = !rule[r] || rule[r]!.includes(type)
    return rule.roles.includes(r) && allowed ? r : rule.fallback
  })
}

function toState(columns: Array<{ name: string }>, roles: ColumnRole[], task: TaskKind): RoleState {
  const s: RoleState = { target: null, time: null, covariates: [], features: [], excluded: [], valid: false, problems: [] }
  columns.forEach((c, i) => {
    const r = roles[i]
    if (r === "target") s.target = c.name
    else if (r === "time") s.time = c.name
    else if (r === "covariate") s.covariates.push(c.name)
    else if (r === "feature") s.features.push(c.name)
    else s.excluded.push(c.name)
  })
  if (!s.target) s.problems.push("请指定目标列")
  if (task === "timeseries" && !s.time) s.problems.push("请指定时间列")
  if (task !== "timeseries" && s.target && !s.features.length) s.problems.push("至少保留 1 个特征列")
  s.valid = !s.problems.length
  return s
}

// 列角色选择：每列一个下拉；目标列与时间列各只有一个，新指定时原来的列退回默认角色。
function ColumnRolePicker({
  columns,
  task: taskProp,
  value,
  defaultValue,
  label,
  onChange,
  className,
}: {
  columns: Array<{ name: string; type: ColumnType | string }>
  task: TaskKind
  /** 受控取值；onChange 给出的 RoleState 可直接传回。不传则用 defaultValue 自管。 */
  value?: RoleValue
  defaultValue?: RoleValue
  label?: string
  onChange?: (state: RoleState) => void
  className?: string
}) {
  const task: TaskKind = taskProp in taskRules ? taskProp : "regression"
  const rule = taskRules[task]
  const [inner, setInner] = React.useState<RoleValue>(defaultValue ?? {})
  const roles = resolveRoles(columns, task, value ?? inner)
  const s = toState(columns, roles, task)
  const errorId = React.useId()
  const assign = (index: number, role: ColumnRole) => {
    const next = roles.map((r, i) => (i !== index && (role === "target" || role === "time") && r === role ? rule.fallback : r))
    next[index] = role
    const state = toState(columns, next, task)
    if (value === undefined) setInner(state)
    onChange?.(state)
  }
  const bits: Array<[string, string]> = [["目标", s.target ?? "未指定"]]
  if (task === "timeseries") bits.push(["时间列", s.time ?? "未指定"], ["协变量", `${s.covariates.length} 列`])
  else bits.push(["特征", `${s.features.length} 列`])
  bits.push(["不使用", `${s.excluded.length} 列`])
  return (
    <div className={cn("grid gap-3", className)}>
      {label ? <p className="m-0 text-[13px] leading-5 font-medium text-foreground">{label}</p> : null}
      <ul aria-label="列角色" className="m-0 max-h-80 list-none overflow-auto rounded-md border border-border p-0">
        {columns.map((c, i) => {
          const type = colTypeOf(c.type)
          const role = roles[i]
          return (
            <li
              key={c.name}
              data-role={role}
              className={cn("grid grid-cols-[minmax(0,1fr)_auto_128px] items-center gap-3 border-b border-border px-3 py-2 last:border-b-0", role === "target" && "bg-accent")}
            >
              <span title={c.name} className={cn("truncate font-mono text-[13px]", role === "excluded" && "text-muted-foreground")}>{c.name}</span>
              <ColumnTypeBadge type={type} />
              <NativeSelect
                size="sm"
                aria-label={`${c.name} 的角色`}
                aria-describedby={s.valid ? undefined : errorId}
                value={role}
                className="w-full *:data-[slot=native-select]:text-[13px]"
                onChange={(event) => assign(i, event.target.value as ColumnRole)}
              >
                {rule.roles.map((r) => {
                  const ok = !rule[r] || rule[r]!.includes(type)
                  return (
                    <NativeSelectOption key={r} value={r} disabled={!ok}>
                      {columnRoles[r]}{ok ? "" : "（类型不符）"}
                    </NativeSelectOption>
                  )
                })}
              </NativeSelect>
            </li>
          )
        })}
      </ul>
      <p aria-live="polite" className="m-0 text-[13px] leading-5 text-muted-foreground">
        {bits.map(([k, v], i) => (
          <React.Fragment key={k}>
            {i ? " · " : ""}
            {k} <strong className="font-semibold text-foreground">{v}</strong>
          </React.Fragment>
        ))}
      </p>
      <p id={errorId} hidden={s.valid} className="mt-1 mb-0 text-[13px] leading-5 text-destructive">{s.problems.join("；")}</p>
    </div>
  )
}

export { ColumnRolePicker, type TaskKind, type RoleValue, type RoleState }
