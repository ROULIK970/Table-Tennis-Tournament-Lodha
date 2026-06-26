import type { Match, Phase, Player, Standing } from "@/types"

/**
 * Pure tournament logic — no state, no side effects, no I/O.
 *
 * The admin UI calls these helpers *before* POSTing to Strapi, which keeps the
 * CMS "dumb" and concentrates all tournament rules in one tested place.
 */

/** Linear knockout progression after the group stage. */
const PHASE_ORDER: Phase[] = ["group", "quarterfinal", "semifinal", "final"]

/**
 * Decide the winner of a match from its scores.
 *
 * Returns the winning player's id, or "" when the result is a draw / invalid
 * (the admin UI should block saving an equal score, so "" means "undecided").
 */
export function determineWinner(
  score1: number,
  score2: number,
  player1Id: string,
  player2Id: string
): string {
  if (
    !Number.isFinite(score1) ||
    !Number.isFinite(score2) ||
    score1 === score2
  ) {
    return ""
  }
  return score1 > score2 ? player1Id : player2Id
}

/** The phase that follows `current`, or null when `current` is the final. */
export function getNextPhase(current: Phase): Phase | null {
  const index = PHASE_ORDER.indexOf(current)
  if (index === -1 || index === PHASE_ORDER.length - 1) return null
  return PHASE_ORDER[index + 1] ?? null
}

/**
 * Whether a fresh next-round match should be created.
 *
 * In single elimination, every two completed matches in a knockout phase feed
 * exactly one match in the next phase. Given the number of *completed* matches
 * in `phase` and the number of next-phase matches that *already exist*, decide
 * whether one more next-phase match is owed.
 *
 * The group stage is excluded: round-robin advancement is decided by standings,
 * not by pairing winners in completion order, so the organizer seeds the
 * knockout round manually. The final feeds nothing.
 *
 * @param phase            the phase that just had a match completed
 * @param matchesInPhase   number of completed matches in `phase`
 * @param totalAdvancing   number of next-phase matches that already exist
 */
export function shouldCreateNextMatch(
  phase: Phase,
  matchesInPhase: number,
  totalAdvancing: number
): boolean {
  if (phase === "group" || getNextPhase(phase) === null) return false
  const expectedNextMatches = Math.floor(matchesInPhase / 2)
  return expectedNextMatches > totalAdvancing
}

/** Stable id used to compare populated players across matches. */
function playerKey(player: Player | null | undefined): string | null {
  return player?.documentId ?? null
}

/**
 * Compute per-player standings for a set of matches, sorted by wins (then by
 * point differential, then name). Only completed matches with a winner count.
 */
export function computeStandings(
  players: Player[],
  matches: Match[]
): Standing[] {
  const table = new Map<string, Standing>()
  for (const player of players) {
    table.set(player.documentId, {
      player,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    })
  }

  for (const match of matches) {
    const winnerKey = playerKey(match.winner)
    if (!winnerKey) continue // skip matches that are not yet decided

    const p1 = playerKey(match.player1)
    const p2 = playerKey(match.player2)
    const s1 = match.score1 ?? 0
    const s2 = match.score2 ?? 0

    if (p1 && table.has(p1)) {
      const row = table.get(p1)!
      row.played += 1
      row.pointsFor += s1
      row.pointsAgainst += s2
      if (winnerKey === p1) row.wins += 1
      else row.losses += 1
    }
    if (p2 && table.has(p2)) {
      const row = table.get(p2)!
      row.played += 1
      row.pointsFor += s2
      row.pointsAgainst += s1
      if (winnerKey === p2) row.wins += 1
      else row.losses += 1
    }
  }

  return Array.from(table.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    const diffA = a.pointsFor - a.pointsAgainst
    const diffB = b.pointsFor - b.pointsAgainst
    if (diffB !== diffA) return diffB - diffA
    return a.player.name.localeCompare(b.player.name)
  })
}
