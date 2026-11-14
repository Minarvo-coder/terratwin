/**
 * TerraTwin — Phase 6, Step 2 Automated Verification Suite
 * 
 * Tests the Global Analog Discovery Atlas:
 * 1. The atlas loads successfully.
 * 2. At least 24 unique candidate records exist (verified count: 31).
 * 3. Existing eight foundational benchmark candidates are preserved.
 * 4. Candidate IDs are unique.
 * 5. Coordinates are valid (lat in [-90, 90], lon in [-180, 180]).
 * 6. Bounding boxes use [minLatitude, minLongitude, maxLatitude, maxLongitude].
 * 7. Every category value is valid across all 9 categories.
 * 8. Every novelty tier is valid.
 * 9. Curated entries are not incorrectly assigned 'live-grid-discovery'.
 * 10. Candidate metadata does not affect similarity scoring.
 * 11. Missing measurements remain missing (never replaced with 0).
 * 12. Every candidate has source/provenance information.
 * 13. Category filtering works across all 9 categories.
 * 14. Novelty filtering works.
 * 15. Mission-purpose filtering works across all 4 mission profiles.
 * 16. Existing candidate retrieval and similarity ranking remain backward compatible.
 * 17. Multi-criteria filtering and summary statistics work deterministically.
 */

import test from 'node:test'
import assert from 'node:assert'

import {
  GLOBAL_DISCOVERY_ATLAS,
} from '../src/lib/terratwin/discovery-atlas.ts'

import {
  getAllAtlasCandidates,
  getAtlasCandidateById,
  getAtlasCandidatesByCategory,
  getAtlasCandidatesByNoveltyTier,
  getAtlasCandidatesByMissionPurpose,
  getAtlasCandidatesByCountry,
  getAtlasCandidatesWithEvidence,
  getAtlasCandidatesWithIncompleteData,
  getAtlasCandidatesWithCompleteData,
  filterAtlasCandidates,
  getAtlasSummaryStatistics,
  getCandidateMissingFeatures,
  ATLAS_ID_ALIASES,
} from '../src/lib/terratwin/services/discovery-atlas-service.ts'

import {
  ANALOG_ENVIRONMENT_CATEGORIES,
  isAnalogEnvironmentCategory,
  ANALOG_NOVELTY_TIERS,
  isAnalogNoveltyTier,
  MISSION_PURPOSES,
} from '../src/lib/terratwin/features.ts'

import {
  ROVER_TESTING_PROFILE,
  GEOLOGICAL_RESEARCH_PROFILE,
  LUNAR_BASE_CONSTRUCTION_PROFILE,
  ASTROBIOLOGY_HABITABILITY_PROFILE,
} from '../src/lib/terratwin/config/comparison-config.ts'

import {
  computeAnalogSimilarity,
  rankCandidateLocations,
} from '../src/lib/terratwin/similarity-engine.ts'

import { SAMPLE_TARGETS, SAMPLE_CANDIDATES } from '../src/lib/terratwin/sample-dataset.ts'

test('Check 1 — The atlas loads successfully', () => {
  assert.ok(Array.isArray(GLOBAL_DISCOVERY_ATLAS), 'GLOBAL_DISCOVERY_ATLAS must be an array')
  assert.ok(GLOBAL_DISCOVERY_ATLAS.length > 0, 'Atlas must not be empty')
  
  const allCandidates = getAllAtlasCandidates()
  assert.strictEqual(allCandidates.length, GLOBAL_DISCOVERY_ATLAS.length)
})

test('Check 2 — At least 24 unique candidate records exist', () => {
  const count = GLOBAL_DISCOVERY_ATLAS.length
  assert.ok(count >= 24, `Expected at least 24 candidates, got ${count}`)
  // Verify exact loaded count
  assert.strictEqual(count, 31, `Expected 31 vetted candidates in atlas, got ${count}`)
})

