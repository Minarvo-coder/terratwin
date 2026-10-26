import { AlertTriangle, ShieldAlert } from "lucide-react"
import { FEATURE_MAP } from "@/lib/terratwin/features"
import { CONFIDENCE_LABELS, formatCoverage } from "@/lib/terratwin/format"
import type { RankedCandidate } from "@/lib/terratwin/types"

export function MissingDataWarning({ result }: { result: RankedCandidate }) {
  const hasMissing = result.missingFeatures.length > 0
  const hasIncompatible = result.incompatibleFeatures.length > 0
  const isInsufficient = !result.isReliable

  if (!hasMissing && !isInsufficient) return null

  // Insufficient data (< 40% mission weight)
  if (isInsufficient) {
    return (
      <div
        role="alert"
        className="flex gap-3 rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs font-mono backdrop-blur-md"
      >
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rose-400" aria-hidden="true" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-300 uppercase tracking-wider">
              {CONFIDENCE_LABELS.insufficient}
            </span>
            <span className="rounded bg-rose-900/60 border border-rose-500/30 px-1.5 py-0.5 text-[10px] text-rose-200">
              {formatCoverage(result.coverage)} VALID COVERAGE
            </span>
          </div>
          <p className="leading-relaxed text-slate-300">
            Only <strong className="text-white">{formatCoverage(result.coverage)}</strong> of the weighted mission requirements have valid, comparable telemetry on both sides. A numerical ranking has been suppressed to prevent misleading candidate prioritization.
          </p>
          {hasMissing && (
            <p className="text-[11px] text-slate-400">
              <span className="text-rose-300 font-semibold">Missing parameters:</span>{" "}
              {result.missingFeatures.map((key) => FEATURE_MAP[key]?.label ?? key).join(", ")}.
            </p>
          )}
          {hasIncompatible && (
            <p className="text-[11px] text-amber-300/80">
              <span className="font-semibold">Excluded for cross-body incomparability:</span>{" "}
              {result.incompatibleFeatures.map((key) => FEATURE_MAP[key]?.label ?? key).join(", ")}.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Partial / High confidence with some missing features
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs font-mono backdrop-blur-md"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-300 uppercase tracking-wider">
            {CONFIDENCE_LABELS[result.confidence]} — {formatCoverage(result.coverage)} of mission weight has valid data
          </span>
        </div>
        <p className="leading-relaxed text-slate-300">
          The match fidelity score is computed strictly from the available, comparable features ({formatCoverage(result.coverage)} of total mission requirements). Missing features are excluded from the denominator rather than silently treated as zero.
        </p>
        {hasMissing && (
          <p className="text-[11px] text-slate-400">
            <span className="text-amber-300 font-medium">Missing:</span>{" "}
            {result.missingFeatures.map((key) => FEATURE_MAP[key]?.label ?? key).join(", ")}.
          </p>
        )}
        {hasIncompatible && (
          <p className="text-[11px] text-amber-400/80">
            <span className="font-medium">Scientifically non-comparable:</span>{" "}
            {result.incompatibleFeatures.map((key) => FEATURE_MAP[key]?.label ?? key).join(", ")}.
          </p>
        )}
      </div>
    </div>
  )
}
