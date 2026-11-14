import type {
  ResearchAssessmentRecord,
  ResearchEvidenceReference,
} from "../types/research-workflow.ts"

const FORMULA_INJECTION_PREFIX_REGEX = /^[\s\u00A0]*[=+\-@\t\r]/

export function sanitizeExportFilename(rawBase: string, extension: string): string {
  const cleanExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "txt"
  const cleanBase =
    rawBase
      .replace(/\.\./g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 128) || "TerraTwin_Export"
  return `${cleanBase}.${cleanExt}`
}

/**
 * Escapes and formula-hardens a single CSV cell per RFC 4180 + OWASP CSV Injection rules:
 * - null / undefined -> "" (strictly distinct from numeric 0)
 * - finite numbers (including negative observations like -55 C or -2651 m) remain unprefixed numeric literals
 * - strings starting with =, +, -, @, TAB, or CR (even after leading whitespace) are prefixed with "'" and quoted
 */
export function formatCsvCell(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : ""
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  let str = String(value)
  if (FORMULA_INJECTION_PREFIX_REGEX.test(str)) {
    str = `'${str}`
  }

  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.startsWith("'")
  ) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function buildCsvDocument(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number | boolean | null | undefined>>
): string {
  const lines = [
    headers.map((h) => formatCsvCell(h)).join(","),
    ...rows.map((row) => row.map((cell) => formatCsvCell(cell)).join(",")),
  ]
  return lines.join("\r\n")
}

export function generateCandidateSummaryCsv(
  input: ResearchAssessmentRecord | ResearchAssessmentRecord[],
  exportTimestamp = new Date().toISOString()
): string {
  const records = Array.isArray(input) ? input : [input]
  const headers = [
    "candidate_id",
    "candidate_name",
    "candidate_type",
    "latitude_deg",
    "longitude_deg",
    "bounding_box_minlat_minlon_maxlat_maxlon",
    "planetary_target_id",
    "planetary_target_name",
    "planetary_body",
    "mission_profile_id",
    "mission_profile_label",
    "similarity_score_pct",
    "weighted_coverage_pct",
    "is_reliable_ge_40pct",
    "verification_status",
    "verification_summary",
    "novelty_tier",
    "research_priority_level",
    "research_priority_label",
    "validation_status",
    "tasks_total",
    "tasks_closed",
    "notes_count",
    "snapshot_id",
    "snapshot_schema_version",
    "content_digest",
    "methodology_version",
    "snapshot_created_at",
    "export_timestamp",
  ] as const

  const rows = records.map((rec) => {
    const s = rec.snapshot
    const covPct =
      s.coverage !== null && Number.isFinite(s.coverage)
        ? Math.round(s.coverage * 1000) / 10
        : null
    const bboxStr = s.coordinates.boundingBox
      ? s.coordinates.boundingBox.map((n) => n.toFixed(4)).join(";")
      : null
    const closedCount = rec.tasks.filter((t) => t.status === "closed").length

    return [
      s.candidateId,
      s.candidateName,
      s.candidateSourceKind,
      Number(s.coordinates.latitude.toFixed(6)),
      Number(s.coordinates.longitude.toFixed(6)),
      bboxStr,
      s.target.id,
      s.target.name,
      s.target.body,
      s.missionProfileId,
      s.missionProfileLabel,
      s.score !== null && Number.isFinite(s.score) ? Number(s.score.toFixed(2)) : null,
      covPct,
      s.isReliable,
      s.isVerified ? "verified" : "unverified",
      s.verificationStateSummary,
      s.noveltyTier,
      s.intelligence.researchPriority.level,
      s.intelligence.researchPriority.label,
      s.intelligence.validationStatus,
      rec.tasks.length,
      closedCount,
      rec.notes.length,
      s.snapshotId,
      s.schemaVersion,
      s.contentDigest,
      s.reportMetadata.methodologyVersion,
      s.createdAt,
      exportTimestamp,
    ]
  })

  return buildCsvDocument(headers, rows)
}

