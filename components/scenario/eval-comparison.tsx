/**
 * [INPUT]: 依赖 @/components/ui 的 Stat、Table；依赖 @/lib/scenario-spec 的 EvalSummary、EvalMetrics
 * [OUTPUT]: 导出 EvalComparison 组件
 * [POS]: components/scenario 的「效果」内容，案例介绍第 4 段：LimiX 三张指标卡 + 对比表（默认全部方法，evaluation.show 可只留几种；训练、平均绝对误差、R²；
 *        按平均绝对误差排序，LimiX 行用选中行底色，误差配横条）。数字全部取自 metrics.json，比例现算，不手抄；
 *        表下一行先是场景配置里怎么读这张表的说明（evaluation.note），再是评估日期与切分。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Stat } from "@/components/ui/stat"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EvalMetrics, EvalSummary } from "@/lib/scenario-spec"
import { cn } from "@/lib/utils"

// 与 components/instant/records.ts 的 fmt 一致：小数全为 0 时去掉（2.00 → 2）
const fmt = (v: number, digits = 1) => v.toFixed(digits).replace(/\.0+$/, "")

const TRAIN_LABEL = (train: EvalMetrics["train"]) =>
  train === false ? "免训练" : train ? "需训练" : "—"

// 中文里夹英文名时两边留空格，中文名不留：比 XGBoost 低 / 比直接用日前电价低
const spaced = (name: string) =>
  `${/^[A-Za-z0-9]/.test(name) ? " " : ""}${name}${/[A-Za-z0-9）)]$/.test(name) ? " " : ""}`

export function EvalComparison({
  evaluation: ev,
}: {
  evaluation: EvalSummary
}) {
  const { result } = ev
  const limix = result.methods[ev.limix]
  const ref = result.methods[ev.reference]
  const unit = ev.unit
  const rows = Object.entries(result.methods).filter(([name]) => !ev.show || ev.show.includes(name)).sort(
    (a, b) => a[1].mae - b[1].mae
  )
  const maxMae = Math.max(...rows.map(([, m]) => m.mae))
  const lower = ref ? Math.round((1 - limix.mae / ref.mae) * 100) : null

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="平均绝对误差"
          value={fmt(limix.mae)}
          unit={unit}
          note={
            lower != null && lower > 0
              ? `比${spaced(ev.reference)}低 ${lower}%`
              : undefined
          }
        />
        <Stat
          label="R²"
          value={limix.r2.toFixed(2)}
          note={ref ? `${ev.reference} ${ref.r2.toFixed(2)}` : "越接近 1 越准"}
        />
        {limix.coverage_p10_p90 != null ? (
          <Stat
            label="实测落在 P10–P90 区间内"
            value={Math.round(limix.coverage_p10_p90 * 100)}
            unit="%"
            note="P10–P90 是八成区间"
          />
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>方法</TableHead>
            <TableHead>训练</TableHead>
            <TableHead className="w-[40%]">平均绝对误差（{unit}）</TableHead>
            <TableHead className="text-right">R²</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([name, m]) => {
            const isLimix = name === ev.limix
            return (
              <TableRow
                key={name}
                className={cn(isLimix && "bg-accent hover:bg-accent")}
              >
                <TableCell className={cn(isLimix && "font-medium")}>
                  {name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {TRAIN_LABEL(m.train)}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-3">
                    <span className="w-12 text-right font-mono tabular-nums">
                      {fmt(m.mae, 2)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-1.5 flex-1 rounded-[1px] bg-muted"
                    >
                      <span
                        className={cn(
                          "block h-full rounded-[1px]",
                          isLimix
                            ? "bg-[var(--chart-1)]"
                            : "bg-[var(--chart-4)]"
                        )}
                        style={{ width: `${(m.mae / maxMae) * 100}%` }}
                      />
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {m.r2.toFixed(3)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <p className="m-0 text-[13px] leading-5 text-muted-foreground">
        {result.test_days?.length
          ? `${result.test_days[0]} 至 ${result.test_days[result.test_days.length - 1]} 滚动回测 ${result.test_days.length} 天：每天用${result.gap_days ? `截至前 ${result.gap_days + 1} 天的 ` : "前 "}${Math.round(result.context_rows / (result.points_per_day ?? 1))} 天历史预测当天 ${result.points_per_day} 个点，共 ${result.test_rows} 个点。`
          : `${result.date} 离线评估：${result.test_rows} 条测试记录，上下文 ${result.context_rows} 条，单次切分${rows.some(([, m]) => m.train) ? "；其余模型均为默认参数，用同一份上下文训练" : ""}。`}
        {ev.note ?? ""}
      </p>
    </div>
  )
}
