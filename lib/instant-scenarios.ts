/**
 * [INPUT]: 依赖 @/lib/instant-types 的 InstantSpec；依赖 data/eval/<slug>/metrics.json（scripts/eval_instant.py 写出）
 * [OUTPUT]: 导出 instantSpecs（按 slug 索引）与 findInstantSpec
 * [POS]: 「即时预估」各场景的数据契约与文案。换行业只加一条配置、三份 CSV 与一次离线评估，链路与组件不改。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import concreteMetrics from "@/data/eval/concrete-strength/metrics.json"
import type { InstantSpec } from "@/lib/instant-types"

// 混凝土抗压强度：UCI Concrete Compressive Strength（Yeh 1998，CC BY 4.0），切分沿用 BCCO 基准。
// 上下文 721 条，测试记录 309 条；输入范围取自上下文表，略放宽。step 是加减按钮的步长，也决定显示的小数位。
const concrete: InstantSpec = {
  slug: "concrete-strength",
  target: { key: "strength", label: "抗压强度", unit: "MPa", note: "试块的实测抗压强度，要预测的值" },
  features: [
    { key: "cement", label: "水泥", unit: "kg/m³", min: 100, max: 550, step: 10, note: "每立方米混凝土的水泥用量" },
    { key: "blast_furnace_slag", label: "矿渣粉", unit: "kg/m³", min: 0, max: 360, step: 10, note: "高炉矿渣粉，替代部分水泥的掺合料" },
    { key: "fly_ash", label: "粉煤灰", unit: "kg/m³", min: 0, max: 210, step: 10, note: "燃煤电厂粉煤灰，另一种掺合料" },
    { key: "water", label: "水", unit: "kg/m³", min: 120, max: 250, step: 5, note: "拌合用水；用水越多，强度通常越低" },
    { key: "superplasticizer", label: "减水剂", unit: "kg/m³", min: 0, max: 33, step: 0.5, note: "高效减水剂，少用水也能保证流动性" },
    { key: "coarse_aggregate", label: "粗骨料", unit: "kg/m³", min: 800, max: 1150, step: 10, note: "石子" },
    { key: "fine_aggregate", label: "细骨料", unit: "kg/m³", min: 590, max: 1000, step: 10, note: "砂" },
    { key: "age", label: "龄期", unit: "天", min: 1, max: 365, step: 1, note: "试块养护天数，常见 3、7、28 天" },
  ],
  contextFile: "samples/concrete-context.csv",
  samplesFile: "samples/concrete-samples.csv",
  uploadFile: "samples/concrete-upload.csv",
  sweep: { key: "age", values: [3, 7, 14, 28, 56, 90], title: "同一配比，不同龄期" },
  summaryKeys: ["cement", "water", "age"],
  evaluation: {
    source: "data/eval/concrete-strength/metrics.json",
    result: concreteMetrics,
    limix: "LimiX（免训练）",
    reference: "随机森林（默认参数，需训练）",
    naive: "猜均值",
  },
  copy: {
    eyebrow: "建材 · 回归 · 免训练",
    title: "混凝土强度即时预估",
    description: "试块要养护 28 天才知道强度。LimiX 把历史配比与实测强度当作上下文，不用训练；每来一组新配比，几秒给出强度预估与区间。",
    contextLabel: "历史配比与实测强度",
    facts: [
      {
        title: "场景",
        body: "搅拌站和预制构件厂按配比生产混凝土。试块要养护到 28 天才做抗压试验，配比有问题，往往一个月后才发现。现场希望下料前就知道这组配比大概能到多少强度。",
      },
      {
        title: "任务",
        body: "输入 7 种原材料的每立方用量和龄期，共 8 项，预测抗压强度（MPa）。这是回归任务，每次给出中位预估 P50 和八成区间 P10–P90。",
      },
      {
        title: "上下文",
        body: "721 条历史配比与实测强度，强度 2.3–82.6 MPa，龄期 1–365 天。另有 309 条测试记录，模型没见过它们的强度，演示时用来对答案。",
      },
    ],
    dataNote:
      "数据：UCI Concrete Compressive Strength（I-Cheng Yeh，1998），CC BY 4.0。",
  },
}

export const instantSpecs: Record<string, InstantSpec> = { [concrete.slug]: concrete }

export function findInstantSpec(slug: string) {
  return instantSpecs[slug] ?? null
}
