import { NextResponse } from "next/server"

import { ADMIN_COOKIE, adminSessionToken, safeEqual } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "Admin access is not configured (set ADMIN_SECRET)." },
      { status: 500 }
    )
  }

  let password = ""
  try {
    const body = (await request.json()) as { password?: unknown }
    password = typeof body.password === "string" ? body.password : ""
  } catch {
    // fall through to the invalid-password response
  }

  if (!password || !safeEqual(password, secret)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, await adminSessionToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return response
}
