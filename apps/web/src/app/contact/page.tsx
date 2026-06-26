import type { Metadata } from "next"

import { EVENT, ORGANIZER } from "@/lib/config"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card"
import { Container, PageHeader } from "@/components/ui/container"

export const metadata: Metadata = { title: "Contact" }

export default function ContactPage() {
  const rows = [
    { label: "Organizer", value: ORGANIZER.name },
    { label: "Role", value: ORGANIZER.role },
    {
      label: "Email",
      value: ORGANIZER.email,
      href: `mailto:${ORGANIZER.email}`,
    },
    { label: "Phone", value: ORGANIZER.phone, href: `tel:${ORGANIZER.phone}` },
    { label: "Flat", value: ORGANIZER.flatNumber },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Get in touch"
        title="Contact"
        lead={`Questions about ${EVENT.name}? Reach the organizer directly.`}
      />
      <Container className="py-10">
        <div className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Organizer</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="divide-border divide-y">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <dt className="text-muted text-sm">{row.label}</dt>
                    <dd className="text-sm font-medium">
                      {row.href ? (
                        <a href={row.href} className="text-accent">
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </div>
      </Container>
    </div>
  )
}
