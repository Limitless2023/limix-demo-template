/**
 * [INPUT]: 依赖 @/components/blocks/app-shell 的 PageHeader；依赖 @/components/ui 的 Alert、Badge、Card、Tabs；
 *          依赖同目录的 CaseTab、DataTab；依赖 @/components/instant 的 InstantDemo、ContextBar、ContextDataSheet 与 @/hooks/use-instant；
 *          依赖 @/components/forecast 的 ForecastDemo；依赖 @/lib/scenario-spec 的 DEMO_MODE_LABEL
 * [OUTPUT]: 导出 ScenarioPage 组件
 * [POS]: 场景页的骨架，app/scenarios/<slug>/page.tsx 只渲染它。头部（标题、行业 · 能力、演示模式、是否连接 LimiX）+ 三个标签页
 *        （案例介绍 / 数据 / 在线预测，地址 ?tab=case | data | demo，中台按这个地址跳转）。模拟提示与报错三个标签页都显示；
 *        状态条（如即时预估的上下文条数、查看与下载）只在在线预测页显示，案例介绍与数据页用不上，数据页另有文件清单。
 *        在线预测按 spec.mode 分发：instant → InstantDemo，forecast → ForecastDemo。在线预测标签页切走时不卸载，演示状态不丢。
 *        场景有几个预测对象（spec.objects）时，标签页上方是「预测对象」切换，三个标签页都跟着它变，地址带 ?object=。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
"use client"

import * as React from "react"
import { CircleAlert, Info } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { ForecastDemo } from "@/components/forecast/forecast-demo"
import { ContextBar } from "@/components/instant/context-bar"
import { ContextDataSheet } from "@/components/instant/context-data-sheet"
import { InstantDemo } from "@/components/instant/instant-demo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useInstant } from "@/hooks/use-instant"
import type { ForecastSpec } from "@/lib/forecast-types"
import type { InstantSpec } from "@/lib/instant-types"
import {
  DEMO_MODE_LABEL,
  type ScenarioSpec,
  type ScenarioTab,
} from "@/lib/scenario-spec"

import { CaseTab } from "./case-tab"
import { DataTab } from "./data-tab"

type Props = {
  spec: InstantSpec | ForecastSpec
  /** 没配 LimiX Key：页头与公共条标明「模拟结果」 */
  mock: boolean
  initialTab: ScenarioTab
  /** 地址里的 ?object=；不认识时取第一个对象 */
  initialObject?: string
}

export function ScenarioPage(props: Props) {
  const { spec } = props
  if (spec.mode === "instant") return <InstantScenario {...props} spec={spec} />
  return (
    <ScenarioLayout
      {...props}
      mockNote="预测由近 7 天同一时刻的均值外推"
      demo={(_active, objectKey) => (
        <ForecastDemo key={objectKey} spec={spec} objectKey={objectKey} />
      )}
    />
  )
}

// 即时预估：上下文状态在三个标签页上都看得到，所以 useInstant 放在标签页外面，演示主体只拿结果
function InstantScenario({
  spec,
  mock,
  initialTab,
}: Props & { spec: InstantSpec }) {
  const api = useInstant(spec)
  const [dataOpen, setDataOpen] = React.useState(false)
  return (
    <>
      <ScenarioLayout
        spec={spec}
        mock={mock}
        initialTab={initialTab}
        mockNote="预测取上下文表里最相近 7 条记录的均值"
        error={api.error}
        bar={
          <ContextBar
            info={api.info}
            label={spec.contextLabel}
            busy={api.contextBusy}
            downloadHref={`/api/instant?scenario=${spec.slug}&download=context`}
            onView={() => setDataOpen(true)}
            onReset={() => void api.reset()}
          />
        }
        demo={(active) => <InstantDemo spec={spec} api={api} active={active} />}
      />
      <ContextDataSheet
        spec={spec}
        info={api.info}
        open={dataOpen}
        onOpenChange={setDataOpen}
      />
    </>
  )
}

function ScenarioLayout({
  spec,
  mock,
  initialTab,
  initialObject,
  mockNote,
  error,
  bar,
  demo,
}: {
  spec: ScenarioSpec
  mock: boolean
  initialTab: ScenarioTab
  initialObject?: string
  /** 模拟模式下结果怎么来的，一句话 */
  mockNote: string
  error?: string | null
  /** 状态条：只在在线预测页显示，如即时预估的上下文状态 */
  bar?: React.ReactNode
  /** 在线预测主体；active 表示标签页正显示着，objectKey 是当前预测对象 */
  demo: (active: boolean, objectKey: string) => React.ReactNode
}) {
  const [tab, setTab] = React.useState<ScenarioTab>(initialTab)
  const objects = spec.objects ?? []
  const [objectKey, setObjectKey] = React.useState(
    objects.find((o) => o.key === initialObject)?.key ?? objects[0]?.key ?? ""
  )

  // 切对象同样只改地址栏；第一个对象是默认，不带参数
  const switchObject = (next: string) => {
    setObjectKey(next)
    const url = new URL(window.location.href)
    if (next === objects[0]?.key) url.searchParams.delete("object")
    else url.searchParams.set("object", next)
    window.history.replaceState(null, "", url)
  }

  // 切标签页只改地址栏，不触发路由：刷新或转发链接时停在同一页；案例介绍是默认页，不带参数
  const switchTab = (next: ScenarioTab) => {
    setTab(next)
    const url = new URL(window.location.href)
    if (next === "case") url.searchParams.delete("tab")
    else url.searchParams.set("tab", next)
    window.history.replaceState(null, "", url)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`${spec.industry} · ${spec.capability}`}
        title={spec.title}
        description={spec.description}
        actions={
          <>
            <Badge variant="outline">{DEMO_MODE_LABEL[spec.mode]}</Badge>
            <Badge variant={mock ? "outline" : "accent"}>
              {mock ? "模拟模式" : "已连接 LimiX"}
            </Badge>
          </>
        }
      />

      {mock ? (
        <Alert role="status">
          <Info strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>模拟结果，未连接 LimiX</AlertTitle>
          <AlertDescription>
            没有配置 LIMIX_API_KEY，{mockNote}，只用于走通演示流程。
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <CircleAlert strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>出了点问题</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {objects.length > 1 ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span id="scenario-object" className="text-muted-foreground">
            预测对象
          </span>
          <ToggleGroup
            variant="segmented"
            aria-labelledby="scenario-object"
            value={[objectKey]}
            onValueChange={(next) => next[0] && switchObject(next[0])}
          >
            {objects.map((o) => (
              <ToggleGroupItem key={o.key} value={o.key}>
                {o.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(next) => switchTab(next as ScenarioTab)}
        className="gap-6"
      >
        <TabsList variant="line">
          <TabsTrigger value="case">案例介绍</TabsTrigger>
          <TabsTrigger value="data">数据</TabsTrigger>
          <TabsTrigger value="demo">在线预测</TabsTrigger>
        </TabsList>

        {bar && tab === "demo" ? (
          <Card size="sm">
            <CardContent>{bar}</CardContent>
          </Card>
        ) : null}

        <TabsContent value="case">
          <CaseTab
            spec={spec}
            objectKey={objectKey}
            onStart={() => switchTab("demo")}
          />
        </TabsContent>
        <TabsContent value="data">
          <DataTab key={objectKey} spec={spec} objectKey={objectKey} />
        </TabsContent>
        <TabsContent value="demo" keepMounted>
          {demo(tab === "demo", objectKey)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
