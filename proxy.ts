import { NextResponse, type NextRequest } from "next/server"

// 访问保护：设置 DEMO_BASIC_AUTH=用户名:密码 后，整个站点（含 /api）要求浏览器基础认证。
// demo 部署到公网时一定要设：/api 背后是带 Key 的 LimiX 调用，不设等于把额度开放给所有人。
export function proxy(request: NextRequest) {
  const expected = process.env.DEMO_BASIC_AUTH
  if (!expected) return NextResponse.next()
  const header = request.headers.get("authorization") || ""
  const [scheme, encoded] = header.split(" ")
  if (scheme === "Basic" && encoded && atob(encoded) === expected) return NextResponse.next()
  return new NextResponse("需要访问密码", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="LimiX demo", charset="UTF-8"' } })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
