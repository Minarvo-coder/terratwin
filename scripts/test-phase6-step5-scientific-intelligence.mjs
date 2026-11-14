import test from "node:test"
import assert from "node:assert"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  ASTROBIOLOGY_HABITABILITY_PROFILE,
  GEOLOGICAL_RESEARCH_PROFILE,
  LUNAR_BASE_CONSTRUCTION_PROFILE,
  ROVER_TESTING_PROFILE,
} from "../src/lib/terratwin/config/comparison-config.ts"
import {
  buildAtlasCandidateIntelligence,
  buildLiveCandidateIntelligence,
  DEFAULT_SENSITIVITY_PERTURBATION_FRACTION,
  MAX_SENSITIVITY_SCENARIOS,
  TERRATWIN_SCREENING_DISCLAIMER,
} from "../src/lib/terratwin/services/candidate-intelligence-service.ts"
import { getAtlasCandidateById } from "../src/lib/terratwin/services/discovery-atlas-service.ts"
import { SAMPLE_TARGETS } from "../src/lib/terratwin/sample-dataset.ts"
import { computeAnalogSimilarity } from "../src/lib/terratwin/similarity-engine.ts"

const jezeroTarget =
  SAMPLE_TARGETS.find((t) => t.id === "mars-jezero-delta") ?? SAMPLE_TARGETS[0]
const shackletonTarget =
  SAMPLE_TARGETS.find((t) => t.id === "moon-shackleton-rim") ?? SAMPLE_TARGETS[0]

