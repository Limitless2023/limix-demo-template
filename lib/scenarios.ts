/**
 * [INPUT]: 依赖 lucide-react 的场景图标；依赖 ./scenario-spec 的 DemoMode
 * [OUTPUT]: 导出 Scenario 类型与 scenarios 清单
 * [POS]: 场景注册表：首页卡片与侧栏导航都从这里生成。新增场景 = 在这里加一条 + 写场景配置（ScenarioSpec 的某个模式扩展）
 *        + 建 app/scenarios/<slug>/page.tsx 渲染 ScenarioPage。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FlaskConical, Zap, type LucideIcon } from "lucide-react"

import type { DemoMode } from "./scenario-spec"

export type Scenario = {
  slug: string
  title: string
  industry: string
  /** 用到的 LimiX 能力：时序预测、分类、回归、因果解释等 */
  capability: string
  /** 演示模式，中文名见 DEMO_MODE_LABEL */
  mode: DemoMode
  summary: string
  icon: LucideIcon
  /** 只放清单、页面还没做好时设为 true：首页显示「准备中」，不进侧栏 */
  draft?: boolean
}

export const scenarios: Scenario[] = [
  {
    slug: "power-load",
    title: "电力负荷预测",
    industry: "能源电力",
    capability: "时序预测",
    mode: "forecast",
    summary:
      "用最近三周逐小时负荷预测未来 24–72 小时负荷与 P10–P90 区间，支撑日前调度与购电计划。",
    icon: Zap,
  },
  {
    slug: "concrete-strength",
    title: "混凝土强度即时预估",
    industry: "建材",
    capability: "回归 · 免训练即时推理",
    mode: "instant",
    summary:
      "历史配比与实测强度当作上下文，传一次反复用；新配比来一条判一条，几秒出强度与区间，实测值回来后加入上下文立刻生效。",
    icon: FlaskConical,
  },
]
