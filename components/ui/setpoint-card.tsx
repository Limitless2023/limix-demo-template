"use client"

import * as React from "react"
import { ArrowRight, Check, MessageSquare } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DescriptionList, type DescriptionItem } from "@/components/ui/description-list"
import { NumberInput } from "@/components/ui/number-input"
import { StatusDot } from "@/components/ui/status-dot"

type SetpointStatus = "pending" | "adopted" | "rejected"

const unitSuffix = (u?: string) => (!u ? "" : u === "%" || u === "‰" ? u : ` ${u}`)
const fixed = (v: number, digits: number) => v.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })
// 与 PerturbationRow 同一写法：带正负号，四舍五入为 0 时写 ±。
const signed = (v: number, digits: number) => {
  const s = Math.abs(v).toFixed(digits)
  if (Number(s) === 0) return `±${s}`
  return `${v > 0 ? "+" : "−"}${s}`
}

// 推荐设定值卡：采纳 = 下发到控制系统，属于写入类操作，调用方应先弹确认（onAdopt 返回 false），确认后把 status 改为 adopted。
function SetpointCard({
  label,
  tag,
  current,
  recommended,
  unit,
  step = 1,
  precision,
  min,
  max,
  editable,
  benefit,
  confidence,
  constraints,
  note,
  source = "LimiX 推荐",
  status: statusProp = "pending",
  adoptLabel = "采纳",
  onAdopt,
  onReject,
  onFeedback,
  className,
}: {
  label: string
  tag?: string
  current: number
  recommended: number
  unit?: string
  step?: number
  precision?: number
  min?: number
  max?: number
  editable?: boolean
  benefit?: string
  confidence?: string
  constraints?: string[]
  note?: string
  source?: string
  status?: SetpointStatus
  adoptLabel?: string
  onAdopt?: (value: number) => boolean | void
  onReject?: () => void
  onFeedback?: (value: number) => void
  className?: string
}) {
  const digits = precision ?? (String(step).split(".")[1] ?? "").length
  const u = unitSuffix(unit)
  const [value, setValue] = React.useState(recommended)
  const [status, setStatus] = React.useState<SetpointStatus>(statusProp)
  React.useEffect(() => setStatus(statusProp), [statusProp])
  const facts: DescriptionItem[] = []
  if (benefit) facts.push({ label: "预期收益", value: benefit })
  if (confidence) facts.push({ label: "置信度", value: confidence, mono: true })
  if (constraints?.length) facts.push({ label: "约束", value: <ul className="m-0 grid list-none gap-0.5 p-0">{constraints.map((c) => <li key={c}>{c}</li>)}</ul> })
  return (
    <div
      role="group"
      aria-label={`${label}：当前 ${fixed(current, digits)}${u}，推荐 ${fixed(value, digits)}${u}`}
      data-status={status}
      className={cn("grid min-w-0 gap-3 rounded-md border border-border bg-card p-4 text-card-foreground", className)}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="grid min-w-0">
          <b className="text-sm leading-5 font-semibold">{label}</b>
          {tag ? <span className="font-mono text-[11px] text-muted-foreground">{tag}</span> : null}
        </span>
        <span className="text-xs whitespace-nowrap text-muted-foreground">{source}</span>
      </div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <span className="grid">
          <small className="text-xs leading-4 text-muted-foreground">当前</small>
          <span className="font-mono text-base leading-7 text-muted-foreground tabular-nums">{fixed(current, digits)}{u}</span>
        </span>
        <ArrowRight aria-hidden="true" className="mb-1.5 size-4 text-[var(--icon-muted)]" strokeWidth={1.5} />
        <span className="grid">
          <small className="text-xs leading-4 text-muted-foreground">推荐</small>
          <span className="font-mono text-2xl leading-7 font-semibold tabular-nums">{fixed(value, digits)}{u}</span>
        </span>
        <span className="mb-[3px]"><Badge variant="delta">{signed(value - current, digits)}{u}</Badge></span>
      </div>
      {editable ? (
        <NumberInput label="调整推荐值" value={value} min={min} max={max} step={step} precision={digits} unit={unit} disabled={status !== "pending"} onValueChange={(v) => setValue(v ?? recommended)} />
      ) : null}
      {facts.length ? <DescriptionList items={facts} layout="horizontal" /> : null}
      {note ? <p className="m-0 text-xs leading-[18px] text-muted-foreground">{note}</p> : null}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {status === "pending" ? (
          <>
            {/* 预期收益、置信度、约束三者缺一时不给「采纳」：下发类操作，信息不全不能让人直接写入控制系统 */}
            {benefit && confidence && constraints?.length ? (
              <Button variant="outline" size="sm" onClick={() => { if (onAdopt?.(value) === false) return; setStatus("adopted") }}>
                <Check className="size-4" strokeWidth={1.5} />
                {adoptLabel}
              </Button>
            ) : (
              <span className="text-xs leading-[18px] text-muted-foreground">预期收益、置信度或约束不全，暂不能采纳</span>
            )}
            <Button variant="ghost" size="sm" onClick={() => { setStatus("rejected"); onReject?.() }}>拒绝</Button>
            {onFeedback ? (
              <Button variant="ghost" size="sm" onClick={() => onFeedback(value)}>
                <MessageSquare className="size-4" strokeWidth={1.5} />
                反馈
              </Button>
            ) : null}
          </>
        ) : status === "adopted" ? (
          <StatusDot tone="success" label="已采纳" meta={`${fixed(value, digits)}${u}`} />
        ) : (
          <StatusDot tone="neutral" label="已拒绝" />
        )}
      </div>
    </div>
  )
}

export { SetpointCard, type SetpointStatus }
