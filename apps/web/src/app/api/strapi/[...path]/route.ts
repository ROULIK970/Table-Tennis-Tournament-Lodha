import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/auth"
import { strapiUrl } from "@/lib/strapi"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Auth-gated proxy between the admin dashboard (browser) and Strapi.
 *
 * The full-access Strapi token never reaches the browser: client components
 * call `/api/strapi/...`, this route verifies the admin session cookie, and
 * only then forwards the request to Strapi with the token attached. Access is
 * restricted to the tournament resources to limit blast radius.
 */
const ALLOWED_RESOURCES = new Set([
  "players",
  "categories",
  "groups",
  "matches",
  "tournaments",
])

async function isAuthed(): Promise {
  const store = await cookies()
  return isValidAdminSession(
    store.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_SECRET
  )
}

async function forward(request: Request, segments: string[]): Promise {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const resource = segments[0]
  if (!resource || !ALLOWED_RESOURCES.has(resource)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const search = new URL(request.url).search
  const token = process.env.STRAPI_API_TOKEN

  const init: RequestInit = {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text()
  }

  const upstream = await fetch(
    strapiUrl(`/${segments.join("/")}${search}`),
    init
  )
  const payload = await upstream.text()

  return new NextResponse(payload, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  })
}

type Context = { params: Promise }

export async function GET(request: Request, { params }: Context) {
  return forward(request, (await params).path)
}

export async function POST(request: Request, { params }: Context) {
  return forward(request, (await params).path)
}

export async function PUT(request: Request, { params }: Context) {
  return forward(request, (await params).path)
}

export async function DELETE(request: Request, { params }: Context) {
  return forward(request, (await params).path)
}
