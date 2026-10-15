"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Menu, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ToastProvider } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import limixMark from "@/lib/brand/limix-mark"
// 侧栏只显示 24px：用 96px 的小图（约 12KB），高清图转成 data URI 约 265KB，会进首屏包
import logoMark from "@/lib/brand/logo-mark-sm"
import { cn } from "@/lib/utils"

// 应用骨架：侧栏 + 顶栏 + 居中内容区，尺寸全部来自 --layout-*（规则见页型「应用骨架」）。
// 断点与 tokens 一致：md 820、lg 1100（Tailwind 默认断点不同，这里用 min-[820px] 这类写法）。
// 用法：
//   <AppShell nav={nav} breadcrumb={<Breadcrumb>…</Breadcrumb>}>
//     <PageHeader title="评估" description="…" actions={<Button>新建评估</Button>} />
//     …
//   </AppShell>

type AppShellNavItem = { label: string; href: string; icon: LucideIcon; current?: boolean }
type AppShellNavGroup = { label: string; items: AppShellNavItem[] }

const STORAGE_KEY = "sa-sidebar"

// 标识跟随主色：蓝色主题（blue-*）用 LimiX，其余用稳准智能；深色下 Logo 放在白色圆角面板上。
function useThemeBrand(brand: "auto" | "stable-ai" | "limix") {
  const [theme, setTheme] = React.useState({ blue: brand === "limix", dark: false })
  React.useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      const value = root.getAttribute("data-theme") || ""
      setTheme({
        blue: brand === "auto" ? value.startsWith("blue") : brand === "limix",
        dark: value.endsWith("-dark") || root.classList.contains("dark"),
      })
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] })
    return () => observer.disconnect()
  }, [brand])
  return theme
}

