<!-- 稳准智能 Stable AI design tokens v1.0.0 — 由 scripts/build.mjs 从 design-system/tokens.json 生成，不要手改。 -->

# Token 表 · v1.0.0

界面使用语义 token；原始色用于品牌样本及图表。待定主题不能作为已发布主题使用。

## 原始色 primitive

| token | 值 | 用途 |
| --- | --- | --- |
| `white` | `#ffffff` | 纯白。页面底、卡片底。 |
| `ink` | `#0a0604` | 品牌黑（品牌指定 #0A0604）。正文、标题、字标颜色。在 white 上 20:1。 |
| `orange-100` | `#ffe5de` | 【派生值】white 与 orange-500 按 16% 混合，作顺序色阶与浅色底；不作文字色。 |
| `orange-200` | `#ffc5b6` | 【派生值】white 与 orange-500 按 36% 混合，作顺序色阶与浅色底；不作文字色。 |
| `orange-300` | `#fe9e85` | 【派生值】white 与 orange-500 按 60% 混合，作顺序色阶与浅色底；不作文字色。 |
| `orange-400` | `#fe7a58` | 【派生值】white 与 orange-500 按 82% 混合，作顺序色阶与浅色底；不作文字色。 |
| `orange-500` | `#fe5d33` | 品牌主橙（品牌指定 #FE5D33），UI 中唯一的橙。按钮等主色底上的文字用 white（3.1:1，未达正文 4.5，按效果保留）。ink 在其上 6.6:1，仍可用于需要更高对比的场合，但主按钮不用。 |
| `orange-600` | `#f0572f` | 【派生值，待确认】orange-500 叠 6% ink，同色相略深，作主按钮悬停/按下态。其上文字用 ink（5.9:1）。 |
| `orange-700` | `#ba4a17` | 【派生值，待确认】orange-500 同色相压暗、降饱和，作橙色小字与焦点环。在 white 上 5.2:1，在 gray-100 上 4.3:1（略低于 4.5，小字只放在 white 上）。任何足够深的橙都会偏棕红，所以尽量少用橙色小字。 |
| `orange-900` | `#672c1b` | 【派生值】#140F0C（深灰）与 orange-500 按 35% 混合（sRGB），深色主题的 accent 底与顺序色阶最深档；不作文字色。gray-50 在其上 10.3:1。 |
| `orange-950` | `#562517` | 【派生值】#140F0C（深灰）与 orange-500 按 28% 混合（sRGB），比 orange-900 深一档。只作 orange-dark 的 accent（选中行、菜单高亮、拖入态）：orange-900 上 muted-foreground 仅 4.0:1，本档 ≥ 4.5:1。 |
| `blue-100` | `#dde3ef` | 【派生值】white 与 blue-500 按 16% 混合，作顺序色阶与浅色底；不作文字色。 |
| `blue-200` | `#b3c0da` | 【派生值】white 与 blue-500 按 36% 混合，作顺序色阶与浅色底；不作文字色。 |
| `blue-300` | `#8097c1` | 【派生值】white 与 blue-500 按 60% 混合，作顺序色阶与浅色底；不作文字色。 |
| `blue-400` | `#5270ab` | 【派生值】white 与 blue-500 按 82% 混合，作顺序色阶与浅色底；不作文字色。 |
| `blue-500` | `#2c5198` | 「模型蓝色版」主色，取自 LimiX VI 手册 A03-1 标准色：PANTONE Reflex Blue 2X C，C99 M82 Y0 K0，R44 G81 B152（source/limix-vi-a03-1-standard-color.png）。其上文字用 white（7.7:1）；ink 在其上仅 2.6:1，不可用。在 white 上 7.7:1，可直接作小字。 |
| `blue-600` | `#294b8c` | 【派生值，待确认】blue-500 叠 8% ink，作蓝色主按钮悬停/按下态。其上文字用 white（8.5:1）。 |
| `blue-700` | `#25427a` | 【派生值，待确认】blue-500 叠 20% ink，作蓝色小字与焦点环，与主色拉开层次。在 white 上 9.8:1，在 gray-100 上 8.2:1。 |
| `blue-900` | `#1f2e4c` | 【派生值】#140F0C（深灰）与 blue-500 按 45% 混合（sRGB），蓝色深色主题的 accent 底与顺序色阶最深档；不作文字色。gray-50 在其上 13.0:1。 |
| `std-orange-red` | `#e8401c` | VI 标准色「橘红色」C0 M89 Y75 K0 / R232 G64 B28。标识渐变的深端、印刷品，以及封面 token gradient-brand 的起点。不单独做控件色（比主橙偏红、偏重）。ink 在其上 5.0:1。 |
| `std-orange-yellow` | `#f29942` | VI 标准色「橘黄色」C0 M50 Y76 K0 / R242 G153 B66。标识图形亮端、渐变中段、装饰面。仅作面色，不作文字；其上文字用 ink（9.0:1）。 |
| `std-tangerine` | `#f39932` | VI 标准色「金桔色」C0 M50 Y83 K0 / R243 G153 B50。次级强调面。仅作面色；其上文字用 ink（9.1:1）。不进图表类别色：和品牌橙太近，并排会像第二个橙。 |
| `std-gold-khaki` | `#f6b961` | VI 标准色「金卡其色」C1 M34 Y65 K0 / R246 G185 B97。悬停行、选中项底、品牌提示条。仅作面色；其上文字用 ink（11.6:1）。不进图表类别色：高饱和暖色，和品牌橙并排像第二个橙，在蓝色主题里更跳。 |
| `gray-50` | `#fafafa` | surface 面层：侧栏、区块底、代码块、示例舞台、表格行悬停。2026-09-23 按用户反馈提亮并去掉色偏。 |
| `gray-100` | `#f3f3f3` | muted（橙色主题）：选中态、悬停、次级按钮、骨架、表头。2026-09-23 用户选定方案 1（中性孪生）；VI 的 #EBEBEB 仅保留在印刷参考。 |
| `gray-200` | `#dfdfdf` | border（橙色主题）：描边、输入框、图表网格。与 slate-200 明度相同。 |
| `gray-300` | `#bdbdbd` | 禁用态描边、骨架屏；深色主题的说明文字与坐标轴文字。 |
| `gray-400` | `#9e9e9e` | 禁用态文字、占位图形。在 white 上 2.7:1，不作正文；深色主题的说明文字与坐标轴文字。 |
| `gray-500` | `#808080` | 图标次级色、大字标注。在 white 上 3.9:1，只作 24px+ 大字或非文字元素。 |
| `gray-600` | `#656565` | 说明文字（橙色主题）：muted-foreground、弱化图标、坐标轴文字。在 white 上 5.8:1，在 gray-100 上 5.3:1。与 slate-600 明度相同。 |
| `gray-700` | `#4d4d4d` | 深色主题的 muted：选中态底、次级按钮、骨架、网格线；深色主题的描边。 |
| `gray-800` | `#353535` | 深色主题的 muted：选中态底、次级按钮、骨架、网格线。 |
| `gray-900` | `#1f1f1f` | 深色主题的面层：卡片、弹层、侧栏、代码块（页面底为品牌黑 ink）。 |
| `slate-50` | `#f9fafb` | 【冷灰 slate】surface（蓝色主题）：侧栏、区块底、代码块、悬停行。用户在灰阶对比中选定的 E。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-100` | `#f2f3f5` | 【冷灰 slate】muted（蓝色主题）：选中态、悬停、次级按钮、骨架、表头。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-200` | `#dcdfe3` | 【冷灰 slate】border（蓝色主题）：描边、输入框、图表网格。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-300` | `#babdc3` | 【冷灰 slate】蓝色深色主题的说明文字与坐标轴；浅色图表系列。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-400` | `#9a9ea7` | 【冷灰 slate】图表浅系列、禁用态；蓝色深色主题的说明文字。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-500` | `#7b808b` | 【冷灰 slate】图表基线与阈值线（蓝色主题）。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-600` | `#5f6570` | 【冷灰 slate】说明文字（蓝色主题）：muted-foreground、弱化图标、坐标轴文字。用户选定的 E。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-700` | `#484d57` | 【冷灰 slate】蓝色深色主题的描边；图表深系列。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-800` | `#31353d` | 【冷灰 slate】蓝色深色主题的 muted：选中态、次级按钮、网格线。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `slate-900` | `#1c1f25` | 【冷灰 slate】蓝色深色主题的面层：卡片、弹层、侧栏、代码块（页面底为品牌黑 ink）。 与同档 gray 明度相同，OKLCH 色相约 262°，50 / 100 / 200 / 600 取自用户选定的 E，其余按明度插值。 |
| `green-400` | `#4ade80` | 【派生值】深色主题的 success。作图形在 gray-900 上 9.5:1、品牌黑上 11:1；其上的对勾用 ink。 |
| `green-600` | `#16a34a` | 【派生值】成功绿，浅色主题的 success。2026-09-23 用户在画布对比页选定「标准绿」。作图形在 white 上 3.3:1、gray-50 上 3.2:1（图形要求 ≥ 3:1）；不作正文文字色。 |
| `red-400` | `#e45749` | 【派生值】red-600 在 OKLCH 中保持色相 28.7° 与彩度 0.178、明度提到 0.64，深色主题的 destructive 底与错误态文字。在 gray-900 上 5.2:1；其上文字用 gray-900（5.2:1），白字仅 3.7:1 不可用。 |
| `red-500` | `#e22028` | 【告警专用】告警 P1 红，取 Rockwell PlantPAx Process HMI Style Guide 的 P1 原值 #E22028（HSL 色相 358°，比品牌橙 12° 更偏红、更深）。浅色与深色主题共用：white 在其上 4.7:1；作图形在 white 上 4.7:1、ink 上 4.3:1、gray-900 上 3.5:1。只给 alarm-p1 与 status-fault，不得复用于装饰、按钮、destructive 或图表系列。 |
| `red-600` | `#b3261e` | 【派生值，待确认】危险操作与错误态。与品牌橙拉开（更深、偏红）；white 在其上 6.5:1，作文字在 white 上 6.5:1。 |
| `yellow-400` | `#f5c000` | 【告警专用】告警 P2 琥珀黄（HSL 47°，OKLCH 色相 88°，不偏橙），浅色与深色主题共用。行业 P2 常用橙（PlantPAx #EC8629），与品牌橙撞色，2026-09-23 用户决定改用黄。亮黄在白底上只有约 1.5:1，浅色主题按「亮黄填充 + 品牌黑描边」画（alarm-p2-edge = ink，与国际通用的黄色警告三角同理），形状靠描边识别；在 ink 上 11.9:1、gray-900 上 9.8:1。其上数字与文字用 ink（11.9:1）。不得复用于装饰、按钮或图表系列。 |
| `purple-500` | `#916aad` | 【告警专用】深色主题的告警 P3 紫，即 PlantPAx 品红原值 #916AAD（Emerson DeltaV 的 P3 也用紫）。在 ink 上 4.7:1、gray-900 上 3.8:1；其上数字与文字用 ink（4.7:1）。不得复用于装饰、按钮或图表系列。 |
| `purple-600` | `#7e57a0` | 【告警专用】浅色主题的告警 P3 紫，参照 PlantPAx 品红 #916AAD 同色相压暗：原值上白字仅 4.3:1，压暗后 white 在其上 5.6:1，作图形在 white 上 5.6:1。不得复用于装饰、按钮或图表系列。 |

