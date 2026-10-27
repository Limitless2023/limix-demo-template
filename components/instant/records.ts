/**
 * [INPUT]: 依赖 @/lib/instant-types 的 InstantSpec、InstantRow、Prediction
 * [OUTPUT]: 导出 InferenceRecord、RecordSource、SOURCE_LABEL、Sample、Limits、parseTable、summarize、limitsOf、limitText、fmt、fmtError、fmtInput
 * [POS]: components/instant 的纯函数层：推理记录的形状、表格解析（CSV / Excel 粘贴）、警戒线判定与数值格式。不含 React。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { InstantRow, InstantSpec, Prediction } from "@/lib/instant-types"

export type RecordSource = "manual" | "sample" | "batch" | "feed"

export const SOURCE_LABEL: Record<RecordSource, string> = {
  manual: "手动输入",
  sample: "测试记录",
  batch: "上传或粘贴",
  feed: "上游推送",
}

/** 一次推理的一条记录。truth 是实测值：测试记录与带目标列的上传自带，手动输入的由用户录入。只用于对比，预测时不上传。 */
export type InferenceRecord = {
  id: number
  at: Date
  source: RecordSource
  row: InstantRow
  prediction: Prediction
  truth?: number
  /** 加入上下文时的重置轮次（use-instant 的 resets）；没加入过为空 */
  addedEpoch?: number
  /** 已加入当前上下文：InstantDemo 按 addedEpoch 与当前轮次现算，组件只读它 */
  added?: boolean
}

/** 测试记录：输入 + 实测值（模型没见过） */
export type Sample = { row: InstantRow; truth?: number }

export const fmt = (v: number, digits = 1) =>
  Number.isFinite(v) ? v.toFixed(digits).replace(/\.0+$/, "") : "—"

/** 误差 = 预估 − 实测，带正负号：+ 为估高，− 为估低。 */
export const fmtError = (v: number) =>
  !Number.isFinite(v)
    ? "—"
    : `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmt(Math.abs(v))}`

/** 原始输入值：最多两位小数，去掉多余的 0。 */
export const fmtInput = (v: number) =>
  Number.isFinite(v) ? String(Number(v.toFixed(2))) : "—"

/** 一条记录的警戒线：按场景配置从输入里取下限与上限 */
export type Limits = { low: number; high: number; label: string }

export function limitsOf(spec: InstantSpec, row: InstantRow): Limits | null {
  if (!spec.limits) return null
  const low = row[spec.limits.lowKey]
  const high = row[spec.limits.highKey]
  return Number.isFinite(low) && Number.isFinite(high) && low < high
    ? { low, high, label: spec.limits.label }
    : null
}

/** 预估值相对警戒线的位置，写成一句：「在警戒线内」「高于上警戒线」「低于下警戒线」；越线时 out 为 true */
export function limitText(value: number, l: Limits) {
  const out = value < l.low || value > l.high
  const text = !out
    ? `在${l.label}内`
    : value > l.high
      ? `高于上${l.label}`
      : `低于下${l.label}`
  return { out, text }
}

export function summarize(spec: InstantSpec, row: InstantRow) {
  return spec.summaryKeys
    .map((k) => spec.features.find((f) => f.key === k))
    .filter((f) => f != null)
    .map((f) => `${f.label} ${fmt(row[f.key])}${f.unit === "天" ? " 天" : ""}`)
    .join(" · ")
}

// ──────────────────────────────────────────────────────────────
// 表格解析：逗号分隔的 CSV，或从 Excel 复制的制表符分隔文本。
// 表头认列名（cement）或中文名（水泥 / 水泥 kg/m³）；有目标列时一并读出实测值。
// ──────────────────────────────────────────────────────────────

export function parseTable(
  spec: InstantSpec,
  text: string
): { samples: Sample[] } | { error: string } {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
  if (lines.length < 2) return { error: "至少需要一行表头和一行数据" }
  const sep = lines[0].includes("\t") ? "\t" : ","
  const header = lines[0].split(sep).map((h) => h.trim())
  const match = (key: string, label: string) =>
    header.findIndex(
      (h) =>
        h === key ||
        h === label ||
        h.startsWith(`${label} `) ||
        h.startsWith(`${label}（`)
    )
  const featureIdx = spec.features.map((f) => match(f.key, f.label))
  const missing = spec.features
    .filter((_, i) => featureIdx[i] < 0)
    .map((f) => f.label)
  if (missing.length)
    return {
      error: `缺少列：${missing.join("、")}。表头可写英文列名或中文名。`,
    }
  const targetIdx = match(spec.target.key, spec.target.label)

  const samples: Sample[] = []
  for (const [n, line] of lines.slice(1).entries()) {
    const cells = line.split(sep)
    const row: InstantRow = {}
    for (const [i, f] of spec.features.entries()) {
      const v = Number(cells[featureIdx[i]]?.trim())
      if (!Number.isFinite(v))
        return { error: `第 ${n + 2} 行的「${f.label}」不是数值` }
      row[f.key] = v
    }
    const truth = targetIdx >= 0 ? Number(cells[targetIdx]?.trim()) : NaN
    samples.push({ row, truth: Number.isFinite(truth) ? truth : undefined })
  }
  return { samples }
}
