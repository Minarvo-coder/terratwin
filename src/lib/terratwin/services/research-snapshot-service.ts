import type { ConfigurableMissionProfile } from "../config/comparison-config.ts"
import type {
  DiscoveryAtlasEntry,
  EarthCandidate,
  FeatureKey,
  FeatureScore,
  MissionPurposeDefinition,
  PlanetaryTarget,
} from "../types.ts"
import type { CandidateScientificIntelligence } from "../types/candidate-intelligence.ts"
import type {
  DiscoveryCandidateResult,
  ProviderTelemetryStatus,
  RegionalDiscoveryResponse,
} from "../types/discovery.ts"
import {
  RESEARCH_CLOUD_STORAGE_DISCLOSURE,
  RESEARCH_REPORT_VERSION,
  RESEARCH_SNAPSHOT_SCHEMA_VERSION,
  RESEARCH_STORAGE_DISCLOSURE,
  RESEARCH_TASK_STATUS_ORDER,
  TERRATWIN_METHODOLOGY_VERSION,
  type PendingWorkspaceSyncOperation,
  type ResearchAssessmentRecord,
  type ResearchAssessmentRevision,
  type ResearchEvidenceReference,
  type ResearchSnapshot,
  type ResearchSourceOriginKind,
  type ResearchTask,
  type ResearchTaskStatus,
  type ResearchValidationNote,
} from "../types/research-workflow.ts"

export const RESEARCH_STORAGE_KEY = "terratwin_phase66_research_records_v1"
export const RESEARCH_USER_CLOUD_CACHE_PREFIX = "terratwin_cloud_workspace_cache_v1_"
export const RESEARCH_USER_PENDING_QUEUE_PREFIX = "terratwin_cloud_pending_ops_v1_"
export const MAX_STORED_RESEARCH_RECORDS = 20
export const MAX_NOTE_TITLE_LENGTH = 160
export const MAX_NOTE_BODY_LENGTH = 2000
export const MAX_TASK_NOTE_LENGTH = 500
export const MAX_JSON_IMPORT_BYTES = 1_500_000

const DIGEST_SCOPE_NOTE =
  "Integrity digest computed via deterministic canonical JSON serialization over snapshot schemaVersion, candidateId, targetId, missionProfileId, coordinates, score, coverage, environmental telemetry, featureScores, validationChecklist, and researchPriority. Establishes data integrity only; does NOT establish independent scientific verification."

export function buildResearchContextKey(
  candidateId: string,
  targetId: string,
  missionProfileId: string
): string {
  return `${candidateId}::${targetId}::${missionProfileId}`
}

export function deepCloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function canonicalSortValue(val: unknown): unknown {
  if (val === null || typeof val !== "object") return val
  if (Array.isArray(val)) return val.map(canonicalSortValue)
  const record = val as Record<string, unknown>
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(record).sort()) {
    const child = record[key]
    if (child !== undefined) {
      sorted[key] = canonicalSortValue(child)
    }
  }
  return sorted
}

export function canonicalSerialize(value: unknown): string {
  return JSON.stringify(canonicalSortValue(value))
}

function fnv1a32Hex(input: string, seed = 0x811c9dc5): string {
  let hash = seed >>> 0
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}

export function computeSnapshotContentDigest(corePayload: {
  schemaVersion: string
  candidateId: string
  targetId: string
  missionProfileId: string
  coordinates: { latitude: number; longitude: number; boundingBox?: [number, number, number, number] }
  score: number | null
  coverage: number | null
  environment: EarthCandidate["environment"]
  featureScores: FeatureScore[]
  validationChecklist: CandidateScientificIntelligence["checklist"]
  researchPriority: CandidateScientificIntelligence["researchPriority"]
}): string {
  const canonical = canonicalSerialize(corePayload)
  const hi = fnv1a32Hex(canonical, 0x811c9dc5)
  const lo = fnv1a32Hex(`ttw-v2:${canonical}`, 0x9e3779b9)
  return `fnv64-${hi}${lo}`
}

function sanitizeSafeToken(raw: string, maxLen = 28): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen) || "item"
}

export function validateUserHttpUrl(rawUrl?: string): string | undefined {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return undefined
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error("Reference URL must be a valid http:// or https:// URL.")
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Reference URL must start with http:// or https://.")
  }
  return parsed.toString().slice(0, 500)
}

function assertValidCandidateContext(
  candidate: EarthCandidate,
  target: PlanetaryTarget
): void {
  if (!candidate.id || !candidate.name) {
    throw new Error("Candidate identity (id and name) is required to build a research snapshot.")
  }
  if (
    !Number.isFinite(candidate.latitude) ||
    !Number.isFinite(candidate.longitude) ||
    candidate.latitude < -90 ||
    candidate.latitude > 90 ||
    candidate.longitude < -180 ||
    candidate.longitude > 180
  ) {
    throw new Error("Candidate WGS84 coordinates must lie within [-90..90, -180..180].")
  }
  if (!target.id || !target.name) {
    throw new Error("Planetary target identity is required to build a research snapshot.")
  }
}

