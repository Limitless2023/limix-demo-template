# LimiX 场景 demo 底座

售前同事做客户场景 demo 的起点：Next.js 16 + 稳准智能设计系统（stable-ai-design，LimiX 蓝主题）+ LimiX API 服务端代理。

每个场景一页，三个标签页：案例介绍、数据、在线预测。在线预测有两种演示模式，各带一个示例场景：

- **即时预估**（来一条判一条）：混凝土强度即时预估，UCI 公开数据。历史表当上下文传一次，新配比几秒出强度与区间，实测值加入上下文立刻生效。
- **时序预测**（按时间往后预测）：电力负荷预测，合成数据。用一周逐小时负荷预测未来 24–72 小时与 P10–P90 区间。

## 用 Agent 开始一个新 demo

把下面这段话发给你的 Agent（Claude Code、Codex 等），把最后一行【】里换成你的场景：

```text
请用 LimiX 场景 demo 底座帮我做一个客户 demo。

1. 取模板：git clone --depth 1 https://github.com/Limitless2023/limix-demo-template.git <demo 目录名>，进入目录后删掉 .git 再 git init。这是我自己的 demo，不推回模板仓库。
2. 读规范：先完整读 AGENTS.md；做界面前读 .claude/skills/stable-ai-design/SKILL.md。
3. 跑起来：npm install；cp .env.example .env.local；npm run dev，打开 http://localhost:3000，确认两个示例场景（混凝土强度即时预估、电力负荷预测）的三个标签页都能打开、在线预测能跑通。LIMIX_API_KEY 先留空，走模拟模式，页面会标「模拟结果」；如果本机 ~/.limix/config.json 里有 Key，可以填进 .env.local，不要打印出来。
4. 做我的场景：按 AGENTS.md「新增一个场景」，先判断用哪种演示模式（来一条判一条用即时预估，照 concrete-strength；按时间往后预测用时序预测，照 power-load），再写场景配置、数据和案例介绍。做完删掉用不上的示例场景。
5. 交付：npm run build 通过后，告诉我新场景的地址、用了哪种演示模式和哪些 LimiX 接口、页面上哪些地方是模拟结果、案例介绍里哪些内容要我补。

规则：Key 只放 .env.local，不进浏览器、不提交；案例介绍不编事实和数字，缺的留给我补；客户数据不进仓库；部署到公网必须设 DEMO_BASIC_AUTH。

我的场景：【行业 / 要预测什么 / 数据在哪】
```

这段话也放在 LimiX GTM 中台的「Demo Template」页，改一边要同步另一边。

## 本地运行

```bash
npm install
cp .env.example .env.local   # 填 LIMIX_API_KEY；不填则走模拟模式
npm run dev                  # http://localhost:3000
```

没有 Key 也能完整演示：页面会标明「模拟结果」。填入 Key 并重启后，同一页面直接调用 LimiX。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `LIMIX_BASE_URL` | LimiX API 地址，默认 `https://limix-api.stable-ai.cn` |
| `LIMIX_API_KEY` | 平台管理员签发的 Key；只在服务端使用 |
| `LIMIX_MODEL_TYPE` | `LIMIX_2M` / `LIMIX_7M` / `LIMIX_16M`（默认）/ `LIMIX_64M` |
| `LIMIX_MOCK` | 设为 `1` 时强制模拟（离线排练） |
| `DEMO_BASIC_AUTH` | `用户名:密码`，部署到公网时必须设置 |
| `GTM_URL`、`DEMO_LINK_SECRET` | 可选：接入 GTM 中台时才配，配上后 `DEMO_BASIC_AUTH` 不再生效 |

## 新增场景

见 `AGENTS.md`「新增一个场景」。已经在仓库里时，直接对 Agent 说「照 concrete-strength 新建一个 xx 即时预估场景」或「照 power-load 新建一个 xx 时序预测场景」，它会按 AGENTS.md 和 stable-ai-design 规范来做。

## 和 demo 站的关系

本模板等于 LimiX 场景 demo 站（`limix-scenario-demos`）去掉具体客户场景。通用代码以 demo 站为准，demo 站改了再同步过来。
