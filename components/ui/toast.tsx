"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type ToastInput = { title: string; description?: string; variant?: "default" | "destructive" }
type ToastItem = ToastInput & { id: number; state: "open" | "closed" }

const ToastContext = React.createContext<(toast: ToastInput) => void>(() => {})

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const remove = React.useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), [])
  const push = React.useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.random()
    setItems((current) => [...current, { ...toast, id, state: "open" }])
    // 4 秒后切到 closed 播放退出动画，animationend 移除；未加载样式时 400ms 兜底。
    window.setTimeout(() => {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, state: "closed" } : item)))
      window.setTimeout(() => remove(id), 400)
    }, 4000)
  }, [remove])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed right-4 bottom-4 z-[var(--z-toast)] grid w-[min(360px,calc(100%-2rem))] gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            data-motion="toast"
            data-state={item.state}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && item.state === "closed") remove(item.id)
            }}
            className={cn("rounded-md border border-border bg-background p-4 text-foreground shadow-[var(--shadow-md)]", item.variant === "destructive" && "border-destructive")}
          >
            <p className={cn("text-sm font-semibold", item.variant === "destructive" && "text-destructive")}>{item.title}</p>
            {item.description ? <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{item.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function useToast() {
  return React.useContext(ToastContext)
}

export { ToastProvider, useToast }
