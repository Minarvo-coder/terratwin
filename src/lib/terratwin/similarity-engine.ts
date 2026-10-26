import {
  COMPARISON_FEATURES,
  type ConfigurableFeatureDefinition,
  type ConfigurableMissionProfile,
  validateMissionWeights,
} from "./config/comparison-config"
import { LITHOLOGY_FAMILIES } from "./features"
import type {
  DataConfidence,
  EarthCandidate,
  FeatureDefinition,
  FeatureProvenance,
  FeatureScore,
  Lithology,
  PlanetaryTarget,
  RankedCandidate,
} from "./types"

export const MIN_RELIABLE_COVERAGE = 0.40
export const HIGH_CONFIDENCE_COVERAGE = 0.90
export const MODERATE_CONFIDENCE_COVERAGE = 0.70

/**
 * Clamps a real numerical value to the closed unit interval [0, 1].
 */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/**
 * Calculates normalized linear difference d in [0, 1]:
 * d = min(1, max(0, |target - candidate| / tolerance))
 */
export function calculateLinearDifference(
  target: number,
  candidate: number,
  tolerance: number,
): number {
  if (!Number.isFinite(target) || !Number.isFinite(candidate) || tolerance <= 0) return 1.0
  const absDiff = Math.abs(target - candidate)
  return clamp01(absDiff / tolerance)
}

/**
 * Calculates normalized logarithmic difference d in [0, 1] for variables
 * spanning multiple orders of magnitude (e.g. median grain size):
 * d = min(1, max(0, |log10(target) - log10(candidate)| / tolerance))
 */
export function calculateLogarithmicDifference(
  target: number,
  candidate: number,
  tolerance: number,
): number {
  if (!Number.isFinite(target) || !Number.isFinite(candidate) || tolerance <= 0) return 1.0
  const floor = 1e-4
  const targetLog = Math.log10(Math.max(target, floor))
  const candidateLog = Math.log10(Math.max(candidate, floor))
  const absLogDiff = Math.abs(targetLog - candidateLog)
  return clamp01(absLogDiff / tolerance)
}

/**
 * Calculates normalized categorical distance d in [0, 1] for petrological lithology:
 * - 0.0: Identical lithology class (e.g. basaltic vs. basaltic)
 * - 0.5: Shared petrological rock family (e.g. basaltic vs. volcanic-tephra: both igneous)
 * - 1.0: Completely divergent rock family (e.g. igneous vs. sedimentary clay)
 */
export function calculateLithologyDistance(target: Lithology, candidate: Lithology): number {
  if (target === candidate) return 0.0
  const targetFamily = LITHOLOGY_FAMILIES[target]
  const candFamily = LITHOLOGY_FAMILIES[candidate]
  if (targetFamily && candFamily && targetFamily === candFamily) {
    return 0.5
  }
  return 1.0
}

export interface DetailedFeatureEvaluation extends FeatureScore {
  difference: number | null
}

/**
 * Evaluates a single physical feature between target and candidate environments.
 * 
 * SCIENTIFIC INTEGRITY RULES:
 * 1. Missing values are NEVER replaced with zero. Status is explicitly 'missing_data'.
 * 2. Incompatible physical quantities (e.g. atmospheric pressure, precipitation) are excluded.
 * 3. Incompatible measurement units (e.g. °C vs K) are rejected with 'incompatible_units'.
 */
