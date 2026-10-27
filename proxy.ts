import { NextResponse, type NextRequest } from "next/server"

import { gtmUrl, isGtmLinked, readSession, SESSION_COOKIE } from "@/lib/gtm/token"

// 访问保护，二选一：
// - 接入 GTM 中台（配了 DEMO_LINK_SECRET 与 GTM_URL）：必须从中台进入，本站会话里带着操作人，调用按人留痕。
//   没有会话的页面送去中台确认登录，再带着进入令牌回来；接口直接 401。/api/session 是进入的落脚点，放行；公开配图也放行（next/image 取原图不带 cookie）。
// - 未接入时退回访问密码：DEMO_BASIC_AUTH=用户名:密码 后整站要求浏览器基础认证。
// demo 部署到公网时两者至少要有一个：/api 背后是带 Key 的 LimiX 调用，不设防等于把额度开放给所有人。
export async function proxy(request: NextRequest) {
  if (isGtmLinked()) return guardBySession(request)
  const expected = process.env.DEMO_BASIC_AUTH
  if (!expected) return NextResponse.next()
  const header = request.headers.get("authorization") || ""
  const [scheme, encoded] = header.split(" ")
  if (scheme === "Basic" && encoded && atob(encoded) === expected) return NextResponse.next()
  return new NextResponse("需要访问密码", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="LimiX demo", charset="UTF-8"' } })
}

async function guardBySession(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === "/api/session") return NextResponse.next()
  // 案例介绍的配图（public/scenarios/*.jpg 等公开图片）放行：next/image 在服务端自己去取原图，不带会话 cookie，拦了图就全碎
  if (/\.(?:jpe?g|png|webp|gif|svg)$/i.test(pathname)) return NextResponse.next()
  if (await readSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "请从 GTM 中台进入" }, { status: 401 })
  return NextResponse.redirect(`${gtmUrl()}/api/demos/launch?to=${encodeURIComponent(request.url)}`)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
