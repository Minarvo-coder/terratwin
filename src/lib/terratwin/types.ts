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
  | "elevationM"
  | "surfacePressurePa"
  | "surfaceSolarIrradianceWm2"

export type FeatureKey = NumericFeatureKey | "lithology"

export type ProvenanceStatus = "verified" | "illustrative" | "unverified" | "no-data"

export interface FeatureProvenance {
  status: ProvenanceStatus
  sourceTitle?: string
  sourceUrl?: string
  datasetVersion?: string
  provider?: string
  unit: string
  spatialResolution?: string
  measurementPeriod?: string
  qualityNotes?: string
  isComparable: boolean
  incomparabilityReason?: string
}

export type FeatureProvenanceMap = Partial<Record<FeatureKey, FeatureProvenance>>

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
  elevationM?: number | null
  surfacePressurePa?: number | null
  surfaceSolarIrradianceWm2?: number | null
}

export interface PlanetaryTarget {
  id: string
  body: PlanetaryBody
  name: string
  region: string
  summary: string
  environment: EnvironmentProfile
  provenanceMap?: FeatureProvenanceMap
  isVerified?: boolean
  databaseId?: string
}

export interface EarthCandidate {
  id: string
  name: string
  country: string
  /** Coordinates for map placement and telemetry reference. */
  latitude: number
  longitude: number
  setting: string
  summary: string
  environment: EnvironmentProfile
  provenanceMap?: FeatureProvenanceMap
  isVerified?: boolean
  databaseId?: string
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
  /** Whether the feature can be legitimately compared between Earth and extraterrestrial bodies */
  isCrossBodyComparable?: boolean
  incomparabilityNotice?: string
}

export interface MissionPurposeDefinition {
  id: MissionPurpose
  label: string
  summary: string
  weights: Partial<Record<FeatureKey, number>>
}

export type FeatureScoreStatus =
  | "comparable"
  | "missing_data"
  | "unverified"
  | "incompatible_units"
  | "incompatible_quantities"

export interface FeatureScore {
  key: FeatureKey
  weight: number
  targetValue: number | string | null
  candidateValue: number | string | null
  targetProvenance: FeatureProvenance
  candidateProvenance: FeatureProvenance
  /** 0–1 similarity, null when either side is missing or incompatible. */
  similarity: number | null
  status: FeatureScoreStatus
  statusReason?: string
}

export type DataConfidence = "high" | "moderate" | "low" | "insufficient"

export interface RankedCandidate {
  rank: number
  candidate: EarthCandidate
  /** 0–100 weighted similarity over available comparable features, or null if insufficient data */
  score: number | null
  scoreDisplay: string
  isReliable: boolean
  /** Share of total mission weight that had valid, comparable data on both sides (0–1). */
  coverage: number
  confidence: DataConfidence
  /** Weighted environmental distance D in [0, 1] where 0 is identical and 1 is maximum divergence. */
  weightedDistance?: number | null
  missingFeatures: FeatureKey[]
  incompatibleFeatures: FeatureKey[]
  featureScores: FeatureScore[]
  scientificNotice?: string
}

export interface DatasetSourceLink {
  title: string
  provider: string
  url: string
  version: string
  accessedAt?: string
  limitations?: string
}

export interface DatasetMeta {
  id: string
  name: string
  version: string
  isIllustrative: boolean
  isVerified?: boolean
  notice: string
  sourceLinks?: DatasetSourceLink[]
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
