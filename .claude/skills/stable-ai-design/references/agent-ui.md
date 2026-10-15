<!-- 由 scripts/build.mjs 从 design-system/agent-ui/README.md 复制，不要手改。 -->

# Agent UI 设计规范

第一版草案（2026-09-23）。Agent 界面的组件**采用 Vercel AI Elements**，本规范不重做组件，只规定四件事：怎么接入、怎么接我们的主题、状态和文案怎么对齐、哪些交互规则必须遵守。依据见 [调研记录](research.md)。

- AI Elements 官网：https://elements.ai-sdk.dev
- 源码仓库：https://github.com/vercel/ai-elements
- 配套的 AI SDK（`useChat`、消息片段、工具状态）：https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- 工具调用组件说明：https://elements.ai-sdk.dev/components/tool
- 流式 Markdown 渲染 Streamdown：https://streamdown.ai

## 为什么选它

- 它是 shadcn/ui 的一个组件源（registry），组件源码拷进项目，颜色只读 `--primary`、`--muted` 这类语义变量。我们的主题装好后，它自动变成稳准智能的样子，不需要第二套色值。
- 命名与结构跟 shadcn 一致，符合本系统「组件按 shadcn/ui 的结构与命名」的约定。
- 组件与 AI SDK 的消息片段、工具调用状态一一对应，流式输出、推理、工具调用、人工审批都有现成的组件。
- Apache-2.0 许可，Vercel 持续维护。

没有选的：Ant Design X 依赖 antd 6，与 shadcn 路线不兼容；assistant-ui 组件更多但仍是 0.x 版本；CopilotKit 是整套框架，较重。三者的做法在调研记录里，可以作为补充参考。

## 适用范围

| 项目类型 | 做法 |
|---|---|
| React 19 + Tailwind v4 + shadcn | 按下文接入 AI Elements |
| 其他 React 项目 | 先升级到上面的组合，或参照 AI Elements 的组件划分用本库组件自行拼装 |
| 纯 HTML / artifact | 用本库组件（`window.StableAI`）与动效库拼装，结构与文案按本规范；不引入 AI Elements |

## 接入