function extractTemporalAndVersionMetadata(
  intelligence: CandidateScientificIntelligence,
  candidate: EarthCandidate,
  searchMetadata?: RegionalDiscoveryResponse["searchMetadata"]
): { datasetTemporalContext: string[]; sourceVersions: string[] } {
  const temporalSet = new Set<string>()
  const versionSet = new Set<string>()

  if (searchMetadata?.scientificMethodology?.nasaPowerPeriod) {
    temporalSet.add(`NASA POWER period: ${searchMetadata.scientificMethodology.nasaPowerPeriod}`)
  }

  for (const exp of intelligence.featureExplanations) {
    if (exp.temporalCoverage) temporalSet.add(`${exp.shortLabel}: ${exp.temporalCoverage}`)
  }

  if (candidate.provenanceMap) {
    for (const prov of Object.values(candidate.provenanceMap)) {
      if (!prov) continue
      if (prov.measurementPeriod) temporalSet.add(prov.measurementPeriod)
      if (prov.datasetVersion) versionSet.add(prov.datasetVersion)
    }
  }

  for (const src of intelligence.sourceReferences) {
    if (src.temporalCoverage) temporalSet.add(src.temporalCoverage)
    if (src.identifierOrVersion) versionSet.add(src.identifierOrVersion)
  }

  if (temporalSet.size === 0) {
    temporalSet.add("Dataset measurement period not specified by upstream source record.")
  }
  if (versionSet.size === 0) {
    versionSet.add("Upstream dataset version string unavailable in record metadata.")
  }

  return {
    datasetTemporalContext: [...temporalSet],
    sourceVersions: [...versionSet],
  }
}

function classifySourceOrigin(
  title: string,
  providerOrOrg: string,
  identifierOrVersion?: string
): ResearchSourceOriginKind {
  const combined = `${title} ${providerOrOrg}`.toLowerCase()
  if (
    combined.includes("open-meteo") ||
    combined.includes("nasa power") ||
    combined.includes("macrostrat")
  ) {
    return "live-provider"
  }
  if (identifierOrVersion && /doi|10\.\d{4}|journal|science|nature|astrobiology|icarus|jgr/i.test(combined + " " + identifierOrVersion)) {
    return "peer-reviewed-literature"
  }
  return "repository-dataset"
}

export function buildProposedTasksFromIntelligence(params: {
  intelligence: CandidateScientificIntelligence
  researchRecordId: string
  createdAt?: string
  existingTasks?: ResearchTask[]
}): ResearchTask[] {
  const { intelligence, researchRecordId, existingTasks = [] } = params
  const now = params.createdAt ?? new Date().toISOString()

  const existingByKey = new Set(
    existingTasks.map((t) => `${t.driverFeature ?? "none"}::${t.title.toLowerCase()}`)
  )

  const tasks: ResearchTask[] = []
  intelligence.followUpRecommendations.forEach((rec, idx) => {
    const key = `${rec.driverFeature ?? "none"}::${rec.title.toLowerCase()}`
    if (existingByKey.has(key)) return

    const featExplanation = rec.driverFeature
      ? intelligence.featureExplanations.find((f) => f.key === rec.driverFeature)
      : undefined
    const relatedGap = featExplanation
      ? `${featExplanation.label} (${featExplanation.comparisonStatus.replace("_", " ")}, ${featExplanation.evidenceClassification})`
      : "Mission-level evidence / planetary boundary confirmation"

    tasks.push({
      id: `task-${sanitizeSafeToken(intelligence.candidateId, 16)}-${idx + 1}-${fnv1a32Hex(`${researchRecordId}:${rec.id}:${now}`).slice(0, 6)}`,
      researchRecordId,
      candidateId: intelligence.candidateId,
      title: rec.title,
      scientificRationale: rec.rationale,
      relatedGap,
      driverFeature: rec.driverFeature,
      suggestedObservationMethod: rec.action,
      priority: rec.missionRelevance,
      status: "identified",
      // Must remain recommended-not-completed even if workflow status becomes closed
      observationStatus: "recommended-not-completed",
      createdAt: now,
      updatedAt: now,
    })
  })

  return tasks
}

