"use client"

import { useState } from "react"
import { PanelCard } from "@/components/shared/panel-card"
import { usePortfolio } from "@/hooks/use-portfolio"
import { formatCoverage, formatFeatureValue, formatScore } from "@/lib/terratwin/format"
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
    <div className="flex flex-col gap-6">
      {/* 1. Header Flight Deck & Portfolio Size Controller */}
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-5 shadow-[0_0_25px_rgba(56,189,248,0.08)] backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-950/70 px-2.5 py-0.5 text-cyan-300 font-bold">
                <Layers className="size-3.5 text-cyan-400" />
                <span>MISSION SUITE // MULTI-SITE ANALOG INTELLIGENCE</span>
              </span>
              <span className="rounded bg-slate-800 border border-slate-700/80 px-2 py-0.5 text-[11px] text-slate-400">
                Combinatorial Feature-Coverage Optimizer
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[11px] text-emerald-300 font-semibold">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  <span>VERIFIED NASA PDS DATA</span>
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
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center font-mono text-xs">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setPortfolioSize(2)
                  setSelectedPortfolioId(null)
                }}
                className={cn(
                  "rounded px-3 py-1.5 transition cursor-pointer font-semibold flex items-center gap-1.5",
                  portfolioSize === 2
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
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
                  "rounded px-3 py-1.5 transition cursor-pointer font-semibold flex items-center gap-1.5",
                  portfolioSize === 3
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
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
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 px-3.5 py-2 font-bold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", (isLoading || isValidating) && "animate-spin")} />
              <span>COMPUTE SUITE</span>
            </button>
          </div>
        </div>

        {/* 2. Benchmark Comparison Hero (Single Site vs. Optimal Portfolio) */}
        {topPortfolio && bestSingle && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 border-t border-slate-800/80 pt-5">
            {/* Left Box: Best Single Site Benchmark */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <span>SINGLE BEST ANALOG</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">BENCHMARK</span>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">{bestSingle.name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 font-mono text-xs">
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Match Fidelity</div>
                  <div className="text-xl font-bold text-slate-300 mt-0.5">{formatScore(bestSingle.score)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Telemetry Coverage</div>
                  <div className="text-xl font-bold text-slate-400 mt-0.5">{formatCoverage(bestSingle.coverage)}</div>
                </div>
              </div>
            </div>

            {/* Middle Indicator: Synergy Delta */}
            <div className="hidden lg:flex flex-col items-center justify-center lg:col-span-2 text-center font-mono">
              <div className="flex size-10 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <Zap className="size-5" />
              </div>
              <div className="text-[11px] font-bold text-cyan-300 mt-2">
                {topPortfolio.synergyGain !== null && topPortfolio.synergyGain > 0 ? (
                  <span>+{topPortfolio.synergyGain.toFixed(1)}% GAIN</span>
                ) : (
                  <span>EXPANDED</span>
                )}
              </div>
              <div className="text-[9px] text-slate-400">Synergy Delta</div>
            </div>

            {/* Right Box: Optimal Mission Suite */}
            <div className="rounded-lg border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-purple-950/30 p-4 lg:col-span-5 flex flex-col justify-between shadow-[0_0_20px_rgba(56,189,248,0.1)]">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 uppercase tracking-wider font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-cyan-400" />
                    <span>OPTIMAL MISSION SUITE</span>
                  </span>
                  <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-0.2 text-[10px] text-cyan-200">
                    RANK #1
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-1 leading-snug">
                  {topPortfolio.candidates.map((c) => c.name).join(" + ")}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-cyan-500/20 font-mono text-xs">
                <div>
                  <div className="text-[10px] uppercase text-cyan-300/80">Composite Fidelity</div>
                  <div className="text-xl font-bold text-cyan-300 mt-0.5">{formatScore(topPortfolio.score)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-purple-300/80">Combined Coverage</div>
                  <div className="text-xl font-bold text-purple-300 mt-0.5">{formatCoverage(topPortfolio.coverage)}</div>
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
                      "cursor-pointer rounded-xl border p-4 transition-all duration-150 backdrop-blur-sm flex flex-col justify-between gap-3",
                      isSelected
                        ? "border-cyan-500 bg-slate-900/90 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-cyan-500/50"
                        : "border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/70",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="rounded bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-cyan-300 font-bold">
                          RANK #{portfolio.rank}
                        </span>
                        {portfolio.synergyGain !== null && portfolio.synergyGain > 0 && (
                          <span className="rounded bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] text-emerald-300 font-bold font-mono">
                            +{portfolio.synergyGain.toFixed(1)}% vs. single
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col gap-1">
                        {portfolio.candidates.map((cand) => (
                          <div key={cand.id} className="flex items-center gap-2 text-sm font-semibold text-white">
                            <span className="size-1.5 rounded-full bg-cyan-400" />
                            <span className="truncate">{cand.name}</span>
                            <span className="font-mono text-[10px] font-normal text-slate-400 ml-auto shrink-0">
                              {cand.country}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 font-mono text-xs">
                      <div>
                        <div className="text-[9px] uppercase text-slate-400">Composite Match</div>
                        <div className="text-base font-bold text-cyan-300">{formatScore(portfolio.score)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase text-slate-400">Coverage</div>
                        <div className="text-base font-bold text-purple-300">{formatCoverage(portfolio.coverage)}</div>
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
              <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-5 font-mono text-xs leading-relaxed">
                <div className="flex items-center gap-2 text-cyan-300 font-bold mb-2">
                  <Terminal className="size-4 text-cyan-400" />
                  <span>FLIGHT DIRECTOR BRIEF // SCIENTIFIC COMPOSITION ANALYSIS</span>
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
                  <span className="font-mono text-[11px] text-cyan-300 font-semibold flex items-center gap-1.5">
                    <Award className="size-3.5 text-cyan-400" />
                    <span>WINNING ANALOG ALLOCATION</span>
                  </span>
                }
              >
                <div className="flex flex-col gap-3 font-mono text-xs">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 border-b border-slate-800 pb-2 text-[10px] uppercase text-slate-400 font-semibold">
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
                        const isComparable = attr.status === "comparable" && attr.bestSimilarity !== null
                        const isMissing = attr.status === "missing_data"
                        const isIncompatible = attr.status === "incompatible_quantities"

                        return (
                          <div
                            key={attr.featureKey}
                            className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 transition hover:border-slate-700"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              {/* 1. Feature Name & Weight */}
                              <div className="col-span-1 sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                                <span className="font-semibold text-white text-xs">{attr.featureLabel}</span>
                                <span className="rounded bg-slate-800/90 border border-slate-700/60 px-1.5 py-0.2 text-[9px] text-slate-400 font-mono shrink-0">
                                  wt: {attr.weight.toFixed(2)}
                                </span>
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
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 font-mono text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                    <ShieldAlert className="size-4" />
                    <span>SCIENTIFIC LIMITATIONS & REMAINING RESIDUAL DEFICITS</span>
                  </div>
                  <p className="text-slate-300 mb-2">
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
