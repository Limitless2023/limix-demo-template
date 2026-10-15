---
name: stable-ai-design
description: 稳准智能（Stable AI）的设计规范。做稳准智能 / LimiX 的网页、落地页、产品界面、React + shadcn 组件、HTML artifact，以及公众号封面、活动海报、朋友圈数据图时使用（做 PPT 用 stable-ai-ppt）；用户提到「稳准智能品牌」「Stable AI 风格」「按我们的设计规范」时触发。提供 token、shadcn 变量映射、Logo 与排版规则。
metadata:
  version: "1.0.0"
---

# 稳准智能 Stable AI 设计规范

品牌：中文「稳准智能」，英文「Stable AI」（S、A、I 大写，中间一个空格），并列时中文在前。面向工业客户（电力、钢铁、化工），语气克制、工程化：短句、陈述事实、不用感叹号和表情符号，中英文之间加一个空格。

## 文件在哪里

本 Skill 常被单独拷贝使用，手边可能没有设计系统仓库。文中的仓库路径都有同名线上地址：把路径接在 `https://stable-ai-design.vercel.app/` 后面即可，例如 `dist/tokens.css` → https://stable-ai-design.vercel.app/dist/tokens.css 。规范站首页 https://stable-ai-design.vercel.app ，快速开始 https://stable-ai-design.vercel.app/site/start.html 。

- React + shadcn 项目一条命令装齐，不用拷文件：`npx shadcn@latest add https://stable-ai-design.vercel.app/r/all.json`（只要部分时换成条目地址，第一次把 `…/r/theme.json` 一起写上，如 `…/r/theme.json …/r/button.json`，否则圆角与默认颜色不会替换）。主题自动合并进项目主样式表（`src/index.css`、`app/globals.css` 等），不需要手动 `@import`。想用短名 `@stable-ai/button` 与 `list` / `search`，在 `components.json` 的 `registries` 里加 `"@stable-ai": "https://stable-ai-design.vercel.app/r/{name}.json"`。帮用户接入时按 https://stable-ai-design.vercel.app/install.md 执行。
- registry 条目：`theme`（四个主题的语义变量、骨架尺寸与动效实现，安装时写进项目主样式表）、组件（`components/ui/`）、页型 block（`components/blocks/`：`app-shell`、`list-page`、`detail-page`、`dataset-page`、`form-page`、`dashboard-page`、`monitor-page`、`equipment-page`、`alarms-page`、`evaluation-page`、`pipeline-page`、`page-states`）、`logo`（`lib/brand/*.ts`）、`skill`（本 Skill，写到项目的 `.claude/skills/stable-ai-design/`）、`all`（以上全部）。装任何组件都会自动带上主题与 `lib/utils.ts`。
- shadcn 4 的 `init` 会装 Geist 字体并写进 `@theme inline`；本系统不用 Geist，主题已把正文字体改回系统中文栈，项目里可删掉 `@fontsource-variable/geist` 的引入。registry 主题不含 `@property --sa-sweep`（shadcn 重装会重复追加）：自己用 `.sa-motion-sweep` 时，在组件里 `CSS.registerProperty` 注册一次（`monitor-page` 已内置）。
- 主题：根元素 `data-theme="orange-light"`（默认）/ `blue-light`（LimiX）/ `orange-dark` / `blue-dark`；shadcn 项目也可以用 `.dark` 类。
- 本 Skill 的 `references/` 里有全部 token 取值、shadcn 映射、动效场景表、Agent UI 规范、传播物料规则和 12 个页型的规则（`references/patterns/`），离线可查；`visual/` 是公众号封面、海报、方图的出图模板。

## 先做什么

1. React + shadcn + Tailwind v4 项目：`npx shadcn@latest add https://stable-ai-design.vercel.app/r/all.json`（或只装需要的条目），主题自动合并进项目主样式表，不要复制 `globals.css`、不要再调色。Tailwind v3：引入 `dist/tokens.css` 并在 `tailwind.config.js` 里 `presets: [require('./dist/tailwind.preset.js')]`。
2. 纯 HTML / artifact：内联 `dist/tokens.css`，颜色只写 `var(--primary)` 这类语义变量，不写十六进制；要现成组件时引入 `https://stable-ai-design.vercel.app/design-system/components/bundle.css` 与 `bundle.js`（`window.StableAI.<组件>(props)`）。
3. 需要具体值时查 `references/tokens.md`；需要 shadcn 变量对应关系时查 `references/mapping.md`。

