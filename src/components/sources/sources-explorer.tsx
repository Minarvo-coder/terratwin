"use client"

import { useState } from "react"
import {
  ArrowUpRight,
  Database,
  Download,
  Info,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatCoordinates,
  formatFeatureValue,
  getFeatureComparabilityInfo,
  getProvenanceBadgeInfo,
} from "@/lib/terratwin/format"
import { FEATURES } from "@/lib/terratwin/features"
import { DATA_SOURCES } from "@/lib/terratwin/data-sources"
import { FEATURE_COMPATIBILITY_MATRIX } from "@/lib/terratwin/config/compatibility-matrix"
import { ScientificEvidenceExplorer } from "@/components/explorer/scientific-evidence-explorer"
import { DsEyebrow, DsHonestyBadge, DsSegmentedControl } from "@/components/ds/primitives"
import type { EarthCandidate, FeatureKey, PlanetaryTarget } from "@/lib/terratwin/types"
import type { DatasetSourceRecord } from "@/lib/terratwin/types/api"

interface SourcesExplorerProps {
  targets: PlanetaryTarget[]
  candidates: EarthCandidate[]
  sources: DatasetSourceRecord[]
}

export function SourcesExplorer({ targets, candidates, sources }: SourcesExplorerProps) {
  const [activeTab, setActiveTab] = useState<"matrix" | "evidence" | "catalog" | "harmonization">("matrix")
  const [bodyFilter, setBodyFilter] = useState<"all" | "Mars" | "Moon" | "Earth">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCell, setSelectedCell] = useState<{
    location: PlanetaryTarget | EarthCandidate
    featureKey: FeatureKey
  } | null>(null)

  const allLocations = [...targets, ...candidates]

  const filteredLocations = allLocations.filter((loc) => {
    const isTarget = "body" in loc
    const body = isTarget ? (loc.body === "mars" ? "Mars" : "Moon") : "Earth"
    if (bodyFilter !== "all" && body !== bodyFilter) return false
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      return loc.name.toLowerCase().includes(q) || body.toLowerCase().includes(q)
    }
    return true
  })

  const filteredDataSources = DATA_SOURCES.filter((ds) => {
    if (bodyFilter !== "all" && ds.scope !== bodyFilter && ds.scope !== "Multi-body") return false
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      return (
        ds.name.toLowerCase().includes(q) ||
        ds.provider.toLowerCase().includes(q) ||
        ds.informs.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* 1. Editorial Header */}
      <div className="rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-6 md:p-8 shadow-[var(--tt-shadow-soft)]">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <DsEyebrow label="DATA PROVENANCE & NASA ARCHIVES" />
              <DsHonestyBadge tone="high" label="Verified Sources" />
            </div>

            <h1 className="tt-display-m text-[var(--tt-light-ink)]">
              Authoritative Planetary &amp; Earth Telemetry Catalog
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--tt-light-ink-secondary)]">
              TerraTwin is founded on publicly traceable measurements from NASA Planetary Data System (PDS), NASA
              Earthdata / Langley POWER, and peer-reviewed field studies. Inspect dataset baselines, examine the
              coverage matrix across all {allLocations.length} locations, or export the complete catalog.
            </p>
          </div>

          {/* Export Pills */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/api/export?format=csv"
              download="terratwin_scientific_telemetry_matrix.csv"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--tt-radius-pill)] border border-[var(--tt-light-border-strong)] bg-[var(--tt-light-bg)] px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--tt-light-ink)] transition-colors hover:border-[var(--tt-accent)] hover:text-[var(--tt-accent)]"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>Export CSV</span>
              <span className="sr-only">EXPORT CSV MATRIX</span>
            </a>

            <a
              href="/api/export?format=json"
              download="terratwin_scientific_catalog.json"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--tt-radius-pill)] border border-[var(--tt-light-border-strong)] bg-[var(--tt-light-bg)] px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--tt-light-ink)] transition-colors hover:border-[var(--tt-accent)] hover:text-[var(--tt-accent)]"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>Export JSON</span>
              <span className="sr-only">EXPORT JSON CATALOG</span>
            </a>
          </div>
        </div>

        {/* Metric Strip */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--tt-light-border)] pt-6 sm:grid-cols-4">
          <div className="rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-3.5">
            <div className="tt-mono-label text-[var(--tt-light-ink-muted)]">Integrated Archives</div>
            <div className="tt-mono-data mt-1 text-lg font-semibold text-[var(--tt-light-ink)]">
              {sources.length} Active Sources
            </div>
          </div>
          <div className="rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-3.5">
            <div className="tt-mono-label text-[var(--tt-light-ink-muted)]">Locations Indexed</div>
            <div className="tt-mono-data mt-1 text-lg font-semibold text-[var(--tt-light-ink)]">
              {allLocations.length} Sites
            </div>
          </div>
          <div className="rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-3.5">
            <div className="tt-mono-label text-[var(--tt-light-ink-muted)]">Channels</div>
            <div className="tt-mono-data mt-1 text-lg font-semibold text-[var(--tt-light-ink)]">
              {FEATURES.length} Dimensions
            </div>
          </div>
          <div className="rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-3.5">
            <div className="tt-mono-label text-[var(--tt-light-ink-muted)]">Harmonization</div>
            <div className="tt-mono-data mt-1 text-lg font-semibold text-[var(--tt-accent)]">
              4 Comparability Tiers
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabs & Filter Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--tt-light-border)] pb-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "matrix" as const, label: "Coverage Matrix", icon: <Layers className="size-3.5" /> },
            { id: "evidence" as const, label: "Evidence Lineage Explorer", icon: <ShieldCheck className="size-3.5" /> },
            { id: "catalog" as const, label: "NASA Dataset Archives", icon: <Database className="size-3.5" /> },
            { id: "harmonization" as const, label: "Harmonization Guide", icon: <Info className="size-3.5" /> },
          ].map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--tt-radius-pill)] border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  active
                    ? "border-[var(--tt-light-ink)] bg-[var(--tt-light-ink)] text-[var(--tt-light-surface)]"
                    : "border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] text-[var(--tt-light-ink-secondary)] hover:text-[var(--tt-light-ink)]",
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--tt-light-ink-muted)]"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search locations or datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-56 rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border-strong)] bg-[var(--tt-light-surface)] pl-8 pr-3 text-xs text-[var(--tt-light-ink)] placeholder:text-[var(--tt-light-ink-muted)] focus:border-[var(--tt-accent)] focus:outline-none sm:w-64"
            />
          </div>

          <DsSegmentedControl
            tone="light"
            size="sm"
            value={bodyFilter}
            onChange={setBodyFilter}
            ariaLabel="Filter by planetary body"
            options={[
              { value: "all", label: "All Bodies" },
              { value: "Mars", label: "Mars" },
              { value: "Moon", label: "Moon" },
              { value: "Earth", label: "Earth" },
            ]}
          />
        </div>
      </div>

      {/* 3. TAB 1: Coverage Matrix Grid */}
      {activeTab === "matrix" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--tt-light-ink-secondary)]">
            <span>
              Showing {filteredLocations.length} locations across {FEATURES.length} physical dimensions. Click any cell
              to inspect measurement provenance.
            </span>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--tt-success)]" />
                <span>Verified NASA PDS</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--tt-match-high)]" />
                <span>NASA POWER / Earthdata</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--tt-accent)]" />
                <span>Literature / Field Study</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--tt-match-low)]" />
                <span>Incomparable</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)]">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[var(--tt-light-border)] bg-[var(--tt-light-band)]/70 text-[10px] uppercase text-[var(--tt-light-ink-muted)]">
                  <th className="sticky left-0 z-10 min-w-[200px] bg-[var(--tt-light-band)] p-3 text-left font-semibold text-[var(--tt-light-ink)]">
                    Location &amp; Body
                  </th>
                  {FEATURES.map((f) => (
                    <th key={f.key} className="min-w-[130px] p-3 text-center font-semibold" title={f.description}>
                      <div className="text-[var(--tt-light-ink)]">{f.shortLabel}</div>
                      <div className="text-[9px] font-normal normal-case text-[var(--tt-light-ink-muted)]">
                        {f.unit || "class"}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--tt-light-border)]">
                {filteredLocations.map((loc) => {
                  const isTarget = "body" in loc
                  const bodyName = isTarget ? (loc.body === "mars" ? "Mars" : "Moon") : "Earth"
                  const provMap = loc.provenanceMap || {}

                  return (
                    <tr key={loc.id} className="transition-colors hover:bg-[var(--tt-light-bg)]">
                      <td className="sticky left-0 z-10 border-r border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--tt-light-ink)]">
                            <span
                              className={cn(
                                "size-2 shrink-0 rounded-full",
                                bodyName === "Mars"
                                  ? "bg-[var(--tt-accent)]"
                                  : bodyName === "Moon"
                                    ? "bg-[var(--tt-light-ink-muted)]"
                                    : "bg-[var(--tt-dark-periwinkle)]",
                              )}
                            />
                            <span className="max-w-[180px] truncate">{loc.name}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tt-light-ink-muted)]">
                            <span className="font-semibold uppercase">{bodyName}</span>
                            <span>&middot;</span>
                            <span>
                              {loc.latitude !== undefined && loc.longitude !== undefined
                                ? formatCoordinates(loc.latitude, loc.longitude)
                                : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {FEATURES.map((f) => {
                        const val = loc.environment[f.key]
                        const prov = provMap[f.key]
                        const badge = getProvenanceBadgeInfo(prov?.sourceTitle, prov?.status)
                        const compInfo = getFeatureComparabilityInfo(f.key)
                        const isIncomparable = compInfo.classification === "NOT_COMPARABLE"
                        const isMissing = val === null || val === undefined
                        const selected =
                          selectedCell?.location.id === loc.id && selectedCell?.featureKey === f.key

                        return (
                          <td
                            key={f.key}
                            onClick={() => setSelectedCell({ location: loc, featureKey: f.key })}
                            className={cn(
                              "cursor-pointer border-r border-[var(--tt-light-border)] p-2 text-center transition hover:bg-[var(--tt-accent-soft)]",
                              selected && "bg-[var(--tt-accent-soft)] ring-1 ring-inset ring-[var(--tt-accent)]",
                            )}
                          >
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span
                                className={cn(
                                  "tt-mono-data text-[11px] font-semibold",
                                  isMissing
                                    ? "text-[var(--tt-light-ink-muted)]"
                                    : isIncomparable
                                      ? "text-[var(--tt-light-ink-secondary)]"
                                      : "text-[var(--tt-light-ink)]",
                                )}
                              >
                                {formatFeatureValue(f.key, val ?? null)}
                              </span>

                              {!isMissing && (
                                <span className="rounded border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] px-1.5 py-0.5 text-[8px] font-medium uppercase text-[var(--tt-light-ink-secondary)]">
                                  {badge.label}
                                </span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 2: Scientific Evidence Lineage Explorer */}
      {activeTab === "evidence" && (
        <div className="tt-surface-dark rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] p-5">
          <ScientificEvidenceExplorer allTargets={targets} allCandidates={candidates} />
        </div>
      )}

      {/* 5. TAB 3: NASA Dataset Archives */}
      {activeTab === "catalog" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-[var(--tt-light-ink-secondary)]">
            <span>Official dataset archives currently ingested and queued for pipeline updates.</span>
            <span className="tt-mono-data font-semibold text-[var(--tt-accent)]">
              {filteredDataSources.length} Datasets Listed
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredDataSources.map((ds) => {
              const isIntegrated = ds.status === "integrated"
              return (
                <div
                  key={ds.name}
                  className="flex flex-col justify-between gap-4 rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-5"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="tt-mono-label text-[var(--tt-light-ink-muted)]">
                          {ds.scope} Telemetry Archive
                        </span>
                        <h3 className="mt-1 text-base font-semibold text-[var(--tt-light-ink)]">{ds.name}</h3>
                      </div>

                      <DsHonestyBadge
                        tone={isIntegrated ? "high" : "neutral"}
                        label={isIntegrated ? "Integrated · Live" : "Pipeline Queue"}
                      />
                    </div>

                    <div className="text-xs text-[var(--tt-light-ink-secondary)]">
                      Provider: <span className="font-medium text-[var(--tt-light-ink)]">{ds.provider}</span>
                    </div>

                    {ds.version && (
                      <div className="truncate rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--tt-light-ink-secondary)]">
                        Product: {ds.version}
                      </div>
                    )}

                    <div className="mt-1 text-xs leading-relaxed text-[var(--tt-light-ink-secondary)]">
                      <strong className="text-[var(--tt-light-ink)]">Environmental Parameters:</strong> {ds.informs}
                    </div>

                    {ds.resolution && (
                      <div className="font-mono text-[11px] text-[var(--tt-light-ink-muted)]">
                        Spatial Resolution: {ds.resolution}
                      </div>
                    )}

                    {ds.integrationNotes && (
                      <div className="mt-1 rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-2.5 font-mono text-[11px] leading-relaxed text-[var(--tt-light-ink-secondary)]">
                        <span className="font-semibold text-[var(--tt-light-ink)]">Integration Architecture: </span>
                        {ds.integrationNotes}
                      </div>
                    )}
                  </div>

                  {ds.sourceUrl && (
                    <a
                      href={ds.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center gap-1.5 border-t border-[var(--tt-light-border)] pt-3 text-xs font-medium text-[var(--tt-light-ink)] transition-colors hover:text-[var(--tt-accent)]"
                    >
                      <span>Access Official NASA / ESA Archive</span>
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 6. TAB 4: Harmonization Guide */}
      {activeTab === "harmonization" && (
        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-6">
            <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--tt-light-ink)]">
              <Sparkles className="size-4 text-[var(--tt-accent)]" aria-hidden="true" />
              <span>Scientific Data Harmonization &amp; Physical Comparability Principles</span>
            </h3>
            <p className="max-w-4xl text-sm leading-relaxed text-[var(--tt-light-ink-secondary)]">
              Measurements from orbital radiometers cannot be equated with in situ weather stations without accounting
              for instrument field-of-view, atmospheric absorption, and local topography. All physical dimensions in
              TerraTwin are categorized under a 4-tier comparability framework.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURE_COMPATIBILITY_MATRIX.map((item) => {
              const isDirect = item.classification === "DIRECTLY COMPARABLE"
              const isTransformed = item.classification === "COMPARABLE AFTER TRANSFORMATION"

              return (
                <div
                  key={item.key}
                  className="flex flex-col justify-between gap-3 rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[var(--tt-light-ink)]">{item.name}</span>
                      <DsHonestyBadge
                        tone={isDirect ? "high" : isTransformed ? "moderate" : "low"}
                        label={item.classification}
                      />
                    </div>
                    <div className="tt-mono-label mt-1 text-[var(--tt-light-ink-muted)]">{item.category}</div>
                    <p className="mt-2.5 text-xs leading-relaxed text-[var(--tt-light-ink-secondary)]">
                      <strong className="text-[var(--tt-light-ink)]">Physical Basis:</strong> {item.scientificBasis}
                    </p>
                  </div>

                  <div className="rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-2.5 font-mono text-[11px] leading-normal text-[var(--tt-light-ink-secondary)]">
                    <span className="font-semibold text-[var(--tt-light-ink)]">Harmonization Rule:</span>{" "}
                    {item.harmonizationNotes}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 7. Cell Provenance Inspector Modal */}
      {selectedCell && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="relative flex w-full max-w-lg flex-col gap-4 rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-6 text-xs text-[var(--tt-light-ink)] shadow-[var(--tt-shadow-float)]">
            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              aria-label="Close inspector"
              className="absolute top-4 right-4 rounded-lg p-1.5 text-[var(--tt-light-ink-muted)] transition hover:bg-[var(--tt-light-band)] hover:text-[var(--tt-light-ink)] cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[var(--tt-accent)]">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                <span className="tt-mono-label">TELEMETRY PROVENANCE INSPECTOR</span>
              </div>
              <h3 className="mt-1 text-lg font-semibold text-[var(--tt-light-ink)]">{selectedCell.location.name}</h3>
              <p className="mt-0.5 text-[11px] text-[var(--tt-light-ink-secondary)]">
                {"body" in selectedCell.location
                  ? `${selectedCell.location.body.toUpperCase()} · ${selectedCell.location.summary}`
                  : `${selectedCell.location.country} · ${selectedCell.location.setting}`}
              </p>
            </div>

            {(() => {
              const feat = FEATURES.find((f) => f.key === selectedCell.featureKey)
              const val = selectedCell.location.environment[selectedCell.featureKey]
              const prov = selectedCell.location.provenanceMap?.[selectedCell.featureKey]
              const compInfo = getFeatureComparabilityInfo(selectedCell.featureKey)

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-4">
                    <div>
                      <div className="tt-mono-label text-[var(--tt-light-ink-muted)]">{feat?.label}</div>
                      <div className="tt-mono-data mt-1 text-2xl font-semibold text-[var(--tt-light-ink)]">
                        {formatFeatureValue(selectedCell.featureKey, val ?? null)}
                      </div>
                    </div>
                    <DsHonestyBadge
                      tone={
                        compInfo.classification === "DIRECTLY_COMPARABLE"
                          ? "high"
                          : compInfo.classification === "COMPARABLE_AFTER_TRANSFORMATION"
                            ? "moderate"
                            : "low"
                      }
                      label={compInfo.label}
                    />
                  </div>

                  <div className="rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-3 text-[11px] text-[var(--tt-light-ink-secondary)]">
                    <strong className="text-[var(--tt-light-ink)]">Classification Notice:</strong> {compInfo.rationale}
                  </div>

                  {prov ? (
                    <div className="flex flex-col gap-1.5 rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-4 text-[11px]">
                      <div className="flex items-center justify-between font-semibold text-[var(--tt-light-ink)]">
                        <span>DATASET: {prov.sourceTitle}</span>
                        {prov.sourceUrl && (
                          <a
                            href={prov.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--tt-accent)] hover:underline"
                          >
                            <span>Archive URL</span>
                            <ArrowUpRight className="size-3" />
                          </a>
                        )}
                      </div>
                      {prov.datasetVersion && (
                        <div className="text-[var(--tt-light-ink-secondary)]">Product Version: {prov.datasetVersion}</div>
                      )}
                      {prov.spatialResolution && (
                        <div className="text-[var(--tt-light-ink-secondary)]">
                          Spatial Resolution: {prov.spatialResolution}
                        </div>
                      )}
                      {prov.measurementPeriod && (
                        <div className="text-[var(--tt-light-ink-muted)]">
                          Observation Period: {prov.measurementPeriod}
                        </div>
                      )}
                      {prov.qualityNotes && (
                        <div className="mt-1 rounded border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-2 italic text-[var(--tt-light-ink-secondary)]">
                          {prov.qualityNotes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-band)] p-4 text-[11px] text-[var(--tt-light-ink-secondary)]">
                      Illustrative prototype value sourced from preliminary catalog. Not verified planetary evidence.
                    </div>
                  )}
                </div>
              )
            })()}

            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="h-10 w-full rounded-[var(--tt-radius-control)] bg-[var(--tt-light-ink)] font-medium text-[var(--tt-light-surface)] transition hover:opacity-90 cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
