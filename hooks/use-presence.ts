"use client"

import * as React from "react"

// 进入 / 退出动效：配合主题（安装时写进项目主样式表）的 data-motion + data-state 约定。
// 打开时立即挂载并设 open；关闭时先设 closed 播放退出动画，animationend 后再卸载。
// 未加载样式或开启「减少动态效果」时，animationend 可能不触发，靠超时兜底。
function usePresence(open: boolean, timeout = 400) {
  const [mounted, setMounted] = React.useState(open)
  const [state, setState] = React.useState<"open" | "closed">(open ? "open" : "closed")

  React.useEffect(() => {
    if (open) {
      setMounted(true)
      setState("open")
      return
    }
    setState("closed")
    const timer = window.setTimeout(() => setMounted(false), timeout)
    return () => window.clearTimeout(timer)
  }, [open, timeout])

  const onAnimationEnd = React.useCallback(
    (event: React.AnimationEvent) => {
      // 子元素的动画会冒泡上来，只认自身的退出动画。
      if (event.target === event.currentTarget && !open) setMounted(false)
    },
    [open],
  )

  return { mounted, state, onAnimationEnd }
}

export { usePresence }
