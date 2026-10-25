"use client"

import { useState } from "react"
import { FEATURE_MAP } from "@/lib/terratwin/features"
import { formatFeatureValue } from "@/lib/terratwin/format"
import type { FeatureScore } from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react"

interface FeatureComparisonTableProps {
  featureScores: FeatureScore[]
  targetName: string
  candidateName: string
}

export function FeatureComparisonTable({ featureScores, targetName, candidateName }: FeatureComparisonTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  function toggleExpand(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key))
  }

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Header bar */}
      <div className="hidden sm:grid grid-cols-12 gap-2 border-b border-slate-800 pb-2 text-[10px] uppercase text-slate-400 font-semibold">
        <div className="col-span-4">Attribute & Mission Weight</div>
        <div className="col-span-3">Target ({targetName.split(" ")[0]})</div>
        <div className="col-span-3">Candidate ({candidateName.split(" ")[0]})</div>
        <div className="col-span-2 text-right">Similarity</div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {featureScores.map((item) => {
          const feature = FEATURE_MAP[item.key]
          const isComparable = item.status === "comparable" && item.similarity !== null
          const isMissing = item.status === "missing_data"
          const isIncompatible = item.status === "incompatible_quantities" || item.status === "incompatible_units"
          const isExpanded = expandedKey === item.key

          const targetProv = item.targetProvenance
          const candProv = item.candidateProvenance
          const hasVerifiedSource = targetProv?.status === "verified" || candProv?.status === "verified"

          return (
            <div
              key={item.key}
              className={cn(
                "rounded-lg border transition-all duration-150 backdrop-blur-sm",
                isExpanded ? "border-cyan-500/40 bg-slate-900/80 shadow-[0_0_15px_rgba(56,189,248,0.1)]" : "border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50",
              )}
            >
              {/* Main responsive row */}
              <div
                onClick={() => toggleExpand(item.key)}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 cursor-pointer items-center"
              >
                {/* 1. Feature Name & Weight */}
                <div className="col-span-1 sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="text-slate-400 hover:text-cyan-400 transition"
                    >
                      {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>
                    <span className="font-semibold text-white truncate">{feature.label}</span>
                  </div>
                  <span className="rounded bg-slate-800/90 border border-slate-700/60 px-1.5 py-0.2 text-[10px] text-slate-400 shrink-0">
                    wt: {item.weight.toFixed(1)}
                  </span>
                </div>

                {/* 2. Target Value */}
                <div className="col-span-1 sm:col-span-3 flex sm:flex-col justify-between sm:justify-center text-[11px]">
                  <span className="sm:hidden text-slate-400 text-[10px]">Target:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">
                      {formatFeatureValue(item.key, item.targetValue)}
                    </span>
                    {targetProv?.status === "verified" && (
                      <span className="rounded bg-emerald-950/60 border border-emerald-500/40 px-1 text-[8px] text-emerald-300">
                        PDS
                      </span>
                    )}
                    {targetProv?.status === "illustrative" && item.targetValue !== null && (
                      <span className="rounded bg-amber-950/40 border border-amber-500/30 px-1 text-[8px] text-amber-300">
                        DEMO
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Candidate Value */}
                <div className="col-span-1 sm:col-span-3 flex sm:flex-col justify-between sm:justify-center text-[11px]">
                  <span className="sm:hidden text-slate-400 text-[10px]">Earth:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "font-semibold",
                        item.candidateValue === null ? "text-amber-400" : "text-slate-200",
                      )}
                    >
                      {formatFeatureValue(item.key, item.candidateValue)}
                    </span>
                    {candProv?.status === "verified" && (
                      <span className="rounded bg-emerald-950/60 border border-emerald-500/40 px-1 text-[8px] text-emerald-300">
                        NASA
                      </span>
                    )}
                    {candProv?.status === "illustrative" && item.candidateValue !== null && (
                      <span className="rounded bg-amber-950/40 border border-amber-500/30 px-1 text-[8px] text-amber-300">
                        DEMO
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Similarity Score / Status */}
                <div className="col-span-1 sm:col-span-2 flex sm:justify-end items-center justify-between text-right text-[11px]">
                  <span className="sm:hidden text-slate-400 text-[10px]">Match:</span>
                  {isComparable && (
                    <span
                      className={cn(
                        "font-bold tabular-nums text-xs px-2 py-0.5 rounded",
                        Math.round((item.similarity ?? 0) * 100) >= 70
                          ? "text-cyan-300 bg-cyan-950/60 border border-cyan-500/30"
                          : Math.round((item.similarity ?? 0) * 100) >= 40
                          ? "text-amber-300 bg-amber-950/60 border border-amber-500/30"
                          : "text-rose-300 bg-rose-950/60 border border-rose-500/30",
                      )}
                    >
                      {Math.round((item.similarity ?? 0) * 100)}%
                    </span>
                  )}
                  {isMissing && (
                    <span className="rounded bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                      NO DATA
                    </span>
                  )}
                  {isIncompatible && (
                    <span className="rounded bg-purple-950/60 border border-purple-500/40 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                      EXCLUDED
                    </span>
                  )}
                </div>
              </div>

              {/* Expandable provenance and mathematical documentation */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-900/60 p-3.5 flex flex-col gap-2.5 text-[11px] leading-relaxed">
                  <div className="text-slate-300">
                    <strong className="text-white">Scientific Description:</strong> {feature.description}
                  </div>

                  {feature.tolerance && (
                    <div className="text-slate-400 text-[10px]">
                      <span className="text-cyan-400">Tolerance model:</span> {feature.kind} normalization with tolerance threshold of{" "}
                      <strong className="text-white">
                        {feature.tolerance} {feature.unit}
                      </strong>.
                    </div>
                  )}

                  {/* Status explanation */}
                  {item.statusReason && (
                    <div className="rounded bg-slate-950 border border-slate-800 p-2 text-slate-400 text-[10px]">
                      <span className="text-amber-300 font-semibold">Evaluation Note:</span> {item.statusReason}
                    </div>
                  )}

                  {/* Verified Provenance links if available */}
                  {hasVerifiedSource && (
                    <div className="grid gap-2 sm:grid-cols-2 pt-1 border-t border-slate-800/60">
                      {targetProv?.status === "verified" && (
                        <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2 text-[10px]">
                          <div className="font-semibold text-emerald-300 mb-1 flex items-center justify-between">
                            <span>TARGET SOURCE: {targetProv.sourceTitle}</span>
                            {targetProv.sourceUrl && (
                              <a
                                href={targetProv.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-cyan-400 hover:underline"
                              >
                                <span>PDS</span>
                                <ExternalLink className="size-2.5" />
                              </a>
                            )}
                          </div>
                          {targetProv.datasetVersion && <div>Version: {targetProv.datasetVersion}</div>}
                          {targetProv.spatialResolution && <div>Resolution: {targetProv.spatialResolution}</div>}
                          {targetProv.qualityNotes && <div className="text-slate-400 mt-1">{targetProv.qualityNotes}</div>}
                        </div>
                      )}

                      {candProv?.status === "verified" && (
                        <div className="rounded border border-emerald-500/30 bg-emerald-950/20 p-2 text-[10px]">
                          <div className="font-semibold text-emerald-300 mb-1 flex items-center justify-between">
                            <span>CANDIDATE SOURCE: {candProv.sourceTitle}</span>
                            {candProv.sourceUrl && (
                              <a
                                href={candProv.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-cyan-400 hover:underline"
                              >
                                <span>NASA API</span>
                                <ExternalLink className="size-2.5" />
                              </a>
                            )}
                          </div>
                          {candProv.datasetVersion && <div>Version: {candProv.datasetVersion}</div>}
                          {candProv.spatialResolution && <div>Resolution: {candProv.spatialResolution}</div>}
                          {candProv.qualityNotes && <div className="text-slate-400 mt-1">{candProv.qualityNotes}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {targetProv?.status === "illustrative" && (
                    <div className="rounded bg-amber-950/20 border border-amber-500/20 p-2 text-[10px] text-amber-300/80">
                      Illustrative placeholder value. Sourced from the local prototype demonstration catalog to exercise the UI interface. Not verified planetary evidence.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
