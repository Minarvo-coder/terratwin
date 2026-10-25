import { AlertTriangle } from "lucide-react"
import { FEATURE_MAP } from "@/lib/terratwin/features"
import { CONFIDENCE_LABELS, formatCoverage } from "@/lib/terratwin/format"
import type { RankedCandidate } from "@/lib/terratwin/types"

export function MissingDataWarning({ result }: { result: RankedCandidate }) {
  if (result.missingFeatures.length === 0) return null

  return (
    <div role="alert" className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="font-medium text-warning">
          {CONFIDENCE_LABELS[result.confidence]} — {formatCoverage(result.coverage)} of mission weight has data
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Missing: {result.missingFeatures.map((key) => FEATURE_MAP[key].label.toLowerCase()).join(", ")}. The score is
          computed only from available features and may be over- or under-stated.
        </p>
      </div>
    </div>
  )
}
