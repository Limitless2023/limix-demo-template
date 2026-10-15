"use client"

// 本库组件：最常见的「取消 + 主操作」确认框，一行写完。基于 AlertDialog（Base UI），Esc 与遮罩关闭、焦点管理由它处理。
// 传 onConfirm 时渲染底部两个按钮：取消（outline，打开时先获得焦点，误按回车不会执行主操作）+ 主操作；
// 不传则由 children 自带操作。需要自定义结构时直接用 dialog.tsx / alert-dialog.tsx 的复合组件。
import * as React from "react"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "确认",
  cancelLabel = "取消",
  destructive,
  onConfirm,
  className,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
  /** 问句或动宾短语，如「删除模型 X？」 */
  title: string
  /** 说明后果 */
  description?: string
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** 不可逆操作：主操作用 destructive */
  destructive?: boolean
  onConfirm?: () => void
  className?: string
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => onOpenChange?.(next)}>
      <AlertDialogContent className={cn("data-[size=default]:sm:max-w-[480px]", className)}>
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {children ? <div className="text-sm">{children}</div> : null}
        {onConfirm ? (
          <AlertDialogFooter className="sm:flex-row sm:justify-end">
            <AlertDialogCancel autoFocus>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              variant={destructive ? "destructive" : "default"}
              onClick={() => {
                onConfirm()
                onOpenChange?.(false)
              }}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ConfirmDialog }
