import Link from "next/link"
import { Orbit } from "lucide-react"
import { SiteNav } from "./site-nav"
import { MissionClock } from "./mission-clock"
import AuthButton from "@/components/auth-button"
import { Suspense } from "react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 lg:h-16 lg:flex-nowrap lg:py-0 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 sm:gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900 text-sky-400 transition-all group-hover:border-sky-500/50 group-hover:bg-slate-850">
            <Orbit className="size-4.5 transition-transform duration-700 group-hover:rotate-180" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-bold tracking-tight text-white sm:text-base">
                TerraTwin
              </span>
              <span className="rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-[9px] font-mono font-medium tracking-wider text-sky-300">
                NASA APPS
                <span className="sr-only">NASA SPACE APPS</span>
              </span>
            </div>
            <span className="hidden sm:block text-[11px] text-slate-400">
              Planetary Analog Intelligence
            </span>
          </div>
        </Link>

        {/* Center: Mission Clock & Telemetry */}
        <MissionClock />

        {/* Navigation (wraps onto full row on mobile/tablet portrait, inline on lg+) */}
        <div className="order-3 w-full min-w-0 lg:order-none lg:w-auto lg:flex-1 lg:flex lg:justify-end">
          <SiteNav />
        </div>

        {/* Auth */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden h-5 w-px bg-slate-800 md:block" />
          <Suspense fallback={<div className="h-8 w-24 rounded-lg bg-slate-900 animate-pulse border border-slate-800" />}>
            <AuthButton />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
