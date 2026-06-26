"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { logout } from "@/lib/admin-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/bracket", label: "Bracket" },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  async function handleLogout() {
    await logout()
    router.replace("/admin/login")
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <nav aria-label="Admin" className="flex flex-1 flex-wrap gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={cn(
              "text-muted hover:bg-background hover:text-foreground rounded-[2px] px-3 py-1.5 text-sm font-medium",
              isActive(link.href) && "bg-background text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/"
        className="text-muted hover:text-foreground px-3 py-1.5 text-sm"
      >
        View site
      </Link>
      <Button variant="secondary" size="sm" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  )
}
