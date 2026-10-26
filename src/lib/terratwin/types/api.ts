import type {
  DatasetMeta,
  MissionPurposeDefinition,
  PlanetaryTarget,
  RankedCandidate,
} from "../types"
import type { ConfigurableMissionProfile } from "../config/comparison-config"

// --- GET /api/locations ---
export interface LocationRecord {
  id: string
  name: string
  planetaryBody: "Earth" | "Moon" | "Mars"
  locationRole: "target" | "candidate"
  latitude: number | null
  longitude: number | null
  description: string | null
  createdAt: string
  featureCount?: number
}

export interface LocationsApiResponse {
  success: true
  totalCount: number
  targetsCount: number
  candidatesCount: number
  targets: LocationRecord[]
  candidates: LocationRecord[]
}

// --- GET /api/sources ---
export interface DatasetSourceRecord {
  id: string
  title: string
  provider: string | null
  sourceUrl: string | null
  datasetVersion: string | null
  accessedAt: string | null
  processingMethod: string | null
  limitations: string | null
  createdAt: string
}

export interface SourcesApiResponse {
  success: true
  totalCount: number
  sources: DatasetSourceRecord[]
}

// --- POST /api/compare ---
export interface CompareApiRequest {
  targetId: string
  missionProfile: string | ConfigurableMissionProfile
  minScore?: number
}

export interface CompareApiResponse {
  success: true
  dataset: DatasetMeta
  target: PlanetaryTarget
  missionProfile: MissionPurposeDefinition
  totalCandidatesEvaluated: number
  reliableCandidatesCount: number
  minScore: number
  rankings: RankedCandidate[]
  computedAt: string
}

// --- Standard API Error Response ---
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}
