"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/explore", label: "Explorer" },
  { href: "/discover", label: "Discovery Scanner" },
  { href: "/sources", label: "Data Sources" },
  { href: "/methodology", label: "Methodology" },
]

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary" className="min-w-0 max-w-full">
      <ul className="flex flex-wrap items-center justify-center gap-1 text-xs">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--tt-radius-pill)] px-3.5 py-1.5 text-xs font-medium transition-all duration-[var(--tt-duration)] ease-[var(--tt-ease)] whitespace-nowrap",
                  active
                    ? "bg-[var(--tt-light-surface)] text-[var(--tt-light-ink)] shadow-[0_2px_10px_rgba(17,19,24,0.06)]"
                    : "text-[var(--tt-light-ink-secondary)] hover:text-[var(--tt-light-ink)]",
                )}
              >
                {active && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tt-accent)]"
                    aria-hidden="true"
                  />
                )}
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
