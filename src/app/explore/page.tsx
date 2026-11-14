import type { Metadata } from "next"
import { Suspense } from "react"
import { ExplorerDashboard } from "@/components/explorer/explorer-dashboard"
import { listTargets } from "@/lib/terratwin/analog-service"
import { FileSpreadsheet, FileCode } from "lucide-react"

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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-sky-400">
            <span className="size-1.5 rounded-full bg-sky-400" />
            <span className="font-medium">Planetary Analog Explorer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Planetary Analog Mission Control
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
            Investigate Moon and Mars targets in 3D, inspect orbital telemetry, and evaluate multi-site Earth analog portfolios with transparent physical similarity algorithms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <a
            href="/api/export?format=csv"
            download="terratwin_telemetry_matrix.csv"
            className="rounded-md bg-slate-900 border border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 px-3 py-1.5 text-slate-300 hover:text-white flex items-center gap-1.5 transition font-medium"
            title="Download Full Scientific Telemetry Matrix (CSV)"
          >
            <FileSpreadsheet className="size-3.5 text-sky-400" />
            <span>Export CSV</span>
          </a>
          <a
            href="/api/export?format=json"
            download="terratwin_catalog.json"
            className="rounded-md bg-slate-900 border border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 px-3 py-1.5 text-slate-300 hover:text-white flex items-center gap-1.5 transition font-medium"
            title="Download Full Scientific Provenance Catalog (JSON)"
          >
            <FileCode className="size-3.5 text-slate-400" />
            <span>Export JSON</span>
          </a>
          <span className="rounded-md bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 text-sky-300 font-medium flex items-center gap-1.5" title="3D RECON ACTIVE">
            <span className="size-1.5 rounded-full bg-sky-400" />
            <span>Recon Active</span>
            <span className="sr-only">3D RECON ACTIVE</span>
          </span>
        </div>
      </header>
      <Suspense
        fallback={
          <div className="h-[600px] w-full rounded-xl bg-slate-900/40 animate-pulse border border-slate-800 flex items-center justify-center text-slate-400 text-sm font-mono">
            INITIALIZING MISSION CONTROL TELEMETRY...
          </div>
        }
      >
        <ExplorerContent />
      </Suspense>
    </main>
  )
}
