"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutGrid, Radar, BookOpen } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/explore", label: "Explorer", icon: Radar },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
]

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary">
      <ul className="flex items-center gap-1.5 text-xs font-mono">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-150 border border-transparent",
                  active
                    ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 hover:border-slate-800",
                )}
              >
                <Icon className={cn("size-3.5", active ? "text-cyan-400" : "text-slate-500")} />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
