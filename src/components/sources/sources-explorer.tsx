"use client"

import { useState } from "react"
import {
  Database,
  ExternalLink,
  FileSpreadsheet,
  FileCode,
  Layers,
  ShieldCheck,
  Search,
  Info,
  X,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCoordinates, formatFeatureValue, getFeatureComparabilityInfo, getProvenanceBadgeInfo } from "@/lib/terratwin/format"
import { FEATURES } from "@/lib/terratwin/features"
import { DATA_SOURCES } from "@/lib/terratwin/data-sources"
import { FEATURE_COMPATIBILITY_MATRIX } from "@/lib/terratwin/config/compatibility-matrix"
import type { EarthCandidate, FeatureKey, PlanetaryTarget } from "@/lib/terratwin/types"
import type { DatasetSourceRecord } from "@/lib/terratwin/types/api"

interface SourcesExplorerProps {
  targets: PlanetaryTarget[]
  candidates: EarthCandidate[]
  sources: DatasetSourceRecord[]
}

export function SourcesExplorer({ targets, candidates, sources }: SourcesExplorerProps) {
  const [activeTab, setActiveTab] = useState<"matrix" | "catalog" | "harmonization">("matrix")
  const [bodyFilter, setBodyFilter] = useState<"all" | "Mars" | "Moon" | "Earth">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCell, setSelectedCell] = useState<{
    location: PlanetaryTarget | EarthCandidate
    featureKey: FeatureKey
  } | null>(null)

  const allLocations = [...targets, ...candidates]

  // Filter locations for coverage matrix
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

  // Filter datasets for catalog
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
      {/* 1. Scientific Mission Control Header */}
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-6 shadow-[0_0_30px_rgba(56,189,248,0.08)] backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-950/70 px-2.5 py-0.5 text-cyan-300 font-bold">
                <Database className="size-3.5 text-cyan-400" />
                <span>SCIENTIFIC DATA PROVENANCE & NASA ARCHIVES</span>
              </span>
              <span className="rounded bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-400" />
                <span>100% TRACEABLE (ZERO FABRICATED DATA)</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Authoritative Planetary & Earth Telemetry Catalog
            </h1>
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-300">
              TerraTwin is founded on authentic, publicly traceable measurements from NASA Planetary Data System (PDS),
              NASA Earthdata / Langley POWER, and peer-reviewed field studies. Inspect dataset processing baselines,
              examine the coverage matrix across all 13 locations, or export the complete telemetry catalog.
            </p>
          </div>

          {/* Quick Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center font-mono text-xs">
            <a
              href="/api/export?format=csv"
              download="terratwin_scientific_telemetry_matrix.csv"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-950/50 hover:bg-cyan-500/20 px-3.5 py-2 font-bold text-cyan-300 transition shadow-[0_0_12px_rgba(56,189,248,0.15)] cursor-pointer"
            >
              <FileSpreadsheet className="size-4 text-cyan-400" />
              <span>EXPORT CSV MATRIX</span>
            </a>

            <a
              href="/api/export?format=json"
              download="terratwin_scientific_catalog.json"
              className="inline-flex items-center gap-2 rounded-lg border border-purple-500/50 bg-purple-950/50 hover:bg-purple-500/20 px-3.5 py-2 font-bold text-purple-300 transition shadow-[0_0_12px_rgba(168,85,247,0.15)] cursor-pointer"
            >
              <FileCode className="size-4 text-purple-400" />
              <span>EXPORT JSON CATALOG</span>
            </a>
          </div>
        </div>

        {/* Quick Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-5 mt-5 font-mono text-xs">
          <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
            <div className="text-[10px] uppercase text-slate-400">Integrated Archives</div>
            <div className="text-xl font-bold text-cyan-300 mt-0.5">{sources.length} Active Sources</div>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
            <div className="text-[10px] uppercase text-slate-400">Locations Indexed</div>
            <div className="text-xl font-bold text-white mt-0.5">{allLocations.length} Planetary & Field Sites</div>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
            <div className="text-[10px] uppercase text-slate-400">Environmental Channels</div>
            <div className="text-xl font-bold text-emerald-300 mt-0.5">{FEATURES.length} Physical Dimensions</div>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
            <div className="text-[10px] uppercase text-slate-400">Harmonization Rules</div>
            <div className="text-xl font-bold text-purple-300 mt-0.5">4 Comparability Tiers</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Tab Buttons */}
        <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={cn(
              "rounded px-3 py-1.5 transition cursor-pointer font-semibold flex items-center gap-1.5",
              activeTab === "matrix"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Layers className="size-3.5" />
            <span>Coverage Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "rounded px-3 py-1.5 transition cursor-pointer font-semibold flex items-center gap-1.5",
              activeTab === "catalog"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Database className="size-3.5" />
            <span>NASA Dataset Archives</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("harmonization")}
            className={cn(
              "rounded px-3 py-1.5 transition cursor-pointer font-semibold flex items-center gap-1.5",
              activeTab === "harmonization"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Info className="size-3.5" />
            <span>Harmonization Guide</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="relative">
            <Search className="size-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search locations or datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-52 sm:w-64"
            />
          </div>

          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1">
            {(["all", "Mars", "Moon", "Earth"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBodyFilter(b)}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer",
                  bodyFilter === b
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {b === "all" ? "All Bodies" : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. TAB 1: Coverage Matrix Grid */}
      {activeTab === "matrix" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>
              Showing {filteredLocations.length} locations across {FEATURES.length} physical dimensions. Click any cell to inspect measurement provenance.
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>Verified NASA PDS</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="size-2 rounded-full bg-cyan-400" />
                <span>NASA POWER / Earthdata</span>
              </span>
              <span className="flex items-center gap-1 text-purple-300">
                <span className="size-2 rounded-full bg-purple-400" />
                <span>Literature / Field Study</span>
              </span>
              <span className="flex items-center gap-1 text-rose-300">
                <span className="size-2 rounded-full bg-rose-400" />
                <span>Incomparable (Excluded)</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60 shadow-xl backdrop-blur-sm">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] uppercase text-slate-400 font-bold">
                  <th className="p-3 text-left sticky left-0 bg-slate-900 z-10 min-w-[200px]">Location & Body</th>
                  {FEATURES.map((f) => (
                    <th key={f.key} className="p-3 text-center min-w-[130px]" title={f.description}>
                      <div>{f.shortLabel}</div>
                      <div className="text-[8px] text-slate-500 normal-case font-normal">{f.unit || "class"}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLocations.map((loc) => {
                  const isTarget = "body" in loc
                  const bodyName = isTarget ? (loc.body === "mars" ? "Mars" : "Moon") : "Earth"
                  const provMap = loc.provenanceMap || {}

                  return (
                    <tr key={loc.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Location Header Column */}
                      <td className="p-3 sticky left-0 bg-slate-950/90 z-10 border-r border-slate-800/60">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                            <span
                              className={cn(
                                "size-2 rounded-full shrink-0",
                                bodyName === "Mars" ? "bg-amber-500" : bodyName === "Moon" ? "bg-slate-300" : "bg-cyan-400"
                              )}
                            />
                            <span className="truncate max-w-[180px]">{loc.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                            <span className="uppercase text-slate-500 font-semibold">{bodyName}</span>
                            <span>·</span>
                            <span>{loc.latitude !== undefined && loc.longitude !== undefined ? formatCoordinates(loc.latitude, loc.longitude) : ""}</span>
                          </div>
                        </div>
                      </td>

                      {/* Feature Columns */}
                      {FEATURES.map((f) => {
                        const val = loc.environment[f.key]
                        const prov = provMap[f.key]
                        const badge = getProvenanceBadgeInfo(prov?.sourceTitle, prov?.status)
                        const compInfo = getFeatureComparabilityInfo(f.key)
                        const isIncomparable = compInfo.classification === "NOT_COMPARABLE"
                        const isMissing = val === null || val === undefined

                        return (
                          <td
                            key={f.key}
                            onClick={() => setSelectedCell({ location: loc, featureKey: f.key })}
                            className={cn(
                              "p-2 text-center cursor-pointer transition border-r border-slate-800/30 hover:bg-cyan-950/30",
                              selectedCell?.location.id === loc.id && selectedCell?.featureKey === f.key && "bg-cyan-950/60 ring-1 ring-cyan-400"
                            )}
                          >
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className={cn(
                                "font-semibold text-[11px]",
                                isMissing ? "text-slate-600" : isIncomparable ? "text-slate-300" : "text-white"
                              )}>
                                {formatFeatureValue(f.key, val ?? null)}
                              </span>

                              {!isMissing && (
                                <span className={cn(
                                  "rounded px-1 text-[7px] font-bold uppercase",
                                  badge.variant === "pds" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40" :
                                  badge.variant === "power" ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40" :
                                  badge.variant === "literature" ? "bg-purple-950/80 text-purple-300 border border-purple-500/40" :
                                  "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                                )}>
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

      {/* 4. TAB 2: NASA & Official Dataset Archives */}
      {activeTab === "catalog" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>Official dataset archives currently ingested and queued for future pipeline updates.</span>
            <span className="text-cyan-400 font-semibold">{filteredDataSources.length} Datasets Listed</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {filteredDataSources.map((ds) => {
              const isIntegrated = ds.status === "integrated"
              return (
                <div
                  key={ds.name}
                  className={cn(
                    "flex flex-col justify-between gap-4 rounded-xl border p-5 transition backdrop-blur-sm",
                    isIntegrated
                      ? "border-emerald-500/30 bg-slate-900/70 hover:border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.05)]"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              ds.scope === "Mars" ? "bg-amber-500" : ds.scope === "Moon" ? "bg-slate-300" : "bg-cyan-400"
                            )}
                          />
                          <span>{ds.scope} Telemetry Archive</span>
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          {ds.name}
                        </h3>
                      </div>

                      {isIntegrated ? (
                        <span className="rounded bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-300 uppercase tracking-wider shrink-0 font-mono">
                          INTEGRATED · LIVE
                        </span>
                      ) : (
                        <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 font-mono">
                          PIPELINE QUEUE
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 font-medium">
                      Provider: <span className="text-white">{ds.provider}</span>
                    </div>

                    {ds.version && (
                      <div className="font-mono text-[11px] text-cyan-300/90 bg-cyan-950/30 border border-cyan-500/20 rounded p-1.5 truncate">
                        Product: {ds.version}
                      </div>
                    )}

                    <div className="text-xs text-slate-300 leading-relaxed mt-1">
                      <strong className="text-slate-200">Environmental Parameters:</strong> {ds.informs}
                    </div>

                    {ds.resolution && (
                      <div className="font-mono text-[11px] text-slate-400">
                        <span className="text-slate-500">Spatial Resolution:</span> {ds.resolution}
                      </div>
                    )}

                    {ds.integrationNotes && (
                      <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800 rounded p-2.5 leading-relaxed mt-1">
                        <span className="text-emerald-400 font-semibold">Integration Architecture:</span> {ds.integrationNotes}
                      </div>
                    )}
                  </div>

                  {ds.sourceUrl && (
                    <a
                      href={ds.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 self-start text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline pt-2 border-t border-slate-800/80 w-full"
                    >
                      <span>Access Official NASA / ESA Archive</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 3: Scientific Harmonization & Comparability Guide */}
      {activeTab === "harmonization" && (
        <div className="flex flex-col gap-6 font-mono text-xs">
          <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-5 leading-relaxed">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-cyan-400" />
              <span>Scientific Data Harmonization & Physical Comparability Principles</span>
            </h3>
            <p className="text-slate-300 font-sans text-sm leading-relaxed max-w-4xl">
              Planetary analog research requires scientific discipline when comparing measurements across Earth, Mars, and the Moon.
              Measurements from orbital radiometers cannot be equated with in situ weather stations without accounting for
              instrument field-of-view, atmospheric absorption, and local topography. In TerraTwin, all physical dimensions are
              categorized under a 4-tier comparability framework to prevent skewed similarity scores.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURE_COMPATIBILITY_MATRIX.map((item) => {
              const isDirect = item.classification === "DIRECTLY COMPARABLE"
              const isTransformed = item.classification === "COMPARABLE AFTER TRANSFORMATION"
              const isProxy = item.classification === "PROXY-BASED COMPARISON"

              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[9px] font-bold uppercase",
                          isDirect ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-300" :
                          isTransformed ? "bg-amber-950/70 border border-amber-500/40 text-amber-300" :
                          isProxy ? "bg-purple-950/70 border border-purple-500/40 text-purple-300" :
                          "bg-rose-950/70 border border-rose-500/50 text-rose-300"
                        )}
                      >
                        {item.classification}
                      </span>
                    </div>

                    <div className="text-[10px] text-cyan-400 mt-1 uppercase tracking-wider">{item.category}</div>

                    <p className="text-slate-300 font-sans text-xs mt-2 leading-relaxed">
                      <strong className="text-white">Physical Basis:</strong> {item.scientificBasis}
                    </p>
                  </div>

                  <div className="rounded bg-slate-900 border border-slate-800/80 p-2.5 text-[10px] text-slate-400 leading-normal">
                    <span className="text-slate-200 font-semibold">Harmonization Rule:</span> {item.harmonizationNotes}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 6. Modal / Slide-Over: Cell Provenance Inspector */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl font-mono text-xs flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white rounded-lg p-1 transition"
            >
              <X className="size-5" />
            </button>

            {/* Modal Title */}
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="size-3.5 text-cyan-400" />
                <span>TELEMETRY PROVENANCE INSPECTOR</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {selectedCell.location.name}
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {"body" in selectedCell.location
                  ? `${selectedCell.location.body.toUpperCase()} · ${selectedCell.location.summary}`
                  : `${selectedCell.location.country} · ${selectedCell.location.setting}`}
              </p>
            </div>

            {/* Measurement Card */}
            {(() => {
              const feat = FEATURES.find((f) => f.key === selectedCell.featureKey)
              const val = selectedCell.location.environment[selectedCell.featureKey]
              const prov = selectedCell.location.provenanceMap?.[selectedCell.featureKey]
              const compInfo = getFeatureComparabilityInfo(selectedCell.featureKey)

              return (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">{feat?.label}</div>
                      <div className="text-2xl font-extrabold text-cyan-300 mt-1">
                        {formatFeatureValue(selectedCell.featureKey, val ?? null)}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "rounded px-2.5 py-1 text-[10px] font-bold uppercase",
                        compInfo.classification === "DIRECTLY_COMPARABLE" ? "bg-emerald-950 border border-emerald-500/40 text-emerald-300" :
                        compInfo.classification === "COMPARABLE_AFTER_TRANSFORMATION" ? "bg-amber-950 border border-amber-500/40 text-amber-300" :
                        compInfo.classification === "PROXY_BASED" ? "bg-purple-950 border border-purple-500/40 text-purple-300" :
                        "bg-rose-950 border border-rose-500/40 text-rose-300"
                      )}
                    >
                      {compInfo.label}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 flex flex-col gap-1.5 text-[11px]">
                    <div className="text-slate-300">
                      <strong className="text-white">Classification Notice:</strong> {compInfo.rationale}
                    </div>
                  </div>

                  {prov ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex flex-col gap-2 text-[11px]">
                      <div className="font-bold text-emerald-300 flex items-center justify-between">
                        <span>DATASET: {prov.sourceTitle}</span>
                        {prov.sourceUrl && (
                          <a
                            href={prov.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                          >
                            <span>Archive URL</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      {prov.datasetVersion && <div className="text-slate-300">Product Version: {prov.datasetVersion}</div>}
                      {prov.spatialResolution && <div className="text-slate-300">Spatial Resolution: {prov.spatialResolution}</div>}
                      {prov.measurementPeriod && <div className="text-slate-400">Observation Period: {prov.measurementPeriod}</div>}
                      {prov.qualityNotes && (
                        <div className="text-slate-400 italic bg-slate-950/60 p-2 rounded border border-slate-800 mt-1 leading-relaxed">
                          {prov.qualityNotes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-300/80 text-[11px]">
                      Illustrative prototype value sourced from preliminary catalog. Not verified planetary evidence.
                    </div>
                  )}
                </div>
              )
            })()}

            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2.5 font-bold text-white transition cursor-pointer"
            >
              CLOSE INSPECTOR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