## 色彩规则

- 界面控件里只有一个橙：`primary` #FE5D33。VI 的橘红 #E8401C 不单独做控件色；主按钮悬停用 `primary-hover`，不切到橘红。封面样本用 `gradient-brand`。
- 橙底上的按钮文字用 `primary-foreground`（white）。白在 #FE5D33 上 3.1:1、在 `primary-hover` 上 3.4:1，未达正文 4.5，按效果保留。橙色小字仍用 `primary-text`，只放在白底上。
- 不用橙色小字。链接用 `foreground` 文字 + `primary` 2px 下划线；确实需要橙色小字时用 `primary-text`，且只放在 `background` 上。
- 正文 `foreground`，说明与标注 `muted-foreground`，分隔线 `border`，焦点环 `ring` 2px 实线。任务完成用 `--success`（成功绿），只作 StatusDot / TaskStatus / 流程节点的状态图形，不作文字色，不用于指标好坏（仍靠文案）与设备运行态（用 `--status-*`）。侧栏与次级区域用 `sidebar` / `muted`（VI 版面的灰色区）。
- VI 四色（橘黄、金桔、金卡其）只作面色，不作文字，也不作悬停或选中底。`accent` = `orange-100`（主橙浅底），用于悬停行、选中行、选中菜单项、品牌提示条。金卡其只用于标识与印刷物，不进界面、图表类别色和渐变。
- 品牌渐变 `gradient-brand`（橘红 → 品牌橙 62% → 橘黄，90° 从左到右，不含金卡其）用于标识图形、印刷物、封面样本和首页主入口按钮。封面标题和首页主入口按钮文字用 white。封面小字标注仍用 ink。组件库主按钮、其余控件和文字仍用单色 `primary`。不用蓝紫渐变、彩色左边条卡片、表情符号做装饰。
- 灰底只从三档取：`surface` → `muted` → `border`，说明文字 `muted-foreground`。灰色跟随主色：橙色主题用中性灰 `gray`，蓝色主题用冷灰 `slate`，两条刻度逐档明度相同，只差冷暖。不用 `color-mix` 造灰，不直接写 `gray-*` / `slate-*` 原始值。深色：底用品牌黑 `ink` #0A0604，面 900、muted 800、描边 700。
- 灰阶只有两条：`gray`（中性，橙色主题）与 `slate`（冷灰，蓝色主题），不要另造灰色；消费语义 token 时会自动跟随主题。

## 告警、设备运行态与数据质量

工业监控界面另有三组专用语义色，按主题取值（浅色与品牌黑各一套），直接用变量，不写色值：

- 告警 `--alarm-p1…p4`（及 `-foreground`）：P1 紧急红、P2 高琥珀黄、P3 中紫、P4 低中性（= 前景色）。P2 不用橙，避免与品牌橙撞色。告警色只画告警标记、告警横幅与越限描边；不用于按钮、装饰、图表系列或 `destructive`。
- P2 琥珀黄深浅共用；浅色主题亮黄在白底上不可辨，画 P2 图形、横幅和越限边框时描边用 `--alarm-p2-edge`（浅色 = 品牌黑，深色 = 黄本身），不要把黄色压暗。
- 告警优先级永远三重编码：颜色 + 形状 + 编号（P1 菱形、P2 三角形、P3 方形、P4 空心圆，图形里写数字），用组件 AlarmMark；不能只靠颜色。
- 只有「未确认且激活」的告警闪烁（`.sa-motion-blink`，约 1Hz、只动透明度），确认后常亮；只闪标记，不闪整行、整卡或整屏；减少动态效果时常亮加粗描边。告警状态按 ISA-18.2 用 AlarmState：未确认、已确认、已恢复未确认、闭锁、搁置、设计抑制、停用。顶栏用 AlarmBanner。
- 设备运行态 `--status-running / idle / stopped / fault / maintenance / offline`：按 ISA-101 靠明暗与形状区分（运行实心圆、待机粗环、计划停机实心方、维护空心方、离线虚线圆），只有故障（红色叉形，不用 P1 告警的菱形）取告警红；运行与停止不用红绿。用 EquipmentStatus。
- 测点数据质量 `--quality-bad / stale / manual`：坏值（删除线 + 斜线底 +「坏值」）、陈旧（压暗 + 时钟 + 已过时长）、手动替代（虚线标签「手动」），用 ProcessValue。
- **LimiX 预警（Alert）≠ 报警（Alarm）**：健康度下降、剩余寿命不足、推荐调参、超规风险等 AI 预测用描边 + `activity` 图标 + 文案（Alert、HealthScore、RulEstimate、SetpointCard、SpecGauge），不闪烁、不用 `alarm-*`、不进告警横幅、不要求确认。
- 测点与指标数值用前景色 `mono`，不随好坏改红绿，也不用品牌橙。推荐设定值「采纳」即下发，先弹确认写明位号、从多少改到多少。

