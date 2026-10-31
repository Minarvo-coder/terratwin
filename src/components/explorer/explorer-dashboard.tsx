"use client"

import { useState } from "react"
import { useAnalogs } from "@/hooks/use-analogs"
import type { MissionPurpose, PlanetaryBody, PlanetaryTarget } from "@/lib/terratwin/types"
import { AnalogMap } from "./analog-map"
import { CandidateList } from "./candidate-list"
import { ComparisonPanel } from "./comparison-panel"
import { ExplorerEmpty, ExplorerError, ExplorerLoading } from "./explorer-states"
import { PurposeSelector } from "./purpose-selector"
import { ScoreThresholdControl } from "./score-threshold-control"
import { TargetProfile } from "./target-profile"
import { TargetSelector } from "./target-selector"
import { MissionSuitePanel } from "./mission-suite-panel"
import { PlanetaryGlobe } from "./planetary-globe"
import {
  ShieldCheck,
  AlertTriangle,
  Layers,
  Compass,
  Globe2,
  Satellite,
  Columns2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_MIN_SCORE = 0

interface ExplorerDashboardProps {
  targets: PlanetaryTarget[]
}

export function ExplorerDashboard({ targets }: ExplorerDashboardProps) {
  const [explorerMode, setExplorerMode] = useState<"single" | "suite">("single")
  const [reconLayout, setReconLayout] = useState<"dual" | "planet" | "earth">("dual")
  const [sourceFilter, setSourceFilter] = useState<"all" | "verified" | "sample">("all")
  const [body, setBody] = useState<PlanetaryBody>("mars")
  const [targetId, setTargetId] = useState(() => {
    const defaultTarget = targets.find((t) => t.body === "mars" && t.isVerified) ?? targets[0]
    return defaultTarget?.id ?? ""
  })
  const [purposeId, setPurposeId] = useState<MissionPurpose>("rover-testing")
  const [minScore, setMinScore] = useState(DEFAULT_MIN_SCORE)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredTargets = targets.filter((t) => {
    if (sourceFilter === "verified") return !!t.isVerified
    if (sourceFilter === "sample") return !t.isVerified
    const hasVerified = targets.some((target) => target.isVerified)
    if (hasVerified) return !!t.isVerified
    return true
  })

  const { data, error, isLoading, isValidating, mutate, isTargetValid } = useAnalogs({
    targetId,
    purposeId,
    minScore,
  })

  const selectedTarget = targets.find((target) => target.id === targetId || target.databaseId === targetId) ?? data?.target
  const results = data?.results ?? []
  const selectedResult = results.find((result) => result.candidate.id === selectedId) ?? results[0]
  const isUpdating = isValidating && !isLoading

  function handleBodyChange(nextBody: PlanetaryBody) {
    setBody(nextBody)
    const available = targets.filter((t) => {
      if (sourceFilter === "verified") return !!t.isVerified
      if (sourceFilter === "sample") return !t.isVerified
      const hasVerified = targets.some((target) => target.isVerified)
      if (hasVerified) return !!t.isVerified
      return true
    })
    const matching = available.filter((t) => t.body === nextBody)
    const nextTarget = matching.find((t) => t.isVerified) ?? matching[0]
    if (nextTarget) {
      setTargetId(nextTarget.id)
      setSelectedId(null)
    }
  }

  function handleFilterChange(mode: "all" | "verified" | "sample") {
    setSourceFilter(mode)
    const available = targets.filter((t) => {
      if (mode === "verified") return !!t.isVerified
      if (mode === "sample") return !t.isVerified
      const hasVerified = targets.some((target) => target.isVerified)
      if (hasVerified) return !!t.isVerified
      return true
    })
    const firstMatching = available.find((t) => t.body === body) ?? available[0]
    if (firstMatching) {
      setTargetId(firstMatching.id)
      setSelectedId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Provenance Status & Dataset Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg border",
              data?.dataset.isVerified
                ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                : "border-amber-500/40 bg-amber-950/60 text-amber-300",
            )}
          >
            {data?.dataset.isVerified ? <ShieldCheck className="size-5" /> : <AlertTriangle className="size-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {data?.dataset.name ?? "Telemetry Catalog"}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                v{data?.dataset.version ?? "1.0"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl">
              {data?.dataset.notice}
            </p>
          </div>
        </div>

        {/* Source Mode Toggle */}
        <div className="flex items-center gap-1 self-start sm:self-center rounded-lg border border-slate-800 bg-slate-950/80 p-1 text-[11px]">
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={cn(
              "rounded px-2.5 py-1 transition cursor-pointer",
              sourceFilter === "all" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-white",
            )}
          >
            All Catalog
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("verified")}
            className={cn(
              "rounded px-2.5 py-1 transition cursor-pointer flex items-center gap-1",
              sourceFilter === "verified" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40" : "text-slate-400 hover:text-white",
            )}
          >
            <ShieldCheck className="size-3 text-emerald-400" />
            <span>Verified DB</span>
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("sample")}
            className={cn(
              "rounded px-2.5 py-1 transition cursor-pointer",
              sourceFilter === "sample" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40" : "text-slate-400 hover:text-white",
            )}
          >
            Illustrative Demo
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside aria-label="Exploration controls" className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <div className="flex flex-col gap-6 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <TargetSelector
              targets={filteredTargets}
              body={body}
              targetId={targetId}
              onBodyChange={handleBodyChange}
              onTargetChange={(id) => {
                setTargetId(id)
                setSelectedId(null)
              }}
            />
            <PurposeSelector value={purposeId} onChange={setPurposeId} />
            <ScoreThresholdControl value={minScore} onCommit={setMinScore} />
          </div>
          {selectedTarget && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <TargetProfile target={selectedTarget} />
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          {/* Strategy Mode Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-2 font-mono text-xs backdrop-blur-md">
            <div className="flex items-center gap-2 pl-2">
              <Compass className="size-4 text-cyan-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Exploration Strategy:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setExplorerMode("single")}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-bold transition cursor-pointer flex items-center gap-1.5 text-xs",
                  explorerMode === "single"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(56,189,248,0.15)]"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <span>1-to-1 Analog Site Matching</span>
              </button>
              <button
                type="button"
                onClick={() => setExplorerMode("suite")}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-bold transition cursor-pointer flex items-center gap-1.5 text-xs",
                  explorerMode === "suite"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <Layers className="size-3.5 text-purple-400" />
                <span>Mission Suite // Multi-Site Optimizer</span>
                <span className="rounded bg-purple-950/80 border border-purple-500/40 px-1 py-0.2 text-[9px] text-purple-300 font-bold">
                  NEW
                </span>
              </button>
            </div>
          </div>

          {!isTargetValid ? (
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/60 p-8 text-center font-mono text-sm text-cyan-300">
              <p className="font-semibold uppercase tracking-wider">No Planetary Target Selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Please select a Moon or Mars target location from the navigation panel to rank Earth analog sites.
              </p>
            </div>
          ) : explorerMode === "suite" && selectedTarget ? (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <PlanetaryGlobe
                  body={body}
                  selectedTarget={selectedTarget}
                  allTargets={filteredTargets}
                  onSelectTarget={(id) => {
                    setTargetId(id)
                    setSelectedId(null)
                  }}
                  isUpdating={isUpdating}
                />
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <TargetProfile target={selectedTarget} />
                </div>
              </div>
              <MissionSuitePanel
                target={selectedTarget}
                purposeId={purposeId}
                isVerified={data?.dataset.isVerified}
              />
            </div>
          ) : error ? (
            <ExplorerError message={error.message} onRetry={() => mutate()} />
          ) : isLoading || !data ? (
            <ExplorerLoading />
          ) : results.length === 0 ? (
            <ExplorerEmpty minScore={data.minScore} onReset={() => setMinScore(DEFAULT_MIN_SCORE)} />
          ) : (
            <>
              {/* Reconnaissance View Mode Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-2 font-mono text-xs backdrop-blur-md">
                <div className="flex items-center gap-2 pl-2">
                  <Columns2 className="size-4 text-cyan-400" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">Flight Deck Reconnaissance:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReconLayout("dual")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer border",
                      reconLayout === "dual"
                        ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white",
                    )}
                    title="Dual Flight Deck: Side-by-side 3D Target World and 2D Earth Analog Map"
                  >
                    <Columns2 className="size-3.5 text-cyan-400" />
                    <span>Dual Flight Deck</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReconLayout("planet")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer border",
                      reconLayout === "planet"
                        ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white",
                    )}
                    title={`Focus on 3D ${body === "mars" ? "Mars" : "Moon"} Visualization`}
                  >
                    <Globe2 className="size-3.5 text-cyan-400" />
                    <span className="capitalize">{body} 3D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReconLayout("earth")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer border",
                      reconLayout === "earth"
                        ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white",
                    )}
                    title="Focus on Earth Global Reconnaissance Map"
                  >
                    <Satellite className="size-3.5 text-cyan-400" />
                    <span>Earth Map</span>
                  </button>
                </div>
              </div>

              {/* Main Flight Deck Grid */}
              <div
                className={cn(
                  "grid gap-4",
                  reconLayout === "dual"
                    ? "grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px]"
                    : "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]",
                )}
              >
                {/* Reconnaissance Canvas Deck */}
                <div
                  className={cn(
                    "grid gap-4",
                    reconLayout === "dual" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {(reconLayout === "dual" || reconLayout === "planet") && (
                    <PlanetaryGlobe
                      body={body}
                      selectedTarget={selectedTarget}
                      allTargets={filteredTargets}
                      onSelectTarget={(id) => {
                        setTargetId(id)
                        setSelectedId(null)
                      }}
                      isUpdating={isUpdating}
                    />
                  )}

                  {(reconLayout === "dual" || reconLayout === "earth") && (
                    <AnalogMap
                      results={results}
                      selectedId={selectedResult?.candidate.id ?? null}
                      onSelect={setSelectedId}
                      isUpdating={isUpdating}
                    />
                  )}
                </div>

                {/* Candidate Roster List */}
                <CandidateList
                  results={results}
                  totalCandidates={data.totalCandidates}
                  selectedId={selectedResult?.candidate.id ?? null}
                  onSelect={setSelectedId}
                  isUpdating={isUpdating}
                />
              </div>

              {selectedResult && (
                <ComparisonPanel
                  target={data.target}
                  purpose={data.purpose}
                  result={selectedResult}
                  isUpdating={isUpdating}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
