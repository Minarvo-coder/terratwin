import type { Metadata } from "next"
import { Suspense } from "react"
import { Download } from "lucide-react"
import { ExplorerDashboard } from "@/components/explorer/explorer-dashboard"
import { listTargets } from "@/lib/terratwin/analog-service"
import { DsEyebrow, DsHonestyBadge } from "@/components/ds/primitives"

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
    <main className="tt-surface-dark min-h-screen py-10 md:py-12">
      <div className="tt-container flex flex-col gap-7">
        <header className="flex flex-col justify-between gap-5 border-b border-[var(--tt-dark-border)] pb-6 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            <DsEyebrow label="PLANETARY ANALOG EXPLORER" />
            <h1 className="tt-display-m text-[var(--tt-dark-ink)]">
              Find your common ground.
              <span className="sr-only">Planetary Analog Mission Control</span>
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-[var(--tt-dark-ink-secondary)] sm:text-sm">
              Investigate Moon and Mars targets in 3D, inspect orbital telemetry, and evaluate multi-site Earth analog
              portfolios with transparent physical similarity algorithms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/api/export?format=csv"
              download="terratwin_telemetry_matrix.csv"
              className="inline-flex h-9 items-center gap-2 rounded-[var(--tt-radius-pill)] border border-[var(--tt-dark-border-strong)] bg-[var(--tt-dark-panel)] px-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--tt-dark-ink)] transition-colors hover:border-[var(--tt-accent)] hover:text-[var(--tt-accent)]"
              title="Download Full Scientific Telemetry Matrix (CSV)"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </a>
            <a
              href="/api/export?format=json"
              download="terratwin_catalog.json"
              className="inline-flex h-9 items-center gap-2 rounded-[var(--tt-radius-pill)] border border-[var(--tt-dark-border-strong)] bg-[var(--tt-dark-panel)] px-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--tt-dark-ink)] transition-colors hover:border-[var(--tt-accent)] hover:text-[var(--tt-accent)]"
              title="Download Full Scientific Provenance Catalog (JSON)"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>Export JSON</span>
            </a>
            <DsHonestyBadge tone="high" label="Recon Active" />
            <span className="sr-only">3D RECON ACTIVE</span>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="flex h-[600px] w-full animate-pulse items-center justify-center rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] font-mono text-xs uppercase tracking-[0.14em] text-[var(--tt-dark-ink-muted)]">
              INITIALIZING MISSION CONTROL TELEMETRY...
            </div>
          }
        >
          <ExplorerContent />
        </Suspense>
      </div>
    </main>
  )
}
