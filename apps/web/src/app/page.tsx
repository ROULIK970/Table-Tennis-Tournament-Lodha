import Link from "next/link"

import { EVENT } from "@/lib/config"
import { getCategories, getTournament } from "@/lib/strapi"
import { formatDate, safe, slugify } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonClass } from "@/components/ui/button"
import { Card, CardBody } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Countdown } from "@/components/ui/countdown"

// Revalidate the landing page every 60s so status/dates stay fresh.
export const revalidate = 60

const STATUS_TONE = {
  upcoming: "accent",
  ongoing: "success",
  completed: "neutral",
} as const

const QUICK_LINKS = [
  { href: "/register", title: "Register", desc: "Enter the tournament" },
  { href: "/schedule", title: "Schedule", desc: "Fixtures & results" },
  { href: "/leaderboard", title: "Leaderboard", desc: "Live standings" },
  { href: "/gallery", title: "Gallery", desc: "Moments from the event" },
]

export default async function HomePage() {
  const [tournament, categories] = await Promise.all([
    safe(getTournament(), null),
    safe(getCategories(), []),
  ])

  const title = tournament?.title ?? EVENT.name

  return (
    <div>
      <section className="border-border bg-surface border-b">
        <Container className="py-16 sm:py-24">
          <p className="text-accent mb-3 text-xs font-semibold tracking-widest uppercase">
            {EVENT.venue} · {EVENT.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              {title}
            </h1>
            {tournament ? (
              <Badge tone={STATUS_TONE[tournament.status]}>
                {tournament.status}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted mt-4 max-w-2xl text-lg">{EVENT.tagline}</p>

          <div className="mt-8">
            {tournament?.startDate ? (
              <>
                <p className="text-muted mb-3 text-xs font-semibold tracking-widest uppercase">
                  Counting down to {formatDate(tournament.startDate)}
                </p>
                <Countdown target={tournament.startDate} />
              </>
            ) : (
              <p className="text-muted text-sm">
                Tournament dates will be announced soon.
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/register" className={buttonClass("primary", "md")}>
              Register Now
            </Link>
            <Link href="/schedule" className={buttonClass("secondary", "md")}>
              View Schedule
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="group block">
              <Card className="group-hover:border-accent h-full transition-colors">
                <CardBody>
                  <p className="text-base font-semibold">{link.title}</p>
                  <p className="text-muted mt-1 text-sm">{link.desc}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        {categories.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-muted text-sm font-semibold tracking-wide uppercase">
              Categories
            </h2>
            <p className="text-muted mt-1 text-sm">
              Open a category to see its bracket.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.documentId}
                  href={`/bracket/${slugify(category.name)}`}
                  className="border-border bg-background hover:border-accent hover:text-accent inline-flex items-center rounded-[2px] border px-3 py-1.5 text-sm transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </div>
  )
}
