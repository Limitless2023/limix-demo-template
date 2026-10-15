"use client"

import * as React from "react"
import { ArrowLeft, CircleAlert } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

// 表单页：返回 → 页面标题区 → 分组卡片（组内单列 / 双列）→ 固定底部提交区（规则见页型「表单页」）。
// 放在 AppShell 的内容区里使用；mode="edit" 为编辑态（填入现有值），loading 为编辑态加载中。
// 校验：单字段失焦时校验，已出错的字段输入时即时复核，提交时校验全部并聚焦第一个错误。

type Values = {
  name: string
  description: string
  dataset: string
  target: string
  timeColumn: string
  horizon: string
  start: string
  end: string
  model: string
  outputs: { interval: boolean; importance: boolean; byCondition: boolean }
  notify: boolean
}
type FieldKey = "name" | "dataset" | "target" | "horizon" | "end"
type Errors = Partial<Record<FieldKey, string>>

// 示例数据：数据集、列名与默认值沿用页型预览。
const DATASETS = [
  { value: "hr", label: "热轧产线 · 工况数据集" },
  { value: "boiler", label: "电厂 3 号机组" },
  { value: "cc", label: "连铸质检 · 2026Q2" },
  { value: "fgd", label: "化工 · 脱硫工段" },
  { value: "wind", label: "风电场 · 传感器" },
]
const TARGETS = [
  { value: "rolling_force", label: "rolling_force（轧制力）" },
  { value: "exit_thickness", label: "exit_thickness（出口厚度）" },
  { value: "temp", label: "temp（轧制温度）" },
]
const MODELS = [
  { value: "ts2", label: "LimiX-TS v2（时序，推荐）" },
  { value: "tab1", label: "LimiX-Tab v1（表格）" },
  { value: "xgb", label: "XGBoost 基线" },
]
const OUTPUTS: { key: keyof Values["outputs"]; label: string }[] = [
  { key: "interval", label: "置信区间（90%）" },
  { key: "importance", label: "特征重要性" },
  { key: "byCondition", label: "分工况指标" },
]

const EMPTY: Values = {
  name: "",
  description: "",
  dataset: "",
  target: "",
  timeColumn: "ts",
  horizon: "24",
  start: "2026-03-20",
  end: "2026-06-17",
  model: "ts2",
  outputs: { interval: true, importance: true, byCondition: false },
  notify: true,
}
const EXISTING: Values = {
  ...EMPTY,
  name: "热轧轧制力预测",
  description: "复制自 #2035 配置；验证 LimiX-TS v2 在三班工况下的轧制力预测。",
  dataset: "hr",
  target: "rolling_force",
}

// 按填写顺序排列，提交时按这个顺序找第一个错误。
const ORDER: FieldKey[] = ["name", "dataset", "target", "horizon", "end"]

function validate(key: FieldKey, values: Values): string {
  switch (key) {
    case "name": {
      const name = values.name.trim()
      if (!name) return "请填写评估名称"
      return name.length > 40 ? `名称不超过 40 字，当前 ${name.length} 字` : ""
    }
    case "dataset":
      return values.dataset ? "" : "请选择数据集"
    case "target":
      return values.target ? "" : "请选择目标列"
    case "horizon": {
      if (values.horizon === "") return "请填写预测步长"
      const n = Number(values.horizon)
      return Number.isInteger(n) && n >= 1 && n <= 168 ? "" : "填写 1–168 之间的整数"
    }
    case "end":
      return values.start && values.end && values.end < values.start ? "结束日期不能早于开始日期" : ""
  }
}

// 分组卡片：标题 + 一句说明，标题下有分隔线；cols=2 时 < sm 自动改单列。
function Group({ title, description, cols = 1, children }: { title: string; description: string; cols?: 1 | 2; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={cn("grid gap-4", cols === 2 && "min-[600px]:grid-cols-2")}>{children}</CardContent>
    </Card>
  )
}

