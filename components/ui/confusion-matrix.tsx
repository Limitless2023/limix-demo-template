"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type MatrixMode = "count" | "rate"

const fmtNumber = (v: number) => v.toLocaleString("zh-CN")

// 色阶随主题；深两档文字浅色主题用 primary-foreground，深色主题用品牌黑。
const levelClass = [
  "bg-[var(--surface)]",
  "bg-[var(--chart-seq-1)]",
  "bg-[var(--chart-seq-2)]",
  "bg-[var(--chart-seq-3)]",
  "bg-[var(--chart-seq-4)] text-primary-foreground [:is([data-theme$=-dark],.dark)_&]:text-[var(--color-ink)]",
  "bg-[var(--chart-seq-5)] text-primary-foreground [:is([data-theme$=-dark],.dark)_&]:text-[var(--color-ink)]",
]

const level = (ratio: number) => (ratio <= 0 ? 0 : Math.min(5, Math.max(1, Math.ceil(ratio * 5))))

// 混淆矩阵：行为实际类别，列为预测类别；可切换计数 / 按行比例，并附召回率列与精确率行。
function ConfusionMatrix({
  labels,
  matrix,
  mode: modeProp,
  defaultMode = "count",
  showModeToggle = true,
  showRates = true,
  caption,
  onModeChange,
  className,
}: {
  labels: string[]
  /** 行为实际类别，列为预测类别。 */
  matrix: number[][]
  /** 受控口径；不传则用 defaultMode 自管。 */
  mode?: MatrixMode
  defaultMode?: MatrixMode
  showModeToggle?: boolean
  showRates?: boolean
  caption?: string
  onModeChange?: (mode: MatrixMode) => void
  className?: string
}) {
  const [inner, setInner] = React.useState<MatrixMode>(defaultMode === "rate" ? "rate" : "count")
  const mode = modeProp ?? inner
  const rowSum = matrix.map((r) => r.reduce((a, b) => a + b, 0))
  const colSum = labels.map((_, j) => matrix.reduce((a, r) => a + (r[j] || 0), 0))
  const maxCell = Math.max(0, ...matrix.map((r) => Math.max(0, ...r))) || 1
  const th = "px-2 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground"
  const rate = "min-w-[56px] text-center font-mono text-xs text-muted-foreground"
  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>行为实际类别，列为预测类别；对角线为预测正确</span>
        {showModeToggle ? (
          <ToggleGroup
            variant="segmented"
            size="sm"
            aria-label="混淆矩阵口径"
            value={[mode]}
            onValueChange={(v) => {
              const next = v[0] as MatrixMode | undefined
              if (!next) return
              if (modeProp === undefined) setInner(next)
              onModeChange?.(next)
            }}
          >
            <ToggleGroupItem value="count">计数</ToggleGroupItem>
            <ToggleGroupItem value="rate">按行比例</ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-[13px] leading-5">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              <th scope="col" className={cn(th, "text-center align-bottom")}><span className="sr-only">实际类别 / 预测类别</span></th>
              {labels.map((l, j) => (
                <th key={j} scope="col" className={cn(th, "text-center align-bottom")}><span className="sr-only">预测 </span>{l}</th>
              ))}
              {showRates ? <th scope="col" className={cn(th, "text-center align-bottom")}>召回率</th> : null}
            </tr>
          </thead>
          <tbody>
            {matrix.map((r, i) => (
              <tr key={i}>
                <th scope="row" className={cn(th, "text-right")}><span className="sr-only">实际 </span>{labels[i]}</th>
                {r.map((v, j) => {
                  const share = rowSum[i] ? v / rowSum[i] : 0
                  const ratio = mode === "rate" ? share : v / maxCell
                  return (
                    <td
                      key={j}
                      data-level={level(ratio)}
                      data-diag={i === j ? "" : undefined}
                      title={`实际 ${labels[i]}，预测 ${labels[j]}：${fmtNumber(v)}（占该行 ${(share * 100).toFixed(1)}%）`}
                      className={cn(
                        "h-11 min-w-[64px] rounded-[2px] px-2 text-center font-mono text-foreground tabular-nums",
                        levelClass[level(ratio)],
                        i === j && "font-semibold shadow-[inset_0_0_0_1.5px_var(--foreground)]",
                      )}
                    >
                      {mode === "rate" ? `${(share * 100).toFixed(1)}%` : fmtNumber(v)}
                    </td>
                  )
                })}
                {showRates ? <td className={rate}>{rowSum[i] ? `${(((r[i] || 0) / rowSum[i]) * 100).toFixed(1)}%` : "—"}</td> : null}
              </tr>
            ))}
            {showRates ? (
              <tr>
                <th scope="row" className={cn(th, "text-right")}>精确率</th>
                {labels.map((_, j) => (
                  <td key={j} className={rate}>{colSum[j] ? `${(((matrix[j]?.[j] ?? 0) / colSum[j]) * 100).toFixed(1)}%` : "—"}</td>
                ))}
                <td />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div aria-hidden="true" className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span>{mode === "rate" ? "0%" : "0"}</span>
        <span className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((k) => (
            <i key={k} className="h-2 w-[18px] rounded-[2px]" style={{ background: `var(--chart-seq-${k})` }} />
          ))}
        </span>
        <span>{mode === "rate" ? "100%（按行）" : fmtNumber(maxCell)}</span>
      </div>
    </div>
  )
}

export { ConfusionMatrix, type MatrixMode }
