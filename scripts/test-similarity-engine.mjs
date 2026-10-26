import test from 'node:test'
import assert from 'node:assert'
import {
  computeAnalogSimilarity,
  rankCandidateLocations,
  evaluateFeatureComparison,
} from '../src/lib/terratwin/similarity-engine.ts'
import {
  COMPARISON_FEATURE_MAP,
  ROVER_TESTING_PROFILE,
  validateMissionWeights,
} from '../src/lib/terratwin/config/comparison-config.ts'

// --- SYNTHETIC TEST FIXTURES (Clearly labeled synthetic data) ---
const SYNTHETIC_TARGET_MARS = {
  id: 'synthetic-mars-target',
  body: 'mars',
  name: 'Synthetic Mars Crater Target',
  region: 'Synthetic Test Basin',
  summary: 'Synthetic baseline target used exclusively for automated test validation.',
  environment: {
    meanSlopeDeg: 5.0,
    rockAbundancePct: 15.0,
    medianGrainSizeMm: 0.30,
    elevationM: -1000.0,
    vegetationCoverPct: 0.0,
    diurnalTempRangeC: 80.0,
    meanSurfaceTempC: -50.0,
    surfaceSolarIrradianceWm2: 150.0,
    lithology: 'clay-sedimentary',
    albedo: 0.20,
    annualPrecipitationMm: 0.0,
    surfacePressurePa: 700.0,
  },
  provenanceMap: {
    meanSlopeDeg: { status: 'illustrative', unit: '°', isComparable: true },
    rockAbundancePct: { status: 'illustrative', unit: '%', isComparable: true },
    medianGrainSizeMm: { status: 'illustrative', unit: 'mm', isComparable: true },
    elevationM: { status: 'illustrative', unit: 'm', isComparable: true },
    vegetationCoverPct: { status: 'illustrative', unit: '%', isComparable: true },
    diurnalTempRangeC: { status: 'illustrative', unit: '°C', isComparable: true },
    meanSurfaceTempC: { status: 'illustrative', unit: '°C', isComparable: true },
    surfaceSolarIrradianceWm2: { status: 'illustrative', unit: 'W/m²', isComparable: true },
    lithology: { status: 'illustrative', unit: '', isComparable: true },
    albedo: { status: 'illustrative', unit: '', isComparable: true },
    annualPrecipitationMm: { status: 'illustrative', unit: 'mm/yr', isComparable: false },
    surfacePressurePa: { status: 'illustrative', unit: 'Pa', isComparable: false },
  },
}

test('REQUIREMENT 1: Two locations with identical valid feature values yield D = 0 and S = 100.0%', () => {
  const identicalCandidate = {
    id: 'synthetic-candidate-identical',
    name: 'Synthetic Identical Analog',
    country: 'Synthetic Earth',
    latitude: 0,
    longitude: 0,
    setting: 'Test Setting',
    summary: 'Synthetic clone of target environment.',
    environment: { ...SYNTHETIC_TARGET_MARS.environment },
    provenanceMap: { ...SYNTHETIC_TARGET_MARS.provenanceMap },
  }

  const result = computeAnalogSimilarity(SYNTHETIC_TARGET_MARS, identicalCandidate, ROVER_TESTING_PROFILE)

  assert.strictEqual(result.isReliable, true)
  assert.strictEqual(result.weightedDistance, 0.0, 'Weighted distance D must be 0 for identical inputs')
  assert.strictEqual(result.score, 100.0, 'Similarity score S must be exactly 100.0%')
  assert.strictEqual(result.scoreDisplay, '100.0%')
  assert.strictEqual(result.coverage, 1.0, 'Coverage must be 100% (1.0)')
  assert.strictEqual(result.missingFeatures.length, 0)
})

