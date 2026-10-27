/**
 * [INPUT]: 依赖 next/image；依赖 lucide-react 的 ChevronRight；依赖 @/lib/scenario-spec 的 ScenarioStory
 * [OUTPUT]: 导出 ScenarioStory 组件
 * [POS]: components/scenario 的视觉插槽 L0，案例介绍第 1 段：几步配图串起现场流程，末尾一句点明 LimiX 替代哪一步。
 *        图片与文案全部来自 spec.case.story；需要署名的图片在案例介绍页脚署名（case-tab.tsx），这里不写。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import Image from "next/image"
import { ChevronRight } from "lucide-react"

import type { ScenarioStory as Story } from "@/lib/scenario-spec"

export function ScenarioStory({ story }: { story: Story }) {
  return (
    <div className="grid gap-3">
      <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-[repeat(3,minmax(0,1fr))]">
        {story.steps.map((s, i) => (
          <li key={s.image} className="relative grid content-start gap-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
              <Image
                src={s.image}
                alt={s.title}
                fill
                sizes="(min-width: 820px) 30vw, 100vw"
                className="object-cover"
              />
            </div>
            <p className="m-0 flex items-center gap-2 text-sm font-medium">
              <span className="grid size-5 shrink-0 place-items-center rounded-full border border-border font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
              {s.title}
            </p>
            <p className="m-0 text-[13px] leading-5 text-muted-foreground">
              {s.caption}
            </p>
            {i < story.steps.length - 1 ? (
              <ChevronRight
                className="absolute top-[calc(37.5%-10px)] -right-2 hidden size-5 translate-x-1/2 text-[var(--icon-muted)] md:block"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="m-0 rounded-md bg-accent px-4 py-3 text-sm text-accent-foreground">
        {story.limix}
      </p>
    </div>
  )
}
