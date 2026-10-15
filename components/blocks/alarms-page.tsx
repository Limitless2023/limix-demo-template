"use client"

import * as React from "react"
import { Activity, Download } from "lucide-react"

import { PageHeader } from "@/components/blocks/app-shell"
import { AlarmBanner } from "@/components/ui/alarm-banner"
import { AlarmMark, type AlarmPriority } from "@/components/ui/alarm-mark"
import { AlarmState, type AlarmStateValue } from "@/components/ui/alarm-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AssetTree, type AssetNode } from "@/components/ui/asset-tree"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { EventList, type EventItem } from "@/components/ui/event-list"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatusDot } from "@/components/ui/status-dot"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

// 告警中心：告警横幅 → 标题区 → 汇总行 → 区域树 + 筛选条 + 告警表 → LimiX 预警 + 处置记录 → 搁置抽屉
// （规则见页型「告警中心」）。放在 AppShell 的内容区里使用；面包屑「工作台 / 告警中心」由 AppShell 顶栏负责。
// 约束：告警优先级与状态只用 AlarmMark / AlarmState 表达（颜色 + 形状 + 编号），整行不上色、不闪；
// 只有「未确认激活」的标记闪烁。LimiX 预警用 Alert 单列，不用 alarm-*、不参与确认与搁置、不计入告警数。
// 品牌橙只出现在搁置抽屉的主按钮（及焦点环）上。

type Alarm = {
  id: number
  priority: AlarmPriority
  message: string
  source: string
  area: string
  unit: string
  time: string
  state: AlarmStateValue
  meta?: string
}
type View = "active" | "unack" | "shelved" | "all"
// 演示状态：真实页面由告警服务决定，没有这个切换。
type Mode = "normal" | "empty" | "flood" | "offline" | "fail"

const ACTIVE: AlarmStateValue[] = ["unack-active", "ack-active", "unack-rtn", "latched"]
const QUIET: AlarmStateValue[] = ["shelved", "suppressed", "out-of-service"]
const isActive = (a: Alarm) => ACTIVE.includes(a.state)
const isUnacked = (a: Alarm) => a.state === "unack-active" || a.state === "unack-rtn"
// 告警洪流时表格只渲染前 200 条。
const MAX_ROWS = 200
const OPERATOR = "值班长 李工"
const LAST_UPDATE = "14:05"

// 示例数据：某钢厂热轧车间与能源动力车间的告警，不代表真实工况。
const SAMPLE: Alarm[] = [
  { id: 1, priority: 1, message: "加热炉 4 区炉温高高限", source: "TI-2104", area: "l2250", unit: "3 号加热炉", time: "14:02:31", state: "unack-active" },
  { id: 2, priority: 2, message: "精轧 F3 轧制力偏差 > 8%", source: "PT-3307", area: "l2250", unit: "精轧 F3 机架", time: "13:58:10", state: "unack-active" },
  { id: 3, priority: 1, message: "F3 液压 AGC 伺服阀故障", source: "ZS-3310", area: "l2250", unit: "精轧 F3 机架", time: "13:55:47", state: "latched" },
  { id: 4, priority: 3, message: "助燃风机出口压力偏低", source: "PI-2150", area: "l2250", unit: "3 号加热炉", time: "13:51:08", state: "ack-active" },
  { id: 5, priority: 3, message: "层流冷却 3 区水温偏高", source: "TI-4512", area: "l2250", unit: "层流冷却", time: "13:47:02", state: "unack-rtn" },
  { id: 6, priority: 2, message: "2 号锅炉汽包水位低", source: "LI-7201", area: "util", unit: "2 号锅炉", time: "13:44:19", state: "ack-active" },
  { id: 7, priority: 4, message: "卷取张力波动", source: "WT-5102", area: "l2250", unit: "1 号卷取机", time: "13:20:44", state: "shelved", meta: "剩余 42 分钟" },
  { id: 8, priority: 4, message: "炉膛压力测点坏值", source: "PI-2201", area: "l2250", unit: "3 号加热炉", time: "13:40:12", state: "suppressed", meta: "测点检修" },
]

