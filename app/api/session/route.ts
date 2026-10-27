/**
 * [INPUT]: 依赖 @/lib/gtm/token 的 verifyLaunchToken、signSession、SESSION_COOKIE、SESSION_TTL_SECONDS
 * [OUTPUT]: GET ?token=&next=：核对中台签的进入令牌，签发本站会话 cookie，跳回 next（只接受本站相对路径）
 * [POS]: 从 GTM 中台进入的落脚点。proxy.ts 放行这一个路径，其余页面与接口都要会话。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { NextResponse } from "next/server"

import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifyLaunchToken } from "@/lib/gtm/token"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const operator = await verifyLaunchToken(url.searchParams.get("token"))
  if (!operator) {
    return new Response("进入链接无效或已过期，请回到 GTM 中台重新打开。", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
  const res = NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), url))
  res.cookies.set(SESSION_COOKIE, await signSession(operator), {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
  return res
}

// 只回本站：必须以单个 / 开头，挡住 //evil.com 与 /\evil.com 这类跳出本站的写法
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/"
}