## 语义色 · orange-light（橙色 · 浅色，active）

| token | 指向 | 值 | 用途 |
| --- | --- | --- | --- |
| `background` | {color.white} | `#ffffff` | 页面底。 |
| `foreground` | {color.ink} | `#0a0604` | 默认文字。 |
| `card` | {color.white} | `#ffffff` | Card 底。 |
| `card-foreground` | {color.ink} | `#0a0604` | Card 内文字。 |
| `popover` | {color.white} | `#ffffff` | 弹层底（Dropdown、Tooltip、Dialog）。 |
| `popover-foreground` | {color.ink} | `#0a0604` | 弹层内文字。 |
| `primary` | {color.orange.500} | `#fe5d33` | 主按钮、选中态、进度。封面大面积用 gradient-brand，不用把 primary 铺成单色底。 |
| `primary-foreground` | {color.white} | `#ffffff` | primary 上的文字、图标、勾选标记。橙色与蓝色主题都用 white。白在 #FE5D33 上 3.1:1、在 primary-hover 上 3.4:1，未达正文 4.5，按效果保留。 |
| `primary-hover` | {color.orange.600} | `#f0572f` | primary 的悬停/按下态，同色相略深；不用 shadcn 默认的 primary/90 透明度写法（橙色上会发灰）。 |
| `primary-text` | {color.orange.700} | `#ba4a17` | 品牌色小字与链接悬停色。只放在 background 上；正文链接优先用 foreground + primary 下划线。 |
| `secondary` | {color.gray.100} | `#f3f3f3` | 次级按钮、Tabs 底。 |
| `secondary-foreground` | {color.ink} | `#0a0604` | secondary 上的文字。 |
| `muted` | {color.gray.100} | `#f3f3f3` | 弱化底：表格行悬停、分段控件与页签的底槽、骨架屏、禁用输入框；在白底上比 surface 深一档，小块控件才看得出轮廓。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `muted-foreground` | {color.gray.600} | `#656565` | 说明文字、占位符、标注。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `surface` | {color.gray.50} | `#fafafa` | 比 background 低一级的面：侧栏、区块底、代码块、示例舞台、表格表头（与侧栏同色，2026-09-23 用户选定）。浅色 gray-50，深色 gray-800。所有浅灰底只从 surface / muted / border 三档取，不用 color-mix 另造灰。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `accent` | {color.orange.100} | `#ffe5de` | 悬停行、选中行、选中菜单项底、品牌提示条。橙色主题用 orange-100，是主橙的浅底，不用金卡其。 |
| `accent-foreground` | {color.ink} | `#0a0604` | accent 上的文字。 |
| `destructive` | {color.red.600} | `#b3261e` | 危险操作与错误态。 |
| `destructive-foreground` | {color.white} | `#ffffff` | destructive 上的文字。 |
| `border` | {color.gray.200} | `#dfdfdf` | 分隔线与卡片描边，装饰用。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `input` | {color.gray.200} | `#dfdfdf` | 输入框描边。焦点时换 ring。 |
| `ring` | {color.orange.700} | `#ba4a17` | 键盘焦点环，2px 实线。 |
| `sidebar` | {color.gray.50} | `#fafafa` | 侧栏底，沿用 VI 版面左侧灰色区。 |
| `sidebar-foreground` | {color.ink} | `#0a0604` | 侧栏文字。 |
| `sidebar-primary` | {color.orange.500} | `#fe5d33` | 侧栏当前项、主操作。 |
| `sidebar-primary-foreground` | {color.white} | `#ffffff` | sidebar-primary 上的文字。与 primary-foreground 同为 white。 |
| `sidebar-accent` | {color.gray.100} | `#f3f3f3` | 侧栏导航项的悬停与选中底，与 muted 同一档（浅色 gray-100、深色 gray-800），中性灰，不用品牌色或金卡其。 |
| `sidebar-accent-foreground` | {color.ink} | `#0a0604` | sidebar-accent 上的文字。 |
| `sidebar-border` | {color.gray.200} | `#dfdfdf` | 侧栏分隔线。 |
| `sidebar-ring` | {color.orange.700} | `#ba4a17` | 侧栏焦点环。 |
| `icon-default` | {color.ink} | `#0a0604` | 普通导航和资源入口图标。按钮内图标默认继承按钮文字颜色。 |
| `icon-muted` | {color.gray.600} | `#656565` | 搜索等辅助图标。 |
| `icon-active` | {color.orange.700} | `#ba4a17` | 当前导航项图标。 |
| `icon-hover` | {color.ink} | `#0a0604` | 未选中的导航及资源入口悬停图标。 |
| `chart-1` | {color.orange.500} | `#fe5d33` | 图表主系列：本模型 / 当前方案，取主题主色。类别色里只有这一档带色相。 |
| `chart-2` | {color.ink} | `#0a0604` | 图表第二系列：对照组，品牌黑。 |
| `chart-3` | {color.gray.700} | `#4d4d4d` | 图表第三系列：gray-700，深中性灰，用于历史或其他方案。深于基线，避免和虚线同色。 |
| `chart-4` | {color.gray.400} | `#9e9e9e` | 图表第四系列：gray-400，浅中性灰，只作面积与柱。在 white 上 2.7:1，线图需 2px 以上并配标签。不用金卡其。 |
| `chart-5` | {color.gray.600} | `#656565` | 图表第五系列：gray-600，中性灰。不用主色深阶，避免和 chart-1 变成同一色相的两档。超过 5 个系列改用小倍数图或交互筛选。 |
| `chart-baseline` | {color.gray.500} | `#808080` | 基线与阈值参考线：gray-500，虚线。 |
| `chart-grid` | {color.gray.200} | `#dfdfdf` | 网格线：与 border 同值。 |
| `chart-axis` | {color.gray.600} | `#656565` | 坐标轴刻度文字：与 muted-foreground 同值。 |
| `chart-seq-1` | {color.orange.100} | `#ffe5de` | 顺序色阶最浅（数值最小）。 |
| `chart-seq-2` | {color.orange.200} | `#ffc5b6` | 顺序色阶第二档。 |
| `chart-seq-3` | {color.orange.300} | `#fe9e85` | 顺序色阶第三档。 |
| `chart-seq-4` | {color.orange.500} | `#fe5d33` | 顺序色阶第四档。 |
| `chart-seq-5` | {color.orange.700} | `#ba4a17` | 顺序色阶最深（数值最大），与主色深阶一致。 |
| `surface-glass` | {color.white} | `#ffffff` | 监控大屏的玻璃面板底：只在品牌黑、且面板叠在地图 / 视频 / 热力底图上时用，配合 --blur-glass 做背景模糊。深色为 900 档 60% 不透明（橙 gray-900、蓝 slate-900），是灰底规则里唯一带透明度的面，不另造；浅色主题等于 card 实色，自动失效。 |
| `glow` | transparent | `transparent` | 监控大屏的强调光晕色：本屏最重要的一个指标背后的静止柔光（.sa-glow 从左上角径向渐变）。深色取主色 34%（橙）/ 50%（蓝，blue-400 偏暗故加浓）；浅色主题为 transparent，自动失效。一屏一处。 |
| `lit-shadow` | {color.ink} | `#0a0604` | 光影质感的投影色（v0.39.0）：所有 shadow-lit-* 按 6%–28% 混入它。浅色橙取品牌黑 ink（暖调），浅色蓝取 blue-700（投影带一点蓝，而不是灰黑）；深色主题为 transparent，光影档自动失效。只作投影，不作文字、描边或填充色。 |
| `alarm-p1` | {color.red.500} | `#e22028` | 【告警专用】P1 紧急告警：PlantPAx P1 红，浅色与深色共用。只给告警标记、告警横幅与设备故障，不得复用于装饰、按钮、destructive 或图表系列。永远与菱形 + 数字 1 同时出现，不单靠颜色。 |
| `alarm-p1-foreground` | {color.white} | `#ffffff` | alarm-p1 上的数字与文字：white（4.7:1）。 |
| `alarm-p2` | {color.yellow.400} | `#f5c000` | 【告警专用】P2 高优先级告警：琥珀黄 yellow-400，深浅主题共用（2026-09-23 用户决定不用行业橙，避免与品牌橙撞色；浅色主题采用亮黄填充 + 深色描边）。永远与三角形 + 数字 2 同时出现。不得复用于装饰、按钮或图表系列。 |
| `alarm-p2-foreground` | {color.ink} | `#0a0604` | alarm-p2 上的数字与文字：ink（浅色 5.4:1、深色 11.9:1）。 |
| `alarm-p3` | {color.purple.600} | `#7e57a0` | 【告警专用】P3 中优先级告警：紫，参照 PlantPAx #916AAD（浅色压暗为 purple-600）。永远与方形 + 数字 3 同时出现。不得复用于装饰、按钮或图表系列。 |
| `alarm-p3-foreground` | {color.white} | `#ffffff` | alarm-p3 上的数字与文字：浅色 white（5.6:1），深色 ink（4.7:1）。 |
| `alarm-p4` | {color.ink} | `#0a0604` | 【告警专用】P4 低优先级告警：中性，不带色相，等于前景色；标记画成空心圆描边 + 数字 4，靠形状与编号区分。 |
| `alarm-p4-foreground` | {color.white} | `#ffffff` | alarm-p4 实心底上的文字：与页面底同值（浅色 white、深色 ink）。 |
| `status-running` | {color.ink} | `#0a0604` | 【设备运行态】运行：实心圆，最亮 / 最深的中性色（= 前景色）。按 ISA-101 靠明暗与形状区分，运行与停止不用红绿。 |
| `status-idle` | {color.gray.700} | `#4d4d4d` | 【设备运行态】待机：粗描边空心圆，灰阶 700（深色 300）。 |
| `status-stopped` | {color.gray.500} | `#808080` | 【设备运行态】计划停机：实心方形，灰阶 500，比运行暗。 |
| `status-fault` | {color.red.500} | `#e22028` | 【设备运行态】故障停机：叉形，唯一带色相的运行态，取 alarm-p1；不用菱形（P1 告警的形状），也不用圆（色弱时与运行分不开）。 |
| `status-maintenance` | {color.gray.600} | `#656565` | 【设备运行态】维护：空心方形，灰阶 600（深色 400）。 |
| `status-offline` | {color.gray.500} | `#808080` | 【设备运行态】离线 / 无通讯：虚线空心圆，灰阶 500，与计划停机同明度、靠形状区分。 |
| `quality-bad` | {color.ink} | `#0a0604` | 【测点数据质量】坏值：最强的中性色（= 前景色），配斜线与「坏值」标签；数值加删除线，表示读数不可信。 |
| `quality-stale` | {color.gray.600} | `#656565` | 【测点数据质量】陈旧（超时未更新）：数值与标签压暗到灰阶 600（深色 400），配时钟图标与已过时长。可作正文（≥ 4.5:1）。 |
| `quality-manual` | {color.gray.700} | `#4d4d4d` | 【测点数据质量】手动替代：灰阶 700（深色 300），虚线描边标签「手动」；数值照常显示。可作正文（≥ 4.5:1）。 |
| `success` | {color.green.600} | `#16a34a` | 成功：已完成、已复用的状态图形与状态点（StatusDot / TaskStatus / FlowNode）。只作图形色（≥ 3:1），状态文字仍用 foreground；不用于指标好坏、设备运行态（ISA-101 另有 status-*）与按钮。2026-09-23 用户决定加绿色。 |
| `success-foreground` | {color.white} | `#ffffff` | success 实心图形上的对勾：浅色 white、深色 ink。 |
| `canvas` | {color.gray.50} | `#fafafa` | 画布底（Canvas）：比节点卡片低一档——浅色取 surface 同档，深色取品牌黑，让卡片浮在画布上。只用于画布，不作页面底。 |
| `canvas-dot` | {color.gray.300} | `#bdbdbd` | 画布点阵（Canvas 底纹）：浅色比 border 深一档、深色取 border 同档，点小而疏，只作平移缩放的参照，不承载信息。灰色跟随主色。 |
| `alarm-p2-edge` | {color.ink} | `#0a0604` | 【告警专用】P2 图形的描边色：浅色主题为品牌黑 ink（亮黄在白底上不可辨，靠描边识别形状），深色主题等于 alarm-p2（黄在品牌黑上本身足够醒目，不加描边）。P2 的横幅、模拟量条越限边框也用它。 |

