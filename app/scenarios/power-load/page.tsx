import { isMockMode } from "@/lib/limix/config"

import { PowerLoadDemo } from "./power-load-demo"

export const dynamic = "force-dynamic"

export default function Page() {
  return <PowerLoadDemo mock={isMockMode()} />
}
