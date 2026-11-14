import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { SAMPLE_TARGETS } from "../src/lib/terratwin/sample-dataset.ts"
import {
  GEOLOGICAL_RESEARCH_PROFILE,
  ROVER_TESTING_PROFILE,
} from "../src/lib/terratwin/config/comparison-config.ts"
import {
  evaluateFeatureComparison,
  computeAnalogSimilarity,
} from "../src/lib/terratwin/similarity-engine.ts"
import { COMPARISON_FEATURES } from "../src/lib/terratwin/config/comparison-config.ts"
import { getAllAtlasCandidates } from "../src/lib/terratwin/services/discovery-atlas-service.ts"
import {
  buildAtlasCandidateIntelligence,
  buildLiveCandidateIntelligence,
} from "../src/lib/terratwin/services/candidate-intelligence-service.ts"
import {
  addUserResearchNote,
  appendAssessmentRevision,
  canonicalSerialize,
  createResearchAssessmentRecord,
  serializeResearchRecordJson,
  updateResearchTaskStatus,
  validateAndImportResearchRecord,
  validateUserHttpUrl,
} from "../src/lib/terratwin/services/research-snapshot-service.ts"
import {
  formatCsvCell,
  generateCandidateSummaryCsv,
  generateProvenanceManifestCsv,
  generateResearchTasksCsv,
  generateScientificFeaturesCsv,
  parseCsvRows,
  sanitizeExportFilename,
} from "../src/lib/terratwin/utils/csv-export.ts"
import { generateScientificAssessmentPdf } from "../src/lib/terratwin/utils/pdf-report-generator.ts"

const ROOT = process.cwd()

const JEZERO_TARGET = SAMPLE_TARGETS.find((t) => t.id === "mars-jezero-delta") ?? SAMPLE_TARGETS[0]
const GALE_TARGET = SAMPLE_TARGETS.find((t) => t.id === "mars-gale-crater") ?? SAMPLE_TARGETS[0]

function buildLiveResult(id, name, envOverrides, profile = GEOLOGICAL_RESEARCH_PROFILE, target = JEZERO_TARGET) {
  const environment = {
    meanSurfaceTempC: -55,
    diurnalTempRangeC: 80,
    annualPrecipitationMm: 0,
    meanSlopeDeg: 5,
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    albedo: null,
    vegetationCoverPct: null,
    lithology: "clay-sedimentary",
    elevationM: -1200,
    surfacePressurePa: null,
    surfaceSolarIrradianceWm2: 152,
    ...envOverrides,
  }
  const provenanceMap = {
    elevationM: {
      status: "verified",
      dataOrigin: "live-api-estimate",
      verificationState: "unverified",
      evidenceClassification: "measured",
      sourceTitle: "Open-Meteo Copernicus DEM GLO-90",
      sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
      datasetVersion: "GLO-90",
      provider: "Open-Meteo",
      unit: "m",
      spatialResolution: "90 m grid",
      isComparable: true,
    },
    meanSlopeDeg: {
      status: "unverified",
      dataOrigin: "computed-derivative",
      verificationState: "unverified",
      evidenceClassification: "derived",
      sourceTitle: "Copernicus DEM 5-point gradient (~445 m)",
      sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
      unit: "deg",
      spatialResolution: "~445 m stencil",
      isComparable: true,
    },
    meanSurfaceTempC: {
      status: "unverified",
      dataOrigin: "live-api-estimate",
      verificationState: "unverified",
      evidenceClassification: "proxy",
      sourceTitle: "NASA POWER Climatology (MERRA-2 T2M)",
      sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
      datasetVersion: "v2.10.1",
      measurementPeriod: "2001-2025",
      unit: "°C",
      spatialResolution: "0.5° × 0.625°",
      isComparable: true,
    },
    lithology: {
      status: "unverified",
      dataOrigin: "live-api-estimate",
      verificationState: "unverified",
      evidenceClassification: "proxy",
      sourceTitle: "Macrostrat Geologic Map API v2",
      sourceUrl: "https://macrostrat.org/api/v2/mobile/map_query_v2",
      datasetVersion: "map_query_v2",
      unit: "categorical",
      spatialResolution: "1:250k–1:5M",
      isComparable: true,
    },
  }

  const candidate = {
    id,
    name,
    country: "Regional Scan",
    latitude: 37.35,
    longitude: 29.45,
    boundingBox: [37.1, 29.2, 37.6, 29.7],
    setting: "Regional carbonate lacustrine cell",
    summary: "Synthetic deterministic fixture for Phase 6.6 verification",
    environment,
    provenanceMap,
    isVerified: false,
    noveltyTier: "live-grid-discovery",
  }

  const featureScores = COMPARISON_FEATURES.map((def) =>
    evaluateFeatureComparison(
      def,
      profile.weights[def.key] ?? 0,
      target.environment[def.key] ?? null,
      candidate.environment[def.key] ?? null,
      target.provenanceMap?.[def.key],
      candidate.provenanceMap?.[def.key]
    )
  )
  const sim = computeAnalogSimilarity(target, candidate, {
    id: profile.id,
    weights: profile.weights,
  })

  return {
    rank: 1,
    candidate,
    score: sim.score,
    scoreDisplay: sim.score !== null ? `${sim.score.toFixed(1)}% (Exploratory)` : "Insufficient data to rank reliably",
    coverage: sim.coverage,
    confidence: sim.confidence,
    isReliable: sim.isReliable,
    weightedDistance: sim.weightedDistance,
    missingFeatures: featureScores.filter((f) => f.status === "missing_data").map((f) => f.key),
    incompatibleFeatures: [],
    featureScores,
    explanation: `Evaluated ${featureScores.filter((f) => f.status === "comparable").length} comparable features.`,
    warnings: sim.coverage < 0.4 ? ["Data coverage below 40% reliability gate."] : [],
  }
}

