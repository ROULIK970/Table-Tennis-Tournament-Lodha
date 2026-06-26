import { PHASE_LABELS, PHASES } from "@/types"

import type { Match, Phase } from "@/types"
import type { Metadata } from "next"

import { getMatches } from "@/lib/strapi"
import { safe } from "@/lib/utils"
import { MatchLine } from "@/components/match-line"
import { Container, PageHeader } from "@/components/ui/container"

export const metadata: Metadata = { title: "Schedule" }
export const revalidate = 60

type Grouped = Map

function groupByCategoryThenPhase(matches: Match[]): Grouped {
  const grouped: Grouped = new Map()
  for (const match of matches) {
    const categoryName = match.category?.name ?? "Uncategorized"
    if (!grouped.has(categoryName)) grouped.set(categoryName, new Map())
    const byPhase = grouped.get(categoryName)!
    if (!byPhase.has(match.phase)) byPhase.set(match.phase, [])
    byPhase.get(match.phase)!.push(match)
  }
  return grouped
}

export default async function SchedulePage() {
  const matches = await safe(getMatches(), [])
  const grouped = groupByCategoryThenPhase(matches)
  const categories = Array.from(grouped.keys()).sort()

  return (
    <div>
      <PageHeader
        eyebrow="Fixtures & Results"
        title="Schedule"
        lead="Matches grouped by category and round. Scores appear once a match is completed."
      />
      <Container className="py-10">
        {categories.length === 0 ? (
          <p className="text-muted text-sm">
            No matches have been scheduled yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-12">
            {categories.map((categoryName) => {
              const byPhase = grouped.get(categoryName)!
              return (
                <section key={categoryName}>
                  <h2 className="border-border mb-4 border-b pb-2 text-xl font-bold">
                    {categoryName}
                  </h2>
                  <div className="space-y-8">
                    {PHASES.filter((phase) => byPhase.has(phase)).map(
                      (phase) => (
                        <div key={phase}>
                          <h3 className="text-muted mb-3 text-sm font-semibold tracking-wide uppercase">
                            {PHASE_LABELS[phase]}
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {byPhase.get(phase)!.map((match) => (
                              <MatchLine key={match.documentId} match={match} />
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}
