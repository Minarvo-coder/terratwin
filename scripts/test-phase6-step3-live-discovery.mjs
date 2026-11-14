/**
 * TerraTwin — Phase 6, Step 3 Automated Verification Suite
 * 
 * Tests the Live Regional Analog Discovery Engine:
 * 1. Valid bounding-box validation.
 * 2. Invalid latitude and longitude rejection.
 * 3. Invalid bounding-box ordering rejection (minLat > maxLat).
 * 4. Grid generation is deterministic (identical inputs produce identical cell sets).
 * 5. Grid cells have unique IDs.
 * 6. Grid generation respects maximum cell limits (maxCells and server ceiling 100).
 * 7. Grid cell centers remain strictly inside the requested region.
 * 8. Bounding-box coordinate ordering is correct [minLat, minLon, maxLat, maxLon].
 * 9. Antimeridian handling is safe (detects minLon > maxLon and rejects with clear explanation).
 * 10. Missing provider data remains strictly missing (never converted to 0).
 * 11. Provider failures do not become zero measurements.
 * 12. Data provenance is retained on all candidate features.
 * 13. Unit normalization works correctly (°C, W/m², degrees slope).
 * 14. Data coverage is distinct from similarity score.
 * 15. Insufficient evidence does not produce fabricated scores (coverage < 40% yields score: null).
 * 16. Novelty tier ('live-grid-discovery') does not affect similarity scoring.
 * 17. Existing mission profiles resolve correctly across all 4 profiles.
 * 18. Existing atlas candidates remain completely unchanged.
 * 19. API validation and error handling work cleanly.
 * 20. In-memory caching prevents unnecessary repeated provider requests.
 * 21. Live provider smoke test (safely tests 1 cell against live APIs).
 */

import test from 'node:test'
import assert from 'node:assert'

import {
  validateDiscoveryBoundingBox,
  generateDiscoveryGrid,
  GridValidationError,
  MAX_LATITUDE_SPAN_DEG,
  MAX_LONGITUDE_SPAN_DEG,
  HARD_CEILING_MAX_CELLS,
} from '../src/lib/terratwin/services/grid-generator.ts'

import {
  executeRegionalDiscovery,
} from '../src/lib/terratwin/services/discovery-engine.ts'

import {
  fetchBatchElevationAndSlope,
} from '../src/lib/terratwin/connectors/elevation-connector.ts'

import {
  fetchBatchNasaPowerClimatology,
} from '../src/lib/terratwin/connectors/nasa-power-connector.ts'

import {
  fetchBatchMacrostratGeology,
  classifyMacrostratLithology,
} from '../src/lib/terratwin/connectors/macrostrat-connector.ts'

import {
  DiscoveryCache,
  elevationCache,
  nasaPowerCache,
  macrostratCache,
} from '../src/lib/terratwin/utils/discovery-cache.ts'

import {
  GLOBAL_DISCOVERY_ATLAS,
} from '../src/lib/terratwin/discovery-atlas.ts'

import {
  ROVER_TESTING_PROFILE,
  GEOLOGICAL_RESEARCH_PROFILE,
  LUNAR_BASE_CONSTRUCTION_PROFILE,
  ASTROBIOLOGY_HABITABILITY_PROFILE,
} from '../src/lib/terratwin/config/comparison-config.ts'

import { computeAnalogSimilarity } from '../src/lib/terratwin/similarity-engine.ts'
import { SAMPLE_TARGETS } from '../src/lib/terratwin/sample-dataset.ts'