export function buildResearchSnapshot(params: {
  recordId: string
  revisionNumber: number
  revisionLabel: string
  candidateResult?: DiscoveryCandidateResult | null
  atlasSite?: DiscoveryAtlasEntry | null
  target: PlanetaryTarget
  missionProfile: ConfigurableMissionProfile | MissionPurposeDefinition
  intelligence: CandidateScientificIntelligence
  providerTelemetry?: ProviderTelemetryStatus[]
  searchMetadata?: RegionalDiscoveryResponse["searchMetadata"]
  createdAt?: string
}): ResearchSnapshot {
  const {
    recordId,
    revisionNumber,
    revisionLabel,
    candidateResult,
    atlasSite,
    target,
    missionProfile,
    intelligence,
    providerTelemetry = [],
    searchMetadata,
  } = params

  const rawCandidate: EarthCandidate | undefined = candidateResult?.candidate ?? atlasSite ?? undefined
  if (!rawCandidate) {
    throw new Error("Either a live candidateResult or a curated atlasSite is required.")
  }

  const candidateClone = deepCloneJson(rawCandidate)
  const targetClone = deepCloneJson(target)
  const intelligenceClone = deepCloneJson(intelligence)
  const featureScoresClone = deepCloneJson(candidateResult?.featureScores ?? [])
  const telemetryClone = deepCloneJson(providerTelemetry)
  const searchMetaClone = searchMetadata ? deepCloneJson(searchMetadata) : undefined

  assertValidCandidateContext(candidateClone, targetClone)

  const createdAt = params.createdAt ?? new Date().toISOString()
  const coordinates: ResearchSnapshot["coordinates"] = {
    latitude: candidateClone.latitude,
    longitude: candidateClone.longitude,
    ...(candidateClone.boundingBox
      ? { boundingBox: [...candidateClone.boundingBox] as [number, number, number, number] }
      : {}),
  }

  const coreDigest = computeSnapshotContentDigest({
    schemaVersion: RESEARCH_SNAPSHOT_SCHEMA_VERSION,
    candidateId: candidateClone.id,
    targetId: targetClone.id,
    missionProfileId: missionProfile.id,
    coordinates,
    score: intelligenceClone.score,
    coverage: intelligenceClone.coverage,
    environment: candidateClone.environment,
    featureScores: featureScoresClone,
    validationChecklist: intelligenceClone.checklist,
    researchPriority: intelligenceClone.researchPriority,
  })

  const uniqueTag = fnv1a32Hex(`${recordId}:${revisionNumber}:${createdAt}:${coreDigest}`).slice(0, 8)
  const snapshotId = `ttw-snap-${sanitizeSafeToken(candidateClone.id, 18)}-r${revisionNumber}-${uniqueTag}`

  const { datasetTemporalContext, sourceVersions } = extractTemporalAndVersionMetadata(
    intelligenceClone,
    candidateClone,
    searchMetaClone
  )

  const sourceReferences: ResearchEvidenceReference[] = intelligenceClone.sourceReferences.map((s) => ({
    ...s,
    originKind: classifySourceOrigin(s.title, s.providerOrOrg, s.identifierOrVersion),
  }))

  const warnings: string[] = [
    ...(candidateResult?.warnings ?? []),
    ...(searchMetaClone ? [] : []),
    ...intelligenceClone.mismatches
      .filter((m) => m.kind === "unknown")
      .map((m) => `${m.title}: ${m.detail}`),
  ]

  const dedupWarnings = [...new Set(warnings)]
  const limitations = [...new Set(intelligenceClone.scientificCaveats)]
  const isVerified = candidateClone.isVerified === true
  const verificationStateSummary =
    intelligenceClone.candidateSourceKind === "live-grid-cell"
      ? "Unverified regional screening lead (isVerified: false)"
      : isVerified
      ? "Verified catalog / literature reference record (screening only; requires mission-specific field audit)"
      : "Curated atlas archive record (not independently certified for mission operations)"

  return {
    snapshotId,
    schemaVersion: RESEARCH_SNAPSHOT_SCHEMA_VERSION,
    contentDigest: coreDigest,
    digestScopeNote: DIGEST_SCOPE_NOTE,
    revisionNumber,
    revisionLabel,
    createdAt,
    candidateId: candidateClone.id,
    candidateName: candidateClone.name,
    candidateSourceKind: intelligenceClone.candidateSourceKind,
    noveltyTier: candidateClone.noveltyTier ?? "unspecified",
    coordinates,
    candidate: candidateClone,
    target: targetClone,
    missionProfileId: missionProfile.id,
    missionProfileLabel: missionProfile.label,
    score: intelligenceClone.score,
    scoreDisplay: intelligenceClone.scoreDisplay,
    coverage: intelligenceClone.coverage,
    isReliable: intelligenceClone.isReliable,
    isVerified,
    verificationStateSummary,
    featureScores: featureScoresClone,
    intelligence: intelligenceClone,
    validationChecklist: intelligenceClone.checklist,
    providerTelemetry: telemetryClone,
    ...(searchMetaClone ? { searchMetadata: searchMetaClone } : {}),
    sourceReferences,
    scientificLimitations: limitations,
    dataAvailabilityWarnings: dedupWarnings,
    reportMetadata: {
      reportTitle: "TerraTwin Scientific Analog Candidate Assessment",
      reportSubtitle: "Mission-Specific Earth Analog Screening & Research Validation Record",
      reportVersion: RESEARCH_REPORT_VERSION,
      candidateId: candidateClone.id,
      candidateName: candidateClone.name,
      snapshotId,
      snapshotSchemaVersion: RESEARCH_SNAPSHOT_SCHEMA_VERSION,
      contentDigest: coreDigest,
      digestNote: DIGEST_SCOPE_NOTE,
      generatedAt: createdAt,
      datasetTemporalContext,
      sourceVersions,
      methodologyVersion: TERRATWIN_METHODOLOGY_VERSION,
      missionProfileId: missionProfile.id,
      missionProfileLabel: missionProfile.label,
      targetId: targetClone.id,
      targetName: targetClone.name,
      targetBody: targetClone.body,
      storageMode: "browser-local-and-explicit-export",
      storageNotice: RESEARCH_STORAGE_DISCLOSURE,
    },
  }
}