## 语义色 · blue-light（蓝色 · 浅色，active）

| token | 指向 | 值 | 用途 |
| --- | --- | --- | --- |
| `background` | {color.white} | `#ffffff` | 页面底。 |
| `foreground` | {color.ink} | `#0a0604` | 默认文字。 |
| `card` | {color.white} | `#ffffff` | Card 底。 |
| `card-foreground` | {color.ink} | `#0a0604` | Card 内文字。 |
| `popover` | {color.white} | `#ffffff` | 弹层底（Dropdown、Tooltip、Dialog）。 |
| `popover-foreground` | {color.ink} | `#0a0604` | 弹层内文字。 |
| `primary` | {color.blue.500} | `#2c5198` | 主按钮、选中态、进度。封面大面积用 gradient-brand，不用把 primary 铺成单色底。 |
| `primary-foreground` | {color.white} | `#ffffff` | primary 上的文字、图标、勾选标记。橙色与蓝色主题都用 white。白在 #FE5D33 上 3.1:1、在 primary-hover 上 3.4:1，未达正文 4.5，按效果保留。 |
| `primary-hover` | {color.blue.600} | `#294b8c` | primary 的悬停/按下态，同色相略深；不用 shadcn 默认的 primary/90 透明度写法（橙色上会发灰）。 |
| `primary-text` | {color.blue.700} | `#25427a` | 品牌色小字与链接悬停色。只放在 background 上；正文链接优先用 foreground + primary 下划线。 |
| `secondary` | {color.slate.100} | `#f2f3f5` | 次级按钮、Tabs 底。 |
| `secondary-foreground` | {color.ink} | `#0a0604` | secondary 上的文字。 |
| `muted` | {color.slate.100} | `#f2f3f5` | 弱化底：表格行悬停、分段控件与页签的底槽、骨架屏、禁用输入框；在白底上比 surface 深一档，小块控件才看得出轮廓。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `muted-foreground` | {color.slate.600} | `#5f6570` | 说明文字、占位符、标注。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `surface` | {color.slate.50} | `#f9fafb` | 比 background 低一级的面：侧栏、区块底、代码块、示例舞台、表格表头（与侧栏同色，2026-09-23 用户选定）。浅色 gray-50，深色 gray-800。所有浅灰底只从 surface / muted / border 三档取，不用 color-mix 另造灰。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `accent` | {color.blue.100} | `#dde3ef` | 悬停行、选中行、选中菜单项底、品牌提示条。橙色主题用 orange-100，是主橙的浅底，不用金卡其。 |
| `accent-foreground` | {color.ink} | `#0a0604` | accent 上的文字。 |
| `destructive` | {color.red.600} | `#b3261e` | 危险操作与错误态。 |
| `destructive-foreground` | {color.white} | `#ffffff` | destructive 上的文字。 |
| `border` | {color.slate.200} | `#dcdfe3` | 分隔线与卡片描边，装饰用。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `input` | {color.slate.200} | `#dcdfe3` | 输入框描边。焦点时换 ring。 |
| `ring` | {color.blue.700} | `#25427a` | 键盘焦点环，2px 实线。 |
| `sidebar` | {color.slate.50} | `#f9fafb` | 侧栏底，沿用 VI 版面左侧灰色区。 |
| `sidebar-foreground` | {color.ink} | `#0a0604` | 侧栏文字。 |
| `sidebar-primary` | {color.blue.500} | `#2c5198` | 侧栏当前项、主操作。 |
| `sidebar-primary-foreground` | {color.white} | `#ffffff` | sidebar-primary 上的文字。与 primary-foreground 同为 white。 |
| `sidebar-accent` | {color.slate.100} | `#f2f3f5` | 侧栏导航项的悬停与选中底，与 muted 同一档（浅色 gray-100、深色 gray-800），中性灰，不用品牌色或金卡其。 |
| `sidebar-accent-foreground` | {color.ink} | `#0a0604` | sidebar-accent 上的文字。 |
| `sidebar-border` | {color.slate.200} | `#dcdfe3` | 侧栏分隔线。 |
| `sidebar-ring` | {color.blue.700} | `#25427a` | 侧栏焦点环。 |
| `icon-default` | {color.ink} | `#0a0604` | 普通导航和资源入口图标。按钮内图标默认继承按钮文字颜色。 |
| `icon-muted` | {color.slate.600} | `#5f6570` | 搜索等辅助图标。 |
| `icon-active` | {color.blue.700} | `#25427a` | 当前导航项图标。 |
| `icon-hover` | {color.ink} | `#0a0604` | 未选中的导航及资源入口悬停图标。 |
| `chart-1` | {color.blue.500} | `#2c5198` | 图表主系列：本模型 / 当前方案，取主题主色。类别色里只有这一档带色相。 |
| `chart-2` | {color.ink} | `#0a0604` | 图表第二系列：对照组，品牌黑。 |
| `chart-3` | {color.slate.700} | `#484d57` | 图表第三系列：gray-700，深中性灰，用于历史或其他方案。深于基线，避免和虚线同色。 |
| `chart-4` | {color.slate.400} | `#9a9ea7` | 图表第四系列：gray-400，浅中性灰，只作面积与柱。在 white 上 2.7:1，线图需 2px 以上并配标签。不用金卡其。 |
| `chart-5` | {color.slate.600} | `#5f6570` | 图表第五系列：gray-600，中性灰。不用主色深阶，避免和 chart-1 变成同一色相的两档。超过 5 个系列改用小倍数图或交互筛选。 |
| `chart-baseline` | {color.slate.500} | `#7b808b` | 基线与阈值参考线：gray-500，虚线。 |
| `chart-grid` | {color.slate.200} | `#dcdfe3` | 网格线：与 border 同值。 |
| `chart-axis` | {color.slate.600} | `#5f6570` | 坐标轴刻度文字：与 muted-foreground 同值。 |
| `chart-seq-1` | {color.blue.100} | `#dde3ef` | 顺序色阶最浅（数值最小）。 |
| `chart-seq-2` | {color.blue.200} | `#b3c0da` | 顺序色阶第二档。 |
| `chart-seq-3` | {color.blue.300} | `#8097c1` | 顺序色阶第三档。 |
| `chart-seq-4` | {color.blue.400} | `#5270ab` | 顺序色阶第四档。 |
| `chart-seq-5` | {color.blue.500} | `#2c5198` | 顺序色阶最深（数值最大），与主色深阶一致。 |
| `surface-glass` | {color.white} | `#ffffff` | 监控大屏的玻璃面板底：只在品牌黑、且面板叠在地图 / 视频 / 热力底图上时用，配合 --blur-glass 做背景模糊。深色为 900 档 60% 不透明（橙 gray-900、蓝 slate-900），是灰底规则里唯一带透明度的面，不另造；浅色主题等于 card 实色，自动失效。 |
| `glow` | transparent | `transparent` | 监控大屏的强调光晕色：本屏最重要的一个指标背后的静止柔光（.sa-glow 从左上角径向渐变）。深色取主色 34%（橙）/ 50%（蓝，blue-400 偏暗故加浓）；浅色主题为 transparent，自动失效。一屏一处。 |
| `lit-shadow` | {color.blue.700} | `#25427a` | 光影质感的投影色（v0.39.0）：所有 shadow-lit-* 按 6%–28% 混入它。浅色橙取品牌黑 ink（暖调），浅色蓝取 blue-700（投影带一点蓝，而不是灰黑）；深色主题为 transparent，光影档自动失效。只作投影，不作文字、描边或填充色。 |
| `alarm-p1` | {color.red.500} | `#e22028` | 【告警专用】P1 紧急告警：PlantPAx P1 红，浅色与深色共用。只给告警标记、告警横幅与设备故障，不得复用于装饰、按钮、destructive 或图表系列。永远与菱形 + 数字 1 同时出现，不单靠颜色。 |
| `alarm-p1-foreground` | {color.white} | `#ffffff` | alarm-p1 上的数字与文字：white（4.7:1）。 |
| `alarm-p2` | {color.yellow.400} | `#f5c000` | 【告警专用】P2 高优先级告警：琥珀黄 yellow-400，深浅主题共用（2026-09-23 用户决定不用行业橙，避免与品牌橙撞色；浅色主题采用亮黄填充 + 深色描边）。永远与三角形 + 数字 2 同时出现。不得复用于装饰、按钮或图表系列。 |
| `alarm-p2-foreground` | {color.ink} | `#0a0604` | alarm-p2 上的数字与文字：ink（浅色 5.4:1、深色 11.9:1）。 |
| `alarm-p3` | {color.purple.600} | `#7e57a0` | 【告警专用】P3 中优先级告警：紫，参照 PlantPAx #916AAD（浅色压暗为 purple-600）。永远与方形 + 数字 3 同时出现。不得复用于装饰、按钮或图表系列。 |
| `alarm-p3-foreground` | {color.white} | `#ffffff` | alarm-p3 上的数字与文字：浅色 white（5.6:1），深色 ink（4.7:1）。 |
| `alarm-p4` | {color.ink} | `#0a0604` | 【告警专用】P4 低优先级告警：中性，不带色相，等于前景色；标记画成空心圆描边 + 数字 4，靠形状与编号区分。 |
| `alarm-p4-foreground` | {color.white} | `#ffffff` | alarm-p4 实心底上的文字：与页面底同值（浅色 white、深色 ink）。 |
| `status-running` | {color.ink} | `#0a0604` | 【设备运行态】运行：实心圆，最亮 / 最深的中性色（= 前景色）。按 ISA-101 靠明暗与形状区分，运行与停止不用红绿。 |
| `status-idle` | {color.slate.700} | `#484d57` | 【设备运行态】待机：粗描边空心圆，灰阶 700（深色 300）。 |
| `status-stopped` | {color.slate.500} | `#7b808b` | 【设备运行态】计划停机：实心方形，灰阶 500，比运行暗。 |
| `status-fault` | {color.red.500} | `#e22028` | 【设备运行态】故障停机：叉形，唯一带色相的运行态，取 alarm-p1；不用菱形（P1 告警的形状），也不用圆（色弱时与运行分不开）。 |
| `status-maintenance` | {color.slate.600} | `#5f6570` | 【设备运行态】维护：空心方形，灰阶 600（深色 400）。 |
| `status-offline` | {color.slate.500} | `#7b808b` | 【设备运行态】离线 / 无通讯：虚线空心圆，灰阶 500，与计划停机同明度、靠形状区分。 |
| `quality-bad` | {color.ink} | `#0a0604` | 【测点数据质量】坏值：最强的中性色（= 前景色），配斜线与「坏值」标签；数值加删除线，表示读数不可信。 |
| `quality-stale` | {color.slate.600} | `#5f6570` | 【测点数据质量】陈旧（超时未更新）：数值与标签压暗到灰阶 600（深色 400），配时钟图标与已过时长。可作正文（≥ 4.5:1）。 |
| `quality-manual` | {color.slate.700} | `#484d57` | 【测点数据质量】手动替代：灰阶 700（深色 300），虚线描边标签「手动」；数值照常显示。可作正文（≥ 4.5:1）。 |
| `success` | {color.green.600} | `#16a34a` | 成功：已完成、已复用的状态图形与状态点（StatusDot / TaskStatus / FlowNode）。只作图形色（≥ 3:1），状态文字仍用 foreground；不用于指标好坏、设备运行态（ISA-101 另有 status-*）与按钮。2026-09-23 用户决定加绿色。 |
| `success-foreground` | {color.white} | `#ffffff` | success 实心图形上的对勾：浅色 white、深色 ink。 |
| `canvas` | {color.slate.50} | `#f9fafb` | 画布底（Canvas）：比节点卡片低一档——浅色取 surface 同档，深色取品牌黑，让卡片浮在画布上。只用于画布，不作页面底。 |
| `canvas-dot` | {color.slate.300} | `#babdc3` | 画布点阵（Canvas 底纹）：浅色比 border 深一档、深色取 border 同档，点小而疏，只作平移缩放的参照，不承载信息。灰色跟随主色。 |
| `alarm-p2-edge` | {color.ink} | `#0a0604` | 【告警专用】P2 图形的描边色：浅色主题为品牌黑 ink（亮黄在白底上不可辨，靠描边识别形状），深色主题等于 alarm-p2（黄在品牌黑上本身足够醒目，不加描边）。P2 的横幅、模拟量条越限边框也用它。 |