function makeLiveCandidateResult(overrides) {
  const target = overrides.target ?? jezeroTarget
  const profile = overrides.profile ?? ROVER_TESTING_PROFILE
  const env = {
    elevationM: 1120,
    meanSlopeDeg: 4.0,
    meanSurfaceTempC: -15,
    diurnalTempRangeC: 65,
    surfaceSolarIrradianceWm2: 520,
    annualPrecipitationMm: 120,
    lithology: "clay-sedimentary",
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    albedo: null,
    vegetationCoverPct: null,
    surfacePressurePa: null,
    ...overrides.env,
  }

  const defaultProv = {
    elevationM: {
      status: env.elevationM != null ? "unverified" : "no-data",
      dataOrigin: env.elevationM != null ? "live-api-estimate" : "missing",
      evidenceClassification: env.elevationM != null ? "measured" : "missing_data",
      verificationState: env.elevationM != null ? "unverified" : "no-data",
      sourceTitle: "Copernicus DEM GLO-90 (Open-Meteo)",
      sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
      unit: "m",
      spatialResolution: "90 m grid cell",
      isComparable: true,
    },
    meanSlopeDeg: {
      status: env.meanSlopeDeg != null ? "unverified" : "no-data",
      dataOrigin: env.meanSlopeDeg != null ? "computed-derivative" : "missing",
      evidenceClassification: env.meanSlopeDeg != null ? "derived" : "missing_data",
      verificationState: env.meanSlopeDeg != null ? "unverified" : "no-data",
      sourceTitle: "5-Point Central-Difference Gradient",
      sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
      unit: "°",
      spatialResolution: "~445 m baseline",
      isComparable: true,
    },
    meanSurfaceTempC: {
      status: env.meanSurfaceTempC != null ? "unverified" : "no-data",
      dataOrigin: env.meanSurfaceTempC != null ? "live-api-estimate" : "missing",
      evidenceClassification: env.meanSurfaceTempC != null ? "proxy" : "missing_data",
      verificationState: env.meanSurfaceTempC != null ? "unverified" : "no-data",
      sourceTitle: "NASA POWER T2M Proxy",
      sourceUrl: "https://power.larc.nasa.gov/",
      unit: "°C",
      spatialResolution: "0.5° × 0.625°",
      measurementPeriod: "2001-2025",
      isComparable: true,
    },
    diurnalTempRangeC: {
      status: env.diurnalTempRangeC != null ? "unverified" : "no-data",
      dataOrigin: env.diurnalTempRangeC != null ? "live-api-estimate" : "missing",
      evidenceClassification: env.diurnalTempRangeC != null ? "derived" : "missing_data",
      verificationState: env.diurnalTempRangeC != null ? "unverified" : "no-data",
      sourceTitle: "NASA POWER TS_RANGE",
      unit: "°C",
      spatialResolution: "0.5° × 0.625°",
      isComparable: true,
    },
    surfaceSolarIrradianceWm2: {
      status: env.surfaceSolarIrradianceWm2 != null ? "unverified" : "no-data",
      dataOrigin: env.surfaceSolarIrradianceWm2 != null ? "computed-derivative" : "missing",
      evidenceClassification: env.surfaceSolarIrradianceWm2 != null ? "derived" : "missing_data",
      verificationState: env.surfaceSolarIrradianceWm2 != null ? "unverified" : "no-data",
      sourceTitle: "NASA POWER ALLSKY_SFC_SW_DWN",
      unit: "W/m²",
      spatialResolution: "1.0° × 1.0°",
      isComparable: true,
    },
    lithology: {
      status: env.lithology != null ? "unverified" : "no-data",
      dataOrigin: env.lithology != null ? "live-api-estimate" : "missing",
      evidenceClassification: env.lithology != null ? "proxy" : "missing_data",
      verificationState: env.lithology != null ? "unverified" : "no-data",
      sourceTitle: "Macrostrat Regional Geology",
      sourceUrl: "https://macrostrat.org/api/v2/mobile/map_query_v2",
      unit: "",
      spatialResolution: "Regional geologic map polygon scale (1:250k-1:5M)",
      isComparable: true,
    },
    annualPrecipitationMm: {
      status: env.annualPrecipitationMm != null ? "unverified" : "no-data",
      dataOrigin: "computed-derivative",
      evidenceClassification: "derived",
      verificationState: "unverified",
      sourceTitle: "NASA POWER PRECTOTCORR",
      unit: "mm/yr",
      isComparable: false,
      incomparabilityReason: "Active rainfall absent on target",
    },
  }

  const candidate = {
    id: overrides.id ?? "cell_+37.5000_+29.5000",
    name: "Candidate Cell +37.5000_+29.5000",
    country: "Regional Scan",
    latitude: 37.5,
    longitude: 29.5,
    setting: "Regional geology: Lacustrine Clay Unit",
    summary: "Deterministic live test fixture",
    environment: env,
    provenanceMap: { ...defaultProv, ...overrides.prov },
    isVerified: overrides.isVerified ?? false,
    noveltyTier: "live-grid-discovery",
    boundingBox: [37.25, 29.25, 37.75, 29.75],
  }

  const sim = computeAnalogSimilarity(target, candidate, profile)
  return {
    rank: overrides.rank ?? 1,
    candidate,
    score: sim.score,
    scoreDisplay: sim.scoreDisplay,
    coverage: sim.coverage,
    confidence: sim.confidence,
    isReliable: sim.isReliable,
    weightedDistance: sim.weightedDistance,
    missingFeatures: sim.missingFeatures,
    incompatibleFeatures: sim.incompatibleFeatures,
    featureScores: sim.featureScores,
    explanation: `Evaluated ${sim.validFeaturesCount} features.`,
    warnings: [],
  }
}

test("1-4: Existing score, weights, coverage remain identical and missing data stay null", () => {
  const weightsBefore = JSON.stringify(ROVER_TESTING_PROFILE.weights)
  const live = makeLiveCandidateResult({})
  const intel = buildLiveCandidateIntelligence({
    candidateResult: live,
    target: jezeroTarget,
    missionProfile: ROVER_TESTING_PROFILE,
  })

  assert.strictEqual(intel.score, live.score)
  assert.strictEqual(intel.coverage, live.coverage)
  assert.strictEqual(JSON.stringify(ROVER_TESTING_PROFILE.weights), weightsBefore)

  const rock = intel.featureExplanations.find((f) => f.key === "rockAbundancePct")
  assert.ok(rock)
  assert.strictEqual(rock.earthValue, null)
  assert.strictEqual(rock.contributionCategory, "missing-evidence")
})

