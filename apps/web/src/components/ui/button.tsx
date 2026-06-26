import type { ButtonHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md"

const VARIANTS: Record = {
  primary:
    "bg-accent text-accent-foreground border-accent hover:bg-accent-hover",
  secondary: "bg-surface text-foreground border-border hover:bg-border",
  ghost: "bg-transparent text-foreground border-transparent hover:bg-surface",
  danger: "bg-danger text-white border-danger hover:opacity-90",
}

const SIZES: Record = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-5 text-sm",
}

/** Shared class string so links can look like buttons without an extra dep. */
export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[2px] border font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    SIZES[size],
    VARIANTS[variant],
    className
  )
}

export interface ButtonProps extends ButtonHTMLAttributes {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  )
}