## 语义色 · orange-dark（橙色 · 深色，active）

| token | 指向 | 值 | 用途 |
| --- | --- | --- | --- |
| `background` | {color.ink} | `#0a0604` | 页面底。 |
| `foreground` | {color.gray.50} | `#fafafa` | 默认文字。 |
| `card` | {color.gray.900} | `#1f1f1f` | Card 底。 |
| `card-foreground` | {color.gray.50} | `#fafafa` | Card 内文字。 |
| `popover` | {color.gray.900} | `#1f1f1f` | 弹层底（Dropdown、Tooltip、Dialog）。 |
| `popover-foreground` | {color.gray.50} | `#fafafa` | 弹层内文字。 |
| `primary` | {color.orange.500} | `#fe5d33` | 主按钮、选中态、进度。封面大面积用 gradient-brand，不用把 primary 铺成单色底。 |
| `primary-foreground` | {color.white} | `#ffffff` | primary 上的文字、图标、勾选标记。橙色与蓝色主题都用 white。白在 #FE5D33 上 3.1:1、在 primary-hover 上 3.4:1，未达正文 4.5，按效果保留。 |
| `primary-hover` | {color.orange.600} | `#f0572f` | primary 的悬停/按下态，同色相略深；不用 shadcn 默认的 primary/90 透明度写法（橙色上会发灰）。 |
| `primary-text` | {color.orange.300} | `#fe9e85` | 品牌色小字与链接悬停色。只放在 background 上；正文链接优先用 foreground + primary 下划线。 |
| `secondary` | {color.gray.800} | `#353535` | 次级按钮、Tabs 底。 |
| `secondary-foreground` | {color.gray.50} | `#fafafa` | secondary 上的文字。 |
| `muted` | {color.gray.800} | `#353535` | 弱化底：表格行悬停、分段控件与页签的底槽、骨架屏、禁用输入框；在白底上比 surface 深一档，小块控件才看得出轮廓。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `muted-foreground` | {color.gray.400} | `#9e9e9e` | 说明文字、占位符、标注。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `surface` | {color.gray.900} | `#1f1f1f` | 比 background 低一级的面：侧栏、区块底、代码块、示例舞台、表格表头（与侧栏同色，2026-09-23 用户选定）。浅色 gray-50，深色 gray-800。所有浅灰底只从 surface / muted / border 三档取，不用 color-mix 另造灰。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `accent` | {color.orange.950} | `#562517` | 悬停行、选中行、选中菜单项底、品牌提示条。橙色主题用 orange-100，是主橙的浅底，不用金卡其。 |
| `accent-foreground` | {color.gray.50} | `#fafafa` | accent 上的文字。 |
| `destructive` | {color.red.400} | `#e45749` | 危险操作与错误态。 |
| `destructive-foreground` | {color.ink} | `#0a0604` | destructive 上的文字。 |
| `border` | {color.gray.700} | `#4d4d4d` | 分隔线与卡片描边，装饰用。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `input` | {color.gray.700} | `#4d4d4d` | 输入框描边。焦点时换 ring。 |
| `ring` | {color.orange.300} | `#fe9e85` | 键盘焦点环，2px 实线。 |
| `sidebar` | {color.gray.900} | `#1f1f1f` | 侧栏底，沿用 VI 版面左侧灰色区。 |
| `sidebar-foreground` | {color.gray.50} | `#fafafa` | 侧栏文字。 |
| `sidebar-primary` | {color.orange.500} | `#fe5d33` | 侧栏当前项、主操作。 |
| `sidebar-primary-foreground` | {color.white} | `#ffffff` | sidebar-primary 上的文字。与 primary-foreground 同为 white。 |
| `sidebar-accent` | {color.gray.800} | `#353535` | 侧栏导航项的悬停与选中底，与 muted 同一档（浅色 gray-100、深色 gray-800），中性灰，不用品牌色或金卡其。 |
| `sidebar-accent-foreground` | {color.gray.50} | `#fafafa` | sidebar-accent 上的文字。 |
| `sidebar-border` | {color.gray.700} | `#4d4d4d` | 侧栏分隔线。 |
| `sidebar-ring` | {color.orange.300} | `#fe9e85` | 侧栏焦点环。 |
| `icon-default` | {color.gray.50} | `#fafafa` | 普通导航和资源入口图标。按钮内图标默认继承按钮文字颜色。 |
| `icon-muted` | {color.gray.400} | `#9e9e9e` | 搜索等辅助图标。 |
| `icon-active` | {color.orange.300} | `#fe9e85` | 当前导航项图标。 |
| `icon-hover` | {color.gray.50} | `#fafafa` | 未选中的导航及资源入口悬停图标。 |
| `chart-1` | {color.orange.500} | `#fe5d33` | 图表主系列：本模型 / 当前方案，取主题主色。类别色里只有这一档带色相。 |
| `chart-2` | {color.gray.50} | `#fafafa` | 图表第二系列：对照组，品牌黑。 |
| `chart-3` | {color.gray.300} | `#bdbdbd` | 图表第三系列：gray-700，深中性灰，用于历史或其他方案。深于基线，避免和虚线同色。 |
| `chart-4` | {color.gray.500} | `#808080` | 图表第四系列：gray-400，浅中性灰，只作面积与柱。在 white 上 2.7:1，线图需 2px 以上并配标签。不用金卡其。 |
| `chart-5` | {color.gray.400} | `#9e9e9e` | 图表第五系列：gray-600，中性灰。不用主色深阶，避免和 chart-1 变成同一色相的两档。超过 5 个系列改用小倍数图或交互筛选。 |
| `chart-baseline` | {color.gray.500} | `#808080` | 基线与阈值参考线：gray-500，虚线。 |
| `chart-grid` | {color.gray.800} | `#353535` | 网格线：与 border 同值。 |
| `chart-axis` | {color.gray.400} | `#9e9e9e` | 坐标轴刻度文字：与 muted-foreground 同值。 |
| `chart-seq-1` | {color.orange.900} | `#672c1b` | 顺序色阶最浅（数值最小）。 |
| `chart-seq-2` | {color.orange.700} | `#ba4a17` | 顺序色阶第二档。 |
| `chart-seq-3` | {color.orange.500} | `#fe5d33` | 顺序色阶第三档。 |
| `chart-seq-4` | {color.orange.300} | `#fe9e85` | 顺序色阶第四档。 |
| `chart-seq-5` | {color.orange.200} | `#ffc5b6` | 顺序色阶最深（数值最大），与主色深阶一致。 |
| `surface-glass` | #1f1f1f99 | `#1f1f1f99` | 监控大屏的玻璃面板底：只在品牌黑、且面板叠在地图 / 视频 / 热力底图上时用，配合 --blur-glass 做背景模糊。深色为 900 档 60% 不透明（橙 gray-900、蓝 slate-900），是灰底规则里唯一带透明度的面，不另造；浅色主题等于 card 实色，自动失效。 |
| `glow` | #fe5d3357 | `#fe5d3357` | 监控大屏的强调光晕色：本屏最重要的一个指标背后的静止柔光（.sa-glow 从左上角径向渐变）。深色取主色 34%（橙）/ 50%（蓝，blue-400 偏暗故加浓）；浅色主题为 transparent，自动失效。一屏一处。 |
| `lit-shadow` | transparent | `transparent` | 光影质感的投影色（v0.39.0）：所有 shadow-lit-* 按 6%–28% 混入它。浅色橙取品牌黑 ink（暖调），浅色蓝取 blue-700（投影带一点蓝，而不是灰黑）；深色主题为 transparent，光影档自动失效。只作投影，不作文字、描边或填充色。 |
| `alarm-p1` | {color.red.500} | `#e22028` | 【告警专用】P1 紧急告警：PlantPAx P1 红，浅色与深色共用。只给告警标记、告警横幅与设备故障，不得复用于装饰、按钮、destructive 或图表系列。永远与菱形 + 数字 1 同时出现，不单靠颜色。 |
| `alarm-p1-foreground` | {color.white} | `#ffffff` | alarm-p1 上的数字与文字：white（4.7:1）。 |
| `alarm-p2` | {color.yellow.400} | `#f5c000` | 【告警专用】P2 高优先级告警：琥珀黄 yellow-400，深浅主题共用（2026-09-23 用户决定不用行业橙，避免与品牌橙撞色；浅色主题采用亮黄填充 + 深色描边）。永远与三角形 + 数字 2 同时出现。不得复用于装饰、按钮或图表系列。 |
| `alarm-p2-foreground` | {color.ink} | `#0a0604` | alarm-p2 上的数字与文字：ink（浅色 5.4:1、深色 11.9:1）。 |
| `alarm-p3` | {color.purple.500} | `#916aad` | 【告警专用】P3 中优先级告警：紫，参照 PlantPAx #916AAD（浅色压暗为 purple-600）。永远与方形 + 数字 3 同时出现。不得复用于装饰、按钮或图表系列。 |
| `alarm-p3-foreground` | {color.ink} | `#0a0604` | alarm-p3 上的数字与文字：浅色 white（5.6:1），深色 ink（4.7:1）。 |
| `alarm-p4` | {color.gray.50} | `#fafafa` | 【告警专用】P4 低优先级告警：中性，不带色相，等于前景色；标记画成空心圆描边 + 数字 4，靠形状与编号区分。 |
| `alarm-p4-foreground` | {color.ink} | `#0a0604` | alarm-p4 实心底上的文字：与页面底同值（浅色 white、深色 ink）。 |
| `status-running` | {color.gray.50} | `#fafafa` | 【设备运行态】运行：实心圆，最亮 / 最深的中性色（= 前景色）。按 ISA-101 靠明暗与形状区分，运行与停止不用红绿。 |
| `status-idle` | {color.gray.300} | `#bdbdbd` | 【设备运行态】待机：粗描边空心圆，灰阶 700（深色 300）。 |
| `status-stopped` | {color.gray.500} | `#808080` | 【设备运行态】计划停机：实心方形，灰阶 500，比运行暗。 |
| `status-fault` | {color.red.500} | `#e22028` | 【设备运行态】故障停机：叉形，唯一带色相的运行态，取 alarm-p1；不用菱形（P1 告警的形状），也不用圆（色弱时与运行分不开）。 |
| `status-maintenance` | {color.gray.400} | `#9e9e9e` | 【设备运行态】维护：空心方形，灰阶 600（深色 400）。 |
| `status-offline` | {color.gray.500} | `#808080` | 【设备运行态】离线 / 无通讯：虚线空心圆，灰阶 500，与计划停机同明度、靠形状区分。 |
| `quality-bad` | {color.gray.50} | `#fafafa` | 【测点数据质量】坏值：最强的中性色（= 前景色），配斜线与「坏值」标签；数值加删除线，表示读数不可信。 |
| `quality-stale` | {color.gray.400} | `#9e9e9e` | 【测点数据质量】陈旧（超时未更新）：数值与标签压暗到灰阶 600（深色 400），配时钟图标与已过时长。可作正文（≥ 4.5:1）。 |
| `quality-manual` | {color.gray.300} | `#bdbdbd` | 【测点数据质量】手动替代：灰阶 700（深色 300），虚线描边标签「手动」；数值照常显示。可作正文（≥ 4.5:1）。 |
| `success` | {color.green.400} | `#4ade80` | 成功：已完成、已复用的状态图形与状态点（StatusDot / TaskStatus / FlowNode）。只作图形色（≥ 3:1），状态文字仍用 foreground；不用于指标好坏、设备运行态（ISA-101 另有 status-*）与按钮。2026-09-23 用户决定加绿色。 |
| `success-foreground` | {color.ink} | `#0a0604` | success 实心图形上的对勾：浅色 white、深色 ink。 |
| `canvas` | {color.ink} | `#0a0604` | 画布底（Canvas）：比节点卡片低一档——浅色取 surface 同档，深色取品牌黑，让卡片浮在画布上。只用于画布，不作页面底。 |
| `canvas-dot` | {color.gray.700} | `#4d4d4d` | 画布点阵（Canvas 底纹）：浅色比 border 深一档、深色取 border 同档，点小而疏，只作平移缩放的参照，不承载信息。灰色跟随主色。 |
| `alarm-p2-edge` | {color.yellow.400} | `#f5c000` | 【告警专用】P2 图形的描边色：浅色主题为品牌黑 ink（亮黄在白底上不可辨，靠描边识别形状），深色主题等于 alarm-p2（黄在品牌黑上本身足够醒目，不加描边）。P2 的横幅、模拟量条越限边框也用它。 |