## 字体与排版

- 字体用系统中文无衬线栈（PingFang SC / Noto Sans SC / Microsoft YaHei）；不要引入 Inter、Geist 等通用字体。代码与指标数值用 `mono`。
- 首屏 `display-xl` 56/64、`display-lg` 40/48；章节 `heading-md` 24/32、`heading-sm` 18/26；正文 `body` 14/22；表格与标注 `body-sm` 13/20；标签 `label` 12/16 字距 0.04em。
- 中文标题不加字距；字标「Stable AI」的宽字距只属于字标。

## 间距、圆角、布局

- 4px 基准：控件内边距 `space-2`–`space-4`，卡片 `space-4`–`space-6`，区块 `space-6`–`space-8`，页面段落 `space-12`–`space-16`。
- 圆角：按钮、卡片 8px（`--radius`）；输入框、标签 4px；胶囊 999px；品牌色块与版面分区直角。
- 版面沿用 VI 三段式：窄灰色侧栏、白色内容区、大面积品牌色块。骨架默认值：侧栏 `--layout-sidebar-width` 222px（收起 56px）、顶栏 48px、内容区最宽 1360px、长文 720px。断点 `sm/md/lg/xl` = 600 / 820 / 1100 / 1600px，移动优先。
- 控件尺寸三档（`--control-height-*`）：默认 32px / 14px（页头操作、筛选区、表单、对话框），`sm` 28px / 13px（工具栏、批量操作条），`lg` 36px / 15px（只用于首屏与空状态主入口，不用于表单）。按钮、输入框、下拉、数字输入与分段控件共用，并排时同高；不要写死高度。表格行内操作用文字按钮（`ghost` + `sm`，表格里自动收成 `primary-text` 色文字），不用描边按钮撑高行。
- 搭整页先看 `references/patterns/<页型>.md`（shell / list / detail / dataset / form / dashboard / monitor / equipment / alarms / evaluation / pipeline / states，原文在 `design-system/patterns/<页型>/README.md`）：骨架尺寸、分区、状态与响应式都定了，不要另起布局。React + shadcn 项目直接装对应的 block（如 `npx shadcn@latest add https://stable-ai-design.vercel.app/r/list-page.json`），页面放在 `AppShell` 的内容区里，第一块用 `PageHeader`；监控大屏 `monitor-page` 是全屏页，不放进 AppShell。
- 层级用 `--z-*`（base 0 → raised 10 → sticky 20 → dropdown 30 → overlay 40 → modal 50 → toast 60），不写魔法数字。

## 阴影与动效

