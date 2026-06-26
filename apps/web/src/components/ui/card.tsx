import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export function Card({ className, ...props }: HTMLAttributes) {
  return (
    <div
      className={cn("border-border bg-background border", className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes) {
  return (
    <div
      className={cn("border-border border-b px-5 py-4", className)}
      {...props}
    />
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
      {children}
    </h2>
  )
}

export function CardBody({ className, ...props }: HTMLAttributes) {
  return <div className={cn("px-5 py-4", className)} {...props} />
}
