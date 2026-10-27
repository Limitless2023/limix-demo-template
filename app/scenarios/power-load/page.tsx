/**
 * [INPUT]: 依赖 @/components/scenario/scenario-page 的 ScenarioPage；依赖 @/lib/forecast-scenarios 的场景配置；
 *          依赖 @/lib/scenario-spec 的 parseScenarioTab；依赖 @/lib/limix/config 的 isMockMode
 * [OUTPUT]: 默认导出场景页「电力负荷预测」
 * [POS]: app/scenarios 下的场景页（时序预测模式）。服务端只读模拟模式与 ?tab=case | data | demo，其余全在 ScenarioPage 里。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { ScenarioPage } from "@/components/scenario/scenario-page"
import { forecastSpecs } from "@/lib/forecast-scenarios"
import { isMockMode } from "@/lib/limix/config"
import { parseScenarioTab } from "@/lib/scenario-spec"

export const dynamic = "force-dynamic"

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string | string[]; object?: string | string[] }> }) {
  const { tab, object } = await searchParams
  return (
    <ScenarioPage
      spec={forecastSpecs["power-load"]}
      mock={isMockMode()}
      initialTab={parseScenarioTab(tab)}
      initialObject={typeof object === "string" ? object : undefined}
    />
  )
}
