import { FEATURES, LITHOLOGY_FAMILIES } from "./features"
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

export const HIGH_CONFIDENCE_COVERAGE = 0.9
export const MODERATE_CONFIDENCE_COVERAGE = 0.7
export const MIN_RELIABLE_COVERAGE = 0.4

/**
 * Clamps a numerical value to the closed unit interval [0, 1].
 */
export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Calculates linear normalized similarity:
 * s = max(0, 1 - |target - candidate| / tolerance)
 */
export function linearSimilarity(target: number, candidate: number, tolerance: number): number {
  if (!Number.isFinite(target) || !Number.isFinite(candidate) || tolerance <= 0) return 0
  return clamp01(1 - Math.abs(target - candidate) / tolerance)
}

/**
 * Calculates logarithmic normalized similarity for parameters spanning orders of magnitude
 * (e.g. median grain size, atmospheric pressure):
 * s = max(0, 1 - |log10(target) - log10(candidate)| / tolerance)
 */
export function logarithmicSimilarity(target: number, candidate: number, tolerance: number): number {
  if (!Number.isFinite(target) || !Number.isFinite(candidate) || tolerance <= 0) return 0
  const floor = 1e-4
  const targetLog = Math.log10(Math.max(target, floor))
  const candidateLog = Math.log10(Math.max(candidate, floor))
  const difference = Math.abs(targetLog - candidateLog)
  return clamp01(1 - difference / tolerance)
}

/**
 * Calculates categorical similarity for lithological rock types:
 * 1.0 for exact lithology match,
 * 0.5 for same petrological rock family (e.g. basaltic and volcanic tephra are both igneous),
 * 0.0 for completely different rock families.
 */
export function lithologySimilarity(target: Lithology, candidate: Lithology): number {
  if (target === candidate) return 1
  if (LITHOLOGY_FAMILIES[target] && LITHOLOGY_FAMILIES[candidate] && LITHOLOGY_FAMILIES[target] === LITHOLOGY_FAMILIES[candidate]) {
    return 0.5
  }
  return 0
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
  const defaultTargetProv: FeatureProvenance = targetProvenance ?? {
    status: targetValue === null ? "no-data" : "illustrative",
    unit: feature.unit,
    isComparable: feature.isCrossBodyComparable ?? true,
  }

  const defaultCandidateProv: FeatureProvenance = candidateProvenance ?? {
    status: candidateValue === null ? "no-data" : "illustrative",
    unit: feature.unit,
    isComparable: feature.isCrossBodyComparable ?? true,
  }

  // 1. Check for missing data
  if (targetValue === null || targetValue === undefined || candidateValue === null || candidateValue === undefined) {
    return {
      key: feature.key,
      weight,
      targetValue: targetValue ?? null,
      candidateValue: candidateValue ?? null,
      targetProvenance: defaultTargetProv,
      candidateProvenance: defaultCandidateProv,
      similarity: null,
      status: "missing_data",
      statusReason: targetValue === null && candidateValue === null
        ? "Both target and Earth candidate lack telemetry data."
        : targetValue === null
        ? "Target environment lacks valid measurement."
        : "Earth candidate lacks valid measurement.",
    }
  }

  // 2. Check for physical/scientific cross-body incomparability
  if (feature.isCrossBodyComparable === false) {
    return {
      key: feature.key,
      weight,
      targetValue,
      candidateValue,
      targetProvenance: defaultTargetProv,
      candidateProvenance: defaultCandidateProv,
      similarity: null,
      status: "incompatible_quantities",
      statusReason: feature.incomparabilityNotice ?? "Cross-body physical conditions are dimensionally incompatible.",
    }
  }

  // 3. Check for unit mismatch
  if (defaultTargetProv.unit && defaultCandidateProv.unit && defaultTargetProv.unit !== defaultCandidateProv.unit) {
    return {
      key: feature.key,
      weight,
      targetValue,
      candidateValue,
      targetProvenance: defaultTargetProv,
      candidateProvenance: defaultCandidateProv,
      similarity: null,
      status: "incompatible_units",
      statusReason: `Unit mismatch: Target is in ${defaultTargetProv.unit} while candidate is in ${defaultCandidateProv.unit}.`,
    }
  }

  // 4. Calculate valid mathematical similarity
  let similarity: number
  if (feature.kind === "categorical") {
    similarity = lithologySimilarity(targetValue as Lithology, candidateValue as Lithology)
  } else {
    const tolerance = feature.tolerance ?? 1
    if (feature.kind === "logarithmic") {
      similarity = logarithmicSimilarity(Number(targetValue), Number(candidateValue), tolerance)
    } else {
      similarity = linearSimilarity(Number(targetValue), Number(candidateValue), tolerance)
    }
  }

  return {
    key: feature.key,
    weight,
    targetValue,
    candidateValue,
    targetProvenance: defaultTargetProv,
    candidateProvenance: defaultCandidateProv,
    similarity: Math.round(similarity * 1000) / 1000,
    status: "comparable",
  }
}

