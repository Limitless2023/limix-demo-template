/**
 * [INPUT]: 无依赖（纯类型与常量，客户端组件与服务端都可以引用）
 * [OUTPUT]: 导出 ScenarioSpec、ScenarioObject、resolveObject、ScenarioTab、parseScenarioTab、DemoMode、DEMO_MODE_LABEL、FieldDoc、FieldRole、FIELD_ROLE_LABEL、DataFile、FileRole、FILE_ROLE_LABEL、
 *           DataBasis、ScenarioStory、EvalMetrics、EvalSummary
 * [POS]: 所有场景页的公共契约。一个 slug 一页、三个标签页（案例介绍 / 数据 / 在线预测，地址 ?tab=case | data | demo），
 *        components/scenario 按它渲染骨架，在线预测按 mode 分发。各演示模式在此基础上扩展：
 *        即时预估 InstantSpec（lib/instant-types.ts）、时序预测 ForecastSpec（lib/forecast-types.ts）。
 *        一页可以有几个「预测对象」（objects，如日前电价 / 实时电价）：同一个故事，数据、字段、效果各一份，地址带 ?object=。
 *        中台「场景 Demo」按 slug 与演示模式中文名对接，改名要同步中台。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ──────────────────────────────────────────────────────────────
// 标签页：地址 ?tab=case | data | demo，中台「打开演示」落 demo、「案例介绍」落 case、「查看数据说明」落 data
// ──────────────────────────────────────────────────────────────

export type ScenarioTab = "case" | "data" | "demo"

/** 地址参数转标签页；不认识的值回到案例介绍 */
export function parseScenarioTab(value: unknown): ScenarioTab {
  return value === "data" || value === "demo" ? value : "case"
}

// ──────────────────────────────────────────────────────────────
// 演示模式：在线预测不是一个东西，是少数几种模式加场景皮肤
// ──────────────────────────────────────────────────────────────

export type DemoMode =
  "instant" | "forecast" | "backtest" | "intervention" | "twin"

/** 中文名与中台、飞书「售前 Demo 库」的「演示模式」列一致 */
export const DEMO_MODE_LABEL: Record<DemoMode, string> = {
  instant: "即时预估",
  forecast: "时序预测",
  backtest: "回测对账",
  intervention: "干预模拟",
  twin: "大屏孪生",
}

// ──────────────────────────────────────────────────────────────
// 数据契约：来源与许可、文件清单、字段表（数据页按它渲染）
// ──────────────────────────────────────────────────────────────

export type FieldRole = "input" | "target" | "time" | "group"

export const FIELD_ROLE_LABEL: Record<FieldRole, string> = {
  input: "输入",
  target: "目标",
  time: "时间",
  group: "分组",
}

/** 字段表的一行。取值范围不手写：数据页从上下文文件现算，只有文件里算不出时才用 range */
export type FieldDoc = {
  key: string
  label: string
  unit: string
  role: FieldRole
  note: string
  range?: string
}

export type FileRole = "context" | "samples" | "upload"

export const FILE_ROLE_LABEL: Record<FileRole, string> = {
  context: "上下文",
  samples: "测试记录",
  upload: "上传样例",
}

/** 一类数据的披露时点：什么时候公布、本场景怎么用。时序场景用它说明预测时只用了当时拿得到的数据 */
export type DataTiming = { data: string; when: string; use: string }

/** public/ 下的一个数据文件；path 不带开头的斜杠 */
export type DataFile = {
  name: string
  path: string
  role: FileRole
  rows: number
  /** 这份文件拿来做什么 */
  note: string
}

/** 来源三档，与中台「数据口径」一致 */
export type DataBasis = "真实数据" | "公开数据" | "合成数据"

// ──────────────────────────────────────────────────────────────
// 案例介绍：五段固定（视觉插槽、场景与痛点、LimiX 怎么做、效果、适用边界），没写的段不渲染
// ──────────────────────────────────────────────────────────────

/** 视觉插槽 L0：几步现场流程配图，最后一句说明 LimiX 替代哪一步。图片放 public/ */
export type ScenarioStory = {
  steps: {
    title: string
    caption: string
    image: string
    /** 图片来源页 */
    source: string
    /** 许可要求署名时写（如「作者，CC BY-SA 4.0」），显示在案例介绍页脚并链到来源；公有领域不写 */
    attribution?: string
  }[]
  limix: string
}

