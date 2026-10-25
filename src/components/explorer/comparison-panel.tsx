import { PanelCard } from "@/components/shared/panel-card"
import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import { formatCoordinates, formatCoverage, formatScore } from "@/lib/terratwin/format"
import type { MissionPurposeDefinition, PlanetaryTarget, RankedCandidate } from "@/lib/terratwin/types"
import { FeatureComparisonTable } from "./feature-comparison-table"
import { FeatureSimilarityChart } from "./feature-similarity-chart"
import { MissingDataWarning } from "./missing-data-warning"

interface ComparisonPanelProps {
  target: PlanetaryTarget
  purpose: MissionPurposeDefinition
  result: RankedCandidate
  isUpdating?: boolean
}

export function ComparisonPanel({ target, purpose, result, isUpdating }: ComparisonPanelProps) {
  const { candidate } = result
  return (
    <PanelCard
      title="Environmental comparison"
      description={`${target.name} vs. ${candidate.name} · weighted for ${purpose.label.toLowerCase()}`}
      actions={<IllustrativeBadge />}
      isUpdating={isUpdating}
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs text-muted-foreground">
              Rank #{result.rank} · {formatCoordinates(candidate.latitude, candidate.longitude)} (approx.)
            </p>
            <h3 className="text-lg font-semibold">{candidate.name}</h3>
            <p className="text-sm text-muted-foreground">
              {candidate.setting} · {candidate.country}
            </p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{candidate.summary}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 self-start sm:w-56">
            <Stat label="Similarity" value={formatScore(result.score)} />
            <Stat label="Data coverage" value={formatCoverage(result.coverage)} />
          </dl>
        </div>

        <MissingDataWarning result={result} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <FeatureSimilarityChart featureScores={result.featureScores} />
          <div className="min-w-0 overflow-x-auto">
            <FeatureComparisonTable
              featureScores={result.featureScores}
              targetName={target.name}
              candidateName={candidate.name}
            />
          </div>
        </div>
      </div>
    </PanelCard>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xl tabular-nums">{value}</dd>
    </div>
  )
}
