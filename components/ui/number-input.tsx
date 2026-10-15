"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"

// 带单位与增减按钮的数字输入；失焦、回车与 − / + 时按 min / max 截断并按 precision 取整。
function NumberInput({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  precision,
  unit,
  help,
  error,
  stepper = true,
  disabled,
  className,
}: {
  label: string
  value: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  unit?: string
  help?: string
  error?: string
  stepper?: boolean
  disabled?: boolean
  className?: string
}) {
  const id = React.useId()
  const digits = precision ?? (String(step).split(".")[1] ?? "").length
  const [draft, setDraft] = React.useState(value == null ? "" : value.toFixed(digits))
  React.useEffect(() => { setDraft(value == null ? "" : value.toFixed(digits)) }, [value, digits])
  const commit = (n: number | null) => {
    if (n == null || Number.isNaN(n)) return onValueChange?.(null)
    if (min != null) n = Math.max(min, n)
    if (max != null) n = Math.min(max, n)
    onValueChange?.(Number(n.toFixed(digits)))
  }
  const base = value ?? min ?? 0
  const stepButton = "inline-flex w-9 shrink-0 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
  return (
    <div className={cn("grid", className)}>
      <label htmlFor={id} className="mb-2 text-[13px] leading-5 font-medium">{label}{unit ? `（${unit}）` : ""}</label>
      <div className={cn("flex h-[var(--control-height-md)] items-stretch rounded-sm border border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring", error && "border-destructive", disabled && "bg-muted opacity-50")}>
        {stepper ? (
          <button type="button" tabIndex={-1} aria-label={`减少 ${label}`} disabled={disabled || (min != null && base <= min)} className={cn(stepButton, "rounded-l-sm border-r border-border")} onClick={() => commit(base - step)}>
            <Minus className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={help || error ? `${id}-help` : undefined}
          className="min-w-0 flex-1 appearance-none bg-transparent px-3 text-right font-mono text-sm tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit(draft === "" ? null : Number(draft))}
          onKeyDown={(event) => { if (event.key === "Enter") commit(draft === "" ? null : Number(draft)) }}
        />
        {unit ? <span className="inline-flex items-center pr-3 text-[13px] text-muted-foreground">{unit}</span> : null}
        {stepper ? (
          <button type="button" tabIndex={-1} aria-label={`增加 ${label}`} disabled={disabled || (max != null && base >= max)} className={cn(stepButton, "rounded-r-sm border-l border-border")} onClick={() => commit(base + step)}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {help || error ? <p id={`${id}-help`} className={cn("mt-1 text-[13px] leading-5 text-muted-foreground", error && "text-destructive")}>{error ?? help}</p> : null}
    </div>
  )
}

export { NumberInput }
