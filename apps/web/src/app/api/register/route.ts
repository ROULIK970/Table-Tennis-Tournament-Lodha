import { NextResponse } from "next/server"

import type { Player, StrapiSingleResponse } from "@/types"

import { strapiFetch } from "@/lib/strapi"

export const runtime = "nodejs"
// Registrations are writes — never cache this route.
export const dynamic = "force-dynamic"

interface RegisterPayload {
  name?: unknown
  age?: unknown
  flatNumber?: unknown
  mobile?: unknown
  email?: unknown
  category?: unknown
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Best-effort in-memory rate limiter (per server instance): 5 requests / minute / IP.
const WINDOW_MS = 60_000
const MAX_REQUESTS = 5
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_REQUESTS
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || "unknown"
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      {
        error: "Too many registrations from this device. Please wait a minute.",
      },
      { status: 429 }
    )
  }

  let payload: RegisterPayload
  try {
    payload = (await request.json()) as RegisterPayload
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    )
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : ""
  const email = typeof payload.email === "string" ? payload.email.trim() : ""
  const category =
    typeof payload.category === "string" ? payload.category.trim() : ""

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your full name." },
      { status: 400 }
    )
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    )
  }
  if (!category) {
    return NextResponse.json(
      { error: "Please choose a category." },
      { status: 400 }
    )
  }

  let age: number | undefined
  if (payload.age !== undefined && payload.age !== null && payload.age !== "") {
    const parsed = Number(payload.age)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120) {
      return NextResponse.json(
        { error: "Please enter a valid age." },
        { status: 400 }
      )
    }
    age = parsed
  }

  const flatNumber =
    typeof payload.flatNumber === "string" && payload.flatNumber.trim()
      ? payload.flatNumber.trim()
      : undefined
  const mobile =
    typeof payload.mobile === "string" && payload.mobile.trim()
      ? payload.mobile.trim()
      : undefined

  try {
    const created = await strapiFetch<StrapiSingleResponse>("/players", {
      method: "POST",
      body: JSON.stringify({
        data: {
          name,
          email,
          age,
          flatNumber,
          mobile,
          category,
          registeredAt: new Date().toISOString(),
        },
      }),
    })
    return NextResponse.json({ id: created.data.documentId }, { status: 201 })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Player registration failed:", error)
    return NextResponse.json(
      { error: "We couldn't save your registration. Please try again later." },
      { status: 502 }
    )
  }
}