test('REQUIREMENT 2: Candidate with larger environmental difference yields higher D and lower S', () => {
  // Candidate A: Close match (slight slope and temperature variation)
  const candidateClose = {
    id: 'synthetic-cand-close',
    name: 'Synthetic Close Analog',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: 'Close Setting',
    summary: 'Close match',
    environment: {
      ...SYNTHETIC_TARGET_MARS.environment,
      meanSlopeDeg: 7.0, // diff: 2 deg / 25 deg tolerance = 0.08
      meanSurfaceTempC: -40.0, // diff: 10 C / 150 C tolerance = 0.067
    },
    provenanceMap: { ...SYNTHETIC_TARGET_MARS.provenanceMap },
  }

  // Candidate B: Distant match (much steeper slope, very hot, heavy vegetation, divergent lithology)
  const candidateDistant = {
    id: 'synthetic-cand-distant',
    name: 'Synthetic Distant Analog',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: 'Distant Setting',
    summary: 'Distant match',
    environment: {
      ...SYNTHETIC_TARGET_MARS.environment,
      meanSlopeDeg: 28.0, // max difference clamped to 1.0
      rockAbundancePct: 60.0, // max difference clamped to 1.0
      vegetationCoverPct: 35.0, // large difference
      meanSurfaceTempC: 35.0, // 85 deg difference
      lithology: 'felsic-crystalline', // divergent rock family
    },
    provenanceMap: { ...SYNTHETIC_TARGET_MARS.provenanceMap },
  }

  const resultClose = computeAnalogSimilarity(SYNTHETIC_TARGET_MARS, candidateClose, ROVER_TESTING_PROFILE)
  const resultDistant = computeAnalogSimilarity(SYNTHETIC_TARGET_MARS, candidateDistant, ROVER_TESTING_PROFILE)

  assert.strictEqual(resultClose.isReliable, true)
  assert.strictEqual(resultDistant.isReliable, true)
  assert.ok((resultClose.weightedDistance ?? 1) < (resultDistant.weightedDistance ?? 0), 'Close analog must have lower D')
  assert.ok((resultClose.score ?? 0) > (resultDistant.score ?? 0), 'Close analog must have higher S')
})

test('REQUIREMENT 3: Missing measurements are omitted from denominator and never silently replaced with zero', () => {
  const candidateMissingData = {
    id: 'synthetic-cand-missing',
    name: 'Synthetic Candidate Missing Slope & Grain Size',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: 'Data Deficit Site',
    summary: 'Missing slope and median grain size telemetry.',
    environment: {
      ...SYNTHETIC_TARGET_MARS.environment,
      meanSlopeDeg: null, // wt: 0.25 (missing)
      medianGrainSizeMm: null, // wt: 0.15 (missing)
    },
    provenanceMap: {
      ...SYNTHETIC_TARGET_MARS.provenanceMap,
      meanSlopeDeg: { status: 'no-data', unit: '°', isComparable: true },
      medianGrainSizeMm: { status: 'no-data', unit: 'mm', isComparable: true },
    },
  }

  const result = computeAnalogSimilarity(SYNTHETIC_TARGET_MARS, candidateMissingData, ROVER_TESTING_PROFILE)

  // 1. Missing features must be tracked explicitly
  assert.ok(result.missingFeatures.includes('meanSlopeDeg'), 'meanSlopeDeg must be in missingFeatures')
  assert.ok(result.missingFeatures.includes('medianGrainSizeMm'), 'medianGrainSizeMm must be in missingFeatures')

  // 2. Total active mission weight = 1.00.
  // Missing weight = 0.25 (slope) + 0.15 (grain size) = 0.40.
  // Remaining valid weight = 1.00 - 0.40 = 0.60.
  assert.strictEqual(result.coverage, 0.60, 'Coverage must be exactly 0.60')

  // 3. For the remaining available features, candidate is identical to target, so remaining D = 0, S = 100.0%.
  // If missing values had been replaced with zero:
  // - slope 0 would produce diff 5/25 = 0.20
  // - grain size 0 would produce huge diff
  // and score would falsely plummet. Here, because missing values are omitted from denominator, score = 100.0%!
  assert.strictEqual(result.score, 100.0, 'Missing features must not be treated as 0; remaining identical features yield 100.0%')
})