export function createResearchAssessmentRecord(params: {
  candidateResult?: DiscoveryCandidateResult | null
  atlasSite?: DiscoveryAtlasEntry | null
  target: PlanetaryTarget
  missionProfile: ConfigurableMissionProfile | MissionPurposeDefinition
  intelligence: CandidateScientificIntelligence
  providerTelemetry?: ProviderTelemetryStatus[]
  searchMetadata?: RegionalDiscoveryResponse["searchMetadata"]
  revisionLabel?: string
  createdAt?: string
}): ResearchAssessmentRecord {
  const createdAt = params.createdAt ?? new Date().toISOString()
  const contextKey = buildResearchContextKey(
    params.intelligence.candidateId,
    params.target.id,
    params.missionProfile.id
  )
  const recordId = `ttw-rec-${sanitizeSafeToken(params.intelligence.candidateId, 16)}-${fnv1a32Hex(`${contextKey}:${createdAt}`)}`

  const snapshot = buildResearchSnapshot({
    recordId,
    revisionNumber: 1,
    revisionLabel: params.revisionLabel?.trim() || "Assessment A — Initial Screening Snapshot",
    candidateResult: params.candidateResult,
    atlasSite: params.atlasSite,
    target: params.target,
    missionProfile: params.missionProfile,
    intelligence: params.intelligence,
    providerTelemetry: params.providerTelemetry,
    searchMetadata: params.searchMetadata,
    createdAt,
  })

  const tasks = buildProposedTasksFromIntelligence({
    intelligence: snapshot.intelligence,
    researchRecordId: recordId,
    createdAt,
  })

  return {
    recordId,
    contextKey,
    candidateId: snapshot.candidateId,
    candidateName: snapshot.candidateName,
    targetId: snapshot.target.id,
    missionProfileId: snapshot.missionProfileId,
    createdAt,
    updatedAt: createdAt,
    storageMode: "browser-local-and-explicit-export",
    storageNotice: RESEARCH_STORAGE_DISCLOSURE,
    snapshot,
    revisionHistory: [
      {
        revisionNumber: 1,
        label: snapshot.revisionLabel,
        createdAt,
        snapshotId: snapshot.snapshotId,
        snapshot,
      },
    ],
    tasks,
    notes: [],
  }
}

export function appendAssessmentRevision(params: {
  record: ResearchAssessmentRecord
  candidateResult?: DiscoveryCandidateResult | null
  atlasSite?: DiscoveryAtlasEntry | null
  target: PlanetaryTarget
  missionProfile: ConfigurableMissionProfile | MissionPurposeDefinition
  intelligence: CandidateScientificIntelligence
  providerTelemetry?: ProviderTelemetryStatus[]
  searchMetadata?: RegionalDiscoveryResponse["searchMetadata"]
  revisionLabel?: string
  createdAt?: string
}): ResearchAssessmentRecord {
  const { record, target, missionProfile } = params
  if (
    record.candidateId !== params.intelligence.candidateId ||
    record.targetId !== target.id ||
    record.missionProfileId !== missionProfile.id
  ) {
    throw new Error(
      "Cannot append a revision under a mismatched candidate, target, or mission profile context. Create a separate research record for the new context."
    )
  }

  const createdAt = params.createdAt ?? new Date().toISOString()
  const nextRevisionNumber =
    (record.revisionHistory[record.revisionHistory.length - 1]?.revisionNumber ?? 1) + 1
  const letter = String.fromCharCode(64 + Math.min(26, nextRevisionNumber))
  const defaultLabel = `Assessment ${letter} — Evidence Review Snapshot`

  const nextSnapshot = buildResearchSnapshot({
    recordId: record.recordId,
    revisionNumber: nextRevisionNumber,
    revisionLabel: params.revisionLabel?.trim() || defaultLabel,
    candidateResult: params.candidateResult,
    atlasSite: params.atlasSite,
    target,
    missionProfile,
    intelligence: params.intelligence,
    providerTelemetry: params.providerTelemetry,
    searchMetadata: params.searchMetadata,
    createdAt,
  })

  return {
    ...record,
    updatedAt: createdAt,
    snapshot: nextSnapshot,
    revisionHistory: [
      ...record.revisionHistory,
      {
        revisionNumber: nextRevisionNumber,
        label: nextSnapshot.revisionLabel,
        createdAt,
        snapshotId: nextSnapshot.snapshotId,
        snapshot: nextSnapshot,
      },
    ],
  }
}

export function mergeMissingProposedTasks(
  record: ResearchAssessmentRecord,
  intelligence: CandidateScientificIntelligence,
  now?: string
): ResearchAssessmentRecord {
  const added = buildProposedTasksFromIntelligence({
    intelligence,
    researchRecordId: record.recordId,
    createdAt: now,
    existingTasks: record.tasks,
  })
  if (added.length === 0) return record
  const updatedAt = now ?? new Date().toISOString()
  return {
    ...record,
    updatedAt,
    tasks: [...record.tasks, ...added],
  }
}

export function updateResearchTaskStatus(
  record: ResearchAssessmentRecord,
  taskId: string,
  nextStatus: ResearchTaskStatus,
  options?: { owner?: string; notes?: string; now?: string }
): ResearchAssessmentRecord {
  const now = options?.now ?? new Date().toISOString()
  let found = false
  const nextTasks = record.tasks.map((task) => {
    if (task.id !== taskId) return task
    found = true
    const cleanOwner =
      options?.owner !== undefined ? options.owner.trim().slice(0, 80) : task.owner
    const cleanNotes =
      options?.notes !== undefined
        ? options.notes.trim().slice(0, MAX_TASK_NOTE_LENGTH)
        : task.notes

    return {
      ...task,
      status: nextStatus,
      // Explicitly keep observationStatus unchanged and never promote candidate.isVerified
      observationStatus: "recommended-not-completed" as const,
      ...(cleanOwner !== undefined ? { owner: cleanOwner || undefined } : {}),
      ...(cleanNotes !== undefined ? { notes: cleanNotes || undefined } : {}),
      updatedAt: now,
      completedAt: nextStatus === "closed" ? (task.completedAt ?? now) : undefined,
    }
  })

  if (!found) {
    throw new Error(`Research task "${taskId}" was not found in record "${record.recordId}".`)
  }

  return {
    ...record,
    updatedAt: now,
    tasks: nextTasks,
  }
}

