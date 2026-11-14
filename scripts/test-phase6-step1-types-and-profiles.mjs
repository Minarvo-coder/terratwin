/**
 * TerraTwin — Phase 6, Step 1 Automated Verification Suite
 * 
 * Verifies:
 * 1. Both new mission purposes exist ('lunar-base-construction', 'astrobiology-habitability').
 * 2. Existing mission purposes still exist ('rover-testing', 'geological-research').
 * 3. All four profiles have valid feature weights in MISSION_PURPOSES and CONFIGURABLE_MISSION_PROFILES.
 * 4. Each profile's weights sum to 1.0 within floating-point tolerance (1e-5).
 * 5. No weights are negative across any profile.
 * 6. Legacy mission rankings and scores remain 100% unchanged for existing fixtures.
 * 7. All nine AnalogEnvironmentCategory definitions are valid and complete.
 * 8. All three AnalogNoveltyTier definitions are valid and strictly decoupled from similarity scoring.
 * 9. Existing EarthCandidate objects work without the new optional fields, and optional fields are supported.
 * 10. Null and missing values remain strictly missing_data and are never replaced with zero.
 */

import test from 'node:test'
import assert from 'node:assert'

import {
  MISSION_PURPOSES,
  getMissionPurpose,
  isMissionPurpose,
  ANALOG_ENVIRONMENT_CATEGORIES,
  ANALOG_ENVIRONMENT_CATEGORY_MAP,
  ANALOG_ENVIRONMENT_CATEGORY_LABELS,
  isAnalogEnvironmentCategory,
  ANALOG_NOVELTY_TIERS,
  ANALOG_NOVELTY_TIER_MAP,
  ANALOG_NOVELTY_TIER_LABELS,
  isAnalogNoveltyTier,
  FEATURES,
} from '../src/lib/terratwin/features.ts'

import {
  ROVER_TESTING_PROFILE,
  GEOLOGICAL_RESEARCH_PROFILE,
  LUNAR_BASE_CONSTRUCTION_PROFILE,
  ASTROBIOLOGY_HABITABILITY_PROFILE,
  CONFIGURABLE_MISSION_PROFILES,
  validateMissionWeights,
} from '../src/lib/terratwin/config/comparison-config.ts'

import {
  computeAnalogSimilarity,
  rankCandidateLocations,
} from '../src/lib/terratwin/similarity-engine.ts'

import { resolveMissionProfile } from '../src/lib/terratwin/services/compare-service.ts'
import { SAMPLE_TARGETS, SAMPLE_CANDIDATES } from '../src/lib/terratwin/sample-dataset.ts'

test('1. Both new mission purposes exist (lunar-base-construction, astrobiology-habitability)', () => {
  const purposeIds = MISSION_PURPOSES.map((p) => p.id)
  assert.ok(purposeIds.includes('lunar-base-construction'), 'Missing new lunar-base-construction purpose')
  assert.ok(purposeIds.includes('astrobiology-habitability'), 'Missing new astrobiology-habitability purpose')

  for (const id of ['lunar-base-construction', 'astrobiology-habitability']) {
    assert.strictEqual(isMissionPurpose(id), true, `isMissionPurpose("${id}") must be true`)
    const def = getMissionPurpose(id)
    assert.ok(def, `getMissionPurpose("${id}") must return a definition`)
    assert.strictEqual(def.id, id)
    assert.ok(def.label.length > 0)
    assert.ok(def.summary.length > 0)

    const resolved = resolveMissionProfile(id)
    assert.strictEqual(resolved.id, id, `resolveMissionProfile("${id}") must return matching profile`)
  }
})

test('2. Existing mission purposes still exist (rover-testing, geological-research)', () => {
  const purposeIds = MISSION_PURPOSES.map((p) => p.id)
  assert.strictEqual(MISSION_PURPOSES.length, 4, 'Expected exactly 4 mission purposes in MISSION_PURPOSES')
  assert.ok(purposeIds.includes('rover-testing'), 'Missing legacy rover-testing purpose')
  assert.ok(purposeIds.includes('geological-research'), 'Missing legacy geological-research purpose')

  for (const id of ['rover-testing', 'geological-research']) {
    assert.strictEqual(isMissionPurpose(id), true, `isMissionPurpose("${id}") must be true`)
    const def = getMissionPurpose(id)
    assert.ok(def, `getMissionPurpose("${id}") must return a definition`)
    assert.strictEqual(def.id, id)

    const resolved = resolveMissionProfile(id)
    assert.strictEqual(resolved.id, id, `resolveMissionProfile("${id}") must return matching profile`)
  }

  assert.strictEqual(isMissionPurpose('invalid-purpose'), false)
})

