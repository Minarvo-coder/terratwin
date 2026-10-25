import Link from "next/link"
import { Globe, Compass, Orbit } from "lucide-react"
import { SiteNav } from "./site-nav"
import { MissionClock } from "./mission-clock"
import AuthButton from "@/components/auth-button"
import { Suspense } from "react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-cyan-500/15 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            <Orbit className="size-5 transition-transform duration-700 group-hover:rotate-180" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-wider text-white">
                TERRATWIN
              </span>
              <span className="rounded bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.2 text-[9px] font-mono font-medium tracking-widest text-cyan-400">
                NASA APPS
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
              Planetary Analog Radar
            </span>
          </div>
        </Link>

        {/* Center: Mission Clock & Telemetry */}
        <MissionClock />

        {/* Right Navigation & Auth */}
        <div className="flex items-center gap-4">
          <SiteNav />
          <div className="hidden h-5 w-px bg-cyan-500/20 sm:block" />
          <Suspense fallback={<div className="h-8 w-24 rounded-lg bg-slate-800/60 animate-pulse border border-slate-700/50" />}>
            <AuthButton />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
