# components/instant/
> L2 | 父级: ../../AGENTS.md

「即时预估」演示模式的组件：上下文固定，新记录来一条判一条。全部由 `InstantSpec`（`lib/instant-scenarios.ts`）驱动，换行业不改这里。页头、三个标签页、案例介绍与数据页在 `components/scenario`。

- `instant-demo.tsx`: 「在线预测」标签页的主体。`useInstant` 由 `components/scenario/scenario-page.tsx` 创建后传入（上下文状态条和「查看数据」面板在那边）。持有输入表单、推理记录、扫描曲线、上游推送收到的数据四份状态；标签页切走时不卸载，状态不丢，上游推送停下。「已加入」按加入时的重置轮次现算，状态条上恢复初始上下文后自动失效。三种输入都汇到 `run()`。
- `records.ts`: 纯函数层。推理记录类型、来源文案、表格解析（CSV 或 Excel 粘贴的制表符文本，表头认英文列名或中文名）、警戒线判定（`limitsOf` 按 `spec.limits` 从输入里取这条记录的上下限，`limitText` 说预估在线内还是越了哪条线）、数值格式。
- `context-bar.tsx`: 上下文状态行，在线预测页顶部（由 scenario-page 放置）：条数、新加入条数、上传中提示、查看数据、下载当前上下文 CSV、恢复初始上下文，行尾可放一个额外操作。
- `context-data-sheet.tsx`: 「查看数据」侧滑面板：上下文（新加入的排最前并标来源）/ 测试记录两份数据，一张 DataGridPreview（列分布默认打开，可关；分页、搜索、排序、点柱子筛选），可下载当前这份 CSV。
- `feature-form.tsx`: 手动输入表单，按输入列生成 NumberInput；单位只写在标签里；列数按卡片宽度（容器查询）取 1 / 2 / 4；step 同时是加减步长与显示小数位。
- `batch-input.tsx`: 批量输入：上传 CSV 或粘贴表格，一次最多 200 条；内容来自上传且没改过时，提交带上原文件供留痕；按钮依次是上传 CSV、填入 5 条测试记录、预测，示例 CSV（spec.uploadFile）只在说明文字里做链接。
- `feed-panel.tsx`: 模拟上游推送：间隔 10 / 15 / 30 秒、每批 1 / 3 / 5 条；上一批未返回时跳过这一批，不排队。下方列出收到的数据（收到时间、LimiX 预估或「预测中」、实测、全部输入），数据由 instant-demo 持有，切换输入方式不丢。
- `result-card.tsx`: 最新一条的 P50 大字、P10–P90 区间带、这批的警戒线区间与「预估在警戒线内 / 高于上警戒线 / 低于下警戒线」（场景配了 `limits` 时，越线用 destructive 徽章）、实测值（有则显示）与误差；还没有预测时只显示一句提示。
- `predict-progress.tsx`: 耗时小卡：一行总用时，四个环节（上传、提交、计算、取回）横排逐个点亮并写出秒数；超过 20 秒提示平台繁忙。
- `record-actions.tsx`: 一条记录的下一步：没有实测值时录入，有实测值时加入上下文，加入后标「已加入」。结果卡片与记录表共用。
- `records-table.tsx`: 推理记录表，新的在上；列序为输入、LimiX、区间、实测、误差、来源、时间、操作；「输入」悬停显示全部输入项；误差 = 预估 − 实测，带正负号；越警戒线的预估值标红；表注汇总平均绝对误差与区间命中数。
- `sweep-chart.tsx`: 扫描曲线（如龄期、燃烧器温度），一次请求算完全部取值，保留上一条做对照；曲线带着这条记录的警戒线时画两条虚线参考线，哪一档落在线内一眼可见；画法沿用 FanChart。

数据流：`instant-demo` → `hooks/use-instant.ts` → `/api/instant` → `lib/limix/instant.ts`。实测值默认显示，只用于对比：预测时服务端只收输入列（app/api/instant/validate.ts 丢弃其余列），实测值只在「加入上下文」时随记录上传。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