test('3. All four mission profiles have valid feature weights across registered features', () => {
  assert.strictEqual(CONFIGURABLE_MISSION_PROFILES.length, 4, 'Expected 4 configurable mission profiles')
  const validFeatureKeys = new Set(FEATURES.map((f) => f.key))

  for (const profile of CONFIGURABLE_MISSION_PROFILES) {
    for (const [key, weight] of Object.entries(profile.weights)) {
      assert.ok(validFeatureKeys.has(key), `Unknown feature key "${key}" in profile "${profile.id}"`)
      assert.ok(typeof weight === 'number' && !Number.isNaN(weight), `Non-numeric weight for "${key}"`)
    }

    // Verify consistency between MISSION_PURPOSES and CONFIGURABLE_MISSION_PROFILES
    const purposeDef = getMissionPurpose(profile.id)
    assert.ok(purposeDef, `Missing corresponding MISSION_PURPOSES entry for "${profile.id}"`)
    assert.deepStrictEqual(
      purposeDef.weights,
      profile.weights,
      `Weights mismatch between MISSION_PURPOSES and CONFIGURABLE_MISSION_PROFILES for "${profile.id}"`,
    )
  }

  // Verify specific scientific integrity constraints on new profiles:
  // 1. In astrobiology-habitability, vegetationCoverPct must be 0.0 (never treated as habitability indicator)
  assert.strictEqual(
    ASTROBIOLOGY_HABITABILITY_PROFILE.weights.vegetationCoverPct,
    0.0,
    'vegetationCoverPct must have 0.0 weight in astrobiology-habitability profile',
  )
  // 2. Non-comparable cross-body features must have 0.0 weight across all 4 profiles
  for (const profile of CONFIGURABLE_MISSION_PROFILES) {
    assert.strictEqual(profile.weights.annualPrecipitationMm, 0.0)
    assert.strictEqual(profile.weights.surfacePressurePa, 0.0)
  }
})

test('4. Each profile weights sum to 1.0 within floating-point tolerance (1e-5)', () => {
  for (const profile of CONFIGURABLE_MISSION_PROFILES) {
    const validation = validateMissionWeights(profile.weights, 1e-5)
    assert.strictEqual(
      validation.isValid,
      true,
      `Profile "${profile.id}" failed weight validation: ${validation.errors.join('; ')}`,
    )
    assert.ok(
      Math.abs(validation.sum - 1.0) <= 1e-5,
      `Profile "${profile.id}" weights sum to ${validation.sum}, expected 1.0`,
    )
  }
})

test('5. No weights are negative across any mission profile', () => {
  for (const profile of CONFIGURABLE_MISSION_PROFILES) {
    for (const [key, weight] of Object.entries(profile.weights)) {
      assert.ok(weight >= 0, `Negative weight ${weight} for "${key}" in profile "${profile.id}"`)
    }
  }
})

test('6. Legacy mission weights and rankings remain 100% unchanged for existing fixtures', () => {
  // Verify exact legacy weight values for rover-testing
  assert.deepStrictEqual(ROVER_TESTING_PROFILE.weights, {
    meanSlopeDeg: 0.25,
    rockAbundancePct: 0.20,
    medianGrainSizeMm: 0.15,
    elevationM: 0.10,
    vegetationCoverPct: 0.10,
    diurnalTempRangeC: 0.05,
    meanSurfaceTempC: 0.05,
    surfaceSolarIrradianceWm2: 0.05,
    lithology: 0.05,
    albedo: 0.0,
    annualPrecipitationMm: 0.0,
    surfacePressurePa: 0.0,
  })

  // Verify exact legacy weight values for geological-research
  assert.deepStrictEqual(GEOLOGICAL_RESEARCH_PROFILE.weights, {
    lithology: 0.30,
    vegetationCoverPct: 0.15,
    albedo: 0.15,
    medianGrainSizeMm: 0.10,
    rockAbundancePct: 0.10,
    meanSlopeDeg: 0.10,
    meanSurfaceTempC: 0.05,
    surfaceSolarIrradianceWm2: 0.05,
    diurnalTempRangeC: 0.0,
    elevationM: 0.0,
    annualPrecipitationMm: 0.0,
    surfacePressurePa: 0.0,
  })

  // Verify deterministic ranking on SAMPLE_TARGETS[2] (Jezero) vs SAMPLE_CANDIDATES
  const jezero = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  assert.ok(jezero)

  const roverRankings = rankCandidateLocations(jezero, SAMPLE_CANDIDATES, ROVER_TESTING_PROFILE)
  assert.strictEqual(roverRankings.length, SAMPLE_CANDIDATES.length)
  assert.strictEqual(roverRankings[0].rank, 1)
  assert.strictEqual(roverRankings[0].candidate.id, 'hanksville-mdrs')
  assert.strictEqual(roverRankings[0].score, 87.1)
  assert.strictEqual(roverRankings[2].candidate.id, 'lake-salda')
  assert.strictEqual(roverRankings[2].score, 79.9)

  const geoRankings = rankCandidateLocations(jezero, SAMPLE_CANDIDATES, GEOLOGICAL_RESEARCH_PROFILE)
  assert.strictEqual(geoRankings.length, SAMPLE_CANDIDATES.length)
  assert.strictEqual(geoRankings[0].rank, 1)
  assert.strictEqual(geoRankings[0].candidate.id, 'pilbara')
  assert.strictEqual(geoRankings[0].score, 89.0)
  assert.strictEqual(geoRankings[2].candidate.id, 'lake-salda')
  assert.strictEqual(geoRankings[2].score, 87.2)
})