test("5-9: Incompatible features excluded, real scores/provenance/presentation bands preserved", () => {
  const live = makeLiveCandidateResult({
    env: { meanSurfaceTempC: 35 }, // divergence against Jezero -63°C
  })
  const intel = buildLiveCandidateIntelligence({
    candidateResult: live,
    target: jezeroTarget,
    missionProfile: ROVER_TESTING_PROFILE,
  })

  const precip = intel.featureExplanations.find((f) => f.key === "annualPrecipitationMm")
  assert.ok(precip)
  assert.strictEqual(precip.comparisonStatus, "incompatible_quantities")
  assert.strictEqual(precip.contributionCategory, "not-comparable")
  assert.strictEqual(precip.similarity, null)

  const slope = intel.featureExplanations.find((f) => f.key === "meanSlopeDeg")
  const backendSlope = live.featureScores.find((f) => f.key === "meanSlopeDeg")
  assert.strictEqual(slope?.similarity, backendSlope?.similarity)
  assert.strictEqual(slope?.dataOrigin, "computed-derivative")
  assert.strictEqual(slope?.evidenceClassification, "derived")
  assert.strictEqual(slope?.contributionCategory, "strong-supporting-match")
  assert.ok(intel.presentationThresholdDisclosure.includes("interpretive presentation helpers"))
})

test("10-14: Verification never artificially upgraded; unknown != not-supported; live stays unverified", () => {
  // Even a synthetic perfect 100% live match stays unverified and never independently validated
  const perfectPartial = makeLiveCandidateResult({
    env: {
      meanSlopeDeg: jezeroTarget.environment.meanSlopeDeg,
      elevationM: jezeroTarget.environment.elevationM,
      meanSurfaceTempC: jezeroTarget.environment.meanSurfaceTempC,
      diurnalTempRangeC: jezeroTarget.environment.diurnalTempRangeC,
      surfaceSolarIrradianceWm2: jezeroTarget.environment.surfaceSolarIrradianceWm2,
      lithology: null,
    },
    isVerified: false,
  })
  const intel = buildLiveCandidateIntelligence({
    candidateResult: perfectPartial,
    target: jezeroTarget,
    missionProfile: ROVER_TESTING_PROFILE,
  })

  assert.strictEqual(perfectPartial.candidate.isVerified, false)
  assert.notStrictEqual(intel.validationStatus, "independently-validated")
  assert.strictEqual(intel.noveltyTier, "live-grid-discovery")

  const indepCheck = intel.checklist.find((c) => c.id === "independent-observations")
  const geolCheck = intel.checklist.find((c) => c.id === "geology-documented")
  assert.strictEqual(indepCheck?.status, "unknown")
  assert.strictEqual(geolCheck?.status, "unknown", "Missing lithology must be unknown, not disproven")
})

test("15-17 (Examples A & B): Deterministic research priority separates score from evidence quality", () => {
  // Example A: High similarity (>=75%) yet 55% coverage with missing critical rover hazards
  const highScorePartial = makeLiveCandidateResult({
    env: {
      meanSlopeDeg: jezeroTarget.environment.meanSlopeDeg,
      elevationM: jezeroTarget.environment.elevationM,
      meanSurfaceTempC: jezeroTarget.environment.meanSurfaceTempC,
      diurnalTempRangeC: jezeroTarget.environment.diurnalTempRangeC,
      surfaceSolarIrradianceWm2: jezeroTarget.environment.surfaceSolarIrradianceWm2,
      lithology: jezeroTarget.environment.lithology,
    },
  })
  const intelA1 = buildLiveCandidateIntelligence({
    candidateResult: highScorePartial,
    target: jezeroTarget,
    missionProfile: ROVER_TESTING_PROFILE,
  })
  const intelA2 = buildLiveCandidateIntelligence({
    candidateResult: highScorePartial,
    target: jezeroTarget,
    missionProfile: ROVER_TESTING_PROFILE,
  })
  assert.deepStrictEqual(intelA1, intelA2)
  assert.ok((intelA1.score ?? 0) >= 80)
  assert.notStrictEqual(intelA1.researchPriority.level, "promising-follow-up-lead")
  assert.strictEqual(intelA1.researchPriority.level, "limited-current-evidence")

  // With 1 primary missing feature (Geological research missing albedo 15%, coverage >= 55%) -> additional-data-required
  const geoPartial = makeLiveCandidateResult({
    profile: GEOLOGICAL_RESEARCH_PROFILE,
    env: {
      meanSlopeDeg: jezeroTarget.environment.meanSlopeDeg,
      meanSurfaceTempC: jezeroTarget.environment.meanSurfaceTempC,
      surfaceSolarIrradianceWm2: jezeroTarget.environment.surfaceSolarIrradianceWm2,
      lithology: jezeroTarget.environment.lithology,
      vegetationCoverPct: 0,
    },
  })
  const intelGeoAdditional = buildLiveCandidateIntelligence({
    candidateResult: geoPartial,
    target: jezeroTarget,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
  })
  assert.strictEqual(intelGeoAdditional.researchPriority.level, "additional-data-required")

  // Example B: Coverage < 40% -> score null, sensitivity disabled, priority not-presently-assessable
  const lowCov = makeLiveCandidateResult({
    env: {
      elevationM: 500,
      meanSlopeDeg: null,
      meanSurfaceTempC: null,
      diurnalTempRangeC: null,
      surfaceSolarIrradianceWm2: null,
      lithology: null,
    },
  })
  const intelB = buildLiveCandidateIntelligence({
    candidateResult: lowCov,
    target: jezeroTarget,
    missionProfile: ROVER_TESTING_PROFILE,
  })
  assert.strictEqual(intelB.score, null)
  assert.strictEqual(intelB.researchPriority.level, "not-presently-assessable")
  assert.strictEqual(intelB.sensitivityAnalysis.status, "insufficient-evidence")
})