- 卡片与区块靠描边分层，不用阴影。阴影只给悬浮层：下拉、提示用 `--shadow-sm`，对话框、抽屉用 `--shadow-md`；模态遮罩用 `--scrim`（品牌黑 50%）。画布上的流程节点（FlowNode）例外，用 `--shadow-node`；画布底用 `--canvas`、点阵用 `--canvas-dot`。
- 光影质感（可选的高级档，v0.39.0）：官网与介绍页、门户首页、功能卡、引导与空状态、汇报演示页、传播物料可以用；表格表单等数据密集界面、监控类页型与深色主题不用。一页一档：要么光影、要么平面描边，不与渐变底、光圈、发光、玻璃叠用。光源在左上、投影落右下：卡片 `--shadow-lit-1` 并去掉描边，可点击卡片悬停 `--shadow-lit-2` 上移 2px，选中 / 按下 `--shadow-lit-pressed`，展示图标底板 `--shadow-lit-plate`（凸起的台面，不做内凹），图形与插图物体 `--shadow-lit-drop`；投影色 `--lit-shadow` 随主题切换（深色为 transparent）。站点版用 `.sa-lit` / `.sa-lit-hover` / `.sa-lit-plate` / `.sa-lit-pressed` / `.sa-lit-drop`，React 用 `shadow-[var(--shadow-lit-1)]`。图表只给主系列（曲线、柱、仪表弧）加落影；操作与导航小图标不加。
- 动效只说明状态变化：悬停反馈 `--duration-fast` 120ms，展开切换 `--duration-base` 200ms，对话框抽屉 `--duration-slow` 320ms；缓动默认 `--ease-standard`，进入 `--ease-enter`，退出 `--ease-exit`。尊重 `prefers-reduced-motion`。常用场景（弹出框、对话框、抽屉、通知、折叠、加载、流式输出等）的时长、缓动与接入方式查 `references/motion.md`；实现用 `design-system/motion/motion.css` 的 `data-motion` + `data-state` 与 `.sa-motion-*` 类，不自行写关键帧；registry 的 `theme` 条目安装时已把这份实现写进项目主样式表，React 组件关闭时用 `@/hooks/use-presence` 的 `usePresence(open)` 先播退出动画再卸载。
- 日常与 AI 界面不用光雾、极光、网格渐变、粒子、流光描边、毛玻璃光晕做装饰，也不另加多色强调色；智能感来自内容与状态反馈。品牌黑监控大屏（页型 `monitor`）可以用四种效果，各对应状态或数据、同屏一处：运行中描边 `.sa-motion-sweep`（正在运行的一个对象）、数据流向 `StableAI.motion.flow(path, { rate })`（真实流量）、强调光晕 `.sa-glow` / `--glow`（最重要的一个数）、玻璃面板 `.sa-glass` / `--surface-glass`（只在图像底上）。浅色主题下 `--glow`、`--surface-glass` 自动失效。需要外部动效库时：React 用 Motion 并映射到现有 `data-motion` 语义，交互插图用 Rive，一次性反馈用 Lottie（播完停住）；不用 Aceternity UI、Magic UI 等特效库。详见 `references/motion.md`。

## 图表

- 类别色按顺序用 `chart-1…5`（主色、品牌黑、gray-700、gray-400、gray-600），最多 5 个系列。只有主系列带色相并随主题切换，其余中性灰两个主题共用。不用金卡其，也不用主色深阶做类别色。gray-400 只作面积与柱，线图加粗并配标签。基线与阈值用 `chart-baseline` 灰色虚线，网格 `chart-grid`，刻度文字 `chart-axis`。
- 数值分档与热力图用顺序色阶 `chart-seq-1…5`（浅 → 深）。不引入第二套图表配色，不用彩虹色。
- 渲染分两类：要读具体数值、缩放长时序或多系列对照的**完整图表**用 ECharts，统一经过组件 Chart（`StableAI.Chart` / registry `echart` 的 `EChart`），主题取自 token、随主题重绘，悬停提示框用 popover 弹层样式；缩放用 `Chart.zoom()`（Ctrl / ⌘ + 滚轮或双指捏合缩放、拖动平移，普通滚轮留给页面）。只表达方向的**微图表**（Sparkline、IntervalBand、QualityBar）、数值已逐行标出的**表格式图**（ContributionWaterfall、ConfusionMatrix）、需要键盘逐个选中的**关系图**（CausalGraph）继续用 SVG / HTML。ECharts 为本地按需包 `design-system/vendor/echarts/`，不走外部 CDN。
- 画布不解析 CSS 变量：ECharts option 里的颜色与字体从 `option(t)` 的 token 对象取，不写 `var(--…)`、不写十六进制。纵轴固定范围时 `min` / `max` 取刻度间隔的整数倍。`ariaLabel` 必填，关键读数还要在标题、图例或表格里以文字出现。
- 监控与大屏页面（监控大屏、设备监控、告警中心）里本方预测线不用品牌橙：LimiX 预测用 `t.foreground` 虚线（2px），实测用 `chart-2` 实线（1.5px），FanChart 用 `tone: 'neutral'`；橙色在监控画面里会被读成告警。日常分析页（总览、评估、详情）保持 `chart-1`。图上的告警点用 `t['alarm-p1']`…`t['alarm-p4']` 配对应形状。

## Logo

