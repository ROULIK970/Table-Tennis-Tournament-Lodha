"use client"

import Link from "next/link"
import { PHASE_LABELS } from "@/types"
import useSWR from "swr"

import type { Category, Group, Match, Phase } from "@/types"

import { swrFetcher } from "@/lib/admin-client"
import { slugify } from "@/lib/utils"
import { MatchLine } from "@/components/match-line"

const KNOCKOUT: Phase[] = ["quarterfinal", "semifinal", "final"]

export default function AdminBracketPage() {
  const categoriesSwr = useSWR(
    "/categories?pagination[pageSize]=200&sort=name:asc",
    (p) => swrFetcher<Category>(p)
  )
  const groupsSwr = useSWR(
    "/groups?populate=*&pagination[pageSize]=200&sort=name:asc",
    (p) => swrFetcher<Group>(p)
  )
  const matchesSwr = useSWR(
    "/matches?populate=*&pagination[pageSize]=200&sort=createdAt:asc",
    (p) => swrFetcher<Match>(p)
  )

  const categories = categoriesSwr.data?.data ?? []
  const groups = groupsSwr.data?.data ?? []
  const matches = matchesSwr.data?.data ?? []

  const loading =
    categoriesSwr.isLoading || groupsSwr.isLoading || matchesSwr.isLoading

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Bracket overview</h1>
        <p className="text-muted mt-1 text-sm">
          Read-only view of every category. Use{" "}
          <Link href="/admin/matches" className="text-accent underline">
            Matches
          </Link>{" "}
          to enter results.
        </p>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="text-muted text-sm">No categories yet.</p>
      ) : (
        <div className="space-y-12">
          {categories.map((category) => {
            const catGroups = groups.filter(
              (g) => g.category?.documentId === category.documentId
            )
            const catMatches = matches.filter(
              (m) => m.category?.documentId === category.documentId
            )
            const knockout = KNOCKOUT.map((phase) => ({
              phase,
              matches: catMatches.filter((m) => m.phase === phase),
            })).filter((column) => column.matches.length > 0)

            return (
              <section key={category.documentId}>
                <div className="border-border mb-4 flex items-center justify-between gap-2 border-b pb-2">
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  <Link
                    href={`/bracket/${slugify(category.name)}`}
                    className="text-accent text-sm underline"
                  >
                    Public page →
                  </Link>
                </div>

                {catGroups.length > 0 ? (
                  <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {catGroups.map((group) => (
                      <div
                        key={group.documentId}
                        className="border-border bg-background border p-3"
                      >
                        <p className="mb-2 text-sm font-semibold">
                          {group.name}
                        </p>
                        <ul className="text-muted space-y-1 text-sm">
                          {(group.players ?? []).map((player) => (
                            <li key={player.documentId}>{player.name}</li>
                          ))}
                          {(group.players ?? []).length === 0 ? (
                            <li>No players</li>
                          ) : null}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}

                {knockout.length > 0 ? (
                  <div className="flex gap-6 overflow-x-auto pb-2">
                    {knockout.map((column) => (
                      <div
                        key={column.phase}
                        className="flex min-w-60 flex-col justify-around gap-4"
                      >
                        <h3 className="text-muted text-sm font-semibold tracking-wide uppercase">
                          {PHASE_LABELS[column.phase]}
                        </h3>
                        {column.matches.map((match) => (
                          <MatchLine key={match.documentId} match={match} />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}

                {catGroups.length === 0 && knockout.length === 0 ? (
                  <p className="text-muted text-sm">Nothing drawn yet.</p>
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
