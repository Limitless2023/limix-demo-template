# LimiX 场景 demo 底座

售前同事做场景化 demo 的基准仓库：Next.js 16 + 稳准智能设计系统（stable-ai-design，LimiX 蓝主题）+ LimiX API 服务端代理。自带一个完整场景「电力负荷预测」。

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

## 新增场景

见 `AGENTS.md`「新增一个场景」。用 Claude Code / Codex 时直接说「照 power-load 新建一个 xx 场景」，agent 会按 AGENTS.md 和 stable-ai-design 规范来做。
