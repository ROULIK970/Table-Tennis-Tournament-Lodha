import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/auth"

/**
 * Guards every /admin page except the login screen. Pages render no sensitive
 * data on the server (admin data is fetched through the auth-gated proxy), so a
 * cookie check here is purely for UX — it redirects unauthenticated visitors to
 * the login form.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin/login") {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(ADMIN_COOKIE)?.value
  const valid = await isValidAdminSession(cookie, process.env.ADMIN_SECRET)

  if (!valid) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/admin/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
