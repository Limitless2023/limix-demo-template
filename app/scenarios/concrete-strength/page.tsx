/**
 * [INPUT]: 依赖 @/components/scenario/scenario-page 的 ScenarioPage；依赖 @/lib/instant-scenarios 的场景配置；
 *          依赖 @/lib/scenario-spec 的 parseScenarioTab；依赖 @/lib/limix/config 的 isMockMode
 * [OUTPUT]: 默认导出场景页「混凝土强度即时预估」
 * [POS]: app/scenarios 下的场景页（即时预估模式）。服务端只读模拟模式与 ?tab=case | data | demo，其余全在 ScenarioPage 里。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { ScenarioPage } from "@/components/scenario/scenario-page"
import { instantSpecs } from "@/lib/instant-scenarios"
import { isMockMode } from "@/lib/limix/config"
import { parseScenarioTab } from "@/lib/scenario-spec"

export const dynamic = "force-dynamic"

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams
  return <ScenarioPage spec={instantSpecs["concrete-strength"]} mock={isMockMode()} initialTab={parseScenarioTab(tab)} />
}
