import { CircleCheck, Info } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { isMockMode, limixConfig } from "@/lib/limix/config"
import { scenarios } from "@/lib/scenarios"

export const dynamic = "force-dynamic"

export default function Home() {
  const mock = isMockMode()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="LimiX 场景 demo"
        title="选择一个场景开始演示"
        description="每个场景用一份数据走完整条链路：上传数据、调用 LimiX、看结果与业务解读。示例数据均为合成数据。"
      />

      {mock ? (
        <Alert role="status">
          <Info strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>当前为模拟模式</AlertTitle>
          <AlertDescription>没有配置 LIMIX_API_KEY，预测结果由简单规则生成，页面会标明「模拟结果」。在 .env.local 写入 Key 后重启，同一页面直接调用 LimiX。</AlertDescription>
        </Alert>
      ) : (
        <Alert variant="brand" role="status">
          <CircleCheck strokeWidth={1.5} aria-hidden="true" />
          <AlertTitle>已连接 LimiX</AlertTitle>
          <AlertDescription>
            {new URL(limixConfig.baseUrl).host} · 模型 {limixConfig.modelType}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {scenarios.map((s) => (
          <Card key={s.slug}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <s.icon className="size-5 text-[var(--icon-muted)]" strokeWidth={1.5} aria-hidden="true" />
                {s.title}
              </CardTitle>
              <CardDescription>
                {s.industry} · {s.capability}
              </CardDescription>
              <CardAction>{s.draft ? <Badge variant="outline">准备中</Badge> : <Badge variant="accent">{s.industry}</Badge>}</CardAction>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground">{s.summary}</CardContent>
            <CardFooter>
              {s.draft ? (
                <Button variant="outline" disabled>
                  准备中
                </Button>
              ) : (
                <Button variant="outline" render={<a href={`/scenarios/${s.slug}`} />} nativeButton={false}>
                  打开 demo
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
