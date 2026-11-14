"use client"

import { useMemo, useState } from "react"
import type {
  AnalogEnvironmentCategory,
  AnalogNoveltyTier,
  DiscoveryAtlasEntry,
} from "@/lib/terratwin/types"
import type {
  DiscoveryCandidateResult,
  ProviderTelemetryStatus,
  RegionalDiscoveryResponse,
} from "@/lib/terratwin/types/discovery"
import {
  ANALOG_ENVIRONMENT_CATEGORIES,
  ANALOG_ENVIRONMENT_CATEGORY_LABELS,
} from "@/lib/terratwin/features"
import {
  formatCoordinates,
  formatCoverage,
  formatScore,
} from "@/lib/terratwin/format"
import {
  getVisualTierStyle,
  summarizeDiscoveryResponse,
} from "@/lib/terratwin/scanner/scanner-utils"
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Compass,
  Crosshair,
  Database,
  Filter,
  Info,
  MapPin,
  Radar,
  Search,
  ShieldAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscoveryResultsPanelProps {
  activeTab: "live" | "atlas"
  onTabChange: (tab: "live" | "atlas") => void
  response: RegionalDiscoveryResponse | null
  activeTargetId: string
  activeMissionProfileId: string
  isStaleTargetOrProfile: boolean
  isBusy: boolean
  selectedCandidateId: string | null
  compareCandidateIds: string[]
  onSelectCandidate: (candidateId: string) => void
  onToggleCompareCandidate: (candidateId: string) => void
  atlasEntries: DiscoveryAtlasEntry[]
  selectedAtlasId: string | null
  onSelectAtlasSite: (atlasId: string) => void
  onFocusAtlasOnMap: (site: DiscoveryAtlasEntry) => void
  onScanAroundAtlasSite: (site: DiscoveryAtlasEntry) => void
}

type LiveDisplaySort = "backend-rank" | "score-desc" | "coverage-desc"

function ProviderBadge({ status }: { status: ProviderTelemetryStatus }) {
  const shortName =
    status.provider === "Open-Meteo Elevation"
      ? "Open-Meteo DEM"
      : status.provider === "NASA POWER Climatology"
      ? "NASA POWER"
      : "Macrostrat Geo"

  const badgeTone =
    status.status === "success" || status.status === "cached"
      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
      : status.status === "partial"
      ? "border-amber-500/40 bg-amber-950/40 text-amber-300"
      : "border-rose-500/40 bg-rose-950/40 text-rose-300"

  return (
    <div className={cn("min-w-0 rounded-lg border px-2 py-1.5 font-mono text-[10px]", badgeTone)}>
      <div className="flex flex-wrap items-center justify-between gap-1 font-semibold">
        <span>{shortName}</span>
        <span className="uppercase">{status.status}</span>
      </div>
      <div className="mt-0.5 text-[9px] opacity-80">
        {status.recordsFetched} rec · {status.latencyMs}ms
      </div>
      {status.error && (
        <div className="mt-0.5 truncate text-[9px] text-rose-200" title={status.error}>
          {status.error}
        </div>
      )}
    </div>
  )
}

