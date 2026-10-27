/**
 * [INPUT]: 依赖 @/lib/forecast-types 的 ForecastSpec、ForecastObject；依赖 @/lib/scenario-spec 的 FieldDoc；
 *          有离线评估的对象依赖 data/eval/<slug>/<对象>/metrics.json（scripts/eval_forecast.py 写出）；示例场景 power-load 没有
 * [OUTPUT]: 导出 forecastSpecs（按 slug 索引）与 findForecastObject
 * [POS]: 「时序预测」各场景的配置：预测对象（样例、列名、上下文窗口、步长、已知输入）、案例介绍五段、数据页的文件与字段。
 *        没有离线评估的对象不写 evaluation，案例介绍就不出「效果」一段。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ForecastObject, ForecastSpec } from "@/lib/forecast-types"
import type { FieldDoc } from "@/lib/scenario-spec"

// ──────────────────────────────────────────────────────────────
// 电力负荷：合成数据，逐小时，2026-09-01 至 09-21 共 504 行；time / load_mw / temperature_c 三列。只用历史预测。
// ──────────────────────────────────────────────────────────────

const powerLoad: ForecastSpec = {
  slug: "power-load",
  title: "电力负荷预测",
  industry: "能源电力",
  capability: "时序预测",
  mode: "forecast",
  description:
    "用最近一周的逐小时负荷作为上下文，预测未来 24–72 小时负荷与 P10–P90 区间，支撑日前调度与购电计划。",
  objects: [
    {
      key: "load",
      name: "地区负荷",
      forecast: {
        sample: { path: "samples/power-load.csv", name: "华东某地区逐小时负荷（示例，合成数据）" },
        colDate: "time",
        colTarget: "load_mw",
        targetLabel: "负荷",
        unit: "MW",
        step: "小时",
        perDay: 24,
        contextSize: 168,
        horizons: [24, 48, 72],
        known: [],
        backtestDays: 0,
        showHistory: 72,
      },
    },
  ],
  case: {
    scene: [
      "日前调度和购电计划要提前一天定下来，需要知道未来每个小时的负荷。",
      "负荷随天气和作息起伏；计划定高了要多买电，定低了备用容量不够。",
    ],
    approach: {
      input: "最近一周（168 小时）的逐小时负荷",
      output: "未来 24、48 或 72 小时逐小时负荷的 P50 和 P10–P90 区间",
      how: "历史直接作为上下文，不训练模型，一次请求出结果。",
    },
    boundary: {
      fits: ["有连续的逐小时负荷历史，至少一周。"],
      misfits: ["历史不到一周，或中间有大段缺失。", "历史里没出现过的情况，如长假、极端天气。"],
      needs: ["时间列和负荷列，逐小时，不少于一周。", "气温预报等未来已知的数据可选，能让预测更准。"],
    },
  },
  data: {
    basis: "合成数据",
    source: "华东某地区逐小时负荷（示例）",
    license: "本站合成，无外部许可限制",
    files: [
      {
        name: "power-load.csv",
        path: "samples/power-load.csv",
        role: "context",
        rows: 504,
        note: "逐小时负荷与温度；在线预测时最后一周作为上下文",
      },
    ],
    fields: [
      { key: "time", label: "时间", unit: "", role: "time", note: "逐小时时间戳" },
      { key: "load_mw", label: "负荷", unit: "MW", role: "target", note: "地区用电负荷，要预测的值" },
      { key: "temperature_c", label: "温度", unit: "℃", role: "input", note: "气温；当前演示只用负荷历史" },
    ],
  },
}

export const forecastSpecs: Record<string, ForecastSpec> = {
  [powerLoad.slug]: powerLoad,
}

/** 按场景与对象找预测对象；不传对象时取第一个 */
export function findForecastObject(scenario?: string | null, object?: string | null): ForecastObject | null {
  const spec = scenario ? forecastSpecs[scenario] : undefined
  if (!spec) return null
  return (object ? spec.objects.find((o) => o.key === object) : spec.objects[0]) ?? null
}
