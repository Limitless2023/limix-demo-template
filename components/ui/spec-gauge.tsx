import { Activity } from "lucide-react"

import { cn } from "@/lib/utils"

const unitSuffix = (u?: string) => (!u ? "" : u === "%" || u === "‰" ? u : ` ${u}`)

// 规格对比：区间越出规格为「风险」，预测点越出为「超规」；只用文字与图标说明（LimiX 预警），数值不改色，不用 alarm-*。
function SpecGauge({
  label = "规格对比",
  value,
  low,
  high,
  lsl,
  usl,
  target,
  min: minProp,
  max: maxProp,
  unit,
  digits = 1,
  lowLabel = "P10",
  highLabel = "P90",
  tone = "default",
  className,
}: {
  label?: string
  value: number
  low?: number
  high?: number
  lsl: number
  usl: number
  target?: number
  min?: number
  max?: number
  unit?: string
  digits?: number
  lowLabel?: string
  highLabel?: string
  tone?: "default" | "neutral"
  className?: string
}) {
  const u = unitSuffix(unit)
  const lo = low ?? value
  const hi = high ?? value
  const span = Math.max(usl - lsl, hi - lo) || 1
  const min = minProp ?? Math.min(lsl, lo) - span * 0.3
  const max = maxProp ?? Math.max(usl, hi) + span * 0.3
  const f = (n: number) => n.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const x = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min || 1)) * 100))
  const state = value > usl || value < lsl ? "out" : hi > usl || lo < lsl ? "risk" : "in"
  const msg =
    state === "out"
      ? value > usl ? `预测值高于上限 ${f(value - usl)}${u}` : `预测值低于下限 ${f(lsl - value)}${u}`
      : state === "risk"
        ? hi > usl ? `区间上沿 ${f(hi)}${u} 超出上限，存在超规风险` : `区间下沿 ${f(lo)}${u} 低于下限，存在超规风险`
        : "预测与区间都在规格内"
  return (
    <div
      role="group"
      data-state={state}
      aria-label={`${label}：预测 ${f(value)}${u}，${lowLabel}–${highLabel} ${f(lo)}–${f(hi)}${u}，规格 ${f(lsl)}–${f(usl)}${u}；${msg}`}
      className={cn("grid min-w-0 gap-1 text-[13px] leading-5", state === "out" && "rounded-md border border-foreground px-3 py-2", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="inline-flex items-baseline gap-2 font-mono whitespace-nowrap tabular-nums">
          <b className="text-base font-semibold">{f(value)}{u}</b>
          {low != null ? <span className="text-[11px] text-muted-foreground">{lowLabel}–{highLabel} {f(lo)}–{f(hi)}</span> : null}
        </span>
      </div>
      <div aria-hidden="true" className="relative mt-1 h-4 before:absolute before:inset-x-0 before:top-[7px] before:h-0.5 before:rounded-[1px] before:bg-muted before:content-['']">
        <span className="absolute inset-y-0 border-x-2 border-foreground bg-muted" style={{ left: `${x(lsl)}%`, width: `${x(usl) - x(lsl)}%` }} />
        <span
          className={cn("absolute top-1 h-2 rounded-[2px]", tone === "neutral" ? "bg-border shadow-[inset_0_0_0_1px_var(--muted-foreground)]" : "bg-[var(--chart-seq-2)]")}
          style={{ left: `${x(lo)}%`, width: `${x(hi) - x(lo)}%` }}
        />
        <span className="absolute top-px -ml-px h-3.5 w-0.5 rounded-[1px] bg-foreground" style={{ left: `${x(value)}%` }} />
        {target != null ? <span title={`目标 ${f(target)}${u}`} className="absolute -inset-y-0.5 border-l border-dashed border-muted-foreground" style={{ left: `${x(target)}%` }} /> : null}
      </div>
      <div aria-hidden="true" className="relative h-3.5 font-mono text-[11px] leading-[14px] text-muted-foreground">
        <span className="absolute pl-1 whitespace-nowrap" style={{ left: `${x(lsl)}%` }}>下限 {f(lsl)}</span>
        <span className="absolute -translate-x-full pr-1 whitespace-nowrap" style={{ left: `${x(usl)}%` }}>上限 {f(usl)}</span>
      </div>
      <p className={cn("m-0 mt-1 flex items-start gap-1 text-xs leading-[18px]", state === "in" ? "text-muted-foreground" : "font-medium text-foreground")}>
        {state === "in" ? null : <Activity aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} />}
        {msg}
      </p>
    </div>
  )
}

export { SpecGauge }
