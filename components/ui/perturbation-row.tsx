"use client"

import * as React from "react"
import { Lock, LockOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NumberInput } from "@/components/ui/number-input"
import { Slider } from "@/components/ui/slider"

// 四舍五入后为 0 时写 ±，避免出现「−0.00」。
const signed = (v: number, digits: number) => {
  const s = Math.abs(v).toFixed(digits)
  return Number(s) === 0 ? `±${s}` : (v > 0 ? "+" : "−") + s
}

// 单位前留一个空格（「38.4 kN」），百分号与千分号紧贴数字（「2.6%」）。
const unitSuffix = (u?: string) => (!u ? "" : u === "%" || u === "‰" ? u : ` ${u}`)

// 扰动行（what-if）：原值 | 滑块 | 新值 | 差值 | 锁定；锁定的特征在寻优时保持原值。
function PerturbationRow({
  label,
  feature,
  value,
  current: currentProp,
  defaultCurrent,
  min,
  max,
  step = 1,
  precision,
  unit,
  locked: lockedProp,
  defaultLocked = false,
  onChange,
  onLockChange,
  className,
}: {
  label: string
  /** 列名，mono 显示在名称下方。 */
  feature?: string
  /** 样本原值。 */
  value: number
  /** 受控的扰动后取值；不传则用 defaultCurrent（默认等于原值）自管。 */
  current?: number
  defaultCurrent?: number
  min: number
  max: number
  step?: number
  precision?: number
  unit?: string
  /** 受控锁定状态；不传则用 defaultLocked 自管。 */
  locked?: boolean
  defaultLocked?: boolean
  onChange?: (value: number) => void
  onLockChange?: (locked: boolean) => void
  className?: string
}) {
  const digits = precision ?? (String(step).split(".")[1] ?? "").length
  const [innerCurrent, setInnerCurrent] = React.useState(defaultCurrent ?? value)
  const [innerLocked, setInnerLocked] = React.useState(defaultLocked)
  const cur = currentProp ?? innerCurrent
  const locked = lockedProp ?? innerLocked
  const u = unitSuffix(unit)
  const update = (v: number) => {
    const next = Number(Number(v).toFixed(digits))
    if (currentProp === undefined) setInnerCurrent(next)
    onChange?.(next)
  }
  const toggleLock = () => {
    if (lockedProp === undefined) setInnerLocked(!locked)
    onLockChange?.(!locked)
  }
  const d = cur - value
  const changed = Math.abs(d) >= Math.pow(10, -digits) / 2
  const LockIcon = locked ? Lock : LockOpen
  const labelId = React.useId()
  return (
    <div
      role="group"
      aria-label={label}
      data-locked={locked ? "" : undefined}
      className={cn(
        "grid grid-cols-[minmax(96px,1.1fr)_72px_minmax(120px,2fr)_132px_80px_32px] items-center gap-3 border-b border-border py-2 text-[13px] leading-5",
        "max-sm:grid-cols-[minmax(0,1fr)_auto_32px]",
        locked && "bg-[var(--surface)]",
        className,
      )}
    >
      <span className="grid min-w-0">
        <b id={labelId} className="truncate font-medium">{label}</b>
        {feature ? <span className="font-mono text-[11px] text-muted-foreground">{feature}</span> : null}
      </span>
      <span title="原值" className="text-right font-mono text-muted-foreground tabular-nums max-sm:hidden">{value.toFixed(digits)}{u}</span>
      {/* 滑块只留轨道，读屏名称取行首标签；窄屏时换到下一整行 */}
      <Slider
        aria-labelledby={labelId}
        min={min}
        max={max}
        step={step}
        value={cur}
        disabled={locked}
        className="max-sm:order-5 max-sm:col-span-full"
        onValueChange={(v) => update(typeof v === "number" ? v : v[0])}
      />
      {/* 行内已有滑块负责增减，数字框去掉 − / + 以留出读数宽度 */}
      <NumberInput
        label={`${label} 新值`}
        value={cur}
        min={min}
        max={max}
        step={step}
        precision={digits}
        unit={unit}
        stepper={false}
        disabled={locked}
        className="[&>div]:h-[var(--control-height-sm)] [&>label]:sr-only"
        onValueChange={(v) => update(v ?? value)}
      />
      <span className="text-right max-sm:hidden">
        <Badge variant="delta" data-changed={changed ? "true" : "false"} className={cn(!changed && "text-muted-foreground")}>
          {changed ? `${signed(d, digits)}${u}` : "未改动"}
        </Badge>
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={locked}
        aria-label={`${locked ? "解锁" : "锁定"} ${label}`}
        title={locked ? "已锁定：寻优时保持原值" : "可调整"}
        className="size-[var(--control-height-sm)] p-0"
        onClick={toggleLock}
      >
        <LockIcon className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </Button>
    </div>
  )
}

export { PerturbationRow }
