import {
  COMPARISON_FEATURES,
  type ConfigurableMissionProfile,
} from "./config/comparison-config.ts"
import {
  computeAnalogSimilarity,
  determineConfidenceFromCoverage,
  evaluateFeatureComparison,
  MIN_RELIABLE_COVERAGE,
} from "./similarity-engine.ts"
import type { EarthCandidate, PlanetaryTarget } from "./types.ts"
import type {
  AnalogPortfolio,
  PortfolioCandidateBreakdown,
  PortfolioDeficientFeature,
  PortfolioFeatureAttribution,
  PortfolioOptimizationResult,
} from "./types/portfolio"

/**
 * Generates all unique combinations of size k from an array of items without replacement.
 * Uses deterministic lexicographical indexing: C(n, k) = n! / (k!(n - k)!).
 */
export function generateCombinations<T>(items: T[], k: number): T[][] {
  if (k <= 0 || k > items.length) return []
  if (k === items.length) return [items.slice()]
  if (k === 1) return items.map((item) => [item])

  const combinations: T[][] = []

  function backtrack(startIndex: number, currentCombo: T[]) {
    if (currentCombo.length === k) {
      combinations.push([...currentCombo])
      return
    }

    const needed = k - currentCombo.length
    for (let i = startIndex; i <= items.length - needed; i++) {
      currentCombo.push(items[i])
      backtrack(i + 1, currentCombo)
      currentCombo.pop()
    }
  }

  backtrack(0, [])
  return combinations
}

export interface OptimizePortfolioOptions {
  portfolioSize?: number // default 2, supports 2 or 3
  limit?: number // max portfolios returned, default 10
}

/**
 * Generates a deterministic scientific explanation grounded in actual calculated telemetry values.
 * Never invents facts or uses generic AI hallucination.
 */
function buildDeterministicExplanation(
  portfolio: {
    candidates: EarthCandidate[]
    score: number | null
    coverage: number
    bestSingleName: string | null
    bestSingleScore: number | null
    synergyGain: number | null
    coverageGain: number
    attributions: PortfolioFeatureAttribution[]
    deficientFeatures: PortfolioDeficientFeature[]
  },
  target: PlanetaryTarget,
  profile: ConfigurableMissionProfile | { id?: string; label?: string; weights: Record<string, number> },
): string {
  const siteNames = portfolio.candidates.map((c) => c.name).join(" + ")
  const profileLabel = "label" in profile && profile.label ? profile.label : "Target Mission Profile"

  if (portfolio.score === null || portfolio.coverage < MIN_RELIABLE_COVERAGE) {
    return `Insufficient telemetry coverage: This candidate portfolio covers only ${(portfolio.coverage * 100).toFixed(1)}% of mission-weighted variables for ${target.name}. A minimum of 40% coverage is required for scientifically defensible mission ranking.`
  }

  // 1. Tally feature attribution wins per candidate
  const candidateWins = new Map<string, { name: string; features: string[] }>()
  for (const cand of portfolio.candidates) {
    candidateWins.set(cand.id, { name: cand.name, features: [] })
  }

  for (const attr of portfolio.attributions) {
    if (attr.weight > 0 && attr.status === "comparable" && attr.bestCandidateId) {
      const entry = candidateWins.get(attr.bestCandidateId)
      if (entry) {
        entry.features.push(attr.featureLabel)
      }
    }
  }

  const roleSentences: string[] = []
  for (const [, { name, features }] of candidateWins.entries()) {
    if (features.length > 0) {
      roleSentences.push(`${name} primary domains: ${features.join(", ")}.`)
    } else {
      roleSentences.push(`${name} provides secondary context with lower comparative fidelity in this pairing.`)
    }
  }

  // 2. Synergy comparison vs best single site
  let synergySentence = ""
  if (portfolio.synergyGain !== null && portfolio.bestSingleName && portfolio.bestSingleScore !== null) {
    if (portfolio.synergyGain > 0) {
      synergySentence = `By combining these complementary environments, the mission suite achieves a composite fidelity score of ${portfolio.score.toFixed(1)}%, surpassing the single best individual analog (${portfolio.bestSingleName} at ${portfolio.bestSingleScore.toFixed(1)}%) by +${portfolio.synergyGain.toFixed(1)} percentage points.`
    } else {
      synergySentence = `The portfolio achieves a composite fidelity score of ${portfolio.score.toFixed(1)}%, matching the single best site (${portfolio.bestSingleName}) while expanding verified parameter coverage by +${(portfolio.coverageGain * 100).toFixed(0)}%.`
    }
  } else {
    synergySentence = `The portfolio achieves a composite similarity score of ${portfolio.score.toFixed(1)}% with ${(portfolio.coverage * 100).toFixed(0)}% mission parameter coverage.`
  }

  // 3. Deficit reporting
  let deficitSentence = "All mission-weighted features are represented within acceptable operational tolerances."
  if (portfolio.deficientFeatures.length > 0) {
    const deficitLabels = portfolio.deficientFeatures.map((d) => `${d.featureLabel} (${d.reason})`).join("; ")
    deficitSentence = `Remaining operational gaps: ${deficitLabels}.`
  }

  return `Mission Suite [${siteNames}] calibrated for ${profileLabel} against ${target.name}. ${roleSentences.join(" ")} ${synergySentence} ${deficitSentence}`
}