test('7. All nine AnalogEnvironmentCategory values are valid and documented', () => {
  const expectedCategories = [
    'salt-flats-evaporites',
    'polar-permafrost',
    'volcanic-fields',
    'impact-craters',
    'high-altitude-plateaus',
    'glacial-outwash',
    'lava-tubes-caves',
    'dry-river-deltas',
    'serpentinizing-acidic-mineral-systems',
  ]

  assert.strictEqual(ANALOG_ENVIRONMENT_CATEGORIES.length, 9, 'Expected exactly 9 analog environment categories')

  for (const catId of expectedCategories) {
    assert.strictEqual(isAnalogEnvironmentCategory(catId), true, `Expected "${catId}" to be a valid category`)
    const def = ANALOG_ENVIRONMENT_CATEGORY_MAP[catId]
    assert.ok(def, `Missing map definition for "${catId}"`)
    assert.strictEqual(def.id, catId)
    assert.ok(def.label.length > 5)
    assert.ok(def.shortLabel.length > 3)
    assert.ok(def.description.length > 20)
    assert.ok(def.planetaryRelevance.length > 20)
    assert.ok(def.scientificCaveat.length > 20)
    assert.strictEqual(ANALOG_ENVIRONMENT_CATEGORY_LABELS[catId], def.label)
  }

  assert.strictEqual(isAnalogEnvironmentCategory('tropical-rainforest'), false)
})

test('8. All three AnalogNoveltyTier values are valid and decoupled from similarity scoring', () => {
  const expectedTiers = [
    'canonical-benchmark',
    'under-explored-analog',
    'live-grid-discovery',
  ]

  assert.strictEqual(ANALOG_NOVELTY_TIERS.length, 3, 'Expected exactly 3 analog novelty tiers')

  for (const tierId of expectedTiers) {
    assert.strictEqual(isAnalogNoveltyTier(tierId), true, `Expected "${tierId}" to be a valid novelty tier`)
    const def = ANALOG_NOVELTY_TIER_MAP[tierId]
    assert.ok(def, `Missing map definition for "${tierId}"`)
    assert.strictEqual(def.id, tierId)
    assert.ok(def.label.length > 5)
    assert.ok(def.description.length > 20)
    assert.ok(def.assignmentCriteria.length > 20)
    assert.ok(def.evidenceRequired.length > 20)
    assert.ok(def.scientificCaveat.length > 20)
    assert.strictEqual(ANALOG_NOVELTY_TIER_LABELS[tierId], def.label)
  }

  assert.strictEqual(isAnalogNoveltyTier('unverified-novelty'), false)
})

