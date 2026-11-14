"use client"

import type {
  DiscoveryAtlasEntry,
  FeatureKey,
  FeatureProvenance,
  MissionPurposeDefinition,
  PlanetaryTarget,
} from "@/lib/terratwin/types"
import {
  ROVER_TESTING_PROFILE,
  type ConfigurableMissionProfile,
} from "@/lib/terratwin/config/comparison-config"
import type { DiscoveryCandidateResult, RegionalDiscoveryResponse } from "@/lib/terratwin/types/discovery"
import type { ResearchAssessmentRecord } from "@/lib/terratwin/types/research-workflow"
import type { UseCloudResearchWorkspaceReturn } from "@/hooks/use-cloud-research-workspace"
import { DiscoveryScientificIntelligence } from "./discovery-scientific-intelligence"
import { DiscoveryResearchWorkspace } from "./discovery-research-workspace"
import {
  FEATURE_MAP,
  ANALOG_ENVIRONMENT_CATEGORY_LABELS,
} from "@/lib/terratwin/features"
import {
  formatCoordinates,
  formatCoverage,
  formatFeatureValue,
  formatScore,
} from "@/lib/terratwin/format"
import {
  formatProvenanceVerificationBadge,
  getVisualTierStyle,
} from "@/lib/terratwin/scanner/scanner-utils"
import {
  AlertTriangle,
  ArrowRightLeft,
  Compass,
  Database,
  ExternalLink,
  Layers,
  Microscope,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscoveryCandidateDetailsProps {
  selectedCandidate: DiscoveryCandidateResult | null
  selectedAtlasSite: DiscoveryAtlasEntry | null
  compareCandidates: DiscoveryCandidateResult[]
  target: PlanetaryTarget | null
  missionProfileLabel: string
  allEvaluatedCandidates?: DiscoveryCandidateResult[]
  liveResponse?: RegionalDiscoveryResponse | null
  liveMissionProfile?: ConfigurableMissionProfile | MissionPurposeDefinition | null
  activeTarget?: PlanetaryTarget | null
  activeMissionProfile?: ConfigurableMissionProfile
  isStaleContext?: boolean
  researchRecords?: Record<string, ResearchAssessmentRecord>
  cloudWorkspace?: UseCloudResearchWorkspaceReturn
  onUpsertResearchRecord?: (record: ResearchAssessmentRecord) => void
  onDeleteResearchRecord?: (contextKey: string) => void
  onRemoveCompareCandidate: (candidateId: string) => void
  onFocusOnMap?: (lat: number, lon: number) => void
  onScanAroundAtlasSite?: (site: DiscoveryAtlasEntry) => void
}

const INSPECTED_FEATURES: FeatureKey[] = [
  "elevationM",
  "meanSlopeDeg",
  "meanSurfaceTempC",
  "diurnalTempRangeC",
  "surfaceSolarIrradianceWm2",
  "lithology",
  "annualPrecipitationMm",
  "rockAbundancePct",
  "medianGrainSizeMm",
  "albedo",
  "vegetationCoverPct",
  "surfacePressurePa",
]

function EvidenceClassificationPill({ prov }: { prov?: FeatureProvenance }) {
  const cls = prov?.evidenceClassification ?? (prov?.status === "no-data" ? "missing_data" : undefined)
  if (!cls) return <span className="text-slate-500">—</span>

  const styles: Record<string, string> = {
    measured: "border-emerald-500/40 bg-emerald-950/50 text-emerald-300",
    derived: "border-cyan-500/40 bg-cyan-950/50 text-cyan-300",
    proxy: "border-amber-500/40 bg-amber-950/50 text-amber-300",
    illustrative: "border-purple-500/40 bg-purple-950/50 text-purple-300",
    missing_data: "border-slate-700 bg-slate-900 text-slate-400",
  }

  return (
    <span className={cn("inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase", styles[cls] ?? styles.missing_data)}>
      {cls.replace("_", " ")}
    </span>
  )
}

export function DiscoveryCandidateDetails({
  selectedCandidate,
  selectedAtlasSite,
  compareCandidates,
  target,
  missionProfileLabel,
  allEvaluatedCandidates = [],
  liveResponse = null,
  liveMissionProfile = null,
  activeTarget = null,
  activeMissionProfile = ROVER_TESTING_PROFILE,
  isStaleContext = false,
  researchRecords = {},
  cloudWorkspace,
  onUpsertResearchRecord = () => {},
  onDeleteResearchRecord = () => {},
  onRemoveCompareCandidate,
  onFocusOnMap,
  onScanAroundAtlasSite,
}: DiscoveryCandidateDetailsProps) {
  if (!selectedCandidate && !selectedAtlasSite) {
    return (
      <section
        aria-label="Selected candidate scientific details"
        className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-6 text-center"
      >
        <Microscope className="mx-auto size-6 text-slate-500" aria-hidden="true" />
        <h3 className="mt-2 text-sm font-bold text-slate-200">
          Select a grid cell or curated Atlas site to inspect scientific evidence
        </h3>
        <p className="mt-1 text-xs text-slate-400 max-w-xl mx-auto">
          Detailed telemetry, data origin (`live-api-estimate`, `computed-derivative`, `proxy`), missing parameter transparency, and planetary boundary limitations appear here when a location is selected.
        </p>
      </section>
    )
  }

  return (
    <section
      aria-label="Selected candidate scientific detail and provenance inspector"
      className="flex flex-col gap-5 rounded-xl border border-slate-800 bg-slate-900/75 p-5 shadow-lg backdrop-blur-md"
    >
      {/* Optional Side-by-Side Pinned Comparison Strip */}
      {compareCandidates.length > 0 && (
        <div className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="size-4 text-cyan-400" aria-hidden="true" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Unit-Matched Exploratory Cell Comparison ({compareCandidates.length})
              </h3>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              Unverified screening telemetry · Missing values kept null
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1.5 pr-3">Parameter</th>
                  {compareCandidates.map((item) => (
                    <th key={item.candidate.id} className="py-1.5 px-3 text-white">
                      <div className="flex items-center justify-between gap-2">
                        <span>Cell #{item.rank}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveCompareCandidate(item.candidate.id)}
                          aria-label={`Remove Cell #${item.rank} from comparison`}
                          className="text-slate-400 hover:text-rose-300 cursor-pointer"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                <tr>
                  <td className="py-1.5 pr-3 text-slate-400">Coordinates</td>
                  {compareCandidates.map((item) => (
                    <td key={item.candidate.id} className="py-1.5 px-3 text-slate-200">
                      {formatCoordinates(item.candidate.latitude, item.candidate.longitude)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 text-slate-400">Similarity Score</td>
                  {compareCandidates.map((item) => (
                    <td key={item.candidate.id} className="py-1.5 px-3 font-bold text-cyan-300">
                      {formatScore(item.score)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 text-slate-400">Evidence Coverage</td>
                  {compareCandidates.map((item) => (
                    <td key={item.candidate.id} className="py-1.5 px-3 text-slate-200">
                      {formatCoverage(item.coverage)} ({item.confidence})
                    </td>
                  ))}
                </tr>
                {(
                  [
                    "elevationM",
                    "meanSlopeDeg",
                    "meanSurfaceTempC",
                    "diurnalTempRangeC",
                    "surfaceSolarIrradianceWm2",
                    "lithology",
                  ] as const
                ).map((fkey) => (
                  <tr key={fkey}>
                    <td className="py-1.5 pr-3 text-slate-400">{FEATURE_MAP[fkey]?.label ?? fkey}</td>
                    {compareCandidates.map((item) => (
                      <td key={item.candidate.id} className="py-1.5 px-3 text-slate-200">
                        {formatFeatureValue(fkey, item.candidate.environment[fkey] ?? null)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LIVE REGIONAL CANDIDATE DETAIL VIEW */}
      {selectedCandidate && (
        <div className="flex flex-col gap-5">
          {/* Section A — Overview */}
          {(() => {
            const cand = selectedCandidate.candidate
            const style = getVisualTierStyle(selectedCandidate)
            return (
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="rounded border border-amber-500/40 bg-amber-950/50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-200">
                      Exploratory candidate — not field-verified
                    </span>
                    <span className={cn("rounded border px-2 py-0.5 font-mono text-[10px] font-semibold", style.badgeClass)}>
                      {style.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white">
                    Exploratory Cell #{selectedCandidate.rank} ({cand.id})
                  </h3>
                  <p className="font-mono text-xs text-slate-300 mt-0.5">
                    {formatCoordinates(cand.latitude, cand.longitude)} · Target:{" "}
                    <span className="text-cyan-300">{target?.name ?? "Planetary Target"}</span> · Mission:{" "}
                    <span className="text-cyan-300">{missionProfileLabel}</span>
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">{cand.setting}</p>
                </div>

                {/* Distinct Similarity vs Coverage Metrics */}
                <div className="grid grid-cols-2 gap-2.5 shrink-0 font-mono">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2.5">
                    <span className="block text-[10px] text-slate-400 uppercase">Similarity Score</span>
                    <span className={cn("text-lg font-extrabold", style.textClass)}>
                      {selectedCandidate.score !== null && selectedCandidate.isReliable
                        ? `${selectedCandidate.score.toFixed(1)}%`
                        : "N/A"}
                    </span>
                    <span className="block text-[9px] text-slate-500">
                      {selectedCandidate.score !== null ? "Screening index (not field proof)" : "Coverage < 40%"}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2.5">
                    <span className="block text-[10px] text-slate-400 uppercase">Data Coverage</span>
                    <span className="text-lg font-extrabold text-white">
                      {formatCoverage(selectedCandidate.coverage)}
                    </span>
                    <span className="block text-[9px] text-slate-400 capitalize">
                      {selectedCandidate.confidence} confidence
                    </span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Section B & C — Environmental Measurements + Scientific Evidence & Provenance Matrix */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
                Environmental Measurements & Scientific Evidence Matrix
              </h4>
              <span className="font-mono text-[10px] text-slate-400">
                Includes NASA POWER, Open-Meteo Copernicus DEM, Macrostrat, and unmeasured gaps
              </span>
            </div>

            <div className="md:hidden mb-1.5 font-mono text-[10px] text-cyan-300/80">
              ← Swipe horizontally across table columns for source provenance &amp; notes →
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] uppercase text-slate-400">
                    <th className="py-2 px-3">Feature</th>
                    <th className="py-2 px-3">Returned Value</th>
                    <th className="py-2 px-3">Evidence</th>
                    <th className="py-2 px-3">Data Origin / Verification</th>
                    <th className="py-2 px-3">Source, Resolution & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {INSPECTED_FEATURES.map((key) => {
                    const def = FEATURE_MAP[key]
                    const val = selectedCandidate.candidate.environment[key] ?? null
                    const prov = selectedCandidate.candidate.provenanceMap?.[key]
                    const verBadge = formatProvenanceVerificationBadge(prov)

                    return (
                      <tr key={key} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-semibold text-slate-200 align-top">
                          <div>{def?.label ?? key}</div>
                          {target && (
                            <div className="text-[10px] font-normal text-slate-400">
                              Target: {formatFeatureValue(key, target.environment[key] ?? null)}
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-3 align-top">
                          {val === null ? (
                            <span className="text-slate-500 italic">Not measured (null)</span>
                          ) : (
                            <span className="font-bold text-white">
                              {formatFeatureValue(key, val)}
                            </span>
                          )}
                          {prov?.originalSourceValue != null && prov.originalSourceUnit && (
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Raw: {prov.originalSourceValue} {prov.originalSourceUnit}
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-3 align-top">
                          <EvidenceClassificationPill prov={prov} />
                        </td>

                        <td className="py-2 px-3 align-top space-y-1">
                          <span className={cn("inline-block rounded border px-1.5 py-0.5 text-[9px]", verBadge.toneClass)}>
                            {verBadge.label}
                          </span>
                          {prov?.dataOrigin && (
                            <div className="text-[9px] text-slate-400">
                              {prov.dataOrigin}
                              {prov?.verificationState ? ` · ${prov.verificationState}` : ""}
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-3 align-top font-sans text-[11px] text-slate-300 max-w-md">
                          <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-200">
                            <span>{prov?.sourceTitle ?? "Unmeasured in regional tier"}</span>
                            {prov?.sourceUrl && (
                              <a
                                href={prov.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-cyan-400 hover:underline font-mono text-[10px]"
                              >
                                <span>Source</span>
                                <ExternalLink className="size-2.5" aria-hidden="true" />
                              </a>
                            )}
                          </div>
                          {(prov?.spatialResolution || prov?.measurementPeriod) && (
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {[prov.spatialResolution, prov.measurementPeriod].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          {prov?.qualityNotes && (
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                              {prov.qualityNotes}
                            </p>
                          )}
                          {prov && !prov.isComparable && prov.incomparabilityReason && (
                            <p className="text-[10px] text-amber-300 mt-0.5">
                              Non-comparable: {prov.incomparabilityReason}
                            </p>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Supplemental Context-Only Field: 10 m Wind Speed from NASA POWER */}
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-200 align-top">
                      10m Wind Speed (WS10M context)
                    </td>
                    <td className="py-2 px-3 align-top">
                      {selectedCandidate.candidate.windSpeedMs != null ? (
                        <span className="font-bold text-white">
                          {selectedCandidate.candidate.windSpeedMs} m/s
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Not measured (null)</span>
                      )}
                    </td>
                    <td className="py-2 px-3 align-top">
                      <span className="inline-block rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] text-slate-300">
                        CONTEXT
                      </span>
                    </td>
                    <td className="py-2 px-3 align-top">
                      <span className="inline-block rounded border border-amber-500/40 bg-amber-950/50 px-1.5 py-0.5 text-[9px] text-amber-300">
                        Unverified API lead
                      </span>
                    </td>
                    <td className="py-2 px-3 align-top font-sans text-[11px] text-slate-400">
                      NASA POWER Climatology (MERRA-2 0.5° × 0.625°, 2001–2025). Context only; excluded from planetary similarity weight vector because Earth dynamic wind momentum (101 kPa) is not equivalent to 700 Pa Mars winds or lunar vacuum.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section D & E — Mission Relevance Breakdown + Scientific Limitations */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="size-4 text-cyan-400" aria-hidden="true" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  Mission Relevance Breakdown ({missionProfileLabel})
                </h4>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {selectedCandidate.explanation}
              </p>

              <ul className="space-y-1.5 font-mono text-[11px]">
                {selectedCandidate.featureScores
                  .filter((fs) => fs.weight > 0)
                  .sort((a, b) => b.weight - a.weight)
                  .map((fs) => (
                    <li
                      key={fs.key}
                      className="flex items-center justify-between gap-2 rounded border border-slate-800/80 bg-slate-900/50 px-2.5 py-1.5"
                    >
                      <div>
                        <span className="text-slate-200 font-semibold">
                          {FEATURE_MAP[fs.key]?.label ?? fs.key}
                        </span>
                        <span className="ml-2 text-[10px] text-slate-400">
                          (wt {Math.round(fs.weight * 100)}%)
                        </span>
                      </div>
                      {fs.status === "comparable" && typeof fs.similarity === "number" ? (
                        <span className="text-cyan-300 font-bold">
                          {Math.round(fs.similarity * 100)}% feature match
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          {(fs.status ?? "missing_data").replace("_", " ")} (omitted from denom.)
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <ShieldAlert className="size-4 text-amber-400" aria-hidden="true" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-200">
                  Planetary Scientific Limitations
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs leading-relaxed text-slate-300 list-disc pl-4">
                <li>
                  <strong>Gravity & Atmosphere:</strong> Earth surface gravity (9.81 m/s²) and 101 kPa atmosphere differ fundamentally from Lunar vacuum (0.16g) and Martian CO₂ atmosphere (0.38g, ~600–800 Pa).
                </li>
                <li>
                  <strong>Radiation & Solar Geometry:</strong> Earth magnetosphere/atmosphere attenuate cosmic radiation; 24-hour NASA POWER annual mean flux does not reproduce 29.5-day lunar synodic cycles or Shackleton polar grazing illumination.
                </li>
                <li>
                  <strong>Regional Proxy Scale:</strong> NASA POWER (~50 km MERRA-2) and Macrostrat map polygons are coarse regional screening proxies, not site-level core or rover traverse measurements.
                </li>
                <li>
                  <strong>Slope Baseline Smoothing:</strong> Copernicus 90 m DEM 5-point central-difference gradients (~445 m baseline) smooth sub-100 m crater walls, scarps, and meter-scale boulder hazards.
                </li>
                <li>
                  <strong>Evidence Gaps:</strong> Unmeasured regolith grain size, boulder abundance, albedo, and vegetation cover reduce available coverage and withheld/weighted precision.
                </li>
              </ul>

              {selectedCandidate.warnings.length > 0 && (
                <div className="mt-3 border-t border-amber-500/20 pt-2.5 space-y-1">
                  {selectedCandidate.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-200">
                      <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-amber-400" aria-hidden="true" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CURATED GLOBAL ATLAS SITE DETAIL VIEW */}
      {selectedAtlasSite && !selectedCandidate && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                    selectedAtlasSite.noveltyTier === "canonical-benchmark"
                      ? "border-amber-500/40 bg-amber-950/60 text-amber-200"
                      : "border-purple-500/40 bg-purple-950/60 text-purple-200"
                  )}
                >
                  Curated Atlas · {selectedAtlasSite.noveltyTier}
                </span>
                <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                  {ANALOG_ENVIRONMENT_CATEGORY_LABELS[selectedAtlasSite.category] ?? selectedAtlasSite.category}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white">{selectedAtlasSite.name}</h3>
              <p className="font-mono text-xs text-slate-400 mt-0.5">
                {selectedAtlasSite.country} · {formatCoordinates(selectedAtlasSite.latitude, selectedAtlasSite.longitude)} · Evidence: {selectedAtlasSite.evidenceClassification}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {onFocusOnMap && (
                <button
                  type="button"
                  onClick={() => onFocusOnMap(selectedAtlasSite.latitude, selectedAtlasSite.longitude)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 hover:border-cyan-400 cursor-pointer"
                >
                  <Compass className="size-3.5 text-cyan-400" aria-hidden="true" />
                  <span>Focus Map</span>
                </button>
              )}
              {onScanAroundAtlasSite && (
                <button
                  type="button"
                  onClick={() => onScanAroundAtlasSite(selectedAtlasSite)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/50 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-200 hover:border-cyan-400 cursor-pointer"
                >
                  <Layers className="size-3.5" aria-hidden="true" />
                  <span>Use as Regional Scan Seed</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 text-xs leading-relaxed text-slate-300">
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                Geological Description & Planetary Relevance
              </h4>
              <p>{selectedAtlasSite.geologicalDescription}</p>
              <p className="text-slate-200">
                <strong className="text-cyan-300">Planetary Relevance:</strong>{" "}
                {selectedAtlasSite.planetaryRelevance}
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Primary Sources ({selectedAtlasSite.primarySources.length}) & Limitations
              </h4>
              <ul className="space-y-1.5 font-mono text-[10px] text-slate-300">
                {selectedAtlasSite.primarySources.map((src, i) => (
                  <li key={i} className="rounded border border-slate-800/80 bg-slate-900/50 p-2">
                    <div className="font-bold text-white">{src.datasetOrPublication}</div>
                    <div className="text-slate-400">
                      {src.organization}
                      {src.publicationDate ? ` · ${src.publicationDate}` : ""}
                      {src.spatialResolution ? ` · ${src.spatialResolution}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
              {selectedAtlasSite.scientificLimitations.length > 0 && (
                <ul className="list-disc pl-4 text-[11px] text-amber-200/90 space-y-1 pt-1">
                  {selectedAtlasSite.scientificLimitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 p-3 font-mono text-[11px] text-slate-400">
            <Database className="size-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span>
              Notice: This is a curated Phase 6.2 atlas record (`{selectedAtlasSite.isVerified ? "verified dataset fields" : "published synthesis"}`), kept separate from live `/api/discover` screening cells.
            </span>
          </div>
        </div>
      )}

      {/* PHASE 6.5 SCIENTIFIC DISCOVERY INTELLIGENCE & VALIDATION WORKBENCH */}
      <DiscoveryScientificIntelligence
        selectedCandidate={selectedCandidate}
        selectedAtlasSite={selectedAtlasSite}
        allEvaluatedCandidates={allEvaluatedCandidates}
        liveTarget={target}
        liveMissionProfile={liveMissionProfile}
        activeTarget={activeTarget ?? target}
        activeMissionProfile={activeMissionProfile}
        isStaleContext={isStaleContext}
      />

      {/* PHASE 6.6 RESEARCH WORKFLOW, SNAPSHOTS & REPRODUCIBLE REPORTS */}
      <DiscoveryResearchWorkspace
        selectedCandidate={selectedCandidate}
        selectedAtlasSite={selectedAtlasSite}
        allEvaluatedCandidates={allEvaluatedCandidates}
        liveResponse={liveResponse}
        liveTarget={target}
        liveMissionProfile={liveMissionProfile}
        activeTarget={activeTarget ?? target}
        activeMissionProfile={activeMissionProfile}
        isStaleContext={isStaleContext}
        researchRecords={researchRecords}
        cloudWorkspace={cloudWorkspace}
        onUpsertResearchRecord={onUpsertResearchRecord}
        onDeleteResearchRecord={onDeleteResearchRecord}
      />
    </section>
  )
}
