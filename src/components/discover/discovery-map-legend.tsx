"use client"

import { VISUAL_TIER_STYLES } from "@/lib/terratwin/scanner/scanner-utils"

export function DiscoveryMapLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-800/90 bg-slate-950/90 px-3 py-2 text-[11px] font-mono text-slate-300"
      aria-label="Map symbol and scientific evidence legend"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Legend:
      </span>

      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-3 rounded-[2px] border border-dashed border-cyan-300 bg-cyan-500/15"
          aria-hidden="true"
        />
        <span>Active scan region</span>
      </span>

      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-3 rounded-[2px] border"
          style={{
            backgroundColor: VISUAL_TIER_STYLES["high-similarity"].fillColor,
            borderColor: VISUAL_TIER_STYLES["high-similarity"].strokeColor,
          }}
          aria-hidden="true"
        />
        <span>High (≥70%)</span>
      </span>

      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-3 rounded-[2px] border"
          style={{
            backgroundColor: VISUAL_TIER_STYLES["moderate-similarity"].fillColor,
            borderColor: VISUAL_TIER_STYLES["moderate-similarity"].strokeColor,
          }}
          aria-hidden="true"
        />
        <span>Moderate (45–69%)</span>
      </span>

      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-3 rounded-[2px] border"
          style={{
            backgroundColor: VISUAL_TIER_STYLES["low-similarity"].fillColor,
            borderColor: VISUAL_TIER_STYLES["low-similarity"].strokeColor,
          }}
          aria-hidden="true"
        />
        <span>Low (&lt;45%)</span>
      </span>

      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-3 rounded-[2px] border border-dashed border-slate-400 bg-slate-700/50"
          aria-hidden="true"
        />
        <span>Insufficient data (&lt;40% cov, no score)</span>
      </span>

      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-3 rounded-[2px] border-2 border-white bg-transparent"
          aria-hidden="true"
        />
        <span>Selected cell</span>
      </span>

      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-2.5 rounded-full border-2 border-amber-300 bg-amber-500"
          aria-hidden="true"
        />
        <span>Canonical Atlas (8)</span>
      </span>

      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block size-2.5 rounded-full border-2 border-purple-300 bg-purple-500"
          aria-hidden="true"
        />
        <span>Under-Explored Atlas (23)</span>
      </span>
    </div>
  )
}
