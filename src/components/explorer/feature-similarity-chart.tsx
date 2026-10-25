"use client"

import { FEATURE_MAP } from "@/lib/terratwin/features"
import { formatFeatureValue } from "@/lib/terratwin/format"
import type { FeatureScore } from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"

export function FeatureSimilarityChart({ featureScores }: { featureScores: FeatureScore[] }) {
  // Only show active features assigned a weight in current mission purpose
  const activeFeatures = featureScores.filter((f) => f.weight > 0)

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400">
        <span>MISSION PARAMETER & WEIGHT</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-cyan-400" />
            <span>0–100% SIMILARITY</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="size-2 rounded-sm border border-amber-400 border-dashed" />
            <span>NO DATA</span>
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="size-2 rounded-sm bg-purple-950 border border-purple-500/40" />
            <span>EXCLUDED</span>
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {activeFeatures.map((item) => {
          const feature = FEATURE_MAP[item.key]
          const isComparable = item.status === "comparable" && item.similarity !== null
          const isMissing = item.status === "missing_data"
          const isIncompatible = item.status === "incompatible_quantities" || item.status === "incompatible_units"
          const percent = isComparable ? Math.round((item.similarity ?? 0) * 100) : 0

          return (
            <div
              key={item.key}
              className="group relative flex flex-col gap-1 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 transition hover:border-slate-700 hover:bg-slate-900/60"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{feature.label}</span>
                  <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-slate-400">
                    wt: {item.weight.toFixed(1)}
                  </span>
                </div>

                <div>
                  {isComparable && (
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        percent >= 70 ? "text-cyan-400" : percent >= 40 ? "text-amber-400" : "text-rose-400",
                      )}
                    >
                      {percent}%
                    </span>
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

              {/* Visual Scale Track (0 to 100) */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                {isComparable && (
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      percent >= 70
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_#38bdf8]"
                        : percent >= 40
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                        : "bg-gradient-to-r from-rose-500 to-red-500",
                    )}
                    style={{ width: `${percent}%` }}
                  />
                )}
                {isMissing && (
                  <div className="h-full w-full bg-[repeating-linear-gradient(45deg,rgba(245,158,11,0.15),rgba(245,158,11,0.15)_6px,transparent_6px,transparent_12px)]" />
                )}
                {isIncompatible && (
                  <div className="h-full w-full bg-[repeating-linear-gradient(45deg,rgba(168,85,247,0.15),rgba(168,85,247,0.15)_6px,transparent_6px,transparent_12px)]" />
                )}
              </div>

              {/* Context telemetry brief on hover or mobile */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span className="truncate">
                  Target: <strong className="text-slate-200">{formatFeatureValue(item.key, item.targetValue)}</strong>
                </span>
                <span className="truncate">
                  Candidate:{" "}
                  <strong className={cn(item.candidateValue === null ? "text-amber-400" : "text-slate-200")}>
                    {formatFeatureValue(item.key, item.candidateValue)}
                  </strong>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