/** 离线评估的单个方法成绩，字段名与 scripts/eval_instant.py 写出的 metrics.json 一致 */
export type EvalMetrics = {
  mae: number
  rmse: number
  r2: number
  coverage_p10_p90?: number
  /** true 需训练 / false 免训练 / null 朴素参照（如猜均值） */
  train?: boolean | null
}

export type EvalSummary = {
  /** metrics.json 在仓库里的路径，页面上注明来源 */
  source: string
  result: {
    date: string
    model: string
    context_rows: number
    test_rows: number
    methods: Record<string, EvalMetrics>
    /** 滚动回测（时序）：回测的日子与每天点数；有它时说明写成「某日至某日滚动回测」 */
    test_days?: string[]
    points_per_day?: number
    /** 目标值的公布延迟：历史只用到预测日前 gap_days + 1 天 */
    gap_days?: number
  }
  /** result.methods 的键：LimiX、指标卡里拿来对照的参照模型。对比表默认列出 methods 里的全部方法 */
  limix: string
  reference: string
  /** 对比表只显示这些方法（按 methods 的键）；不写就全部显示。metrics.json 仍记全部方法，页面只是少列几行 */
  show?: string[]
  /** 误差的单位，如 MPa */
  unit: string
  /** 怎么读这张表的一句话（参照方法是什么、测试记录怎么来的），显示在对比表下方；没有就不写 */
  note?: string
}

/** 页内可切换的预测对象：案例介绍的「LimiX 怎么做」与「效果」、数据页的文件与字段可以各写一份，没写的沿用场景的 */
export type ScenarioObject = {
  /** 地址参数 object 的值 */
  key: string
  /** 切换按钮上的名字 */
  name: string
  approach?: ScenarioSpec["case"]["approach"]
  evaluation?: EvalSummary
  files?: DataFile[]
  fields?: FieldDoc[]
}

export type ScenarioSpec = {
  slug: string
  title: string
  industry: string
  /** 用到的 LimiX 能力，如「回归 · 免训练」 */
  capability: string
  mode: DemoMode
  /** 页头一句话 */
  description: string
  /** 这个场景用的 LimiX 模型规格，如 LIMIX_64M；不写则用环境变量 LIMIX_MODEL_TYPE（默认 16M）。离线评估要用同一规格，页面数字才对得上演示 */
  model?: string
  case: {
    /** 1 视觉插槽 */
    story?: ScenarioStory
    /** 2 场景与痛点：现场现在怎么做，哪里慢、贵、不准；一段一个元素 */
    scene?: string[]
    /** 3 LimiX 怎么做：输入什么、输出什么，机制一句话 */
    approach?: { input: string; output: string; how: string }
    /** 5 适用边界：什么条件下适用、什么条件下不适用、需要什么数据 */
    boundary?: { fits: string[]; misfits: string[]; needs: string[] }
  }
  /** 4 效果：数字只来自 data/eval/<slug>/metrics.json；没有离线评估的场景不写，案例介绍不出这一段 */
  evaluation?: EvalSummary
  data: {
    basis: DataBasis
    /** 来源，如「UCI Concrete Compressive Strength（I-Cheng Yeh，1998）」 */
    source: string
    license: string
    files: DataFile[]
    fields: FieldDoc[]
    /** 原始数据自带的说明文档，放在飞书云空间；有它时口径条末尾出「数据说明」按钮，新标签页打开 */
    doc?: { name: string; url: string }
    /** 披露时点：有它时数据页多一张「预测时拿得到哪些数据」 */
    timing?: { note: string; rows: DataTiming[] }
  }
  /** 预测对象；不写就是只有一个对象的场景 */
  objects?: ScenarioObject[]
}

/** 当前对象生效的内容：对象写了的用对象的，没写的用场景的。key 不认识时取第一个对象 */
export function resolveObject(spec: ScenarioSpec, key?: string | null) {
  const object =
    spec.objects?.find((o) => o.key === key) ?? spec.objects?.[0] ?? null
  return {
    object,
    approach: object?.approach ?? spec.case.approach,
    evaluation: object?.evaluation ?? spec.evaluation,
    files: object?.files ?? spec.data.files,
    fields: object?.fields ?? spec.data.fields,
  }
}
