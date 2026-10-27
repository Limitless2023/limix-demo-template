/**
 * [INPUT]: 读 env DEMO_LINK_SECRET、GTM_URL；只用 Web Crypto（proxy.ts 与路由都能用）
 * [OUTPUT]: 导出 Operator、SESSION_COOKIE、SESSION_TTL_SECONDS、isGtmLinked、gtmUrl、verifyLaunchToken、signSession、readSession、signRunBody
 * [POS]: lib/gtm 的签名层。与 GTM 中台 src/modules/demo-runs/link.ts 同一算法：sha256(用途 + ':' + 密钥) 派生 HMAC 密钥，
 *        令牌为「base64url(JSON).base64url(签名)」。用途互不通用：demo-launch（中台签的进入令牌）、demo-session（本站会话）、
 *        demo-runs（发给中台的留痕）。改算法两边一起改。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export type Operator = { openId: string; name: string }

export const SESSION_COOKIE = "limix_demo_session"
export const SESSION_TTL_SECONDS = 12 * 3600

/** 配了共用密钥和中台地址：从中台进入、按人留痕；否则退回访问密码（DEMO_BASIC_AUTH）或不设防 */
export const isGtmLinked = () => !!(process.env.DEMO_LINK_SECRET && process.env.GTM_URL)
export const gtmUrl = () => (process.env.GTM_URL ?? "").replace(/\/+$/, "")

const encoder = new TextEncoder()

async function hmac(purpose: string, data: string) {
  const raw = await crypto.subtle.digest("SHA-256", encoder.encode(`${purpose}:${process.env.DEMO_LINK_SECRET ?? ""}`))
  const key = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data))))
}

function base64url(bytes: Uint8Array) {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function decodeBase64url(text: string) {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

// 等长逐字节比较，不因前几位不同提前返回
function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function open(purpose: string, token: string | null | undefined): Promise<Operator | null> {
  if (!token || !process.env.DEMO_LINK_SECRET) return null
  const [payload, sig] = token.split(".")
  if (!payload || !sig || !same(sig, await hmac(purpose, payload))) return null
  try {
    const data = JSON.parse(decodeBase64url(payload))
    if (typeof data.exp !== "number" || data.exp * 1000 < Date.now()) return null
    if (typeof data.openId !== "string" || !data.openId) return null
    return { openId: data.openId, name: typeof data.name === "string" ? data.name : "" }
  } catch {
    return null
  }
}

/** 中台 /api/demos/launch 签的进入令牌，5 分钟有效 */
export const verifyLaunchToken = (token: string | null) => open("demo-launch", token)

/** 本站会话 cookie */
export const readSession = (token: string | null | undefined) => open("demo-session", token)

export async function signSession(operator: Operator) {
  const payload = base64url(encoder.encode(JSON.stringify({ ...operator, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })))
  return `${payload}.${await hmac("demo-session", payload)}`
}

/** 留痕请求签名：签「时间戳.请求体」，中台核对时间戳在 5 分钟内 */
export const signRunBody = (timestamp: string, body: string) => hmac("demo-runs", `${timestamp}.${body}`)