/**
 * Extracts readable literal strings from an uncompressed PDF stream for real parser assertions.
 */
function parsePdfStructureAndStrings(pdfBytes) {
  const raw = Buffer.from(pdfBytes).toString("latin1")
  const hasHeader = raw.startsWith("%PDF-1.4")
  const hasEof = raw.trimEnd().endsWith("%%EOF")
  const countMatch = raw.match(/\/Count\s+(\d+)/)
  const pageCount = countMatch ? Number(countMatch[1]) : 0
  const hasXref = raw.includes("\nxref\n") && raw.includes("startxref")

  // Validate xref byte offsets point cleanly to objects
  const xrefIdx = raw.indexOf("\nxref\n")
  const startxrefMatch = raw.match(/startxref\s+(\d+)/)
  const startxrefOffset = startxrefMatch ? Number(startxrefMatch[1]) : -1

  // Extract (...) PDF string tokens from content streams
  const extractedStrings = []
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let streamMatch
  while ((streamMatch = streamRegex.exec(raw)) !== null) {
    const body = streamMatch[1]
    const literalRegex = /\(([^()]*(?:\\[()][^()]*)*)\)\s*Tj/g
    let litMatch
    while ((litMatch = literalRegex.exec(body)) !== null) {
      extractedStrings.push(
        litMatch[1]
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\")
          .replace(/\\260/g, "°")
          .replace(/\\261/g, "±")
          .replace(/\\262/g, "²")
      )
    }
  }

  return {
    hasHeader,
    hasEof,
    hasXref,
    xrefOffsetMatches: xrefIdx + 1 === startxrefOffset,
    pageCount,
    extractedText: extractedStrings.join(" "),
  }
}