// 字段外壳：标签 + 控件 + 说明 / 错误（出错时错误替换说明，位置不变）。
// children 是渲染函数，拿到 id 与 aria 属性后放到控件上，标签与说明 / 错误据此关联。
type ControlProps = {
  id: string
  "aria-invalid"?: true
  "aria-describedby"?: string
  "aria-required"?: true
}
function FormField({
  label,
  required,
  help,
  error,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Field>, "children"> & {
  label: string
  required?: boolean
  help?: string
  error?: string
  children: (control: ControlProps) => React.ReactNode
}) {
  const id = React.useId()
  const descId = `${id}-desc`
  const message = error || help
  return (
    <Field data-invalid={!!error || undefined} {...props}>
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": message ? descId : undefined,
        "aria-required": required || undefined,
      })}
      {error ? <FieldError id={descId}>{error}</FieldError> : help ? <FieldDescription id={descId}>{help}</FieldDescription> : null}
    </Field>
  )
}

function FormPage({ mode = "create", loading = false }: { mode?: "create" | "edit"; loading?: boolean }) {
  const toast = useToast()
  const id = React.useId()
  const formId = `${id}-form`
  const formRef = React.useRef<HTMLFormElement>(null)
  const [values, setValues] = React.useState<Values>(mode === "edit" ? EXISTING : EMPTY)
  const [errors, setErrors] = React.useState<Errors>({})
  const [dirty, setDirty] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [failure, setFailure] = React.useState("")
  const [leaving, setLeaving] = React.useState(false)

  const edit = mode === "edit"
  const title = edit ? "编辑评估" : "新建评估"
  const submitLabel = edit ? "保存配置" : "开始评估"

  // 关闭或刷新页面时，有未保存更改交给浏览器原生确认。
  React.useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  const check = (key: FieldKey, next: Values) => setErrors((current) => ({ ...current, [key]: validate(key, next) }))

  // 修改字段：标记未保存；已出错的字段即时复核。
  const update = <K extends keyof Values>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value }
    setValues(next)
    setDirty(true)
    if (key in errors && errors[key as FieldKey]) check(key as FieldKey, next)
    // 开始日期变化会影响结束日期的校验。
    if (key === "start" && errors.end) check("end", next)
  }
  const blur = (key: FieldKey) => check(key, values)

  const leave = () => {
    if (dirty) setLeaving(true)
    else toast({ title: "已返回评估列表（示例）" })
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const next: Errors = {}
    ORDER.forEach((key) => {
      const message = validate(key, values)
      if (message) next[key] = message
    })
    setErrors(next)
    const failed = ORDER.filter((key) => next[key])
    if (failed.length) {
      const control = formRef.current?.querySelector<HTMLElement>(`[data-field="${failed[0]}"] :is(input, select, textarea)`)
      control?.focus()
      control?.scrollIntoView({ block: "center" })
      toast({ title: `${failed.length} 个字段需要修正`, variant: "destructive" })
      return
    }
    setFailure("")
    setSubmitting(true)
    // 模拟请求：选「风电场 · 传感器」时演示提交失败，其余成功。
    window.setTimeout(() => {
      setSubmitting(false)
      if (values.dataset === "wind") {
        setFailure("「风电场 · 传感器」仍在同步 2026-06 的数据，暂不能用于评估。换一个数据集，或等同步完成（约 20 min）后再提交；已填内容已保留。")
        formRef.current?.scrollIntoView({ block: "start" })
        return
      }
      setDirty(false)
      toast({ title: edit ? "配置已保存（示例）" : "评估已创建，正在排队（示例）", description: "实际使用时跳转到评估详情。" })
    }, 900)
  }

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-[var(--primary-text)]" onClick={leave}>
          <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
          返回评估列表
        </Button>
      </div>

      <PageHeader
        title={title}
        description={
          edit
            ? "修改后保存，下次运行评估时生效；必填项带星号，离开字段时校验。"
            : "选择数据集与模型，提交后在后台排队运行，完成时可在详情页查看指标；必填项带星号，离开字段时校验。"
        }
      />

      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={submit}
        aria-busy={loading || undefined}
        className="grid max-w-[var(--layout-prose-max-width)] gap-6 max-[599px]:gap-4"
      >
        {/* 提交失败：表单顶部插入 destructive Alert，字段值不清空。 */}
        {failure ? (
          <Alert variant="destructive">
            <CircleAlert strokeWidth={1.5} aria-hidden="true" />
            <AlertTitle>提交失败</AlertTitle>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          // 编辑态加载中：卡片内用 Skeleton 占住字段位置，提交区禁用。
          [3, 6, 3].map((count, index) => (
            <Card key={index}>
              <CardHeader className="gap-2 border-b border-border pb-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="w-56 max-w-full" />
              </CardHeader>
              <CardContent className={cn("grid gap-4", count > 3 && "min-[600px]:grid-cols-2")}>
                {Array.from({ length: count }, (_, field) => (
                  <div key={field} className="grid gap-2">
                    <Skeleton className="w-16" />
                    <Skeleton className="h-[var(--control-height-md)]" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {/* 先「是什么」：单列，名称与说明按阅读顺序排列。 */}
            <Group title="基本信息" description="名称用于列表与报告；说明写评估目的或与上一版本的差异。">
              <FormField data-field="name" label="评估名称" required help="列表与报告里显示的名称，40 字以内。" error={errors.name}>
                {(control) => (
                  <Input
                    {...control}
                    placeholder="例：热轧轧制力预测 · 7 月"
                    value={values.name}
                    onChange={(event) => update("name", event.target.value)}
                    onBlur={() => blur("name")}
                  />
                )}
              </FormField>
              <FormField label="说明">
                {(control) => (
                  <Textarea
                    {...control}
                    placeholder="评估目的、工况范围或与上一版本的差异"
                    value={values.description}
                    onChange={(event) => update("description", event.target.value)}
                  />
                )}
              </FormField>
            </Group>

            {/* 再「用什么数据」：双列，成对字段并排（目标列 / 时间列、开始 / 结束）。 */}
            <Group title="数据" description="选择数据集与目标列；训练区间按采样时间截取，结束日期不早于开始日期。" cols={2}>
              <FormField
                data-field="dataset"
                label="数据集"
                required
                help="只列出已同步完成或同步中的数据集。"
                error={errors.dataset}
                className="min-[600px]:col-span-2"
                onBlur={() => blur("dataset")}
              >
                {(control) => (
                  <Combobox
                    items={DATASETS}
                    value={DATASETS.find((option) => option.value === values.dataset) ?? null}
                    onValueChange={(option) => update("dataset", option?.value ?? "")}
                  >
                    <ComboboxInput {...control} placeholder="搜索数据集" />
                    <ComboboxContent>
                      <ComboboxEmpty>没有匹配项</ComboboxEmpty>
                      <ComboboxList>
                        {(option: (typeof DATASETS)[number]) => (
                          <ComboboxItem key={option.value} value={option}>{option.label}</ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )}
              </FormField>
              <FormField data-field="target" label="目标列" required error={errors.target}>
                {(control) => (
                  <NativeSelect
                    {...control}
                    value={values.target}
                    onChange={(event) => update("target", event.target.value)}
                    onBlur={() => blur("target")}
                  >
                    <NativeSelectOption value="" disabled>选择目标列</NativeSelectOption>
                    {TARGETS.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                )}
              </FormField>
              <FormField label="时间列">
                {(control) => (
                  <NativeSelect {...control} value={values.timeColumn} onChange={(event) => update("timeColumn", event.target.value)}>
                    <NativeSelectOption value="ts">ts</NativeSelectOption>
                    <NativeSelectOption value="sample_time">sample_time</NativeSelectOption>
                  </NativeSelect>
                )}
              </FormField>
              <FormField data-field="horizon" label="预测步长" required help="单位：采样点；1–168 的整数。" error={errors.horizon} className="min-[600px]:col-span-2">
                {(control) => (
                  <Input
                    {...control}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={168}
                    step={1}
                    value={values.horizon}
                    className="font-mono tabular-nums"
                    onChange={(event) => update("horizon", event.target.value)}
                    onBlur={() => blur("horizon")}
                  />
                )}
              </FormField>
              <FormField label="训练开始">
                {(control) => (
                  <Input
                    {...control}
                    type="date"
                    value={values.start}
                    className="tabular-nums"
                    onChange={(event) => update("start", event.target.value)}
                  />
                )}
              </FormField>
              <FormField data-field="end" label="训练结束" error={errors.end}>
                {(control) => (
                  <Input
                    {...control}
                    type="date"
                    value={values.end}
                    className="tabular-nums"
                    onChange={(event) => update("end", event.target.value)}
                    onBlur={() => blur("end")}
                  />
                )}
              </FormField>
            </Group>

            {/* 最后「怎么算 / 输出什么」：枚举少于 6 个用 RadioGroup，多选用 Checkbox，开关用 Switch。 */}
            <Group title="模型与输出" description="选择推理模型与报告内容；完成通知发送到站内信与邮箱。">
              <fieldset className="grid gap-2 border-0 p-0">
                <legend id={`${id}-model`} className="mb-1 text-[13px] font-medium">
                  模型<span aria-hidden="true" className="text-destructive"> *</span>
                </legend>
                <RadioGroup aria-labelledby={`${id}-model`} aria-required value={values.model} onValueChange={(value) => update("model", String(value))}>
                  {MODELS.map((option) => (
                    <Label key={option.value} className="font-normal">
                      <RadioGroupItem value={option.value} />
                      {option.label}
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>
              <fieldset className="grid gap-2 border-0 p-0">
                <legend className="mb-1 text-[13px] font-medium">输出</legend>
                {OUTPUTS.map((option) => (
                  <Label key={option.key} className="font-normal">
                    <Checkbox
                      checked={values.outputs[option.key]}
                      onCheckedChange={(checked) => update("outputs", { ...values.outputs, [option.key]: checked })}
                    />
                    {option.label}
                  </Label>
                ))}
              </fieldset>
              <Label className="w-fit font-normal">
                <Switch checked={values.notify} onCheckedChange={(on) => update("notify", on)} />
                完成后发送通知
              </Label>
            </Group>
            <p className="text-[13px] leading-5 text-muted-foreground">示例数据：数据集、列名与模型为演示用；选「风电场 · 传感器」可查看提交失败状态。</p>
          </>
        )}
      </form>

      {/* 固定底部提交区：贴底、上描边、与内容区同宽；在文档流里占位，任何宽度下都不遮挡最后一个字段。 */}
      <div className="sticky bottom-0 z-[var(--z-sticky)] -mx-6 -mb-6 border-t border-border bg-background max-[599px]:-mx-4 max-[599px]:-mb-4">
        <div className="flex items-center gap-3 px-6 py-3 max-[599px]:flex-wrap max-[599px]:px-4">
          <span role="status" className="flex flex-1 items-center gap-2 text-[13px] leading-5 text-muted-foreground max-[599px]:w-full max-[599px]:flex-none">
            {dirty ? <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /> : null}
            {loading ? "正在加载现有配置…" : dirty ? "有未保存的更改" : "尚未修改"}
          </span>
          {/* 提交中取消仍可用；主操作禁用并改文案，不弹全屏遮罩。 */}
          <Button variant="outline" disabled={loading} onClick={leave}>取消</Button>
          <Button type="submit" form={formId} disabled={loading || submitting} className="max-[599px]:ml-auto">
            {submitting ? "正在提交…" : submitLabel}
          </Button>
        </div>
      </div>

      {/* 离开确认：只在有未保存更改时出现；丢失未保存内容属于 Dialog 允许的场景。 */}
      <ConfirmDialog open={leaving} onOpenChange={setLeaving} title="放弃未保存的更改？" description="已填写的评估配置不会保存。">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setLeaving(false)}>继续编辑</Button>
          <Button
            variant="destructive"
            onClick={() => {
              setLeaving(false)
              setDirty(false)
              toast({ title: "已返回评估列表（示例）" })
            }}
          >
            放弃
          </Button>
        </div>
      </ConfirmDialog>
    </>
  )
}

export { FormPage }