test('REQUIREMENT 4: Incompatible units are rejected and excluded from score denominator', () => {
  const slopeDef = COMPARISON_FEATURE_MAP.meanSlopeDeg

  // Case A: Compatible units (° vs °)
  const evalCompatible = evaluateFeatureComparison(
    slopeDef,
    0.25,
    10,
    10,
    { status: 'illustrative', unit: '°', isComparable: true },
    { status: 'illustrative', unit: '°', isComparable: true },
  )
  assert.strictEqual(evalCompatible.status, 'comparable')
  assert.strictEqual(evalCompatible.difference, 0.0)

  // Case B: Incompatible units (° vs radians)
  const evalIncompatible = evaluateFeatureComparison(
    slopeDef,
    0.25,
    10,
    0.174,
    { status: 'illustrative', unit: '°', isComparable: true },
    { status: 'illustrative', unit: 'rad', isComparable: true },
  )
  assert.strictEqual(evalIncompatible.status, 'incompatible_units')
  assert.strictEqual(evalIncompatible.difference, null)
  assert.strictEqual(evalIncompatible.similarity, null)
  assert.ok(evalIncompatible.statusReason?.includes('Incompatible units'))
})

test('REQUIREMENT 5: Invalid or negative weights are detected and rejected', () => {
  const invalidNegativeWeights = {
    ...ROVER_TESTING_PROFILE.weights,
    meanSlopeDeg: -0.25,
    rockAbundancePct: 0.70, // sums to 1.0, but contains negative weight
  }

  const validation = validateMissionWeights(invalidNegativeWeights)
  assert.strictEqual(validation.isValid, false)
  assert.ok(validation.errors.some((err) => err.includes('negative weight')))

  // Calling computeAnalogSimilarity with negative weights must throw an Error
  assert.throws(() => {
    computeAnalogSimilarity(SYNTHETIC_TARGET_MARS, SYNTHETIC_TARGET_MARS, { weights: invalidNegativeWeights })
  }, /Negative weight detected/)
})

test('REQUIREMENT 6: Weights that do not sum to 1.0 within tolerance are detected and reported', () => {
  // Case A: Sum is 0.85 (under by 0.15)
  const underSumWeights = {
    ...ROVER_TESTING_PROFILE.weights,
    meanSlopeDeg: 0.10, // reduced from 0.25 -> sum = 0.85
  }
  const valUnder = validateMissionWeights(underSumWeights)
  assert.strictEqual(valUnder.isValid, false)
  assert.ok(valUnder.errors.some((err) => err.includes('must sum to 1.0')))

  // Case B: Sum is 1.25 (over by 0.25)
  const overSumWeights = {
    ...ROVER_TESTING_PROFILE.weights,
    meanSlopeDeg: 0.50, // increased from 0.25 -> sum = 1.25
  }
  const valOver = validateMissionWeights(overSumWeights)
  assert.strictEqual(valOver.isValid, false)
  assert.ok(valOver.errors.some((err) => err.includes('must sum to 1.0')))

  // Case C: Valid Rover Profile weights sum exactly to 1.0
  const valValid = validateMissionWeights(ROVER_TESTING_PROFILE.weights)
  assert.strictEqual(valValid.isValid, true)
  assert.strictEqual(valValid.sum, 1.0)
})

