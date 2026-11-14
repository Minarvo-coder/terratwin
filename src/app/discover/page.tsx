import type { Metadata } from "next"
import { Suspense } from "react"
import { DiscoveryScannerWorkspace } from "@/components/discover/discovery-scanner-workspace"
import { listTargets } from "@/lib/terratwin/analog-service"
import { getAllAtlasCandidates } from "@/lib/terratwin/services/discovery-atlas-service"
import { ScanSearch } from "lucide-react"

export const metadata: Metadata = {
  title: "Discovery Scanner | TerraTwin",
  description:
    "Explore Earth and discover planetary analog candidates using Open-Meteo Copernicus DEM, NASA POWER climatology, Macrostrat geology, and the 31-site Global Discovery Atlas.",
}

async function DiscoveryScannerContent() {
  const [targets, atlasEntries] = await Promise.all([
    listTargets(),
    Promise.resolve(getAllAtlasCandidates()),
  ])

  return <DiscoveryScannerWorkspace targets={targets} atlasEntries={atlasEntries} />
}

export default function DiscoverPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-800/80 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400">
            <ScanSearch className="size-3.5" aria-hidden="true" />
            <span className="uppercase tracking-widest font-bold">
              NASA SPACE APPS // LIVE REGIONAL SCREENING & GLOBAL ATLAS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Discovery Scanner
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
            Explore Earth. Discover planetary analog candidates. Run bounded regional screens via real-time open geospatial APIs or inspect curated sites across all nine challenge environments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded-lg border border-cyan-500/35 bg-cyan-950/50 px-3 py-1.5 text-cyan-200">
            MAX 10° × 10° / 100 CELLS PER SCAN
          </span>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="h-[620px] w-full rounded-xl border border-border bg-card/50 animate-pulse flex items-center justify-center font-mono text-sm text-muted-foreground">
            INITIALIZING DISCOVERY SCANNER WORKSPACE…
          </div>
        }
      >
        <DiscoveryScannerContent />
      </Suspense>
    </main>
  )
}
