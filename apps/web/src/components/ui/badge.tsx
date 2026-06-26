import { PHASE_LABELS } from "@/types"

import type { Phase } from "@/types"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type BadgeTone = "neutral" | "accent" | "success" | "danger"

const TONES: Record = {
  neutral: "bg-surface text-foreground border-border",
  accent: "bg-accent/10 text-accent border-accent/30",
  success: "bg-success/10 text-success border-success/30",
  danger: "bg-danger/10 text-danger border-danger/30",
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] border px-2 py-0.5 text-xs font-medium tracking-wide uppercase",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

const PHASE_TONES: Record = {
  group: "neutral",
  quarterfinal: "accent",
  semifinal: "accent",
  final: "success",
}

/** Convenience badge that labels and colors a match phase. */
export function PhaseBadge({ phase }: { phase: Phase }) {
  return <Badge tone={PHASE_TONES[phase]}>{PHASE_LABELS[phase]}</Badge>
}
