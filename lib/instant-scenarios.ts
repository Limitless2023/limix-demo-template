/**
 * [INPUT]: 依赖 @/lib/instant-types 的 InstantSpec、FeatureSpec；依赖 @/lib/scenario-spec 的 FieldDoc；
 *          依赖 data/eval/<slug>/metrics.json（scripts/eval_instant.py 写出）
 *          场景：concrete-strength 混凝土强度（公开数据，UCI，CC BY 4.0），新场景照它加一条
 * [OUTPUT]: 导出 instantSpecs（按 slug 索引）、findInstantSpec、instantFields
 * [POS]: 「即时预估」各场景的配置：数据契约、案例介绍五段文案、数据页的文件与字段。换行业只加一条配置、三份 CSV 与一次离线评估，链路与组件不改。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import concreteMetrics from "@/data/eval/concrete-strength/metrics.json"
import type { FeatureSpec, InstantSpec } from "@/lib/instant-types"
import type { FieldDoc } from "@/lib/scenario-spec"

/** 数据页字段表：由输入列与目标列派生，不另写一份 */
export function instantFields(
  features: FeatureSpec[],
  target: InstantSpec["target"]
): FieldDoc[] {
  return [
    ...features.map((f) => ({
      key: f.key,
      label: f.label,
      unit: f.unit,
      role: "input" as const,
      note: f.note,
    })),
    {
      key: target.key,
      label: target.label,
      unit: target.unit,
      role: "target" as const,
      note: target.note,
    },
  ]
}

// 混凝土抗压强度：UCI Concrete Compressive Strength（Yeh 1998，CC BY 4.0），切分沿用 BCCO 基准。
// 上下文 721 条，测试记录 309 条；输入范围取自上下文表，略放宽。step 是加减按钮的步长，也决定显示的小数位。
const concreteTarget: InstantSpec["target"] = {
  key: "strength",
  label: "抗压强度",
  unit: "MPa",
  note: "试块的实测抗压强度，要预测的值",
}

const concreteFeatures: FeatureSpec[] = [
  {
    key: "cement",
    label: "水泥",
    unit: "kg/m³",
    min: 100,
    max: 550,
    step: 10,
    note: "每立方米混凝土的水泥用量",
  },
  {
    key: "blast_furnace_slag",
    label: "矿渣粉",
    unit: "kg/m³",
    min: 0,
    max: 360,
    step: 10,
    note: "高炉矿渣粉，替代部分水泥的掺合料",
  },
  {
    key: "fly_ash",
    label: "粉煤灰",
    unit: "kg/m³",
    min: 0,
    max: 210,
    step: 10,
    note: "燃煤电厂粉煤灰，另一种掺合料",
  },
  {
    key: "water",
    label: "水",
    unit: "kg/m³",
    min: 120,
    max: 250,
    step: 5,
    note: "拌合用水；用水越多，强度通常越低",
  },
  {
    key: "superplasticizer",
    label: "减水剂",
    unit: "kg/m³",
    min: 0,
    max: 33,
    step: 0.5,
    note: "高效减水剂，少用水也能保证流动性",
  },
  {
    key: "coarse_aggregate",
    label: "粗骨料",
    unit: "kg/m³",
    min: 800,
    max: 1150,
    step: 10,
    note: "石子",
  },
  {
    key: "fine_aggregate",
    label: "细骨料",
    unit: "kg/m³",
    min: 590,
    max: 1000,
    step: 10,
    note: "砂",
  },
  {
    key: "age",
    label: "龄期",
    unit: "天",
    min: 1,
    max: 365,
    step: 1,
    note: "试块养护天数，常见 3、7、28 天",
  },
]

