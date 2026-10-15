"use client"

import * as React from "react"
import { Activity } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { AlarmBanner, type AlarmItem } from "@/components/ui/alarm-banner"
import { toPriority } from "@/components/ui/alarm-mark"
import { type AlarmStateValue } from "@/components/ui/alarm-state"
import { AnalogBar } from "@/components/ui/analog-bar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AssetTree, type AssetNode } from "@/components/ui/asset-tree"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EChart, chartTipRows, chartZoom, type ChartTokens } from "@/components/ui/echart"
import { EquipmentStatus } from "@/components/ui/equipment-status"
import { HealthScore } from "@/components/ui/health-score"
import { ProcessValue, type DataQuality } from "@/components/ui/process-value"
import { RulEstimate } from "@/components/ui/rul-estimate"
import { SetpointCard, type SetpointStatus } from "@/components/ui/setpoint-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

// 设备监控：告警横幅 → 资产树（3 列，粘性）+ 设备详情（9 列）：设备标题 → 测点读数 → 趋势与限位 → LimiX 预警 → 预测与推荐
// （规则见页型「设备监控」）。放在 AppShell 的内容区里使用：面包屑（工作台 / 设备监控 / 设备名）由 AppShell 顶栏提供。
// 颜色约定：告警色 alarm-* 只画告警标记、横幅描边、越限的限位条描边与图上的越限点；LimiX 预警（Alert）≠ 报警（Alarm），
// 只用描边 + activity 图标 + 文案。监控页的预测线用 foreground 虚线，不用品牌橙。本页没有 default 主按钮。

type Mode = "live" | "offline" | "loading"

// ---------- 示例数据：某钢厂热轧 2250 产线 3 号加热炉，不代表真实读数 ----------

const ALARMS: AlarmItem[] = [
  { id: 1, priority: 1, message: "加热炉 4 区炉温高高限", source: "TI-2104 · 3 号加热炉", time: "14:02:31", state: "unack-active" },
  { id: 2, priority: 3, message: "助燃风机出口压力偏低", source: "PI-2150 · 3 号加热炉", time: "13:51:08", state: "ack-active" },
  { id: 3, priority: 4, message: "炉膛压力测点坏值", source: "PI-2201 · 3 号加热炉", time: "13:40:12", state: "ack-active" },
]

type Point = { label: string; tag: string; value: number; unit?: string; digits?: number; quality?: DataQuality; alarmId?: number; trend?: number[]; trendBand?: [number, number] }

const POINTS: Point[] = [
  { label: "4 区炉温", tag: "TI-2104", value: 1266.9, unit: "°C", alarmId: 1 },
  { label: "出炉板坯温度", tag: "TI-2190", value: 1182.4, unit: "°C", trend: [1176, 1178, 1179, 1181, 1180, 1182, 1182.4], trendBand: [1150, 1210] },
  { label: "炉膛压力", tag: "PI-2201", value: 12.6, unit: "Pa", quality: "bad" },
  { label: "空燃比", tag: "FIC-2105", value: 1.08, digits: 2, quality: "manual" },
]

// 三区炉温共用量程与限位；4 区的设定值与推荐卡的「当前」一致。
const ZONE = { min: 1000, max: 1300, unit: "°C", limits: { ll: 1080, l: 1120, h: 1230, hh: 1260 }, normal: [1140, 1220] as [number, number] }
const ZONES = [
  { label: "2 区", tag: "TI-2102", value: 1176.5, setpoint: 1195 },
  { label: "3 区", tag: "TI-2103", value: 1212.3, setpoint: 1195 },
  { label: "4 区", tag: "TI-2104", value: 1266.9, setpoint: 1250, alarmId: 1 },
]

// 趋势：13:00 起每 90 秒一点，共 72 点；前 60 点为实测（到 14:28:30），第 48 点起为 LimiX 预测（到 14:46:30）。
const NOW = 59
const TIMES: string[] = []
const ACTUAL: Array<number | null> = []
const PREDICTED: Array<number | null> = []
for (let i = 0; i < 72; i++) {
  const base = 1188 + 22 * Math.sin(i / 10) + i * 0.9
  const seconds = 13 * 3600 + i * 90
  TIMES.push([Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((n) => String(n).padStart(2, "0")).join(":"))
  ACTUAL.push(i <= NOW ? Math.round((base + Math.sin(i * 1.9) * 5) * 10) / 10 : null)
  PREDICTED.push(i >= 48 ? Math.round((base + (i - 48) * 1.4) * 10) / 10 : null)
}
// 最后两点冲过 HH 限，末点与测点读数 TI-2104 一致。
ACTUAL[NOW - 1] = 1248.6
ACTUAL[NOW] = 1266.9

// 仍在告警横幅里的状态（与 AlarmBanner 一致）；资产树与测点只汇聚这些。
const ACTIVE: AlarmStateValue[] = ["unack-active", "ack-active", "unack-rtn", "latched"]
const isActive = (a: AlarmItem) => ACTIVE.includes(a.state ?? "unack-active")

const RECOMMENDED = { current: 1250, recommended: 1238, ramp: 5 }
const OFFLINE_MINUTES = 3

const fmt = (value: number, digits = 0) => value.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })

