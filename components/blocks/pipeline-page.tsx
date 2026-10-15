"use client"

import * as React from "react"
import { Activity, Cog, FileText, TriangleAlert, Upload, Workflow } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Canvas, type CanvasEdge, type CanvasNode } from "@/components/ui/canvas"
import { DescriptionList } from "@/components/ui/description-list"
import { TaskStatus } from "@/components/ui/task-status"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useToast } from "@/components/ui/toast"
import { VersionChip } from "@/components/ui/version-chip"

// 任务流程：页面标题区 → 画布（左）+ 选中步骤详情（右 320px）（规则见页型「任务流程」）。
// 放在 AppShell 的内容区里使用。节点按 LimiX API 的真实步骤画：数据接入 → 数据治理 → 预测任务 → 评估报告（及可选扩展任务）。

type Scenario = "queued" | "running" | "finished" | "failed"
const SCENARIO_ITEMS: { value: Scenario; label: string }[] = [
  { value: "queued", label: "排队中" },
  { value: "running", label: "运行中" },
  { value: "finished", label: "已完成" },
  { value: "failed", label: "预测失败" },
]

// 示例数据：接口与字段取自 LimiX API 文档，版本号、耗时与指标为示意值。
const BASE_NODES: CanvasNode[] = [
  { id: "train", kind: "数据接入", icon: <Upload />, title: "上传训练集", status: "succeeded", endpoint: "POST /v1/data/files", meta: [{ label: "行 × 列", value: "12,480 × 9" }], version: { id: "dv_20260918_0412", kind: "upload" } },
  { id: "gov", kind: "数据治理", icon: <Cog />, title: "确认治理", status: "succeeded", statusMeta: "18 秒", endpoint: "POST /v1/governance/tasks/confirm", meta: [{ label: "动作", value: "缺失值填补 · 删除重复行" }], version: { id: "dv_20260918_0415", kind: "governed" } },
  { id: "pred", kind: "数据接入", icon: <Upload />, title: "上传预测集", status: "reused", endpoint: "POST /v1/data/files", meta: [{ label: "行 × 列", value: "3,120 × 8" }], version: { id: "dv_20260918_0420", kind: "upload" } },
  { id: "infer", kind: "预测任务", icon: <Activity />, title: "回归预测", endpoint: "POST /v1/inference/regression/tasks" },
  { id: "truth", kind: "数据接入", icon: <Upload />, title: "上传真值集", status: "succeeded", endpoint: "POST /v1/data/files", meta: [{ label: "行 × 列", value: "3,120 × 2" }], version: { id: "dv_20260918_0421", kind: "upload" } },
  { id: "eval", kind: "评估报告", icon: <FileText />, title: "回归评估", endpoint: "POST /v1/evaluation/regression/reports" },
  { id: "causal", kind: "扩展任务", icon: <Workflow />, title: "因果解释", status: "skipped", endpoint: "POST /v1/extensions/explanations/tasks", meta: [{ label: "说明", value: "本次未开启" }] },
]
const EDGES: CanvasEdge[] = [
  { from: "train", to: "gov", label: "数据版本" },
  { from: "gov", to: "infer", label: "训练集版本" },
  { from: "pred", to: "infer", label: "预测集版本" },
  { from: "infer", to: "eval", label: "结果版本" },
  { from: "truth", to: "eval", label: "真值版本" },
  { from: "infer", to: "causal" },
]
const MODEL_META = [{ label: "模型", value: "LIMIX_16M" }, { label: "目标列", value: "rolling_force" }]
const WAITING = { status: "pending", meta: [{ label: "等待", value: "结果版本" }] }
// 预测任务按 created → queued → running → finished / failed 流转；评估是同步接口，预测完成后才提交。
const SCENARIOS: Record<Scenario, Record<string, Partial<CanvasNode>>> = {
  queued: { infer: { status: "queued", queueAhead: 2, meta: MODEL_META }, eval: WAITING },
  running: { infer: { status: "running", statusMeta: "00:42", meta: MODEL_META }, eval: WAITING },
  finished: {
    infer: { status: "finished", statusMeta: "01:36", meta: [{ label: "模型", value: "LIMIX_16M" }, { label: "结果行数", value: "3,120" }], version: { id: "rv_20260918_0431", kind: "result" } },
    eval: { status: "succeeded", statusMeta: "0.8 秒", meta: [{ label: "MAPE", value: "4.8%" }, { label: "R²", value: "0.91" }] },
  },
  failed: { infer: { status: "failed", statusMeta: "00:22", meta: [{ label: "模型", value: "LIMIX_16M" }, { label: "错误码", value: "execution_error" }] }, eval: WAITING },
}

