"use client"

import { useState } from "react"
import { PHASE_LABELS, PHASES } from "@/types"
import useSWR from "swr"

import type { Category, Match, Phase, Player } from "@/types"

import { adminMutate, swrFetcher } from "@/lib/admin-client"
import {
  determineWinner,
  getNextPhase,
  shouldCreateNextMatch,
} from "@/lib/tournament"
import { Badge, PhaseBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card"

const MATCHES_KEY =
  "/matches?populate=*&pagination[pageSize]=200&sort=createdAt:asc"

const FIELD =
  "h-9 w-full rounded-[2px] border border-border bg-background px-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"

function categoryId(entity: {
  category?: Category | null
}): string | undefined {
  return entity.category?.documentId
}

export default function AdminMatchesPage() {
  const matchesSwr = useSWR(MATCHES_KEY, (p) => swrFetcher<Match>(p))
  const categoriesSwr = useSWR(
    "/categories?pagination[pageSize]=200&sort=name:asc",
    (p) => swrFetcher<Category>(p)
  )
  const playersSwr = useSWR(
    "/players?populate=*&pagination[pageSize]=200&sort=name:asc",
    (p) => swrFetcher<Player>(p)
  )

  const matches = matchesSwr.data?.data ?? []
  const categories = categoriesSwr.data?.data ?? []
  const players = playersSwr.data?.data ?? []

  const [error, setError] = useState<string | null>(null)

  async function refreshMatches() {
    await matchesSwr.mutate()
  }

  /** After a result is saved, create the next-round match when one is owed. */
  async function advanceIfNeeded(saved: Match) {
    const phase = saved.phase
    const nextPhase = getNextPhase(phase)
    const catId = categoryId(saved)
    if (!nextPhase || !catId) return

    const fresh = (await swrFetcher<Match>(MATCHES_KEY)).data
    const inCategory = fresh.filter((m) => categoryId(m) === catId)
    const completedInPhase = inCategory.filter(
      (m) => m.phase === phase && (m.winner != null || m.completedAt != null)
    ).length
    const existingNext = inCategory.filter((m) => m.phase === nextPhase).length

    if (!shouldCreateNextMatch(phase, completedInPhase, existingNext)) return

    const placed = new Set<string>()
    inCategory
      .filter((m) => m.phase === nextPhase)
      .forEach((m) => {
        if (m.player1) placed.add(m.player1.documentId)
        if (m.player2) placed.add(m.player2.documentId)
      })

    const unpairedWinners = inCategory
      .filter((m) => m.phase === phase && m.winner)
      .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""))
      .map((m) => m.winner!.documentId)
      .filter((id) => !placed.has(id))

    if (unpairedWinners.length >= 2) {
      await adminMutate("/matches", "POST", {
        phase: nextPhase,
        category: catId,
        player1: unpairedWinners[0],
        player2: unpairedWinners[1],
      })
    }
  }

  const loading =
    matchesSwr.isLoading || categoriesSwr.isLoading || playersSwr.isLoading
  const loadError = matchesSwr.error || categoriesSwr.error || playersSwr.error

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Matches</h1>
        <p className="text-muted mt-1 text-sm">
          Create fixtures, enter scores, and let winners advance automatically.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="border-danger/40 bg-danger/10 text-danger border px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}

      {loadError ? (
        <p className="border-danger/40 bg-danger/10 text-danger border px-3 py-2 text-sm">
          Failed to load data. Make sure Strapi is running and your session is
          valid.
        </p>
      ) : null}

      <CreateMatchForm
        categories={categories}
        players={players}
        onError={setError}
        onCreated={refreshMatches}
      />

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : matches.length === 0 ? (
        <p className="text-muted text-sm">
          No matches yet. Create one above to get started.
        </p>
      ) : (
        <MatchList
          matches={matches}
          onError={setError}
          onSaved={async (saved) => {
            await advanceIfNeeded(saved)
            await refreshMatches()
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function CreateMatchForm({
  categories,
  players,
  onError,
  onCreated,
}: {
  categories: Category[]
  players: Player[]
  onError: (message: string | null) => void
  onCreated: () => Promise
}) {
  const [category, setCategory] = useState("")
  const [phase, setPhase] = useState<Phase>("group")
  const [player1, setPlayer1] = useState("")
  const [player2, setPlayer2] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [saving, setSaving] = useState(false)

  const eligible = players.filter(
    (p) => !category || categoryId(p) === category
  )

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    onError(null)
    if (!category || !player1 || !player2) {
      onError("Choose a category and two players.")
      return
    }
    if (player1 === player2) {
      onError("A match needs two different players.")
      return
    }
    setSaving(true)
    try {
      await adminMutate("/matches", "POST", {
        category,
        phase,
        player1,
        player2,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })
      setPlayer1("")
      setPlayer2("")
      setScheduledAt("")
      await onCreated()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to create match.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create match</CardTitle>
      </CardHeader>
      <CardBody>
        <form
          onSubmit={handleCreate}
          className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Category</span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPlayer1("")
                setPlayer2("")
              }}
              className={FIELD}
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.documentId} value={c.documentId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Phase</span>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as Phase)}
              className={FIELD}
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {PHASE_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Player 1</span>
            <select
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              className={FIELD}
            >
              <option value="">Select…</option>
              {eligible.map((p) => (
                <option key={p.documentId} value={p.documentId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Player 2</span>
            <select
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              className={FIELD}
            >
              <option value="">Select…</option>
              {eligible.map((p) => (
                <option key={p.documentId} value={p.documentId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Scheduled</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={FIELD}
            />
          </label>

          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create match"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

// ---------------------------------------------------------------------------

function MatchList({
  matches,
  onError,
  onSaved,
}: {
  matches: Match[]
  onError: (message: string | null) => void
  onSaved: (saved: Match) => Promise
}) {
  const byCategory = new Map<string, Match[]>()
  for (const match of matches) {
    const name = match.category?.name ?? "Uncategorized"
    if (!byCategory.has(name)) byCategory.set(name, [])
    byCategory.get(name)!.push(match)
  }
  const categories = Array.from(byCategory.keys()).sort()

  return (
    <div className="space-y-8">
      {categories.map((name) => {
        const group = byCategory.get(name)!
        return (
          <section key={name}>
            <h2 className="border-border mb-3 border-b pb-2 text-lg font-bold">
              {name}
            </h2>
            <div className="space-y-6">
              {PHASES.filter((phase) =>
                group.some((m) => m.phase === phase)
              ).map((phase) => (
                <div key={phase}>
                  <h3 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
                    {PHASE_LABELS[phase]}
                  </h3>
                  <div className="space-y-2">
                    {group
                      .filter((m) => m.phase === phase)
                      .map((match) => (
                        <MatchRow
                          key={match.documentId}
                          match={match}
                          onError={onError}
                          onSaved={onSaved}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------

function MatchRow({
  match,
  onError,
  onSaved,
}: {
  match: Match
  onError: (message: string | null) => void
  onSaved: (saved: Match) => Promise
}) {
  const [score1, setScore1] = useState(
    match.score1 != null ? String(match.score1) : ""
  )
  const [score2, setScore2] = useState(
    match.score2 != null ? String(match.score2) : ""
  )
  const [saving, setSaving] = useState(false)

  const completed = match.winner != null || match.completedAt != null
  const bothPlayers = Boolean(match.player1 && match.player2)

  async function handleSave() {
    onError(null)
    if (!bothPlayers) {
      onError("This match is missing a player.")
      return
    }
    const s1 = Number(score1)
    const s2 = Number(score2)
    if (
      score1 === "" ||
      score2 === "" ||
      !Number.isFinite(s1) ||
      !Number.isFinite(s2)
    ) {
      onError("Enter a numeric score for both players.")
      return
    }
    const winner = determineWinner(
      s1,
      s2,
      match.player1!.documentId,
      match.player2!.documentId
    )
    if (!winner) {
      onError("Scores can't be equal — there must be a winner.")
      return
    }

    setSaving(true)
    try {
      await adminMutate(`/matches/${match.documentId}`, "PUT", {
        score1: s1,
        score2: s2,
        winner,
        completedAt: new Date().toISOString(),
      })
      await onSaved(match)
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save the match.")
    } finally {
      setSaving(false)
    }
  }

  const winnerId = match.winner?.documentId

  return (
    <div className="border-border bg-background flex flex-wrap items-center gap-3 border p-3">
      <div className="min-w-48 flex-1">
        <p className="text-sm">
          <span
            className={
              winnerId === match.player1?.documentId ? "font-semibold" : ""
            }
          >
            {match.player1?.name ?? "TBD"}
          </span>
          <span className="text-muted px-2">vs</span>
          <span
            className={
              winnerId === match.player2?.documentId ? "font-semibold" : ""
            }
          >
            {match.player2?.name ?? "TBD"}
          </span>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <PhaseBadge phase={match.phase} />
          {completed ? <Badge tone="success">Completed</Badge> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          aria-label={`Score for ${match.player1?.name ?? "player 1"}`}
          type="number"
          min={0}
          value={score1}
          onChange={(e) => setScore1(e.target.value)}
          disabled={!bothPlayers}
          className="border-border bg-background h-9 w-16 rounded-[2px] border px-2 text-center text-sm"
        />
        <span className="text-muted">–</span>
        <input
          aria-label={`Score for ${match.player2?.name ?? "player 2"}`}
          type="number"
          min={0}
          value={score2}
          onChange={(e) => setScore2(e.target.value)}
          disabled={!bothPlayers}
          className="border-border bg-background h-9 w-16 rounded-[2px] border px-2 text-center text-sm"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !bothPlayers}
        >
          {saving ? "Saving…" : "Save & Advance"}
        </Button>
      </div>
    </div>
  )
}

// Checking here