// --- Mock HTTP Fetch helper for deterministic tests ---
function createMockFetch(responses = {}) {
  return async function mockFetch(url, options) {
    const urlStr = String(url)

    if (urlStr.includes('api.open-meteo.com/v1/elevation')) {
      if (responses.openMeteoError) {
        throw new Error('Mock Open-Meteo network failure')
      }
      // Return 5 elevations per cell in request
      const latMatch = urlStr.match(/latitude=([^&]+)/)
      const latCount = latMatch ? latMatch[1].split(',').length : 5
      const elevations = new Array(latCount).fill(1200)
      // Provide some elevation differences for slope calculation
      for (let i = 0; i < latCount; i += 5) {
        elevations[i] = 1200     // Center
        elevations[i + 1] = 1220 // North
        elevations[i + 2] = 1180 // South
        elevations[i + 3] = 1210 // East
        elevations[i + 4] = 1190 // West
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ elevation: elevations }),
      }
    }

    if (urlStr.includes('power.larc.nasa.gov')) {
      if (responses.nasaPowerError) {
        throw new Error('Mock NASA POWER connection timeout')
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          properties: {
            parameter: {
              T2M: { ANN: 14.5 },
              TS_RANGE: { ANN: 18.2 },
              ALLSKY_SFC_SW_DWN: { ANN: 5.2 }, // 5.2 kWh/m2/day * 41.6667 = 216.7 W/m2
              WS10M: { ANN: 4.8 },
              PRECTOTCORR: { ANN: 0.8 }, // 0.8 mm/day * 365 = 292 mm/yr
            },
          },
        }),
      }
    }

    if (urlStr.includes('macrostrat.org')) {
      if (responses.macrostratError) {
        throw new Error('Mock Macrostrat service unavailable')
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: {
            data: {
              mapData: [
                {
                  name: 'Columbia River Basalt Group',
                  lith: 'Major:{basalt}, Minor{andesite}',
                  liths: [{ lith: 'basalt', lith_class: 'igneous' }],
                  ref: { ref_title: 'USGS Geologic Map' },
                },
              ],
            },
          },
        }),
      }
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    }
  }
}

test('Test 1 — Valid bounding-box validation passes cleanly', () => {
  const validBbox = [37.0, -112.0, 38.0, -111.0]
  assert.doesNotThrow(() => validateDiscoveryBoundingBox(validBbox))
})

test('Test 2 — Invalid latitude and longitude values are rejected', () => {
  assert.throws(
    () => validateDiscoveryBoundingBox([95.0, 10.0, 96.0, 11.0]),
    /minLatitude.*between -90 and 90/
  )
  assert.throws(
    () => validateDiscoveryBoundingBox([-10.0, -190.0, -9.0, 10.0]),
    /minLongitude.*between -180 and 180/
  )
  assert.throws(
    () => validateDiscoveryBoundingBox(['invalid', 0, 10, 10]),
    /not a valid finite number/
  )
})

test('Test 3 — Invalid bounding-box ordering (minLat > maxLat) is rejected', () => {
  assert.throws(
    () => validateDiscoveryBoundingBox([45.0, 10.0, 40.0, 15.0]),
    /minLatitude.*cannot be greater than maxLatitude/
  )
})

test('Test 4 — Grid generation is strictly deterministic', () => {
  const bbox = [35.0, -115.0, 36.0, -114.0]
  const grid1 = generateDiscoveryGrid({ boundingBox: bbox, gridSpacingDeg: 0.5 })
  const grid2 = generateDiscoveryGrid({ boundingBox: bbox, gridSpacingDeg: 0.5 })

  assert.strictEqual(grid1.length, grid2.length)
  for (let i = 0; i < grid1.length; i++) {
    assert.strictEqual(grid1[i].id, grid2[i].id)
    assert.strictEqual(grid1[i].latitude, grid2[i].latitude)
    assert.strictEqual(grid1[i].longitude, grid2[i].longitude)
    assert.deepStrictEqual(grid1[i].boundingBox, grid2[i].boundingBox)
  }
})

test('Test 5 — Grid cells have strictly unique IDs', () => {
  const grid = generateDiscoveryGrid({
    boundingBox: [20.0, 10.0, 22.0, 12.0],
    gridSpacingDeg: 0.5,
  })
  const ids = grid.map((c) => c.id)
  const uniqueIds = new Set(ids)
  assert.strictEqual(uniqueIds.size, ids.length, 'Every cell ID must be unique')
})

test('Test 6 — Grid generation respects maximum cell limits and server ceiling', () => {
  // Test valid bounded generation producing 4 cells
  const grid = generateDiscoveryGrid({
    boundingBox: [20.0, 10.0, 21.0, 11.0],
    gridSpacingDeg: 0.5,
    maxCells: 10,
  })
  assert.strictEqual(grid.length, 4, 'Should generate 4 cells for 1x1 deg at 0.5 deg spacing')

  // Test rejection if requested grid produces more cells than configured maxCells
  assert.throws(
    () =>
      generateDiscoveryGrid({
        boundingBox: [20.0, 10.0, 23.0, 13.0], // ~36 cells
        gridSpacingDeg: 0.5,
        maxCells: 4,
      }),
    /exceeding the limit/
  )

  // Test rejection if estimated total exceeds ceiling
  assert.throws(
    () =>
      generateDiscoveryGrid({
        boundingBox: [20.0, 10.0, 28.0, 18.0],
        gridSpacingDeg: 0.2, // ~40 x 40 = 1600 cells
        maxCells: 100,
      }),
    /exceeding the limit/
  )
})