// 详情栏：接口字段名按 API 文档写；画布上只放中文短标签。
function details(node: CanvasNode) {
  const done = node.status === "finished" || node.status === "succeeded"
  switch (node.id) {
    case "train":
      return [{ label: "接口", value: "POST /v1/data/files", mono: true }, { label: "产出", value: "data_version_id", mono: true }, { label: "文件", value: "rolling_train.csv" }, { label: "行 × 列", value: "12,480 × 9" }]
    case "gov":
      return [{ label: "接口", value: "POST /v1/governance/tasks/confirm", mono: true }, { label: "输入", value: "dv_20260918_0412", mono: true }, { label: "产出", value: "target_data_version_id", mono: true }, { label: "动作", value: "traditional_impute、deduplicate_rows", mono: true }, { label: "耗时", value: "18 秒" }]
    case "pred":
      return [{ label: "接口", value: "POST /v1/data/files", mono: true }, { label: "产出", value: "data_version_id", mono: true }, { label: "说明", value: "同一 API Key 下已有相同文件，服务端复用了已有版本（reused）" }]
    case "truth":
      return [{ label: "接口", value: "POST /v1/data/files", mono: true }, { label: "产出", value: "data_version_id", mono: true }, { label: "列", value: "sample_id、rolling_force", mono: true }]
    case "infer":
      return [
        { label: "接口", value: "POST /v1/inference/regression/tasks", mono: true },
        { label: "训练集", value: "dv_20260918_0415", mono: true },
        { label: "预测集", value: "dv_20260918_0420", mono: true },
        { label: "目标列", value: "rolling_force", mono: true },
        { label: "模型", value: "LIMIX_16M", mono: true },
        { label: "任务 ID", value: "task_reg_0412", mono: true },
        { label: "结果版本", value: done ? "rv_20260918_0431" : null, mono: true },
      ]
    case "eval":
      return [
        { label: "接口", value: "POST /v1/evaluation/regression/reports", mono: true },
        { label: "结果版本", value: done ? "rv_20260918_0431" : null, mono: true },
        { label: "真值版本", value: "dv_20260918_0421", mono: true },
        { label: "报告 ID", value: done ? "report_0412" : null, mono: true },
        { label: "说明", value: "评估为同步接口，预测完成后提交，直接返回报告" },
      ]
    default:
      return [{ label: "接口", value: "POST /v1/extensions/explanations/tasks", mono: true }, { label: "说明", value: "提交任务时未开启因果解释；需要时在结果页单独发起" }]
  }
}

