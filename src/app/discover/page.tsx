import type { Metadata } from "next"
import { Suspense } from "react"
import { DiscoveryScannerWorkspace } from "@/components/discover/discovery-scanner-workspace"
import { listTargets } from "@/lib/terratwin/analog-service"
import { getAllAtlasCandidates } from "@/lib/terratwin/services/discovery-atlas-service"
import { DsEyebrow, DsHonestyBadge } from "@/components/ds/primitives"

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
    <main className="tt-surface-dark min-h-screen py-10 md:py-12">
      <div className="tt-container flex flex-col gap-7">
        <header className="flex flex-col justify-between gap-5 border-b border-[var(--tt-dark-border)] pb-6 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            <DsEyebrow label="REGIONAL SCREENING & 31-SITE GLOBAL ATLAS" />
            <h1 className="tt-display-m text-[var(--tt-dark-ink)]">Discovery Scanner</h1>
            <p className="max-w-2xl text-xs leading-relaxed text-[var(--tt-dark-ink-secondary)] sm:text-sm">
              Screen bounded WGS84 regions using live Open-Meteo DEM, NASA POWER climatology, and Macrostrat geology, or
              explore 31 curated Earth analog sites across 18 countries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <DsHonestyBadge tone="neutral" label="Bounded Grid: Max 16 Cells (≤6°×6°)" />
            <DsHonestyBadge tone="high" label="≥40% Coverage Gate Active" />
          </div>
        </header>

        <Suspense
          fallback={
            <div className="flex h-[620px] w-full animate-pulse items-center justify-center rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] font-mono text-xs uppercase tracking-[0.14em] text-[var(--tt-dark-ink-muted)]">
              INITIALIZING DISCOVERY SCANNER WORKSPACE...
            </div>
          }
        >
          <DiscoveryScannerContent />
        </Suspense>
      </div>
    </main>
  )
}
