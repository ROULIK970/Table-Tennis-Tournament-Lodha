import type { Match, Player } from "@/types"
import type { Metadata } from "next"

import { getMatches, getPlayers } from "@/lib/strapi"
import { computeStandings } from "@/lib/tournament"
import { safe } from "@/lib/utils"
import { Container, PageHeader } from "@/components/ui/container"
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table"

export const metadata: Metadata = { title: "Leaderboard" }
export const revalidate = 60

function groupByCategory<T extends { category?: { name: string } | null }>(
  items: T[]
): Map {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const name = item.category?.name
    if (!name) continue
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(item)
  }
  return map
}

export default async function LeaderboardPage() {
  const [players, matches] = await Promise.all([
    safe(getPlayers(), [] as Player[]),
    safe(getMatches(), [] as Match[]),
  ])

  const playersByCategory = groupByCategory(players)
  const matchesByCategory = groupByCategory(matches)
  const categories = Array.from(playersByCategory.keys()).sort()

  return (
    <div>
      <PageHeader
        eyebrow="Standings"
        title="Leaderboard"
        lead="Players ranked by wins, then point differential. Updated as results come in."
      />
      <Container className="py-10">
        {categories.length === 0 ? (
          <p className="text-muted text-sm">
            Standings will appear once players are registered and matches are
            played.
          </p>
        ) : (
          <div className="space-y-12">
            {categories.map((categoryName) => {
              const standings = computeStandings(
                playersByCategory.get(categoryName) ?? [],
                matchesByCategory.get(categoryName) ?? []
              )
              return (
                <section key={categoryName}>
                  <h2 className="mb-4 text-xl font-bold">{categoryName}</h2>
                  <Table>
                    <THead>
                      <TR>
                        <TH className="w-12">#</TH>
                        <TH>Player</TH>
                        <TH className="w-16 text-right">P</TH>
                        <TH className="w-16 text-right">W</TH>
                        <TH className="w-16 text-right">L</TH>
                        <TH className="w-20 text-right">Diff</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {standings.map((row, index) => {
                        const diff = row.pointsFor - row.pointsAgainst
                        return (
                          <TR key={row.player.documentId}>
                            <TD className="text-muted tabular-nums">
                              {index + 1}
                            </TD>
                            <TD className="font-medium">{row.player.name}</TD>
                            <TD className="text-right tabular-nums">
                              {row.played}
                            </TD>
                            <TD className="text-right font-semibold tabular-nums">
                              {row.wins}
                            </TD>
                            <TD className="text-muted text-right tabular-nums">
                              {row.losses}
                            </TD>
                            <TD className="text-right tabular-nums">
                              {diff > 0 ? `+${diff}` : diff}
                            </TD>
                          </TR>
                        )
                      })}
                    </TBody>
                  </Table>
                </section>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}
