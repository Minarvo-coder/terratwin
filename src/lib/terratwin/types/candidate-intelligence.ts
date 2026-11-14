import type {
  AnalogNoveltyTier,
  EvidenceClassification,
  FeatureKey,
  FeatureScoreStatus,
  MissionPurpose,
  PlanetaryBody,
  ProvenanceDataOrigin,
  ProvenanceVerificationState,
} from "../types.ts"

/**
 * Presentation-band classification of an individual feature contribution.
 * Thresholds are explicitly documented TerraTwin heuristic bands for UI explainability
 * and are not independently validated planetary-science boundaries.
 */
export type FeatureContributionCategory =
  | "strong-supporting-match"
  | "partial-match"
  | "significant-mismatch"
  | "not-comparable"
  | "missing-evidence"

export interface CandidateFeatureExplanation {
  key: FeatureKey
  label: string
  shortLabel: string
  unit: string
  missionWeight: number
  earthValue: number | string | null
  targetValue: number | string | null
  comparisonStatus: FeatureScoreStatus
  /** Exact [0, 1] similarity produced by the existing engine; null when omitted/missing. */
  similarity: number | null
  contributionCategory: FeatureContributionCategory
  evidenceClassification: EvidenceClassification
  dataOrigin: ProvenanceDataOrigin
  verificationState: ProvenanceVerificationState
  sourceTitle?: string
  sourceUrl?: string
  spatialResolution?: string
  temporalCoverage?: string
  qualityNotes?: string
  interpretation: string
  limitations: string[]
}

export type EvidenceQualityTag =
  | "source-supported"
  | "proxy-limited"
  | "spatially-coarse"
  | "missing-critical-measurements"
  | "independently-validated"

export interface EvidenceQualitySummary {
  comparableCount: number
  missingCount: number
  incompatibleCount: number
  measuredCount: number
  derivedCount: number
  proxyCount: number
  illustrativeCount: number
  independentlyVerifiedCount: number
  /** Exact existing mission-weighted coverage [0, 1], or null for unscored curated archive entries. */
  weightedCoverage: number | null
  qualitativeTags: EvidenceQualityTag[]
  assessmentSummary: string
  resolutionNotes: string[]
  distinctionNote: string
}

export type MismatchKind =
  | "scored-mismatch"
  | "known-contextual-limitation"
  | "unknown"

export interface ScientificMismatchItem {
  kind: MismatchKind
  featureKey?: FeatureKey
  title: string
  missionWeight?: number
  similarity?: number | null
  detail: string
  missionImpact: string
}

export type CandidateValidationStatus =
  | "exploratory-screening-lead"
  | "evidence-review-needed"
  | "suitable-for-targeted-follow-up"
  | "independently-validated"

export type ValidationChecklistStatus =
  | "supported"
  | "not-supported"
  | "unknown"
  | "not-applicable"

export interface ValidationChecklistItem {
  id: string
  label: string
  status: ValidationChecklistStatus
  explanation: string
  evidenceSummary?: string
}

export type ResearchPriorityLevel =
  | "promising-follow-up-lead"
  | "additional-data-required"
  | "limited-current-evidence"
  | "not-presently-assessable"

export interface ResearchPriorityAssessment {
  level: ResearchPriorityLevel
  label: string
  reasons: string[]
  nextAction: string
  documentedRules: string[]
}

export interface SensitivityScenarioResult {
  scenarioId: string
  label: string
  perturbationSummary: string
  perturbedFeatureKey: FeatureKey | null
  score: number | null
  rankInEvaluatedSet: number | null
}

export interface SensitivityAnalysisResult {
  status: "completed" | "insufficient-evidence" | "unavailable"
  label: "Exploratory weight-sensitivity analysis"
  baselineScore: number | null
  baselineRank: number | null
  evaluatedCandidateSetSize: number
  perturbationFraction: number
  scenarios: SensitivityScenarioResult[]
  minScore: number | null
  maxScore: number | null
  scoreSpan: number | null
  orderChangedWithinEvaluatedSet: boolean
  caveats: string[]
  unavailableReason?: string
}

export interface FollowUpRecommendation {
  id: string
  priorityOrder: number
  missionRelevance: "critical" | "high" | "moderate"
  driverFeature?: FeatureKey
  title: string
  action: string
  rationale: string
  observationStatus: "recommended-not-completed"
}

export interface IntelligenceSourceReference {
  title: string
  providerOrOrg: string
  url?: string
  identifierOrVersion?: string
  resolution?: string
  temporalCoverage?: string
  variables?: string
}

export interface CandidateScientificIntelligence {
  candidateId: string
  candidateName: string
  candidateSourceKind: "live-grid-cell" | "curated-atlas-site"
  noveltyTier: AnalogNoveltyTier | "unspecified"
  targetId: string
  targetName: string
  targetBody: PlanetaryBody
  missionProfileId: MissionPurpose | string
  missionProfileLabel: string
  /** Exact existing similarity score preserved untouched, null when withheld/unscored. */
  score: number | null
  scoreDisplay: string
  coverage: number | null
  isReliable: boolean
  baselineWeightedDistance: number | null
  validationStatus: CandidateValidationStatus
  validationStatusLabel: string
  validationNotice: string
  checklist: ValidationChecklistItem[]
  featureExplanations: CandidateFeatureExplanation[]
  evidenceQuality: EvidenceQualitySummary
  mismatches: ScientificMismatchItem[]
  missionInterpretation: string
  researchPriority: ResearchPriorityAssessment
  sensitivityAnalysis: SensitivityAnalysisResult
  followUpRecommendations: FollowUpRecommendation[]
  sourceReferences: IntelligenceSourceReference[]
  scientificCaveats: string[]
  presentationThresholdDisclosure: string
  disclaimer: string
}