test('9. Backward compatibility of EarthCandidate & strict decoupling of metadata from similarity scores', () => {
  const target = SAMPLE_TARGETS[0] // Mare Tranquillitatis

  // Legacy EarthCandidate without optional fields
  const legacyCandidate = {
    id: 'test-legacy-cand',
    name: 'Legacy Candidate',
    country: 'Test Country',
    latitude: 20.0,
    longitude: -110.0,
    setting: 'Basaltic plain',
    summary: 'Candidate without Phase 6 optional fields.',
    environment: {
      meanSurfaceTempC: 10,
      diurnalTempRangeC: 20,
      annualPrecipitationMm: 100,
      meanSlopeDeg: 3.5,
      rockAbundancePct: 4,
      medianGrainSizeMm: 0.1,
      albedo: 0.08,
      vegetationCoverPct: 0,
      lithology: 'basaltic',
      elevationM: 500,
      surfacePressurePa: 95000,
      surfaceSolarIrradianceWm2: 260,
    },
  }

  // Extended EarthCandidate with identical environmental telemetry PLUS Phase 6 optional metadata
  const extendedCandidate = {
    ...legacyCandidate,
    id: 'test-extended-cand',
    category: 'volcanic-fields',
    noveltyTier: 'under-explored-analog',
    boundingBox: [19.85, -110.15, 20.15, -109.85], // [minLat, minLon, maxLat, maxLon]
    windSpeedMs: 5.4,
  }

  // Evaluate across all 4 mission profiles: scores and distances MUST be 100% identical
  // proving that noveltyTier, category, boundingBox, and windSpeedMs do not skew or alter similarity math
  for (const profile of CONFIGURABLE_MISSION_PROFILES) {
    const resLegacy = computeAnalogSimilarity(target, legacyCandidate, profile)
    const resExtended = computeAnalogSimilarity(target, extendedCandidate, profile)

    assert.strictEqual(
      resLegacy.score,
      resExtended.score,
      `Similarity score must be identical regardless of noveltyTier/category under profile "${profile.id}"`,
    )
    assert.strictEqual(resLegacy.weightedDistance, resExtended.weightedDistance)
    assert.strictEqual(resLegacy.coverage, resExtended.coverage)
  }
})

test('10. Null and missing values remain missing_data and are never replaced with zero across new profiles', () => {
  const target = SAMPLE_TARGETS[1] // South polar highlands (Moon)

  const partialCandidate = {
    id: 'partial-grid-cell',
    name: 'Partial Grid Screening Cell',
    country: 'Antarctica',
    latitude: -78.0,
    longitude: 160.0,
    setting: 'Polar highland ridge',
    summary: 'Grid cell missing grain size and rock abundance.',
    category: 'polar-permafrost',
    noveltyTier: 'live-grid-discovery',
    boundingBox: [-78.1, 159.9, -77.9, 160.1],
    windSpeedMs: null,
    environment: {
      meanSurfaceTempC: -35,
      diurnalTempRangeC: 15,
      annualPrecipitationMm: 50,
      meanSlopeDeg: 14,
      rockAbundancePct: null, // missing (weight 0.20 in lunar-base-construction)
      medianGrainSizeMm: null, // missing (weight 0.10 in lunar-base-construction)
      albedo: 0.20,
      vegetationCoverPct: 0,
      lithology: 'anorthositic',
      elevationM: 1200,
      surfacePressurePa: 85000,
      surfaceSolarIrradianceWm2: 115,
    },
  }

  const lunarRes = computeAnalogSimilarity(target, partialCandidate, LUNAR_BASE_CONSTRUCTION_PROFILE)
  assert.ok(lunarRes.missingFeatures.includes('rockAbundancePct'))
  assert.ok(lunarRes.missingFeatures.includes('medianGrainSizeMm'))
  // Active weight is 1.00; missing weight is 0.20 + 0.10 = 0.30 -> coverage must be 0.70
  assert.strictEqual(lunarRes.coverage, 0.70, 'Coverage must be 0.70 when 0.30 weight is missing')
  assert.strictEqual(lunarRes.isReliable, true)
  assert.ok(typeof lunarRes.score === 'number' && lunarRes.score > 0)

  const rockFeat = lunarRes.featureScores.find((f) => f.key === 'rockAbundancePct')
  assert.strictEqual(rockFeat.candidateValue, null, 'Null candidate value must never be coerced to 0')
  assert.strictEqual(rockFeat.status, 'missing_data')
  assert.strictEqual(rockFeat.similarity, null)

  const astroRes = computeAnalogSimilarity(target, partialCandidate, ASTROBIOLOGY_HABITABILITY_PROFILE)
  assert.ok(astroRes.missingFeatures.includes('rockAbundancePct'))
  assert.ok(astroRes.missingFeatures.includes('medianGrainSizeMm'))
  // In astrobiology-habitability, missing weight is 0.05 (rock) + 0.10 (grain) = 0.15 -> coverage = 0.85
  assert.strictEqual(astroRes.coverage, 0.85, 'Coverage must be 0.85 under astrobiology-habitability profile')
  assert.strictEqual(astroRes.isReliable, true)
})
