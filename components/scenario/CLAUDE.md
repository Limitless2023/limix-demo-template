# components/scenario/

> L2 | 父级: ../../AGENTS.md

场景页骨架：一个 slug 一页、三个标签页（案例介绍 / 数据 / 在线预测，地址 `?tab=case | data | demo`）。骨架固定，内容全部来自 `ScenarioSpec`（`lib/scenario-spec.ts`），在线预测按 `mode` 分发到各演示模式的组件。

- `scenario-page.tsx`: 场景页只渲染它。头部（行业 · 能力、演示模式、是否连接 LimiX）、模拟提示与报错、预测对象切换（有几个对象时）、三个标签页、状态条（只在在线预测页）；切标签页、切对象都只改地址栏（?tab=、?object=）。按 mode 分发：instant 由内部的 InstantScenario 创建 `useInstant`，上下文状态条作为状态条、「查看数据」侧滑面板挂在页面上，主体是 `components/instant/instant-demo.tsx`；forecast 主体是 `components/forecast/forecast-demo.tsx`。在线预测标签页 keepMounted，切走不丢状态。
- `case-tab.tsx`: 案例介绍五段（「LimiX 怎么做」与「效果」按当前对象取）：视觉插槽、场景与痛点、LimiX 怎么做、效果、适用边界；没写的段不渲染。页脚一行：数据出处与许可 + 许可要求署名的配图（链到来源），末尾按钮去在线预测。
- `data-tab.tsx`: 数据页（文件与字段按当前对象取，切对象时重挂）：口径条、字段表、文件清单、数据预览（DataGridPreview，可切文件、开关列分布）。取值范围与时间范围打开时从上下文文件现算；上传样例的中文表头按「标签（单位）」认回字段。
- `scenario-story.tsx`: 视觉插槽 L0：几步现场配图 + 一句 LimiX 替代哪一步；不写署名（在页脚）。
- `eval-comparison.tsx`: 效果：LimiX 三张指标卡 + 对比表（训练、平均绝对误差、R²；默认全部方法，`evaluation.show` 可只留几种），数字只来自 metrics.json，比例现算。

加演示模式：在 `lib/<mode>-types.ts` 扩展 ScenarioSpec，写 `components/<mode>/` 的主体，在 `scenario-page.tsx` 的 ScenarioPage 里加一个分支（需要跨标签页的状态时，像 InstantScenario 那样包一层）。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
