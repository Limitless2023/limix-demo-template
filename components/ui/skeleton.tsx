import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("h-3 animate-pulse rounded-sm bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton }
