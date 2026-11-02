"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from "recharts"
import { PanelCard } from "@/components/shared/panel-card"
import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import {
  formatCoordinates,
  formatCoverage,
  formatFeatureValue,
  formatScore,
  getFeatureComparabilityInfo,
} from "@/lib/terratwin/format"
import { FEATURE_MAP, LITHOLOGY_LABELS, LITHOLOGY_FAMILIES } from "@/lib/terratwin/features"
import {
  TERRAIN_DOMAINS,
  buildTerrainRadarData,
  classifyWentworthGrainSize,
  classifySlopeHazard,
  classifyRockHazard,
  generateScientificInterpretation,
  type TerrainDomainKey,
} from "@/lib/terratwin/terrain-comparison"
import type {
  Lithology,
  MissionPurposeDefinition,
  PlanetaryTarget,
  RankedCandidate,
} from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  Globe2,
  Layers,
  Mountain,
  Pickaxe,
  Scale,
  ShieldCheck,
  Sparkles,
  Terminal,
  Truck,
} from "lucide-react"

interface TerrainComparisonWorkspaceProps {
  target: PlanetaryTarget
  purpose: MissionPurposeDefinition
  result: RankedCandidate
  allCandidates: RankedCandidate[]
  onSelectCandidate: (candidateId: string) => void
  isUpdating?: boolean
}

