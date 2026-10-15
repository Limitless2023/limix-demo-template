# lib/limix/
> L2 | 父级: ../../AGENTS.md

LimiX 开放平台的服务端调用层。全部文件带 `server-only`：API Key 只在服务端，浏览器只调本站 `/api/*`。

- `config.ts`: 环境变量（地址、Key、模型规格）与模拟模式判定。没配 Key 或 `LIMIX_MOCK=1` 时走模拟，页面必须标明「模拟结果」。
- `client.ts`: HTTP 层，唯一直接请求 LimiX 的文件。上传、时序同步预测、异步任务提交与轮询（`waitForTask`）、下载。成功响应 `code: 0`，否则抛 `LimixError`（带原始错误码）。轮询节奏是实测结论（先等 4 秒、之后每 3 秒），改之前先读函数注释。
- `forecast.ts`: 时序预测链路（电力负荷场景）：上传整份历史 → 同步预测 → 下载，整理成画图的行。

依赖方向：`app/api/*` → `forecast.ts` → `client.ts` → `config.ts`。业务代码不直接 `fetch` LimiX。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
