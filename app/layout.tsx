import type { Metadata } from "next"

import "./globals.css"
import { DemoShell } from "@/components/demo/demo-shell"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: "LimiX 场景 demo",
  description: "LimiX 结构化数据大模型的售前场景演示",
}

// 主题：LimiX 蓝（stable-ai-design 的 blue-light）。字体走系统中文字体栈，不引入网络字体。
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-theme="blue-light">
      <body className="antialiased">
        <TooltipProvider>
          <DemoShell>{children}</DemoShell>
        </TooltipProvider>
      </body>
    </html>
  )
}
