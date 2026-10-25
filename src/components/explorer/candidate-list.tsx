"use client"

import { AlertTriangle, MapPin, CheckCircle, Flame, ShieldAlert, Sparkles } from "lucide-react"
import { PanelCard } from "@/components/shared/panel-card"
import { ScoreBar } from "@/components/shared/score-bar"
import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import { CONFIDENCE_LABELS, formatCoverage, formatScore } from "@/lib/terratwin/format"
import type { RankedCandidate } from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"

interface CandidateListProps {
  results: RankedCandidate[]
  totalCandidates: number
  selectedId: string | null
  onSelect: (id: string) => void
  isUpdating?: boolean
}

export function CandidateList({ results, totalCandidates, selectedId, onSelect, isUpdating }: CandidateListProps) {
  return (
    <PanelCard
      title="Ranked Earth Analogs"
      description={`${results.length} of ${totalCandidates} calibrated field sites`}
      actions={<IllustrativeBadge label="Vector similarity" />}
      isUpdating={isUpdating}
      bodyClassName="p-0"
    >
      <ol className="max-h-[30rem] divide-y divide-slate-800/80 overflow-y-auto">
        {results.map((result) => (
          <li key={result.candidate.id}>
            <CandidateRow result={result} selected={result.candidate.id === selectedId} onSelect={onSelect} />
          </li>
        ))}
      </ol>
    </PanelCard>
  )
}

function CandidateRow({
  result,
  selected,
  onSelect,
}: {
  result: RankedCandidate
  selected: boolean
  onSelect: (id: string) => void
}) {
  const hasMissing = result.missingFeatures.length > 0
  const isTopThree = result.rank <= 3

  return (
    <button
      type="button"
      onClick={() => onSelect(result.candidate.id)}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-start gap-3.5 px-4 py-3.5 text-left transition-all duration-150 cursor-pointer",
        selected
          ? "bg-cyan-950/40 border-l-4 border-l-cyan-400"
          : "hover:bg-slate-900/80 border-l-4 border-l-transparent",
      )}
    >
      {/* Rank Indicator */}
      <div className="flex flex-col items-center mt-0.5 shrink-0">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded font-mono text-xs font-bold transition-all",
            result.rank === 1 && "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]",
            result.rank === 2 && "bg-slate-300/20 text-slate-200 border border-slate-300/40",
            result.rank === 3 && "bg-orange-500/20 text-orange-300 border border-orange-500/40",
            result.rank > 3 && "bg-slate-900 border border-slate-800 text-slate-500",
            selected && "border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]",
          )}
        >
          #{String(result.rank).padStart(2, "0")}
        </span>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm font-semibold transition-colors", selected ? "text-cyan-300" : "text-white group-hover:text-cyan-200")}>
            {result.candidate.name}
          </span>
          <span
            className={cn(
              "font-mono text-xs font-bold tabular-nums px-2 py-0.5 rounded",
              result.score >= 80 ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30" :
              result.score >= 60 ? "bg-cyan-950/70 text-cyan-400 border border-cyan-500/30" :
              "bg-slate-900 text-slate-400 border border-slate-800"
            )}
          >
            {formatScore(result.score)}
          </span>
        </div>

        {/* Telemetry Score Progress Bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
          <div
            className={cn(
              "h-full transition-all duration-500",
              result.score >= 80 ? "bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_#34d399]" :
              result.score >= 60 ? "bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_#38bdf8]" :
              "bg-slate-600"
            )}
            style={{ width: `${Math.max(4, result.score)}%` }}
          />
        </div>

        {/* Location & Data Confidence Details */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
          <span className="flex items-center gap-1 truncate text-slate-400">
            <MapPin className="size-3 text-slate-500 shrink-0" />
            <span className="truncate">{result.candidate.country}</span>
          </span>

          <span className={cn("flex shrink-0 items-center gap-1", hasMissing ? "text-amber-400/90" : "text-emerald-400/90")}>
            {hasMissing ? (
              <AlertTriangle className="size-3" aria-hidden="true" />
            ) : (
              <CheckCircle className="size-3" aria-hidden="true" />
            )}
            <span>{hasMissing ? CONFIDENCE_LABELS[result.confidence] : "Complete"}</span>
            <span className="text-slate-600">·</span>
            <span>{formatCoverage(result.coverage)}</span>
          </span>
        </div>
      </div>
    </button>
  )
}
