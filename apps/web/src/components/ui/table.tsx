import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Table({ className, ...props }: HTMLAttributes) {
  return (
    <div className="border-border w-full overflow-x-auto border">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  )
}

export function THead(props: HTMLAttributes) {
  return <thead className="bg-surface" {...props} />
}

export function TBody(props: HTMLAttributes) {
  return <tbody {...props} />
}

export function TR({ className, ...props }: HTMLAttributes) {
  return (
    <tr
      className={cn("border-border border-b last:border-0", className)}
      {...props}
    />
  )
}

export function TH({ className, ...props }: ThHTMLAttributes) {
  return (
    <th
      scope="col"
      className={cn(
        "text-muted px-4 py-2.5 text-left text-xs font-semibold tracking-wide uppercase",
        className
      )}
      {...props}
    />
  )
}

export function TD({ className, ...props }: TdHTMLAttributes) {
  return <td className={cn("px-4 py-2.5 align-middle", className)} {...props} />
}