function PipelinePage() {
  const toast = useToast()
  const [scenario, setScenario] = React.useState<Scenario>("running")
  const [picked, setPicked] = React.useState<string | null>("infer")
  const nodes = React.useMemo(() => BASE_NODES.map((n) => ({ ...n, ...SCENARIOS[scenario][n.id] })), [scenario])
  const infer = nodes.find((n) => n.id === "infer")!
  const evaluation = nodes.find((n) => n.id === "eval")!
  const node = picked ? nodes.find((n) => n.id === picked) ?? null : null
  // 取消只对未到终态的预测任务有效（created / queued / running）
  const cancellable = infer.status === "queued" || infer.status === "running"

  return (
    <div className="grid gap-4">
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            轧制力回归预测
            <TaskStatus status={infer.status ?? "pending"} queueAhead={infer.queueAhead} meta={infer.statusMeta} className="text-sm font-normal" />
          </span>
        }
        description={
          <>
            <code className="font-mono">task_reg_0412</code> · LIMIX_16M · 回归 · 目标列 rolling_force · 示例数据，不代表真实结果
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2 max-[599px]:w-full max-[599px]:[&>*:last-child]:ml-auto">
            {cancellable ? <Button variant="outline" onClick={() => toast({ title: "已提交取消（示例）" })}>取消任务</Button> : null}
            {infer.status === "failed" ? <Button variant="outline" onClick={() => toast({ title: "已按原配置重新提交（示例）" })}>重新提交</Button> : null}
            <Button disabled={evaluation.status !== "succeeded"} onClick={() => toast({ title: "打开评估结果页（示例）" })}>查看评估报告</Button>
          </div>
        }
      />

      {/* 示例状态切换只为演示四种状态，真实页面不放 */}
      <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
        <span>示例状态</span>
        <ToggleGroup variant="segmented" size="sm" aria-label="示例状态" value={[scenario]} onValueChange={(next) => next[0] && setScenario(next[0] as Scenario)}>
          {SCENARIO_ITEMS.map((it) => <ToggleGroupItem key={it.value} value={it.value}>{it.label}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>

      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
        <Canvas
          nodes={nodes}
          edges={EDGES}
          height={500}
          selected={picked}
          onSelect={(id) => setPicked(id)}
          ariaLabel="轧制力回归预测的调用流程"
          className="max-[599px]:!h-[420px]"
        />
        <aside aria-label="步骤详情" className="grid gap-4 rounded-md border border-border bg-card p-4">
          {node ? (
            <>
              <div>
                <p className="text-xs tracking-[0.04em] text-muted-foreground">{node.kind}</p>
                <h2 className="mt-1 mb-2 text-lg leading-[26px] font-semibold">{node.title}</h2>
                {node.status ? <TaskStatus status={node.status} queueAhead={node.queueAhead} meta={node.statusMeta} /> : null}
              </div>
              {node.id === "infer" && node.status === "failed" ? (
                <Alert variant="destructive">
                  <TriangleAlert className="size-4" aria-hidden="true" />
                  <AlertTitle>预测失败 · execution_error</AlertTitle>
                  <AlertDescription>LimiX runtime execution failed: target column rolling_force contains non-numeric values。检查训练集的目标列后重新提交。</AlertDescription>
                </Alert>
              ) : null}
              <DescriptionList items={details(node)} />
              {node.version ? <VersionChip id={node.version.id} kind={node.version.kind} /> : null}
              <div className="flex flex-wrap gap-2 empty:hidden">
                {node.id === "infer" && cancellable ? <Button variant="outline" size="sm" onClick={() => toast({ title: "已提交取消（示例）" })}>取消预测</Button> : null}
                {node.id === "infer" && node.status === "finished" ? <Button variant="outline" size="sm" onClick={() => toast({ title: "开始下载 rv_20260918_0431.csv（示例）" })}>下载结果文件</Button> : null}
                {node.id === "eval" && node.status === "succeeded" ? <Button variant="outline" size="sm" onClick={() => toast({ title: "打开评估结果页（示例）" })}>查看评估报告</Button> : null}
                {node.kind === "数据接入" && node.version ? <Button variant="outline" size="sm" onClick={() => toast({ title: "打开数据集详情（示例）" })}>查看数据集</Button> : null}
              </div>
            </>
          ) : (
            <p className="text-[13px] leading-5 text-muted-foreground">在画布上点选一个步骤，查看它的接口、输入输出与错误信息。</p>
          )}
        </aside>
      </div>
    </div>
  )
}

export { PipelinePage }
