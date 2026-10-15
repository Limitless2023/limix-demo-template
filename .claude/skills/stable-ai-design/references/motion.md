<!-- 稳准智能 Stable AI design tokens v1.0.0 — 由 scripts/build.mjs 从 design-system/tokens.json 生成，不要手改。 -->

# 动效场景表 · v1.0.0

唯一源为 design-system/motion/motion.json；实现为 design-system/motion/motion.css（bundle.css 已引入），规则见 design-system/motion/README.md，站点动效库为 site/motion.html。时长与缓动只用 primitive.motion：duration-fast 120ms、duration-base 200ms、duration-slow 320ms、ease-standard cubic-bezier(0.2, 0, 0, 1)、ease-enter cubic-bezier(0, 0, 0.2, 1)、ease-exit cubic-bezier(0.4, 0, 1, 1)。

## 原则

- 只动 transform 与 opacity，不动 width / height / top（侧栏收起是已实现的例外，且只在桌面端）。
- 进入用减速曲线 ease-enter，退出用加速曲线 ease-exit，退出时长比进入短一档。
- 同一时刻只有一个强调动效；列表进入不做逐项延迟。
- 不做弹跳、过冲、视差与装饰性循环动画；循环只用于加载与等待状态，以及未确认告警的闪烁（约 1Hz，确认即停）。
- prefers-reduced-motion 开启时，所有过渡与动画退化为瞬时切换，循环动画停止。
- 焦点环瞬时出现，不做过渡。
- AI 与日常产品界面不用光雾、极光（aurora）、网格渐变（mesh）、粒子场、流光描边、多层毛玻璃光晕做装饰，也不另加多色强调色抢主色；「智能感」来自内容与状态反馈。品牌黑监控大屏可用「运行中描边」「数据流向」、强调光晕 --glow 与玻璃面板 --surface-glass，条件见 UI 页面「监控大屏」：对应状态或数据、同屏一处、减少动态效果时静态。

## 外部动效库

组件库与规范站只用 CSS（motion.css）。下列外部库只在确有需要的产品里按场景引入，时长与缓动仍取 --duration-* / --ease-*，颜色取主题变量。

| 库 | 用在哪里 | 规则 |
| --- | --- | --- |
| Motion（React，原 Framer Motion） | React 产品里的进入、退出与布局过渡。 | 映射到现有 data-motion 语义（fade / pop / dialog / drawer / toast / scrim），不另设弹簧参数；reduced-motion 时用 useReducedMotion 退化为瞬时。 |
| Rive（@rive-app/canvas） | 需要状态机的交互图标、空状态插图。 | 颜色绑定 primary / ink，不自带配色；reduced-motion 时停在静帧。 |
| Lottie / dotLottie | 一次性的品牌或成功反馈。 | 播放一次后停在末帧，不做装饰性循环；reduced-motion 时直接显示末帧。 |
| 不采用：Aceternity UI、Magic UI 等特效组件库 | — | 其 aurora、spotlight、infinite beam、粒子场等效果与上面第 7 条原则冲突。 |

## 场景

