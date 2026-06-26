"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CategoryOption {
  documentId: string
  name: string
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string }

const FIELD =
  "h-10 w-full rounded-[2px] border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"

const LABEL = "mb-1 block text-sm font-medium"

export function RegisterForm({ categories }: { categories: CategoryOption[] }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus({ kind: "submitting" })

    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      age: data.get("age") ? Number(data.get("age")) : undefined,
      flatNumber: String(data.get("flatNumber") ?? "").trim() || undefined,
      mobile: String(data.get("mobile") ?? "").trim() || undefined,
      email: String(data.get("email") ?? "").trim() || undefined,
      category: String(data.get("category") ?? ""),
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = (await res.json().catch(() => ({}))) as {
        error?: string
      }
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: body.error ?? "Registration failed. Please try again.",
        })
        return
      }
      form.reset()
      setStatus({ kind: "success" })
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Please check your connection and try again.",
      })
    }
  }

  if (status.kind === "success") {
    return (
      <div className="border-success/40 bg-success/10 border p-6">
        <h2 className="text-success text-lg font-semibold">
          You&apos;re registered!
        </h2>
        <p className="text-foreground mt-1 text-sm">
          Thanks for entering. Watch the{" "}
          <a href="/schedule" className="text-accent font-medium underline">
            schedule
          </a>{" "}
          for your fixtures.
        </p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => setStatus({ kind: "idle" })}
        >
          Register another player
        </Button>
      </div>
    )
  }

  const submitting = status.kind === "submitting"

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {status.kind === "error" ? (
        <p
          role="alert"
          className="border-danger/40 bg-danger/10 text-danger border px-4 py-3 text-sm"
        >
          {status.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className={LABEL}>
          Full name <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          className={FIELD}
          autoComplete="name"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="age" className={LABEL}>
            Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min={1}
            max={120}
            inputMode="numeric"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="flatNumber" className={LABEL}>
            Flat number
          </label>
          <input id="flatNumber" name="flatNumber" className={FIELD} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="mobile" className={LABEL}>
            Mobile
          </label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="email" className={LABEL}>
            Email <span className="text-danger">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className={LABEL}>
          Category <span className="text-danger">*</span>
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className={cn(FIELD, "cursor-pointer")}
        >
          <option value="" disabled>
            {categories.length
              ? "Select a category"
              : "No categories available"}
          </option>
          {categories.map((category) => (
            <option key={category.documentId} value={category.documentId}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={submitting || categories.length === 0}>
        {submitting ? "Submitting…" : "Submit registration"}
      </Button>
    </form>
  )
}
