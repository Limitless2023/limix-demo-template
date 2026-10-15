// 前后端共用的时序预测类型（不含任何服务端代码，客户端组件可以引用）。

export type ForecastRequest = {
  csv: string
  filename?: string
  colDate: string
  colTarget: string
  horizon: number
  contextSize: number
}

export type ForecastRow = { time: string; p50: number; low: number; high: number }

export type ForecastResult = {
  /** live = 真实调用 LimiX；mock = 未配置 Key 时的模拟结果，页面上必须标明 */
  mode: "live" | "mock"
  rows: ForecastRow[]
  elapsedMs: number
  taskId?: string
  resultVersionId?: string
}
