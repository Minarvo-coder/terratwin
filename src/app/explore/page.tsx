import type { Metadata } from "next"
import { Suspense } from "react"
import { ExplorerDashboard } from "@/components/explorer/explorer-dashboard"
import { listTargets } from "@/lib/terratwin/analog-service"

export const metadata: Metadata = {
  title: "Analog Explorer",
  description: "Rank illustrative Earth analog candidates for Moon and Mars targets by mission purpose.",
}

async function ExplorerContent() {
  const targets = await listTargets()

  return <ExplorerDashboard targets={targets} />
}

export default function ExplorePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Analog explorer</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Choose a planetary target and mission purpose to rank Earth candidates by weighted environmental
            similarity.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="rounded bg-slate-800 border border-slate-700/80 px-2.5 py-1 text-cyan-300">
            Algorithmic Mission Telemetry Engine
          </span>
        </div>
      </header>
      <Suspense
        fallback={
          <div className="h-[600px] w-full rounded-xl bg-card/50 animate-pulse border border-border flex items-center justify-center text-muted-foreground text-sm">
            Loading explorer workspace...
          </div>
        }
      >
        <ExplorerContent />
      </Suspense>
    </main>
  )
}