export function DiscoveryResultsPanel({
  activeTab,
  onTabChange,
  response,
  isStaleTargetOrProfile,
  isBusy,
  selectedCandidateId,
  compareCandidateIds,
  onSelectCandidate,
  onToggleCompareCandidate,
  atlasEntries,
  selectedAtlasId,
  onSelectAtlasSite,
  onFocusAtlasOnMap,
  onScanAroundAtlasSite,
}: DiscoveryResultsPanelProps) {
  const [liveSort, setLiveSort] = useState<LiveDisplaySort>("backend-rank")
  const [atlasCategory, setAtlasCategory] = useState<AnalogEnvironmentCategory | "all">("all")
  const [atlasNovelty, setAtlasNovelty] = useState<AnalogNoveltyTier | "all">("all")
  const [atlasSearch, setAtlasSearch] = useState("")

  const summary = useMemo(
    () => (response ? summarizeDiscoveryResponse(response) : null),
    [response]
  )

  const orderedLiveCandidates = useMemo(() => {
    if (!response) return [] as DiscoveryCandidateResult[]
    const list = [...response.candidates]
    if (liveSort === "score-desc") {
      return list.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.rank - b.rank)
    }
    if (liveSort === "coverage-desc") {
      return list.sort((a, b) => b.coverage - a.coverage || a.rank - b.rank)
    }
    return list.sort((a, b) => a.rank - b.rank)
  }, [response, liveSort])

  const reliableCandidates = orderedLiveCandidates.filter((c) => c.isReliable && c.score !== null)
  const insufficientCandidates = orderedLiveCandidates.filter((c) => !c.isReliable || c.score === null)

  const filteredAtlas = useMemo(() => {
    const q = atlasSearch.trim().toLowerCase()
    return atlasEntries.filter((entry) => {
      if (atlasCategory !== "all" && entry.category !== atlasCategory) return false
      if (atlasNovelty !== "all" && entry.noveltyTier !== atlasNovelty) return false
      if (
        q &&
        !entry.name.toLowerCase().includes(q) &&
        !entry.country.toLowerCase().includes(q) &&
        !entry.setting.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [atlasEntries, atlasCategory, atlasNovelty, atlasSearch])

  return (
    <aside
      aria-label="Discovery intelligence and candidate results"
      data-scan-busy={String(isBusy)}
      className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            03 // DISCOVERY INTELLIGENCE
          </span>
          <h2 className="text-sm font-bold text-white">Candidates & Scientific Triage</h2>
        </div>
        <Radar className="size-4 text-cyan-400" aria-hidden="true" />
      </div>

      {/* Distinct Mode Switcher: Live Regional Discovery vs Curated Global Atlas */}
      <div
        className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-800 bg-slate-950 p-1"
        role="tablist"
        aria-label="Candidate catalog mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "live"}
          onClick={() => onTabChange("live")}
          className={cn(
            "min-h-8 rounded-md px-2 py-1.5 font-mono text-[11px] font-semibold transition cursor-pointer",
            activeTab === "live"
              ? "bg-cyan-950/80 text-cyan-200 border border-cyan-500/40"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Live Regional ({response?.candidates.length ?? 0})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "atlas"}
          onClick={() => onTabChange("atlas")}
          className={cn(
            "min-h-8 rounded-md px-2 py-1.5 font-mono text-[11px] font-semibold transition cursor-pointer",
            activeTab === "atlas"
              ? "bg-amber-950/70 text-amber-200 border border-amber-500/40"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Curated Atlas ({atlasEntries.length})
        </button>
      </div>

      {/* LIVE REGIONAL DISCOVERY TAB */}
      {activeTab === "live" && (
        <div className="flex flex-col gap-3" role="tabpanel" aria-label="Live regional discovery results">
          {/* Stale target/profile warning banner */}
          {response && isStaleTargetOrProfile && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-950/40 p-2.5 text-[11px] text-amber-200"
            >
              <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
              <span>
                Displayed results were scored for <strong>{response.target.name}</strong> ({response.missionProfile.label}). Re-run the scan to evaluate your newly selected target or mission profile.
              </span>
            </div>
          )}

          {!response ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center">
              <Compass className="mx-auto size-7 text-slate-500" aria-hidden="true" />
              <h3 className="mt-2 text-xs font-bold text-slate-200">
                {isBusy ? "Evaluating regional analog evidence…" : "No live regional scan executed yet"}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Select a bounded Earth region (max 10° × 10°) and launch a discovery scan to retrieve Copernicus DEM slope, NASA POWER climatology, and Macrostrat lithology. Or browse the 31 curated sites in the <strong>Curated Atlas</strong> tab.
              </p>
            </div>
          ) : (
            <>
              {/* Compact Scan Summary Dashboard */}
              {summary && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/75 p-2.5 space-y-2.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>
                      {response.target.name} · {response.missionProfile.label}
                    </span>
                    {summary.responseCacheHit && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-cyan-300">
                        SERVER CACHE HIT
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-1.5 font-mono">
                    <div className="rounded border border-slate-800/80 bg-slate-900/70 px-2 py-1.5">
                      <span className="block text-[9px] text-slate-400 uppercase">Cells Analyzed</span>
                      <span className="text-xs font-bold text-white">{summary.cellsEvaluated}</span>
                    </div>
                    <div className="rounded border border-slate-800/80 bg-slate-900/70 px-2 py-1.5">
                      <span className="block text-[9px] text-slate-400 uppercase">Reliable Leads</span>
                      <span className="text-xs font-bold text-emerald-300">
                        {summary.computableCandidatesCount} / {summary.candidatesReturned}
                      </span>
                    </div>
                    <div className="rounded border border-slate-800/80 bg-slate-900/70 px-2 py-1.5">
                      <span className="block text-[9px] text-slate-400 uppercase">Top Similarity</span>
                      <span className="text-xs font-bold text-cyan-300">
                        {summary.highestValidScore !== null ? `${summary.highestValidScore.toFixed(1)}%` : "Insufficient"}
                      </span>
                    </div>
                    <div className="rounded border border-slate-800/80 bg-slate-900/70 px-2 py-1.5">
                      <span className="block text-[9px] text-slate-400 uppercase">Unranked (&lt;40%)</span>
                      <span className="text-xs font-bold text-slate-300">
                        {summary.insufficientDataCandidatesCount}
                      </span>
                    </div>
                  </div>

                  {/* Provider Status Telemetry */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {response.providerStatuses.map((status) => (
                      <ProviderBadge key={status.provider} status={status} />
                    ))}
                  </div>

                  {/* Partial or failed provider disclosure */}
                  {(summary.failedProviders.length > 0 || summary.partialProviders.length > 0) && (
                    <div
                      role="status"
                      className="flex items-start gap-2 rounded border border-amber-500/40 bg-amber-950/35 p-2 text-[10px] text-amber-200"
                    >
                      <ShieldAlert className="size-3.5 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
                      <span>
                        {summary.allProvidersFailed
                          ? "All external environmental providers failed. No scientific measurements could be retrieved."
                          : "Some scientific sources were unavailable or partial. Results rely strictly on retrieved evidence; missing values remain null."}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Optional UI display sorting */}
              <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                <span className="text-slate-400">
                  Exploratory candidates identified (screening leads only)
                </span>
                <select
                  aria-label="Display sort order for returned candidates"
                  value={liveSort}
                  onChange={(e) => setLiveSort(e.target.value as LiveDisplaySort)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="backend-rank">Order: Backend Rank</option>
                  <option value="score-desc">Order: UI Score ↓</option>
                  <option value="coverage-desc">Order: UI Coverage ↓</option>
                </select>
              </div>

              {reliableCandidates.length === 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/25 p-3 text-[11px] text-amber-200">
                  No candidates met the minimum 40% evidence coverage required for reliable ranking. Inspect insufficient-data cells below for partial measurements.
                </div>
              )}

              {/* Candidate Cards List */}
              <div className="flex max-h-[430px] flex-col gap-2 overflow-y-auto pr-1">
                {reliableCandidates.map((item) => {
                  const style = getVisualTierStyle(item)
                  const isSelected = item.candidate.id === selectedCandidateId
                  const isCompared = compareCandidateIds.includes(item.candidate.id)

                  return (
                    <div
                      key={item.candidate.id}
                      className={cn(
                        "rounded-lg border p-2.5 transition",
                        isSelected
                          ? "border-white bg-slate-800/90 shadow-[0_0_12px_rgba(255,255,255,0.12)]"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectCandidate(item.candidate.id)}
                        className="w-full text-left cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-slate-800 font-mono text-[11px] font-bold text-white">
                              #{item.rank}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-white">
                                Exploratory Cell #{item.rank}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400">
                                {formatCoordinates(item.candidate.latitude, item.candidate.longitude)}
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono shrink-0">
                            <div className={cn("text-xs font-bold", style.textClass)}>
                              {formatScore(item.score)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Cov: {formatCoverage(item.coverage)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 font-mono text-[9px]">
                          <span className={cn("rounded border px-1.5 py-0.5", style.badgeClass)}>
                            {style.shortBadge}
                          </span>
                          <span className="rounded border border-amber-500/30 bg-amber-950/30 px-1.5 py-0.5 text-amber-200">
                            Unverified · live-grid-discovery
                          </span>
                        </div>
                      </button>

                      <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 font-mono text-[10px]">
                        <span className="truncate text-slate-400" title={item.candidate.setting}>
                          {item.candidate.setting}
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleCompareCandidate(item.candidate.id)}
                          aria-pressed={isCompared}
                          className={cn(
                            "ml-2 inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] cursor-pointer",
                            isCompared
                              ? "border-cyan-400 bg-cyan-950/60 text-cyan-200"
                              : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                          )}
                        >
                          <ArrowRightLeft className="size-2.5" aria-hidden="true" />
                          <span>{isCompared ? "Pinned" : "Compare"}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Separate Insufficient Data Section (< 40% coverage, score: null) */}
                {insufficientCandidates.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-slate-800 pt-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-slate-400">
                      <Info className="size-3.5 text-slate-400" aria-hidden="true" />
                      <span>Unranked — Insufficient Evidence (&lt;40% Coverage)</span>
                    </div>
                    {insufficientCandidates.map((item) => {
                      const isSelected = item.candidate.id === selectedCandidateId
                      return (
                        <button
                          key={item.candidate.id}
                          type="button"
                          onClick={() => onSelectCandidate(item.candidate.id)}
                          className={cn(
                            "w-full rounded-lg border border-dashed p-2 text-left transition cursor-pointer",
                            isSelected
                              ? "border-white bg-slate-800/90"
                              : "border-slate-700 bg-slate-950/40 hover:border-slate-500"
                          )}
                        >
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="text-slate-300 font-semibold">
                              Cell #{item.rank} · {formatCoordinates(item.candidate.latitude, item.candidate.longitude)}
                            </span>
                            <span className="text-slate-400">
                              Score: N/A ({formatCoverage(item.coverage)} cov)
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* CURATED GLOBAL ATLAS TAB (31 Sites — strictly distinct from live discovery) */}
      {activeTab === "atlas" && (
        <div className="flex flex-col gap-3" role="tabpanel" aria-label="Curated global discovery atlas">
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/25 p-2.5 text-[11px] text-amber-200">
            <strong>Curated Global Atlas (31 Sites):</strong> Researched benchmark and under-explored Earth analog records from Phase 6.2. These are separate curated datasets, NOT outputs of the live regional scanner.
          </div>

          {/* Atlas Filters */}
          <div className="flex flex-col gap-2 font-mono text-[11px]">
            <label className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 size-3.5 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                value={atlasSearch}
                onChange={(e) => setAtlasSearch(e.target.value)}
                placeholder="Filter atlas sites by name or country…"
                aria-label="Filter curated atlas locations"
                className="min-h-8 w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-1.5">
              <label className="flex items-center gap-1 rounded border border-slate-700 bg-slate-950 px-2 py-1">
                <Filter className="size-3 text-slate-400 shrink-0" aria-hidden="true" />
                <select
                  aria-label="Filter atlas by category"
                  value={atlasCategory}
                  onChange={(e) =>
                    setAtlasCategory(e.target.value as AnalogEnvironmentCategory | "all")
                  }
                  className="w-full bg-transparent text-[10px] text-slate-200 focus:outline-none"
                >
                  <option value="all" className="bg-slate-900">All 9 Categories</option>
                  {ANALOG_ENVIRONMENT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900">
                      {cat.shortLabel}
                    </option>
                  ))}
                </select>
              </label>

              <select
                aria-label="Filter atlas by novelty tier"
                value={atlasNovelty}
                onChange={(e) => setAtlasNovelty(e.target.value as AnalogNoveltyTier | "all")}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-200 focus:outline-none"
              >
                <option value="all" className="bg-slate-900">All Novelty Tiers</option>
                <option value="canonical-benchmark" className="bg-slate-900">Canonical Benchmark (8)</option>
                <option value="under-explored-analog" className="bg-slate-900">Under-Explored (23)</option>
              </select>
            </div>
          </div>

          <div className="flex max-h-[440px] flex-col gap-2 overflow-y-auto pr-1">
            {filteredAtlas.map((site) => {
              const isSelected = site.id === selectedAtlasId
              const isBenchmark = site.noveltyTier === "canonical-benchmark"

              return (
                <div
                  key={site.id}
                  className={cn(
                    "rounded-lg border p-2.5 transition",
                    isSelected
                      ? "border-amber-300 bg-slate-800/90"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectAtlasSite(site.id)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">{site.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {site.country} · {formatCoordinates(site.latitude, site.longitude)}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                          isBenchmark
                            ? "border-amber-500/40 bg-amber-950/50 text-amber-200"
                            : "border-purple-500/40 bg-purple-950/50 text-purple-200"
                        )}
                      >
                        {isBenchmark ? "CANONICAL" : "UNDER-EXPLORED"}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[9px] text-slate-300">
                      <span className="rounded bg-slate-900 px-1.5 py-0.5 border border-slate-800">
                        {ANALOG_ENVIRONMENT_CATEGORY_LABELS[site.category] ?? site.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Database className="size-2.5" aria-hidden="true" />
                        {site.primarySources.length} sources · {site.evidenceClassification}
                      </span>
                    </div>
                  </button>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-2 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => onFocusAtlasOnMap(site)}
                      className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-cyan-400 cursor-pointer"
                    >
                      <MapPin className="size-3 text-cyan-400" aria-hidden="true" />
                      <span>Focus Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onScanAroundAtlasSite(site)}
                      className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-950/40 px-2 py-1 text-cyan-200 hover:border-cyan-400 cursor-pointer"
                    >
                      <Crosshair className="size-3" aria-hidden="true" />
                      <span>Select Scan Region Here</span>
                    </button>
                  </div>
                </div>
              )
            })}

            {filteredAtlas.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                No curated atlas locations match these filters.
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <CheckCircle2 className="size-3.5 text-emerald-400" aria-hidden="true" />
            <span>Showing {filteredAtlas.length} of {atlasEntries.length} documented global atlas candidates.</span>
          </div>
        </div>
      )}
    </aside>
  )
}