// 演示「告警洪流」：层流冷却集管短时间连续报警，凑够超过 200 条。
const FLOOD: Alarm[] = Array.from({ length: 236 }, (_, i) => {
  const sec = 3600 * 13 + 60 * 59 - i * 7
  const hh = String(Math.floor(sec / 3600)).padStart(2, "0")
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0")
  const ss = String(sec % 60).padStart(2, "0")
  return {
    id: 1000 + i,
    priority: i % 5 === 0 ? 3 : 4,
    message: `层流冷却 ${(i % 8) + 1} 区集管压力波动`,
    source: `PI-46${String(i % 100).padStart(2, "0")}`,
    area: "l2250",
    unit: "层流冷却",
    time: `${hh}:${mm}:${ss}`,
    state: "unack-active",
  }
})

// 区域：选中车间或厂区时，按其下所有产线过滤。
const AREAS: { id: string; label: string; kind: AssetNode["kind"]; children?: { id: string; label: string }[] }[] = [
  { id: "hsm", label: "热轧车间", kind: "workshop", children: [{ id: "l2250", label: "2250 产线" }, { id: "l1580", label: "1580 产线" }] },
  { id: "utilw", label: "能源动力车间", kind: "workshop", children: [{ id: "util", label: "锅炉房" }] },
]
const AREA_SCOPE: Record<string, { label: string; lines: string[] | null }> = {
  plant: { label: "东区钢厂", lines: null },
  ...Object.fromEntries(AREAS.map((w) => [w.id, { label: w.label, lines: (w.children ?? []).map((c) => c.id) }])),
  ...Object.fromEntries(AREAS.flatMap((w) => (w.children ?? []).map((c) => [c.id, { label: `${w.label} · ${c.label}`, lines: [c.id] }]))),
}

const VIEWS: { value: View; label: string }[] = [
  { value: "active", label: "激活" },
  { value: "unack", label: "未确认" },
  { value: "shelved", label: "搁置 / 抑制" },
  { value: "all", label: "全部" },
]
const MODES: { value: Mode; label: string }[] = [
  { value: "normal", label: "正常" },
  { value: "empty", label: "无激活告警" },
  { value: "flood", label: "告警洪流" },
  { value: "offline", label: "采集中断" },
  { value: "fail", label: "写回失败" },
]
const DURATIONS = [
  { value: "30", label: "30 分钟" },
  { value: "60", label: "1 小时" },
  { value: "240", label: "4 小时" },
  { value: "480", label: "8 小时（最长）" },
]

// LimiX 预警：预测性，写对象、依据与建议；示例数据。
const WARNINGS = [
  {
    title: "助燃风机驱动端轴承：剩余寿命区间下沿早于计划检修",
    description: "3 号加热炉 · 预计 42 天（P10–P90 30–55 天），计划检修在第 35 天；建议提前到下一次换辊窗口。",
  },
  {
    title: "F3 液压 AGC 健康度 7 天下降 19 分",
    description: "精轧 F3 机架 · 伺服阀响应变慢、泄漏量上升，与当前 P1 闭锁告警相关；建议检修时一并更换。",
  },
]

const INITIAL_LOG: EventItem[] = [
  { id: "l2", time: "13:52", title: "确认 PI-2150 助燃风机出口压力偏低", meta: OPERATOR, tone: "neutral" },
  { id: "l1", time: "13:21", title: "搁置 1 小时 WT-5102 卷取张力波动", meta: `原因：换辊后已知波动 · ${OPERATOR}`, tone: "neutral" },
]

const now = () => new Date().toTimeString().slice(0, 5)
const byPriorityThenTime = (x: Alarm, y: Alarm) => x.priority - y.priority || (y.time > x.time ? 1 : y.time < x.time ? -1 : 0)
const shelfLeft = (minutes: number) => `剩余 ${minutes >= 60 ? `${minutes / 60} 小时` : `${minutes} 分钟`}`