test('Check 3 — Existing eight foundational benchmark candidates are preserved', () => {
  const canonicalBenchmarkIds = [
    'c0000001-0000-4000-8000-000000000001', // Atacama
    'c0000002-0000-4000-8000-000000000002', // Mauna Kea
    'c0000003-0000-4000-8000-000000000003', // Haughton
    'c0000004-0000-4000-8000-000000000004', // McMurdo
    'c0000005-0000-4000-8000-000000000005', // Lake Salda
    'c0000006-0000-4000-8000-000000000006', // Craters of the Moon
    'c0000007-0000-4000-8000-000000000007', // Askja / Holuhraun
    'c0000008-0000-4000-8000-000000000008', // Río Tinto
  ]

  for (const id of canonicalBenchmarkIds) {
    const candidate = getAtlasCandidateById(id)
    assert.ok(candidate, `Benchmark candidate ${id} must exist in atlas`)
    assert.strictEqual(candidate.noveltyTier, 'canonical-benchmark')
    assert.ok(candidate.name.length > 0)
    assert.ok(candidate.country.length > 0)
    assert.ok(candidate.environment)
  }

  // Also test resolution via sample aliases
  assert.strictEqual(getAtlasCandidateById('atacama-yungay')?.id, 'c0000001-0000-4000-8000-000000000001')
  assert.strictEqual(getAtlasCandidateById('mauna-kea')?.id, 'c0000002-0000-4000-8000-000000000002')
  assert.strictEqual(getAtlasCandidateById('haughton-crater')?.id, 'c0000003-0000-4000-8000-000000000003')
  assert.strictEqual(getAtlasCandidateById('mcmurdo-dry-valleys')?.id, 'c0000004-0000-4000-8000-000000000004')
  assert.strictEqual(getAtlasCandidateById('lake-salda')?.id, 'c0000005-0000-4000-8000-000000000005')
  assert.strictEqual(getAtlasCandidateById('craters-of-the-moon')?.id, 'c0000006-0000-4000-8000-000000000006')
  assert.strictEqual(getAtlasCandidateById('holuhraun')?.id, 'c0000007-0000-4000-8000-000000000007')
  assert.strictEqual(getAtlasCandidateById('rio-tinto')?.id, 'c0000008-0000-4000-8000-000000000008')
})

test('Check 4 — Candidate IDs are unique', () => {
  const ids = GLOBAL_DISCOVERY_ATLAS.map((c) => c.id)
  const uniqueIds = new Set(ids)
  assert.strictEqual(uniqueIds.size, ids.length, 'Every atlas candidate ID must be strictly unique')
})

test('Check 5 — Coordinates are valid (lat in [-90, 90], lon in [-180, 180])', () => {
  for (const candidate of GLOBAL_DISCOVERY_ATLAS) {
    assert.ok(
      typeof candidate.latitude === 'number' && !Number.isNaN(candidate.latitude),
      `Latitude must be a valid number for ${candidate.name}`
    )
    assert.ok(
      candidate.latitude >= -90 && candidate.latitude <= 90,
      `Latitude ${candidate.latitude} out of [-90, 90] bounds for ${candidate.name}`
    )

    assert.ok(
      typeof candidate.longitude === 'number' && !Number.isNaN(candidate.longitude),
      `Longitude must be a valid number for ${candidate.name}`
    )
    assert.ok(
      candidate.longitude >= -180 && candidate.longitude <= 180,
      `Longitude ${candidate.longitude} out of [-180, 180] bounds for ${candidate.name}`
    )
  }
})

