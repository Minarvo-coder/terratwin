import { PanelCard } from "@/components/shared/panel-card"
import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import { formatCoordinates, formatCoverage, formatScore } from "@/lib/terratwin/format"
import type { MissionPurposeDefinition, PlanetaryTarget, RankedCandidate } from "@/lib/terratwin/types"
import { FeatureComparisonTable } from "./feature-comparison-table"
import { FeatureSimilarityChart } from "./feature-similarity-chart"
import { MissingDataWarning } from "./missing-data-warning"
import { Compass, ShieldCheck, Terminal, Activity } from "lucide-react"

interface ComparisonPanelProps {
  target: PlanetaryTarget
  purpose: MissionPurposeDefinition
  result: RankedCandidate
  isUpdating?: boolean
}

export function ComparisonPanel({ target, purpose, result, isUpdating }: ComparisonPanelProps) {
  const { candidate } = result
  const isVerified = target.isVerified || candidate.isVerified

  return (
    <PanelCard
      title="Dimensional Telemetry Analysis"
      description={`${target.name} (${target.body.toUpperCase()}) vs. ${candidate.name} (EARTH) · Calibrated for ${purpose.label.toLowerCase()}`}
      actions={
        isVerified ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-300">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>NASA / PDS VERIFIED</span>
          </span>
        ) : (
          <IllustrativeBadge label="Illustrative demo data — not scientific evidence" />
        )
      }
      isUpdating={isUpdating}
    >
      <div className="flex flex-col gap-6">
        {/* Header telemetry brief */}
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] border-b border-slate-800 pb-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400">
              <span className="rounded bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-cyan-300 font-bold">
                RANK #{result.rank}
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Compass className="size-3 text-cyan-400" />
                {formatCoordinates(candidate.latitude, candidate.longitude)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 uppercase tracking-wider">{candidate.setting}</span>
              {candidate.isVerified && (
                <span className="rounded border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.2 text-[10px] text-emerald-300 font-semibold">
                  LIVE DB
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>{candidate.name}</span>
              <span className="font-mono text-xs font-normal text-slate-400 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5">
                {candidate.country}
              </span>
            </h3>

            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
              {candidate.summary}
            </p>
          </div>

          {/* Quick Telemetry Stats */}
          <div className="grid grid-cols-2 gap-3 self-start font-mono sm:w-64">
            <div className="relative rounded-lg border border-cyan-500/30 bg-slate-900/80 p-3 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
              <dt className="text-[10px] uppercase tracking-wider text-slate-400">MATCH FIDELITY</dt>
              {result.isReliable && result.score !== null ? (
                <dd className="mt-1 text-2xl font-bold tabular-nums text-cyan-300">
                  {formatScore(result.score)}
                </dd>
              ) : (
                <dd className="mt-1.5 text-xs font-bold text-rose-400 leading-tight">
                  INSUFFICIENT DATA
                </dd>
              )}
              <div className="mt-1 text-[9px] text-slate-500 truncate">
                {result.isReliable ? "Weighted comparable features" : "Coverage below 40% threshold"}
              </div>
            </div>

            <div className="relative rounded-lg border border-purple-500/30 bg-slate-900/80 p-3 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <dt className="text-[10px] uppercase tracking-wider text-slate-400">MISSION COVERAGE</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-purple-300">
                {formatCoverage(result.coverage)}
              </dd>
              <div className="mt-1 text-[9px] text-slate-500 truncate">
                {result.isReliable ? "Sufficient mission telemetry" : "Critical data deficit"}
              </div>
            </div>
          </div>
        </div>

        <MissingDataWarning result={result} />

        {/* Multi-Dimensional Charts & Detailed Attribute Table */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-4 font-mono text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Activity className="size-3.5" />
                SIMILARITY BY MISSION PARAMETER
              </span>
              <span className="text-[10px] text-slate-500">DYNAMIC WEIGHTED CALIBRATION</span>
            </div>
            <FeatureSimilarityChart featureScores={result.featureScores} />
          </div>

          <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-4 font-mono text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <Terminal className="size-3.5 text-purple-400" />
                ATTRIBUTIVE VALUE MATRIX
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold">INTERACTIVE PROVENANCE</span>
            </div>
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
