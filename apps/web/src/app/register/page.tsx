import type { Metadata } from "next"

import { getCategories } from "@/lib/strapi"
import { safe } from "@/lib/utils"
import { Container, PageHeader } from "@/components/ui/container"

import { RegisterForm } from "./register-form"

export const metadata: Metadata = { title: "Register" }
export const revalidate = 60

export default async function RegisterPage() {
  const categories = await safe(getCategories(), [])

  return (
    <div>
      <PageHeader
        eyebrow="Player Registration"
        title="Register for the tournament"
        lead="Fill in your details to enter. Registration is open to all Lodha HPM residents."
      />
      <Container className="py-10">
        <div className="max-w-xl">
          <RegisterForm
            categories={categories.map((c) => ({
              documentId: c.documentId,
              name: c.name,
            }))}
          />
        </div>
      </Container>
    </div>
  )
}
