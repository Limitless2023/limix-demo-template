/**
 * [INPUT]: 依赖 ./scenario-spec 的 ScenarioObject、ScenarioSpec（纯类型，客户端组件与服务端都可以引用）
 * [OUTPUT]: 导出 ForecastSpec、ForecastObject、ForecastRequest、ForecastRow、ForecastResult
 * [POS]: 「时序预测」模式的前后端契约。lib/limix/forecast.ts 与 app/api/forecast 产出结果，components/forecast 消费。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ScenarioObject, ScenarioSpec } from "./scenario-spec"

/** 「时序预测」的一个预测对象：样例数据、列名、上下文窗口、步长、事先已知的输入 */
export type ForecastObject = ScenarioObject & {
  forecast: {
    /** public/ 下的样例：时间列、目标列、已知输入列；回测对象的样例里最后几天就是可选的预测日 */
    sample: { path: string; name: string }
    colDate: string
    colTarget: string
    /** 目标的中文名与单位，如「日前电价」「元/MWh」 */
    targetLabel: string
    unit: string
    /** 一步（一行）是多长，如「15 分钟」「小时」 */
    step: string
    /** 每天多少步，如 15 分钟数据是 96 */
    perDay: number
    /** 上下文窗口（行数） */
    contextSize: number
    /** 可选的预测步长（行数） */
    horizons: number[]
    /** 事先已知、随未来点位一起上传的输入列（LimiX 的协变量）；空数组 = 只用历史 */
    known: string[]
    /** 回测：样例最后几天里、有实测值的天可选为预测日，预测后与实测对账；0 = 预测样例结束之后 */
    backtestDays: number
    /** 图上画多少行历史 */
    showHistory: number
    /**
     * 预测时最近几天的目标值还拿不到（如实时电价第二天才公布）。样例回测时历史只用到这几天之前，
     * LimiX 连同这几天一起往后预测，只返回预测日；不填为 0
     */
    gapDays?: number
  }
}

/** 「时序预测」模式的场景：公共 ScenarioSpec 加上一组预测对象（只有一个对象时，切换条不显示） */
export type ForecastSpec = Omit<ScenarioSpec, "objects"> & {
  mode: "forecast"
  objects: ForecastObject[]
}

/** POST /api/forecast：用样例数据时只传场景、对象、预测日；上传自己的数据时带 csv（目标列为空的行就是要预测的点） */
export type ForecastRequest = {
  scenario: string
  object: string
  /** 回测的预测日 YYYY-MM-DD；不传则预测样例结束之后 */
  start?: string
  horizon?: number
  csv?: string
  filename?: string
  /** 页面会话号，留痕用 */
  session?: string
}

export type ForecastRow = { time: string; p50: number; low: number; high: number; actual?: number }

export type ForecastResult = {
  /** live = 真实调用 LimiX；mock = 未配置 Key 时的模拟结果，页面上必须标明 */
  mode: "live" | "mock"
  rows: ForecastRow[]
  /** 图上画的历史（预测起点之前） */
  history: { time: string; value: number }[]
  /** 这次随未来点位上传的已知输入列数 */
  knownCount: number
  contextRows: number
  elapsedMs: number
  taskId?: string
}
