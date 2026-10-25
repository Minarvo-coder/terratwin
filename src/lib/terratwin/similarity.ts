import { FEATURES, LITHOLOGY_FAMILIES } from "./features"
import type {
  DataConfidence,
  EarthCandidate,
  FeatureDefinition,
  FeatureScore,
  Lithology,
  MissionPurposeDefinition,
  PlanetaryTarget,
  RankedCandidate,
} from "./types"

export const HIGH_CONFIDENCE_COVERAGE = 0.9
export const MODERATE_CONFIDENCE_COVERAGE = 0.7

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function linearSimilarity(target: number, candidate: number, tolerance: number): number {
  return clamp01(1 - Math.abs(target - candidate) / tolerance)
}

export function logarithmicSimilarity(target: number, candidate: number, tolerance: number): number {
  const floor = 1e-4
  const difference = Math.abs(Math.log10(Math.max(target, floor)) - Math.log10(Math.max(candidate, floor)))
  return clamp01(1 - difference / tolerance)
}

export function lithologySimilarity(target: Lithology, candidate: Lithology): number {
  if (target === candidate) return 1
  if (LITHOLOGY_FAMILIES[target] === LITHOLOGY_FAMILIES[candidate]) return 0.5
  return 0
}

export function featureSimilarity(
  feature: FeatureDefinition,
  targetValue: number | string | null,
  candidateValue: number | string | null,
): number | null {
  if (targetValue === null || candidateValue === null) return null

  if (feature.kind === "categorical") {
    return lithologySimilarity(targetValue as Lithology, candidateValue as Lithology)
  }

  const tolerance = feature.tolerance ?? 1
  if (feature.kind === "logarithmic") {
    return logarithmicSimilarity(targetValue as number, candidateValue as number, tolerance)
  }
  return linearSimilarity(targetValue as number, candidateValue as number, tolerance)
}

export function confidenceFromCoverage(coverage: number): DataConfidence {
  if (coverage >= HIGH_CONFIDENCE_COVERAGE) return "high"
  if (coverage >= MODERATE_CONFIDENCE_COVERAGE) return "moderate"
  return "low"
}

export function scoreCandidate(
  target: PlanetaryTarget,
  candidate: EarthCandidate,
  purpose: MissionPurposeDefinition,
): Omit<RankedCandidate, "rank"> {
  const featureScores: FeatureScore[] = FEATURES.map((feature) => {
    const targetValue = target.environment[feature.key]
    const candidateValue = candidate.environment[feature.key]
    return {
      key: feature.key,
      weight: purpose.weights[feature.key],
      targetValue,
      candidateValue,
      similarity: featureSimilarity(feature, targetValue, candidateValue),
    }
  })

  const totalWeight = featureScores.reduce((sum, item) => sum + item.weight, 0)
  const available = featureScores.filter((item) => item.similarity !== null)
  const availableWeight = available.reduce((sum, item) => sum + item.weight, 0)
  const weightedSum = available.reduce((sum, item) => sum + item.weight * (item.similarity ?? 0), 0)

  const coverage = totalWeight > 0 ? availableWeight / totalWeight : 0
  const score = availableWeight > 0 ? (weightedSum / availableWeight) * 100 : 0

  return {
    candidate,
    score: Math.round(score * 10) / 10,
    coverage: Math.round(coverage * 100) / 100,
    confidence: confidenceFromCoverage(coverage),
    missingFeatures: featureScores.filter((item) => item.similarity === null).map((item) => item.key),
    featureScores,
  }
}

export function rankCandidates(
  target: PlanetaryTarget,
  candidates: EarthCandidate[],
  purpose: MissionPurposeDefinition,
): RankedCandidate[] {
  return candidates
    .map((candidate) => scoreCandidate(target, candidate, purpose))
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage)
    .map((result, index) => ({ ...result, rank: index + 1 }))
}
