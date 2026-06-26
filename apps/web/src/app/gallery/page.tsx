import type { Metadata } from "next"

import { Container, PageHeader } from "@/components/ui/container"

export const metadata: Metadata = { title: "Gallery" }

// Placeholder tiles. Swap each grey block for a <next/image> when photos are
// available — the grid and aspect ratio stay the same.
const PLACEHOLDERS = Array.from({ length: 9 }, (_, i) => i)

export default function GalleryPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Photos"
        title="Gallery"
        lead="Highlights from the tournament. Photos are added as the event unfolds."
      />
      <Container className="py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDERS.map((index) => (
            <div
              key={index}
              className="border-border bg-surface flex aspect-[4/3] items-center justify-center border"
            >
              <span className="text-muted text-xs tracking-widest uppercase">
                Photo {index + 1}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
