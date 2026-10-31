import type { Metadata } from "next"
import { Suspense } from "react"
import { ExplorerDashboard } from "@/components/explorer/explorer-dashboard"
import { listTargets } from "@/lib/terratwin/analog-service"

export const metadata: Metadata = {
  title: "Planetary Mission Control | TerraTwin",
  description:
    "3D planetary reconnaissance, orbital telemetry, and algorithmic Earth analog discovery for Moon and Mars exploration missions.",
}

async function ExplorerContent() {
  const targets = await listTargets()

  return <ExplorerDashboard targets={targets} />
}

export default function ExplorePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-800/80 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400">
            <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="uppercase tracking-widest font-bold">NASA SPACE APPS // MISSION CONTROL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Planetary Analog Mission Control
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
            Investigate Moon and Mars targets in 3D, inspect orbital telemetry, and evaluate multi-site Earth analog portfolios with transparent physical similarity algorithms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="rounded-lg bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 text-cyan-300 font-semibold flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>3D RECON ACTIVE</span>
          </span>
        </div>
      </header>
      <Suspense
        fallback={
          <div className="h-[600px] w-full rounded-xl bg-card/50 animate-pulse border border-border flex items-center justify-center text-muted-foreground text-sm font-mono">
            INITIALIZING MISSION CONTROL TELEMETRY...
          </div>
        }
      >
        <ExplorerContent />
      </Suspense>
    </main>
  )
}
