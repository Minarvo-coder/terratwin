import type { Metadata } from "next"
import { Suspense } from "react"
import {
  fetchDatasetSources,
  loadVerifiedLocationsAndFeatures,
} from "@/lib/terratwin/db/planetary-repository"
import { SourcesExplorer } from "@/components/sources/sources-explorer"

export const metadata: Metadata = {
  title: "Scientific Data Sources & Provenance | TerraTwin",
  description:
    "Authoritative NASA Planetary Data System (PDS), NASA Earthdata, and peer-reviewed field study provenance matrix for planetary analog research.",
}

async function SourcesContent() {
  const data = await loadVerifiedLocationsAndFeatures()
  const sources = await fetchDatasetSources().catch(() => data.sources)

  return (
    <SourcesExplorer
      targets={data.targets}
      candidates={data.candidates}
      sources={sources}
    />
  )
}

export default function SourcesPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6">
      <Suspense
        fallback={
          <div className="h-[600px] w-full rounded-xl bg-slate-900/40 animate-pulse border border-slate-800 flex items-center justify-center text-slate-400 text-sm font-mono">
            LOADING SCIENTIFIC DATA PROVENANCE CATALOG...
          </div>
        }
      >
        <SourcesContent />
      </Suspense>
    </main>
  )
}