export function generateScientificFeaturesCsv(
  record: ResearchAssessmentRecord,
  exportTimestamp = new Date().toISOString()
): string {
  const s = record.snapshot
  const headers = [
    "candidate_id",
    "candidate_name",
    "snapshot_id",
    "snapshot_schema_version",
    "planetary_target_id",
    "mission_profile_id",
    "feature_key",
    "feature_label",
    "earth_value",
    "target_reference_value",
    "unit",
    "feature_similarity_pct",
    "mission_weight",
    "comparability_status",
    "contribution_category",
    "evidence_classification",
    "data_origin",
    "verification_state",
    "source_title",
    "source_url",
    "spatial_resolution",
    "temporal_context",
    "quality_notes",
    "export_timestamp",
  ] as const

  const rows = s.intelligence.featureExplanations.map((f) => [
    s.candidateId,
    s.candidateName,
    s.snapshotId,
    s.schemaVersion,
    s.target.id,
    s.missionProfileId,
    f.key,
    f.label,
    f.earthValue,
    f.targetValue,
    f.unit || "categorical",
    f.similarity !== null && Number.isFinite(f.similarity)
      ? Math.round(f.similarity * 1000) / 10
      : null,
    Number(f.missionWeight.toFixed(4)),
    f.comparisonStatus,
    f.contributionCategory,
    f.evidenceClassification,
    f.dataOrigin,
    f.verificationState,
    f.sourceTitle ?? null,
    f.sourceUrl ?? null,
    f.spatialResolution ?? null,
    f.temporalCoverage ?? null,
    f.qualityNotes ?? null,
    exportTimestamp,
  ])

  return buildCsvDocument(headers, rows)
}

export function generateResearchTasksCsv(
  record: ResearchAssessmentRecord,
  exportTimestamp = new Date().toISOString()
): string {
  const s = record.snapshot
  const headers = [
    "task_id",
    "candidate_id",
    "research_record_id",
    "snapshot_id",
    "snapshot_schema_version",
    "planetary_target_id",
    "mission_profile_id",
    "title",
    "scientific_rationale",
    "related_feature_or_gap",
    "suggested_observation_method",
    "priority",
    "workflow_status",
    "observation_status",
    "owner",
    "created_at",
    "updated_at",
    "completed_at",
    "notes",
    "source_reference",
    "export_timestamp",
  ] as const

  const rows = record.tasks.map((t) => [
    t.id,
    t.candidateId,
    t.researchRecordId,
    s.snapshotId,
    s.schemaVersion,
    s.target.id,
    s.missionProfileId,
    t.title,
    t.scientificRationale,
    t.relatedGap,
    t.suggestedObservationMethod,
    t.priority,
    t.status,
    t.observationStatus,
    t.owner ?? null,
    t.createdAt,
    t.updatedAt,
    t.completedAt ?? null,
    t.notes ?? null,
    t.sourceReference ?? null,
    exportTimestamp,
  ])

  return buildCsvDocument(headers, rows)
}

export function generateProvenanceManifestCsv(
  record: ResearchAssessmentRecord,
  exportTimestamp = new Date().toISOString()
): string {
  const s = record.snapshot
  const headers = [
    "candidate_id",
    "snapshot_id",
    "snapshot_schema_version",
    "origin_kind",
    "title",
    "provider_or_org",
    "url",
    "identifier_or_version",
    "spatial_resolution",
    "temporal_coverage",
    "variables",
    "export_timestamp",
  ] as const

  const baseRefs: ResearchEvidenceReference[] = s.sourceReferences
  const userRefs: ResearchEvidenceReference[] = record.notes
    .filter((n) => Boolean(n.userSuppliedSourceUrl))
    .map((n) => ({
      originKind: "user-supplied-reference",
      title: `User Note Reference: ${n.title}`,
      providerOrOrg: "User-supplied (not independently verified by TerraTwin)",
      url: n.userSuppliedSourceUrl,
      variables: n.relatedFeature ?? "general",
    }))

  const rows = [...baseRefs, ...userRefs].map((ref) => [
    s.candidateId,
    s.snapshotId,
    s.schemaVersion,
    ref.originKind,
    ref.title,
    ref.providerOrOrg,
    ref.url ?? null,
    ref.identifierOrVersion ?? null,
    ref.resolution ?? null,
    ref.temporalCoverage ?? null,
    ref.variables ?? null,
    exportTimestamp,
  ])

  return buildCsvDocument(headers, rows)
}

/**
 * Strict RFC-4180 CSV parser handling quoted commas, escaped quotes (""), and embedded CRLF/LF newlines.
 */
export function parseCsvRows(csvText: string): string[][] {
  if (!csvText) return []
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i]
    const next = csvText[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(field)
      field = ""
    } else if (ch === "\r" && next === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      i++
    } else if (ch === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += ch
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
