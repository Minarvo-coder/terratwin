"use client"

import { ShieldCheck } from "lucide-react"
import { PanelCard } from "@/components/shared/panel-card"
import { formatCoverage, formatScore } from "@/lib/terratwin/format"
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
  const hasVerified = results.some((r) => r.candidate.isVerified)

  return (
    <PanelCard
      title="Ranked Earth Analogs"
      description={`${results.length} of ${totalCandidates} sites · select to compare`}
      actions={
        hasVerified ? (
          <span className="inline-flex items-center gap-1 rounded-[var(--tt-radius-pill)] border border-[var(--tt-success)]/30 bg-[var(--tt-success)]/10 px-2 py-0.5 font-mono text-[10px] text-[var(--tt-success)]">
            <ShieldCheck className="size-3" aria-hidden="true" />
            <span>PDS</span>
          </span>
        ) : null
      }
      isUpdating={isUpdating}
      bodyClassName="flex flex-col justify-between p-0"
    >
      <ol className="max-h-[32rem] divide-y divide-[var(--tt-dark-border)] overflow-y-auto">
        {results.map((result) => (
          <li key={result.candidate.id}>
            <CandidateRow result={result} selected={result.candidate.id === selectedId} onSelect={onSelect} />
          </li>
        ))}
      </ol>

      <div className="border-t border-[var(--tt-dark-border)] px-4 py-3 text-[11px] leading-relaxed text-[var(--tt-dark-ink-muted)]">
        Similarity reflects your mission weights. Coverage is shown separately.
      </div>
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
  const isReliable = result.isReliable && result.score !== null

  return (
    <button
      type="button"
      onClick={() => onSelect(result.candidate.id)}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-start justify-between gap-3 border-l-2 px-4 py-3.5 text-left transition-colors duration-[var(--tt-duration)] cursor-pointer",
        selected
          ? "border-l-[var(--tt-accent)] bg-[var(--tt-dark-elevated)]"
          : "border-l-transparent hover:bg-[var(--tt-dark-card)]",
      )}
    >
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="tt-mono-data shrink-0 text-[11px] text-[var(--tt-dark-ink-muted)]">
          {String(result.rank).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-xs font-semibold transition-colors",
              selected ? "text-[var(--tt-dark-ink)]" : "text-[var(--tt-dark-ink)] group-hover:text-white",
            )}
          >
            {result.candidate.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--tt-dark-ink-secondary)]">{result.candidate.country}</p>
          <p className="mt-0.5 text-[10px] text-[var(--tt-dark-ink-muted)]">
            {formatCoverage(result.coverage)} coverage &middot; {result.candidate.isVerified ? "verified" : "sample"}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {isReliable ? (
          <span
            className={cn(
              "tt-mono-data text-xs font-semibold",
              result.score! >= 75
                ? "text-[var(--tt-dark-periwinkle)]"
                : result.score! >= 55
                  ? "text-[var(--tt-match-moderate)]"
                  : "text-[var(--tt-match-low)]",
            )}
          >
            {formatScore(result.score)}
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase text-[var(--tt-match-low)]">Deficit</span>
        )}
      </div>
    </button>
  )
}