export function addUserResearchNote(
  record: ResearchAssessmentRecord,
  input: {
    title: string
    body: string
    relatedFeature?: FeatureKey | "general"
    userSuppliedSourceUrl?: string
    linkedTaskId?: string
    now?: string
  }
): ResearchAssessmentRecord {
  const cleanTitle = input.title.trim().slice(0, MAX_NOTE_TITLE_LENGTH)
  const cleanBody = input.body.trim().slice(0, MAX_NOTE_BODY_LENGTH)
  if (!cleanTitle) {
    throw new Error("Research note title cannot be empty.")
  }
  if (!cleanBody) {
    throw new Error("Research note body cannot be empty.")
  }

  const safeUrl = validateUserHttpUrl(input.userSuppliedSourceUrl)
  const now = input.now ?? new Date().toISOString()
  const noteId = `note-${fnv1a32Hex(`${record.recordId}:${cleanTitle}:${now}:${record.notes.length}`)}`

  const newNote: ResearchValidationNote = {
    id: noteId,
    researchRecordId: record.recordId,
    candidateId: record.candidateId,
    title: cleanTitle,
    body: cleanBody,
    authorRole: "user-authored-research-note",
    relatedFeature: input.relatedFeature ?? "general",
    ...(safeUrl ? { userSuppliedSourceUrl: safeUrl } : {}),
    ...(input.linkedTaskId ? { linkedTaskId: input.linkedTaskId } : {}),
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...record,
    updatedAt: now,
    notes: [newNote, ...record.notes],
  }
}

export function serializeResearchRecordJson(record: ResearchAssessmentRecord): string {
  return JSON.stringify(
    {
      terratwinExportFormat: "terratwin-research-snapshot",
      schemaVersion: record.snapshot.schemaVersion,
      exportedAt: new Date().toISOString(),
      disclaimer:
        "Reproducible research record snapshot exported from TerraTwin browser workspace. User-authored notes are not verified telemetry.",
      record,
    },
    null,
    2
  )
}

const FORBIDDEN_JSON_KEYS = new Set(["__proto__", "constructor", "prototype"])

function sanitizeJsonNoPrototypeKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map(sanitizeJsonNoPrototypeKeys)
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_JSON_KEYS.has(k)) continue
    clean[k] = sanitizeJsonNoPrototypeKeys(v)
  }
  return clean
}

