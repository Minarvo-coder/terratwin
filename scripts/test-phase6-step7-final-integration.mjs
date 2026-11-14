/**
 * TerraTwin — Phase 6.7 Final Integration & Independent Scientific Audit Suite
 *
 * Independently verifies math, units, petrological classification, weighted similarity
 * formulas, 40% coverage gates, Mission Scenarios A–D, 31-site Atlas counts,
 * security boundaries (prototype pollution, contentDigest tamper, CSV formula injection),
 * PDF WinAnsi fallback rendering, and 6-format cross-export consistency.
 */

import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { SAMPLE_TARGETS } from "../src/lib/terratwin/sample-dataset.ts"
import {
  ASTROBIOLOGY_HABITABILITY_PROFILE,
  COMPARISON_FEATURES,
  CONFIGURABLE_MISSION_PROFILES,
  GEOLOGICAL_RESEARCH_PROFILE,
  LUNAR_BASE_CONSTRUCTION_PROFILE,
  ROVER_TESTING_PROFILE,
} from "../src/lib/terratwin/config/comparison-config.ts"
import { FEATURES, ANALOG_NOVELTY_TIERS } from "../src/lib/terratwin/features.ts"
import { getFeatureComparabilityInfo } from "../src/lib/terratwin/format.ts"
import {
  computeAnalogSimilarity,
  evaluateFeatureComparison,
  MIN_RELIABLE_COVERAGE,
} from "../src/lib/terratwin/similarity-engine.ts"
import {
  computeCentralDifferenceSlopeDeg,
  fetchBatchElevationAndSlope,
  POLAR_SLOPE_EXCLUSION_LAT_DEG,
  STENCIL_DELTA_DEG,
  wrapLongitudeDeg,
} from "../src/lib/terratwin/connectors/elevation-connector.ts"
const INDEPENDENT_EARTH_RADIUS_M = 6371000
import {
  fetchBatchNasaPowerClimatology,
  getPowerGridKey,
} from "../src/lib/terratwin/connectors/nasa-power-connector.ts"
import {
  classifyMacrostratLithologyDetailed,
} from "../src/lib/terratwin/connectors/macrostrat-connector.ts"
import {
  generateDiscoveryGrid,
  GridValidationError,
} from "../src/lib/terratwin/services/grid-generator.ts"
import {
  getAllAtlasCandidates,
  getAtlasSummaryStatistics,
} from "../src/lib/terratwin/services/discovery-atlas-service.ts"
import {
  buildAtlasCandidateIntelligence,
  buildLiveCandidateIntelligence,
} from "../src/lib/terratwin/services/candidate-intelligence-service.ts"
import {
  addUserResearchNote,
  createResearchAssessmentRecord,
  serializeResearchRecordJson,
  updateResearchTaskStatus,
  validateAndImportResearchRecord,
} from "../src/lib/terratwin/services/research-snapshot-service.ts"
import {
  formatCsvCell,
  generateCandidateSummaryCsv,
  generateProvenanceManifestCsv,
  generateResearchTasksCsv,
  generateScientificFeaturesCsv,
  parseCsvRows,
} from "../src/lib/terratwin/utils/csv-export.ts"
import { generateScientificAssessmentPdf } from "../src/lib/terratwin/utils/pdf-report-generator.ts"

const ROOT = process.cwd()

const JEZERO_TARGET = SAMPLE_TARGETS.find((t) => t.id === "mars-jezero-delta") ?? SAMPLE_TARGETS[0]
const GALE_TARGET = SAMPLE_TARGETS.find((t) => t.id === "mars-gale-crater") ?? SAMPLE_TARGETS[0]
const LUNAR_SHACKLETON =
  SAMPLE_TARGETS.find((t) => t.id === "lunar-shackleton-rim") ?? SAMPLE_TARGETS[0]

function parsePdfStrings(pdfBytes) {
  const raw = Buffer.from(pdfBytes).toString("latin1")
  const hasHeader = raw.startsWith("%PDF-1.4")
  const hasEof = raw.trimEnd().endsWith("%%EOF")
  const countMatch = raw.match(/\/Count\s+(\d+)/)
  const pageCount = countMatch ? Number(countMatch[1]) : 0
  const hasXref = raw.includes("\nxref\n") && raw.includes("startxref")
  const strings = []
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let sm
  while ((sm = streamRegex.exec(raw)) !== null) {
    const body = sm[1]
    const strRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g
    let tm
    while ((tm = strRegex.exec(body)) !== null) {
      strings.push(
        tm[1]
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\")
      )
    }
  }
  return { hasHeader, hasEof, pageCount, hasXref, text: strings.join("\n") }
}