test('REQUIREMENT 7: Insufficient data (< 40% mission coverage) returns explicit insufficient-data result', () => {
  // Candidate missing slope (0.25), rock abundance (0.20), grain size (0.15), and elevation (0.10)
  // Missing weight = 0.70; Remaining weight = 0.30 (30% coverage < 40% threshold)
  const candidateSeverelyLacking = {
    id: 'synthetic-cand-insufficient',
    name: 'Severely Data-Deficient Candidate',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: 'Incomplete Survey',
    summary: 'Site lacking almost all trafficability data.',
    environment: {
      ...SYNTHETIC_TARGET_MARS.environment,
      meanSlopeDeg: null, // 0.25 missing
      rockAbundancePct: null, // 0.20 missing
      medianGrainSizeMm: null, // 0.15 missing
      elevationM: null, // 0.10 missing
    },
    provenanceMap: {
      meanSlopeDeg: { status: 'no-data', unit: '°', isComparable: true },
      rockAbundancePct: { status: 'no-data', unit: '%', isComparable: true },
      medianGrainSizeMm: { status: 'no-data', unit: 'mm', isComparable: true },
      elevationM: { status: 'no-data', unit: 'm', isComparable: true },
    },
  }

  const result = computeAnalogSimilarity(SYNTHETIC_TARGET_MARS, candidateSeverelyLacking, ROVER_TESTING_PROFILE)

  assert.strictEqual(result.coverage, 0.30, 'Coverage must be 0.30 (30%)')
  assert.strictEqual(result.isReliable, false, 'Candidate must be flagged isReliable = false')
  assert.strictEqual(result.score, null, 'Score must be null when coverage < 40%')
  assert.strictEqual(result.scoreDisplay, 'Insufficient data to rank reliably')
  assert.strictEqual(result.confidence, 'insufficient')
})

test('REQUIREMENT 8: Data coverage is accurately calculated and reported alongside every score', () => {
  // Candidate with partial data: missing rock abundance (0.20)
  // Total mission weight = 1.00; Available weight = 0.80 -> Coverage = 0.80 (80%)
  const candidate80 = {
    id: 'synthetic-cand-80',
    name: 'Candidate 80% Coverage',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: 'Good Survey',
    summary: 'Site with 80% coverage.',
    environment: {
      ...SYNTHETIC_TARGET_MARS.environment,
      rockAbundancePct: null, // 0.20 missing
    },
    provenanceMap: {
      rockAbundancePct: { status: 'no-data', unit: '%', isComparable: true },
    },
  }

  const result = computeAnalogSimilarity(SYNTHETIC_TARGET_MARS, candidate80, ROVER_TESTING_PROFILE)

  assert.strictEqual(result.coverage, 0.80, 'Coverage must be exactly 0.80 (80%)')
  assert.strictEqual(result.confidence, 'moderate', '80% coverage corresponds to moderate confidence')
  assert.strictEqual(result.isReliable, true)
  assert.ok(typeof result.score === 'number')
})

test('Deterministic Ranking: rankCandidateLocations places reliable candidates first and sorts unreliables by coverage', () => {
  const candidateHigh = {
    id: 'cand-high',
    name: 'Cand High Match (100% cov)',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: '',
    summary: '',
    environment: { ...SYNTHETIC_TARGET_MARS.environment },
  }

  const candidateModerate = {
    id: 'cand-mod',
    name: 'Cand Moderate Match (100% cov)',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: '',
    summary: '',
    environment: {
      ...SYNTHETIC_TARGET_MARS.environment,
      meanSlopeDeg: 12.0,
      rockAbundancePct: 30.0,
    },
  }

  const candidateInsufficient = {
    id: 'cand-insuf',
    name: 'Cand Insufficient (20% cov)',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: '',
    summary: '',
    environment: {
      meanSlopeDeg: null,
      rockAbundancePct: null,
      medianGrainSizeMm: null,
      elevationM: null,
      vegetationCoverPct: null,
      diurnalTempRangeC: null,
      meanSurfaceTempC: -50.0,
      surfaceSolarIrradianceWm2: 150.0,
    },
  }

  const ranked = rankCandidateLocations(
    SYNTHETIC_TARGET_MARS,
    [candidateInsufficient, candidateModerate, candidateHigh],
    ROVER_TESTING_PROFILE,
  )

  assert.strictEqual(ranked.length, 3)
  assert.strictEqual(ranked[0].candidate.id, 'cand-high')
  assert.strictEqual(ranked[0].rank, 1)
  assert.strictEqual(ranked[1].candidate.id, 'cand-mod')
  assert.strictEqual(ranked[1].rank, 2)
  assert.strictEqual(ranked[2].candidate.id, 'cand-insuf')
  assert.strictEqual(ranked[2].rank, 3)
  assert.strictEqual(ranked[2].score, null)
})