/**
 * Evaluates an individual portfolio (set of 2 or 3 Earth candidates) against a planetary target.
 * Reuses the physically validated normalization methods and tolerances from similarity-engine.ts.
 */
export function evaluatePortfolio(
  target: PlanetaryTarget,
  candidates: EarthCandidate[],
  profile: ConfigurableMissionProfile | { id?: string; label?: string; weights: Record<string, number> },
): AnalogPortfolio {
  if (candidates.length < 2) {
    throw new Error("A portfolio must contain at least 2 distinct Earth analog candidates.")
  }

  // Precompute single-site similarities for benchmark comparison
  const singleResults = candidates.map((c) => ({
    candidate: c,
    result: computeAnalogSimilarity(target, c, profile),
  }))

  // Identify best single candidate among this specific portfolio
  const reliableSingles = singleResults.filter((s) => s.result.isReliable && s.result.score !== null)
  let bestSingle = reliableSingles.sort((a, b) => (b.result.score ?? 0) - (a.result.score ?? 0))[0]
  if (!bestSingle && singleResults.length > 0) {
    bestSingle = singleResults.sort((a, b) => b.result.coverage - a.result.coverage)[0]
  }

  const bestSingleScore = bestSingle?.result.score ?? null
  const bestSingleCandidateId = bestSingle?.candidate.id ?? null
  const bestSingleCandidateName = bestSingle?.candidate.name ?? null
  const bestSingleCoverage = bestSingle?.result.coverage ?? 0

  // 1. Parameter-by-parameter complementary evaluation
  const attributions: PortfolioFeatureAttribution[] = []
  const deficientFeatures: PortfolioDeficientFeature[] = []

  let validComparableWeight = 0
  let weightedDifferenceSum = 0
  let totalActiveWeight = 0

  for (const feature of COMPARISON_FEATURES) {
    const weight = profile.weights[feature.key] ?? 0
    const targetVal = target.environment[feature.key] ?? null
    const targetProv = target.provenanceMap?.[feature.key]

    if (weight > 0) {
      totalActiveWeight += weight
    }

    // Evaluate each candidate in portfolio for this feature
    const breakdowns: PortfolioCandidateBreakdown[] = []

    for (const cand of candidates) {
      const candVal = cand.environment[feature.key] ?? null
      const candProv = cand.provenanceMap?.[feature.key]
      const evalResult = evaluateFeatureComparison(feature, weight, targetVal, candVal, targetProv, candProv)

      breakdowns.push({
        candidateId: cand.id,
        candidateName: cand.name,
        value: candVal,
        distance: evalResult.difference,
        similarity: evalResult.similarity,
        isWinner: false,
      })
    }

    // Determine winning candidate for this parameter (minimum normalized distance)
    const comparableCandidates = breakdowns.filter(
      (b) => b.distance !== null && Number.isFinite(b.distance),
    )

    if (comparableCandidates.length > 0) {
      // Find candidate with lowest distance (highest similarity)
      comparableCandidates.sort((a, b) => (a.distance ?? 1.0) - (b.distance ?? 1.0))
      const winner = comparableCandidates[0]
      winner.isWinner = true

      // Update breakdown winner flags
      const matchedBreakdown = breakdowns.find((b) => b.candidateId === winner.candidateId)
      if (matchedBreakdown) matchedBreakdown.isWinner = true

      const bestDist = winner.distance ?? 1.0
      const bestSim = Math.round((1.0 - bestDist) * 1000) / 1000

      if (weight > 0) {
        validComparableWeight += weight
        weightedDifferenceSum += weight * bestDist

        // Flag as deficient if even the best site has poor similarity (< 60%)
        if (bestSim < 0.60) {
          deficientFeatures.push({
            featureKey: feature.key,
            featureLabel: feature.label,
            weight,
            reason: `Best candidate (${winner.candidateName}) achieves only ${(bestSim * 100).toFixed(0)}% similarity.`,
          })
        }
      }

      attributions.push({
        featureKey: feature.key,
        featureLabel: feature.label,
        weight,
        targetValue: targetVal,
        unit: feature.unit,
        bestCandidateId: winner.candidateId,
        bestCandidateName: winner.candidateName,
        bestCandidateValue: winner.value,
        bestDistance: bestDist,
        bestSimilarity: bestSim,
        status: "comparable",
        candidateBreakdown: breakdowns,
      })
    } else {
      // No candidate had valid comparable telemetry for this feature
      const isCrossBodyIncompatible = feature.isCrossBodyComparable === false
      const status = isCrossBodyIncompatible ? "incompatible_quantities" : "missing_data"
      const statusReason = isCrossBodyIncompatible
        ? (feature.incomparabilityNotice ?? "Physically excluded from planetary comparison.")
        : "None of the candidates in this portfolio have telemetry for this parameter."

      if (weight > 0) {
        deficientFeatures.push({
          featureKey: feature.key,
          featureLabel: feature.label,
          weight,
          reason: isCrossBodyIncompatible ? "Physically incompatible" : "Telemetry missing across all sites in portfolio",
        })
      }

      attributions.push({
        featureKey: feature.key,
        featureLabel: feature.label,
        weight,
        targetValue: targetVal,
        unit: feature.unit,
        bestCandidateId: null,
        bestCandidateName: null,
        bestCandidateValue: null,
        bestDistance: null,
        bestSimilarity: null,
        status,
        statusReason,
        candidateBreakdown: breakdowns,
      })
    }
  }

  // 2. Compute composite portfolio coverage and score
  const coverage = totalActiveWeight > 0 ? validComparableWeight / totalActiveWeight : 0
  const roundedCoverage = Math.round(coverage * 1000) / 1000
  const confidence = determineConfidenceFromCoverage(roundedCoverage)
  const isReliable = roundedCoverage >= MIN_RELIABLE_COVERAGE

  let weightedDistance: number | null = null
  let score: number | null = null
  let scoreDisplay = "Insufficient data to rank portfolio"

  if (isReliable && validComparableWeight > 0) {
    const rawD = weightedDifferenceSum / validComparableWeight
    weightedDistance = Math.round(rawD * 1000) / 1000
    const rawS = 100 * (1 - rawD)
    score = Math.round(rawS * 10) / 10
    scoreDisplay = `${score.toFixed(1)}%`
  }

  // 3. Compute Synergy Gain & Coverage Gain vs best single site
  const synergyGain =
    score !== null && bestSingleScore !== null
      ? Math.round((score - bestSingleScore) * 10) / 10
      : null

  const coverageGain = Math.round((roundedCoverage - bestSingleCoverage) * 1000) / 1000

  // 4. Generate deterministic, transparent scientific explanation
  const scientificExplanation = buildDeterministicExplanation(
    {
      candidates,
      score,
      coverage: roundedCoverage,
      bestSingleName: bestSingleCandidateName,
      bestSingleScore,
      synergyGain,
      coverageGain,
      attributions,
      deficientFeatures,
    },
    target,
    profile,
  )

  const portfolioId = candidates
    .map((c) => c.id)
    .sort()
    .join("+")

  return {
    id: `portfolio-${portfolioId}`,
    rank: 0, // Assigned after sorting in optimizeAnalogPortfolios
    size: candidates.length,
    candidates,
    score,
    scoreDisplay,
    weightedDistance,
    coverage: roundedCoverage,
    confidence,
    isReliable,
    bestSingleCandidateId,
    bestSingleCandidateName,
    bestSingleScore,
    bestSingleCoverage,
    synergyGain,
    coverageGain,
    attributions,
    deficientFeatures,
    scientificExplanation,
  }
}