export function validateAndImportResearchRecord(
  rawJsonText: string
): ResearchAssessmentRecord {
  if (!rawJsonText || rawJsonText.length > MAX_JSON_IMPORT_BYTES) {
    throw new Error("Imported JSON snapshot is empty or exceeds size safety limit (1.5 MB).")
  }

  let parsedRaw: unknown
  try {
    parsedRaw = JSON.parse(rawJsonText)
  } catch {
    throw new Error("Imported file is not valid JSON.")
  }

  if (!parsedRaw || typeof parsedRaw !== "object" || Array.isArray(parsedRaw)) {
    throw new Error("Imported JSON root must be an object.")
  }

  const parsed = sanitizeJsonNoPrototypeKeys(parsedRaw) as Record<string, unknown>
  const maybeRecord = (parsed.record && typeof parsed.record === "object"
    ? parsed.record
    : parsed) as Partial<ResearchAssessmentRecord>

  if (
    !maybeRecord.recordId ||
    !maybeRecord.candidateId ||
    !maybeRecord.snapshot ||
    typeof maybeRecord.snapshot !== "object"
  ) {
    throw new Error("Missing required research record fields (recordId, candidateId, snapshot).")
  }

  const snap = maybeRecord.snapshot as Partial<ResearchSnapshot>
  if (snap.schemaVersion !== RESEARCH_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported snapshot schemaVersion "${String(snap.schemaVersion)}". Expected "${RESEARCH_SNAPSHOT_SCHEMA_VERSION}".`
    )
  }

  if (
    !snap.snapshotId ||
    !snap.candidate ||
    !snap.target ||
    !snap.intelligence ||
    !snap.coordinates ||
    !Number.isFinite(snap.coordinates.latitude) ||
    !Number.isFinite(snap.coordinates.longitude) ||
    snap.coordinates.latitude < -90 ||
    snap.coordinates.latitude > 90 ||
    snap.coordinates.longitude < -180 ||
    snap.coordinates.longitude > 180
  ) {
    throw new Error("Imported snapshot failed structural coordinate or intelligence validation.")
  }

  const cloned = deepCloneJson(maybeRecord as ResearchAssessmentRecord)

  const expectedDigest = computeSnapshotContentDigest({
    schemaVersion: cloned.snapshot.schemaVersion,
    candidateId: cloned.snapshot.candidateId ?? cloned.snapshot.candidate.id,
    targetId: cloned.snapshot.target.id,
    missionProfileId:
      cloned.snapshot.missionProfileId ?? cloned.snapshot.intelligence.missionProfileId,
    coordinates: cloned.snapshot.coordinates,
    score: cloned.snapshot.score ?? null,
    coverage: cloned.snapshot.coverage ?? null,
    environment: cloned.snapshot.candidate.environment,
    featureScores: cloned.snapshot.featureScores ?? [],
    validationChecklist:
      cloned.snapshot.validationChecklist ?? cloned.snapshot.intelligence.checklist,
    researchPriority: cloned.snapshot.intelligence.researchPriority,
  })
  if (!cloned.snapshot.contentDigest || cloned.snapshot.contentDigest !== expectedDigest) {
    throw new Error(
      "Imported snapshot failed contentDigest integrity verification: core telemetry, score, coverage, or metadata was modified outside TerraTwin."
    )
  }

  // Integrity protection: live grid cells imported from user JSON may never elevate isVerified
  if (cloned.snapshot.candidateSourceKind === "live-grid-cell") {
    cloned.snapshot.isVerified = false
    cloned.snapshot.candidate.isVerified = false
    cloned.snapshot.verificationStateSummary =
      "Unverified regional screening lead (isVerified: false)"
  }
  cloned.storageMode = "browser-local-and-explicit-export"
  cloned.contextKey = buildResearchContextKey(
    cloned.candidateId,
    cloned.snapshot.target.id,
    cloned.snapshot.missionProfileId ?? cloned.snapshot.intelligence.missionProfileId
  )
  cloned.notes = (cloned.notes ?? []).map((n) => ({
    ...n,
    authorRole: "user-authored-research-note",
    title: String(n.title ?? "").slice(0, MAX_NOTE_TITLE_LENGTH),
    body: String(n.body ?? "").slice(0, MAX_NOTE_BODY_LENGTH),
    userSuppliedSourceUrl: n.userSuppliedSourceUrl
      ? validateUserHttpUrl(n.userSuppliedSourceUrl)
      : undefined,
  }))
  const allowedStatuses = new Set<string>(RESEARCH_TASK_STATUS_ORDER)
  cloned.tasks = (cloned.tasks ?? []).map((t) => ({
    ...t,
    status: allowedStatuses.has(t.status) ? t.status : "identified",
    owner: t.owner ? String(t.owner).slice(0, 80) : undefined,
    notes: t.notes ? String(t.notes).slice(0, MAX_TASK_NOTE_LENGTH) : undefined,
    observationStatus: "recommended-not-completed",
  }))

  return cloned
}

export function loadResearchRecordsFromStorage(): Record<string, ResearchAssessmentRecord> {
  if (typeof window === "undefined" || !window.localStorage) return {}
  try {
    const raw = window.localStorage.getItem(RESEARCH_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const valid: Record<string, ResearchAssessmentRecord> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v && typeof v === "object" && "snapshot" in v && "recordId" in v) {
        valid[k] = v as ResearchAssessmentRecord
      }
    }
    return valid
  } catch {
    return {}
  }
}

export function saveResearchRecordsToStorage(
  records: Record<string, ResearchAssessmentRecord>
): { ok: boolean; error?: string } {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ok: false, error: "Browser localStorage is unavailable." }
  }
  try {
    const entries = Object.entries(records)
      .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))
      .slice(0, MAX_STORED_RESEARCH_RECORDS)
    const bounded = Object.fromEntries(entries)
    window.localStorage.setItem(RESEARCH_STORAGE_KEY, JSON.stringify(bounded))
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to persist to browser storage.",
    }
  }
}

export function verifySnapshotIntegrity(rawSnap: ResearchSnapshot): ResearchSnapshot {
  const snap = deepCloneJson(rawSnap)
  if (snap.schemaVersion !== RESEARCH_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported snapshot schemaVersion "${String(snap.schemaVersion)}". Expected "${RESEARCH_SNAPSHOT_SCHEMA_VERSION}".`
    )
  }
  if (
    !snap.snapshotId ||
    !snap.candidate ||
    !snap.target ||
    !snap.intelligence ||
    !snap.coordinates ||
    !Number.isFinite(snap.coordinates.latitude) ||
    !Number.isFinite(snap.coordinates.longitude) ||
    snap.coordinates.latitude < -90 ||
    snap.coordinates.latitude > 90 ||
    snap.coordinates.longitude < -180 ||
    snap.coordinates.longitude > 180
  ) {
    throw new Error("Snapshot failed structural coordinate or intelligence validation.")
  }

  const expectedDigest = computeSnapshotContentDigest({
    schemaVersion: snap.schemaVersion,
    candidateId: snap.candidateId ?? snap.candidate.id,
    targetId: snap.target.id,
    missionProfileId: snap.missionProfileId ?? snap.intelligence.missionProfileId,
    coordinates: snap.coordinates,
    score: snap.score ?? null,
    coverage: snap.coverage ?? null,
    environment: snap.candidate.environment,
    featureScores: snap.featureScores ?? [],
    validationChecklist: snap.validationChecklist ?? snap.intelligence.checklist,
    researchPriority: snap.intelligence.researchPriority,
  })
  if (!snap.contentDigest || snap.contentDigest !== expectedDigest) {
    throw new Error(
      `Snapshot "${snap.snapshotId}" failed contentDigest integrity verification: core telemetry, score, coverage, or metadata was modified.`
    )
  }

  if (snap.candidateSourceKind === "live-grid-cell") {
    snap.isVerified = false
    snap.candidate.isVerified = false
    snap.verificationStateSummary = "Unverified regional screening lead (isVerified: false)"
  }
  return snap
}

