import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function Container({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      {children}
    </div>
  )
}

/** Standard page section header: a title, optional eyebrow, optional lead text. */
export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string
  title: string
  lead?: string
}) {
  return (
    <header className="border-border bg-surface border-b">
      <Container className="py-10">
        {eyebrow ? (
          <p className="text-accent mb-2 text-xs font-semibold tracking-widest uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {lead ? (
          <p className="text-muted mt-3 max-w-2xl text-base">{lead}</p>
        ) : null}
      </Container>
    </header>
  )
}
