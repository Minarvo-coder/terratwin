export type PlanetaryBody = "moon" | "mars"

export type MissionPurpose =
  | "rover-testing"
  | "geological-research"
  | "lunar-base-construction"
  | "astrobiology-habitability"

export type AnalogEnvironmentCategory =
  | "salt-flats-evaporites"
  | "polar-permafrost"
  | "volcanic-fields"
  | "impact-craters"
  | "high-altitude-plateaus"
  | "glacial-outwash"
  | "lava-tubes-caves"
  | "dry-river-deltas"
  | "serpentinizing-acidic-mineral-systems"

export interface AnalogEnvironmentCategoryDefinition {
  id: AnalogEnvironmentCategory
  label: string
  shortLabel: string
  description: string
  planetaryRelevance: string
  scientificCaveat: string
}

export type AnalogNoveltyTier =
  | "canonical-benchmark"
  | "under-explored-analog"
  | "live-grid-discovery"

export interface AnalogNoveltyTierDefinition {
  id: AnalogNoveltyTier
  label: string
  shortLabel: string
  description: string
  assignmentCriteria: string
  evidenceRequired: string
  scientificCaveat: string
}

/**
 * Geographic bounding box in WGS84 decimal degrees ordered as:
 * [minLatitude, minLongitude, maxLatitude, maxLongitude] (South, West, North, East).
 */
export type GeographicBoundingBox = [number, number, number, number]

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

export type ProvenanceDataOrigin =
  | "static-curated"
  | "live-api-estimate"
  | "computed-derivative"
  | "missing"

export type ProvenanceVerificationState =
  | "verified"
  | "unverified"
  | "illustrative"
  | "no-data"

export interface FeatureProvenance {
  status: ProvenanceStatus
  dataOrigin?: ProvenanceDataOrigin
  evidenceClassification?: EvidenceClassification
  verificationState?: ProvenanceVerificationState
  sourceTitle?: string
  sourceUrl?: string
  datasetVersion?: string
  provider?: string
  unit: string
  originalSourceValue?: number | string | null
  originalSourceUnit?: string
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
  /** Planetary latitude in decimal degrees [-90 to +90] */
  latitude?: number
  /** Planetary longitude in decimal degrees [-180 to +180] */
  longitude?: number
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
  /** Optional classification into one of the nine terrestrial environment categories of scientific interest. */
  category?: AnalogEnvironmentCategory
  /** Optional catalogue provenance classification (not a scientific similarity score). */
  noveltyTier?: AnalogNoveltyTier
  /**
   * Optional spatial extent in WGS84 decimal degrees ordered as
   * [minLatitude, minLongitude, maxLatitude, maxLongitude] (South, West, North, East).
   */
  boundingBox?: [number, number, number, number]
  /** Optional 10-meter mean surface wind speed in m/s (e.g. from NASA POWER WS10M), null when unmeasured. */
  windSpeedMs?: number | null
}

/**
 * Citation and archival provenance for primary scientific publications and datasets.
 */
export interface ScientificSourceReference {
  datasetOrPublication: string
  organization: string
  sourceUrl?: string
  doiOrIdentifier?: string
  publicationDate?: string
  spatialResolution?: string
  relevantVariables?: string[]
  attributionNotice?: string
}

/**
 * Data fidelity classification for environmental measurements.
 */
export type EvidenceClassification =
  | "measured"
  | "derived"
  | "proxy"
  | "illustrative"
  | "missing_data"

/**
 * Authoritative record for a terrestrial planetary analog discovery location.
 * Fully compatible with EarthCandidate while extending it with deep scientific metadata.
 */
export interface DiscoveryAtlasEntry extends EarthCandidate {
  category: AnalogEnvironmentCategory
  noveltyTier: AnalogNoveltyTier
  boundingBox: GeographicBoundingBox
  geologicalDescription: string
  planetaryRelevance: string
  relevantMissionProfiles: MissionPurpose[]
  evidenceClassification: EvidenceClassification
  scientificLimitations: string[]
  primarySources: ScientificSourceReference[]
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

export interface ElevationProfilePoint {
  step: number
  distanceKm: number
  normalizedProgressPct: number // 0 to 100%
  latitude: number
  longitude: number
  elevationM: number // Absolute elevation relative to datum
  relativeElevationM: number // Relative relief delta z relative to start point (z - z_0)
  localSlopeDeg: number // Local gradient in degrees
}

export interface ElevationTransectProfile {
  locationId: string
  locationName: string
  planetaryBody: "Mars" | "Moon" | "Earth"
  transectName: string
  geologicalRationale: string
  sourceDataset: string
  sourceUrl: string
  datum: string
  spatialResolution: string
  totalDistanceKm: number
  minElevationM: number
  maxElevationM: number
  reliefM: number
  meanSlopeDeg: number
  samples: ElevationProfilePoint[]
}

export interface ElevationComparisonResponse {
  success: boolean
  target: ElevationTransectProfile
  candidate: ElevationTransectProfile
  scientificNotice: {
    comparisonType: "relative-relief" | "datum-isolated"
    datumDisparityExplanation: string
    spatialResolutionDisparity: string
  }
}

