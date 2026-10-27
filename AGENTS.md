<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LimiX 场景 demo 底座（模板）

售前同事做客户场景 demo 的起点：复制本仓库，照示例场景加自己的场景。每个场景一页，讲清场景与效果，再现场调用 LimiX。

本模板等于 LimiX 场景 demo 站（`limix-scenario-demos`）去掉具体客户场景：场景页三标签页骨架、即时预估与时序预测两种演示模式，各带一个示例场景，混凝土强度即时预估（UCI 公开数据）和电力负荷预测（合成数据）。通用部分（`lib/limix`、`lib/gtm`、`components/` 下的 ui、blocks、scenario、instant、forecast、`hooks/`、`app/api/`）以 demo 站为准：demo 站改了通用代码，再原样同步到这里（2026-10-27 第一次按 demo 站重建）。

## 技术栈

- Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS 4。
- UI：stable-ai-design（稳准智能设计系统），主题 `blue-light`（LimiX 蓝），写在 `app/layout.tsx` 的 `<html data-theme>`。组件在 `components/ui/`（基础组件是 shadcn base-nova 原版，写法照 ui.shadcn.com 的 Base UI 版；行业组件如 FanChart、Stat、DataGrid），整页参考 `components/blocks/`（12 个页型）。做界面前先读 `.claude/skills/stable-ai-design/SKILL.md`。
- LimiX：只在服务端调用，见 `lib/limix/`。接口文档 https://api-docs.stable-ai.cn/ 。请求走 undici（显式依赖，用来单独设连接超时），不要换回全局 fetch。

## 目录

```
proxy.ts                      # 访问保护：接入 GTM 中台时要本站会话（没有就送去中台确认登录）；未接入时 DEMO_BASIC_AUTH=用户名:密码 整站要求登录
next.config.ts                # 服务端用 fs 读的文件（上下文表）在这里登记打包进函数
vercel.json                   # 部署到 Vercel：函数区域东京（hnd1）。LimiX 接口在阿里云北京，香港区连它间歇性连接超时（2026-10-16），改东京再观察；根治是部署到国内
app/layout.tsx                # 主题 + 全站骨架（DemoShell）
app/page.tsx                  # 场景首页：卡片来自 lib/scenarios.ts，显示是否已连接 LimiX
app/scenarios/<slug>/page.tsx # 一个场景一页：服务端只读模拟模式与 ?tab=，渲染 ScenarioPage
app/api/forecast/route.ts     # 时序预测：GET 样例信息与可选预测日；POST 用样例（服务端读）或上传的表跑异步时序任务（P10/P50/P90，可带已知输入）
app/api/instant/              # 即时预估：prepare / append / reset 返回 JSON，predict 以 NDJSON 流逐步返回（validate.ts 校验入参）
app/api/limix/[...path]/      # 通用转发：/api/limix/v1/<接口> → LimiX，服务端加 Key
app/api/session/route.ts      # 从 GTM 中台进入的落脚点：核对进入令牌，签发本站会话 cookie
lib/limix/                    # LimiX 调用层，见 lib/limix/CLAUDE.md
lib/gtm/                      # 接入 GTM 中台（可选，不配 GTM_URL 与 DEMO_LINK_SECRET 就不生效）：进入令牌与会话签名、调用留痕上报，见 lib/gtm/CLAUDE.md
lib/scenarios.ts              # 场景清单（首页卡片与侧栏导航），每条带演示模式 mode
lib/scenario-spec.ts          # 场景页公共契约 ScenarioSpec：标题、行业、能力、演示模式、案例介绍五段、数据契约（来源许可、文件、字段）
lib/instant-types.ts          # 即时预估的前后端契约：InstantSpec（ScenarioSpec 的扩展）、预测事件、上下文信息
lib/instant-scenarios.ts      # 即时预估的场景配置：输入列、目标列、三份 CSV、扫描曲线、五段文案、数据页文件与字段；示例场景：混凝土强度（公开数据）
lib/forecast-types.ts         # 时序预测的前后端契约：ForecastSpec（ScenarioSpec 的扩展）、请求与结果
lib/forecast-scenarios.ts     # 时序预测的场景配置；示例场景：电力负荷（合成数据，只用历史）。有事先已知输入（如气象预报）、多个预测对象、目标值延迟公布（gapDays）时，字段含义见 lib/forecast-types.ts
hooks/use-instant.ts          # 即时预估页面与 /api/instant 之间的桥：上下文状态、预测进度
components/scenario/          # 场景页骨架：三个标签页、案例介绍、数据页，在线预测按模式分发，见 components/scenario/CLAUDE.md
components/instant/           # 即时预估模式的演示主体，见 components/instant/CLAUDE.md
components/forecast/          # 时序预测模式的演示主体，见 components/forecast/CLAUDE.md
components/demo/demo-shell.tsx # stable-ai-design 的 AppShell，侧栏按场景清单生成
components/ui/data-grid-preview.tsx # 本仓库新增（不来自设计系统 registry）：移植自 limix-web，按设计系统重做样式，并入 DataGrid 的列画像；分页、全列搜索高亮、点直方图筛选、放大预览、列可自定义单元格；按列排序可选（sortable），默认关闭
components/ui/data-grid-preview-profile.ts # 上面那张表的列画像计算（直方图、高频取值、缺失、均值中位数）与档位筛选，纯函数
public/samples/               # 示例数据：power-load 为合成数据；concrete-* 为公开数据集（UCI，CC BY 4.0）：context 上下文、samples 测试记录、upload 演示上传用
scripts/eval_forecast.py      # 时序预测的离线滚动回测（最近 N 天逐日预测：LimiX 带 / 不带已知输入、LightGBM、朴素参照；--gap-days 处理目标值的公布延迟），写出 data/eval/<slug>/<对象>/
scripts/eval_instant.py       # 即时预估的离线评估（LimiX 与 XGBoost、LightGBM、随机森林、岭回归、猜均值，全部默认参数；--naive-col 加「照某列」参照，--ignore 排除非输入列），写出 data/eval/<slug>/
public/scenarios/<slug>/      # 案例介绍的现场流程配图（Wikimedia Commons，署名写在 spec.case.story）
data/eval/<slug>/             # 离线评估结果：metrics.json（案例介绍「效果」一段的唯一来源）与 predictions.csv
```

