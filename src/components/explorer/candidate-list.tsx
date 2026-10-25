"use client"

import { AlertTriangle } from "lucide-react"
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
      title="Ranked candidates"
      description={`${results.length} of ${totalCandidates} sample sites shown`}
      actions={<IllustrativeBadge label="Sample scores" />}
      isUpdating={isUpdating}
      bodyClassName="p-0"
    >
      <ol className="max-h-[28rem] divide-y divide-border overflow-y-auto">
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
  return (
    <button
      type="button"
      onClick={() => onSelect(result.candidate.id)}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
        selected && "bg-primary/10 hover:bg-primary/10",
      )}
    >
      <span
        className={cn(
          "mt-0.5 w-6 shrink-0 font-mono text-xs tabular-nums text-muted-foreground",
          selected && "text-primary",
        )}
      >
        {String(result.rank).padStart(2, "0")}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{result.candidate.name}</span>
          <span className="font-mono text-sm tabular-nums">{formatScore(result.score)}</span>
        </span>
        <ScoreBar value={result.score} label={`Illustrative similarity score for ${result.candidate.name}`} />
        <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{result.candidate.country}</span>
          <span className={cn("flex shrink-0 items-center gap-1", hasMissing && "text-warning")}>
            {hasMissing && <AlertTriangle className="size-3" aria-hidden="true" />}
            {hasMissing ? CONFIDENCE_LABELS[result.confidence] : "Complete data"} · {formatCoverage(result.coverage)}
          </span>
        </span>
      </span>
    </button>
  )
}
