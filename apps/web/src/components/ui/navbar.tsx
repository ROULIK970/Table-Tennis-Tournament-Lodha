"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { EVENT, NAV_LINKS } from "@/lib/config"
import { cn } from "@/lib/utils"
import { buttonClass } from "@/components/ui/button"

export function Navbar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <header className="border-border bg-background sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">
            {EVENT.name}
          </span>
          <span className="text-muted text-[11px] tracking-widest uppercase">
            {EVENT.subtitle}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center gap-1 md:flex"
        >
          {NAV_LINKS.filter((l) => l.href !== "/register").map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "text-muted hover:bg-surface hover:text-foreground rounded-[2px] px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href) && "bg-surface text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/register"
          className={cn("ml-auto md:ml-0", buttonClass("primary", "sm"))}
        >
          Register Now
        </Link>
      </div>

      {/* Compact horizontal nav for small screens */}
      <nav
        aria-label="Primary mobile"
        className="border-border flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={cn(
              "text-muted hover:bg-surface hover:text-foreground rounded-[2px] px-3 py-1.5 text-sm font-medium whitespace-nowrap",
              isActive(link.href) && "bg-surface text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