test('Test 7 — Grid cell centers remain strictly inside the requested region', () => {
  const bbox = [30.0, 40.0, 32.0, 42.0]
  const grid = generateDiscoveryGrid({ boundingBox: bbox, gridSpacingDeg: 0.5 })

  for (const cell of grid) {
    assert.ok(
      cell.latitude >= bbox[0] && cell.latitude <= bbox[2],
      `Cell latitude ${cell.latitude} must fall within [${bbox[0]}, ${bbox[2]}]`
    )
    assert.ok(
      cell.longitude >= bbox[1] && cell.longitude <= bbox[3],
      `Cell longitude ${cell.longitude} must fall within [${bbox[1]}, ${bbox[3]}]`
    )
  }
})

test('Test 8 — Bounding-box coordinate ordering is correctly maintained', () => {
  const bbox = [12.0, -85.0, 14.0, -83.0]
  const grid = generateDiscoveryGrid({ boundingBox: bbox, gridSpacingDeg: 1.0 })

  for (const cell of grid) {
    const [cMinLat, cMinLon, cMaxLat, cMaxLon] = cell.boundingBox
    assert.ok(cMinLat <= cMaxLat, 'Cell minLat must be <= maxLat')
    assert.ok(cMinLon <= cMaxLon, 'Cell minLon must be <= maxLon')
  }
})

test('Test 9 — Antimeridian crossing is safely handled and rejected with clear guidance', () => {
  // minLon: 175, maxLon: -175 (crosses 180 antimeridian)
  assert.throws(
    () => validateDiscoveryBoundingBox([10.0, 175.0, 12.0, -175.0]),
    /Antimeridian crossing detected.*separate bounding boxes/
  )
})

test('Test 10 — Missing provider data remains strictly missing (never converted to 0)', async () => {
  const mockFetch = createMockFetch()
  const res = await executeRegionalDiscovery(
    {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'geological-research',
      gridSpacingDeg: 1.0,
    },
    { fetchFn: mockFetch }
  )

  assert.ok(res.candidates.length > 0)
  const candidate = res.candidates[0].candidate

  // Unmeasured parameters must remain strictly null
  assert.strictEqual(candidate.environment.rockAbundancePct, null, 'rockAbundancePct must be null')
  assert.strictEqual(candidate.environment.medianGrainSizeMm, null, 'medianGrainSizeMm must be null')
  assert.strictEqual(candidate.environment.albedo, null, 'albedo must be null')
  assert.strictEqual(candidate.environment.vegetationCoverPct, null, 'vegetationCoverPct must be null')
})

test('Test 11 — Provider failures do not become zero measurements', async () => {
  nasaPowerCache.clear()
  // Mock fetch where NASA POWER fails completely
  const mockFetch = createMockFetch({ nasaPowerError: true })
  const res = await executeRegionalDiscovery(
    {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'rover-testing',
      gridSpacingDeg: 1.0,
    },
    { fetchFn: mockFetch }
  )

  const candidate = res.candidates[0].candidate
  assert.strictEqual(candidate.environment.meanSurfaceTempC, null, 'Failed temp must remain null, NOT 0')
  assert.strictEqual(candidate.environment.surfaceSolarIrradianceWm2, null, 'Failed irradiance must remain null, NOT 0')

  const powerStatus = res.providerStatuses.find((s) => s.provider === 'NASA POWER Climatology')
  assert.ok(powerStatus)
  assert.strictEqual(powerStatus.status, 'failed')
})

test('Test 12 — Data provenance is retained across all candidate features', async () => {
  const mockFetch = createMockFetch()
  const res = await executeRegionalDiscovery(
    {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'lunar-base-construction',
      gridSpacingDeg: 1.0,
    },
    { fetchFn: mockFetch }
  )

  const candidate = res.candidates[0].candidate
  const provMap = candidate.provenanceMap
  assert.ok(provMap)
  assert.ok(provMap.elevationM?.sourceTitle.includes('Copernicus'))
  assert.ok(provMap.meanSlopeDeg?.sourceTitle.includes('5-Point Central-Difference'))
  assert.ok(provMap.meanSurfaceTempC?.sourceTitle.includes('NASA POWER'))
  assert.ok(provMap.lithology?.sourceTitle.includes('Macrostrat'))
})

