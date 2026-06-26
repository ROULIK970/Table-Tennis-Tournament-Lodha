import type {
  Category,
  Group,
  Match,
  Player,
  StrapiCollectionResponse,
  StrapiSingleResponse,
  Tournament,
} from "@/types"

/** Build a fully-qualified Strapi REST URL for the given API path. */
export function strapiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337"
  return `${base}/api${path}`
}

type StrapiFetchOptions = RequestInit & {
  /** Next.js ISR revalidation window in seconds. */
  revalidate?: number
}

/**
 * Thin typed wrapper around `fetch` for the Strapi REST API.
 *
 * - The API token is server-only; it is attached when present and omitted in
 *   dev (the public role can read), so we never send `Bearer undefined`.
 * - Caller headers are merged (not clobbered), so POST/PUT keep their auth.
 */
export async function strapiFetch<T>(
  path: string,
  options: StrapiFetchOptions = {}
): Promise {
  const { headers, revalidate, ...rest } = options
  const token = process.env.STRAPI_API_TOKEN

  const res = await fetch(strapiUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(revalidate !== undefined ? { next: { revalidate } } : {}),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(
      `Strapi fetch failed: ${res.status} ${res.statusText} (${path})${
        body ? ` — ${body.slice(0, 300)}` : ""
      }`
    )
  }

  return res.json() as Promise
}

// ----------------------------------------------------------------------------
// Read helpers used by server components. `populate=*` returns all first-level
// relations, which is everything the pages need for a single-event dataset.
// ----------------------------------------------------------------------------

const ALL = "pagination[pageSize]=200"

export async function getCategories(revalidate = 60): Promise {
  const res = await strapiFetch<StrapiCollectionResponse>(
    `/categories?${ALL}&sort=name:asc`,
    { revalidate }
  )
  return res.data
}

export async function getTournament(revalidate = 60): Promise {
  const res = await strapiFetch<StrapiCollectionResponse>(
    `/tournaments?${ALL}&sort=startDate:asc`,
    { revalidate }
  )
  return res.data[0] ?? null
}

export async function getMatches(revalidate = 60): Promise {
  const res = await strapiFetch<StrapiCollectionResponse>(
    `/matches?populate=*&${ALL}&sort=scheduledAt:asc`,
    { revalidate }
  )
  return res.data
}

export async function getGroups(revalidate = 60): Promise {
  const res = await strapiFetch<StrapiCollectionResponse>(
    `/groups?populate=*&${ALL}&sort=name:asc`,
    { revalidate }
  )
  return res.data
}

export async function getPlayers(revalidate = 60): Promise {
  const res = await strapiFetch<StrapiCollectionResponse>(
    `/players?populate=*&${ALL}&sort=name:asc`,
    { revalidate }
  )
  return res.data
}

export type { StrapiCollectionResponse, StrapiSingleResponse }
