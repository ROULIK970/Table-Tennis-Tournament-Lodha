import type { Match } from "@/types"

import { cn, formatDateTime } from "@/lib/utils"
import { PhaseBadge } from "@/components/ui/badge"

function isCompleted(match: Match): boolean {
  return match.winner != null || match.completedAt != null
}

function PlayerRow({
  name,
  score,
  isWinner,
  decided,
}: {
  name: string
  score: number | null | undefined
  isWinner: boolean
  decided: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "truncate text-sm",
          isWinner ? "text-foreground font-semibold" : "text-foreground"
        )}
      >
        {name}
        {isWinner ? (
          <span className="text-success ml-2 text-xs font-medium">Won</span>
        ) : null}
      </span>
      <span
        className={cn(
          "text-sm tabular-nums",
          isWinner ? "font-bold" : "text-muted"
        )}
      >
        {decided ? score ?? 0 : "–"}
      </span>
    </div>
  )
}

/** Compact, reusable presentation of a single match (used by schedule & bracket). */
export function MatchLine({
  match,
  showPhase = false,
}: {
  match: Match
  showPhase?: boolean
}) {
  const completed = isCompleted(match)
  const winnerId = match.winner?.documentId

  return (
    <div className="border-border bg-background border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        {showPhase ? <PhaseBadge phase={match.phase} /> : <span />}
        <span className="text-muted text-xs">
          {completed
            ? "Final"
            : match.scheduledAt
              ? formatDateTime(match.scheduledAt)
              : "TBD"}
        </span>
      </div>
      <div className="space-y-1.5">
        <PlayerRow
          name={match.player1?.name ?? "TBD"}
          score={match.score1}
          decided={completed}
          isWinner={Boolean(winnerId && match.player1?.documentId === winnerId)}
        />
        <div className="bg-border h-px" />
        <PlayerRow
          name={match.player2?.name ?? "TBD"}
          score={match.score2}
          decided={completed}
          isWinner={Boolean(winnerId && match.player2?.documentId === winnerId)}
        />
      </div>
    </div>
  )
}