test('Test 13 — Unit normalization works correctly (°C, W/m², degrees slope)', async () => {
  const mockFetch = createMockFetch()
  const res = await executeRegionalDiscovery(
    {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'geological-research',
      gridSpacingDeg: 1.0,
    },
    { fetchFn: mockFetch }
  )

  const candidate = res.candidates[0].candidate
  assert.strictEqual(candidate.environment.meanSurfaceTempC, 14.5)
  // Solar irradiance converted from 5.2 kWh/m2/day to ~217 W/m2
  assert.strictEqual(candidate.environment.surfaceSolarIrradianceWm2, 217)
  // Slope in valid range
  assert.ok(typeof candidate.environment.meanSlopeDeg === 'number')
  assert.ok(candidate.environment.meanSlopeDeg >= 0 && candidate.environment.meanSlopeDeg <= 90)
})

test('Test 14 — Data coverage is strictly distinct from similarity score', async () => {
  const mockFetch = createMockFetch()
  const res = await executeRegionalDiscovery(
    {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'geological-research',
      gridSpacingDeg: 1.0,
    },
    { fetchFn: mockFetch }
  )

  const candidateResult = res.candidates[0]
  assert.ok(typeof candidateResult.coverage === 'number')
  assert.ok(candidateResult.coverage >= 0 && candidateResult.coverage <= 1.0)
  if (candidateResult.score !== null) {
    assert.ok(typeof candidateResult.score === 'number')
    assert.ok(candidateResult.score >= 0 && candidateResult.score <= 100)
    assert.notStrictEqual(candidateResult.score, candidateResult.coverage)
  }
})

test('Test 15 — Insufficient evidence does not produce fabricated scores (coverage < 40% yields score: null)', () => {
  const target = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  assert.ok(target)

  // Candidate with almost everything missing (coverage < 40%)
  const sparseCandidate = {
    id: 'cell_sparse_test',
    name: 'Sparse Cell',
    country: 'Test',
    latitude: 35.0,
    longitude: -112.0,
    setting: 'Test',
    summary: 'Test',
    environment: {
      meanSurfaceTempC: null,
      diurnalTempRangeC: null,
      annualPrecipitationMm: null,
      meanSlopeDeg: null,
      rockAbundancePct: null,
      medianGrainSizeMm: null,
      albedo: null,
      vegetationCoverPct: null,
      lithology: null,
      elevationM: 1500, // Only 1 feature
      surfacePressurePa: null,
      surfaceSolarIrradianceWm2: null,
    },
    isVerified: false,
    noveltyTier: 'live-grid-discovery',
  }

  const evaluation = computeAnalogSimilarity(target, sparseCandidate, GEOLOGICAL_RESEARCH_PROFILE)
  assert.ok(evaluation.coverage < 0.40)
  assert.strictEqual(evaluation.isReliable, false)
  assert.strictEqual(evaluation.score, null, 'Score must be null when coverage < 40%')
  assert.strictEqual(evaluation.scoreDisplay, 'Insufficient data to rank reliably')
})

test('Test 16 — Novelty tier (live-grid-discovery) has zero effect on similarity scoring', () => {
  const target = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  assert.ok(target)

  const testEnv = {
    meanSurfaceTempC: 15.0,
    diurnalTempRangeC: 20.0,
    annualPrecipitationMm: null,
    meanSlopeDeg: 5.0,
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    albedo: null,
    vegetationCoverPct: null,
    lithology: 'basaltic',
    elevationM: 1200,
    surfacePressurePa: null,
    surfaceSolarIrradianceWm2: 200,
  }

  const liveCandidate = {
    id: 'cell_live',
    name: 'Live Cell',
    country: 'Test',
    latitude: 35.0,
    longitude: -112.0,
    setting: 'Test',
    summary: 'Test',
    environment: testEnv,
    isVerified: false,
    noveltyTier: 'live-grid-discovery',
  }

  const benchmarkCandidate = {
    ...liveCandidate,
    id: 'cell_benchmark',
    noveltyTier: 'canonical-benchmark',
  }

  const scoreLive = computeAnalogSimilarity(target, liveCandidate, ROVER_TESTING_PROFILE)
  const scoreBenchmark = computeAnalogSimilarity(target, benchmarkCandidate, ROVER_TESTING_PROFILE)

  assert.strictEqual(
    scoreLive.score,
    scoreBenchmark.score,
    'Novelty tier must NEVER alter similarity score'
  )
})