## 语义色 · blue-dark（蓝色 · 深色，active）

| token | 指向 | 值 | 用途 |
| --- | --- | --- | --- |
| `background` | {color.ink} | `#0a0604` | 页面底。 |
| `foreground` | {color.slate.50} | `#f9fafb` | 默认文字。 |
| `card` | {color.slate.900} | `#1c1f25` | Card 底。 |
| `card-foreground` | {color.slate.50} | `#f9fafb` | Card 内文字。 |
| `popover` | {color.slate.900} | `#1c1f25` | 弹层底（Dropdown、Tooltip、Dialog）。 |
| `popover-foreground` | {color.slate.50} | `#f9fafb` | 弹层内文字。 |
| `primary` | {color.blue.400} | `#5270ab` | 主按钮、选中态、进度。封面大面积用 gradient-brand，不用把 primary 铺成单色底。 |
| `primary-foreground` | {color.white} | `#ffffff` | primary 上的文字、图标、勾选标记。橙色与蓝色主题都用 white。白在 #FE5D33 上 3.1:1、在 primary-hover 上 3.4:1，未达正文 4.5，按效果保留。 |
| `primary-hover` | {color.blue.500} | `#2c5198` | primary 的悬停/按下态，同色相略深；不用 shadcn 默认的 primary/90 透明度写法（橙色上会发灰）。 |
| `primary-text` | {color.blue.200} | `#b3c0da` | 品牌色小字与链接悬停色。只放在 background 上；正文链接优先用 foreground + primary 下划线。 |
| `secondary` | {color.slate.800} | `#31353d` | 次级按钮、Tabs 底。 |
| `secondary-foreground` | {color.slate.50} | `#f9fafb` | secondary 上的文字。 |
| `muted` | {color.slate.800} | `#31353d` | 弱化底：表格行悬停、分段控件与页签的底槽、骨架屏、禁用输入框；在白底上比 surface 深一档，小块控件才看得出轮廓。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `muted-foreground` | {color.slate.400} | `#9a9ea7` | 说明文字、占位符、标注。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `surface` | {color.slate.900} | `#1c1f25` | 比 background 低一级的面：侧栏、区块底、代码块、示例舞台、表格表头（与侧栏同色，2026-09-23 用户选定）。浅色 gray-50，深色 gray-800。所有浅灰底只从 surface / muted / border 三档取，不用 color-mix 另造灰。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `accent` | {color.blue.900} | `#1f2e4c` | 悬停行、选中行、选中菜单项底、品牌提示条。橙色主题用 orange-100，是主橙的浅底，不用金卡其。 |
| `accent-foreground` | {color.slate.50} | `#f9fafb` | accent 上的文字。 |
| `destructive` | {color.red.400} | `#e45749` | 危险操作与错误态。 |
| `destructive-foreground` | {color.ink} | `#0a0604` | destructive 上的文字。 |
| `border` | {color.slate.700} | `#484d57` | 分隔线与卡片描边，装饰用。灰色跟随主色：橙色主题取 gray，蓝色主题取同档 slate。 |
| `input` | {color.slate.700} | `#484d57` | 输入框描边。焦点时换 ring。 |
| `ring` | {color.blue.200} | `#b3c0da` | 键盘焦点环，2px 实线。 |
| `sidebar` | {color.slate.900} | `#1c1f25` | 侧栏底，沿用 VI 版面左侧灰色区。 |
| `sidebar-foreground` | {color.slate.50} | `#f9fafb` | 侧栏文字。 |
| `sidebar-primary` | {color.blue.400} | `#5270ab` | 侧栏当前项、主操作。 |
| `sidebar-primary-foreground` | {color.white} | `#ffffff` | sidebar-primary 上的文字。与 primary-foreground 同为 white。 |
| `sidebar-accent` | {color.slate.800} | `#31353d` | 侧栏导航项的悬停与选中底，与 muted 同一档（浅色 gray-100、深色 gray-800），中性灰，不用品牌色或金卡其。 |
| `sidebar-accent-foreground` | {color.slate.50} | `#f9fafb` | sidebar-accent 上的文字。 |
| `sidebar-border` | {color.slate.700} | `#484d57` | 侧栏分隔线。 |
| `sidebar-ring` | {color.blue.200} | `#b3c0da` | 侧栏焦点环。 |
| `icon-default` | {color.slate.50} | `#f9fafb` | 普通导航和资源入口图标。按钮内图标默认继承按钮文字颜色。 |
| `icon-muted` | {color.slate.400} | `#9a9ea7` | 搜索等辅助图标。 |
| `icon-active` | {color.blue.200} | `#b3c0da` | 当前导航项图标。 |
| `icon-hover` | {color.slate.50} | `#f9fafb` | 未选中的导航及资源入口悬停图标。 |
| `chart-1` | {color.blue.400} | `#5270ab` | 图表主系列：本模型 / 当前方案，取主题主色。类别色里只有这一档带色相。 |
| `chart-2` | {color.slate.50} | `#f9fafb` | 图表第二系列：对照组，品牌黑。 |
| `chart-3` | {color.slate.300} | `#babdc3` | 图表第三系列：gray-700，深中性灰，用于历史或其他方案。深于基线，避免和虚线同色。 |
| `chart-4` | {color.slate.500} | `#7b808b` | 图表第四系列：gray-400，浅中性灰，只作面积与柱。在 white 上 2.7:1，线图需 2px 以上并配标签。不用金卡其。 |
| `chart-5` | {color.slate.400} | `#9a9ea7` | 图表第五系列：gray-600，中性灰。不用主色深阶，避免和 chart-1 变成同一色相的两档。超过 5 个系列改用小倍数图或交互筛选。 |
| `chart-baseline` | {color.slate.500} | `#7b808b` | 基线与阈值参考线：gray-500，虚线。 |
| `chart-grid` | {color.slate.800} | `#31353d` | 网格线：与 border 同值。 |
| `chart-axis` | {color.slate.400} | `#9a9ea7` | 坐标轴刻度文字：与 muted-foreground 同值。 |
| `chart-seq-1` | {color.blue.900} | `#1f2e4c` | 顺序色阶最浅（数值最小）。 |
| `chart-seq-2` | {color.blue.500} | `#2c5198` | 顺序色阶第二档。 |
| `chart-seq-3` | {color.blue.400} | `#5270ab` | 顺序色阶第三档。 |
| `chart-seq-4` | {color.blue.300} | `#8097c1` | 顺序色阶第四档。 |
| `chart-seq-5` | {color.blue.200} | `#b3c0da` | 顺序色阶最深（数值最大），与主色深阶一致。 |
| `surface-glass` | #1c1f2599 | `#1c1f2599` | 监控大屏的玻璃面板底：只在品牌黑、且面板叠在地图 / 视频 / 热力底图上时用，配合 --blur-glass 做背景模糊。深色为 900 档 60% 不透明（橙 gray-900、蓝 slate-900），是灰底规则里唯一带透明度的面，不另造；浅色主题等于 card 实色，自动失效。 |
| `glow` | #5270ab80 | `#5270ab80` | 监控大屏的强调光晕色：本屏最重要的一个指标背后的静止柔光（.sa-glow 从左上角径向渐变）。深色取主色 34%（橙）/ 50%（蓝，blue-400 偏暗故加浓）；浅色主题为 transparent，自动失效。一屏一处。 |
| `lit-shadow` | transparent | `transparent` | 光影质感的投影色（v0.39.0）：所有 shadow-lit-* 按 6%–28% 混入它。浅色橙取品牌黑 ink（暖调），浅色蓝取 blue-700（投影带一点蓝，而不是灰黑）；深色主题为 transparent，光影档自动失效。只作投影，不作文字、描边或填充色。 |
| `alarm-p1` | {color.red.500} | `#e22028` | 【告警专用】P1 紧急告警：PlantPAx P1 红，浅色与深色共用。只给告警标记、告警横幅与设备故障，不得复用于装饰、按钮、destructive 或图表系列。永远与菱形 + 数字 1 同时出现，不单靠颜色。 |
| `alarm-p1-foreground` | {color.white} | `#ffffff` | alarm-p1 上的数字与文字：white（4.7:1）。 |
| `alarm-p2` | {color.yellow.400} | `#f5c000` | 【告警专用】P2 高优先级告警：琥珀黄 yellow-400，深浅主题共用（2026-09-23 用户决定不用行业橙，避免与品牌橙撞色；浅色主题采用亮黄填充 + 深色描边）。永远与三角形 + 数字 2 同时出现。不得复用于装饰、按钮或图表系列。 |
| `alarm-p2-foreground` | {color.ink} | `#0a0604` | alarm-p2 上的数字与文字：ink（浅色 5.4:1、深色 11.9:1）。 |
| `alarm-p3` | {color.purple.500} | `#916aad` | 【告警专用】P3 中优先级告警：紫，参照 PlantPAx #916AAD（浅色压暗为 purple-600）。永远与方形 + 数字 3 同时出现。不得复用于装饰、按钮或图表系列。 |
| `alarm-p3-foreground` | {color.ink} | `#0a0604` | alarm-p3 上的数字与文字：浅色 white（5.6:1），深色 ink（4.7:1）。 |
| `alarm-p4` | {color.slate.50} | `#f9fafb` | 【告警专用】P4 低优先级告警：中性，不带色相，等于前景色；标记画成空心圆描边 + 数字 4，靠形状与编号区分。 |
| `alarm-p4-foreground` | {color.ink} | `#0a0604` | alarm-p4 实心底上的文字：与页面底同值（浅色 white、深色 ink）。 |
| `status-running` | {color.slate.50} | `#f9fafb` | 【设备运行态】运行：实心圆，最亮 / 最深的中性色（= 前景色）。按 ISA-101 靠明暗与形状区分，运行与停止不用红绿。 |
| `status-idle` | {color.slate.300} | `#babdc3` | 【设备运行态】待机：粗描边空心圆，灰阶 700（深色 300）。 |
| `status-stopped` | {color.slate.500} | `#7b808b` | 【设备运行态】计划停机：实心方形，灰阶 500，比运行暗。 |
| `status-fault` | {color.red.500} | `#e22028` | 【设备运行态】故障停机：叉形，唯一带色相的运行态，取 alarm-p1；不用菱形（P1 告警的形状），也不用圆（色弱时与运行分不开）。 |
| `status-maintenance` | {color.slate.400} | `#9a9ea7` | 【设备运行态】维护：空心方形，灰阶 600（深色 400）。 |
| `status-offline` | {color.slate.500} | `#7b808b` | 【设备运行态】离线 / 无通讯：虚线空心圆，灰阶 500，与计划停机同明度、靠形状区分。 |
| `quality-bad` | {color.slate.50} | `#f9fafb` | 【测点数据质量】坏值：最强的中性色（= 前景色），配斜线与「坏值」标签；数值加删除线，表示读数不可信。 |
| `quality-stale` | {color.slate.400} | `#9a9ea7` | 【测点数据质量】陈旧（超时未更新）：数值与标签压暗到灰阶 600（深色 400），配时钟图标与已过时长。可作正文（≥ 4.5:1）。 |
| `quality-manual` | {color.slate.300} | `#babdc3` | 【测点数据质量】手动替代：灰阶 700（深色 300），虚线描边标签「手动」；数值照常显示。可作正文（≥ 4.5:1）。 |
| `success` | {color.green.400} | `#4ade80` | 成功：已完成、已复用的状态图形与状态点（StatusDot / TaskStatus / FlowNode）。只作图形色（≥ 3:1），状态文字仍用 foreground；不用于指标好坏、设备运行态（ISA-101 另有 status-*）与按钮。2026-09-23 用户决定加绿色。 |
| `success-foreground` | {color.ink} | `#0a0604` | success 实心图形上的对勾：浅色 white、深色 ink。 |
| `canvas` | {color.ink} | `#0a0604` | 画布底（Canvas）：比节点卡片低一档——浅色取 surface 同档，深色取品牌黑，让卡片浮在画布上。只用于画布，不作页面底。 |
| `canvas-dot` | {color.slate.700} | `#484d57` | 画布点阵（Canvas 底纹）：浅色比 border 深一档、深色取 border 同档，点小而疏，只作平移缩放的参照，不承载信息。灰色跟随主色。 |
| `alarm-p2-edge` | {color.yellow.400} | `#f5c000` | 【告警专用】P2 图形的描边色：浅色主题为品牌黑 ink（亮黄在白底上不可辨，靠描边识别形状），深色主题等于 alarm-p2（黄在品牌黑上本身足够醒目，不加描边）。P2 的横幅、模拟量条越限边框也用它。 |

