import { cn } from "@/lib/utils"

type StatusTone = "neutral" | "active" | "success" | "warning" | "error"

// 实心 = 已定，空心 = 未定或需关注；destructive 只标问题。必须带文字。
const dotTone: Record<StatusTone, string> = {
  neutral: "bg-transparent shadow-[inset_0_0_0_1.5px_var(--muted-foreground)]",
  active: "bg-primary",
  success: "bg-[var(--success)]",
  warning: "bg-transparent shadow-[inset_0_0_0_2px_var(--destructive)]",
  error: "bg-destructive",
}

function StatusDot({
  label,
  tone = "neutral",
  pulse,
  meta,
  className,
}: {
  label: string
  tone?: StatusTone
  pulse?: boolean
  meta?: string
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[13px] leading-5 whitespace-nowrap", className)}>
      <span aria-hidden="true" className={cn("relative size-2 shrink-0 rounded-full", dotTone[tone])}>
        {pulse ? <span className="absolute -inset-[3px] rounded-full border-[1.5px] border-primary motion-safe:animate-pulse" /> : null}
      </span>
      <span className={cn(tone === "neutral" && "text-muted-foreground", tone === "error" && "text-destructive")}>{label}</span>
      {meta ? <span className="font-mono text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
    </span>
  )
}

export { StatusDot, type StatusTone }