test("Scenario A & Snapshot Determinism: High similarity with missing evidence preserves nulls, scores, and integrity digest", () => {
  const peerLow = buildLiveResult("cell_peer", "Peer Low", {
    meanSlopeDeg: 25,
    lithology: "basalt",
  })
  const candA = buildLiveResult("cell_high_missing", "Salda Screening Cell #1", {
    meanSurfaceTempC: 12,
    meanSlopeDeg: 4.5,
    lithology: "clay-sedimentary",
    albedo: null,
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    vegetationCoverPct: null,
  })
  const origEnvSnapshot = JSON.stringify(candA.candidate.environment)

  const intel = buildLiveCandidateIntelligence({
    candidateResult: candA,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    allEvaluatedCandidates: [candA, peerLow],
  })

  const record = createResearchAssessmentRecord({
    candidateResult: candA,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    createdAt: "2026-11-14T10:00:00.000Z",
  })

  // Immutability & exact scientific preservation
  assert.strictEqual(JSON.stringify(candA.candidate.environment), origEnvSnapshot)
  assert.strictEqual(record.snapshot.score, candA.score)
  assert.strictEqual(record.snapshot.coverage, candA.coverage)
  assert.strictEqual(record.snapshot.isVerified, false)
  assert.strictEqual(record.snapshot.candidate.environment.albedo, null)
  assert.ok(record.snapshot.contentDigest.startsWith("fnv64-"))
  assert.ok(record.snapshot.digestScopeNote.includes("does NOT establish independent scientific verification"))

  // Auto-seeded tasks start strictly at identified + recommended-not-completed
  assert.ok(record.tasks.length > 0, "Follow-up tasks must auto-seed from Phase 6.5 intelligence")
  for (const t of record.tasks) {
    assert.strictEqual(t.status, "identified")
    assert.strictEqual(t.observationStatus, "recommended-not-completed")
  }

  // Deterministic canonical serialization & repeat snapshot creation digest match
  const recordRepeat = createResearchAssessmentRecord({
    candidateResult: candA,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    createdAt: "2026-11-14T10:00:00.000Z",
  })
  assert.strictEqual(record.snapshot.contentDigest, recordRepeat.snapshot.contentDigest)
  assert.strictEqual(record.snapshot.snapshotId, recordRepeat.snapshot.snapshotId)
  assert.strictEqual(canonicalSerialize({ b: 2, a: 1 }), canonicalSerialize({ a: 1, b: 2 }))
})

test("Scenario B (<40% insufficient coverage): Score remains null, PDF & CSV stay honest", () => {
  const lowCov = buildLiveResult("cell_low_cov", "Insufficient Cell #3", {
    meanSurfaceTempC: 10,
    diurnalTempRangeC: null,
    annualPrecipitationMm: null,
    meanSlopeDeg: 6,
    lithology: null,
    elevationM: -500,
    surfaceSolarIrradianceWm2: null,
  })
  assert.strictEqual(lowCov.score, null)
  assert.strictEqual(lowCov.isReliable, false)

  const intel = buildLiveCandidateIntelligence({
    candidateResult: lowCov,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
  })
  const record = createResearchAssessmentRecord({
    candidateResult: lowCov,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    createdAt: "2026-11-14T10:05:00.000Z",
  })

  assert.strictEqual(record.snapshot.score, null)
  assert.strictEqual(record.snapshot.intelligence.sensitivityAnalysis.status, "insufficient-evidence")

  const summaryRows = parseCsvRows(generateCandidateSummaryCsv(record))
  const header = summaryRows[0]
  const row = summaryRows[1]
  assert.strictEqual(row[header.indexOf("similarity_score_pct")], "")
  assert.strictEqual(row[header.indexOf("is_reliable_ge_40pct")], "false")
  assert.strictEqual(row[header.indexOf("verification_status")], "unverified")

  const pdfBytes = generateScientificAssessmentPdf(record, { exportTimestamp: "2026-11-14T10:06:00.000Z" })
  const parsedPdf = parsePdfStructureAndStrings(pdfBytes)
  assert.ok(parsedPdf.hasHeader && parsedPdf.hasEof && parsedPdf.hasXref && parsedPdf.xrefOffsetMatches)
  assert.ok(parsedPdf.pageCount >= 2, `Expected multi-page PDF, got ${parsedPdf.pageCount}`)
  assert.ok(parsedPdf.extractedText.includes("Insufficient data"))
  assert.ok(parsedPdf.extractedText.includes("below the 40% reliability gate"))
})

