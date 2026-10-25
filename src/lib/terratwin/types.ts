export type PlanetaryBody = "moon" | "mars"

export type MissionPurpose = "rover-testing" | "geological-research"

export type Lithology =
  | "basaltic"
  | "anorthositic"
  | "volcanic-tephra"
  | "sulfate-evaporite"
  | "clay-sedimentary"
  | "impact-breccia"
  | "felsic-crystalline"

export type NumericFeatureKey =
  | "meanSurfaceTempC"
  | "diurnalTempRangeC"
  | "annualPrecipitationMm"
  | "meanSlopeDeg"
  | "rockAbundancePct"
  | "medianGrainSizeMm"
  | "albedo"
  | "vegetationCoverPct"

export type FeatureKey = NumericFeatureKey | "lithology"

export interface EnvironmentProfile {
  meanSurfaceTempC: number | null
  diurnalTempRangeC: number | null
  annualPrecipitationMm: number | null
  meanSlopeDeg: number | null
  rockAbundancePct: number | null
  medianGrainSizeMm: number | null
  albedo: number | null
  vegetationCoverPct: number | null
  lithology: Lithology | null
}

export interface PlanetaryTarget {
  id: string
  body: PlanetaryBody
  name: string
  region: string
  summary: string
  environment: EnvironmentProfile
}

export interface EarthCandidate {
  id: string
  name: string
  country: string
  /** Approximate coordinates for display only. */
  latitude: number
  longitude: number
  setting: string
  summary: string
  environment: EnvironmentProfile
}

export type FeatureComparisonKind = "linear" | "logarithmic" | "categorical"

export interface FeatureDefinition {
  key: FeatureKey
  label: string
  shortLabel: string
  unit: string
  description: string
  kind: FeatureComparisonKind
  /** Difference at which similarity reaches zero (in feature units, or log10 units for logarithmic). */
  tolerance?: number
}

export interface MissionPurposeDefinition {
  id: MissionPurpose
  label: string
  summary: string
  weights: Record<FeatureKey, number>
}

export interface FeatureScore {
  key: FeatureKey
  weight: number
  targetValue: number | string | null
  candidateValue: number | string | null
  /** 0–1 similarity, null when either side is missing. */
  similarity: number | null
}

export type DataConfidence = "high" | "moderate" | "low"

export interface RankedCandidate {
  rank: number
  candidate: EarthCandidate
  /** 0–100 weighted similarity over available features. Illustrative only. */
  score: number
  /** Share of total mission weight that had data on both sides (0–1). */
  coverage: number
  confidence: DataConfidence
  missingFeatures: FeatureKey[]
  featureScores: FeatureScore[]
}

export interface DatasetMeta {
  id: string
  name: string
  version: string
  isIllustrative: true
  notice: string
}

export interface AnalogQueryResult {
  dataset: DatasetMeta
  target: PlanetaryTarget
  purpose: MissionPurposeDefinition
  minScore: number
  totalCandidates: number
  results: RankedCandidate[]
}

export interface AnalogApiError {
  error: string
}
