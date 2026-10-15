/**
 * [INPUT]: 依赖 @/components/ui/number-input 的 NumberInput；依赖 @/lib/instant-types 的 InstantSpec、InstantRow
 * [OUTPUT]: 导出 FeatureForm 组件
 * [POS]: components/instant 的手动输入表单，按场景配置的输入列逐个生成数字框。值由 instant-demo.tsx 持有。
 *        单位只写在标签里（不传 unit，输入框里只放数字）。列数按卡片宽度（容器查询）取 1 / 2 / 4，8 个输入列总是排满整行；
 *        4 列至少要 768px（每格 176px），不按视口宽度判断，因为右侧还有结果栏。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import { NumberInput } from "@/components/ui/number-input"
import type { InstantRow, InstantSpec } from "@/lib/instant-types"

export function FeatureForm({
  spec,
  values,
  onChange,
  disabled,
}: {
  spec: InstantSpec
  values: InstantRow
  onChange: (key: string, value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @3xl:grid-cols-4">
        {spec.features.map((f) => (
          <NumberInput
            key={f.key}
            label={`${f.label}（${f.unit}）`}
            value={values[f.key] ?? null}
            min={f.min}
            max={f.max}
            step={f.step}
            disabled={disabled}
            onValueChange={(v) => {
              if (v != null) onChange(f.key, v)
            }}
          />
        ))}
      </div>
    </div>
  )
}