## 字体

| token | 值 | 用途 |
| --- | --- | --- |
| sans | "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif | 正文与界面。 |
| display | "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif | 首屏与封面大标题。 |
| mono | "SF Mono", Menlo, Consolas, "Noto Sans Mono CJK SC", monospace | 代码、指标数值、时间戳。 |

## 间距

| token | 值 | 用途 |
| --- | --- | --- |
| 1 | 4px | 图标与文字间距、紧凑内边距。 |
| 2 | 8px | 按钮内边距（纵向）、标签内边距。 |
| 3 | 12px | 表单控件内边距。 |
| 4 | 16px | 卡片内边距、按钮横向内边距。 |
| 6 | 24px | 区块间距、栅格沟槽。 |
| 8 | 32px | 章节间距。 |
| 12 | 48px | 页面段落间距。 |
| 16 | 64px | 首屏与大区块留白。 |

## 圆角

| token | 值 | 用途 |
| --- | --- | --- |
| none | 0px | 品牌色块、版面分区，沿用 VI 直角块面。 |
| sm | 4px | 输入框、标签。 |
| md | 8px | 按钮、卡片。shadcn 的 --radius。 |
| full | 999px | 胶囊标签、头像。 |

## 图标尺寸与描边

| token | 值 | 用途 |
| --- | --- | --- |
| size-sm | 14px | 紧凑操作：按钮、搜索、复制、展开。仅缩小图形，保持控件点击区域。 |
| size-md | 16px | 导航、移动菜单、资源卡与列表箭头。 |
| size-lg | 20px | 品牌展示区域的大图标。默认刻度，可在项目内覆盖，不是图标库限制。 |
| stroke-width | 1.5 | 24 × 24 viewBox 内的描边宽度，无单位，随 SVG 尺寸等比缩放。项目可单独覆盖。 |

