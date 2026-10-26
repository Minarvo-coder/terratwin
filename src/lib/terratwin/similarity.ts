import {
  computeAnalogSimilarity,
  rankCandidateLocations,
  calculateLinearDifference,
  calculateLogarithmicDifference,
  calculateLithologyDistance,
  evaluateFeatureComparison,
  determineConfidenceFromCoverage,
  MIN_RELIABLE_COVERAGE,
  HIGH_CONFIDENCE_COVERAGE,
  MODERATE_CONFIDENCE_COVERAGE,
  clamp01,
} from "./similarity-engine"
import type {
  DataConfidence,
  EarthCandidate,
  FeatureDefinition,
  FeatureProvenance,
  FeatureScore,
  Lithology,
  MissionPurposeDefinition,
  PlanetaryTarget,
  RankedCandidate,
} from "./types"

export {
  MIN_RELIABLE_COVERAGE,
  HIGH_CONFIDENCE_COVERAGE,
  MODERATE_CONFIDENCE_COVERAGE,
  clamp01,
}

/**
 * Calculates linear normalized similarity:
 * s = max(0, 1 - |target - candidate| / tolerance)
 */
export function linearSimilarity(target: number, candidate: number, tolerance: number): number {
  return clamp01(1.0 - calculateLinearDifference(target, candidate, tolerance))
}

/**
 * Calculates logarithmic normalized similarity:
 * s = max(0, 1 - |log10(target) - log10(candidate)| / tolerance)
 */
export function logarithmicSimilarity(target: number, candidate: number, tolerance: number): number {
  return clamp01(1.0 - calculateLogarithmicDifference(target, candidate, tolerance))
}

/**
 * Calculates categorical similarity for lithological rock types:
 * 1.0 for exact lithology match,
 * 0.5 for same petrological rock family,
 * 0.0 for completely different rock families.
 */
export function lithologySimilarity(target: Lithology, candidate: Lithology): number {
  return clamp01(1.0 - calculateLithologyDistance(target, candidate))
}

/**
 * Determines feature-level similarity and scientific comparability status.
 * Never silently substitutes zero for missing or incompatible values.
 */
export function computeFeatureScore(
  feature: FeatureDefinition,
  weight: number,
  targetValue: number | string | null,
  candidateValue: number | string | null,
  targetProvenance?: FeatureProvenance,
  candidateProvenance?: FeatureProvenance,
): FeatureScore {
  return evaluateFeatureComparison(
    feature,
    weight,
    targetValue,
    candidateValue,
    targetProvenance,
    candidateProvenance,
  )
}

export function confidenceFromCoverage(coverage: number): DataConfidence {
  return determineConfidenceFromCoverage(coverage)
}

/**
 * Computes deterministic candidate score using:
 * D = sum(weight_i * difference_i) / sum(weight_i for valid comparable features)
 * S = 100 * (1 - D)
 */
export function scoreCandidate(
  target: PlanetaryTarget,
  candidate: EarthCandidate,
  purpose: MissionPurposeDefinition,
): Omit<RankedCandidate, "rank"> {
  return computeAnalogSimilarity(target, candidate, purpose)
}

/**
 * Ranks candidates deterministically.
 */
export function rankCandidates(
  target: PlanetaryTarget,
  candidates: EarthCandidate[],
  purpose: MissionPurposeDefinition,
): RankedCandidate[] {
  return rankCandidateLocations(target, candidates, purpose)
}