/**
 * Exhaustively evaluates all k-candidate combinations, ranks them by composite similarity score
 * and coverage, and assigns deterministic ranks.
 */
export function optimizeAnalogPortfolios(
  target: PlanetaryTarget,
  candidates: EarthCandidate[],
  profile: ConfigurableMissionProfile | { id?: string; label?: string; summary?: string; weights: Record<string, number> },
  options: OptimizePortfolioOptions = {},
): PortfolioOptimizationResult {
  const portfolioSize = options.portfolioSize === 3 ? 3 : 2
  const limit = typeof options.limit === "number" && options.limit > 0 ? options.limit : 10

  if (candidates.length < portfolioSize) {
    throw new Error(
      `Insufficient candidates to form a portfolio of size ${portfolioSize}. Available candidates: ${candidates.length}`,
    )
  }

  // 1. Calculate best overall single candidate across the entire candidate pool
  const allSingles = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    result: computeAnalogSimilarity(target, c, profile),
  }))

  const reliableSingles = allSingles.filter((s) => s.result.isReliable && s.result.score !== null)
  let topOverallSingle = reliableSingles.sort((a, b) => (b.result.score ?? 0) - (a.result.score ?? 0))[0]
  if (!topOverallSingle && allSingles.length > 0) {
    topOverallSingle = allSingles.sort((a, b) => b.result.coverage - a.result.coverage)[0]
  }

  const bestSingleCandidate = topOverallSingle
    ? {
        id: topOverallSingle.id,
        name: topOverallSingle.name,
        score: topOverallSingle.result.score,
        coverage: topOverallSingle.result.coverage,
      }
    : null

  // 2. Generate all unique combinations of size k
  const combinations = generateCombinations(candidates, portfolioSize)

  // 3. Evaluate each portfolio deterministically
  const evaluatedPortfolios = combinations.map((combo) => evaluatePortfolio(target, combo, profile))

  // 4. Deterministic sorting:
  // - Reliable portfolios (coverage >= 40%) first, ordered by descending score, then descending coverage, then synergy gain
  // - Unreliable portfolios ordered by descending coverage
  evaluatedPortfolios.sort((a, b) => {
    if (a.isReliable && !b.isReliable) return -1
    if (!a.isReliable && b.isReliable) return 1
    if (a.score !== null && b.score !== null) {
      if (Math.abs(a.score - b.score) > 1e-4) {
        return b.score - a.score
      }
      if (Math.abs(a.coverage - b.coverage) > 1e-4) {
        return b.coverage - a.coverage
      }
      return (b.synergyGain ?? 0) - (a.synergyGain ?? 0)
    }
    return b.coverage - a.coverage
  })

  // 5. Assign 1-based ranks and take top results up to limit
  const rankedPortfolios = evaluatedPortfolios.slice(0, limit).map((p, index) => ({
    ...p,
    rank: index + 1,
  }))

  return {
    target,
    missionProfile: {
      id: profile.id ?? "custom",
      label: "label" in profile && profile.label ? profile.label : "Custom Profile",
      summary: "summary" in profile && profile.summary ? profile.summary : "Mission parameters profile",
      weights: profile.weights,
    },
    portfolioSize,
    totalCandidatesEvaluated: candidates.length,
    totalCombinationsEvaluated: combinations.length,
    bestSingleCandidate,
    portfolios: rankedPortfolios,
    computedAt: new Date().toISOString(),
  }
}