export function verifyResearchRecordScientificIntegrity(
  rawRecord: ResearchAssessmentRecord
): ResearchAssessmentRecord {
  const validatedJson = serializeResearchRecordJson(rawRecord)
  const base = validateAndImportResearchRecord(validatedJson)
  const rawRevs =
    Array.isArray(rawRecord.revisionHistory) && rawRecord.revisionHistory.length > 0
      ? rawRecord.revisionHistory
      : [
          {
            revisionNumber: base.snapshot.revisionNumber ?? 1,
            label: base.snapshot.revisionLabel,
            createdAt: base.snapshot.createdAt,
            snapshotId: base.snapshot.snapshotId,
            snapshot: base.snapshot,
          },
        ]

  const verifiedRevisions: ResearchAssessmentRevision[] = rawRevs.map((rev, idx) => {
    const verifiedSnap = verifySnapshotIntegrity(rev.snapshot)
    if (
      verifiedSnap.candidateId !== base.candidateId ||
      verifiedSnap.target.id !== base.targetId ||
      verifiedSnap.missionProfileId !== base.missionProfileId
    ) {
      throw new Error(
        `Revision "${rev.snapshotId}" context does not match parent research record "${base.contextKey}".`
      )
    }
    const revNum =
      Number.isInteger(rev.revisionNumber) && rev.revisionNumber >= 1
        ? rev.revisionNumber
        : idx + 1
    return {
      revisionNumber: revNum,
      label: String(rev.label || verifiedSnap.revisionLabel).slice(0, 160),
      createdAt: rev.createdAt || verifiedSnap.createdAt,
      snapshotId: verifiedSnap.snapshotId,
      snapshot: {
        ...verifiedSnap,
        revisionNumber: revNum,
      },
    }
  })

  verifiedRevisions.sort((a, b) => a.revisionNumber - b.revisionNumber)
  const latestRev = verifiedRevisions[verifiedRevisions.length - 1]

  return {
    ...base,
    ...(rawRecord.ownerUserId ? { ownerUserId: rawRecord.ownerUserId } : {}),
    ...(rawRecord.lastSyncedAt ? { lastSyncedAt: rawRecord.lastSyncedAt } : {}),
    storageMode: rawRecord.storageMode ?? base.storageMode,
    storageNotice:
      rawRecord.storageMode === "supabase-cloud-rls-and-local-cache"
        ? RESEARCH_CLOUD_STORAGE_DISCLOSURE
        : base.storageNotice,
    snapshot: latestRev ? latestRev.snapshot : base.snapshot,
    revisionHistory: verifiedRevisions,
  }
}

/**
 * Non-destructively merges two versions of the same contextKey research record
 * (e.g., local offline edits vs. remote cloud state, or localStorage import vs. cloud).
 * Historical immutable revisions are NEVER overwritten or discarded.
 */