function AppShell({
  nav,
  breadcrumb,
  actions,
  footer,
  brand = "auto",
  children,
}: {
  nav: AppShellNavGroup[]
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
  footer?: React.ReactNode
  brand?: "auto" | "stable-ai" | "limix"
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [drawer, setDrawer] = React.useState(false)
  const [edgeTop, setEdgeTop] = React.useState(96)
  const firstLink = React.useRef<HTMLAnchorElement>(null)
  const theme = useThemeBrand(brand)

  // ≥ lg 默认展开，md 区间默认收起；用户切换过则记住选择。
  React.useEffect(() => {
    let saved: string | null = null
    try {
      saved = window.localStorage.getItem(STORAGE_KEY)
    } catch {}
    const md = window.matchMedia("(min-width: 820px) and (max-width: 1099px)")
    const apply = () => setCollapsed(saved ? saved === "collapsed" : md.matches)
    apply()
    md.addEventListener("change", apply)
    const wide = window.matchMedia("(min-width: 820px)")
    const closeDrawer = () => wide.matches && setDrawer(false)
    wide.addEventListener("change", closeDrawer)
    return () => {
      md.removeEventListener("change", apply)
      wide.removeEventListener("change", closeDrawer)
    }
  }, [])

  // 收起钮与第一个导航项垂直居中。
  React.useLayoutEffect(() => {
    const link = firstLink.current
    if (link) setEdgeTop(link.offsetTop + link.offsetHeight / 2 - 12)
  }, [collapsed])

  React.useEffect(() => {
    if (!drawer) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawer(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [drawer])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded")
    } catch {}
  }
  // 抽屉态（< md）总是展开显示文字。
  const iconOnly = collapsed && !drawer
  let first = true

  return (
    <ToastProvider>
      <div
        className={cn(
          "grid min-h-dvh bg-background text-foreground min-[820px]:grid-cols-[var(--sb)_minmax(0,1fr)]",
          collapsed ? "[--sb:var(--layout-sidebar-collapsed-width)]" : "[--sb:var(--layout-sidebar-width)]",
        )}
      >
        <aside
          aria-label="主导航"
          className={cn(
            "z-[var(--z-modal)] flex w-[var(--layout-sidebar-width)] flex-col border-r border-sidebar-border bg-sidebar px-2 py-3 text-sidebar-foreground",
            "max-[819px]:fixed max-[819px]:inset-y-0 max-[819px]:left-0 max-[819px]:transition-transform max-[819px]:duration-[var(--duration-slow)] max-[819px]:ease-[var(--ease-enter)] motion-reduce:transition-none",
            drawer ? "max-[819px]:translate-x-0 max-[819px]:shadow-[var(--shadow-md)]" : "max-[819px]:-translate-x-full",
            "min-[820px]:sticky min-[820px]:top-0 min-[820px]:z-[var(--z-raised)] min-[820px]:h-dvh min-[820px]:w-[var(--sb)]",
          )}
        >
          <div className="relative flex h-full flex-col">
            <div className="mb-2 flex h-10 items-center gap-2 overflow-hidden px-2 text-sm font-semibold whitespace-nowrap">
              <img
                src={theme.blue ? limixMark : logoMark}
                alt=""
                width={24}
                height={24}
                className={cn("size-6 shrink-0 object-contain", theme.dark && "rounded-sm bg-white p-0.5")}
              />
              {iconOnly ? null : <span>{theme.blue ? "LimiX" : "稳准智能"}</span>}
            </div>
            {/* TooltipProvider 默认无延迟：收起态悬停图标立即显示名称。 */}
            <TooltipProvider>
              <nav className="grid gap-0.5 overflow-hidden">
                {nav.map((group) => (
                  <div key={group.label} className="grid gap-0.5">
                    {iconOnly ? null : (
                      <p className="px-3 pt-4 pb-1 text-xs tracking-[0.04em] whitespace-nowrap text-muted-foreground">{group.label}</p>
                    )}
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const link = (
                        <a
                          ref={first ? firstLink : undefined}
                          href={item.href}
                          aria-current={item.current ? "page" : undefined}
                          aria-label={iconOnly ? item.label : undefined}
                          onClick={() => setDrawer(false)}
                          className={cn(
                            "flex h-9 flex-1 items-center gap-2 rounded-sm px-3 text-[13px] whitespace-nowrap hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-medium",
                            iconOnly && "justify-center px-0",
                          )}
                        >
                          <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                          {iconOnly ? null : <span>{item.label}</span>}
                        </a>
                      )
                      first = false
                      // 收起态只剩图标，靠 Tooltip 显示名称。
                      return (
                        <div key={item.label} className="flex">
                          {iconOnly ? (
                            <Tooltip>
                              <TooltipTrigger render={link} />
                              <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                          ) : (
                            link
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </nav>
            </TooltipProvider>
            {footer && !iconOnly ? (
              <div className="mt-auto flex items-center gap-2 px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">{footer}</div>
            ) : null}
            {/* 收起钮：骑在侧栏右边线上的 24px 圆钮，只在 ≥ md 显示。 */}
            <button
              type="button"
              aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
              onClick={toggle}
              style={{ top: edgeTop }}
              className="absolute -right-5 hidden size-6 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-fast)] hover:border-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-[820px]:grid"
            >
              {collapsed ? <ChevronRight className="size-3.5" strokeWidth={1.5} /> : <ChevronLeft className="size-3.5" strokeWidth={1.5} />}
            </button>
          </div>
        </aside>
        {drawer ? (
          <div
            aria-hidden="true"
            data-motion="scrim"
            data-state="open"
            className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--scrim)] min-[820px]:hidden"
            onClick={() => setDrawer(false)}
          />
        ) : null}
        <div className="min-w-0">
          <header className="sticky top-0 z-[var(--z-sticky)] flex h-[var(--layout-topbar-height)] items-center gap-3 border-b border-border bg-background px-6 max-[599px]:px-4">
            <Button variant="ghost" size="icon" aria-label="打开导航" className="min-[820px]:hidden" onClick={() => setDrawer(true)}>
              <Menu className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
            <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap [&_ol]:flex-nowrap">{breadcrumb}</div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </header>
          <main className="mx-auto grid w-full max-w-[var(--layout-content-max-width)] content-start gap-6 p-6 max-[599px]:gap-4 max-[599px]:p-4 [&>*]:min-w-0">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

// 页面标题区：左侧眉题、标题、说明，右侧操作区（一页只有一个 default 主按钮，放最右）。
// 600px 以下操作区独占一行并靠右，主按钮仍在最右，各页不用再自己补类名。
function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs tracking-[0.04em] text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl leading-8 font-semibold max-[599px]:text-lg max-[599px]:leading-[26px]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-[var(--layout-prose-max-width)] text-[13px] leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 max-[599px]:w-full max-[599px]:justify-end">{actions}</div> : null}
    </div>
  )
}

export { AppShell, PageHeader }
export type { AppShellNavGroup, AppShellNavItem }
