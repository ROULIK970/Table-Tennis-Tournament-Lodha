/**
 * Tiny class-name joiner. No UI library — this keeps conditional Tailwind
 * classes readable without pulling in a dependency.
 */
export function cn(...classes: Array): string {
  return classes.filter(Boolean).join(" ")
}

/** Format an ISO date/datetime string for display, or a fallback when empty. */
export function formatDateTime(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  if (!value) return "TBD"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "TBD"
  return new Intl.DateTimeFormat("en-IN", options).format(date)
}

/** Format an ISO date (no time) for display, or a fallback when empty. */
export function formatDate(value: string | null | undefined): string {
  return formatDateTime(value, { dateStyle: "long" })
}

/** URL-safe slug from arbitrary text, e.g. "Men's Singles" -> "men-s-singles". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Resolve a promise to a fallback instead of throwing. Used by public server
 * components so the site renders an empty state when Strapi is unreachable
 * (e.g. during first-run seeding) rather than returning a 500.
 */
export async function safe<T>(promise: Promise, fallback: T): Promise {
  try {
    return await promise
  } catch {
    return fallback
  }
}