export function evaluateFeatureComparison(
  feature: ConfigurableFeatureDefinition | FeatureDefinition,
  weight: number,
  targetValue: number | string | null,
  candidateValue: number | string | null,
  targetProvenance?: FeatureProvenance,
  candidateProvenance?: FeatureProvenance,
): DetailedFeatureEvaluation {
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

  // 1. Missing data check — never substitute missing values with zero
  if (targetValue === null || targetValue === undefined || candidateValue === null || candidateValue === undefined) {
    const isTargetMissing = targetValue === null || targetValue === undefined
    const isCandMissing = candidateValue === null || candidateValue === undefined
    return {
      key: feature.key,
      weight,
      targetValue: targetValue ?? null,
      candidateValue: candidateValue ?? null,
      targetProvenance: defaultTargetProv,
      candidateProvenance: defaultCandidateProv,
      difference: null,
      similarity: null,
      status: "missing_data",
      statusReason: isTargetMissing && isCandMissing
        ? "Both target and Earth candidate lack telemetry data."
        : isTargetMissing
        ? "Target environment lacks valid measurement."
        : "Earth candidate lacks valid measurement.",
    }
  }

  // 2. Physical cross-body comparability check
  if (feature.isCrossBodyComparable === false) {
    return {
      key: feature.key,
      weight,
      targetValue,
      candidateValue,
      targetProvenance: defaultTargetProv,
      candidateProvenance: defaultCandidateProv,
      difference: null,
      similarity: null,
      status: "incompatible_quantities",
      statusReason: feature.incomparabilityNotice ?? "Physical quantity cannot be directly compared across planetary bodies.",
    }
  }

  // 3. Physical unit consistency check
  if (defaultTargetProv.unit && defaultCandidateProv.unit && defaultTargetProv.unit !== defaultCandidateProv.unit) {
    return {
      key: feature.key,
      weight,
      targetValue,
      candidateValue,
      targetProvenance: defaultTargetProv,
      candidateProvenance: defaultCandidateProv,
      difference: null,
      similarity: null,
      status: "incompatible_units",
      statusReason: `Incompatible units: Target is recorded in "${defaultTargetProv.unit}" while candidate is in "${defaultCandidateProv.unit}".`,
    }
  }

  // 4. Calculate normalized difference d in [0, 1]
  let diff: number
  if (feature.kind === "categorical") {
    diff = calculateLithologyDistance(targetValue as Lithology, candidateValue as Lithology)
  } else if (feature.kind === "logarithmic") {
    const tolerance = feature.tolerance ?? 2.0
    diff = calculateLogarithmicDifference(Number(targetValue), Number(candidateValue), tolerance)
  } else {
    const tolerance = feature.tolerance ?? 1.0
    diff = calculateLinearDifference(Number(targetValue), Number(candidateValue), tolerance)
  }

  const roundedDiff = Math.round(diff * 1000) / 1000
  const similarity = Math.round((1.0 - roundedDiff) * 1000) / 1000

  return {
    key: feature.key,
    weight,
    targetValue,
    candidateValue,
    targetProvenance: defaultTargetProv,
    candidateProvenance: defaultCandidateProv,
    difference: roundedDiff,
    similarity,
    status: "comparable",
  }
}

export function determineConfidenceFromCoverage(coverage: number): DataConfidence {
  if (coverage >= HIGH_CONFIDENCE_COVERAGE) return "high"
  if (coverage >= MODERATE_CONFIDENCE_COVERAGE) return "moderate"
  if (coverage >= MIN_RELIABLE_COVERAGE) return "low"
  return "insufficient"
}

export interface SimilarityCalculationResult extends Omit<RankedCandidate, "rank"> {
  weightedDistance: number | null
  validFeaturesCount: number
  totalActiveFeaturesCount: number
  scientificNotice: string
}

/**
 * Computes deterministic Earth analog similarity score using the required formula:
 * 
 *   D = sum(weight_i * difference_i) / sum(weight_i for valid comparable features)
 *   S = 100 * (1 - D)
 * 
 * Here, D is weighted distance and S is an illustrative similarity score from 0 to 100.
 */
