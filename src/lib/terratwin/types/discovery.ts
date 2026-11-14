import type {
  AnalogEnvironmentCategory,
  AnalogNoveltyTier,
  DataConfidence,
  EarthCandidate,
  FeatureKey,
  FeatureScore,
  GeographicBoundingBox,
  MissionPurposeDefinition,
  PlanetaryTarget,
} from "../types.ts"
import type { ConfigurableMissionProfile } from "../config/comparison-config.ts"

/**
 * Request payload for POST /api/discover
 */
export interface RegionalDiscoveryRequest {
  /**
   * Geographic bounding box in WGS84 decimal degrees:
   * [minLatitude, minLongitude, maxLatitude, maxLongitude] (South, West, North, East).
   */
  boundingBox: GeographicBoundingBox
  /** Target celestial body exploration site (e.g. 'mars-jezero-delta', 'moon-south-polar-highlands') */
  targetId: string
  /** Mission purpose identifier or custom mission profile */
  missionProfile: string | ConfigurableMissionProfile
  /** Optional filter for specific terrestrial environment category */
  category?: AnalogEnvironmentCategory
  /** Sampling grid step size in degrees (default: 0.5°, range: 0.1° to 5.0°) */
  gridSpacingDeg?: number
  /** Maximum number of spatial cells to sample (default: 25, ceiling: 100) */
  maxCells?: number
  /** Maximum number of ranked candidate cells to return (default: 10, ceiling: 50) */
  maxCandidates?: number
}

/**
 * Deterministic spatial grid cell generated inside the target bounding box.
 */
export interface DiscoveryGridCell {
  id: string
  latitude: number
  longitude: number
  boundingBox: GeographicBoundingBox
  row: number
  col: number
}

/**
 * Telemetry and fetch status for an individual environmental data provider.
 */
export interface ProviderTelemetryStatus {
  provider: "Open-Meteo Elevation" | "NASA POWER Climatology" | "Macrostrat Geology"
  dataset: string
  datasetVersion?: string
  status: "success" | "partial" | "failed" | "skipped" | "cached"
  recordsFetched: number
  cacheHits?: number
  latencyMs: number
  spatialResolution: string
  temporalCoverage?: string
  sourceUrl?: string
  attributionNotice: string
  error?: string
}

/**
 * Evaluated candidate cell returned by the discovery engine.
 */
export interface DiscoveryCandidateResult {
  rank: number
  candidate: EarthCandidate
  /** 0-100 similarity score, or null if coverage is insufficient (< 40%) */
  score: number | null
  scoreDisplay: string
  /** Share of mission weight with valid comparable data (0-1) */
  coverage: number
  confidence: DataConfidence
  isReliable: boolean
  weightedDistance: number | null
  missingFeatures: FeatureKey[]
  incompatibleFeatures: FeatureKey[]
  featureScores: FeatureScore[]
  explanation: string
  warnings: string[]
}

/**
 * Complete response payload for POST /api/discover
 */
export interface RegionalDiscoveryResponse {
  success: true
  searchMetadata: {
    boundingBox: GeographicBoundingBox
    targetId: string
    missionProfile: string
    requestedCategory?: AnalogEnvironmentCategory
    gridSpacingDeg: number
    cellsGenerated: number
    cellsEvaluated: number
    maxCellsAllowed: number
    responseCacheHit?: boolean
    scientificMethodology?: {
      slopeMethod: string
      slopeStencilDeltaDeg: number
      polarExclusionLatDeg: number
      nasaPowerPeriod: string
      temperatureProxyNote: string
      lithologyClassifierPolicy: string
    }
  }
  target: PlanetaryTarget
  missionProfile: MissionPurposeDefinition | ConfigurableMissionProfile
  providerStatuses: ProviderTelemetryStatus[]
  totalCellsEvaluated: number
  computableCandidatesCount: number
  insufficientDataCandidatesCount: number
  candidates: DiscoveryCandidateResult[]
  warnings: string[]
  executionTimeMs: number
}
