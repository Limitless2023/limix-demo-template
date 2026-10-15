"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { LayoutGrid } from "lucide-react"

import { AppShell, type AppShellNavGroup } from "@/components/blocks/app-shell"
import { scenarios } from "@/lib/scenarios"

// 全站骨架：stable-ai-design 的 AppShell，侧栏按场景清单生成，当前页按路由高亮。
export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const nav: AppShellNavGroup[] = [
    { label: "LimiX 场景 demo", items: [{ label: "全部场景", href: "/", icon: LayoutGrid, current: pathname === "/" }] },
    {
      label: "场景",
      items: scenarios
        .filter((s) => !s.draft)
        .map((s) => ({ label: s.title, href: `/scenarios/${s.slug}`, icon: s.icon, current: pathname.startsWith(`/scenarios/${s.slug}`) })),
    },
  ]
  return (
    <AppShell nav={nav} brand="limix">
      {children}
    </AppShell>
  )
}