export function computeAnalogSimilarity(
  target: PlanetaryTarget,
  candidate: EarthCandidate,
  profile: ConfigurableMissionProfile | { id?: string; weights: Record<string, number> },
): SimilarityCalculationResult {
  // Validate weights if full profile provided
  if ("weights" in profile) {
    const validation = validateMissionWeights(profile.weights)
    if (!validation.isValid) {
      // In production or test environments, record warning or enforce strict profile integrity
      const hasNegative = Object.values(profile.weights).some((w) => w < 0)
      if (hasNegative) {
        throw new Error(`Invalid mission weights: Negative weight detected in profile. ${validation.errors.join("; ")}`)
      }
    }
  }

  // 1. Evaluate all registered comparison features
  const featureEvaluations: DetailedFeatureEvaluation[] = COMPARISON_FEATURES.map((feature) => {
    const weight = profile.weights[feature.key] ?? 0
    const targetVal = target.environment[feature.key] ?? null
    const candVal = candidate.environment[feature.key] ?? null
    const targetProv = target.provenanceMap?.[feature.key]
    const candProv = candidate.provenanceMap?.[feature.key]

    return evaluateFeatureComparison(feature, weight, targetVal, candVal, targetProv, candProv)
  })

  // 2. Filter active mission features (weight > 0)
  const activeEvaluations = featureEvaluations.filter((f) => f.weight > 0)
  const totalMissionWeight = activeEvaluations.reduce((sum, f) => sum + f.weight, 0)

  // 3. Filter valid, comparable features
  const comparableEvaluations = activeEvaluations.filter(
    (f) => f.status === "comparable" && f.difference !== null,
  )
  const validComparableWeight = comparableEvaluations.reduce((sum, f) => sum + f.weight, 0)

  // 4. Calculate data coverage
  const coverage = totalMissionWeight > 0 ? validComparableWeight / totalMissionWeight : 0
  const roundedCoverage = Math.round(coverage * 100) / 100
  const confidence = determineConfidenceFromCoverage(roundedCoverage)
  const isReliable = roundedCoverage >= MIN_RELIABLE_COVERAGE

  // 5. Compute Weighted Distance D and Similarity Score S
  let weightedDistance: number | null = null
  let score: number | null = null
  let scoreDisplay = "Insufficient data to rank reliably"

  if (isReliable && validComparableWeight > 0) {
    // Formula: D = sum(weight_i * difference_i) / sum(weight_i for valid comparable features)
    const weightedDiffSum = comparableEvaluations.reduce(
      (sum, f) => sum + f.weight * (f.difference ?? 0),
      0,
    )
    const rawD = weightedDiffSum / validComparableWeight
    weightedDistance = Math.round(rawD * 1000) / 1000

    // Formula: S = 100 * (1 - D)
    const rawS = 100 * (1 - rawD)
    score = Math.round(rawS * 10) / 10
    scoreDisplay = `${score.toFixed(1)}%`
  }

  const missingFeatures = featureEvaluations
    .filter((f) => f.weight > 0 && f.status === "missing_data")
    .map((f) => f.key)

  const incompatibleFeatures = featureEvaluations
    .filter((f) => f.weight > 0 && (f.status === "incompatible_quantities" || f.status === "incompatible_units"))
    .map((f) => f.key)

  return {
    candidate,
    score,
    scoreDisplay,
    isReliable,
    coverage: roundedCoverage,
    confidence,
    weightedDistance,
    validFeaturesCount: comparableEvaluations.length,
    totalActiveFeaturesCount: activeEvaluations.length,
    missingFeatures,
    incompatibleFeatures,
    featureScores: featureEvaluations,
    scientificNotice:
      "Illustrative multi-attribute proximity index. Does not imply statistical or physical certainty of equivalence.",
  }
}

/**
 * Deterministically ranks candidates:
 * 1. Candidates with sufficient reliable data (coverage >= 40%) ranked by descending score, then coverage.
 * 2. Candidates with insufficient data (coverage < 40%) ranked at the bottom, sorted by coverage.
 */
export function rankCandidateLocations(
  target: PlanetaryTarget,
  candidates: EarthCandidate[],
  profile: ConfigurableMissionProfile | { id?: string; weights: Record<string, number> },
): RankedCandidate[] {
  return candidates
    .map((candidate) => computeAnalogSimilarity(target, candidate, profile))
    .sort((a, b) => {
      if (a.isReliable && !b.isReliable) return -1
      if (!a.isReliable && b.isReliable) return 1
      if (a.score !== null && b.score !== null) {
        return b.score - a.score || b.coverage - a.coverage
      }
      return b.coverage - a.coverage
    })
    .map((result, idx) => ({ ...result, rank: idx + 1 }))
}
