import Link from "next/link"

import { EVENT, NAV_LINKS, ORGANIZER } from "@/lib/config"
import { Container } from "@/components/ui/container"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-border bg-surface mt-16 border-t">
      <Container className="grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <p className="text-sm font-bold">{EVENT.name}</p>
          <p className="text-muted mt-1 text-sm">
            {EVENT.subtitle} · {EVENT.venue}
          </p>
        </div>

        <nav aria-label="Footer" className="text-sm">
          <p className="text-muted mb-2 font-semibold tracking-wide uppercase">
            Pages
          </p>
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          <p className="text-muted mb-2 font-semibold tracking-wide uppercase">
            Organizer
          </p>
          <p>{ORGANIZER.name}</p>
          <a href={`mailto:${ORGANIZER.email}`} className="text-accent">
            {ORGANIZER.email}
          </a>
          <p className="text-muted">{ORGANIZER.phone}</p>
        </div>
      </Container>

      <div className="border-border border-t">
        <Container className="py-4">
          <p className="text-muted text-xs">
            © {year} {EVENT.venue} · {EVENT.name}. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  )
}