export function mergeResearchAssessmentRecords(
  existingRecord: ResearchAssessmentRecord,
  incomingRecord: ResearchAssessmentRecord
): {
  merged: ResearchAssessmentRecord
  hadRevisionConflict: boolean
  addedRevisions: number
  addedNotes: number
  mergedTasks: number
} {
  const cleanExisting = verifyResearchRecordScientificIntegrity(existingRecord)
  const cleanIncoming = verifyResearchRecordScientificIntegrity(incomingRecord)

  if (cleanExisting.contextKey !== cleanIncoming.contextKey) {
    throw new Error(
      `Cannot merge records with different contextKeys ("${cleanExisting.contextKey}" vs "${cleanIncoming.contextKey}").`
    )
  }

  // 1. Merge immutable revisions without ever overwriting an existing snapshotId
  const revBySnapshotId = new Map<string, ResearchAssessmentRevision>()
  const usedRevisionNumbers = new Set<number>()
  let maxRevNum = 0

  for (const rev of cleanExisting.revisionHistory) {
    revBySnapshotId.set(rev.snapshotId, deepCloneJson(rev))
    usedRevisionNumbers.add(rev.revisionNumber)
    if (rev.revisionNumber > maxRevNum) maxRevNum = rev.revisionNumber
  }

  let hadRevisionConflict = false
  let addedRevisions = 0

  for (const incRev of cleanIncoming.revisionHistory) {
    const existingSameSnap = revBySnapshotId.get(incRev.snapshotId)
    if (existingSameSnap) {
      // Verify immutable digest match; never mutate existing revision snapshot
      if (existingSameSnap.snapshot.contentDigest !== incRev.snapshot.contentDigest) {
        throw new Error(
          `Immutable snapshot conflict: snapshotId "${incRev.snapshotId}" has a mismatched contentDigest.`
        )
      }
      continue
    }

    // Also check if an identical contentDigest + createdAt already exists under another revision entry
    const duplicateDigestAndTime = [...revBySnapshotId.values()].some(
      (r) =>
        r.snapshot.contentDigest === incRev.snapshot.contentDigest &&
        r.createdAt === incRev.createdAt
    )
    if (duplicateDigestAndTime) {
      continue
    }

    let assignedRevNum = incRev.revisionNumber
    let assignedLabel = incRev.label
    if (usedRevisionNumbers.has(assignedRevNum)) {
      hadRevisionConflict = true
      maxRevNum += 1
      assignedRevNum = maxRevNum
      if (!assignedLabel.includes("(Synced Revision")) {
        assignedLabel = `${assignedLabel} (Synced Revision #${assignedRevNum})`
      }
    } else if (assignedRevNum > maxRevNum) {
      maxRevNum = assignedRevNum
    }

    usedRevisionNumbers.add(assignedRevNum)
    addedRevisions += 1
    const clonedSnap = deepCloneJson(incRev.snapshot)
    clonedSnap.revisionNumber = assignedRevNum
    clonedSnap.revisionLabel = assignedLabel

    revBySnapshotId.set(incRev.snapshotId, {
      revisionNumber: assignedRevNum,
      label: assignedLabel,
      createdAt: incRev.createdAt,
      snapshotId: incRev.snapshotId,
      snapshot: clonedSnap,
    })
  }

  const mergedRevisions = [...revBySnapshotId.values()].sort(
    (a, b) => a.revisionNumber - b.revisionNumber
  )
  const activeRevision = mergedRevisions[mergedRevisions.length - 1]

  // 2. Merge tasks by task.id or semantic (driverFeature::title), keeping newer updatedAt
  const taskMap = new Map<string, ResearchTask>()
  const semanticKeyToTaskId = new Map<string, string>()

  const registerTask = (task: ResearchTask) => {
    const semKey = `${task.driverFeature ?? "none"}::${task.title.toLowerCase()}`
    const existingId = taskMap.has(task.id) ? task.id : semanticKeyToTaskId.get(semKey)
    if (!existingId) {
      const normalized: ResearchTask = {
        ...deepCloneJson(task),
        researchRecordId: cleanExisting.recordId,
        observationStatus: "recommended-not-completed",
      }
      taskMap.set(normalized.id, normalized)
      semanticKeyToTaskId.set(semKey, normalized.id)
      return false
    }
    const current = taskMap.get(existingId)!
    if (task.updatedAt.localeCompare(current.updatedAt) > 0) {
      const updatedTask: ResearchTask = {
        ...deepCloneJson(task),
        id: current.id,
        researchRecordId: cleanExisting.recordId,
        observationStatus: "recommended-not-completed",
      }
      taskMap.set(current.id, updatedTask)
      return true
    }
    return false
  }

  for (const t of cleanExisting.tasks) registerTask(t)
  let mergedTasks = 0
  for (const t of cleanIncoming.tasks) {
    if (registerTask(t)) mergedTasks += 1
  }

  // 3. Merge user-authored notes without duplicates
  const noteMap = new Map<string, ResearchValidationNote>()
  const noteSignatureSet = new Set<string>()
  for (const n of cleanExisting.notes) {
    const sig = `${n.title.toLowerCase()}::${n.body.toLowerCase()}`
    noteMap.set(n.id, deepCloneJson(n))
    noteSignatureSet.add(sig)
  }

  let addedNotes = 0
  for (const n of cleanIncoming.notes) {
    const sig = `${n.title.toLowerCase()}::${n.body.toLowerCase()}`
    if (noteMap.has(n.id) || noteSignatureSet.has(sig)) continue
    noteMap.set(n.id, {
      ...deepCloneJson(n),
      researchRecordId: cleanExisting.recordId,
      authorRole: "user-authored-research-note",
    })
    noteSignatureSet.add(sig)
    addedNotes += 1
  }

  const mergedNotes = [...noteMap.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )

  const latestUpdatedAt =
    cleanIncoming.updatedAt.localeCompare(cleanExisting.updatedAt) > 0
      ? cleanIncoming.updatedAt
      : cleanExisting.updatedAt

  const merged: ResearchAssessmentRecord = {
    ...cleanExisting,
    updatedAt: latestUpdatedAt,
    snapshot: activeRevision.snapshot,
    revisionHistory: mergedRevisions,
    tasks: [...taskMap.values()],
    notes: mergedNotes,
  }

  return {
    merged,
    hadRevisionConflict,
    addedRevisions,
    addedNotes,
    mergedTasks,
  }
}

export function loadUserCloudCacheFromStorage(
  userId: string
): Record<string, ResearchAssessmentRecord> {
  if (typeof window === "undefined" || !window.localStorage || !userId) return {}
  try {
    const raw = window.localStorage.getItem(`${RESEARCH_USER_CLOUD_CACHE_PREFIX}${userId}`)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const valid: Record<string, ResearchAssessmentRecord> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v && typeof v === "object" && "snapshot" in v && "recordId" in v) {
        valid[k] = v as ResearchAssessmentRecord
      }
    }
    return valid
  } catch {
    return {}
  }
}

export function saveUserCloudCacheToStorage(
  userId: string,
  records: Record<string, ResearchAssessmentRecord>
): void {
  if (typeof window === "undefined" || !window.localStorage || !userId) return
  try {
    const entries = Object.entries(records)
      .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))
      .slice(0, MAX_STORED_RESEARCH_RECORDS)
    window.localStorage.setItem(
      `${RESEARCH_USER_CLOUD_CACHE_PREFIX}${userId}`,
      JSON.stringify(Object.fromEntries(entries))
    )
  } catch {
    // Ignore storage quota warnings on mirror cache
  }
}

export function loadPendingSyncQueueFromStorage(
  userId: string
): PendingWorkspaceSyncOperation[] {
  if (typeof window === "undefined" || !window.localStorage || !userId) return []
  try {
    const raw = window.localStorage.getItem(`${RESEARCH_USER_PENDING_QUEUE_PREFIX}${userId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is PendingWorkspaceSyncOperation =>
        Boolean(item && typeof item === "object" && item.userId === userId && item.contextKey)
    )
  } catch {
    return []
  }
}

export function savePendingSyncQueueToStorage(
  userId: string,
  ops: PendingWorkspaceSyncOperation[]
): void {
  if (typeof window === "undefined" || !window.localStorage || !userId) return
  try {
    window.localStorage.setItem(
      `${RESEARCH_USER_PENDING_QUEUE_PREFIX}${userId}`,
      JSON.stringify(ops.slice(-50))
    )
  } catch {
    // Ignore storage quota errors
  }
}
