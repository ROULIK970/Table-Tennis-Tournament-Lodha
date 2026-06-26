/**
 * Minimal stateless admin auth for a single-organizer event.
 *
 * A correct password sets an httpOnly cookie whose value is a deterministic
 * hash of ADMIN_SECRET. The same derivation runs in both the Edge middleware
 * and Node route handlers (Web Crypto is global in Node 22), so no session
 * store is required.
 */

export const ADMIN_COOKIE = "admin_session"

async function sha256Hex(input: string): Promise {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** Opaque, deterministic session token derived from the admin secret. */
export async function adminSessionToken(secret: string): Promise {
  return sha256Hex(`resavenue2026:admin:${secret}`)
}

/** Length-independent constant-time-ish compare to avoid trivial timing leaks. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

/** Validate a presented cookie value against the configured secret. */
export async function isValidAdminSession(
  cookieValue: string | undefined,
  secret: string | undefined
): Promise {
  if (!cookieValue || !secret) return false
  const expected = await adminSessionToken(secret)
  return safeEqual(cookieValue, expected)
}
