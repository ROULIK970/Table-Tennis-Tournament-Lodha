/**
 * Static, single-event configuration. There is exactly one tournament, so the
 * branding, navigation, and organizer details live here rather than in the CMS.
 */

export const EVENT = {
  name: "ResAvenue 2026",
  subtitle: "Table Tennis Tournament",
  venue: "Lodha HPM",
  tagline:
    "The annual Lodha HPM table tennis championship. Register, follow the brackets, and crown a champion.",
} as const

export const ORGANIZER = {
  name: "Pritish Sharma",
  role: "Tournament Organizer",
  email: "tt.resavenue@lodhahpm.in",
  phone: "+91 98765 43210",
  flatNumber: "A-1203, Lodha HPM",
} as const

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register" },
  { href: "/schedule", label: "Schedule" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const
