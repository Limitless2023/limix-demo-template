<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LimiX 场景 demo 底座

给售前同事做场景化 demo 的基准仓库：每个场景一页，用一份数据走完「上传 → 调 LimiX → 看结果与业务解读」。复制本仓库开始新的客户 demo，或在这里加场景。

## 技术栈

- Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS 4。
- UI：stable-ai-design（稳准智能设计系统），主题 `blue-light`（LimiX 蓝），写在 `app/layout.tsx` 的 `<html data-theme>`。组件在 `components/ui/`（基础组件是 shadcn base-nova 原版，写法照 ui.shadcn.com 的 Base UI 版；行业组件如 FanChart、Stat、DataGrid），整页参考 `components/blocks/`（12 个页型）。做界面前先读 `.claude/skills/stable-ai-design/SKILL.md`。
- LimiX：只在服务端调用，见 `lib/limix/`。接口文档 https://api-docs.stable-ai.cn/ 。

## 目录

```
proxy.ts                      # 访问保护：DEMO_BASIC_AUTH=用户名:密码 时整站要求登录
app/layout.tsx                # 主题 + 全站骨架（DemoShell）
app/page.tsx                  # 场景首页：卡片来自 lib/scenarios.ts，显示是否已连接 LimiX
app/scenarios/<slug>/         # 一个场景一个目录：page.tsx（服务端，读模拟模式）+ <slug>-demo.tsx（客户端交互）
app/api/forecast/route.ts     # 时序预测：上传 → 同步预测（P10/P50/P90）→ 下载结果
app/api/limix/[...path]/      # 通用转发：/api/limix/v1/<接口> → LimiX，服务端加 Key
lib/limix/                    # LimiX 调用层，见 lib/limix/CLAUDE.md
lib/scenarios.ts              # 场景清单（首页卡片与侧栏导航）
components/demo/demo-shell.tsx # stable-ai-design 的 AppShell，侧栏按场景清单生成
public/samples/               # 示例数据（合成数据）
```

## LimiX 调用要点

- 异步任务用 `lib/limix/client.ts` 的 `submitInferenceTask` + `waitForTask`。**轮询不能太密**（2026-10-15 实测）：任务运行中每秒查一次，状态查询本身会挂住 30 秒以上；`waitForTask` 先等 4 秒再查、之后每 3 秒一次，单条回归约 6 秒出结果。一次传 5 条与 1 条一样快。
- 「一次建模、多次推理」的完整做法（上下文表传一次、只传新记录、实测值加入上下文）见 `limix-scenario-demos` 的即时预估场景，它从本模板复制而来。

## 新增一个场景

1. 在 `lib/scenarios.ts` 加一条（slug、标题、行业、用到的 LimiX 能力、一句话说明、图标）。
2. 复制 `app/scenarios/power-load/` 为 `app/scenarios/<slug>/`，改数据契约（列名、上下文长度、步长）与页面文案。
3. 示例数据放 `public/samples/<slug>.csv`。时序场景直接用 `/api/forecast`；分类、回归、因果解释等先用 `/api/limix/v1/...` 通用转发跑通，常用链路再沉淀成 `lib/limix/` 的函数和专用 API 路由。
4. 页面骨架用 `PageHeader`，结果优先用现有组件（FanChart、Stat、Table、DataGrid、MetricDiffTable 等），不另写样式。
5. `npm run build` 通过再交付。

## 规则

- **Key 不进浏览器**：前端只调本站 `/api/*`；`LIMIX_API_KEY` 只在 `.env.local` 或部署平台的环境变量里，不提交、不打印、不写进页面。
- **模拟模式要标明**：没配 Key（或 `LIMIX_MOCK=1`）时 `/api/forecast` 返回 `mode: "mock"`，页面必须显示「模拟结果」，不能把模拟结果说成 LimiX 的预测。
- **数据**：示例只用合成数据；用客户数据前确认授权，客户数据不提交到仓库。
- **部署到公网必须设 `DEMO_BASIC_AUTH`**，否则任何人都能用这个 Key 的额度。
- 文案中文、结论先行；按 stable-ai-design 的规则：一页一个主按钮，颜色只用语义变量，不写十六进制。
