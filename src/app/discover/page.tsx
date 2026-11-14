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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-sky-400">
            <ScanSearch className="size-3.5" aria-hidden="true" />
            <span className="font-medium">
              Regional Screening &amp; 31-Site Global Atlas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Discovery Scanner
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
            Screen bounded WGS84 regions using live Open-Meteo DEM, NASA POWER climatology, and Macrostrat geology, or explore 31 curated Earth analog sites across 18 countries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-slate-300 font-medium">
            Bounded Grid: Max 16 Cells (&le;6&deg;&times;6&deg;)
          </span>
          <span className="rounded-md bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 text-sky-300 font-medium">
            &ge;40% Coverage Gate Active
          </span>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="h-[620px] w-full rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse flex items-center justify-center font-mono text-sm text-slate-400">
            INITIALIZING DISCOVERY SCANNER WORKSPACE…
          </div>
        }
      >
        <DiscoveryScannerContent />
      </Suspense>
    </main>
  )
}