// 区块标题 + 说明，LimiX 预警与处置记录共用。
function SectionHead({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <div className="grid gap-1">
      <h2 id={id} className="text-lg leading-6 font-semibold">{title}</h2>
      {description ? <p className="text-[13px] leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function AlarmsPage() {
  const toast = useToast()
  const [mode, setMode] = React.useState<Mode>("normal")
  const [alarms, setAlarms] = React.useState<Alarm[]>(SAMPLE)
  const [log, setLog] = React.useState<EventItem[]>(INITIAL_LOG)
  const [view, setView] = React.useState<View>("active")
  const [priority, setPriority] = React.useState("all")
  const [area, setArea] = React.useState("plant")
  const [confirmAll, setConfirmAll] = React.useState(false)
  // 搁置抽屉：当前对象、时长与原因。
  const [shelving, setShelving] = React.useState<Alarm | null>(null)
  const [duration, setDuration] = React.useState("60")
  const [reason, setReason] = React.useState("")
  const [reasonError, setReasonError] = React.useState(false)
  const logId = React.useRef(0)
  // 筛选条与搁置抽屉里的字段 id（标签与控件关联）。
  const priorityId = React.useId()
  const durationId = React.useId()
  const reasonId = React.useId()

  const offline = mode === "offline"
  const failing = mode === "fail"

  // ---------- 派生数据 ----------
  const active = alarms.filter(isActive)
  const quietCount = alarms.filter((a) => QUIET.includes(a.state)).length
  const unackedCount = active.filter(isUnacked).length
  const scope = AREA_SCOPE[area] ?? AREA_SCOPE.plant
  // 排序固定：优先级高的在前，同优先级按时间倒序。
  const visible = alarms
    .filter((a) => {
      if (scope.lines && !scope.lines.includes(a.area)) return false
      if (priority !== "all" && String(a.priority) !== priority) return false
      if (view === "active") return isActive(a)
      if (view === "unack") return isUnacked(a)
      if (view === "shelved") return QUIET.includes(a.state)
      return true
    })
    .sort(byPriorityThenTime)
  const shown = visible.slice(0, MAX_ROWS)
  const visibleUnacked = visible.filter(isUnacked)

  // 区域树：每条产线挂本区激活告警的优先级，父节点由 AssetTree 自己汇聚。
  const tree = React.useMemo<AssetNode[]>(() => {
    const lineAlarms = (id: string) => alarms.filter((a) => a.area === id && isActive(a)).map((a) => a.priority)
    return [
      {
        id: "plant",
        label: "东区钢厂",
        kind: "plant",
        children: AREAS.map((w) => ({
          id: w.id,
          label: w.label,
          kind: w.kind,
          children: (w.children ?? []).map((c) => ({ id: c.id, label: c.label, kind: "line" as const, alarms: lineAlarms(c.id) })),
        })),
      },
    ]
  }, [alarms])

  // ---------- 操作：写回失败时保持原状态并用 Toast 说明 ----------
  const record = (title: string, meta: string) => {
    logId.current += 1
    setLog((current) => [{ id: `n${logId.current}`, time: now(), title, meta, tone: "neutral" }, ...current])
  }
  const writeFailed = (what: string) => {
    toast({
      variant: "destructive",
      title: `${what}未写回，告警状态未改变`,
      description: "告警服务未响应。稍后重新操作；连续失败请联系 DCS 值班工程师。（示例）",
    })
  }
  // 确认只改变确认状态：激活的转为「已确认」，已恢复的确认后移出列表。
  const acknowledge = (list: Alarm[]) => {
    if (!list.length) return false
    if (failing) {
      writeFailed(list.length > 1 ? `确认 ${list.length} 条告警` : `确认 ${list[0].source} `)
      return false
    }
    const ids = new Set(list.map((a) => a.id))
    setAlarms((current) =>
      current
        .filter((a) => !(ids.has(a.id) && a.state === "unack-rtn"))
        .map((a) => (ids.has(a.id) && a.state === "unack-active" ? { ...a, state: "ack-active" as const } : a)),
    )
    record(
      list.length > 1 ? `确认 ${list.length} 条告警` : `确认 ${list[0].source} ${list[0].message}`,
      list.length > 1 ? `${list.slice(0, 6).map((a) => a.source).join("、")}${list.length > 6 ? " 等" : ""} · ${OPERATOR}` : OPERATOR,
    )
    return true
  }
  // 闭锁告警需要复位，确认不能替代。
  const reset = (alarm: Alarm) => {
    if (failing) return writeFailed(`复位 ${alarm.source} `)
    setAlarms((current) => current.map((a) => (a.id === alarm.id ? { ...a, state: "ack-active" as const } : a)))
    record(`复位 ${alarm.source} ${alarm.message}`, OPERATOR)
  }
  const openShelve = (alarm: Alarm) => {
    setShelving(alarm)
    setDuration("60")
    setReason("")
    setReasonError(false)
  }
  // 搁置必须有时长与原因；到时自动恢复由告警服务负责，这里只写剩余时间。
  const shelve = () => {
    if (!shelving) return
    if (!reason.trim()) {
      setReasonError(true)
      return
    }
    if (failing) return writeFailed(`搁置 ${shelving.source} `)
    const minutes = Number(duration)
    const label = DURATIONS.find((d) => d.value === duration)?.label.replace("（最长）", "") ?? ""
    setAlarms((current) => current.map((a) => (a.id === shelving.id ? { ...a, state: "shelved" as const, meta: shelfLeft(minutes) } : a)))
    record(`搁置 ${label} ${shelving.source} ${shelving.message}`, `原因：${reason.trim()} · ${OPERATOR}`)
    toast({ title: `已搁置 ${shelving.source} ${label}`, description: "到时自动恢复；搁置期间不进横幅、不计入激活数。" })
    setShelving(null)
  }
  const ackAll = () => {
    const count = visibleUnacked.length
    setConfirmAll(false)
    if (acknowledge(visibleUnacked)) toast({ title: `已确认 ${count} 条告警`, description: "确认只改变确认状态；闭锁告警仍需逐条复位。" })
  }
  const changeMode = (value: string) => {
    const next = value as Mode
    setMode(next)
    setAlarms(next === "empty" ? [] : next === "flood" ? [...SAMPLE, ...FLOOD] : SAMPLE)
  }

  return (
    <>
      {/* 告警横幅：最需要处理的一条（未确认优先，其次优先级与时间）；搁置、抑制不进横幅。 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <AlarmBanner
          className="min-w-0 flex-[1_1_320px]"
          alarms={alarms}
          onAcknowledge={
            offline
              ? undefined
              : (item) => {
                  const hit = alarms.find((a) => a.id === item.id)
                  if (hit) acknowledge([hit])
                }
          }
        />
        {offline ? <StatusDot tone="error" label="告警服务中断" meta={`最后更新 ${LAST_UPDATE}`} /> : null}
      </div>

      <PageHeader
        eyebrow="ISA-18.2 状态 · 示例数据"
        title="告警中心"
        description="东区钢厂 · 当班 08:00 起。只含控制系统报警；LimiX 预警在下方单列。"
        actions={
          <Button variant="outline" onClick={() => toast({ title: "已导出当班记录（示例）", description: "含告警、确认、搁置与复位记录。" })}>
            <Download aria-hidden="true" className="size-4" strokeWidth={1.5} />
            导出当班记录
          </Button>
        }
      />

      {/* 汇总行：P1–P4 只计激活告警；搁置 / 抑制单独计数。 */}
      <ul aria-label="告警汇总" className="m-0 grid list-none grid-cols-2 gap-3 p-0 min-[600px]:grid-cols-3 min-[1100px]:grid-cols-6">
        {([1, 2, 3, 4] as AlarmPriority[]).map((n) => (
          <li key={n} className="grid min-w-0 gap-1 rounded-md border border-border bg-card px-4 py-3 text-card-foreground">
            <AlarmMark priority={n} showLabel />
            <strong className="font-mono text-2xl leading-8 font-semibold tabular-nums">{active.filter((a) => a.priority === n).length}</strong>
          </li>
        ))}
        <li className="grid min-w-0 gap-1 rounded-md border border-border bg-card px-4 py-3 text-card-foreground">
          <span className="text-[13px] leading-5 text-muted-foreground">未确认</span>
          <strong className="font-mono text-2xl leading-8 font-semibold tabular-nums">{unackedCount}</strong>
        </li>
        <li className="grid min-w-0 gap-1 rounded-md border border-border bg-card px-4 py-3 text-card-foreground">
          <span className="text-[13px] leading-5 text-muted-foreground">搁置 / 抑制</span>
          <strong className="font-mono text-2xl leading-8 font-semibold tabular-nums">{quietCount}</strong>
        </li>
      </ul>

      {/* 主体：区域树 3 列 + 告警表 9 列；< 1100 时区域树移到表格上方整行。 */}
      <div className="grid grid-cols-12 items-start gap-4 [&>*]:min-w-0">
        <nav aria-labelledby="alarms-area-title" className="col-span-12 grid gap-2 rounded-md border border-border bg-card p-3 text-card-foreground min-[1100px]:col-span-3">
          <h2 id="alarms-area-title" className="px-1 text-lg leading-6 font-semibold">区域</h2>
          <AssetTree ariaLabel="告警区域" nodes={tree} selected="plant" showHealth={false} onSelect={(node) => setArea(AREA_SCOPE[node.id] ? node.id : "plant")} />
        </nav>

        <div className="col-span-12 grid gap-3 min-[1100px]:col-span-9">
          {/* 筛选条：状态分段 + 优先级；批量确认只作用于当前筛选结果。 */}
          <div className="flex flex-wrap items-end gap-3">
            <ToggleGroup variant="segmented" aria-label="告警状态" value={[view]} onValueChange={(next) => next[0] && setView(next[0] as View)}>
              {VIEWS.map((it) => <ToggleGroupItem key={it.value} value={it.value}>{it.label}</ToggleGroupItem>)}
            </ToggleGroup>
            <Field className="w-auto min-w-40">
              <FieldLabel htmlFor={priorityId}>优先级</FieldLabel>
              <NativeSelect id={priorityId} className="w-full" value={priority} onChange={(event) => setPriority(event.target.value)}>
                <NativeSelectOption value="all">全部优先级</NativeSelectOption>
                <NativeSelectOption value="1">P1 紧急</NativeSelectOption>
                <NativeSelectOption value="2">P2 高</NativeSelectOption>
                <NativeSelectOption value="3">P3 中</NativeSelectOption>
                <NativeSelectOption value="4">P4 低</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Button
              variant="outline"
              className="ml-auto max-[599px]:ml-0"
              disabled={offline || visibleUnacked.length === 0}
              onClick={() => setConfirmAll(true)}
            >
              确认全部未确认
            </Button>
          </div>

          {shown.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>当前筛选下没有告警</EmptyTitle>
                <EmptyDescription>切换到「全部」、换一个区域或放宽优先级后查看。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              {/* 表格在自身容器内横向滚动，页面不横向溢出；整行不上色、不闪。 */}
              <Table className={cn("min-w-[720px]", offline && "text-muted-foreground")}>
                <TableCaption>
                  告警列表 · {scope.label} · 按优先级、时间排序 · 示例数据{offline ? ` · 保留 ${LAST_UPDATE} 的最后状态` : ""}
                </TableCaption>
                <TableHeader>
                  <TableRow className="whitespace-nowrap hover:bg-transparent">
                    <TableHead>优先级 / 状态</TableHead>
                    <TableHead>告警</TableHead>
                    <TableHead>位号</TableHead>
                    <TableHead className="text-right">发生时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">
                        <AlarmState state={a.state} priority={a.priority} meta={a.meta} />
                      </TableCell>
                      <TableCell>
                        <span className="grid min-w-0">
                          <span className="text-foreground">{a.message}</span>
                          <span className="text-[13px] leading-5 text-muted-foreground">{a.unit}</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">{a.source}</TableCell>
                      <TableCell className="text-right font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">{a.time}</TableCell>
                      <TableCell className="py-2">
                        <span className="flex justify-end gap-1">
                          {isUnacked(a) ? (
                            <Button variant="ghost" size="sm" disabled={offline} aria-label={`确认 ${a.source}`} onClick={() => acknowledge([a])}>确认</Button>
                          ) : null}
                          {isActive(a) ? (
                            <Button variant="ghost" size="sm" disabled={offline} aria-label={`搁置 ${a.source}`} onClick={() => openShelve(a)}>搁置</Button>
                          ) : null}
                          {a.state === "latched" ? (
                            <Button variant="ghost" size="sm" disabled={offline} aria-label={`复位 ${a.source}`} onClick={() => reset(a)}>复位</Button>
                          ) : null}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visible.length > MAX_ROWS ? (
                <p role="status" className="text-[13px] leading-5 text-muted-foreground">
                  还有 <span className="font-mono tabular-nums">{visible.length - MAX_ROWS}</span> 条，缩小区域或优先级后查看。
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* 下方：LimiX 预警 8 列（≠ 报警）+ 处置记录 4 列；< 1100 时各占整行。 */}
      <div className="grid grid-cols-12 items-start gap-4 [&>*]:min-w-0">
        <section aria-labelledby="alarms-limix-title" className="col-span-12 grid gap-3 min-[1100px]:col-span-8">
          <SectionHead
            id="alarms-limix-title"
            title="LimiX 预警 · 预测性，无需确认"
            description="模型预测，不是控制系统报警：不参与确认与搁置，不计入告警数。示例数据。"
          />
          <div className="grid gap-2">
            {WARNINGS.map((w) => (
              <Alert key={w.title} role="status">
                <Activity aria-hidden="true" className="text-[var(--icon-default)]" strokeWidth={1.5} />
                <AlertTitle>{w.title}</AlertTitle>
                <AlertDescription>{w.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        </section>
        <section aria-labelledby="alarms-log-title" className="col-span-12 grid gap-3 min-[1100px]:col-span-4">
          <SectionHead id="alarms-log-title" title="处置记录" description="确认、搁置与复位按时间倒序，最多显示 8 条。" />
          <EventList ariaLabel="处置记录" items={log.slice(0, 8)} />
        </section>
      </div>

      {/* 页脚：示例数据标注与演示切换（真实页面由告警服务决定状态，没有这个切换）。 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[var(--layout-prose-max-width)] text-[13px] leading-5 text-muted-foreground">
          示例数据。告警按 ISA-18.2 状态流转：确认后停止闪烁；已恢复的告警确认后移出列表；闭锁告警需复位；搁置到时自动恢复。
        </p>
        <div className="flex max-w-full flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <span>演示状态</span>
          <ToggleGroup variant="segmented" size="sm" aria-label="演示状态" value={[mode]} onValueChange={(next) => next[0] && changeMode(next[0])}>
            {MODES.map((it) => <ToggleGroupItem key={it.value} value={it.value}>{it.label}</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
      </div>

      {/* 批量确认：说明范围与后果，确认不消除异常。 */}
      <ConfirmDialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title={`确认当前筛选下的 ${visibleUnacked.length} 条未确认告警？`}
        description={`范围：${scope.label} · ${VIEWS.find((v) => v.value === view)?.label ?? ""} · ${priority === "all" ? "全部优先级" : `P${priority}`}。确认只改变确认状态，不消除异常；已恢复的告警确认后移出列表，闭锁告警仍需复位。`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmAll(false)}>取消</Button>
          <Button variant="outline" onClick={ackAll}>确认 {visibleUnacked.length} 条</Button>
        </div>
      </ConfirmDialog>

      {/* 搁置抽屉：必须选时长与原因；本页唯一的 default 按钮在这里。 */}
      <Sheet
        open={shelving != null}
        onOpenChange={(open) => {
          if (!open) setShelving(null)
        }}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>搁置告警</SheetTitle>
            {shelving ? <SheetDescription>{shelving.source} · {shelving.message}</SheetDescription> : null}
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid gap-4">
              <p className="text-[13px] leading-5 text-muted-foreground">搁置后告警不进横幅、不闪烁、不响铃，到时自动恢复；搁置记录写入处置记录。</p>
              <Field>
                <FieldLabel htmlFor={durationId} required>搁置时长</FieldLabel>
                <NativeSelect id={durationId} className="w-full" aria-required value={duration} onChange={(event) => setDuration(event.target.value)}>
                  {DURATIONS.map((d) => (
                    <NativeSelectOption key={d.value} value={d.value}>{d.label}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field data-invalid={reasonError || undefined}>
                <FieldLabel htmlFor={reasonId} required>原因</FieldLabel>
                <Input
                  id={reasonId}
                  placeholder="如：F3 换辊期间的已知波动"
                  aria-required
                  aria-invalid={reasonError || undefined}
                  aria-describedby={reasonError ? `${reasonId}-desc` : undefined}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value)
                    if (event.target.value.trim()) setReasonError(false)
                  }}
                />
                {reasonError ? <FieldError id={`${reasonId}-desc`}>填写搁置原因后才能搁置。</FieldError> : null}
              </Field>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShelving(null)}>取消</Button>
            <Button onClick={shelve}>搁置</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export { AlarmsPage }