test('Check 6 — Bounding boxes use [minLatitude, minLongitude, maxLatitude, maxLongitude]', () => {
  for (const candidate of GLOBAL_DISCOVERY_ATLAS) {
    const bbox = candidate.boundingBox
    assert.ok(Array.isArray(bbox), `Bounding box must be an array for ${candidate.name}`)
    assert.strictEqual(bbox.length, 4, `Bounding box must have 4 coordinates for ${candidate.name}`)

    const [minLat, minLon, maxLat, maxLon] = bbox
    assert.ok(minLat >= -90 && minLat <= 90, `minLat out of bounds for ${candidate.name}`)
    assert.ok(maxLat >= -90 && maxLat <= 90, `maxLat out of bounds for ${candidate.name}`)
    assert.ok(minLat <= maxLat, `minLat (${minLat}) must be <= maxLat (${maxLat}) for ${candidate.name}`)

    assert.ok(minLon >= -180 && minLon <= 180, `minLon out of bounds for ${candidate.name}`)
    assert.ok(maxLon >= -180 && maxLon <= 180, `maxLon out of bounds for ${candidate.name}`)
    assert.ok(minLon <= maxLon, `minLon (${minLon}) must be <= maxLon (${maxLon}) for ${candidate.name}`)

    // Check that point coordinates fall inside or on the bounding box
    assert.ok(
      candidate.latitude >= minLat && candidate.latitude <= maxLat,
      `Point latitude ${candidate.latitude} must fall within [${minLat}, ${maxLat}] for ${candidate.name}`
    )
    assert.ok(
      candidate.longitude >= minLon && candidate.longitude <= maxLon,
      `Point longitude ${candidate.longitude} must fall within [${minLon}, ${maxLon}] for ${candidate.name}`
    )
  }
})

test('Check 7 — Every category value is valid across all 9 categories', () => {
  const categoryCounts = new Map()

  for (const cat of ANALOG_ENVIRONMENT_CATEGORIES) {
    categoryCounts.set(cat.id, 0)
  }

  for (const candidate of GLOBAL_DISCOVERY_ATLAS) {
    assert.ok(
      isAnalogEnvironmentCategory(candidate.category),
      `Category '${candidate.category}' is invalid for ${candidate.name}`
    )
    categoryCounts.set(candidate.category, (categoryCounts.get(candidate.category) ?? 0) + 1)
  }

  // Ensure every one of the 9 categories is represented by at least 3 candidates
  for (const [catId, count] of categoryCounts.entries()) {
    assert.ok(
      count >= 3,
      `Category '${catId}' must have at least 3 candidate locations, but has ${count}`
    )
  }
})

test('Check 8 — Every novelty tier is valid', () => {
  for (const candidate of GLOBAL_DISCOVERY_ATLAS) {
    assert.ok(
      isAnalogNoveltyTier(candidate.noveltyTier),
      `Novelty tier '${candidate.noveltyTier}' is invalid for ${candidate.name}`
    )
  }
})

test('Check 9 — Curated entries are not incorrectly assigned live-grid-discovery', () => {
  let canonicalCount = 0
  let underExploredCount = 0

  for (const candidate of GLOBAL_DISCOVERY_ATLAS) {
    assert.notStrictEqual(
      candidate.noveltyTier,
      'live-grid-discovery',
      `Curated candidate '${candidate.name}' must NEVER be assigned 'live-grid-discovery'`
    )

    if (candidate.noveltyTier === 'canonical-benchmark') canonicalCount++
    if (candidate.noveltyTier === 'under-explored-analog') underExploredCount++
  }

  assert.strictEqual(canonicalCount, 8, 'Exactly 8 foundational benchmark candidates must be canonical-benchmark')
  assert.strictEqual(underExploredCount, 23, 'All 23 additional candidates must be under-explored-analog')
})

