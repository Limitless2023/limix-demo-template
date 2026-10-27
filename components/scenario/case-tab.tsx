/**
 * [INPUT]: 依赖 @/components/ui 的 Button、Card；依赖同目录的 ScenarioStory、EvalComparison；依赖 @/lib/scenario-spec 的 ScenarioSpec
 * [OUTPUT]: 导出 CaseTab 组件
 * [POS]: components/scenario 的「案例介绍」标签页，五段固定：视觉插槽、场景与痛点、LimiX 怎么做、效果、适用边界。
 *        内容全部来自 spec.case 与 spec.evaluation，没写的段不渲染，不编。页脚一行是数据出处与许可，加上许可要求署名的配图
 *        （如「图 2：作者，CC BY-SA 4.0」，链到来源）；末尾一个按钮去在线预测。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type * as React from "react"
import { Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { resolveObject, type ScenarioSpec } from "@/lib/scenario-spec"

import { EvalComparison } from "./eval-comparison"
import { ScenarioStory } from "./scenario-story"

export function CaseTab({
  spec,
  objectKey,
  onStart,
}: {
  spec: ScenarioSpec
  /** 当前预测对象：「LimiX 怎么做」与「效果」按对象取 */
  objectKey?: string
  /** 末尾「开始在线预测」：切到在线预测标签页 */
  onStart: () => void
}) {
  const { story, scene, boundary } = spec.case
  const { approach, evaluation } = resolveObject(spec, objectKey)
  return (
    <Card>
      <CardContent className="grid gap-8">
        {story ? <ScenarioStory story={story} /> : null}

        {scene?.length ? (
          <Section title="场景与痛点">
            {scene.map((p) => (
              <p
                key={p}
                className="m-0 max-w-[var(--layout-prose-max-width)] text-sm leading-[22px]"
              >
                {p}
              </p>
            ))}
          </Section>
        ) : null}

        {approach ? (
          <Section title="LimiX 怎么做">
            <dl className="m-0 grid gap-4 md:grid-cols-3">
              <Term label="输入">{approach.input}</Term>
              <Term label="输出">{approach.output}</Term>
              <Term label="怎么做">{approach.how}</Term>
            </dl>
          </Section>
        ) : null}

        {evaluation ? (
          <Section title="效果">
            <EvalComparison evaluation={evaluation} />
          </Section>
        ) : null}

        {boundary ? (
          <Section title="适用边界">
            <div className="grid gap-4 md:grid-cols-3">
              <List label="适用" items={boundary.fits} />
              <List label="不适用" items={boundary.misfits} />
              <List label="需要的数据" items={boundary.needs} />
            </div>
          </Section>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-4 border-t border-border pt-[var(--card-spacing)]">
        <p className="m-0 text-[13px] leading-5 text-muted-foreground">
          数据：{spec.data.source}，{spec.data.license}
          {story?.steps.map((step, i) =>
            step.attribution ? (
              <span key={step.image}>
                ；
                <a
                  href={step.source}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-border underline-offset-2 hover:text-foreground"
                >
                  图 {i + 1}：{step.attribution}
                </a>
              </span>
            ) : null
          )}
          。
        </p>
        <Button className="ml-auto" onClick={onStart}>
          <Play data-icon="inline-start" strokeWidth={1.5} aria-hidden="true" />
          开始在线预测
        </Button>
      </CardFooter>
    </Card>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-3">
      <h2 className="m-0 text-[15px] leading-6 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Term({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-[13px] leading-5 text-muted-foreground">{label}</dt>
      <dd className="m-0 text-sm leading-[22px]">{children}</dd>
    </div>
  )
}

function List({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="grid content-start gap-1">
      <h3 className="m-0 text-[13px] leading-5 font-normal text-muted-foreground">
        {label}
      </h3>
      <ul className="m-0 grid list-disc gap-1 pl-5 text-sm leading-[22px]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