## 场景页：三个标签页（2026-10-16，依据 limix-gtm-workspace-mvp/docs/GTM中台构思.md 第 8 节）

一个 slug 一页，三个标签页，地址 `?tab=case | data | demo`（中台「案例介绍」落 case、「查看数据说明」落 data、「打开演示」落 demo，改地址要同步中台）。骨架固定，内容按场景变，全部来自 `ScenarioSpec`：

- **案例介绍**（case）：五段固定：视觉插槽（L0 场景配图 + 三步流程）、场景与痛点、LimiX 怎么做、效果（只读 metrics.json）、适用边界。没写的段不渲染，不编。页脚是数据出处与许可。
- **数据**（data）：口径条（来源、规模、时间范围、许可）、字段表、文件清单（可下载）、数据预览。取值范围和时间范围打开时从上下文文件现算，不手写。
- **在线预测**（demo）：按 `mode` 分发到演示模式：即时预估 `instant`、时序预测 `forecast`；回测对账、干预模拟、大屏孪生还没做。中文名见 `DEMO_MODE_LABEL`，与中台、飞书「演示模式」列一致。切走时不卸载，状态不丢。
- 三个标签页共用页头（行业 · 能力、演示模式、是否连接 LimiX）、模拟提示与报错；即时预估的上下文状态条只在在线预测页显示（2026-10-16 定：案例介绍与数据页用不上，数据页另有文件清单）。
- 文案每层意思只在一处说：页头讲价值，配图末句讲替代哪一步，场景与痛点只讲痛点，机制只在「LimiX 怎么做」。配图公有领域的不署名；许可要求署名的（CC BY-SA 等）在案例介绍页脚与数据出处并成一行。
- demo 站是投屏给客户的：不放话术、红线、内部状态，这些只在中台弹窗。
- **预测对象**（`spec.objects`，2026-10-16）：同一类客户、同一种演示模式的几个预测目标放一页（只有一个对象时不出切换条），标签页上方切换，三个标签页都跟着变，地址带 `?object=`（第一个对象是默认，不带参数）。对象可以各写「LimiX 怎么做」「效果」「文件」「字段」，没写的沿用场景的（`resolveObject`）。

## 即时预估（一次建模、多次推理）

示例场景页 `app/scenarios/concrete-strength/`。历史表（含目标列）作为上下文只上传一次，之后每次只上传新记录：上传 → 异步回归任务（P10 / P50 / P90）→ 轮询 → 取回。新记录带上实测值后可加入上下文，重新上传约 0.5 秒，不用训练。加一个行业场景 = `lib/instant-scenarios.ts` 加一条配置（含场景说明与字段含义）+ `public/samples/` 放上下文表、测试记录、示例上传文件 + 跑一次 `uv run --with scikit-learn python scripts/eval_instant.py …` 生成评估结果 + 建 `app/scenarios/<slug>/page.tsx` 渲染 `ScenarioPage`。页面「效果」数字只读 metrics.json，不手抄。和其他模型的对比只放「案例介绍」（几百条测试记录的统计）；在线预测不放逐条对比：单条记录上谁更准接近抛硬币，现场容易被一条反例带偏（2026-10-16 定）。当前上下文 CSV 经 `GET /api/instant?scenario=<slug>&download=context` 下载（含演示中加入的记录）。上下文按操作人各一份，两个人同时演示互不影响；内存状态随实例冷启动回到初始上下文。