| 场景 | 用在哪里 | 进入 | 退出 | 缓动 | 动什么 | 接入方式 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 悬停与按下 | 按钮、链接、表格行、菜单项 | duration-fast | duration-fast | ease-standard | background-color、border-color、color | 组件自带；自定义元素加 .sa-motion-hover | 焦点环不过渡。 |
| 开关与勾选 | Switch、Checkbox、Radio | duration-fast | duration-fast | ease-standard | transform（滑块位移）、opacity（对勾） | 组件自带 |  |
| 页签指示条 | Tabs line 变体 | duration-base | duration-base | ease-standard | transform（translateX + scaleX） | .sa-motion-indicator 作用于指示条元素 | 内容区不动画，直接切换（Tabs 内容区用 fade 淡入）。 |
| 折叠与展开 | Accordion、Details、菜单分组、Agent 工具调用结果 | duration-base | duration-base | ease-enter / ease-exit | grid-template-rows 0fr → 1fr、opacity | .sa-collapse + data-state | 用 grid 行高过渡替代 height，内容自适应。 |
| 下拉、提示与弹出框 | DropdownMenu、Tooltip、Combobox 列表 | duration-base | duration-fast | ease-enter / ease-exit | opacity、transform（scale 0.96 → 1，原点朝触发方向） | data-motion="pop" + data-state；组件已接入 | 用 --sa-origin 指定变换原点，默认 top center。 |
| 对话框 | Dialog、确认框 | duration-slow | duration-base | ease-enter / ease-exit | 面板 opacity + scale 0.98 → 1；遮罩 opacity | 面板 data-motion="dialog"，遮罩 data-motion="scrim"；Dialog 已接入 | 遮罩与面板同时开始。 |
| 抽屉 | 侧边抽屉、详情面板 | duration-slow | duration-base | ease-enter / ease-exit | transform（translateX 100% → 0）；遮罩 opacity | data-motion="drawer"，用 --sa-drawer-from 指定方向 | 组件库尚无 Drawer，先用样式类。 |
| 通知 | Toast | duration-base | duration-fast | ease-enter / ease-exit | transform（translateY 8px → 0）+ opacity | data-motion="toast" + data-state；Toast 已接入，dismiss() 播放退出后移除 | 多条堆叠时其余条目位移用 duration-base。 |
| 视图切换 | 页面级切换、Tabs 内容、步骤切换 | duration-base | — | ease-enter | 新视图 opacity 0 → 1 | data-motion="fade" + data-state；Tabs 内容区已接入 | 不做双向滑动；旧视图直接消失。 |
| 加载占位 | Skeleton | 1.6s 循环 | — | linear | background-position 扫光 | .sa-motion-shimmer | 低对比度，内容到达后直接替换。 |
| 不确定进度 | Progress 无明确进度时 | 1.2s 循环 | — | ease-in-out | transform（一段往返） | .sa-motion-indeterminate 作用于 fill |  |
| 流式文字 | Agent 回答、日志 | 无过渡 | — | — | 逐段追加；光标 1s 闪烁 | .sa-motion-cursor 作用于正在输出的段落 | 不逐字动画，避免抖动与读屏器重复播报。 |
| 思考与工具调用中 | Agent 等待态、按钮加载态 | 1.2s 循环 | — | ease-in-out | opacity 呼吸；三点错峰 | .sa-motion-pulse、.sa-motion-dots | 结束后结果区用折叠展开进入。 |
| 运行中描边 | 监控大屏里正在运行的对象：模型推理、训练、数据采集；同屏只标一处 | 2.4s 循环 | 运行结束即移除 | linear | conic 渐变角度（@property）旋转，遮罩只露出 1px 描边 | .sa-motion-sweep 加在卡片上，运行结束移除 | 只在品牌黑监控大屏用；减少动态效果时变为静态主色描边。 |
| 数据流向 | 产线拓扑、数据管道等连线图上的物料 / 数据流 | 按流量循环 | — | linear | 点沿 SVG 路径位移；点数与速度由流量决定（rate 0–1 → 6s 到 2s 一圈） | StableAI.motion.flow(path, { rate })，返回停止函数 | 属于数据可视化，数值驱动，不做装饰；减少动态效果时不生成流向点，由路径箭头表达方向。点默认主色（画布运行中连线）；监控类页面在容器上设 --sa-flow-dot: var(--foreground)，物料流不用品牌橙。 |
| 未确认告警闪烁 | AlarmMark / AlarmState 的「未确认激活」、AlarmBanner 里最新的未确认告警；确认后立即停止 | 1s 循环（约 1Hz） | 确认即移除 | steps：亮 0.5s、暗 0.5s | 只动 opacity（1 → 0.25） | .sa-motion-blink 加在告警标记上；组件的 blink 或 state: 'unack-active' 自动添加 | 每秒 1 次，远低于每秒 3 次的光敏安全上限；只闪标记，不闪整行、整卡或整屏。减少动态效果时不闪，改为常亮并加粗描边。LimiX 预警、健康度、剩余寿命等 AI 输出永不闪烁。 |

进入 / 退出型动效通过 data-motion + data-state="open|closed" 触发；关闭时先设 closed，等 animationend 再设置 hidden。