function buildTree(mode: Mode, fur3Alarms: string[]): AssetNode[] {
  // 加载中：先出结构，运行态、健康度与告警汇聚等数据到达后补上。
  const data = mode !== "loading"
  const eq = (id: string, label: string, status: AssetNode["status"], health?: number, alarms?: AssetNode["alarms"]): AssetNode =>
    data ? { id, label, kind: "equipment", status, health, alarms } : { id, label, kind: "equipment" }
  return [
    {
      id: "hsm",
      label: "热轧车间",
      kind: "workshop",
      children: [
        {
          id: "l2250",
          label: "2250 产线",
          kind: "line",
          children: [
            eq("fur3", "3 号加热炉", mode === "offline" ? "offline" : "running", 58, fur3Alarms),
            eq("fur4", "4 号加热炉", "idle", 81),
            eq("r1", "粗轧 R1", "running", 86),
            eq("f3", "精轧 F3 机架", "fault", 34, [2]),
            eq("dc1", "1 号卷取机", "maintenance", 91),
          ],
        },
        {
          id: "l1580",
          label: "1580 产线",
          kind: "line",
          children: [eq("fur1", "1 号加热炉", "stopped", 77), eq("f1", "精轧 F1 机架", "offline")],
        },
      ],
    },
  ]
}

function TileSkeleton({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("grid content-start gap-2 rounded-md border border-border bg-card px-4 py-3", className)}>
      {label ? <p className="text-[13px] leading-5 text-muted-foreground">{label}</p> : <Skeleton className="w-24" />}
      <Skeleton className="h-7 w-28" />
      <Skeleton className="w-36" />
    </div>
  )
}

function SectionCard({ title, description, className, children }: { title: string; description?: string; className?: string; children: React.ReactNode }) {
  return (
    <Card className={cn("min-w-0 gap-4 max-[599px]:py-4", className)}>
      <CardHeader className="max-[599px]:px-4">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="max-[599px]:px-4">{children}</CardContent>
    </Card>
  )
}

