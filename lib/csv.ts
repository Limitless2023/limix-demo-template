// 极简 CSV 读写：demo 数据是数值表，不处理带引号与换行的单元格。

export type CsvTable = { columns: string[]; rows: Record<string, string>[] }

export function parseCsv(text: string): CsvTable {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim() !== "")
  const columns = (lines.shift() ?? "").split(",").map((c) => c.trim())
  const rows = lines.map((line) => {
    const cells = line.split(",")
    return Object.fromEntries(columns.map((c, i) => [c, (cells[i] ?? "").trim()]))
  })
  return { columns, rows }
}

export function toCsv(columns: string[], rows: Record<string, string | number>[]) {
  return [columns.join(","), ...rows.map((row) => columns.map((c) => row[c] ?? "").join(","))].join("\n") + "\n"
}