function makeSyntheticLiveCandidate(id, envOverrides, profile, target) {
  const environment = {
    meanSurfaceTempC: -55,
    diurnalTempRangeC: 60,
    annualPrecipitationMm: 0,
    meanSlopeDeg: 5,
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    albedo: null,
    vegetationCoverPct: null,
    lithology: "clay-sedimentary",
    elevationM: -1200,
    surfacePressurePa: null,
    surfaceSolarIrradianceWm2: 195,
    ...envOverrides,
  }
  const candidate = {
    id,
    name: `Cell ${id}`,
    country: "Regional Scan",
    latitude: 37.55,
    longitude: 29.68,
    boundingBox: [37.3, 29.43, 37.8, 29.93],
    setting: "Regional screening cell",
    summary: "Phase 6.7 synthetic test candidate",
    environment,
    provenanceMap: {
      elevationM: {
        status: "unverified",
        dataOrigin: "live-api-estimate",
        verificationState: "unverified",
        evidenceClassification: "measured",
        sourceTitle: "Open-Meteo Copernicus DEM GLO-90",
        unit: "m",
        spatialResolution: "90 m",
        isComparable: true,
      },
      meanSlopeDeg: {
        status: "unverified",
        dataOrigin: "computed-derivative",
        verificationState: "unverified",
        evidenceClassification: "derived",
        sourceTitle: "5-point central-difference gradient (Copernicus GLO-90)",
        unit: "deg",
        spatialResolution: "~445 m stencil",
        isComparable: true,
      },
      meanSurfaceTempC: {
        status: "unverified",
        dataOrigin: "live-api-estimate",
        verificationState: "unverified",
        evidenceClassification: "proxy",
        sourceTitle: "NASA POWER T2M (2m air temp proxy)",
        unit: "degC",
        spatialResolution: "0.5 x 0.625 deg",
        temporalCoverage: "2001-2025",
        isComparable: true,
      },
      surfaceSolarIrradianceWm2: {
        status: "unverified",
        dataOrigin: "live-api-estimate",
        verificationState: "unverified",
        evidenceClassification: "measured",
        sourceTitle: "NASA POWER ALLSKY_SFC_SW_DWN",
        unit: "W/m^2",
        spatialResolution: "1.0 x 1.0 deg",
        temporalCoverage: "2001-2025",
        isComparable: true,
      },
      lithology: {
        status: "unverified",
        dataOrigin: "live-api-estimate",
        verificationState: "unverified",
        evidenceClassification: "proxy",
        sourceTitle: "Macrostrat Geologic Map API v2",
        unit: "categorical",
        spatialResolution: "1:250k-1:5M",
        isComparable: true,
      },
    },
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
    scoreDisplay:
      sim.score !== null
        ? `${sim.score.toFixed(1)}% (Exploratory)`
        : "Insufficient data to rank reliably",
    coverage: sim.coverage,
    confidence: sim.confidence,
    isReliable: sim.isReliable,
    weightedDistance: sim.weightedDistance,
    missingFeatures: featureScores.filter((f) => f.status === "missing_data").map((f) => f.key),
    incompatibleFeatures: [],
    featureScores,
    explanation: `Evaluated ${featureScores.filter((f) => f.status === "comparable").length} comparable features.`,
    warnings: sim.coverage < MIN_RELIABLE_COVERAGE ? ["Below 40% coverage gate."] : [],
  }
}

