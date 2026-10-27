# lib/gtm/
> L2 | 父级: ../../AGENTS.md

接入 GTM 中台（limix-gtm）：知道操作人是谁，并把每次调用留痕到中台的飞书表。两边共用 `DEMO_LINK_SECRET`，算法与中台 `src/modules/demo-runs/link.ts` 一致，改一边要同步另一边。

- `token.ts`: 签名层，只用 Web Crypto（`proxy.ts` 也能用）。三种令牌按用途派生密钥、互不通用：`demo-launch`（中台签的进入令牌，5 分钟）、`demo-session`（本站会话 cookie，12 小时）、`demo-runs`（留痕请求签名，签「时间戳.请求体」）。`isGtmLinked()` 为假时整站退回 `DEMO_BASIC_AUTH`。
- `runs.ts`: 留痕上报 `reportRun`，契约与中台 `src/modules/demo-runs/types.ts` 一致。只在 `after()` 里调用；本实例已成功发过的文件只带指纹不带内容。失败只打日志。

数据流：中台 `/api/demos/launch` → 本站 `/api/session`（换会话）→ 页面调用 `/api/instant`（按会话里的 open_id 分上下文）→ `after()` → 中台 `/api/demo-runs` → 飞书「场景 / 文件 / 调用记录」三张表。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
