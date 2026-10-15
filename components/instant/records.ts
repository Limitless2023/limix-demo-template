/**
 * [INPUT]: 依赖 @/lib/instant-types 的 InstantSpec、InstantRow、Prediction
 * [OUTPUT]: 导出 InferenceRecord、RecordSource、SOURCE_LABEL、Sample、parseTable、summarize、fmt
 * [POS]: components/instant 的纯函数层：推理记录的形状、表格解析（CSV / Excel 粘贴）与数值格式。不含 React。
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
  /** 已加入上下文 */
  added: boolean
}

/** 测试记录：输入 + 实测值（模型没见过） */
export type Sample = { row: InstantRow; truth?: number }

export const fmt = (v: number, digits = 1) => (Number.isFinite(v) ? v.toFixed(digits).replace(/\.0+$/, "") : "—")

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

export function parseTable(spec: InstantSpec, text: string): { samples: Sample[] } | { error: string } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "")
  if (lines.length < 2) return { error: "至少需要一行表头和一行数据" }
  const sep = lines[0].includes("\t") ? "\t" : ","
  const header = lines[0].split(sep).map((h) => h.trim())
  const match = (key: string, label: string) => header.findIndex((h) => h === key || h === label || h.startsWith(`${label} `) || h.startsWith(`${label}（`))
  const featureIdx = spec.features.map((f) => match(f.key, f.label))
  const missing = spec.features.filter((_, i) => featureIdx[i] < 0).map((f) => f.label)
  if (missing.length) return { error: `缺少列：${missing.join("、")}。表头可写英文列名或中文名。` }
  const targetIdx = match(spec.target.key, spec.target.label)

  const samples: Sample[] = []
  for (const [n, line] of lines.slice(1).entries()) {
    const cells = line.split(sep)
    const row: InstantRow = {}
    for (const [i, f] of spec.features.entries()) {
      const v = Number(cells[featureIdx[i]]?.trim())
      if (!Number.isFinite(v)) return { error: `第 ${n + 2} 行的「${f.label}」不是数值` }
      row[f.key] = v
    }
    const truth = targetIdx >= 0 ? Number(cells[targetIdx]?.trim()) : NaN
    samples.push({ row, truth: Number.isFinite(truth) ? truth : undefined })
  }
  return { samples }
}
