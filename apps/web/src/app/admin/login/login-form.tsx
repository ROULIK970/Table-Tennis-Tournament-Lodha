"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"

export function LoginForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from") || "/admin"

  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        setError(body.error ?? "Login failed.")
        setSubmitting(false)
        return
      }
      // Hard navigation (not router.replace): forces middleware to re-run with the
      // freshly set cookie and bypasses the client RSC cache, which still has
      // /admin redirecting to /admin/login from when we were logged out.
      const target = from.startsWith("/admin") ? from : "/admin"
      window.location.assign(target)
    } catch {
      setError("Network error. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-border bg-background focus:border-accent focus:ring-accent/30 h-10 w-full rounded-[2px] border px-3 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="border-danger/40 bg-danger/10 text-danger border px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