test('Check 10 — Candidate metadata does NOT affect similarity scoring', () => {
  const target = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  assert.ok(target)

  for (const candidate of GLOBAL_DISCOVERY_ATLAS.slice(0, 5)) {
    // Score with full metadata
    const scoreFull = computeAnalogSimilarity(target, candidate, GEOLOGICAL_RESEARCH_PROFILE)

    // Strip discovery metadata
    const strippedCandidate = {
      ...candidate,
      category: undefined,
      noveltyTier: undefined,
      boundingBox: undefined,
      primarySources: undefined,
      scientificLimitations: undefined,
      evidenceClassification: undefined,
    }

    const scoreStripped = computeAnalogSimilarity(target, strippedCandidate, GEOLOGICAL_RESEARCH_PROFILE)

    assert.strictEqual(
      scoreFull.overallSimilarity,
      scoreStripped.overallSimilarity,
      `Similarity score must be identical regardless of discovery metadata for ${candidate.name}`
    )
    assert.strictEqual(
      scoreFull.coverage,
      scoreStripped.coverage,
      `Coverage must be identical regardless of discovery metadata for ${candidate.name}`
    )
  }
})

test('Check 11 — Missing measurements remain missing (never replaced with 0)', () => {
  // Find candidates with incomplete data
  const incompleteCandidates = getAtlasCandidatesWithIncompleteData()
  assert.ok(incompleteCandidates.length > 0, 'Atlas must contain candidates with missing physical values (e.g. ries-crater)')

  const ries = getAtlasCandidateById('atlas-ries-crater')
  assert.ok(ries)
  assert.strictEqual(ries.environment.medianGrainSizeMm, null, 'medianGrainSizeMm must remain strictly null')
  assert.strictEqual(ries.environment.albedo, null, 'albedo must remain strictly null')

  const missingKeys = getCandidateMissingFeatures(ries)
  assert.ok(missingKeys.includes('medianGrainSizeMm'))
  assert.ok(missingKeys.includes('albedo'))

  // Verify similarity engine does NOT treat null as 0
  const target = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  const score = computeAnalogSimilarity(target, ries, GEOLOGICAL_RESEARCH_PROFILE)

  const grainScore = score.featureScores.find((f) => f.key === 'medianGrainSizeMm')
  assert.ok(grainScore)
  assert.strictEqual(grainScore.candidateValue, null)
  assert.strictEqual(grainScore.status, 'missing_data')
  assert.strictEqual(grainScore.similarity, null)
})

test('Check 12 — Every candidate has source/provenance information', () => {
  for (const candidate of GLOBAL_DISCOVERY_ATLAS) {
    assert.ok(
      Array.isArray(candidate.primarySources),
      `primarySources must be an array for ${candidate.name}`
    )
    assert.ok(
      candidate.primarySources.length >= 1,
      `Every candidate must have at least 1 primary source citation: ${candidate.name}`
    )

    for (const src of candidate.primarySources) {
      assert.ok(src.datasetOrPublication.length > 0, `Source must have datasetOrPublication for ${candidate.name}`)
      assert.ok(src.organization.length > 0, `Source must have organization for ${candidate.name}`)
      if (src.sourceUrl) {
        assert.ok(src.sourceUrl.startsWith('http'), `Source URL must be valid HTTP(S) for ${candidate.name}`)
      }
    }

    assert.ok(
      Array.isArray(candidate.scientificLimitations),
      `scientificLimitations must be an array for ${candidate.name}`
    )
    assert.ok(
      candidate.scientificLimitations.length >= 1,
      `Every candidate must document at least 1 scientific limitation: ${candidate.name}`
    )
  }
})

test('Check 13 — Category filtering works across all 9 categories', () => {
  for (const cat of ANALOG_ENVIRONMENT_CATEGORIES) {
    const candidates = getAtlasCandidatesByCategory(cat.id)
    assert.ok(
      candidates.length >= 3,
      `Category '${cat.id}' must return at least 3 candidates from getAtlasCandidatesByCategory`
    )
    for (const c of candidates) {
      assert.strictEqual(c.category, cat.id)
    }
  }
})

