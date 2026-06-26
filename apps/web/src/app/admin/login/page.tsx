import { Suspense } from "react"

import type { Metadata } from "next"

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card"
import { Container } from "@/components/ui/container"

import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Admin Login" }

export default function AdminLoginPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-muted mb-4 text-sm">
              Enter the organizer password to manage players and matches.
            </p>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardBody>
        </Card>
      </div>
    </Container>
  )
}
