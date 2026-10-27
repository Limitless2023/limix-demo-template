import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // /api/instant 与 /api/forecast 在服务端用 fs 读样例，构建时追踪不到，部署到 Vercel 要显式打包进函数
  outputFileTracingIncludes: {
    "/api/instant": ["./public/samples/**/*"],
    "/api/forecast": ["./public/samples/**/*"],
  },
}

export default nextConfig
