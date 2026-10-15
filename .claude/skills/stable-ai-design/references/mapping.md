<!-- 稳准智能 Stable AI design tokens v1.0.0 — 由 scripts/build.mjs 从 design-system/tokens.json 生成，不要手改。 -->

# shadcn/ui 变量映射 · v1.0.0

Tailwind v4 使用 dist/globals.css；Tailwind v3 使用 dist/tailwind.preset.js 和 dist/tokens.css。

| shadcn 变量 | 本系统 token | 值（默认主题） | 说明 |
| --- | --- | --- | --- |
| `--background` | color.white | `#ffffff` | 页面底。 |
| `--foreground` | color.ink | `#0a0604` | 默认文字。 |
| `--card` | color.white | `#ffffff` | Card 底。 |
| `--card-foreground` | color.ink | `#0a0604` | Card 内文字。 |
| `--popover` | color.white | `#ffffff` | 弹层底（Dropdown、Tooltip、Dialog）。 |
| `--popover-foreground` | color.ink | `#0a0604` | 弹层内文字。 |
| `--primary` | color.orange.500 | `#fe5d33` | 主按钮、选中态、进度。封面大面积用 gradient-brand，不用把 primary 铺成单色底。 |
| `--primary-foreground` | color.white | `#ffffff` | primary 上的文字、图标、勾选标记。橙色与蓝色主题都用 white。白在 #FE5D33 上 3.1:1、在 primary-hover 上 3.4:1，未达正文 4.5，按效果保留。 |
| `--primary-hover` | color.orange.600 | `#f0572f` | primary 的悬停/按下态，同色相略深；不用 shadcn 默认的 primary/90 透明度写法（橙色上会发灰）。 |
| `--primary-text` | color.orange.700 | `#ba4a17` | 品牌色小字与链接悬停色。只放在 background 上；正文链接优先用 foreground + primary 下划线。 |
| `--secondary` | color.gray.100 | `#f3f3f3` | 次级按钮、Tabs 底。 |
| `--secondary-foreground` | color.ink | `#0a0604` | secondary 上的文字。 |
| `--muted` | color.gray.100 | `#f3f3f3` | 弱化底：表格行悬停、分段控件与页签的底槽、骨架屏、禁用输入框；在白底上比 surface 深一档，小块控件才看得出轮廓。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `--muted-foreground` | color.gray.600 | `#656565` | 说明文字、占位符、标注。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `--surface` | color.gray.50 | `#fafafa` | 比 background 低一级的面：侧栏、区块底、代码块、示例舞台、表格表头（与侧栏同色，2026-09-23 用户选定）。浅色 gray-50，深色 gray-800。所有浅灰底只从 surface / muted / border 三档取，不用 color-mix 另造灰。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `--accent` | color.orange.100 | `#ffe5de` | 悬停行、选中行、选中菜单项底、品牌提示条。橙色主题用 orange-100，是主橙的浅底，不用金卡其。 |
| `--accent-foreground` | color.ink | `#0a0604` | accent 上的文字。 |
| `--destructive` | color.red.600 | `#b3261e` | 危险操作与错误态。 |
| `--destructive-foreground` | color.white | `#ffffff` | destructive 上的文字。 |
| `--border` | color.gray.200 | `#dfdfdf` | 分隔线与卡片描边，装饰用。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `--input` | color.gray.200 | `#dfdfdf` | 输入框描边。焦点时换 ring。 |
| `--ring` | color.orange.700 | `#ba4a17` | 键盘焦点环，2px 实线。 |
| `--sidebar` | color.gray.50 | `#fafafa` | 侧栏底，沿用 VI 版面左侧灰色区。 |
| `--sidebar-foreground` | color.ink | `#0a0604` | 侧栏文字。 |
| `--sidebar-primary` | color.orange.500 | `#fe5d33` | 侧栏当前项、主操作。 |
| `--sidebar-primary-foreground` | color.white | `#ffffff` | sidebar-primary 上的文字。与 primary-foreground 同为 white。 |
| `--sidebar-accent` | color.gray.100 | `#f3f3f3` | 侧栏导航项的悬停与选中底，与 muted 同一档（浅色 gray-100、深色 gray-800），中性灰，不用品牌色或金卡其。 |
| `--sidebar-accent-foreground` | color.ink | `#0a0604` | sidebar-accent 上的文字。 |
| `--sidebar-border` | color.gray.200 | `#dfdfdf` | 侧栏分隔线。 |
| `--sidebar-ring` | color.orange.700 | `#ba4a17` | 侧栏焦点环。 |
| `--icon-default` | color.ink | `#0a0604` | 普通导航和资源入口图标。按钮内图标默认继承按钮文字颜色。 |
| `--icon-muted` | color.gray.600 | `#656565` | 搜索等辅助图标。 |
| `--icon-active` | color.orange.700 | `#ba4a17` | 当前导航项图标。 |
| `--icon-hover` | color.ink | `#0a0604` | 未选中的导航及资源入口悬停图标。 |
| `--chart-1` | color.orange.500 | `#fe5d33` | 图表主系列：本模型 / 当前方案，取主题主色。类别色里只有这一档带色相。 |
| `--chart-2` | color.ink | `#0a0604` | 图表第二系列：对照组，品牌黑。 |
| `--chart-3` | color.gray.700 | `#4d4d4d` | 图表第三系列：gray-700，深中性灰，用于历史或其他方案。深于基线，避免和虚线同色。 |
| `--chart-4` | color.gray.400 | `#9e9e9e` | 图表第四系列：gray-400，浅中性灰，只作面积与柱。在 white 上 2.7:1，线图需 2px 以上并配标签。不用金卡其。 |
| `--chart-5` | color.gray.600 | `#656565` | 图表第五系列：gray-600，中性灰。不用主色深阶，避免和 chart-1 变成同一色相的两档。超过 5 个系列改用小倍数图或交互筛选。 |
| `--chart-baseline` | color.gray.500 | `#808080` | 基线与阈值参考线：gray-500，虚线。 |
| `--chart-grid` | color.gray.200 | `#dfdfdf` | 网格线：与 border 同值。 |
| `--chart-axis` | color.gray.600 | `#656565` | 坐标轴刻度文字：与 muted-foreground 同值。 |
| `--chart-seq-1` | color.orange.100 | `#ffe5de` | 顺序色阶最浅（数值最小）。 |
| `--chart-seq-2` | color.orange.200 | `#ffc5b6` | 顺序色阶第二档。 |
| `--chart-seq-3` | color.orange.300 | `#fe9e85` | 顺序色阶第三档。 |
| `--chart-seq-4` | color.orange.500 | `#fe5d33` | 顺序色阶第四档。 |
| `--chart-seq-5` | color.orange.700 | `#ba4a17` | 顺序色阶最深（数值最大），与主色深阶一致。 |
| `--surface-glass` | color.white | `#ffffff` | 监控大屏的玻璃面板底：只在品牌黑、且面板叠在地图 / 视频 / 热力底图上时用，配合 --blur-glass 做背景模糊。深色为 900 档 60% 不透明（橙 gray-900、蓝 slate-900），是灰底规则里唯一带透明度的面，不另造；浅色主题等于 card 实色，自动失效。 |
| `--glow` | transparent | `transparent` | 监控大屏的强调光晕色：本屏最重要的一个指标背后的静止柔光（.sa-glow 从左上角径向渐变）。深色取主色 34%（橙）/ 50%（蓝，blue-400 偏暗故加浓）；浅色主题为 transparent，自动失效。一屏一处。 |
| `--lit-shadow` | color.ink | `#0a0604` | 光影质感的投影色（v0.39.0）：所有 shadow-lit-* 按 6%–28% 混入它。浅色橙取品牌黑 ink（暖调），浅色蓝取 blue-700（投影带一点蓝，而不是灰黑）；深色主题为 transparent，光影档自动失效。只作投影，不作文字、描边或填充色。 |
| `--alarm-p1` | color.red.500 | `#e22028` | 【告警专用】P1 紧急告警：PlantPAx P1 红，浅色与深色共用。只给告警标记、告警横幅与设备故障，不得复用于装饰、按钮、destructive 或图表系列。永远与菱形 + 数字 1 同时出现，不单靠颜色。 |
| `--alarm-p1-foreground` | color.white | `#ffffff` | alarm-p1 上的数字与文字：white（4.7:1）。 |
| `--alarm-p2` | color.yellow.400 | `#f5c000` | 【告警专用】P2 高优先级告警：琥珀黄 yellow-400，深浅主题共用（2026-09-23 用户决定不用行业橙，避免与品牌橙撞色；浅色主题采用亮黄填充 + 深色描边）。永远与三角形 + 数字 2 同时出现。不得复用于装饰、按钮或图表系列。 |
| `--alarm-p2-foreground` | color.ink | `#0a0604` | alarm-p2 上的数字与文字：ink（浅色 5.4:1、深色 11.9:1）。 |
| `--alarm-p3` | color.purple.600 | `#7e57a0` | 【告警专用】P3 中优先级告警：紫，参照 PlantPAx #916AAD（浅色压暗为 purple-600）。永远与方形 + 数字 3 同时出现。不得复用于装饰、按钮或图表系列。 |
| `--alarm-p3-foreground` | color.white | `#ffffff` | alarm-p3 上的数字与文字：浅色 white（5.6:1），深色 ink（4.7:1）。 |
| `--alarm-p4` | color.ink | `#0a0604` | 【告警专用】P4 低优先级告警：中性，不带色相，等于前景色；标记画成空心圆描边 + 数字 4，靠形状与编号区分。 |
| `--alarm-p4-foreground` | color.white | `#ffffff` | alarm-p4 实心底上的文字：与页面底同值（浅色 white、深色 ink）。 |
| `--status-running` | color.ink | `#0a0604` | 【设备运行态】运行：实心圆，最亮 / 最深的中性色（= 前景色）。按 ISA-101 靠明暗与形状区分，运行与停止不用红绿。 |
| `--status-idle` | color.gray.700 | `#4d4d4d` | 【设备运行态】待机：粗描边空心圆，灰阶 700（深色 300）。 |
| `--status-stopped` | color.gray.500 | `#808080` | 【设备运行态】计划停机：实心方形，灰阶 500，比运行暗。 |
| `--status-fault` | color.red.500 | `#e22028` | 【设备运行态】故障停机：叉形，唯一带色相的运行态，取 alarm-p1；不用菱形（P1 告警的形状），也不用圆（色弱时与运行分不开）。 |
| `--status-maintenance` | color.gray.600 | `#656565` | 【设备运行态】维护：空心方形，灰阶 600（深色 400）。 |
| `--status-offline` | color.gray.500 | `#808080` | 【设备运行态】离线 / 无通讯：虚线空心圆，灰阶 500，与计划停机同明度、靠形状区分。 |
| `--quality-bad` | color.ink | `#0a0604` | 【测点数据质量】坏值：最强的中性色（= 前景色），配斜线与「坏值」标签；数值加删除线，表示读数不可信。 |
| `--quality-stale` | color.gray.600 | `#656565` | 【测点数据质量】陈旧（超时未更新）：数值与标签压暗到灰阶 600（深色 400），配时钟图标与已过时长。可作正文（≥ 4.5:1）。 |
| `--quality-manual` | color.gray.700 | `#4d4d4d` | 【测点数据质量】手动替代：灰阶 700（深色 300），虚线描边标签「手动」；数值照常显示。可作正文（≥ 4.5:1）。 |
| `--success` | color.green.600 | `#16a34a` | 成功：已完成、已复用的状态图形与状态点（StatusDot / TaskStatus / FlowNode）。只作图形色（≥ 3:1），状态文字仍用 foreground；不用于指标好坏、设备运行态（ISA-101 另有 status-*）与按钮。2026-09-23 用户决定加绿色。 |
| `--success-foreground` | color.white | `#ffffff` | success 实心图形上的对勾：浅色 white、深色 ink。 |
| `--canvas` | color.gray.50 | `#fafafa` | 画布底（Canvas）：比节点卡片低一档——浅色取 surface 同档，深色取品牌黑，让卡片浮在画布上。只用于画布，不作页面底。 |
| `--canvas-dot` | color.gray.300 | `#bdbdbd` | 画布点阵（Canvas 底纹）：浅色比 border 深一档、深色取 border 同档，点小而疏，只作平移缩放的参照，不承载信息。灰色跟随主色。 |
| `--alarm-p2-edge` | color.ink | `#0a0604` | 【告警专用】P2 图形的描边色：浅色主题为品牌黑 ink（亮黄在白底上不可辨，靠描边识别形状），深色主题等于 alarm-p2（黄在品牌黑上本身足够醒目，不加描边）。P2 的横幅、模拟量条越限边框也用它。 |

额外变量：primary-hover（主按钮悬停）、primary-text（品牌色小字）；不要用透明度替代主按钮 hover。字体使用 --font-sans，圆角使用 --radius。