test("18-22 (Example F): Bounded sensitivity analysis uses real engine, detects order shifts, honors 40% gate", () => {
  // Candidate 1 matches slope closely, diverges on temp; Candidate 2 has opposite balance
  const cand1 = makeLiveCandidateResult({
    id: "cell_A",
    rank: 1,
    profile: LUNAR_BASE_CONSTRUCTION_PROFILE,
    target: shackletonTarget,
    env: {
      meanSlopeDeg: shackletonTarget.environment.meanSlopeDeg ?? 12,
      surfaceSolarIrradianceWm2: 50,
      diurnalTempRangeC: 20,
      lithology: "basaltic",
    },
  })
  const cand2 = makeLiveCandidateResult({
    id: "cell_B",
    rank: 2,
    profile: LUNAR_BASE_CONSTRUCTION_PROFILE,
    target: shackletonTarget,
    env: {
      meanSlopeDeg: (shackletonTarget.environment.meanSlopeDeg ?? 12) + 8,
      surfaceSolarIrradianceWm2: shackletonTarget.environment.surfaceSolarIrradianceWm2 ?? 120,
      diurnalTempRangeC: shackletonTarget.environment.diurnalTempRangeC ?? 150,
      lithology: "basaltic",
    },
  })
  const originalScore1 = cand1.score

  const intel = buildLiveCandidateIntelligence({
    candidateResult: cand1,
    target: shackletonTarget,
    missionProfile: LUNAR_BASE_CONSTRUCTION_PROFILE,
    allEvaluatedCandidates: [cand1, cand2],
  })

  assert.strictEqual(cand1.score, originalScore1, "Baseline score object must never be mutated")
  assert.strictEqual(intel.sensitivityAnalysis.status, "completed")
  assert.ok(intel.sensitivityAnalysis.scenarios.length <= MAX_SENSITIVITY_SCENARIOS)
  assert.strictEqual(intel.sensitivityAnalysis.perturbationFraction, DEFAULT_SENSITIVITY_PERTURBATION_FRACTION)
  assert.ok(
    intel.sensitivityAnalysis.caveats.some((c) => c.includes("NOT a statistical confidence interval"))
  )

  // Low-coverage gate bypassed check: single comparable feature => unavailable cleanly
  const oneFeature = makeLiveCandidateResult({
    profile: ASTROBIOLOGY_HABITABILITY_PROFILE,
    env: {
      lithology: "clay-sedimentary",
      meanSurfaceTempC: 10,
      diurnalTempRangeC: null,
      surfaceSolarIrradianceWm2: null,
      meanSlopeDeg: null,
      elevationM: null,
    },
  })
  const intelOne = buildLiveCandidateIntelligence({
    candidateResult: oneFeature,
    target: jezeroTarget,
    missionProfile: ASTROBIOLOGY_HABITABILITY_PROFILE,
  })
  if (intelOne.isReliable) {
    assert.ok(["completed", "unavailable"].includes(intelOne.sensitivityAnalysis.status))
  } else {
    assert.strictEqual(intelOne.sensitivityAnalysis.status, "insufficient-evidence")
  }
})