// 视觉插槽 L0：图片来自 Wikimedia Commons，960 宽缩图。公有领域的不用署名；CC BY-SA 的写 attribution，案例介绍页脚署名并链到来源
const STORY: InstantSpec["case"]["story"] = {
  steps: [
    {
      title: "按配比搅拌、出料",
      caption: "按配比称料、搅拌、出料",
      image: "/scenarios/concrete-strength/pouring-concrete.jpg",
      // NASA / Kennedy Space Center，公有领域，不用署名
      source:
        "https://commons.wikimedia.org/wiki/File:KSC-20170629-PH_LCH01_0023_(35030726763).jpg",
    },
    {
      title: "浇筑试块，养护 28 天",
      caption: "每批留标准试块，在养护室放到 7 天、28 天再测",
      image: "/scenarios/concrete-strength/test-cubes.jpg",
      attribution: "Fotokannan，CC BY-SA 4.0",
      source:
        "https://commons.wikimedia.org/wiki/File:15_cm_cubes_used_for_cube_test_to_measure_concrete_strength.jpg",
    },
    {
      title: "压力机做抗压试验",
      caption: "把试块压碎，读出抗压强度，才知道这批配比合不合格",
      image: "/scenarios/concrete-strength/compression-test.jpg",
      // Xb-70，公有领域，不用署名
      source:
        "https://commons.wikimedia.org/wiki/File:Concrete_Compression_Testing.jpg",
    },
  ],
  limix: "LimiX 在第 1 步就给出第 3 步的结果。",
}

const concrete: InstantSpec = {
  slug: "concrete-strength",
  title: "混凝土强度即时预估",
  industry: "建材",
  capability: "回归 · 免训练",
  mode: "instant",
  description: "配比一定下来，几秒估出 28 天抗压强度和区间，不用等试块。",
  target: concreteTarget,
  features: concreteFeatures,
  contextFile: "samples/concrete-context.csv",
  samplesFile: "samples/concrete-samples.csv",
  uploadFile: "samples/concrete-upload.csv",
  contextLabel: "历史配比与实测强度",
  sweep: {
    key: "age",
    values: [3, 7, 14, 28, 56, 90],
    title: "同一配比，不同龄期",
  },
  summaryKeys: ["cement", "water", "age"],
  evaluation: {
    source: "data/eval/concrete-strength/metrics.json",
    result: concreteMetrics,
    limix: "LimiX-16M",
    reference: "XGBoost",
    unit: "MPa",
  },
  case: {
    story: STORY,
    scene: [
      "配比有问题，往往要等一个月压完试块才发现；搅拌站希望下料前就知道这组配比能到多少强度。",
    ],
    approach: {
      input: "7 种原材料的每立方用量和龄期，共 8 项",
      output: "抗压强度的中位预估 P50 和 P10–P90 区间",
      how: "历史配比与实测强度当作上下文，传一次反复用，不训练模型；实测值回来后加进上下文，下一次就用上。",
    },
    boundary: {
      fits: [
        "新配比的各项用量和龄期落在历史数据的范围内，各项范围见数据页的字段表。",
      ],
      misfits: [
        "用了历史数据里没有的材料，如纤维、再生骨料、特殊外加剂。",
        "强度差异来自养护温湿度、振捣等现场条件；这些不在表里，模型看不到。",
      ],
      needs: [
        "几百条历史配比（各材料每立方用量、龄期）和对应试块的实测强度。",
        "最好来自同一搅拌站或同类原材料。",
      ],
    },
  },
  data: {
    basis: "公开数据",
    source: "UCI Concrete Compressive Strength（I-Cheng Yeh，1998）",
    license: "CC BY 4.0",
    files: [
      {
        name: "concrete-context.csv",
        path: "samples/concrete-context.csv",
        role: "context",
        rows: 721,
        note: "历史配比与实测强度，在线预测时作为上下文",
      },
      {
        name: "concrete-samples.csv",
        path: "samples/concrete-samples.csv",
        role: "samples",
        rows: 309,
        note: "测试记录，带实测强度，用来核对预估",
      },
      {
        name: "concrete-upload.csv",
        path: "samples/concrete-upload.csv",
        role: "upload",
        rows: 10,
        note: "中文表头，演示「上传或粘贴」时用",
      },
    ],
    fields: instantFields(concreteFeatures, concreteTarget),
  },
}

export const instantSpecs: Record<string, InstantSpec> = {
  [concrete.slug]: concrete,
}

export function findInstantSpec(slug: string) {
  return instantSpecs[slug] ?? null
}
