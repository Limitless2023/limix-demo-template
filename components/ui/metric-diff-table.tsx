import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type DiffMetric = {
  key: string
  label: string
  /** 表头单位，如 %。 */
  unit?: string
  /** 差值单位，如百分比指标用 pt。 */
  deltaUnit?: string
  better: "lower" | "higher"
  /** 小数位，默认 2。 */
  digits?: number
}
type DiffRow = {
  name: string
  /** current 高亮；baseline 为差值基准。 */
  tag?: "current" | "baseline"
  /** null 表示该行无法给出此指标（显示「—」与「不可比」）；字符串原样显示、不参与比较（如 LimiX 的训练耗时写「免训练」，不要记 0）。 */
  values: Record<string, number | string | null>
}

// 四舍五入后为 0 时写 ±，避免出现「−0.00」。
const signed = (v: number, digits: number) => {
  const s = Math.abs(v).toFixed(digits)
  return Number(s) === 0 ? `±${s}` : (v > 0 ? "+" : "−") + s
}

// 指标对比表：每格给数值与相对基线的差值和「更好 / 更差 / 持平」；最优值加粗，不用红绿表达好坏。
// 当前行是 accent 底，「当前」标签用 background 底的描边款，否则同色看不见。
function MetricDiffTable({
  metrics,
  rows,
  baseline,
  nameLabel = "模型",
  caption,
  className,
}: {
  metrics: DiffMetric[]
  rows: DiffRow[]
  /** 基线行序号；默认取 tag 为 baseline 的行。 */
  baseline?: number
  nameLabel?: string
  caption?: string
  className?: string
}) {
  const baseIdx = baseline ?? rows.findIndex((r) => r.tag === "baseline")
  const base = rows[baseIdx]
  const best: Record<string, number> = {}
  metrics.forEach((mt) => {
    const vals = rows.map((r) => r.values[mt.key]).filter((v): v is number => typeof v === "number")
    if (vals.length) best[mt.key] = mt.better === "higher" ? Math.max(...vals) : Math.min(...vals)
  })
  return (
    <Table className={cn("leading-5", className)}>
      {caption ? <TableCaption className="caption-bottom">{caption}</TableCaption> : null}
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col">{nameLabel}</TableHead>
          {metrics.map((mt) => (
            <TableHead key={mt.key} scope="col" title={mt.better === "higher" ? "越高越好" : "越低越好"} className="text-right tabular-nums">
              {mt.label}{mt.unit ? `（${mt.unit}）` : ""}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, ri) => (
          <TableRow key={ri} data-state={r.tag === "current" ? "selected" : undefined}>
            <TableHead scope="row" className="text-sm font-medium text-foreground">
              <span className="flex flex-wrap items-center gap-2">
                {r.name}
                {r.tag === "current" ? <Badge variant="outline" className="bg-background">当前</Badge> : r.tag === "baseline" ? <Badge variant="outline">基线</Badge> : null}
              </span>
            </TableHead>
            {metrics.map((mt) => {
              const v = r.values[mt.key]
              const digits = mt.digits ?? 2
              const has = typeof v === "number"
              const text = typeof v === "string" ? v : null
              const bv = base?.values[mt.key]
              let delta = ""
              if (text !== null) delta = ""
              else if (!has) delta = "不可比"
              else if (ri === baseIdx) delta = "基线"
              else if (typeof bv === "number") {
                const d = v - bv
                const verdict = Math.abs(d) < Math.pow(10, -digits) / 2 ? "持平" : (d < 0) === (mt.better !== "higher") ? "更好" : "更差"
                delta = `${signed(d, digits)}${mt.deltaUnit ? ` ${mt.deltaUnit}` : ""} · ${verdict}`
              }
              return (
                <TableCell key={mt.key} data-best={has && v === best[mt.key] ? "" : undefined} className="text-right tabular-nums">
                  <span className={cn("block tabular-nums", text === null && "font-mono", has && v === best[mt.key] && "font-bold")}>{has ? v.toFixed(digits) : text ?? "—"}</span>
                  {delta ? <span className="block font-mono text-xs leading-4 whitespace-nowrap text-muted-foreground">{delta}</span> : null}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { MetricDiffTable, type DiffMetric, type DiffRow }
