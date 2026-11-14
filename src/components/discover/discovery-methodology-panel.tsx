"use client"

import { useState } from "react"
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react"

export function DiscoveryMethodologyPanel() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section
      aria-label="Scientific methodology disclosure"
      className="rounded-xl border border-slate-800 bg-slate-900/65 shadow-lg backdrop-blur-md overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-slate-800/40 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="size-4 text-cyan-400 shrink-0" aria-hidden="true" />
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400 block">
              METHODOLOGY & EVIDENCE DISCLOSURE
            </span>
            <h2 className="text-sm font-bold text-white">
              How TerraTwin Calculates Analog Similarity (40% Coverage Gate)
            </h2>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-slate-400 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4 text-slate-400 shrink-0" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-5 py-4 space-y-4 text-xs leading-relaxed text-slate-300">
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 list-decimal pl-5">
            <li>
              <strong>Retrieve live layers:</strong> Queries Open-Meteo Copernicus DEM GLO-90, NASA POWER Climatology v2.10.1 (2001–2025), and Macrostrat geologic polygons.
            </li>
            <li>
              <strong>Validate & normalize units:</strong> Enforces physical bounds, fill-value filtering (`-999` / `NaN` kept `null`), and explicit unit checks (`°C`, `W/m²` 24h mean, slope degrees).
            </li>
            <li>
              <strong>Compare compatible quantities:</strong> Computes normalized distance $d_i \in [0, 1]$ per comparable feature against the selected Moon or Mars target.
            </li>
            <li>
              <strong>Apply mission weights:</strong> Uses existing mission profile weights ($w_i \ge 0$, $\sum w_i = 1.0$) without modifying weights dynamically.
            </li>
            <li>
              <strong>Score over valid denominator:</strong> Evaluates only valid comparable features ($w_i$ sum $\ge 0.40$) rather than penalizing or filling missing sensors with zeroes.
            </li>
            <li>
              <strong>Gate low-evidence cells:</strong> Any cell with evidence coverage below <strong>40%</strong> (`MIN_RELIABLE_COVERAGE = 0.40`) is withheld with `score: null`.
            </li>
          </ol>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/75 p-3 font-mono text-[11px] space-y-1.5">
              <div className="text-cyan-400 font-bold">Implemented Scoring Formula (`similarity-engine.ts`)</div>
              <div className="text-white">
                D = sum(weight_i * difference_i) / sum(weight_i for valid comparable features)
              </div>
              <div className="text-emerald-300 font-bold">
                S = 100 * (1 - D)  [only when coverage &gt;= 40%]
              </div>
              <p className="font-sans text-[11px] text-slate-400 pt-1">
                Linear difference: d = min(1, |T − C| / tolerance). Logarithmic grain size: min(1, |log10(T) − log10(C)| / 2.0). Lithology distance: 0.0 exact match, 0.5 same petrological family, 1.0 divergent family.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/75 p-3 space-y-1.5">
              <div className="font-mono text-[11px] text-amber-300 font-bold">
                Resolution & Interpretation Safeguards
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                <li>
                  <strong>Spatial scale disparity:</strong> Copernicus GLO-90 elevation (90 m) and 5-point central-difference slope (~445 m baseline) are far finer than NASA POWER MERRA-2 (0.5° × 0.625°) and Macrostrat regional polygons (1:250k–1:5M).
                </li>
                <li>
                  <strong>Similarity vs. Coverage:</strong> Similarity measures agreement on available comparable variables; coverage measures the share of mission weight actually observed. Neither predicts operational mission success.
                </li>
                <li>
                  <strong>Unverified leads:</strong> A high live-scan score highlights a candidate lead for scientific review — not a NASA-endorsed or field-validated analog.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