test("Scenario C (Curated Atlas), D (Task closure != verified), E (Context change history & non-mutation)", () => {
  const atacama = getAllAtlasCandidates().find((a) => a.id.includes("atacama")) ?? getAllAtlasCandidates()[0]
  const intelAtlas = buildAtlasCandidateIntelligence({
    atlasSite: atacama,
    target: GALE_TARGET,
    missionProfile: ROVER_TESTING_PROFILE,
  })
  const atlasRec = createResearchAssessmentRecord({
    atlasSite: atacama,
    target: GALE_TARGET,
    missionProfile: ROVER_TESTING_PROFILE,
    intelligence: intelAtlas,
    createdAt: "2026-11-14T10:10:00.000Z",
  })

  assert.strictEqual(atlasRec.snapshot.noveltyTier, atacama.noveltyTier)
  assert.strictEqual(atlasRec.snapshot.score, null)
  assert.strictEqual(atlasRec.snapshot.intelligence.sensitivityAnalysis.status, "unavailable")

  const initialValStatus = atlasRec.snapshot.intelligence.validationStatus
  // Close every task -> candidate verification and observationStatus MUST remain untouched
  let updated = atlasRec
  for (const t of atlasRec.tasks) {
    updated = updateResearchTaskStatus(updated, t.id, "closed", {
      owner: "Dr. Researcher",
      notes: "Reviewed dataset citation only",
      now: "2026-11-14T10:15:00.000Z",
    })
  }
  assert.ok(updated.tasks.every((t) => t.status === "closed"))
  assert.ok(updated.tasks.every((t) => t.observationStatus === "recommended-not-completed"))
  assert.strictEqual(updated.snapshot.isVerified, atacama.isVerified === true)
  assert.strictEqual(updated.snapshot.intelligence.validationStatus, initialValStatus)

  // Also test unverified live candidate: closing ALL tasks never promotes isVerified or validationStatus
  const liveUnverified = buildLiveResult("cell_unverified_d", "Task Closure Cell D", {
    meanSurfaceTempC: -40,
    meanSlopeDeg: 5,
    lithology: "clay-sedimentary",
  })
  const intelLiveD = buildLiveCandidateIntelligence({
    candidateResult: liveUnverified,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
  })
  let liveRecD = createResearchAssessmentRecord({
    candidateResult: liveUnverified,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intelLiveD,
    createdAt: "2026-11-14T10:12:00.000Z",
  })
  for (const t of liveRecD.tasks) {
    liveRecD = updateResearchTaskStatus(liveRecD, t.id, "closed")
  }
  assert.strictEqual(liveRecD.snapshot.isVerified, false)
  assert.notStrictEqual(liveRecD.snapshot.intelligence.validationStatus, "independently-validated")

  // Revision history preserves Assessment A when appending Assessment B
  const updatedWithRevB = appendAssessmentRevision({
    record: updated,
    atlasSite: atacama,
    target: GALE_TARGET,
    missionProfile: ROVER_TESTING_PROFILE,
    intelligence: intelAtlas,
    revisionLabel: "Assessment B — Second Literature Check",
    createdAt: "2026-11-14T10:20:00.000Z",
  })
  assert.strictEqual(updatedWithRevB.revisionHistory.length, 2)
  assert.strictEqual(updatedWithRevB.revisionHistory[0].snapshot.revisionLabel, "Assessment A — Initial Screening Snapshot")
  assert.strictEqual(updatedWithRevB.revisionHistory[1].snapshot.revisionLabel, "Assessment B — Second Literature Check")

  // Reject appending revision under a different mission profile context (Scenario E guard)
  assert.throws(() => {
    appendAssessmentRevision({
      record: updatedWithRevB,
      atlasSite: atacama,
      target: GALE_TARGET,
      missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
      intelligence: intelAtlas,
    })
  }, /mismatched/i)
})

