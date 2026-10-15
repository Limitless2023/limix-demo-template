import type { NextRequest } from "next/server"

import { isMockMode, limixConfig } from "@/lib/limix/config"

// 通用转发：浏览器调 /api/limix/v1/<接口>，服务端加上 X-API-KEY 转给 LimiX，响应原样返回（JSON 或文件流）。
// 新场景要用的接口不在 lib/limix/ 里时，先用它跑通；常用链路再沉淀成 lib/limix/ 的函数。
// 只放行 /v1/ 开头的路径；Key 只在服务端，前端看不到。
export const maxDuration = 60

async function forward(request: NextRequest, ctx: RouteContext<"/api/limix/[...path]">) {
  const { path } = await ctx.params
  if (path[0] !== "v1") return Response.json({ error: "只允许转发 /v1/ 开头的 LimiX 接口" }, { status: 400 })
  if (isMockMode()) return Response.json({ error: "未配置 LIMIX_API_KEY（模拟模式），通用转发不可用" }, { status: 503 })

  const target = `${limixConfig.baseUrl}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`
  const headers = new Headers({ "X-API-KEY": limixConfig.apiKey })
  const type = request.headers.get("content-type")
  if (type) headers.set("content-type", type)

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  })
  const out = new Headers()
  for (const name of ["content-type", "content-disposition"]) {
    const value = res.headers.get(name)
    if (value) out.set(name, value)
  }
  return new Response(res.body, { status: res.status, headers: out })
}

export { forward as GET, forward as POST }
