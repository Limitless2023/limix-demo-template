# components/instant/
> L2 | 父级: ../../AGENTS.md

「即时预估」的整页组件：上下文固定，新记录来一条判一条。全部由 `InstantSpec`（`lib/instant-scenarios.ts`）驱动，换行业不改这里。

- `instant-demo.tsx`: 整页编排，场景页只渲染它。分两个 tab：「案例介绍」（场景卡）先讲，「在线演示」再演；当前 tab 写进地址 `?tab=demo`。持有输入表单、推理记录、扫描曲线三份状态，切 tab 不丢（演示 tab 隐藏时卸载，上游推送随之停止）；三种输入都汇到 `run()`。
- `records.ts`: 纯函数层。推理记录类型、来源文案、表格解析（CSV 或 Excel 粘贴的制表符文本，表头认英文列名或中文名）、数值格式。
- `scenario-card.tsx`: 「案例介绍」tab 的全部内容：场景、任务、上下文三段说明，可展开的字段说明，离线评估三项成绩（取自 metrics.json）；底部由调用方传入（上下文状态行 + 开始在线演示）。
- `context-bar.tsx`: 上下文状态行，两个 tab 共用：条数、新加入条数、上传用时、下载当前上下文 CSV、恢复初始上下文，行尾可放一个额外操作。
- `feature-form.tsx`: 手动输入表单，按输入列生成 NumberInput；单位只写在标签里；列数按卡片宽度（容器查询）取 1 / 2 / 4；step 同时是加减步长与显示小数位。
- `batch-input.tsx`: 批量输入：上传 CSV 或粘贴表格，一次最多 200 条；可下载场景的示例 CSV（spec.uploadFile）再上传，或一键填入 5 条测试记录。
- `feed-panel.tsx`: 模拟上游推送：间隔 10 / 15 / 30 秒、每批 1 / 3 / 5 条；上一批未返回时跳过这一批，不排队。
- `result-card.tsx`: 最新一条的 P50 大字、P10–P90 区间带、实测值（有则显示）与误差；还没有预测时只显示一句提示。
- `predict-progress.tsx`: 耗时小卡：一行总用时，四个环节（上传、提交、计算、取回）横排逐个点亮并写出秒数；超过 20 秒提示平台繁忙。
- `record-actions.tsx`: 一条记录的下一步：没有实测值时录入，有实测值时加入上下文，加入后标「已加入」。结果卡片与记录表共用。
- `records-table.tsx`: 推理记录表，新的在上；列序为输入、预估、区间、实测、差、来源、时间、操作；表注汇总有实测值记录的平均差与区间命中数。
- `sweep-chart.tsx`: 扫描曲线（如龄期），一次请求算完全部取值，保留上一条做对照；画法沿用 FanChart。

数据流：`instant-demo` → `hooks/use-instant.ts` → `/api/instant` → `lib/limix/instant.ts`。实测值默认显示，只用于对比：预测时服务端只收输入列（app/api/instant/validate.ts 丢弃其余列），实测值只在「加入上下文」时随记录上传。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