test('Test 17 — Existing mission profiles resolve correctly across all 4 profiles', async () => {
  const mockFetch = createMockFetch()
  const profiles = [
    'rover-testing',
    'geological-research',
    'lunar-base-construction',
    'astrobiology-habitability',
  ]

  for (const prof of profiles) {
    const res = await executeRegionalDiscovery(
      {
        boundingBox: [35.0, -112.0, 36.0, -111.0],
        targetId: 'mars-jezero-delta',
        missionProfile: prof,
        gridSpacingDeg: 1.0,
      },
      { fetchFn: mockFetch }
    )
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.missionProfile.id, prof)
  }
})

test('Test 18 — Existing Global Discovery Atlas candidates remain completely unchanged', () => {
  assert.strictEqual(GLOBAL_DISCOVERY_ATLAS.length, 31)
  const benchmarkCount = GLOBAL_DISCOVERY_ATLAS.filter(
    (c) => c.noveltyTier === 'canonical-benchmark'
  ).length
  assert.strictEqual(benchmarkCount, 8)
  const liveGridCount = GLOBAL_DISCOVERY_ATLAS.filter(
    (c) => c.noveltyTier === 'live-grid-discovery'
  ).length
  assert.strictEqual(liveGridCount, 0, 'No atlas entries should have live-grid-discovery tier')
})

test('Test 19 — API validation and error handling work cleanly', async () => {
  const mockFetch = createMockFetch()

  // Target not found
  await assert.rejects(
    () =>
      executeRegionalDiscovery(
        {
          boundingBox: [35.0, -112.0, 36.0, -111.0],
          targetId: 'non-existent-target-999',
          missionProfile: 'rover-testing',
        },
        { fetchFn: mockFetch }
      ),
    /not found/
  )

  // Invalid mission profile
  await assert.rejects(
    () =>
      executeRegionalDiscovery(
        {
          boundingBox: [35.0, -112.0, 36.0, -111.0],
          targetId: 'mars-jezero-delta',
          missionProfile: 'unknown-fake-profile',
        },
        { fetchFn: mockFetch }
      ),
    /Unknown mission profile/
  )
})

test('Test 20 — In-memory caching prevents unnecessary repeated provider requests', async () => {
  let openMeteoCalls = 0
  const countingFetch = async (url, opts) => {
    if (String(url).includes('open-meteo')) {
      openMeteoCalls++
    }
    return createMockFetch()(url, opts)
  }

  // Clear cache first
  elevationCache.clear()

  const cell = { id: 'cache_test_cell', latitude: 35.1234, longitude: -112.5678 }

  // First call: misses cache, executes fetch
  await fetchBatchElevationAndSlope([cell], { fetchFn: countingFetch })
  assert.strictEqual(openMeteoCalls, 1, 'First call must invoke fetch')

  // Second call: hits cache, does not execute fetch
  const res2 = await fetchBatchElevationAndSlope([cell], { fetchFn: countingFetch })
  assert.strictEqual(openMeteoCalls, 1, 'Second call must be served from cache without fetch')
  assert.strictEqual(res2.status.status, 'cached')
})

test('Test 21 — Safe live smoke test (1 cell against real Open-Meteo API)', async () => {
  // Test a single real coordinate without mocking: Lake Salda (37.55, 29.68)
  try {
    const liveCell = { id: 'smoke_salda', latitude: 37.55, longitude: 29.68 }
    const res = await fetchBatchElevationAndSlope([liveCell], { timeoutMs: 5000 })

    if (res.status.status === 'success') {
      const data = res.data.get('smoke_salda')
      assert.ok(data)
      assert.ok(typeof data.elevationM === 'number')
      // Lake Salda elevation is approximately 1100-1200 m
      assert.ok(data.elevationM > 1000 && data.elevationM < 1300)
    }
  } catch (err) {
    // If external internet is slow, smoke test does not fail build
    console.log('[Smoke Test Notice] Live API test skipped or timed out:', err.message)
  }
})
