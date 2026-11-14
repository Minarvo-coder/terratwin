import type {
  AnalogNoveltyTier,
  EarthCandidate,
  FeatureKey,
  FeatureScore,
  MissionPurpose,
  PlanetaryBody,
  PlanetaryTarget,
} from "../types.ts"
import type {
  CandidateScientificIntelligence,
  IntelligenceSourceReference,
  ValidationChecklistItem,
} from "./candidate-intelligence.ts"
import type {
  ProviderTelemetryStatus,
  RegionalDiscoveryResponse,
} from "./discovery.ts"

export const RESEARCH_SNAPSHOT_SCHEMA_VERSION = "1.0.0"
export const RESEARCH_REPORT_VERSION = "6.6.0"
export const TERRATWIN_METHODOLOGY_VERSION =
  "TerraTwin Discovery Engine v6.3.1 · Scientific Intelligence v6.5"

export const RESEARCH_WORKFLOW_DISCLAIMER =
  "TerraTwin provides exploratory planetary analog screening based on available scientific data. Candidate assessments are not official NASA certifications and require independent validation before field or operational use."

export const RESEARCH_STORAGE_DISCLOSURE =
  "Browser-local workspace storage: research assessments, tasks, and notes are stored in this browser's localStorage and active session only. They do not sync across devices or write to shared databases. Export PDF, CSV, or Snapshot JSON files to archive permanently."

export const RESEARCH_CLOUD_STORAGE_DISCLOSURE =
  "Supabase Cloud Workspace (RLS-isolated per user) + local offline cache: research assessments, immutable snapshot revisions, tasks, and notes synchronize across your authenticated sessions under strict Row Level Security (auth.uid() = user_id). Unauthenticated sessions remain browser-local until imported."

export type ResearchStorageMode =
  | "browser-local-and-explicit-export"
  | "supabase-cloud-rls-and-local-cache"

export type CloudWorkspaceSyncState =
  | "unauthenticated-local"
  | "syncing"
  | "cloud-synced"
  | "offline-queued"
  | "conflict-merged"
  | "sync-error"

export type CloudBackendPersistenceMode =
  | "supabase-postgres-rls"
  | "server-rls-fallback-pending-migration"
  | "browser-local-only"

export interface AuthenticatedWorkspaceUser {
  id: string
  email: string
  authProvider: "supabase-auth" | "verified-crew-session"
}

export interface PendingWorkspaceSyncOperation {
  opId: string
  userId: string
  kind: "upsert" | "delete"
  contextKey: string
  record?: ResearchAssessmentRecord
  queuedAt: string
}

export type ResearchTaskStatus =
  | "identified"
  | "evidence-review"
  | "follow-up-planned"
  | "observation-pending"
  | "evidence-reviewed"
  | "closed"

export const RESEARCH_TASK_STATUS_ORDER: readonly ResearchTaskStatus[] = [
  "identified",
  "evidence-review",
  "follow-up-planned",
  "observation-pending",
  "evidence-reviewed",
  "closed",
]

export const RESEARCH_TASK_STATUS_LABELS: Record<ResearchTaskStatus, string> = {
  identified: "Identified",
  "evidence-review": "Evidence Review",
  "follow-up-planned": "Follow-Up Planned",
  "observation-pending": "Observation Pending",
  "evidence-reviewed": "Evidence Reviewed",
  closed: "Closed",
}

export type ResearchTaskPriority = "critical" | "high" | "moderate"

export interface ResearchTask {
  id: string
  researchRecordId: string
  candidateId: string
  title: string
  scientificRationale: string
  relatedGap: string
  driverFeature?: FeatureKey
  suggestedObservationMethod: string
  priority: ResearchTaskPriority
  status: ResearchTaskStatus
  /** Operational workflow completion never implies field verification or independent confirmation. */
  observationStatus: "recommended-not-completed"
  owner?: string
  notes?: string
  sourceReference?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface ResearchValidationNote {
  id: string
  researchRecordId: string
  candidateId: string
  title: string
  body: string
  authorRole: "user-authored-research-note"
  relatedFeature?: FeatureKey | "general"
  userSuppliedSourceUrl?: string
  linkedTaskId?: string
  createdAt: string
  updatedAt: string
}

export type ResearchSourceOriginKind =
  | "repository-dataset"
  | "live-provider"
  | "peer-reviewed-literature"
  | "user-supplied-reference"

export interface ResearchEvidenceReference extends IntelligenceSourceReference {
  originKind: ResearchSourceOriginKind
  note?: string
}

export interface ResearchReportMetadata {
  reportTitle: string
  reportSubtitle: string
  reportVersion: string
  candidateId: string
  candidateName: string
  snapshotId: string
  snapshotSchemaVersion: string
  contentDigest: string
  digestNote: string
  generatedAt: string
  datasetTemporalContext: string[]
  sourceVersions: string[]
  methodologyVersion: string
  missionProfileId: MissionPurpose | string
  missionProfileLabel: string
  targetId: string
  targetName: string
  targetBody: PlanetaryBody
  storageMode: ResearchStorageMode
  storageNotice: string
}

export interface ResearchSnapshot {
  snapshotId: string
  schemaVersion: string
  contentDigest: string
  digestScopeNote: string
  revisionNumber: number
  revisionLabel: string
  createdAt: string
  candidateId: string
  candidateName: string
  candidateSourceKind: "live-grid-cell" | "curated-atlas-site"
  noveltyTier: AnalogNoveltyTier | "unspecified"
  coordinates: {
    latitude: number
    longitude: number
    boundingBox?: [number, number, number, number]
  }
  candidate: EarthCandidate
  target: PlanetaryTarget
  missionProfileId: MissionPurpose | string
  missionProfileLabel: string
  score: number | null
  scoreDisplay: string
  coverage: number | null
  isReliable: boolean
  isVerified: boolean
  verificationStateSummary: string
  featureScores: FeatureScore[]
  intelligence: CandidateScientificIntelligence
  validationChecklist: ValidationChecklistItem[]
  providerTelemetry: ProviderTelemetryStatus[]
  searchMetadata?: RegionalDiscoveryResponse["searchMetadata"]
  sourceReferences: ResearchEvidenceReference[]
  scientificLimitations: string[]
  dataAvailabilityWarnings: string[]
  reportMetadata: ResearchReportMetadata
}

export interface ResearchAssessmentRevision {
  revisionNumber: number
  label: string
  createdAt: string
  snapshotId: string
  snapshot: ResearchSnapshot
}

export interface ResearchAssessmentRecord {
  recordId: string
  contextKey: string
  candidateId: string
  candidateName: string
  targetId: string
  missionProfileId: MissionPurpose | string
  createdAt: string
  updatedAt: string
  storageMode: ResearchStorageMode
  storageNotice: string
  ownerUserId?: string
  lastSyncedAt?: string
  snapshot: ResearchSnapshot
  revisionHistory: ResearchAssessmentRevision[]
  tasks: ResearchTask[]
  notes: ResearchValidationNote[]
}

export type ResearchExportFormat =
  | "pdf"
  | "summary-csv"
  | "features-csv"
  | "tasks-csv"
  | "provenance-csv"
  | "snapshot-json"

export interface ResearchExportManifest {
  format: ResearchExportFormat
  filename: string
  generatedAt: string
  snapshotId: string
  snapshotSchemaVersion: string
  contentDigest: string
  candidateId: string
  missionProfileId: string
  targetId: string
}