function EquipmentPage() {
  const toast = useToast()
  const [mode, setMode] = React.useState<Mode>("loading")
  const [alarms, setAlarms] = React.useState(ALARMS)
  const [device, setDevice] = React.useState("3 号加热炉")
  const [setpoint, setSetpoint] = React.useState<SetpointStatus>("pending")
  const [adopted, setAdopted] = React.useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmValue, setConfirmValue] = React.useState(RECOMMENDED.recommended)

  // 示例：首屏模拟一次加载，演示 Skeleton 占位；接真实接口时换成请求状态。
  React.useEffect(() => {
    const id = window.setTimeout(() => setMode((current) => (current === "loading" ? "live" : current)), 800)
    return () => window.clearTimeout(id)
  }, [])

  const loading = mode === "loading"
  const offline = mode === "offline"
  // 告警确认后，测点与限位条上的同一告警标记停止闪烁；闪烁只给未确认的标记，不闪整行或整卡。
  const unacked = (id?: number) => id != null && alarms.some((a) => a.id === id && (a.state ?? "unack-active").startsWith("unack"))
  // 新告警或确认后，3 号加热炉节点的告警汇聚随之更新（树上不闪烁）。
  const fur3Key = alarms.filter(isActive).map((a) => String(a.priority)).join(",")
  const tree = React.useMemo(() => buildTree(mode, fur3Key ? fur3Key.split(",") : []), [mode, fur3Key])
  const zone4Setpoint = adopted ?? RECOMMENDED.current

  // 确认：激活的转为已确认；已恢复的确认后移出横幅。
  const acknowledge = (alarm: AlarmItem) =>
    setAlarms((current) =>
      current.flatMap((a) => (a.id !== alarm.id ? [a] : a.state === "unack-rtn" ? [] : [{ ...a, state: "ack-active" as const }])),
    )

  const adopt = () => {
    setAdopted(confirmValue)
    setSetpoint("adopted")
    setConfirmOpen(false)
    toast({
      title: "已下发 4 区炉温设定（示例）",
      description: `TIC-2104.SP ${fmt(RECOMMENDED.current)} → ${fmt(confirmValue)} °C，按 ${RECOMMENDED.ramp} °C/min 爬坡。`,
    })
  }

  // 趋势图：实测 chart-2 实线 1.5px；LimiX 预测 foreground 虚线 2px；限位 chart-baseline 虚线并在线内侧标注；
  // 正常区间 muted 面积；越限点用 P1 告警色 + 菱形。采纳后的新设定也以 chart-baseline 虚线出现。
  const option = React.useCallback(
    (t: ChartTokens) => {
      const limitLines: object[] = [
        { yAxis: ZONE.limits.h, label: { formatter: `H ${fmt(ZONE.limits.h)}` } },
        { yAxis: ZONE.limits.hh, label: { formatter: `HH ${fmt(ZONE.limits.hh)}` } },
      ]
      if (adopted != null) limitLines.push({ yAxis: adopted, label: { formatter: `SP ${fmt(adopted)}`, position: "insideStartBottom" } })
      return {
        grid: { left: 8, right: 40, top: 20, bottom: 8, containLabel: true },
        tooltip: {
          trigger: "axis",
          formatter: (params: unknown) => {
            const list = params as Array<{ axisValue: string; seriesName: string; value: number | null }>
            return chartTipRows(
              list[0]?.axisValue ?? "",
              list.map((p) =>
                p.value == null
                  ? null
                  : { name: p.seriesName, value: `${fmt(p.value, 1)} °C`, color: p.seriesName === "实测" ? t["chart-2"] : t.foreground, dashed: p.seriesName !== "实测" },
              ),
            )
          },
        },
        dataZoom: chartZoom(),
        xAxis: { type: "category", data: TIMES, boundaryGap: false, axisLabel: { interval: 11, formatter: (v: string) => v.slice(0, 5) } },
        yAxis: { type: "value", min: 1140, max: 1300, interval: 40 },
        series: [
          {
            name: "实测",
            type: "line",
            data: ACTUAL,
            color: t["chart-2"],
            lineStyle: { width: 1.5 },
            markArea: { silent: true, itemStyle: { color: t.muted }, data: [[{ yAxis: ZONE.normal[0] }, { yAxis: ZONE.normal[1] }]] },
            markLine: {
              symbol: "none",
              silent: true,
              lineStyle: { color: t["chart-baseline"], type: "dashed", width: 1 },
              label: { position: "insideEndTop", color: t["chart-axis"], fontSize: 11 },
              data: limitLines,
            },
            markPoint: {
              symbol: "diamond",
              symbolSize: 12,
              silent: true,
              itemStyle: { color: t["alarm-p1"] },
              label: { show: false },
              data: [{ coord: [NOW, ACTUAL[NOW]] }],
            },
          },
          { name: "LimiX 预测", type: "line", data: PREDICTED, color: t.foreground, lineStyle: { width: 2, type: "dashed" }, z: 3 },
        ],
      }
    },
    [adopted],
  )

  const chartLabel = `4 区炉温 ${TIMES[0].slice(0, 5)}–${TIMES[NOW].slice(0, 5)} 实测与未来 18 分钟 LimiX 预测；实测 ${fmt(ACTUAL[NOW] ?? 0, 1)} °C，已越过 HH 限 ${fmt(ZONE.limits.hh)} °C，预测继续上升${adopted != null ? `；新设定 ${fmt(adopted)} °C` : ""}${offline ? "；采集中断，实测停在最后时刻" : ""}`

  return (
    <>
      {/* 告警横幅：整行，只放控制系统的报警；LimiX 预警不进横幅。窄屏时计数与按钮由组件自身折到第二行。 */}
      <AlarmBanner
        alarms={alarms}
        onAcknowledge={acknowledge}
        onOpen={() => toast({ title: "已打开告警中心（示例）" })}
        openLabel="告警中心"
      />

      {/* 12 列栅格：≥ lg 资产树 3 + 详情 9；< lg 资产树移到上方整行，最高 260px 内部滚动。 */}
      <div className="grid grid-cols-12 items-start gap-[var(--layout-grid-gutter)] max-[599px]:gap-4">
        <nav
          aria-label="资产"
          className="col-span-12 max-h-[260px] overflow-auto rounded-md border border-border bg-card p-3 min-[1100px]:sticky min-[1100px]:top-[calc(var(--layout-topbar-height)+var(--space-6))] min-[1100px]:col-span-3 min-[1100px]:max-h-[calc(100dvh-var(--layout-topbar-height)-var(--space-6)*2)]"
        >
          <h2 className="mx-1 mt-1 mb-2 text-xs leading-4 font-medium tracking-[var(--tracking-label)] text-muted-foreground">资产</h2>
          <AssetTree
            nodes={tree}
            selected="fur3"
            expanded={["hsm", "l2250"]}
            ariaLabel="热轧车间资产"
            onSelect={(node) => {
              if (node.kind === "equipment") setDevice(node.label)
            }}
          />
        </nav>

        <div aria-busy={loading} className="col-span-12 grid grid-cols-12 gap-[var(--layout-grid-gutter)] max-[599px]:gap-4 min-[1100px]:col-span-9 [&>*]:min-w-0">
          {/* 设备标题：名称 + 运行态（带持续时长）+ 型号与模型口径；操作只放 outline / ghost。 */}
          <PageHeader
            className="col-span-12"
            title={
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {device}
                {loading ? null : offline ? (
                  <EquipmentStatus state="offline" label="通讯中断" meta={`${OFFLINE_MINUTES} 分钟`} />
                ) : (
                  <EquipmentStatus state="running" meta="已运行 6 小时 12 分" />
                )}
              </span>
            }
            description={
              <>
                步进梁式加热炉 · 设计产能 320 t/h · 模型 LimiX-TS v2（炉温与能耗预测）
                <br />
                {offline ? `采集中断，最后更新 ${TIMES[NOW]}` : "数据刷新 5 秒"} · 示例数据
              </>
            }
            actions={
              <>
                <Button variant="outline" size="sm" onClick={() => toast({ title: `已为 ${device} 新建工单（示例）` })}>打开工单</Button>
                <Button variant="ghost" size="sm" onClick={() => toast({ title: "已导出近 90 分钟测点数据 CSV（示例）" })}>导出数据</Button>
              </>
            }
          />

          {/* 测点读数：数值一律前景色 mono，不随好坏变色；越限带告警标记，数据质量异常带质量标签。 */}
          {POINTS.map((point) => {
            const span = "col-span-12 min-[600px]:col-span-6 min-[1100px]:col-span-3"
            if (loading) return <TileSkeleton key={point.tag} label={point.label} className={span} />
            const alarm = alarms.find((a) => a.id === point.alarmId && isActive(a))
            return (
              <ProcessValue
                key={point.tag}
                label={point.label}
                tag={point.tag}
                value={point.value}
                unit={point.unit}
                digits={point.digits}
                quality={offline ? "stale" : point.quality}
                qualityNote={offline ? `已过 ${OFFLINE_MINUTES} 分钟` : undefined}
                alarm={alarm ? toPriority(alarm.priority) : undefined}
                alarmUnacked={unacked(point.alarmId)}
                trend={point.trend}
                trendBand={point.trendBand}
                className={span}
              />
            )
          })}

          {/* 趋势 7 列 + 限位 5 列；< lg 各占整行。图表高度不变、横向随宽度缩放。 */}
          <SectionCard
            title="4 区炉温趋势"
            description={
              offline
                ? `单位 °C；采集中断，实测停在 ${TIMES[NOW].slice(0, 5)}，不外推。`
                : "单位 °C；菱形标记为 HH 越限告警（P1）。按住 Ctrl / ⌘ 滚轮缩放。"
            }
            className="col-span-12 min-[1100px]:col-span-7"
          >
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <>
                <EChart height={240} ariaLabel={chartLabel} option={option} />
                <div aria-hidden="true" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-5 text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><i className="inline-block w-4 border-t-[1.5px] border-[var(--chart-2)]" />实测</span>
                  <span className="inline-flex items-center gap-1"><i className="inline-block w-4 border-t-2 border-dashed border-foreground" />LimiX 预测</span>
                  <span className="inline-flex items-center gap-1">
                    <i className="inline-block w-4 border-t border-dashed border-[var(--chart-baseline)]" />
                    {adopted != null ? "H / HH 限与新设定" : "H / HH 限"}
                  </span>
                  <span className="inline-flex items-center gap-1"><i className="inline-block h-2 w-4 bg-muted" />正常区间</span>
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="分区炉温" description="HH / H / L / LL 限位与设定值。" className="col-span-12 min-[1100px]:col-span-5">
            {loading ? (
              <div className="grid gap-4">
                {ZONES.map((zone) => <Skeleton key={zone.tag} className="h-14 w-full" />)}
              </div>
            ) : (
              <div className="grid gap-1">
                {ZONES.map((zone) => (
                  <AnalogBar
                    key={zone.tag}
                    {...ZONE}
                    label={zone.label}
                    tag={zone.tag}
                    value={zone.value}
                    setpoint={zone.alarmId ? zone4Setpoint : zone.setpoint}
                    alarmUnacked={unacked(zone.alarmId)}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* LimiX 预警（≠ 报警）：描边 + activity 图标 + 文案；不闪烁、不用告警色、不进横幅、不要求确认。 */}
          {loading ? null : (
            <Alert role="status" className="col-span-12">
              <Activity aria-hidden="true" className="text-[var(--icon-default)]" strokeWidth={1.5} />
              <AlertTitle>LimiX 预警：助燃风机驱动端轴承振动持续上升</AlertTitle>
              <AlertDescription>
                {`按当前趋势，剩余寿命区间下沿早于计划检修 5 天。建议把轴承更换提前到下一次换辊窗口。另：炉温预测的输入含坏值（PI-2201 炉膛压力），预测区间已放宽。${offline ? `采集中断 ${OFFLINE_MINUTES} 分钟，预测基于最后一次有效输入。` : ""}这是预测，不需要确认。`}
              </AlertDescription>
            </Alert>
          )}

          {/* 预测与推荐：健康度 4 + 剩余寿命 4（neutral）+ 推荐设定值 4；< lg 各占整行。 */}
          {loading ? (
            ["健康度", "剩余寿命", "推荐设定值"].map((label) => (
              <TileSkeleton key={label} label={label} className="col-span-12 min-h-[180px] min-[1100px]:col-span-4" />
            ))
          ) : (
            <>
              <HealthScore
                label="助燃风机"
                score={58}
                delta="−11"
                note="驱动端轴承振动上升"
                trend={[74, 72, 70, 67, 63, 61, 58]}
                meta="LimiX-TS · 10 分钟前"
                className="col-span-12 min-[1100px]:col-span-4"
              />
              <RulEstimate
                label="助燃风机轴承剩余寿命"
                value={42}
                low={30}
                high={55}
                plannedIn={35}
                tone="neutral"
                meta="今日 08:00"
                className="col-span-12 min-[1100px]:col-span-4"
              />
              {/* 采纳 = 下发到控制系统：onAdopt 返回 false 拦下，先在 Dialog 里写明位号、改动与爬坡方式。 */}
              <SetpointCard
                label="4 区炉温设定"
                tag="TIC-2104.SP"
                current={RECOMMENDED.current}
                recommended={RECOMMENDED.recommended}
                unit="°C"
                step={1}
                benefit="吨钢燃耗 −1.2%"
                confidence="P10–P90 1,231–1,244 °C"
                constraints={["出炉板坯温度 ≥ 1,150 °C"]}
                status={setpoint}
                onAdopt={(value) => {
                  setConfirmValue(value)
                  setConfirmOpen(true)
                  return false
                }}
                onReject={() => setSetpoint("rejected")}
                className="col-span-12 min-[1100px]:col-span-4"
              />
            </>
          )}
        </div>
      </div>

      {/* 页脚：示例数据标注与演示切换（真实页面由数据源决定状态，没有这个切换）。 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[var(--layout-prose-max-width)] text-[13px] leading-5 text-muted-foreground">
          示例数据，只有 3 号加热炉有读数，在资产树里切换设备只换标题。预测线用前景色虚线、实测用实线；告警只用告警色，LimiX 预警用描边 + 图标 + 文案。
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <span>演示状态</span>
          <ToggleGroup
            variant="segmented"
            size="sm"
            aria-label="演示状态"
            value={[mode]}
            onValueChange={(next) => next[0] && setMode(next[0] as Mode)}
          >
            <ToggleGroupItem value="live">实时</ToggleGroupItem>
            <ToggleGroupItem value="offline">采集中断</ToggleGroupItem>
            <ToggleGroupItem value="loading">加载中</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="下发 4 区炉温设定？"
        description={`TIC-2104.SP 将从 ${fmt(RECOMMENDED.current)} °C 改为 ${fmt(confirmValue)} °C，按 ${RECOMMENDED.ramp} °C/min 爬坡，约 ${Math.ceil(Math.abs(RECOMMENDED.current - confirmValue) / RECOMMENDED.ramp)} 分钟到位。`}
        confirmLabel="确认下发"
        onConfirm={adopt}
      >
        <p className="text-[13px] leading-5 text-muted-foreground">确认后写入控制系统，卡片显示「已采纳」，新设定以虚线出现在趋势图上。</p>
      </ConfirmDialog>
    </>
  )
}

export { EquipmentPage }
