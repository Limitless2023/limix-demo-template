/**
 * [INPUT]: 依赖 @/components/instant/instant-demo 的 InstantDemo；依赖 @/lib/instant-scenarios 的场景配置；依赖 @/lib/limix/config 的 isMockMode
 * [OUTPUT]: 默认导出场景页「混凝土强度即时预估」
 * [POS]: app/scenarios 下的「即时预估」场景页。服务端只读模拟模式与 ?tab=demo（直接打开在线演示），交互全部在 InstantDemo 里。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { InstantDemo } from "@/components/instant/instant-demo"
import { instantSpecs } from "@/lib/instant-scenarios"
import { isMockMode } from "@/lib/limix/config"

export const dynamic = "force-dynamic"

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams
  return <InstantDemo spec={instantSpecs["concrete-strength"]} mock={isMockMode()} initialTab={tab === "demo" ? "demo" : "case"} />
}
