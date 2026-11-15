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
    <main className="tt-surface-light min-h-screen py-12 md:py-16">
      <div className="tt-container flex flex-col gap-6">
        <Suspense
          fallback={
            <div className="flex h-[520px] w-full animate-pulse items-center justify-center rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] font-mono text-xs uppercase tracking-[0.12em] text-[var(--tt-light-ink-muted)]">
              LOADING SCIENTIFIC DATA PROVENANCE CATALOG...
            </div>
          }
        >
          <SourcesContent />
        </Suspense>
      </div>
    </main>
  )
}
