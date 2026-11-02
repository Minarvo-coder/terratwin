"use client"

import { useState } from "react"
import { PanelCard } from "@/components/shared/panel-card"
import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import { formatCoordinates } from "@/lib/terratwin/format"
import {
  EVIDENCE_CATEGORIES,
  getAllEvidenceLineages,
  getEvidenceLineage,
  type EvidenceCategory,
} from "@/lib/terratwin/evidence-lineage"
import type { EarthCandidate, FeatureKey, PlanetaryTarget } from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Compass,
  Copy,
  ExternalLink,
  Globe2,
  Layers,
  Satellite,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

interface ScientificEvidenceExplorerProps {
  currentTarget?: PlanetaryTarget
  currentCandidate?: EarthCandidate
  allTargets?: PlanetaryTarget[]
  allCandidates?: EarthCandidate[]
  isUpdating?: boolean
}

export function ScientificEvidenceExplorer({
  currentTarget,
  currentCandidate,
  allTargets = [],
  allCandidates = [],
  isUpdating,
}: ScientificEvidenceExplorerProps) {
  // 1. Selected Location State
  const defaultLocation = currentTarget ?? allTargets[0] ?? currentCandidate ?? allCandidates[0]
  const [selectedLocationId, setSelectedLocationId] = useState<string>(defaultLocation?.id ?? "")
  const [locationTab, setLocationTab] = useState<"targets" | "candidates">("targets")

  // Combine targets and candidates
  const allLocations = [...allTargets, ...allCandidates]
  const activeLocation = allLocations.find((l) => l.id === selectedLocationId) ?? defaultLocation

  // 2. Selected Category and Feature Key State
  const [selectedCategory, setSelectedCategory] = useState<EvidenceCategory | "all">("all")
  const [selectedFeatureKey, setSelectedFeatureKey] = useState<FeatureKey>("meanSlopeDeg")

  // 3. Copy State for Dataset ID
  const [copiedId, setCopiedId] = useState(false)

  if (!activeLocation) {
    return (
      <PanelCard title="Scientific Evidence Explorer" description="Inspect authentic planetary telemetry provenance">
        <div className="p-8 text-center font-mono text-sm text-slate-400">
          No location telemetry available for inspection.
        </div>
      </PanelCard>
    )
  }

  const activeLineage = getEvidenceLineage(activeLocation, selectedFeatureKey)
  const allLineages = getAllEvidenceLineages(activeLocation)

  const filteredLineages = allLineages.filter((item) => {
    if (selectedCategory !== "all" && item.featureCategory !== selectedCategory) return false
    return true
  })

  function handleCopyDatasetId(id: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const bodyBadgeColor =
    activeLineage.planetaryBody === "Mars"
      ? "bg-rose-950/70 border-rose-500/40 text-rose-300"
      : activeLineage.planetaryBody === "Moon"
      ? "bg-slate-800/80 border-slate-500/40 text-slate-300"
      : "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"

  return (
    <PanelCard
      title="Scientific Evidence & Telemetry Lineage Explorer"
      description="Interactive 5-stage provenance audit: Planetary Target → Environmental Parameter → Measurement → Dataset Source → Scientific Documentation"
      actions={
        <div className="flex items-center gap-2">
          {activeLocation.isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>100% TRACEABLE CITATIONS</span>
            </span>
          ) : (
            <IllustrativeBadge label="Illustrative prototype mode" />
          )}
        </div>
      }
      isUpdating={isUpdating}
    >
      <div className="flex flex-col gap-6 font-mono text-xs">
        {/* 5-STAGE BREADCRUMB PIPELINE BANNER */}
        <div className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-3 sm:p-4 backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-cyan-400" />
            <span>5-STAGE SCIENTIFIC PROVENANCE CHAIN</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px]">
            {/* Step 1 */}
            <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 p-2.5 flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-cyan-400">1. Target / Analog</span>
              <span className="font-bold text-white truncate">{activeLineage.locationName}</span>
              <span className="text-[10px] text-cyan-300/80">{activeLineage.planetaryBody.toUpperCase()}</span>
            </div>

            {/* Step 2 */}
            <div className="rounded-lg border border-purple-500/40 bg-purple-950/40 p-2.5 flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-purple-400">2. Parameter</span>
              <span className="font-bold text-white truncate">{activeLineage.featureLabel}</span>
              <span className="text-[10px] text-purple-300/80">Unit: {activeLineage.featureUnit || "dimensionless"}</span>
            </div>

            {/* Step 3 */}
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-2.5 flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-emerald-400">3. Measurement</span>
              <span className="font-bold text-emerald-300 truncate">{activeLineage.displayValue}</span>
              <span className="text-[10px] text-slate-300 truncate">{activeLineage.dataAvailability}</span>
            </div>

            {/* Step 4 */}
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-2.5 flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-amber-400">4. Instrument & Dataset</span>
              <span className="font-bold text-white truncate">{activeLineage.instrumentName}</span>
              <span className="text-[10px] text-amber-300/80 truncate">{activeLineage.satelliteOrMission}</span>
            </div>

            {/* Step 5 */}
            <div className="rounded-lg border border-blue-500/40 bg-blue-950/40 p-2.5 flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-blue-400">5. Documentation</span>
              <span className="font-bold text-cyan-300 truncate">Official Repository</span>
              <span className="text-[10px] text-slate-400 truncate">{activeLineage.datasetProvider.split("/")[0]}</span>
            </div>
          </div>
        </div>

        {/* STAGE 1: LOCATION & TARGET SELECTOR */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Globe2 className="size-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">
                STAGE 1: PLANETARY BODY & LOCATION AUDIT
              </span>
            </div>

            {/* Target vs Candidate Mode Switcher */}
            <div className="flex items-center gap-1 self-start sm:self-auto rounded-lg border border-slate-800 bg-slate-950 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setLocationTab("targets")}
                className={cn(
                  "px-3 py-1 rounded transition cursor-pointer font-semibold",
                  locationTab === "targets"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "text-slate-400 hover:text-white",
                )}
              >
                Planetary Targets ({allTargets.length})
              </button>
              <button
                type="button"
                onClick={() => setLocationTab("candidates")}
                className={cn(
                  "px-3 py-1 rounded transition cursor-pointer font-semibold",
                  locationTab === "candidates"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white",
                )}
              >
                Earth Analogs ({allCandidates.length})
              </button>
            </div>
          </div>

          {/* Location Horizontal Scroll / Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {(locationTab === "targets" ? allTargets : allCandidates).map((loc) => {
              const isSelected = loc.id === activeLocation.id
              const locBody = "body" in loc ? loc.body.toUpperCase() : "EARTH"
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={cn(
                    "flex flex-col items-start p-2 rounded-lg border text-left transition cursor-pointer relative",
                    isSelected
                      ? "border-cyan-500/60 bg-cyan-950/40 shadow-[0_0_12px_rgba(56,189,248,0.2)] ring-1 ring-cyan-500/50"
                      : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60",
                  )}
                >
                  <div className="flex items-center justify-between w-full text-[9px] text-slate-500">
                    <span className="uppercase font-bold">{locBody}</span>
                    {loc.isVerified && <span className="text-emerald-400 font-bold">VERIFIED</span>}
                  </div>
                  <div className="text-xs font-bold text-white mt-1 line-clamp-1 leading-tight">
                    {loc.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate w-full">
                    {"body" in loc ? loc.region : loc.country}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Active Location Identity Card */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-3">
              <span className={cn("px-2 py-0.5 rounded border text-[10px] font-bold uppercase", bodyBadgeColor)}>
                {activeLineage.planetaryBody}
              </span>
              <div>
                <span className="font-bold text-white text-sm">{activeLineage.locationName}</span>
                <span className="text-slate-400 ml-2">({activeLineage.regionOrCountry})</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[10px]">
              <span className="flex items-center gap-1">
                <Compass className="size-3 text-cyan-400" />
                {formatCoordinates(activeLineage.latitude, activeLineage.longitude)}
              </span>
              <span>
                Datum: <strong className="text-slate-300">{activeLineage.referenceDatum.split(" ")[0]}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* STAGE 2: PARAMETER BROWSER & CATEGORY SELECTOR */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-purple-400" />
              <span className="font-bold text-white text-sm">
                STAGE 2: ENVIRONMENTAL PARAMETER & PHYSICAL DIMENSION
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-2.5 py-1 rounded transition cursor-pointer border",
                  selectedCategory === "all"
                    ? "border-purple-500/50 bg-purple-950/60 text-purple-300"
                    : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white",
                )}
              >
                All (12)
              </button>
              {EVIDENCE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={cn(
                    "px-2.5 py-1 rounded transition cursor-pointer border",
                    selectedCategory === cat.key
                      ? "border-purple-500/50 bg-purple-950/60 text-purple-300"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white",
                  )}
                >
                  {cat.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 12 Parameter Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredLineages.map((item) => {
              const isSelected = item.featureKey === selectedFeatureKey
              return (
                <button
                  key={item.featureKey}
                  type="button"
                  onClick={() => setSelectedFeatureKey(item.featureKey)}
                  className={cn(
                    "flex flex-col p-2.5 rounded-lg border text-left transition cursor-pointer",
                    isSelected
                      ? "border-purple-500/60 bg-purple-950/40 shadow-[0_0_12px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/40"
                      : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60",
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="uppercase">{item.featureCategory}</span>
                    <span className="text-cyan-400 font-semibold">{item.featureUnit || "class"}</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1 line-clamp-1">
                    {item.featureLabel}
                  </div>
                  <div className="text-sm font-bold text-emerald-300 mt-1 tabular-nums">
                    {item.displayValue}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* STAGES 3, 4, 5: DEEP EVIDENCE LINEAGE DOSSIER */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* STAGE 3: MEASUREMENT & VERIFICATION AUDIT */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <Activity className="size-4 text-emerald-400" />
                  STAGE 3: MEASUREMENT VALUE & QUALITY AUDIT
                </span>
                <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {activeLineage.dataAvailability}
                </span>
              </div>

              {/* Big Value Showcase */}
              <div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-bold">
                    {activeLineage.featureLabel}
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-300 mt-1 tabular-nums">
                    {activeLineage.displayValue}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={cn(
                      "rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      activeLineage.comparabilityClassification === "DIRECTLY_COMPARABLE"
                        ? "bg-emerald-950 border border-emerald-500/40 text-emerald-300"
                        : activeLineage.comparabilityClassification === "COMPARABLE_AFTER_TRANSFORMATION"
                        ? "bg-amber-950 border border-amber-500/40 text-amber-300"
                        : activeLineage.comparabilityClassification === "PROXY_BASED"
                        ? "bg-purple-950 border border-purple-500/40 text-purple-300"
                        : "bg-rose-950 border border-rose-500/40 text-rose-300",
                    )}
                  >
                    {activeLineage.comparabilityClassification.replace(/_/g, " ")}
                  </span>
                  <span className="text-[9px] text-slate-500">4-Tier Framework</span>
                </div>
              </div>

              {/* Comparability Rationale */}
              <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 flex flex-col gap-1 text-[11px]">
                <div className="text-[9px] uppercase font-bold text-slate-500">HARMONIZATION RATIONALE</div>
                <div className="text-slate-300 leading-relaxed">
                  {activeLineage.comparabilityRationale}
                </div>
              </div>

              {/* Temporal & Spatial Resolution */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded bg-slate-950/80 border border-slate-800 p-2.5">
                  <div className="text-[9px] uppercase font-bold text-slate-500">TEMPORAL COVERAGE</div>
                  <div className="text-white font-semibold mt-0.5 truncate">{activeLineage.temporalCoverage}</div>
                </div>
                <div className="rounded bg-slate-950/80 border border-slate-800 p-2.5">
                  <div className="text-[9px] uppercase font-bold text-slate-500">SPATIAL RESOLUTION</div>
                  <div className="text-white font-semibold mt-0.5 truncate">{activeLineage.spatialResolution}</div>
                </div>
              </div>

              {/* Quality Notes */}
              <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-[11px]">
                <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">CALIBRATION & QUALITY NOTES</div>
                <div className="text-slate-300 italic leading-relaxed">
                  &ldquo;{activeLineage.qualityInformation}&rdquo;
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
              <span>Authentic Space Agency Telemetry Record</span>
              <span className="text-emerald-400">PDS Verified</span>
            </div>
          </div>

          {/* STAGE 4 & 5: INSTRUMENT, DATASET & DOCUMENTATION */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <Satellite className="size-4 text-cyan-400" />
                  STAGE 4 & 5: INSTRUMENT PLATFORM & OFFICIAL ARCHIVE
                </span>
                <span className="text-[10px] text-slate-500">PEER-REVIEWED CITATIONS</span>
              </div>

              {/* Instrument & Mission Card */}
              <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 flex flex-col gap-2 text-[11px]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-cyan-400">INSTRUMENT / PAYLOAD</div>
                    <div className="text-sm font-bold text-white mt-0.5">{activeLineage.instrumentName}</div>
                  </div>
                  <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] text-slate-300 shrink-0 font-bold">
                    {activeLineage.satelliteOrMission}
                  </span>
                </div>

                <div className="border-t border-slate-800/80 pt-2">
                  <div className="text-[9px] uppercase font-bold text-slate-500">DATASET IDENTIFIER</div>
                  <div className="flex items-center justify-between gap-2 mt-0.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-cyan-300">
                    <span className="truncate">{activeLineage.datasetIdentifier}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyDatasetId(activeLineage.datasetIdentifier)}
                      className="text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                      title="Copy Dataset Identifier"
                    >
                      {copiedId ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-500">DATASET PROVIDER / SPONSOR</div>
                  <div className="text-slate-200 mt-0.5">{activeLineage.datasetProvider}</div>
                </div>
              </div>

              {/* Processing Method */}
              <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-[11px]">
                <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">
                  INSPECTION & PROCESSING METHOD
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {activeLineage.processingMethod}
                </div>
              </div>

              {/* Scientific Limitations */}
              <div className="rounded-lg bg-slate-950/80 border border-amber-500/20 p-3 text-[11px]">
                <div className="text-[9px] uppercase font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="size-3" />
                  <span>KNOWN SCIENTIFIC LIMITATIONS</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {activeLineage.scientificLimitations}
                </div>
              </div>
            </div>

            {/* STAGE 5: OFFICIAL DOCUMENTATION DEEP-LINK BUTTON */}
            <div className="border-t border-slate-800/80 pt-3">
              <a
                href={activeLineage.officialDocumentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 py-2.5 px-4 font-bold text-cyan-300 transition shadow-[0_0_15px_rgba(56,189,248,0.15)] cursor-pointer"
              >
                <BookOpen className="size-4" />
                <span>ACCESS OFFICIAL ARCHIVE & DOCUMENTATION</span>
                <ExternalLink className="size-3.5" />
              </a>
              <div className="text-[10px] text-slate-500 text-center mt-2 truncate">
                Direct link to verified NASA PDS / Earthdata / ESA repository
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelCard>
  )
}