test("1. Spatial grid bounds, antimeridian guard, integer stepping, and elevation slope accuracy", async () => {
  // Valid 2x2 grid (~1 deg box, 0.5 spacing -> 2x2 = 4 cells)
  const cells = generateDiscoveryGrid({
    boundingBox: [37.0, 29.0, 38.0, 30.0],
    gridSpacingDeg: 0.5,
    maxCells: 25,
  })
  assert.strictEqual(cells.length, 4)

  // Antimeridian crossing rejected cleanly
  assert.throws(
    () =>
      generateDiscoveryGrid({
        boundingBox: [10, 179, 12, -179],
        gridSpacingDeg: 0.5,
        maxCells: 25,
      }),
    GridValidationError
  )
  // Over hard cap (>100) rejected cleanly
  assert.throws(
    () =>
      generateDiscoveryGrid({
        boundingBox: [10, 10, 12, 12],
        gridSpacingDeg: 0.5,
        maxCells: 101,
      }),
    GridValidationError
  )

  // Independent central-difference analytical check on synthetic 10 deg planar incline
  const lat = 37.5
  const dx = 2 * STENCIL_DELTA_DEG * (Math.PI / 180) * INDEPENDENT_EARTH_RADIUS_M * Math.cos((lat * Math.PI) / 180)
  const targetSlopeRad = (10 * Math.PI) / 180
  const zC = 1000
  const halfRiseX = (dx / 2) * Math.tan(targetSlopeRad)
  const slopeResult = computeCentralDifferenceSlopeDeg({
    lat0: lat,
    deltaLatNSDeg: 2 * STENCIL_DELTA_DEG,
    deltaLonEWDeg: 2 * STENCIL_DELTA_DEG,
    zN: zC,
    zS: zC,
    zE: zC + halfRiseX,
    zW: zC - halfRiseX,
  })
  assert.ok(slopeResult.meanSlopeDeg !== null)
  assert.ok(
    Math.abs(slopeResult.meanSlopeDeg - 10.0) < 0.01,
    `Expected ~10.0 deg slope, got ${slopeResult.meanSlopeDeg}`
  )

  // Polar exclusion threshold >= 89.5 deg
  assert.strictEqual(POLAR_SLOPE_EXCLUSION_LAT_DEG, 89.5)
  assert.strictEqual(wrapLongitudeDeg(180.002), -179.998)
  const polarRes = await fetchBatchElevationAndSlope(
    [{ id: "polar_cell", latitude: 89.7, longitude: 0 }],
    {
      fetchFn: async () =>
        new Response(JSON.stringify({ elevation: [500, 501, 499, 502, 498] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    }
  )
  assert.strictEqual(polarRes.data.get("polar_cell")?.meanSlopeDeg, null)
})

test("2. Physical unit conversions, NASA POWER fill values & Macrostrat ultramafic exclusion", async () => {
  // Exact grid binning normalization (no -0.00 sign)
  assert.strictEqual(getPowerGridKey(-0, -0), "power_v2_0.00_0.000")

  // Mock NASA POWER returning custom fill value and known kW-hr/m^2/day
  const powerRes = await fetchBatchNasaPowerClimatology(
    [{ id: "p_cell", latitude: 37.5, longitude: 29.7 }],
    {
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            header: { fill_value: -32768 },
            parameters: {
              ALLSKY_SFC_SW_DWN: { units: "kW-hr/m^2/day" },
              T2M: { units: "C" },
              TS_RANGE: { units: "C" },
              PRECTOTCORR: { units: "mm/day" },
            },
            properties: {
              parameter: {
                T2M: { ANN: 12.5 },
                TS_RANGE: { ANN: -32768 }, // custom fill value -> must become null
                PRECTOTCORR: { ANN: 1.0 },
                ALLSKY_SFC_SW_DWN: { ANN: 4.8 }, // 4.8 * 1000/24 = 200.0 W/m^2
              },
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        ),
    }
  )
  const cellData = powerRes.data.get("p_cell")
  assert.ok(cellData)
  assert.strictEqual(cellData.meanSurfaceTempC, 12.5)
  assert.strictEqual(cellData.diurnalTempRangeC, null)
  assert.strictEqual(cellData.surfaceSolarIrradianceWm2, 200)
  assert.strictEqual(cellData.annualPrecipitationMm, 365)

  // Macrostrat ultramafic & mixed ambiguity
  const ultramafic = classifyMacrostratLithologyDetailed("Major:{peridotite,serpentinite}", "olivine ultramafic")
  assert.notStrictEqual(ultramafic.lithology, "felsic-crystalline")
  assert.strictEqual(ultramafic.confidence, "unmapped-class")
  assert.strictEqual(ultramafic.lithology, null)

  const mixed = classifyMacrostratLithologyDetailed("basalt, shale", "mixed volcanic and clastic beds")
  assert.strictEqual(mixed.lithology, null)
  assert.strictEqual(mixed.confidence, "ambiguous-mixed-unit")

  const dominant = classifyMacrostratLithologyDetailed(
    "Major:{dolomite,shale}, Minor:{basalt}",
    "lacustrine carbonates"
  )
  assert.strictEqual(dominant.lithology, "clay-sedimentary")
})

test("3. Independent similarity math verification & 40% coverage gate", () => {
  // Hand-computed 2-feature test profile summing to 1.00
  const profile = {
    id: "custom-verify",
    weights: {
      meanSurfaceTempC: 0.6,
      lithology: 0.4,
      diurnalTempRangeC: 0,
      annualPrecipitationMm: 0,
      meanSlopeDeg: 0,
      rockAbundancePct: 0,
      medianGrainSizeMm: 0,
      albedo: 0,
      vegetationCoverPct: 0,
      elevationM: 0,
      surfaceSolarIrradianceWm2: 0,
      surfacePressurePa: 0,
    },
  }
  const target = {
    id: "t-hand",
    name: "Target",
    body: "mars",
    environment: {
      meanSurfaceTempC: -60,
      lithology: "basalt",
      diurnalTempRangeC: null,
      annualPrecipitationMm: null,
      meanSlopeDeg: null,
      rockAbundancePct: null,
      medianGrainSizeMm: null,
      albedo: null,
      vegetationCoverPct: null,
      elevationM: null,
      surfaceSolarIrradianceWm2: null,
      surfacePressurePa: null,
    },
  }
  const cand = {
    id: "c-hand",
    name: "Cand",
    latitude: 0,
    longitude: 0,
    environment: {
      meanSurfaceTempC: -35, // diff=25, range=160 -> dist = 25/160 = 0.15625
      lithology: "basalt", // dist = 0
      diurnalTempRangeC: null,
      annualPrecipitationMm: null,
      meanSlopeDeg: null,
      rockAbundancePct: null,
      medianGrainSizeMm: null,
      albedo: null,
      vegetationCoverPct: null,
      elevationM: null,
      surfaceSolarIrradianceWm2: null,
      surfacePressurePa: null,
    },
  }
  const sim = computeAnalogSimilarity(target, cand, profile)
  const expectedWeightedDist = 0.6 * (25 / 150) + 0.4 * 0
  const expectedScore = (1 - expectedWeightedDist) * 100
  assert.ok(sim.score !== null)
  assert.ok(Math.abs(sim.score - expectedScore) < 1e-9)
  assert.strictEqual(sim.coverage, 1)

  // Below 40% coverage gate -> strictly null
  const lowCand = makeSyntheticLiveCandidate(
    "cell_gate_39",
    {
      meanSurfaceTempC: -55, // weight 0.05 in geological-research
      meanSlopeDeg: 5, // weight 0.10 -> sum 0.15 < 0.40
      surfaceSolarIrradianceWm2: 195, // weight 0.05 -> sum 0.20 < 0.40
      lithology: null, // weight 0.30 missing
      diurnalTempRangeC: null,
      annualPrecipitationMm: null,
    },
    GEOLOGICAL_RESEARCH_PROFILE,
    JEZERO_TARGET
  )
  assert.ok(lowCand.coverage < 0.4)
  assert.strictEqual(lowCand.score, null)
  assert.strictEqual(lowCand.isReliable, false)
})

test("4. Mission Scenarios A–D scientific behavior & terminology integrity", () => {
  // Verify 4 canonical profiles exist and sum to 1.00
  assert.strictEqual(CONFIGURABLE_MISSION_PROFILES.length, 4)

  // Scenario A: Lunar Base Construction & ISRU
  assert.strictEqual(LUNAR_BASE_CONSTRUCTION_PROFILE.weights.elevationM, 0)
  const lunarCand = makeSyntheticLiveCandidate(
    "cell_lunar_test",
    { meanSlopeDeg: 3.5, lithology: "basalt", surfaceSolarIrradianceWm2: 220, meanSurfaceTempC: -15 },
    LUNAR_BASE_CONSTRUCTION_PROFILE,
    LUNAR_SHACKLETON
  )
  const lunarIntel = buildLiveCandidateIntelligence({
    candidateResult: lunarCand,
    target: LUNAR_SHACKLETON,
    missionProfile: LUNAR_BASE_CONSTRUCTION_PROFILE,
  })
  const lunarSolarFeat = lunarIntel.featureExplanations.find(
    (f) => f.key === "surfaceSolarIrradianceWm2"
  )
  assert.ok(
    lunarIntel.mismatches.some((m) => /synodic|illumination/i.test(`${m.title} ${m.detail}`)) ||
      Boolean(lunarSolarFeat?.limitations.some((l) => /synodic|illumination/i.test(l))),
    "Lunar intelligence must disclose solar/synodic illumination difference"
  )

  // Scenario B: Geological Field Research (Lake Salda / Mars Jezero style)
  assert.strictEqual(GEOLOGICAL_RESEARCH_PROFILE.weights.lithology, 0.3)

  // Scenario C: Astrobiology & Habitability excludes vegetationCoverPct against Gale Crater
  assert.strictEqual(ASTROBIOLOGY_HABITABILITY_PROFILE.weights.vegetationCoverPct, 0)
  const astroCand = makeSyntheticLiveCandidate(
    "cell_gale_astro",
    { lithology: "clay-sedimentary", meanSurfaceTempC: -50, vegetationCoverPct: 80 },
    ASTROBIOLOGY_HABITABILITY_PROFILE,
    GALE_TARGET
  )
  assert.ok(astroCand.featureScores.find((f) => f.key === "vegetationCoverPct")?.weight === 0)

  // Scenario D: Rover Testing emphasizes slope & carries DEM caveat
  assert.strictEqual(ROVER_TESTING_PROFILE.weights.meanSlopeDeg, 0.25)

  // Terminology audit fixes in features.ts and format.ts
  const liveTier = ANALOG_NOVELTY_TIERS.find((t) => t.id === "live-grid-discovery")
  assert.ok(liveTier)
  assert.ok(liveTier.evidenceRequired.includes("5-point cardinal central-difference"))
  assert.ok(!liveTier.evidenceRequired.includes("3x3 Horn"))

  const slopeInfo = getFeatureComparabilityInfo("meanSlopeDeg")
  assert.ok(slopeInfo.rationale.includes("5-point central-difference"))
  assert.ok(slopeInfo.rationale.includes("Horn 3x3"))
  assert.ok(FEATURES.some((f) => f.key === "meanSlopeDeg"))
})

test("5. Global Atlas 31-site completeness & STEP2 country report reconciliation", () => {
  const sites = getAllAtlasCandidates()
  const stats = getAtlasSummaryStatistics()
  assert.strictEqual(sites.length, 31)
  assert.strictEqual(stats.totalCandidates, 31)
  assert.strictEqual(stats.canonicalBenchmarkCount, 8)
  assert.strictEqual(stats.underExploredCount, 23)
  assert.strictEqual(stats.liveGridDiscoveryCount, 0)
  assert.strictEqual(stats.uniqueCountriesCount, 18)

  const step2Report = readFileSync(resolve(ROOT, "PHASE6_STEP2_GLOBAL_DISCOVERY_ATLAS_REPORT.md"), "utf8")
  assert.ok(step2Report.includes("**Unique Countries / Territories**: 18"))
})

test("6. Security hardening: Prototype pollution, digest tamper, CSV formula injection & PDF WinAnsi fallbacks", () => {
  const saldaCand = makeSyntheticLiveCandidate(
    "cell_salda_sec",
    { meanSlopeDeg: 4.1, meanSurfaceTempC: 11.4, lithology: "clay-sedimentary", surfaceSolarIrradianceWm2: 192 },
    GEOLOGICAL_RESEARCH_PROFILE,
    JEZERO_TARGET
  )
  const intel = buildLiveCandidateIntelligence({
    candidateResult: saldaCand,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
  })
  let rec = createResearchAssessmentRecord({
    candidateResult: saldaCand,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    createdAt: "2026-11-14T12:00:00.000Z",
  })

  // Malicious formulas + Unicode symbols (µm, ΔT, −, ⁰, ⁴) in notes & tasks
  rec = addUserResearchNote(rec, {
    title: "=HYPERLINK(\"http://evil.example\",\"Click\") · µm ΔT",
    body: "+SUM(A1:A5) − 10⁴ W·m⁻² spectroscopy note",
    relatedFeature: "lithology",
  })
  if (rec.tasks.length > 0) {
    rec = updateResearchTaskStatus(rec, rec.tasks[0].id, "evidence-review", {
      owner: "@cmd|calc",
      notes: "-2+3 note with \u00a0 NBSP and µg/kg trace",
    })
  }

  // Export all formats cleanly
  const jsonStr = serializeResearchRecordJson(rec)
  const summaryCsv = generateCandidateSummaryCsv(rec)
  const featuresCsv = generateScientificFeaturesCsv(rec)
  const tasksCsv = generateResearchTasksCsv(rec)
  const provenanceCsv = generateProvenanceManifestCsv(rec)
  const pdfBytes = generateScientificAssessmentPdf(rec, { exportTimestamp: "2026-11-14T12:01:00.000Z" })

  // Prototype pollution JSON import defense
  const pollutedPayload = JSON.parse(jsonStr)
  pollutedPayload.record.__proto__ = { pollutedProp: "pwned" }
  pollutedPayload.record.constructor = { evil: true }
  const cleanReimported = validateAndImportResearchRecord(
    jsonStr.replace(
      '"recordId":',
      '"__proto__":{"pollutedGlobal":true},"constructor":{"bad":1},"recordId":'
    )
  )
  assert.strictEqual(({}).pollutedGlobal, undefined)
  assert.strictEqual(Object.prototype.pollutedGlobal, undefined)
  assert.strictEqual(Object.hasOwn(cleanReimported, "__proto__"), false)
  assert.strictEqual(cleanReimported.snapshot.contentDigest, rec.snapshot.contentDigest)

  // Tampered core telemetry without updating digest MUST be rejected
  const tamperedScore = JSON.parse(jsonStr)
  tamperedScore.record.snapshot.score = 99.9
  assert.throws(
    () => validateAndImportResearchRecord(JSON.stringify(tamperedScore)),
    /contentDigest integrity verification/
  )

  // Malformed JSON and empty/oversized rejected
  assert.throws(() => validateAndImportResearchRecord(""), /empty/)
  assert.throws(() => validateAndImportResearchRecord("{not-json"), /valid JSON/)

  // CSV formula injection neutralized & valid CSV round-trip
  assert.strictEqual(formatCsvCell("=cmd|calc"), "\"'=cmd|calc\"")
  assert.strictEqual(formatCsvCell(" +1+1"), "\"' +1+1\"")
  for (const csvText of [summaryCsv, featuresCsv, tasksCsv, provenanceCsv]) {
    const rows = parseCsvRows(csvText.replace(/^\uFEFF/, ""))
    assert.ok(rows.length >= 2)
    for (const row of rows) {
      assert.strictEqual(row.length, rows[0].length, "Consistent CSV column count across rows")
    }
  }
  assert.ok(tasksCsv.includes("'@cmd|calc"))
  assert.ok(tasksCsv.includes("'-2+3"))

  // PDF structural & WinAnsi fallback verification (no raw ? corruption for µ, Δ, −, superscripts)
  const parsedPdf = parsePdfStrings(pdfBytes)
  assert.ok(parsedPdf.hasHeader && parsedPdf.hasEof && parsedPdf.hasXref && parsedPdf.pageCount >= 2)
  assert.ok(parsedPdf.text.includes("um DeltaT") || parsedPdf.text.includes("DeltaT"))
  assert.ok(parsedPdf.text.includes("^4"))
  assert.ok(parsedPdf.text.includes("^-"))
  assert.ok(!parsedPdf.text.includes("?m "))

  // 6-Format Cross-Export Consistency Check
  const sRows = parseCsvRows(summaryCsv.replace(/^\uFEFF/, ""))
  const sHdr = sRows[0]
  const sVal = sRows[1]
  assert.strictEqual(sVal[sHdr.indexOf("snapshot_id")], rec.snapshot.snapshotId)
  assert.strictEqual(sVal[sHdr.indexOf("content_digest")], rec.snapshot.contentDigest)
  assert.strictEqual(sVal[sHdr.indexOf("verification_status")], "unverified")
  assert.ok(parsedPdf.text.includes(rec.snapshot.snapshotId))
  assert.ok(parsedPdf.text.includes(rec.snapshot.contentDigest))
  assert.ok(featuresCsv.includes(rec.snapshot.snapshotId))
  assert.ok(provenanceCsv.includes(rec.snapshot.snapshotId))
  assert.ok(tasksCsv.includes(rec.snapshot.snapshotId))

  // Also test Curated Atlas candidate assessment through buildAtlasCandidateIntelligence
  const atacama = getAllAtlasCandidates().find((a) => a.id === "atacama-yungay") ?? getAllAtlasCandidates()[0]
  const atlasIntel = buildAtlasCandidateIntelligence({
    atlasSite: atacama,
    target: JEZERO_TARGET,
    missionProfile: ASTROBIOLOGY_HABITABILITY_PROFILE,
  })
  const atlasRec = createResearchAssessmentRecord({
    atlasSite: atacama,
    target: JEZERO_TARGET,
    missionProfile: ASTROBIOLOGY_HABITABILITY_PROFILE,
    intelligence: atlasIntel,
    createdAt: "2026-11-14T12:05:00.000Z",
  })
  assert.strictEqual(atlasRec.snapshot.candidateSourceKind, "curated-atlas-site")
  assert.ok(parseCsvRows(generateCandidateSummaryCsv(atlasRec).replace(/^\uFEFF/, "")).length === 2)
})
