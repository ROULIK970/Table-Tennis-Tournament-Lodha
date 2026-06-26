import { Container } from "@/components/ui/container"

import { AdminNav } from "./admin-nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="border-border bg-surface border-b">
        <Container className="py-3">
          <AdminNav />
        </Container>
      </div>
      <Container className="py-8">{children}</Container>
    </div>
  )
}