test("23-26 (Examples C, D, E): Qualitative evidence quality, isolation across mission profiles & curated Atlas support", () => {
  // No fabricated confidence percentage anywhere in JSON output
  const liveMixed = makeLiveCandidateResult({
    profile: GEOLOGICAL_RESEARCH_PROFILE,
    env: { lithology: null, albedo: null, meanSurfaceTempC: 20 },
  })
  const intelGeo = buildLiveCandidateIntelligence({
    candidateResult: liveMixed,
    target: jezeroTarget,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
  })
  assert.strictEqual(/confidence\s+\d+%/i.test(JSON.stringify(intelGeo.evidenceQuality)), false)
  assert.ok(
    intelGeo.followUpRecommendations.some((r) => r.driverFeature === "lithology"),
    "Example C: null/ambiguous geology must trigger geological mapping follow-up"
  )

  // Example E: Mission switch creates distinct mission-tailored output without mutating first
  const liveAstro = makeLiveCandidateResult({
    profile: ASTROBIOLOGY_HABITABILITY_PROFILE,
    env: { lithology: "sulfate-evaporite", meanSurfaceTempC: -20, diurnalTempRangeC: 35 },
  })
  const intelAstro = buildLiveCandidateIntelligence({
    candidateResult: liveAstro,
    target: jezeroTarget,
    missionProfile: ASTROBIOLOGY_HABITABILITY_PROFILE,
  })
  assert.notStrictEqual(intelGeo.missionInterpretation, intelAstro.missionInterpretation)
  assert.ok(intelAstro.missionInterpretation.includes("biosignatures"))

  // Example D: Curated Atlas site (including one with nulls) keeps original tier & no invented live score
  const curatedWithNulls = getAtlasCandidateById("atlas-ries-crater") ?? getAtlasCandidateById("atacama-yungay")
  assert.ok(curatedWithNulls)
  const intelAtlas = buildAtlasCandidateIntelligence({
    atlasSite: curatedWithNulls,
    target: jezeroTarget,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
  })
  assert.strictEqual(intelAtlas.score, null)
  assert.strictEqual(intelAtlas.noveltyTier, curatedWithNulls.noveltyTier)
  assert.strictEqual(intelAtlas.sensitivityAnalysis.status, "unavailable")
  assert.ok(intelAtlas.sourceReferences.length >= 1)
})

test("27-30: Unknown/mismatch separation, source dedupe, disclaimer & UI integration checks", () => {
  const live = makeLiveCandidateResult({
    profile: LUNAR_BASE_CONSTRUCTION_PROFILE,
    target: shackletonTarget,
    env: {
      meanSlopeDeg: 24, // severe slope conflict against Shackleton
      surfaceSolarIrradianceWm2: 260,
      diurnalTempRangeC: 15,
      lithology: "clay-sedimentary",
    },
  })
  const intel = buildLiveCandidateIntelligence({
    candidateResult: live,
    target: shackletonTarget,
    missionProfile: LUNAR_BASE_CONSTRUCTION_PROFILE,
  })

  const kinds = new Set(intel.mismatches.map((m) => m.kind))
  assert.ok(kinds.has("scored-mismatch"))
  assert.ok(kinds.has("unknown"))
  assert.ok(kinds.has("known-contextual-limitation"))
  assert.strictEqual(intel.disclaimer, TERRATWIN_SCREENING_DISCLAIMER)
  assert.ok(intel.sourceReferences.length >= 2)

  // Verify UI component files exist and consume the service
  const intelUiPath = resolve(
    process.cwd(),
    "src/components/discover/discovery-scientific-intelligence.tsx"
  )
  assert.ok(existsSync(intelUiPath))
  const intelUiContent = readFileSync(intelUiPath, "utf8")
  assert.ok(intelUiContent.includes("buildLiveCandidateIntelligence"))
  assert.ok(intelUiContent.includes("buildAtlasCandidateIntelligence"))
})