## 阴影与遮罩

| token | 值 | 用途 |
| --- | --- | --- |
| shadow-sm | 0 1px 2px 0 rgb(10 6 4 / 0.06) | 贴近页面的悬浮层：下拉菜单、提示、弹出框。 |
| shadow-md | 0 8px 24px -4px rgb(10 6 4 / 0.12), 0 2px 6px -2px rgb(10 6 4 / 0.06) | 对话框、抽屉、通知。 |
| shadow-node | 0 1px 2px 0 rgb(10 6 4 / 0.05), 0 4px 12px -4px rgb(10 6 4 / 0.1) | 画布上的流程节点：可拖动、浮在画布上，比 shadow-sm 多一层柔和投影；拖动与悬停时换 shadow-md。页面里的普通卡片仍用描边分层，不用它。2026-09-23 为画布质感新增。 |
| shadow-lit-1 | 0 1px 1px color-mix(in srgb, var(--lit-shadow) 6%, transparent), 0 6px 12px -4px color-mix(in srgb, var(--lit-shadow) 14%, transparent), 0 18px 30px -14px color-mix(in srgb, var(--lit-shadow) 20%, transparent) | 【光影质感】浮起：卡片、功能卡、KPI 卡、展示图标的白色底板。三层投影（贴地 / 近影 / 远影），光源在左上、投影落正下偏右。用它时去掉卡片描边，靠投影分层。投影色取语义 token --lit-shadow（浅色橙 = 品牌黑，浅色蓝 = blue-700），深色主题为 transparent 自动失效。 |
| shadow-lit-2 | 0 2px 2px color-mix(in srgb, var(--lit-shadow) 6%, transparent), 0 14px 22px -6px color-mix(in srgb, var(--lit-shadow) 20%, transparent), 0 32px 48px -16px color-mix(in srgb, var(--lit-shadow) 28%, transparent) | 【光影质感】抬起：可点击的浮起卡片悬停时，配合上移 2px（.sa-lit-hover）。不作常驻状态。 |
| shadow-lit-plate | 0 1px 1px color-mix(in srgb, var(--lit-shadow) 6%, transparent), 0 4px 8px -2px color-mix(in srgb, var(--lit-shadow) 12%, transparent), 0 12px 20px -8px color-mix(in srgb, var(--lit-shadow) 20%, transparent), inset 0 1px 0 rgb(255 255 255 / 0.9), inset 0 -1px 0 color-mix(in srgb, var(--lit-shadow) 6%, transparent) | 【光影质感】凸台：展示级图标（空状态、功能卡、引导页）的底板，底色 card → muted 145° 过渡（.sa-lit-plate），顶边一道白色高光、底边一道暗线，看起来是凸起的小台面。不要做成内凹。 |
| shadow-lit-pressed | inset 2px 2px 5px color-mix(in srgb, var(--lit-shadow) 14%, transparent), inset -2px -2px 5px rgb(255 255 255 / 0.9) | 【光影质感】按下：只给选中态与按下态（分段控件选中项、选中的筛选芯片、按下的图标按钮），底色 muted。不用于静态容器或图标底板。 |
| shadow-lit-drop | 3px 6px 5px color-mix(in srgb, var(--lit-shadow) 22%, transparent) | 【光影质感】图形落影：给 SVG 图形、插图里的物体与展示图标的图形本身，用 filter: drop-shadow(var(--shadow-lit-drop))（.sa-lit-drop）。图表主系列在 SVG 里用 feDropShadow（dx 2、dy 9、stdDeviation 5、不透明度 0.26），ECharts 用 shadowOffsetX 2、shadowOffsetY 9、shadowBlur 10，颜色取 t['lit-shadow'] 的 26%。 |
| scrim | rgb(10 6 4 / 0.5) | 模态遮罩，品牌黑 50%。 |
| blur-glass | 16px | 玻璃面板（--surface-glass）的背景模糊半径；只用于监控大屏里叠在图像底上的面板。 |

