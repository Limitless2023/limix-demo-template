import { LimixError } from "@/lib/limix/client"
import { runForecast } from "@/lib/limix/forecast"
import type { ForecastRequest } from "@/lib/forecast-types"

// 同步预测在 LimiX 侧通常几秒到几十秒；部署到 Vercel 时函数默认时长可能不够，这里放宽到 60 秒。
export const maxDuration = 60

const MAX_CSV_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ForecastRequest> | null
  const problem = validate(body)
  if (problem) return Response.json({ error: problem }, { status: 400 })
  try {
    return Response.json(await runForecast(body as ForecastRequest))
  } catch (error) {
    const message = error instanceof Error ? error.message : "预测失败"
    console.error("[forecast]", message)
    return Response.json({ error: message }, { status: error instanceof LimixError ? error.status : 500 })
  }
}

function validate(b: Partial<ForecastRequest> | null) {
  if (!b || typeof b.csv !== "string" || !b.csv.trim()) return "缺少 CSV 数据"
  if (b.csv.length > MAX_CSV_BYTES) return "CSV 超过 5 MB，demo 请先截取"
  if (!b.colDate || !b.colTarget) return "缺少时间列或目标列"
  if (!Number.isInteger(b.horizon) || b.horizon! < 1 || b.horizon! > 720) return "预测步长应为 1–720 的整数"
  if (!Number.isInteger(b.contextSize) || b.contextSize! < 1 || b.contextSize! > 4096) return "上下文长度应为 1–4096 的整数"
  return null
}
