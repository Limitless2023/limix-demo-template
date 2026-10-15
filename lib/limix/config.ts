import "server-only"

// LimiX 连接配置，只在服务端读取。API Key 永远不进浏览器：前端一律调本站的 /api/*。
export const limixConfig = {
  baseUrl: (process.env.LIMIX_BASE_URL || "https://limix-api.stable-ai.cn").replace(/\/+$/, ""),
  apiKey: process.env.LIMIX_API_KEY?.trim() || "",
  modelType: process.env.LIMIX_MODEL_TYPE || "LIMIX_16M",
}

// 没配 Key，或显式设置 LIMIX_MOCK=1 时走模拟模式：页面照常可演示，结果标明「模拟」。
export function isMockMode() {
  return process.env.LIMIX_MOCK === "1" || !limixConfig.apiKey
}