- React 项目装 `https://stable-ai-design.vercel.app/r/logo.json`，从 `@/lib/brand/<文件名>` 导入（原图的 data URI，如 `import logoMark from "@/lib/brand/logo-mark-hd"`），不要另存或压缩；24px 左右的小尺寸用 `logo-mark-sm`（约 12KB，高清图约 265KB 会进首屏包）。
- 只用 `design-system/assets/Logos/` 里的文件：横版组合 `logo-lockup-horizontal-hd.png`（页眉优先，透明底，从设计师矢量源文件导出）、图形 `logo-mark-hd.png`、字标 `logo-wordmark-hd.png`、竖版组合 `logo-lockup-vertical.png`；设计与印刷用源文件 `source/logo-lockup-horizontal.ai`。不要重绘、近似、单色化、重着色、拉伸或旋转。`candidates/` 里的反白稿待品牌确认，不得使用。
- 只放在白或浅灰底上，不放在橙色块上。四周留白不小于图形高度的 1/4。

## 组件

组件按 shadcn/ui 的结构、命名与状态；已有规范的 65 个：Button、Input、Field、Select、Combobox、Checkbox、RadioGroup、Switch、Slider、ToggleGroup、NumberInput、FileDropzone、TimeRangePicker、Card、Badge、StatusDot、Stat、Sparkline、DescriptionList、Tabs、Table、Pagination、Breadcrumb、Steps、Empty、Dialog、Sheet、Popover、DropdownMenu、Tooltip、Alert、Toast、Skeleton、Progress、Chart（ECharts 底座），以及 LimiX 专属的 VersionChip、ColumnTypeBadge、ColumnProfile、QualityBar、IssueItem、DataGrid、ColumnRolePicker、TaskStatus、EventList、IntervalBand、FanChart、ConfusionMatrix、MetricDiffTable、ContributionWaterfall、CausalGraph、PerturbationRow，以及工业件 AlarmMark、AlarmState、AlarmBanner、EquipmentStatus、ProcessValue、AnalogBar、AssetTree、HealthScore、RulEstimate、SetpointCard、SpecGauge，以及画布与流程 Canvas、FlowNode、FlowEdge（`design-system/components/<名>/README.md`）。选项较多、需要搜索时用 Combobox，选项不多时用 Select。不自带标签的控件（Select、Textarea、Combobox、ToggleGroup、原生输入框）一律包在 Field 里：标签、必填星号（`required`）、说明与错误（同一位置切换）和 aria 关联由它处理，不要手写标签和帮助文字。React 版的基础组件（Button、Input、Field、Select、NativeSelect、Combobox、Checkbox、RadioGroup、Switch、Slider、ToggleGroup、Card、Badge、Tabs、Table、Pagination、Breadcrumb、Empty、Dialog、AlertDialog、Sheet、Popover、DropdownMenu、Tooltip、Alert、Skeleton、Progress）就是 shadcn base-nova 原版（Base UI 底座），名字、导出与 props 和 ui.shadcn.com 的 Base UI 版一致，写法照官方文档（复合组件、`render` 而不是 `asChild`），本库只改了样式，每个文件开头写明改了什么；上面各组件 README 的规则照样适用。本库加的只有几处：Button 用 `render={<a href="…" />} nativeButton={false}` 当链接；Badge 多 `accent`、`delta`；Alert 多 `brand`；FieldLabel 多 `required`；ToggleGroup 的分段控件写 `variant="segmented"`（单选：`value={[v]}`、`onValueChange={(next) => next[0] && setV(next[0])}`）；系统原生下拉用 `NativeSelect`；「取消 + 主操作」的确认框用 `ConfirmDialog`（`title`、`description`、`onConfirm`、`destructive`）；ECharts 图表是 `EChart`（`@/components/ui/echart`）。项目的 `components.json` 用 `base-*` 风格（`shadcn init` 默认的 base-nova）。React 项目安装见上文「文件在哪里」：`npx shadcn@latest add https://stable-ai-design.vercel.app/r/<组件名>.json`（kebab-case，如 `dropdown-menu`），主题随安装写进项目主样式表。未定义的组件沿用同一映射即可。图标统一用 Lucide 1.21.0，线性、`currentColor` 继承色，按钮跟随文字色，其余使用 `icon-default/muted/active/hover`；操作 14px、导航和资源箭头 16px、展示 20px。通过 `--icon-size-sm/md/lg` 与 `--icon-stroke-width`（默认 1.5）消费 `primitive.icon`，项目可覆盖，保持点击区域不随图形缩小。静态 SVG 在 `design-system/assets/Icons/lucide/`，React 使用 lucide-react 同名组件。不要混入 Unicode 图标或 emoji。装饰 SVG 使用 aria-hidden，纯图标按钮设置中文 aria-label。

## Agent UI

