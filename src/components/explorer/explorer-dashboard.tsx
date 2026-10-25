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
import { ShieldCheck, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_MIN_SCORE = 0

interface ExplorerDashboardProps {
  targets: PlanetaryTarget[]
  simulate?: string
}

export function ExplorerDashboard({ targets, simulate }: ExplorerDashboardProps) {
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
    return true
  })

  const { data, error, isLoading, isValidating, mutate } = useAnalogs({
    targetId,
    purposeId,
    minScore,
    simulate,
    mode: sourceFilter,
  })

  const selectedTarget = targets.find((target) => target.id === targetId) ?? data?.target
  const results = data?.results ?? []
  const selectedResult = results.find((result) => result.candidate.id === selectedId) ?? results[0]
  const isUpdating = isValidating && !isLoading

  function handleBodyChange(nextBody: PlanetaryBody) {
    setBody(nextBody)
    const matching = filteredTargets.filter((t) => t.body === nextBody)
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
          {error ? (
            <ExplorerError message={error.message} onRetry={() => mutate()} />
          ) : isLoading || !data ? (
            <ExplorerLoading />
          ) : results.length === 0 ? (
            <ExplorerEmpty minScore={data.minScore} onReset={() => setMinScore(DEFAULT_MIN_SCORE)} />
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
                <AnalogMap
                  results={results}
                  selectedId={selectedResult?.candidate.id ?? null}
                  onSelect={setSelectedId}
                  isUpdating={isUpdating}
                />
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
