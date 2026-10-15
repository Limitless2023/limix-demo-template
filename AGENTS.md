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
app/api/instant/              # 即时预估：prepare / append / reset 返回 JSON，predict 以 NDJSON 流逐步返回（validate.ts 校验入参）
app/api/limix/[...path]/      # 通用转发：/api/limix/v1/<接口> → LimiX，服务端加 Key
lib/limix/                    # LimiX 调用层，见 lib/limix/CLAUDE.md
lib/scenarios.ts              # 场景清单（首页卡片与侧栏导航）
lib/instant-types.ts          # 即时预估的前后端契约（场景配置、预测事件、上下文信息）
lib/instant-scenarios.ts      # 即时预估的场景配置：输入列、目标列、上下文表、扫描曲线、文案
hooks/use-instant.ts          # 即时预估页面与 /api/instant 之间的桥：上下文状态、预测进度
components/instant/           # 即时预估的整页组件，见 components/instant/CLAUDE.md
components/demo/demo-shell.tsx # stable-ai-design 的 AppShell，侧栏按场景清单生成
public/samples/               # 示例数据：power-load 为合成数据；concrete-* 为公开数据集（UCI，CC BY 4.0）：context 上下文、samples 测试记录、upload 演示上传用
scripts/eval_instant.py       # 即时预估的离线评估（LimiX 与参照方法），写出 data/eval/<slug>/
data/eval/<slug>/             # 离线评估结果：metrics.json（场景卡「效果」一栏的唯一来源）与 predictions.csv
```

## 即时预估（一次建模、多次推理）

场景页 `app/scenarios/concrete-strength/`，分「案例介绍」与「在线演示」两个 tab（`?tab=demo` 直接打开演示）。历史表（含目标列）作为上下文只上传一次，之后每次只上传新记录：上传 → 异步回归任务（P10 / P50 / P90）→ 轮询 → 取回。新记录带上实测值后可加入上下文，重新上传约 0.5 秒，不用训练。加一个行业场景 = `lib/instant-scenarios.ts` 加一条配置（含场景说明与字段含义）+ `public/samples/` 放上下文表、测试记录、示例上传文件 + 跑一次 `uv run --with scikit-learn python scripts/eval_instant.py …` 生成评估结果 + 建 `app/scenarios/<slug>/page.tsx` 渲染 `InstantDemo`。页面「效果」数字只读 metrics.json，不手抄。当前上下文 CSV 经 `GET /api/instant?scenario=<slug>&download=context` 下载（含演示中加入的记录）。

2026-10-15 实测（本机直连，16M，单条）：一次预测 5.7–6.3 秒（上传 0.5、提交 0.2、计算 4.7–4.9、取回 0.1–0.8）；一次 5 或 6 条与 1 条一样快。**轮询不能太密**：任务运行中每秒查一次，状态查询本身会挂住 30 秒以上；`waitForTask` 因此先等 4 秒再查、之后每 3 秒一次，5 次全部 4.7 秒完成。

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