## 动效

| token | 值 | 用途 |
| --- | --- | --- |
| duration-fast | 120ms | 颜色、描边、透明度等悬停反馈。 |
| duration-base | 200ms | 展开收起、切换、侧栏宽度。 |
| duration-slow | 320ms | 对话框、抽屉进出，页面级过渡。 |
| ease-standard | cubic-bezier(0.2, 0, 0, 1) | 默认缓动，进出对称。 |
| ease-enter | cubic-bezier(0, 0, 0.2, 1) | 元素进入：快起慢停。 |
| ease-exit | cubic-bezier(0.4, 0, 1, 1) | 元素退出：慢起快走。 |

## 断点

| token | 值 | 用途 |
| --- | --- | --- |
| sm | 600px | 手机横屏 / 小平板起：多列卡片、并排按钮。 |
| md | 820px | 桌面起：固定侧栏、顶栏面包屑。 |
| lg | 1100px | 标准桌面：侧栏 222px、内容区完整栅格。 |
| xl | 1600px | 宽屏：首屏留白与字号放大。 |

## 控件尺寸

| token | 值 | 用途 |
| --- | --- | --- |
| height-sm | 28px | 紧凑档：工具栏、批量操作条、卡片内的小操作。表格行内操作改用文字按钮。 |
| height-md | 32px | 默认档：页头操作、筛选区、表单字段与提交、对话框按钮。 |
| height-lg | 36px | 强调档：首屏入口、空状态主操作。不用于表单。 |
| font-size-sm | 13px | 紧凑档控件文字。 |
| font-size-md | 14px | 默认档控件文字，与正文同号。 |
| font-size-lg | 15px | 强调档控件文字。 |

## 布局骨架

| token | 值 | 用途 |
| --- | --- | --- |
| sidebar-width | 222px | 桌面侧栏宽度。 |
| sidebar-collapsed-width | 56px | 侧栏收起为图标栏时的宽度。 |
| topbar-height | 48px | 顶栏高度，粘性定位。 |
| content-max-width | 1360px | 内容区最大宽度。 |
| prose-max-width | 720px | 长文本行宽上限。 |
| grid-gutter | 24px | 栅格沟槽，等于 space-6。 |

## 层级 z-index

| token | 值 | 用途 |
| --- | --- | --- |
| base | 0 | 普通内容。 |
| raised | 10 | 悬停抬起的卡片、拖拽中的元素。 |
| sticky | 20 | 粘性顶栏、表头。 |
| dropdown | 30 | 下拉菜单、提示、弹出框。 |
| overlay | 40 | 模态遮罩。 |
| modal | 50 | 对话框、抽屉。 |
| toast | 60 | 通知，永远在最上层。 |

## 渐变

| token | 值 | 用途 |
| --- | --- | --- |
| brand-angle | 90deg | 封面渐变走向，0° 朝上、顺时针为正。90° 即从左到右：橘红在左，橘黄在右，与 VI 色条一致。标识图形本身更斜，色条未标角度；若要改走向，只改这一处。 |
| brand | linear-gradient(var(--gradient-brand-angle), var(--color-std-orange-red) 0%, var(--color-orange-500) 62%, var(--color-std-orange-yellow) 100%) | 封面、品牌样本，以及首页主入口按钮。90° 从左到右：橘红平滑过渡到品牌橙 primary（62%），橘黄只留在右端。不在 50% 处截成纯色平台，否则会像两块颜色拼接。不含金卡其。封面标题与首页主入口按钮文字用 white（右端橘黄上约 2.2:1，按钮 12px 在橘红上 4.05:1，均未达正文 4.5，按效果保留）。封面小字标注仍用 ink。组件库里的主按钮仍用单色 primary，其上文字用 white。 |

## 排版样式

| 名称 | 字体 | 字号 / 行高 | 字重 | 用途 |
| --- | --- | --- | --- | --- |
| display-xl | display | 56px / 64px | 600 | 封面与首屏大标题。 |
| display-lg | display | 40px / 48px | 600 | 页面一级标题。 |
| heading-md | sans | 24px / 32px | 600 | 章节标题。 |
| heading-sm | sans | 18px / 26px | 600 | 卡片标题、表单分组。 |
| body | sans | 14px / 22px | 400 | 正文，foreground on background。2026-09-23 由 15/24 降为 14/22，与控件默认字号、规范站正文一致，适配数据密集界面。 |
| body-sm | sans | 13px / 20px | 400 | 说明文字、表格、标注，muted-foreground 或 foreground。 |
| label | sans | 12px / 16px | 500 | 标签、按钮小字、色票名称。 |
| mono | mono | 13px / 20px | 400 | 代码、指标数值、日志。 |

对比度实测见 dist/contrast.md。