## 接入 GTM 中台（可选，2026-10-16）

自己做的客户 demo 不用接：部署到公网时设 `DEMO_BASIC_AUTH` 就够了。要把 demo 放进中台「场景 Demo」、按人留痕，才需要配下面两项（`DEMO_LINK_SECRET` 找中台管理员要）。

配了 `GTM_URL` 与 `DEMO_LINK_SECRET` 后：从中台「场景 Demo」点进来（中台签 5 分钟有效的进入令牌 → `/api/session` 换成 12 小时的本站会话），直接打开本站会先送去中台确认登录再回来。每次预测、加入上下文、重置，响应发出后经 `after()` 把留痕发给中台 `POST /api/demo-runs`，中台写进飞书「LimiX 场景 Demo · 运行留痕（仅管理员）」：场景、文件（上下文各版本、现场上传的原文件，按指纹去重）、调用记录（操作人、输入方式、条数、耗时、平均绝对误差、LimiX 任务号、输入与结果 CSV）。留痕失败只打日志，不影响演示。表结构与流程见中台仓库 `docs/场景Demo留痕-表结构.md`；新场景不用改表，第一次调用时中台自动建场景行。

2026-10-15 实测（本机直连，16M，单条）：一次预测 5.7–6.3 秒（上传 0.5、提交 0.2、计算 4.7–4.9、取回 0.1–0.8）；一次 5 或 6 条与 1 条一样快。**轮询不能太密**：任务运行中每秒查一次，状态查询本身会挂住 30 秒以上；`waitForTask` 因此先等 4 秒再查、之后每 3 秒一次，5 次全部 4.7 秒完成。

## 新增一个场景

新场景 = 选一种演示模式 + 给配置、数据、文案（「场景包」：五段故事 + CSV 与字段说明 + 核心数字来源）。

1. 选模式：来一条判一条（新配比、新批次、新工单）用即时预估，照 `concrete-strength` 写进 `lib/instant-scenarios.ts`；按时间往后预测（负荷、电量、价格、产量）用时序预测，照 `power-load` 写进 `lib/forecast-scenarios.ts`。现有模式都不合适时，新写一个模式：`lib/<mode>-types.ts` 扩展 `ScenarioSpec`，`components/<mode>/` 写演示主体，在 `components/scenario/scenario-page.tsx` 里加分发。
2. 写配置：标题、行业、能力、一句话、案例介绍五段（没有的段不写）、数据契约（来源与许可、文件清单、字段表）。
3. 数据放 `public/samples/`；有离线评估就写 `data/eval/<slug>/metrics.json`，效果数字只从这里来。
4. `lib/scenarios.ts` 加一条（带 mode），建 `app/scenarios/<slug>/page.tsx` 渲染 `ScenarioPage`。
5. 接入了中台才需要：在中台「售前 Demo 库」登记场景 slug 与演示模式。
6. 示例场景用不上就删：`lib/scenarios.ts` 去掉条目，删掉 `app/scenarios/<slug>/`、对应的场景配置、`public/samples/` 与 `data/eval/` 里的文件。
7. `npm run build` 通过再交付。

## 规则

- **Key 不进浏览器**：前端只调本站 `/api/*`；`LIMIX_API_KEY` 只在 `.env.local` 或部署平台的环境变量里，不提交、不打印、不写进页面。
- **模拟模式要标明**：没配 Key（或 `LIMIX_MOCK=1`）时 `/api/forecast` 返回 `mode: "mock"`，页面必须显示「模拟结果」，不能把模拟结果说成 LimiX 的预测。
- **数据**：示例用公开数据或合成数据，数据页写明来源与许可；用客户数据前确认授权，客户数据不提交到仓库。
- **案例介绍不编**：五段里的事实和数字要有出处，「效果」只读离线评估的 metrics.json；没有的段不写，缺的内容列出来交给人补。
- **部署到公网必须有访问保护**：接入中台（`GTM_URL` + `DEMO_LINK_SECRET`）或设 `DEMO_BASIC_AUTH`，二选一，否则任何人都能用这个 Key 的额度。先配保护，再填 Key。
- **demo 站只放对客内容**：话术、红线、内部状态不进页面。
- **服务端读本地文件**：路径写成 `path.join(/*turbopackIgnore: true*/ process.cwd(), ...)`，并把目录加进 `next.config.ts` 的 `outputFileTracingIncludes`，否则线上读不到（或整个项目被打进函数）。
- 文案中文、结论先行；按 stable-ai-design 的规则：一页一个主按钮，颜色只用语义变量，不写十六进制。