export function TerrainComparisonWorkspace({
  target,
  purpose,
  result,
  allCandidates,
  onSelectCandidate,
  isUpdating,
}: TerrainComparisonWorkspaceProps) {
  const { candidate } = result
  const [selectedDomain, setSelectedDomain] = useState<TerrainDomainKey>("topography")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const isVerified = target.isVerified || candidate.isVerified
  const radarData = buildTerrainRadarData(target, candidate)
  const interpretation = generateScientificInterpretation(target, candidate, result, purpose)

  const targetBodyColor =
    target.body === "mars"
      ? { text: "text-rose-400", bg: "bg-rose-950/60", border: "border-rose-500/40", hex: "#f43f5e" }
      : { text: "text-slate-300", bg: "bg-slate-800/80", border: "border-slate-500/40", hex: "#94a3b8" }

  const slopeHazard = classifySlopeHazard(candidate.environment.meanSlopeDeg)
  const rockHazard = classifyRockHazard(candidate.environment.rockAbundancePct)
  const targetGrainWentworth = classifyWentworthGrainSize(target.environment.medianGrainSizeMm)
  const candGrainWentworth = classifyWentworthGrainSize(candidate.environment.medianGrainSizeMm)

  const targetLithology = target.environment.lithology as Lithology
  const candLithology = candidate.environment.lithology as Lithology
  const targetFamily = LITHOLOGY_FAMILIES[targetLithology] ?? "igneous"
  const candFamily = LITHOLOGY_FAMILIES[candLithology] ?? "igneous"
  const lithologyExactMatch = targetLithology === candLithology
  const lithologyFamilyMatch = targetFamily === candFamily

  return (
    <PanelCard
      title="Advanced Terrain & Environmental Comparison Workspace"
      description={`Multi-dimensional comparative analysis: ${target.name} (${target.body.toUpperCase()}) vs. ${candidate.name} (EARTH) calibrated for ${purpose.label.toLowerCase()}`}
      actions={
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>AUTHENTIC MEASUREMENTS</span>
            </span>
          ) : (
            <IllustrativeBadge label="Illustrative demo mode" />
          )}
        </div>
      }
      isUpdating={isUpdating}
    >
      <div className="flex flex-col gap-6">
        {/* PANEL A & B: TARGET & ANALOG SELECTION CARDS */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* PANEL A: PLANETARY TARGET PANEL */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      targetBodyColor.border,
                      targetBodyColor.bg,
                      targetBodyColor.text,
                    )}
                  >
                    PLANETARY TARGET // {target.body.toUpperCase()}
                  </span>
                  {target.isVerified && (
                    <span className="rounded border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.2 text-[9px] text-emerald-300 font-semibold">
                      PDS ARCHIVED
                    </span>
                  )}
                </div>
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Compass className="size-3 text-cyan-400" />
                  {formatCoordinates(target.latitude ?? 0, target.longitude ?? 0)}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{target.name}</span>
              </h3>

              <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
                <span className="text-slate-300">{target.region}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                {target.summary}
              </p>
            </div>

            {/* Target Telemetry Strip */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 font-mono text-[11px]">
              <div className="rounded bg-slate-950/60 border border-slate-800/80 p-2">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">DATUM SLOPE</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {target.environment.meanSlopeDeg !== null ? `${target.environment.meanSlopeDeg}°` : "N/A"}
                </div>
              </div>
              <div className="rounded bg-slate-950/60 border border-slate-800/80 p-2">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">ROCK COVER</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {target.environment.rockAbundancePct !== null ? `${target.environment.rockAbundancePct}%` : "N/A"}
                </div>
              </div>
              <div className="rounded bg-slate-950/60 border border-slate-800/80 p-2">
                <div className="text-[9px] uppercase tracking-wider text-slate-500">LITHOLOGY</div>
                <div className="text-xs font-bold text-cyan-300 mt-1 truncate">
                  {LITHOLOGY_LABELS[targetLithology] ?? "Unknown"}
                </div>
              </div>
            </div>
          </div>

          {/* PANEL B: EARTH ANALOG SELECTION PANEL */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm flex flex-col gap-3">
            <div className="flex items-center justify-between font-mono text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Globe2 className="size-3.5" />
                ACTIVE EARTH ANALOG CANDIDATES ({allCandidates.length} VETTED SITES)
              </span>
              <span className="text-[10px] text-slate-500">CLICK TO SWITCH ANALOG</span>
            </div>

            {/* Candidate Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allCandidates.map((cResult) => {
                const cand = cResult.candidate
                const isSelected = cand.id === candidate.id
                return (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => onSelectCandidate(cand.id)}
                    className={cn(
                      "flex flex-col items-start p-2 rounded-lg border text-left font-mono transition cursor-pointer relative",
                      isSelected
                        ? "border-emerald-500/60 bg-emerald-950/40 shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40"
                        : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60",
                    )}
                  >
                    <div className="flex items-center justify-between w-full text-[10px]">
                      <span
                        className={cn(
                          "font-bold",
                          isSelected ? "text-emerald-300" : "text-slate-400",
                        )}
                      >
                        #{cResult.rank}
                      </span>
                      <span className="text-[9px] text-slate-500 truncate max-w-[65px]">
                        {cand.country}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1 line-clamp-1 leading-tight">
                      {cand.name}
                    </div>
                    <div className="flex items-center justify-between w-full mt-2 text-[10px]">
                      <span className="text-emerald-400 font-bold tabular-nums">
                        {cResult.score !== null ? `${formatScore(cResult.score)}` : "N/A"}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase truncate max-w-[55px]">
                        {cand.setting.split(" ")[0]}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Active Selected Candidate Telemetry Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 font-mono text-xs mt-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-300">{candidate.name}</span>
                <span className="text-slate-400 text-[11px]">({candidate.country})</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-slate-400">
                  Setting: <strong className="text-slate-200">{candidate.setting}</strong>
                </span>
                <span className="text-slate-400">
                  Fidelity: <strong className="text-cyan-300">{formatScore(result.score)}</strong>
                </span>
                <span className="text-slate-400">
                  Coverage: <strong className="text-purple-300">{formatCoverage(result.coverage)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL C: SIDE-BY-SIDE TERRAIN VISUALIZATIONS */}
        <div className="grid gap-6 xl:grid-cols-12">
          {/* C1: MULTI-AXIS RADAR/SPIDER CHART */}
          <div className="xl:col-span-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-cyan-400" />
                <span className="font-bold text-white">TERRAIN & ENVIRONMENTAL RADAR</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="size-2.5 rounded-full bg-cyan-400" />
                  <span>{target.name.split(" ")[0]}</span>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                  <span>{candidate.name.split(" ")[0]}</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="parameter"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="#475569"
                    tick={{ fill: "#64748b", fontSize: 8 }}
                  />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null
                      const data = payload[0].payload as (typeof radarData)[0]
                      return (
                        <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3 font-mono text-xs shadow-xl backdrop-blur-md">
                          <div className="font-bold text-white border-b border-slate-800 pb-1 mb-2">
                            {data.parameter}
                          </div>
                          <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center justify-between gap-4 text-cyan-300">
                              <span>{target.name}:</span>
                              <strong>{data.targetDisplay}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-emerald-300">
                              <span>{candidate.name}:</span>
                              <strong>{data.candidateDisplay}</strong>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-800 pt-1">
                              Normalized scale: 0–100%
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Radar
                    name={target.name}
                    dataKey="targetNorm"
                    stroke="#38bdf8"
                    fill="#38bdf8"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name={candidate.name}
                    dataKey="candidateNorm"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
              <span>Axes normalized to domain extremes · Hover to inspect calibrated scientific values</span>
              <span className="text-cyan-400">Recharts Radar Engine</span>
            </div>
          </div>

          {/* C2: SIDE-BY-SIDE PHYSICAL MORPHOLOGY & SURFACE CARDS */}
          <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* SLOPE CARD */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Mountain className="size-3.5 text-cyan-400" />
                    TERRAIN SLOPE
                  </span>
                  <span className={cn("text-[10px] font-semibold", slopeHazard.color)}>
                    {slopeHazard.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-2 text-xs">
                  <div className="rounded bg-slate-950/60 border border-slate-800 p-2">
                    <div className="text-[9px] uppercase text-slate-500">{target.name.split(" ")[0]}</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      {target.environment.meanSlopeDeg !== null ? `${target.environment.meanSlopeDeg}°` : "N/A"}
                    </div>
                  </div>
                  <div className="rounded bg-slate-950/60 border border-slate-800 p-2">
                    <div className="text-[9px] uppercase text-slate-500">{candidate.name.split(" ")[0]}</div>
                    <div className="text-base font-bold text-emerald-300 mt-0.5">
                      {candidate.environment.meanSlopeDeg !== null ? `${candidate.environment.meanSlopeDeg}°` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                {target.environment.meanSlopeDeg !== null && candidate.environment.meanSlopeDeg !== null ? (
                  <span>
                    Delta: <strong className="text-white">Δ{Math.abs(target.environment.meanSlopeDeg - candidate.environment.meanSlopeDeg).toFixed(1)}°</strong> (Kinematic traverse matching)
                  </span>
                ) : (
                  "Incomplete slope telemetry"
                )}
              </div>
            </div>

            {/* ROCK ABUNDANCE CARD */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Truck className="size-3.5 text-amber-400" />
                    ROCK ABUNDANCE
                  </span>
                  <span className={cn("text-[10px] font-semibold", rockHazard.color)}>
                    {rockHazard.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-2 text-xs">
                  <div className="rounded bg-slate-950/60 border border-slate-800 p-2">
                    <div className="text-[9px] uppercase text-slate-500">{target.name.split(" ")[0]}</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      {target.environment.rockAbundancePct !== null ? `${target.environment.rockAbundancePct}%` : "N/A"}
                    </div>
                  </div>
                  <div className="rounded bg-slate-950/60 border border-slate-800 p-2">
                    <div className="text-[9px] uppercase text-slate-500">{candidate.name.split(" ")[0]}</div>
                    <div className="text-base font-bold text-emerald-300 mt-0.5">
                      {candidate.environment.rockAbundancePct !== null ? `${candidate.environment.rockAbundancePct}%` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                {target.environment.rockAbundancePct !== null && candidate.environment.rockAbundancePct !== null ? (
                  <span>
                    Obstacle clearance: <strong className="text-white">Δ{Math.abs(target.environment.rockAbundancePct - candidate.environment.rockAbundancePct).toFixed(1)}%</strong>
                  </span>
                ) : (
                  "Incomplete rock telemetry"
                )}
              </div>
            </div>

            {/* GRAIN SIZE (WENTWORTH SCALE) CARD */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Layers className="size-3.5 text-purple-400" />
                    REGOLITH GRAIN SIZE
                  </span>
                  <span className="text-[10px] text-slate-500">WENTWORTH SCALE</span>
                </div>

                <div className="flex flex-col gap-1.5 my-2 text-xs">
                  <div className="rounded bg-slate-950/60 border border-slate-800 p-1.5 flex items-center justify-between">
                    <span className="text-[9px] uppercase text-slate-500">{target.name.split(" ")[0]}:</span>
                    <span className="text-[11px] font-bold text-cyan-300">{targetGrainWentworth}</span>
                  </div>
                  <div className="rounded bg-slate-950/60 border border-slate-800 p-1.5 flex items-center justify-between">
                    <span className="text-[9px] uppercase text-slate-500">{candidate.name.split(" ")[0]}:</span>
                    <span className="text-[11px] font-bold text-emerald-300">{candGrainWentworth}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 truncate">
                Wheel traction & sinkage shear angle proxy
              </div>
            </div>

            {/* LITHOLOGY & ROCK FAMILY CARD */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Pickaxe className="size-3.5 text-rose-400" />
                    LITHOLOGY & PETROLOGY
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.2 rounded border",
                      lithologyExactMatch
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                        : lithologyFamilyMatch
                        ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                        : "bg-rose-950/60 border-rose-500/40 text-rose-300",
                    )}
                  >
                    {lithologyExactMatch
                      ? "EXACT MATCH"
                      : lithologyFamilyMatch
                      ? "SHARED FAMILY"
                      : "DIVERGENT"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 my-2 text-xs">
                  <div className="rounded bg-slate-950/60 border border-slate-800 p-1.5 flex items-center justify-between">
                    <span className="text-[9px] uppercase text-slate-500">{target.name.split(" ")[0]}:</span>
                    <span className="text-[11px] font-bold text-cyan-300 truncate max-w-[140px]">
                      {LITHOLOGY_LABELS[targetLithology]} ({targetFamily})
                    </span>
                  </div>
                  <div className="rounded bg-slate-950/60 border border-slate-800 p-1.5 flex items-center justify-between">
                    <span className="text-[9px] uppercase text-slate-500">{candidate.name.split(" ")[0]}:</span>
                    <span className="text-[11px] font-bold text-emerald-300 truncate max-w-[140px]">
                      {LITHOLOGY_LABELS[candLithology]} ({candFamily})
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 truncate">
                Drill tool resistance & spectral mineralogy match
              </div>
            </div>
          </div>
        </div>

        {/* PANEL D: CATEGORIZED PARAMETER COMPARISON MATRIX */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 font-mono text-xs flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">
                SCIENTIFIC PARAMETER COMPARISON MATRIX
              </span>
            </div>

            {/* Domain Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {TERRAIN_DOMAINS.map((dom) => (
                <button
                  key={dom.key}
                  type="button"
                  onClick={() => setSelectedDomain(dom.key)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer border",
                    selectedDomain === dom.key
                      ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white",
                  )}
                >
                  {dom.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Active Domain Description */}
          <div className="text-slate-400 text-[11px] italic">
            {TERRAIN_DOMAINS.find((d) => d.key === selectedDomain)?.description}
          </div>

          {/* Matrix Rows */}
          <div className="flex flex-col gap-2">
            {result.featureScores
              .filter((score) => {
                const dom = TERRAIN_DOMAINS.find((d) => d.key === selectedDomain)
                return dom?.features.includes(score.key)
              })
              .map((item) => {
                const feature = FEATURE_MAP[item.key]
                const compInfo = getFeatureComparabilityInfo(item.key)
                const isExpanded = expandedRow === item.key
                const isComparable = item.status === "comparable" && item.similarity !== null
                const isMissing = item.status === "missing_data"
                const isIncompatible =
                  item.status === "incompatible_quantities" || item.status === "incompatible_units"
                const percent = isComparable ? Math.round((item.similarity ?? 0) * 100) : 0

                return (
                  <div
                    key={item.key}
                    className={cn(
                      "rounded-lg border transition-all duration-150 backdrop-blur-sm",
                      isExpanded
                        ? "border-cyan-500/40 bg-slate-900/80 shadow-[0_0_15px_rgba(56,189,248,0.1)]"
                        : "border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50",
                    )}
                  >
                    <div
                      onClick={() => setExpandedRow(isExpanded ? null : item.key)}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 cursor-pointer items-center"
                    >
                      {/* 1. Feature Name & Harmonization Tag */}
                      <div className="col-span-1 sm:col-span-4 flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Toggle details"
                          className="text-slate-400 hover:text-cyan-400 transition shrink-0"
                        >
                          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </button>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-[11px] leading-tight">
                            {feature.label}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            Unit: {feature.unit || "categorical"} · tol: {feature.tolerance ?? "family"}
                          </span>
                        </div>
                      </div>

                      {/* 2. Target Value */}
                      <div className="col-span-1 sm:col-span-3 flex sm:flex-col justify-between sm:justify-center">
                        <span className="sm:hidden text-[10px] text-slate-500 uppercase">Target:</span>
                        <span className="font-bold text-cyan-300 text-[11px]">
                          {formatFeatureValue(item.key, item.targetValue)}
                        </span>
                      </div>

                      {/* 3. Candidate Value */}
                      <div className="col-span-1 sm:col-span-3 flex sm:flex-col justify-between sm:justify-center">
                        <span className="sm:hidden text-[10px] text-slate-500 uppercase">Candidate:</span>
                        <span className="font-bold text-emerald-300 text-[11px]">
                          {formatFeatureValue(item.key, item.candidateValue)}
                        </span>
                      </div>

                      {/* 4. Similarity / Status Badge */}
                      <div className="col-span-1 sm:col-span-2 flex sm:justify-end items-center gap-2">
                        {isComparable && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "font-bold text-xs tabular-nums",
                                percent >= 70 ? "text-cyan-400" : percent >= 40 ? "text-amber-400" : "text-rose-400",
                              )}
                            >
                              {percent}%
                            </span>
                            <span className="text-[9px] text-slate-500">
                              (wt: {item.weight.toFixed(1)})
                            </span>
                          </div>
                        )}
                        {isMissing && (
                          <span className="rounded border border-amber-500/40 bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                            NO DATA
                          </span>
                        )}
                        {isIncompatible && (
                          <span className="rounded border border-purple-500/40 bg-purple-950/40 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                            EXCLUDED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expandable Provenance & Mathematical Breakdown */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950/80 p-3 flex flex-col gap-2 text-[11px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                              SCIENTIFIC CLASSIFICATION & HARMONIZATION
                            </div>
                            <div className="text-slate-300 mt-1">
                              <strong>{compInfo.classification}:</strong> {compInfo.rationale}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                              MATHEMATICAL FORMULATION
                            </div>
                            <div className="text-slate-300 mt-1">
                              {feature.kind === "categorical"
                                ? "Categorical petrology distance: d = 0.0 (identical), 0.5 (shared family), 1.0 (divergent)."
                                : feature.kind === "logarithmic"
                                ? `Logarithmic difference: d = |log10(target) - log10(candidate)| / ${feature.tolerance}.`
                                : `Linear normalized difference: d = |target - candidate| / ${feature.tolerance}.`}
                            </div>
                          </div>
                        </div>

                        {/* Provenance links */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                          <div>
                            Target: <span className="text-white">{item.targetProvenance?.sourceTitle ?? "NASA PDS Planetary Data System"}</span>
                          </div>
                          <div>
                            Candidate: <span className="text-white">{item.candidateProvenance?.sourceTitle ?? "Copernicus / USGS / In-situ literature"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* PANEL E: FEATURE-LEVEL SIMILARITY BREAKDOWN */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 font-mono text-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Sparkles className="size-4 text-purple-400" />
              FEATURE-LEVEL SIMILARITY & DYNAMIC WEIGHT ALLOCATION
            </span>
            <span className="text-[10px] text-slate-500 uppercase">
              CALIBRATED FOR: <strong className="text-cyan-300">{purpose.label}</strong>
            </span>
          </div>

          <div className="text-slate-400 text-[11px] leading-relaxed">
            Overall score is calculated deterministically via weighted discrepancy sum:{" "}
            <code className="rounded bg-slate-950 px-1 py-0.5 text-cyan-300">
              D = Σ(w_i · d_i) / Σ(w_i)
            </code>
            , yielding{" "}
            <code className="rounded bg-slate-950 px-1 py-0.5 text-cyan-300">
              S = 100 · (1 - D)
            </code>
            . Non-comparable quantities and unmeasured parameters are strictly excluded from the denominator.
          </div>

          {/* Visual Breakdown of Active Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
            {result.featureScores
              .filter((f) => f.weight > 0)
              .map((fScore) => {
                const def = FEATURE_MAP[fScore.key]
                const sim = fScore.similarity !== null ? Math.round(fScore.similarity * 100) : 0
                const isComp = fScore.status === "comparable"

                return (
                  <div
                    key={fScore.key}
                    className="flex flex-col gap-1 rounded bg-slate-950/60 border border-slate-800/80 p-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white">{def.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500">Weight: {(fScore.weight * 100).toFixed(0)}%</span>
                        {isComp ? (
                          <span className="font-bold text-cyan-300 tabular-nums">{sim}%</span>
                        ) : (
                          <span className="text-amber-400 font-bold text-[9px]">NO DATA</span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      {isComp && (
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                          style={{ width: `${sim}%` }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* PANEL G: SCIENTIFIC INTERPRETATION PANEL */}
        <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 font-mono text-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2 font-bold text-white text-sm">
              <Terminal className="size-4 text-cyan-400" />
              SCIENTIFIC INTERPRETATION & ANALOG VERDICT
            </span>
            <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
              DATA-DRIVEN SYNTHESIS
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. Mobility & Terramechanics */}
            <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Mountain className="size-3.5" />
                  ROVER MOBILITY
                </span>
                <span className="rounded bg-cyan-950 px-1.5 py-0.2 text-[9px] text-cyan-300">
                  {interpretation.mobilityTrafficability.overallMobilitySuitability}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {interpretation.mobilityTrafficability.slopeAssessment}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/80 pt-1.5">
                {interpretation.mobilityTrafficability.rockClearanceAssessment}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-1.5">
                {interpretation.mobilityTrafficability.regolithMechanicsAssessment}
              </p>
            </div>

            {/* 2. Thermal & Radiative */}
            <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Flame className="size-3.5" />
                  THERMAL & RADIATIVE
                </span>
                <span className="rounded bg-amber-950 px-1.5 py-0.2 text-[9px] text-amber-300">
                  EXTREMES
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {interpretation.thermalRadiative.temperatureDeltaAssessment}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/80 pt-1.5">
                {interpretation.thermalRadiative.diurnalSwingAssessment}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-1.5">
                {interpretation.thermalRadiative.solarFluxAssessment}
              </p>
            </div>

            {/* 3. Geological Fidelity */}
            <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <Pickaxe className="size-3.5" />
                  GEOLOGICAL FIDELITY
                </span>
                <span className="rounded bg-purple-950 px-1.5 py-0.2 text-[9px] text-purple-300">
                  {interpretation.geologicalComposition.lithologyMatchStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {interpretation.geologicalComposition.petrologyAssessment}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/80 pt-1.5">
                {interpretation.geologicalComposition.vegetationOverprintAssessment}
              </p>
            </div>
          </div>

          {/* Verdict and Strengths vs Limitations */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 flex flex-col gap-2">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span>MISSION SUITABILITY VERDICT</span>
            </div>
            <div className="text-sm font-semibold text-emerald-300 leading-relaxed">
              {interpretation.missionSuitabilityVerdict.verdict}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-800/80 pt-2 text-[11px]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Primary Testing Strengths:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {interpretation.missionSuitabilityVerdict.primaryTestingStrengths.map((s, idx) => (
                    <li key={idx} className="leading-snug">{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                  Critical Testing Limitations:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {interpretation.missionSuitabilityVerdict.criticalTestingLimitations.map((l, idx) => (
                    <li key={idx} className="leading-snug">{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL F: SCIENTIFIC DATASET PROVENANCE & LIMITATIONS */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 font-mono text-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <BookOpen className="size-4 text-cyan-400" />
              SCIENTIFIC DATASET PROVENANCE & ARCHIVE CITATIONS
            </span>
            <span className="text-[10px] text-slate-500">OFFICIAL REPOSITORIES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
            <div className="flex flex-col gap-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-cyan-400" />
                <span>Extraterrestrial Mission Telemetry (Mars & Moon)</span>
              </div>
              <ul className="space-y-1 text-slate-400 leading-relaxed">
                <li>
                  <strong>MGS MOLA:</strong> Mars Global Surveyor Mars Orbiter Laser Altimeter MEGDR 128 px/deg altimetry (NASA PDS Geosciences Node).
                </li>
                <li>
                  <strong>LRO LOLA:</strong> Lunar Reconnaissance Orbiter Laser Altimeter LDEM 128 px/deg polar and equatorial relief.
                </li>
                <li>
                  <strong>THEMIS & Diviner:</strong> 2001 Mars Odyssey Thermal Emission Imaging System & LRO Diviner Lunar Radiometer Experiment surface temperatures.
                </li>
                <li>
                  <strong>In-situ Literature:</strong> Mars 2020 Perseverance & MSL Curiosity rock distribution, soil mechanics, and APXS petrology.
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>Terrestrial Analog Telemetry (Earth)</span>
              </div>
              <ul className="space-y-1 text-slate-400 leading-relaxed">
                <li>
                  <strong>Copernicus DEM:</strong> COP-DEM-GLO-90 30m/90m spatial elevation and relief models (ESA / Airbus).
                </li>
                <li>
                  <strong>MODIS Terra:</strong> MOD11A1 Land Surface Temperature, MOD09GA Surface Reflectance, and MOD13Q1 Vegetation Index (NASA LP DAAC).
                </li>
                <li>
                  <strong>ERA5-Land & USGS:</strong> ECMWF atmospheric reanalysis and USGS National Map geological survey catalogs.
                </li>
                <li>
                  <strong>Peer-Reviewed Literature:</strong> Published NASA analog field campaign measurements (e.g., Lake Salda Jezero-analog astrobiology, HMP Devon Island).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PanelCard>
  )
}
