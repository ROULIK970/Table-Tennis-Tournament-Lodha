/**
 * Browser-side helpers for the admin dashboard. All calls go through the
 * auth-gated `/api/strapi` proxy, so the Strapi token stays on the server.
 */

import type { StrapiCollectionResponse, StrapiSingleResponse } from "@/types"

async function parseError(res: Response): Promise {
  try {
    const body = (await res.json()) as {
      error?: string | { message?: string }
    }
    if (typeof body.error === "string") return body.error
    if (body.error?.message) return body.error.message
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`
}

/** SWR fetcher for collection endpoints, e.g. "/players?populate=*". */
export async function swrFetcher<T>(path: string): Promise {
  const res = await fetch(`/api/strapi${path}`, { cache: "no-store" })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise
}

type Method = "POST" | "PUT" | "DELETE"

/** Create/update/delete a Strapi resource through the proxy. */
export async function adminMutate<T>(
  path: string,
  method: Method,
  data?: Record
): Promise {
  const res = await fetch(`/api/strapi${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify({ data }) : undefined,
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise
}

export async function logout(): Promise {
  await fetch("/api/admin/logout", { method: "POST" })
}