test("Scenario F (CSV Integrity, Malicious Formula Injection, Missing vs Zero, Negative Numbers, UTF-8)", () => {
  const candF = buildLiveResult("cell_csv_test", 'Test, Cell "Alpha"', {
    meanSurfaceTempC: -55,
    annualPrecipitationMm: 0,
    elevationM: -2651,
    albedo: null,
  })
  const intel = buildLiveCandidateIntelligence({
    candidateResult: candF,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
  })
  let rec = createResearchAssessmentRecord({
    candidateResult: candF,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    createdAt: "2026-11-14T10:30:00.000Z",
  })

  // Inject malicious formula-like strings into task notes and user note
  rec = updateResearchTaskStatus(rec, rec.tasks[0].id, "observation-pending", {
    owner: "=HYPERLINK(\"http://evil\",\"Click\")",
    notes: "@SUM(1+1)\nLine 2 \"quoted\", test",
  })
  rec = addUserResearchNote(rec, {
    title: "+cmd|' /C calc'!A0",
    body: "-2+3+cmd|' /C calc'!A0 — legitimate degree test 18.4°C",
    relatedFeature: "meanSurfaceTempC",
    userSuppliedSourceUrl: "https://example.org/analog-study?q=(1)&ok=true",
  })

  // Validate URL helper blocks javascript: URLs
  assert.throws(() => validateUserHttpUrl("javascript:alert(1)"), /http:\/\/ or https:\/\//)

  // Check legitimate negative numbers remain numeric unprefixed, while string payloads are safely escaped
  assert.strictEqual(formatCsvCell(-55), "-55")
  assert.strictEqual(formatCsvCell(-2651), "-2651")
  assert.strictEqual(formatCsvCell(0), "0")
  assert.strictEqual(formatCsvCell(null), "")
  assert.strictEqual(formatCsvCell('=SUM(A1)'), `"'=SUM(A1)"`)
  assert.strictEqual(formatCsvCell("  +1+1"), `"'+1+1"`.replace("'", "'  ") ? `"'  +1+1"` : "")

  // Scientific Features CSV parser verification
  const featuresCsv = generateScientificFeaturesCsv(rec, "2026-11-14T10:31:00.000Z")
  const featureRows = parseCsvRows(featuresCsv)
  assert.strictEqual(featureRows.length, intel.featureExplanations.length + 1)
  const fh = featureRows[0]
  const tempRow = featureRows.find((r) => r[fh.indexOf("feature_key")] === "meanSurfaceTempC")
  const precipRow = featureRows.find((r) => r[fh.indexOf("feature_key")] === "annualPrecipitationMm")
  const albedoRow = featureRows.find((r) => r[fh.indexOf("feature_key")] === "albedo")
  assert.strictEqual(tempRow[fh.indexOf("earth_value")], "-55")
  assert.strictEqual(precipRow[fh.indexOf("earth_value")], "0")
  assert.strictEqual(albedoRow[fh.indexOf("earth_value")], "")
  assert.strictEqual(albedoRow[fh.indexOf("comparability_status")], "missing_data")

  // Tasks CSV parser verification + injection hardening
  const tasksCsv = generateResearchTasksCsv(rec, "2026-11-14T10:31:00.000Z")
  const taskRows = parseCsvRows(tasksCsv)
  assert.strictEqual(taskRows.length, rec.tasks.length + 1)
  const th = taskRows[0]
  assert.ok(taskRows[1][th.indexOf("owner")].startsWith("'="))
  assert.ok(taskRows[1][th.indexOf("notes")].startsWith("'@"))

  // Provenance CSV includes user link marked strictly unverified
  const provCsv = generateProvenanceManifestCsv(rec)
  const provRows = parseCsvRows(provCsv)
  const ph = provRows[0]
  const userProvRow = provRows.find((r) => r[ph.indexOf("origin_kind")] === "user-supplied-reference")
  assert.ok(userProvRow)
  assert.ok(userProvRow[ph.indexOf("title")].startsWith("User Note Reference: +cmd"))
  assert.ok(formatCsvCell("+cmd|' /C calc'!A0").startsWith("\x22'+cmd"))
  assert.ok(userProvRow[ph.indexOf("provider_or_org")].includes("not independently verified"))
})

test("Scenario G (Long Multi-Page PDF, Wrapped URLs, Notes Separation & Import Security)", () => {
  const longCand = buildLiveResult("cell_long_pdf", "Extended Multi-Page Validation Cell — Western Anatolia", {
    meanSurfaceTempC: -48.5,
    diurnalTempRangeC: 62.4,
    annualPrecipitationMm: 120,
    meanSlopeDeg: 4.8,
    lithology: "clay-sedimentary",
    elevationM: -1820,
    surfaceSolarIrradianceWm2: 149,
  })
  const intel = buildLiveCandidateIntelligence({
    candidateResult: longCand,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
  })
  let rec = createResearchAssessmentRecord({
    candidateResult: longCand,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    createdAt: "2026-11-14T10:40:00.000Z",
  })

  // Attach long user notes with parentheses & long URL to stress PDF wrapping + escaping
  for (let i = 1; i <= 4; i++) {
    rec = addUserResearchNote(rec, {
      title: `Extended Note #${i} (Field Spectroscopy & Regolith)`,
      body: `Long analytical note #${i} checking whether macrostrat carbonate outcrops align with hydrated phyllosilicates (CRISM proxy). Observed 4.8° slope across ~445 m DEM stencil and -48.5°C temperature comparison.`,
      relatedFeature: "lithology",
      userSuppliedSourceUrl: `https://example.org/papers/terratwin/long/path/segment/${i}/appendix(a)/details?param=value_with_underscore_and_long_token_1234567890`,
    })
  }

  const pdfBytes = generateScientificAssessmentPdf(rec, { exportTimestamp: "2026-11-14T10:41:00.000Z" })
  const parsed = parsePdfStructureAndStrings(pdfBytes)
  assert.ok(parsed.hasHeader, "Must begin with %PDF-1.4")
  assert.ok(parsed.hasEof, "Must end with %%EOF")
  assert.ok(parsed.hasXref && parsed.xrefOffsetMatches, "Valid xref table and byte offset required")
  assert.ok(parsed.pageCount >= 3, `Expected >= 3 pages for long assessment, got ${parsed.pageCount}`)
  assert.ok(parsed.extractedText.includes(`Page 1 of ${parsed.pageCount}`))
  assert.ok(parsed.extractedText.includes(`Page ${parsed.pageCount} of ${parsed.pageCount}`))
  assert.ok(parsed.extractedText.includes("TerraTwin Scientific Analog Candidate Assessment"))
  assert.ok(parsed.extractedText.includes("USER NOTE: Extended Note #4"))
  assert.ok(parsed.extractedText.includes("not official NASA certification"))
  assert.ok(parsed.extractedText.includes("fnv64-"))

  // Import JSON tamper defense: malicious JSON cannot promote live-grid-cell to isVerified: true
  const rawJson = JSON.parse(serializeResearchRecordJson(rec))
  rawJson.record.snapshot.isVerified = true
  rawJson.record.snapshot.candidate.isVerified = true
  const reimported = validateAndImportResearchRecord(JSON.stringify(rawJson))
  assert.strictEqual(reimported.snapshot.isVerified, false)
  assert.strictEqual(reimported.snapshot.candidate.isVerified, false)

  // Filename sanitization check
  assert.strictEqual(
    sanitizeExportFilename("../../evil/path name?*=1", "pdf"),
    "evil_path_name_1.pdf"
  )
})

test("Zero parallel recommendation engine & existing UI wiring assertions", () => {
  const snapshotSvc = readFileSync(
    resolve(ROOT, "src/lib/terratwin/services/research-snapshot-service.ts"),
    "utf8"
  )
  assert.ok(snapshotSvc.includes("intelligence.followUpRecommendations.forEach"))

  const detailsTsx = readFileSync(
    resolve(ROOT, "src/components/discover/discovery-candidate-details.tsx"),
    "utf8"
  )
  assert.ok(detailsTsx.includes("<DiscoveryResearchWorkspace"))
  assert.ok(detailsTsx.includes("<DiscoveryScientificIntelligence"))
})
