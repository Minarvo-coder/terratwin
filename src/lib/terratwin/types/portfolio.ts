import type { ConfigurableMissionProfile } from "../config/comparison-config"
import type { DataConfidence, EarthCandidate, FeatureKey, PlanetaryTarget } from "../types"

export interface PortfolioCandidateBreakdown {
  candidateId: string
  candidateName: string
  value: number | string | null
  distance: number | null
  similarity: number | null
  isWinner: boolean
}

export interface PortfolioFeatureAttribution {
  featureKey: FeatureKey
  featureLabel: string
  weight: number
  targetValue: number | string | null
  unit: string
  /** The analog site in the portfolio that best matches this parameter */
  bestCandidateId: string | null
  bestCandidateName: string | null
  bestCandidateValue: number | string | null
  /** Normalized distance d in [0, 1] achieved by the best candidate in the portfolio */
  bestDistance: number | null
  /** Similarity achieved for this feature (1 - bestDistance), or null if missing/incompatible */
  bestSimilarity: number | null
  /** Status across the portfolio: "comparable", "missing_data", or "incompatible_quantities" */
  status: "comparable" | "missing_data" | "incompatible_quantities" | "incompatible_units"
  statusReason?: string
  /** Breakdown across each candidate in the portfolio for this feature */
  candidateBreakdown: PortfolioCandidateBreakdown[]
}

export interface PortfolioDeficientFeature {
  featureKey: FeatureKey
  featureLabel: string
  weight: number
  reason: string
}

export interface AnalogPortfolio {
  id: string
  rank: number
  size: number
  candidates: EarthCandidate[]
  /** Composite portfolio similarity score S in [0, 100], or null if insufficient data */
  score: number | null
  scoreDisplay: string
  /** Composite weighted distance D in [0, 1] */
  weightedDistance: number | null
  /** Data coverage across the portfolio (share of active mission weights with valid data in >= 1 site) */
  coverage: number
  confidence: DataConfidence
  isReliable: boolean
  /** Single best individual candidate in this portfolio for comparison */
  bestSingleCandidateId: string | null
  bestSingleCandidateName: string | null
  bestSingleScore: number | null
  bestSingleCoverage: number | null
  /** Synergy gain = portfolio score - best single site score */
  synergyGain: number | null
  /** Coverage gain = portfolio coverage - best single site coverage */
  coverageGain: number
  /** Feature-by-feature attribution */
  attributions: PortfolioFeatureAttribution[]
  /** Features that remain poorly represented (e.g. similarity < 60% or missing across all sites in portfolio) */
  deficientFeatures: PortfolioDeficientFeature[]
  /** Plain-text scientific explanation generated deterministically from real measurements */
  scientificExplanation: string
}

export interface PortfolioOptimizationResult {
  target: PlanetaryTarget
  missionProfile: {
    id: string
    label: string
    summary: string
    weights: Record<FeatureKey, number>
  }
  portfolioSize: number
  totalCandidatesEvaluated: number
  totalCombinationsEvaluated: number
  bestSingleCandidate: {
    id: string
    name: string
    score: number | null
    coverage: number
  } | null
  portfolios: AnalogPortfolio[]
  computedAt: string
}

export interface PortfolioApiRequest {
  targetId: string
  missionProfile: string | ConfigurableMissionProfile
  portfolioSize?: number // defaults to 2, allowed 2 or 3
  limit?: number // number of ranked portfolios to return (default: 5)
}

export interface PortfolioApiResponse {
  success: true
  result: PortfolioOptimizationResult
}

