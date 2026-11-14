"use client"

import { useState } from "react"
import { PanelCard } from "@/components/shared/panel-card"
import { usePortfolio } from "@/hooks/use-portfolio"
import { formatCoverage, formatFeatureValue, formatScore, getFeatureComparabilityInfo } from "@/lib/terratwin/format"
import type { PlanetaryTarget } from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"
import {
  Award,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react"

interface MissionSuitePanelProps {
  target: PlanetaryTarget
  purposeId: string
  isVerified?: boolean
}

export function MissionSuitePanel({ target, purposeId, isVerified }: MissionSuitePanelProps) {
  const [portfolioSize, setPortfolioSize] = useState<number>(2)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)

  const { data, error, isLoading, isValidating, mutate } = usePortfolio({
    targetId: target.id,
    purposeId,
    portfolioSize,
    limit: 6,
    enabled: true,
  })

  const portfolios = data?.portfolios ?? []
  const selectedPortfolio =
    portfolios.find((p) => p.id === selectedPortfolioId) ?? portfolios[0]

  const bestSingle = data?.bestSingleCandidate
  const topPortfolio = portfolios[0]

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* 1. Header Deck & Portfolio Size Controller */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-950/60 px-2.5 py-0.5 text-sky-300 font-semibold">
                <Layers className="size-3.5 text-sky-400" />
                <span>Mission Suite Portfolio Optimizer</span>
              </span>
              <span className="rounded bg-slate-800 border border-slate-700/80 px-2 py-0.5 text-[11px] text-slate-400">
                Combinatorial Feature Coverage
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[11px] text-emerald-300 font-medium">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  <span>NASA PDS Verified</span>
                </span>
              )}
            </div>

            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed mt-1">
              No single Earth location replicates all planetary dimensions simultaneously. The Mission Suite
              engine evaluates complementary multi-site portfolios to maximize cumulative scientific coverage for{" "}
              <strong className="text-white">{target.name}</strong>.
            </p>
          </div>

          {/* Size Selector & Compute Button */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center text-xs">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setPortfolioSize(2)
                  setSelectedPortfolioId(null)
                }}
                className={cn(
                  "rounded px-3 py-1.5 transition cursor-pointer font-medium flex items-center gap-1.5",
                  portfolioSize === 2
                    ? "bg-slate-800 text-sky-300 border border-slate-700"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <span>Pair (2 Sites)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortfolioSize(3)
                  setSelectedPortfolioId(null)
                }}
                className={cn(
                  "rounded px-3 py-1.5 transition cursor-pointer font-medium flex items-center gap-1.5",
                  portfolioSize === 3
                    ? "bg-slate-800 text-purple-300 border border-slate-700"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <span>Trio (3 Sites)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => mutate()}
              disabled={isLoading || isValidating}
              className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-950/60 px-3.5 py-2 font-medium text-sky-200 transition hover:bg-sky-900/40 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", (isLoading || isValidating) && "animate-spin")} />
              <span>Recompute Suites</span>
            </button>
          </div>
        </div>

        {/* 2. Benchmark Comparison Hero (Single Site vs. Optimal Portfolio) */}
        {topPortfolio && bestSingle && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 border-t border-slate-800/80 pt-5">
            {/* Left Box: Best Single Site Benchmark */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium">Single Best Analog</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">Benchmark</span>
                </div>
                <h4 className="text-base font-semibold text-white mt-1">{bestSingle.name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Match Fidelity</div>
                  <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">{formatScore(bestSingle.score)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Data Coverage</div>
                  <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">{formatCoverage(bestSingle.coverage)}</div>
                </div>
              </div>
            </div>

            {/* Middle Indicator: Synergy Delta */}
            <div className="hidden lg:flex flex-col items-center justify-center lg:col-span-2 text-center">
              <div className="flex size-10 items-center justify-center rounded-full border border-sky-500/40 bg-sky-950/60 text-sky-300">
                <Zap className="size-5" />
              </div>
              <div className="text-xs font-bold text-sky-300 mt-2 font-mono">
                {topPortfolio.synergyGain !== null && topPortfolio.synergyGain > 0 ? (
                  <span>+{topPortfolio.synergyGain.toFixed(1)}%</span>
                ) : (
                  <span>Expanded</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">Synergy Gain</div>
            </div>

            {/* Right Box: Optimal Mission Suite */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-sky-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-sky-400" />
                    <span>Optimal Mission Suite</span>
                  </span>
                  <span className="rounded bg-sky-950/80 border border-sky-500/30 px-1.5 py-0.5 text-[10px] text-sky-300 font-mono">
                    Rank #1
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white mt-1 leading-snug">
                  {topPortfolio.candidates.map((c) => c.name).join(" + ")}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Composite Fidelity</div>
                  <div className="text-lg font-bold text-sky-300 mt-0.5 font-mono">{formatScore(topPortfolio.score)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Combined Coverage</div>
                  <div className="text-lg font-bold text-purple-300 mt-0.5 font-mono">{formatCoverage(topPortfolio.coverage)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Ranked Portfolios Selection Bar */}
      {isLoading ? (
        <div className="h-44 w-full rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse flex items-center justify-center font-mono text-xs text-slate-400">
          Calculating combinatorial analog permutations...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-6 font-mono text-xs text-rose-300">
          <p className="font-bold uppercase tracking-wider">Optimization Error</p>
          <p className="mt-1 text-slate-400">{error.message}</p>
        </div>
      ) : portfolios.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center font-mono text-xs text-slate-400">
          No valid candidate combinations found for this target and mission profile.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between font-mono text-xs text-slate-400 px-1">
              <span className="uppercase tracking-wider font-semibold">
                Ranked Multi-Site Portfolios ({portfolios.length} Suites Evaluated)
              </span>
              <span>Click a suite to inspect telemetry attribution</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {portfolios.map((portfolio) => {
                const isSelected = selectedPortfolio?.id === portfolio.id
                return (
                  <div
                    key={portfolio.id}
                    onClick={() => setSelectedPortfolioId(portfolio.id)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between gap-3",
                      isSelected
                        ? "border-sky-500 bg-slate-900/95"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/70",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="rounded bg-sky-950/80 border border-sky-500/30 px-2 py-0.5 text-sky-300 font-mono font-bold text-[11px]">
                          Rank #{portfolio.rank}
                        </span>
                        {portfolio.synergyGain !== null && portfolio.synergyGain > 0 && (
                          <span className="rounded bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] text-emerald-300 font-medium font-mono">
                            +{portfolio.synergyGain.toFixed(1)}% vs. single
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col gap-1">
                        {portfolio.candidates.map((cand) => (
                          <div key={cand.id} className="flex items-center gap-2 text-sm font-medium text-white">
                            <span className="size-1.5 rounded-full bg-sky-400" />
                            <span className="truncate">{cand.name}</span>
                            <span className="text-xs text-slate-400 ml-auto shrink-0">
                              {cand.country}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Composite Match</div>
                        <div className="text-base font-bold text-sky-300 font-mono">{formatScore(portfolio.score)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Coverage</div>
                        <div className="text-base font-bold text-purple-300 font-mono">{formatCoverage(portfolio.coverage)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. Active Portfolio Deep Dive: Flight Director Brief & Attribution Matrix */}
          {selectedPortfolio && (
            <div className="flex flex-col gap-6">
              {/* Scientific Brief Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-xs leading-relaxed">
                <div className="flex items-center gap-2 text-sky-300 font-semibold mb-2">
                  <Terminal className="size-4 text-sky-400" />
                  <span>Portfolio Scientific Brief</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans text-sm">
                  {selectedPortfolio.scientificExplanation}
                </p>
              </div>

              {/* Parameter Attribution Matrix */}
              <PanelCard
                title="Parameter Attribution & Feature Complementarity Matrix"
                description={`Analysis of which Earth location champions each environmental requirement for ${target.name}.`}
                actions={
                  <span className="text-xs text-sky-300 font-medium flex items-center gap-1.5">
                    <Award className="size-3.5 text-sky-400" />
                    <span>Analog Allocation</span>
                  </span>
                }
              >
                <div className="flex flex-col gap-3 font-sans text-xs">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 border-b border-slate-800 pb-2 text-[11px] font-medium text-slate-400">
                    <div className="col-span-4">Mission Parameter & Weight</div>
                    <div className="col-span-2">Target Value</div>
                    <div className="col-span-4">Portfolio Champion Site</div>
                    <div className="col-span-2 text-right">Feature Match</div>
                  </div>

                  {/* Feature Rows */}
                  <div className="flex flex-col gap-2">
                    {selectedPortfolio.attributions
                      .filter((attr) => attr.weight > 0)
                      .map((attr) => {
                        const compInfo = getFeatureComparabilityInfo(attr.featureKey)
                        const isComparable = attr.status === "comparable" && attr.bestSimilarity !== null
                        const isMissing = attr.status === "missing_data"
                        const isIncompatible = attr.status === "incompatible_quantities"

                        return (
                          <div
                            key={attr.featureKey}
                            className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 transition hover:border-slate-700"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              {/* 1. Feature Name, Weight & Comparability Classification */}
                              <div className="col-span-1 sm:col-span-4 flex flex-wrap items-center justify-between sm:justify-start gap-1.5">
                                <span className="font-semibold text-white text-xs">{attr.featureLabel}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span
                                    title={compInfo.rationale}
                                    className={cn(
                                      "rounded px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider shrink-0",
                                      compInfo.badgeVariant === "emerald" && "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300",
                                      compInfo.badgeVariant === "amber" && "bg-amber-950/60 border border-amber-500/40 text-amber-300",
                                      compInfo.badgeVariant === "purple" && "bg-purple-950/60 border border-purple-500/40 text-purple-300",
                                      compInfo.badgeVariant === "rose" && "bg-rose-950/70 border border-rose-500/50 text-rose-300"
                                    )}
                                  >
                                    {compInfo.classification === "DIRECTLY_COMPARABLE" ? "Direct" :
                                     compInfo.classification === "COMPARABLE_AFTER_TRANSFORMATION" ? "Transformed" :
                                     compInfo.classification === "PROXY_BASED" ? "Proxy" :
                                     "Incomparable"}
                                  </span>
                                  <span className="rounded bg-slate-800/90 border border-slate-700/60 px-1.5 py-0.2 text-[9px] text-slate-400 font-mono shrink-0">
                                    wt: {attr.weight.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* 2. Target Value */}
                              <div className="col-span-1 sm:col-span-2 flex sm:flex-col justify-between sm:justify-center text-[11px]">
                                <span className="sm:hidden text-slate-400 text-[10px]">Target:</span>
                                <span className="font-semibold text-cyan-200">
                                  {formatFeatureValue(attr.featureKey, attr.targetValue)}
                                </span>
                              </div>

                              {/* 3. Portfolio Winning Champion Site */}
                              <div className="col-span-1 sm:col-span-4 flex flex-col justify-center text-[11px]">
                                {attr.bestCandidateName ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="rounded bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 shrink-0">
                                      CHAMPION
                                    </span>
                                    <span className="font-semibold text-white truncate">
                                      {attr.bestCandidateName}
                                    </span>
                                    <span className="text-slate-400 text-[10px]">
                                      ({formatFeatureValue(attr.featureKey, attr.bestCandidateValue)})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">No site covers parameter</span>
                                )}

                                {/* Candidate breakdown sub-row */}
                                <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] text-slate-400">
                                  {attr.candidateBreakdown.map((c) => (
                                    <span
                                      key={c.candidateId}
                                      className={cn(
                                        "rounded px-1.5 py-0.2 border",
                                        c.isWinner
                                          ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-200 font-semibold"
                                          : "border-slate-800 bg-slate-900/60 text-slate-400",
                                      )}
                                    >
                                      {c.candidateName.split(" ")[0]}:{" "}
                                      {c.similarity !== null ? `${Math.round(c.similarity * 100)}%` : "N/A"}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* 4. Similarity score */}
                              <div className="col-span-1 sm:col-span-2 flex sm:justify-end items-center justify-between text-right text-[11px]">
                                <span className="sm:hidden text-slate-400 text-[10px]">Match:</span>
                                {isComparable && (
                                  <span
                                    className={cn(
                                      "font-bold tabular-nums text-xs px-2 py-0.5 rounded",
                                      Math.round((attr.bestSimilarity ?? 0) * 100) >= 70
                                        ? "text-cyan-300 bg-cyan-950/60 border border-cyan-500/30"
                                        : Math.round((attr.bestSimilarity ?? 0) * 100) >= 40
                                        ? "text-amber-300 bg-amber-950/60 border border-amber-500/30"
                                        : "text-rose-300 bg-rose-950/60 border border-rose-500/30",
                                    )}
                                  >
                                    {Math.round((attr.bestSimilarity ?? 0) * 100)}%
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
                          </div>
                        )
                      })}
                  </div>
                </div>
              </PanelCard>

              {/* Deficit Warning Card */}
              {selectedPortfolio.deficientFeatures.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
                    <ShieldAlert className="size-4 text-amber-400" />
                    <span>Scientific Limitations &amp; Residual Deficits</span>
                  </div>
                  <p className="text-slate-300 mb-2 leading-relaxed">
                    Even across this optimized suite, the following planetary parameters remain under-represented or
                    physically unconstrained by terrestrial environments:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {selectedPortfolio.deficientFeatures.map((def) => (
                      <li key={def.featureKey}>
                        <strong className="text-amber-200">{def.featureLabel}:</strong> {def.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
