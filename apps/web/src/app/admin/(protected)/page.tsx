import Link from "next/link"

import type { Metadata } from "next"

import { Card, CardBody } from "@/components/ui/card"

export const metadata: Metadata = { title: "Admin Dashboard" }

const SECTIONS = [
  {
    href: "/admin/players",
    title: "Players",
    desc: "Review registrations and assign players to groups.",
  },
  {
    href: "/admin/matches",
    title: "Matches",
    desc: "Enter scores and advance winners through the bracket.",
  },
  {
    href: "/admin/bracket",
    title: "Bracket",
    desc: "Read-only overview of every category's bracket.",
  },
]

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Organizer dashboard</h1>
      <p className="text-muted mt-1 text-sm">
        Manage the tournament. Changes are saved straight to Strapi.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="group block">
            <Card className="group-hover:border-accent h-full transition-colors">
              <CardBody>
                <p className="text-base font-semibold">{section.title}</p>
                <p className="text-muted mt-1 text-sm">{section.desc}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
