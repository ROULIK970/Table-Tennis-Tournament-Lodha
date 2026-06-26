import { notFound } from "next/navigation"
import { PHASE_LABELS } from "@/types"

import type { Category, Group, Match, Phase } from "@/types"
import type { Metadata } from "next"

import { getCategories, getGroups, getMatches } from "@/lib/strapi"
import { safe, slugify } from "@/lib/utils"
import { MatchLine } from "@/components/match-line"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card"
import { Container, PageHeader } from "@/components/ui/container"

export const revalidate = 60

const KNOCKOUT: Phase[] = ["quarterfinal", "semifinal", "final"]

async function resolveCategory(slug: string): Promise {
  const categories = await safe(getCategories(), [])
  return categories.find((c) => slugify(c.name) === slug) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise
}): Promise {
  const { category } = await params
  const resolved = await resolveCategory(category)
  return { title: resolved ? `${resolved.name} Bracket` : "Bracket" }
}

export default async function BracketPage({ params }: { params: Promise }) {
  const { category: slug } = await params
  const category = await resolveCategory(slug)
  if (!category) notFound()

  const [allGroups, allMatches] = await Promise.all([
    safe(getGroups(), [] as Group[]),
    safe(getMatches(), [] as Match[]),
  ])

  const groups = allGroups.filter(
    (g) => g.category?.documentId === category.documentId
  )
  const matches = allMatches.filter(
    (m) => m.category?.documentId === category.documentId
  )
  const groupMatches = matches.filter((m) => m.phase === "group")
  const knockoutByPhase = KNOCKOUT.map((phase) => ({
    phase,
    matches: matches.filter((m) => m.phase === phase),
  })).filter((column) => column.matches.length > 0)

  const hasContent = groups.length > 0 || matches.length > 0

  return (
    <div>
      <PageHeader
        eyebrow="Bracket"
        title={category.name}
        lead="Group stage line-up and the knockout path to the final."
      />
      <Container className="space-y-12 py-10">
        {!hasContent ? (
          <p className="text-muted text-sm">
            The bracket for this category hasn&apos;t been drawn yet.
          </p>
        ) : null}

        {groups.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-bold">Group Stage</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.documentId}>
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                  </CardHeader>
                  <CardBody>
                    {group.players && group.players.length > 0 ? (
                      <ol className="space-y-1 text-sm">
                        {group.players.map((player) => (
                          <li
                            key={player.documentId}
                            className="flex items-center gap-2"
                          >
                            <span className="text-muted">•</span>
                            {player.name}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-muted text-sm">No players assigned.</p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>

            {groupMatches.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-muted mb-3 text-sm font-semibold tracking-wide uppercase">
                  Group matches
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupMatches.map((match) => (
                    <MatchLine key={match.documentId} match={match} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {knockoutByPhase.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-bold">Knockout</h2>
            <div className="flex gap-6 overflow-x-auto pb-2">
              {knockoutByPhase.map((column) => (
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
          </section>
        ) : null}
      </Container>
    </div>
  )
}