export function confidenceFromCoverage(coverage: number): DataConfidence {
  if (coverage >= HIGH_CONFIDENCE_COVERAGE) return "high"
  if (coverage >= MODERATE_CONFIDENCE_COVERAGE) return "moderate"
  if (coverage >= MIN_RELIABLE_COVERAGE) return "low"
  return "insufficient"
}

/**
 * Computes deterministic candidate score across mission weights.
 * Applies weights ONLY to valid, comparable features.
 * Suppresses score when total valid mission weight coverage is below MIN_RELIABLE_COVERAGE (40%).
 */
export function scoreCandidate(
  target: PlanetaryTarget,
  candidate: EarthCandidate,
  purpose: MissionPurposeDefinition,
): Omit<RankedCandidate, "rank"> {
  const featureScores: FeatureScore[] = FEATURES.map((feature) => {
    const weight = purpose.weights[feature.key] ?? 0
    const targetValue = target.environment[feature.key] ?? null
    const candidateValue = candidate.environment[feature.key] ?? null
    const targetProv = target.provenanceMap?.[feature.key]
    const candidateProv = candidate.provenanceMap?.[feature.key]

    return computeFeatureScore(feature, weight, targetValue, candidateValue, targetProv, candidateProv)
  })

  // Mission weights apply to features configured with weight > 0
  const activeFeatures = featureScores.filter((f) => f.weight > 0)
  const totalMissionWeight = activeFeatures.reduce((sum, f) => sum + f.weight, 0)

  // Only comparable features contribute to available weight
  const comparableFeatures = activeFeatures.filter((f) => f.status === "comparable" && f.similarity !== null)
  const availableWeight = comparableFeatures.reduce((sum, f) => sum + f.weight, 0)
  const weightedSimilaritySum = comparableFeatures.reduce(
    (sum, f) => sum + f.weight * (f.similarity ?? 0),
    0,
  )

  const coverage = totalMissionWeight > 0 ? availableWeight / totalMissionWeight : 0
  const confidence = confidenceFromCoverage(coverage)
  const isReliable = coverage >= MIN_RELIABLE_COVERAGE

  let score: number | null = null
  let scoreDisplay = "Insufficient data to rank reliably"

  if (isReliable && availableWeight > 0) {
    const rawScore = (weightedSimilaritySum / availableWeight) * 100
    score = Math.round(rawScore * 10) / 10
    scoreDisplay = `${score.toFixed(1)}%`
  }

  const missingFeatures = featureScores
    .filter((f) => f.weight > 0 && f.status === "missing_data")
    .map((f) => f.key)

  const incompatibleFeatures = featureScores
    .filter((f) => f.weight > 0 && (f.status === "incompatible_quantities" || f.status === "incompatible_units"))
    .map((f) => f.key)

  return {
    candidate,
    score,
    scoreDisplay,
    isReliable,
    coverage: Math.round(coverage * 100) / 100,
    confidence,
    missingFeatures,
    incompatibleFeatures,
    featureScores,
  }
}

/**
 * Ranks candidates deterministically:
 * 1. Reliable candidates with sufficient data are ranked first by descending score, then by coverage.
 * 2. Unreliable candidates (insufficient data) are placed at the bottom, sorted by coverage.
 */
export function rankCandidates(
  target: PlanetaryTarget,
  candidates: EarthCandidate[],
  purpose: MissionPurposeDefinition,
): RankedCandidate[] {
  return candidates
    .map((candidate) => scoreCandidate(target, candidate, purpose))
    .sort((a, b) => {
      if (a.isReliable && !b.isReliable) return -1
      if (!a.isReliable && b.isReliable) return 1
      if (a.score !== null && b.score !== null) {
        return b.score - a.score || b.coverage - a.coverage
      }
      return b.coverage - a.coverage
    })
    .map((result, index) => ({ ...result, rank: index + 1 }))
}