1. 按 [快速开始](https://stable-ai-design.vercel.app/site/start.html) 接入主题：`npx shadcn@latest add https://stable-ai-design.vercel.app/r/theme.json`（或 `…/r/all.json` 一次装齐），主题自动合并进项目主样式表，不用手动 `@import`。
2. 用 shadcn CLI 按地址安装需要的 AI Elements 组件，例如对话的最小集合（`yes N |` 对每个「是否覆盖」都答「否」，保留本库同名组件；`npx ai-elements@latest add` 在非交互环境——CI、AI agent——遇到覆盖提问会直接退出且退出码为 0，看起来装好了其实只写了一个文件，不要用它）：

   ```bash
   E=https://elements.ai-sdk.dev/api/registry
   yes N | npx shadcn@latest add $E/conversation.json $E/message.json $E/prompt-input.json $E/reasoning.json $E/tool.json $E/confirmation.json $E/sources.json $E/inline-citation.json $E/suggestion.json $E/shimmer.json
   ```

3. AI Elements 依赖的 Tooltip、Select、DropdownMenu、Alert、Dialog、Card、Button 直接用本库的：v1.0.0 起本库基础组件就是 shadcn base-nova 原版（同名、同 API，只改了样式），不用再另装一份 shadcn 原版、也不用改 AI Elements 的引用。v1.0.0 之前装过本库的项目，先按 CHANGELOG 1.0.0 的说明升级（业务代码里这几个组件的写法要跟着改）。
4. 看项目的 shadcn 底层：`components.json` 的 `style` 是 `base-*`（如 `shadcn init` 现在默认的 `base-nova`）时底层是 Base UI，AI Elements 是按 Radix 写的，CLI 转换不完整。按下文「Base UI 项目」一节逐项改；`radix-*` 项目跳过。
5. 按下文「主题适配」改状态色、透明度底色、焦点环与英文文案。Message 的 Markdown 渲染（Streamdown）用到的类名要让 Tailwind 扫描到，在主样式表加一行 `@source "../node_modules/streamdown/dist/*.js";`（路径相对样式表）。
6. Markdown 输出用 Message 自带的 Streamdown，保留它默认开启的 `cjk`、`code`、`math`、`mermaid` 插件，不另换 Markdown 渲染库。

## 选用哪个组件

先做消息流与工具调用两块，其他按需补充。

| 场景 | AI Elements 组件 | 说明 |
|---|---|---|
| 对话容器 | Conversation | 自动滚到底部，带「回到最新」按钮 |
| 消息 | Message | 用户消息用 `secondary` 灰底，agent 消息无底色 |
| 输入区 | PromptInput | 附件、模型选择、发送与停止在同一处 |
| 开场建议 | Suggestion | 首屏给 3–4 条示例提示，说明 agent 能做什么 |
| 推理过程 | Reasoning、Chain of Thought | 默认折叠，生成中自动展开，结束后收起 |
| 工具调用 | Tool | 每次调用一张，标题是工具名，状态见下表 |
| 人工审批 | Confirmation | 与 Tool 配合，处理 `approval-requested` |
| 引用来源 | Sources、Inline Citation | 回答末尾列来源；正文中的数字、结论就近标引用 |
| 任务计划与队列 | Plan、Task、Queue | 多步任务先列计划，逐步勾选 |
| 回退点 | Checkpoint | 长任务可回到某一步重来 |
| 上下文用量 | Context | 显示 token 用量与成本 |
| 生成中占位 | Shimmer | 动效与本库动效库的「思考与工具调用中」场景一致 |

代码、语音、工作流画布三组组件暂不纳入规范，项目需要时直接使用，并在本页补充规则。

## 主题适配

AI Elements 大部分组件只用语义变量，但不止 `tool.tsx` 一处需要改（2026-10 案例验证）。先改 `tool.tsx`：状态图标写死了 Tailwind 色（`text-yellow-600`、`text-blue-600`、`text-green-600`、`text-orange-600`、`text-red-600`）。安装后按下表替换，状态色与本库 StatusDot 的 tone 保持一致，并把状态文字改成中文。

| AI SDK 状态 | 含义 | 中文文字 | 图标颜色类 | 对应 StatusDot tone |
|---|---|---|---|---|
| `input-streaming` | 参数生成中 | 准备中 | `text-muted-foreground` | neutral |
| `input-available` | 执行中 | 运行中 | `text-primary`（保留 `animate-pulse`） | active |
| `approval-requested` | 等待人工审批 | 待确认 | `text-primary` | active |
| `approval-responded` | 已审批，等待执行 | 已确认 | `text-muted-foreground` | neutral |
| `output-available` | 执行成功 | 已完成 | `text-[var(--success)]` | success |
| `output-error` | 执行失败 | 失败 | `text-destructive` | error |
| `output-denied` | 用户拒绝 | 已拒绝 | `text-muted-foreground` | neutral |
| `output-error`（用户点了停止） | 用户停止生成 | 已停止 | `text-muted-foreground` | neutral（对应 TaskStatus `cancelled`） |

AI SDK 没有「已取消」状态，用户停止时工具会落到 `output-error`。界面要区分：由用户停止造成的写「已停止」、用灰色，与 TaskStatus 的 `cancelled` 一致；真正执行失败才写「失败」、用 `destructive`。「已完成」与 StatusDot、TaskStatus 一样用绿色 `success`（只作图形，文字仍是前景色）。

`tool.tsx` 的参数区与结果区还用了带透明度的底色，本系统不用透明度调灰，一并替换：

| 位置 | 原写法 | 改为 |
|---|---|---|
| 参数区、结果区的底 | `bg-muted/50` | `bg-[var(--surface)]` |
| 失败结果 | `bg-destructive/10 text-destructive` | `border border-destructive text-destructive`（与本库 Alert 的 destructive 一致） |

其余要改的地方（2026-10 版）：

| 文件 | 原写法 | 改为 | 原因 |
|---|---|---|---|
| `sources.tsx` | 来源计数用 `text-primary text-xs` | `text-muted-foreground text-xs` | 品牌橙只给主操作与选中态 |
| `ui/input-group.tsx`（PromptInput 带进来） | 组上的 `has-disabled:…opacity-50` | 改成只看输入控件：`has-[[data-slot=input-group-control]:disabled]:…` | 空输入时发送按钮禁用，会把整个输入框变灰、降到 50% 透明 |
| `ui/input-group.tsx` | 焦点 `ring-3 ring-ring/50` | `ring-2 ring-ring` | 焦点环 2px 实色，不用透明度 |
| `code-block.tsx` | 标题栏 `bg-muted/80`；高亮主题 `github-light / github-dark`，深色只认 `.dark` 类 | 标题栏 `bg-[var(--surface)]`；只用 `data-theme` 切深色的项目，给代码块外层补 `.dark` 或改为读 `data-theme` | 透明度调灰；只设 `data-theme="orange-dark"` 时代码块不变暗 |
| `shimmer.tsx` | 渐变里的 `#0000` | 保留（透明色，不是品牌色） | — |

规则：

- 状态不只靠颜色区分，图标与文字必须同时出现。
- 除上面两张表外，不在 AI Elements 组件里写十六进制、Tailwind 原始色（`gray-*`、`red-*` 等）或透明度调色；需要调整只改主题变量。
- 英文文案全部改为中文。2026-09 版源码里的文案有：`Thinking...` → 正在分析，`Thought for N seconds` → 已分析 N 秒，`Used N sources` → 引用了 N 个来源，`Parameters` → 参数，`Result` → 结果，`Error` → 错误，`Submit` / `Stop` → 发送 / 停止，`Upload files` → 上传文件，`Previous branch` / `Next branch` → 上一版 / 下一版，Context 里的 `Input` / `Output` / `Reasoning` / `Cache` / `Total cost` → 输入 / 输出 / 推理 / 缓存 / 总费用。升级 AI Elements 后重新检查一遍。
- 深色主题（`orange-dark` / `blue-dark`）无需另外处理；AI Elements 读的是同一组变量。

## Base UI 项目

`components.json` 的 `style` 为 `base-*` 时，CLI 把 AI Elements 从 Radix 转成 Base UI 写法不完整，2026-10 版需要手改：

| 位置 | 现象 | 改法 |
|---|---|---|
| `inline-citation.tsx`、`prompt-input.tsx` 的悬停卡片 | `openDelay / closeDelay` 传给了根节点，不生效 | Base UI 的延迟写在 Trigger 上：`delay / closeDelay` |
| `prompt-input.tsx` 的菜单项 | 用 Radix 的 `onSelect` | 改为 `onClick` |
| `message.tsx`、`prompt-input.tsx` 的 `TooltipTrigger` | `<TooltipTrigger>{按钮}</TooltipTrigger>` 产生按钮套按钮 | 改为 `<TooltipTrigger render={按钮} />` |
| `plan.tsx` 的折叠 Trigger | 把函数型 `style` 透传给 Button，类型报错 | 不透传 `style`，其余属性留在 Trigger |
| `tool.tsx` 等的展开箭头与开合动画 | 用 `data-[state=open]`，Base UI 不输出该属性，箭头不转、动画不播 | 改用 Base UI 的 `data-panel-open`（箭头）；开合动画同理替换或去掉 |

## 交互规则

### 标识与语气

- 界面里 agent 的身份只用一个图标（Lucide `bot` 或 `sparkles` 二选一，同一产品内固定）和一个名称，不做拟人头像。
- 按钮文字不写「AI」：写「生成摘要」，不写「AI 生成摘要」。
- 描述 agent 的动作用「分析」「处理」「查询」，不用「理解」「思考」「感受」。
- 首屏说明 agent 能做什么、不能做什么，并提示「结果可能有误，请核对关键数据」，同一会话只提示一次。

### 过程可见

- 生成中的进度文字写具体的步骤，例如「正在读取 3 个数据集」，不写「处理中」。
- 每次工具调用都显示为一张 Tool 卡片；参数与结果默认折叠，失败时自动展开并显示错误原因。
- agent 当前状态用状态组件表达（上表），不能只写在回答文字里。
- 长任务显示计划（Plan）和当前进行到第几步。

### 控制权

- 生成中和工具执行中，输入区的发送按钮变为「停止」，随时可以停止。
- 写入、删除、下发到设备、调用付费接口等操作必须经过 Confirmation 审批。审批卡片写明：要做什么、作用于哪个对象、影响范围、能否撤销。只读查询不需要审批。
- 回答支持重新生成；agent 生成的内容进入业务数据（表单、配置、报告）前，用户可以编辑。

### 结果与出错

- 涉及数据、指标、模型结论的回答必须给出来源：数据集、模型名与版本、时间范围。
- 预测、评估类结果写明置信区间或评估指标，不用「肯定」「一定」这类措辞。
- 失败时说明原因和下一步（重试、换参数、联系管理员），不只显示「出错了」。
- 每条回答提供赞 / 踩；踩之后可以补一句说明。

### Agent 生成的界面

- agent 在对话里渲染的卡片、表格、图表只能用本库已登记的组件（`@stable-ai` registry、`window.StableAI` 工厂与 `index.d.ts` 里的类型），不执行 agent 生成的任意 HTML 或脚本。
- 对话中嵌入的卡片最多 2 个操作，卡片内部不滚动；内容多时改用侧栏（Sheet）或整页打开。

## 视觉禁区

- 不用蓝紫渐变、光雾、极光、粒子、流光描边来表示「AI」，智能感来自内容与状态反馈（与动效库原则第 7 条一致）。
- 不用表情符号。
- 品牌渐变 `gradient-brand` 只用于首页主入口，不用于对话界面。

## 已知缺口

- `InlineCitationCardTrigger` 用 `new URL()` 解析来源，来源是数据集名、模型版本这类非网址时会报错，需要在调用处兜底。
- 2026-10 用一个「数据分析 Agent」演示案例（合成数据、脚本化对话）跑通了接入与主要交互；尚未在真实的 LimiX 或稳准智能产品里验证，规则随项目落地修订。
- 本站还没有 Agent UI 的交互示例页；动效库已有「流式文字」与「思考与工具调用中」两个场景可参考。