test('Check 14 — Novelty filtering works', () => {
  const canonical = getAtlasCandidatesByNoveltyTier('canonical-benchmark')
  assert.strictEqual(canonical.length, 8, 'Must return exactly 8 canonical benchmark sites')
  for (const c of canonical) {
    assert.strictEqual(c.noveltyTier, 'canonical-benchmark')
  }

  const underExplored = getAtlasCandidatesByNoveltyTier('under-explored-analog')
  assert.strictEqual(underExplored.length, 23, 'Must return exactly 23 under-explored analog sites')
  for (const c of underExplored) {
    assert.strictEqual(c.noveltyTier, 'under-explored-analog')
  }

  const liveGrid = getAtlasCandidatesByNoveltyTier('live-grid-discovery')
  assert.strictEqual(liveGrid.length, 0, 'Curated atlas must return 0 live-grid-discovery candidates')
})

test('Check 15 — Mission-purpose filtering works across all 4 mission profiles', () => {
  for (const purpose of MISSION_PURPOSES) {
    const candidates = getAtlasCandidatesByMissionPurpose(purpose.id)
    assert.ok(
      candidates.length >= 10,
      `Mission purpose '${purpose.id}' must match at least 10 candidates, got ${candidates.length}`
    )
    for (const c of candidates) {
      assert.ok(
        c.relevantMissionProfiles.includes(purpose.id),
        `Candidate ${c.name} must declare relevance to ${purpose.id}`
      )
    }
  }
})

test('Check 16 — Existing candidate retrieval and similarity ranking remain backward compatible', () => {
  const target = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  assert.ok(target)

  // Evaluating existing SAMPLE_CANDIDATES with rankCandidateLocations works as before
  const legacyRankings = rankCandidateLocations(target, SAMPLE_CANDIDATES, ROVER_TESTING_PROFILE)
  assert.strictEqual(legacyRankings.length, SAMPLE_CANDIDATES.length)
  assert.strictEqual(legacyRankings[0].candidate.id, 'hanksville-mdrs')
  assert.strictEqual(legacyRankings[0].score, 87.1)

  // Evaluating the new GLOBAL_DISCOVERY_ATLAS with rankCandidateLocations works seamlessly
  const atlasRankings = rankCandidateLocations(target, GLOBAL_DISCOVERY_ATLAS, ROVER_TESTING_PROFILE)
  assert.strictEqual(atlasRankings.length, GLOBAL_DISCOVERY_ATLAS.length)
  assert.ok(atlasRankings[0].score > 80)

  // Check country filtering
  const chileanSites = getAtlasCandidatesByCountry('Chile')
  assert.ok(chileanSites.length >= 2, 'Must find at least 2 Chilean analog sites')

  const icelandSites = getAtlasCandidatesByCountry('Iceland')
  assert.ok(icelandSites.length >= 3, 'Must find at least 3 Icelandic analog sites')
})

test('Check 17 — Multi-criteria filtering and summary statistics work deterministically', () => {
  const stats = getAtlasSummaryStatistics()
  assert.strictEqual(stats.totalCandidates, 31)
  assert.strictEqual(stats.canonicalBenchmarkCount, 8)
  assert.strictEqual(stats.underExploredCount, 23)
  assert.strictEqual(stats.liveGridDiscoveryCount, 0)
  assert.ok(stats.uniqueCountriesCount >= 10, 'Expected analogs across at least 10 countries/territories')

  // Multi-criteria filter: volcanic-fields in under-explored-analog
  const underExploredVolcanic = filterAtlasCandidates({
    category: 'volcanic-fields',
    noveltyTier: 'under-explored-analog',
  })
  assert.strictEqual(underExploredVolcanic.length, 2) // Waw an Namus and Timanfaya

  // Multi-criteria filter: astrobiology candidates in Chile
  const chileAstrobiology = filterAtlasCandidates({
    missionPurpose: 'astrobiology-habitability',
    country: 'Chile',
  })
  assert.ok(chileAstrobiology.length >= 2) // Yungay and Salar de Pajonales
})