对话、工具调用、审批这类 Agent 界面，React + shadcn 项目采用 Vercel AI Elements（https://elements.ai-sdk.dev ），不另做组件。先接入本系统主题，再用 `yes N | npx shadcn@latest add https://elements.ai-sdk.dev/api/registry/<组件>.json …` 安装 AI Elements（对覆盖提问一律答否，保留本库同名组件；不要用 `npx ai-elements add`，它在非交互环境遇到提问会静默退出）。AI Elements 依赖的 Tooltip、Select、DropdownMenu、Alert、Dialog 直接用本库的（v1.0.0 起本库基础组件与 shadcn base-nova 同名同 API），不用另装 shadcn 原版。`components.json` 的 style 是 `base-*`（Base UI）时，按 references 里「Base UI 项目」一节修 AI Elements 的转换遗漏。AI Elements 用到 Button 的 `size="icon-sm"`（v0.19.0 起）与 Card 的 `CardAction`（v0.37.0 起）。`tool.tsx` 的状态图标写死了 Tailwind 色，改为：准备中 / 已确认 / 已拒绝 `text-muted-foreground`，运行中 / 待确认 `text-primary`，已完成 `text-[var(--success)]`（与 StatusDot、TaskStatus 一致），失败 `text-destructive`，用户点停止造成的失败写「已停止」用 `text-muted-foreground`；`bg-muted/50` 改 `bg-[var(--surface)]`，`bg-destructive/10` 改 `border border-destructive`；`sources.tsx` 的橙字、`input-group.tsx` 的禁用变灰与半透明焦点环、`code-block.tsx` 的透明底与深色切换也要改（见 references「主题适配」）；英文文案改中文（Thinking → 正在分析）。规则要点：进度写具体步骤，状态用组件表达；随时可停止；写入、删除、下发类操作先经 Confirmation 审批并写明对象与影响；数据与模型结论给来源；对话里渲染的卡片只用本库已登记的组件；按钮文字不写「AI」，不用「思考」「理解」，不用蓝紫渐变或光效表示 AI。纯 HTML / artifact 用本库组件按同样规则拼装。完整规则见 `references/agent-ui.md`。

## 传播物料

公众号封面、1:1 小图、活动海报、数据方图用 `visual/` 的模板出图，不自己另写版式：写 spec.json，运行 `node visual/render.mjs spec.json --out 目录 --png`，出 SVG 与 2 倍 PNG（PNG 需本机 Chrome）；有提醒时退出码为 2，改完再交付。模板、字段、渠道尺寸与完整规则见 `references/visual.md`，在线编辑器在 https://stable-ai-design.vercel.app/site/visual.html 。规则要点：白字只放在 `gradient-brand` 左侧 60% 以内、至少 40px 且字重 600，渐变上的其余文字用 ink；Logo 只放白底，渐变底上加白色圆角托板；点阵只铺在渐变右侧，是品牌辅助图形到位前的临时做法；「图形底」把 Logo 双环图形（`logo-mark-xl.png`）放大出血，只放白底、不改色不旋转、不压字，此时 Logo 改用独立字标；数值写来源，示例数据要标明。onboarding 页与公告弹窗属于产品界面，按组件与页型规则做。印刷物不在范围内。

## 对比度

正文 ≥ 4.5:1，24px+ 大字与控件描边 ≥ 3:1。全部 token 组合的实测值在 `dist/contrast.md`；新增配色先跑 `node scripts/contrast.mjs`。

## 主题

四个主题均已启用：`orange-light`（默认，公司产品）、`blue-light`（LimiX 模型产品，主色 `#2C5198`，蓝底文字用白）、`orange-dark` 与 `blue-dark`（深色，只用于大屏、监控看板与夜间场景，日常界面默认浅色）。在根元素设 `data-theme="…"` 切换；shadcn 项目也可加 `.dark` 类（`.dark` 配 `data-theme="blue-light"` 得到 blue-dark）。深色下页面底为品牌黑 `ink`、面层与侧栏 `gray-900`、muted `gray-800`、文字 `gray-50`，主色不变、橙底仍用白字，品牌色小字与焦点环改用浅阶（`primary-text` / `ring` 已按主题映射，直接用变量即可）；蓝色深色主色为 `blue-400`。destructive 在深色下是亮红 `red-400`，其上文字用 `destructive-foreground`（gray-900），不要写白字。深色下 Logo 放在浅色圆角面板（`--color-white`，`--radius-md`）上，反白版待品牌方提供。不要自行发明第五套配色。
