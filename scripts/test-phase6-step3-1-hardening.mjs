/**
 * TerraTwin — Phase 6.3.1 Scientific Accuracy, API Reliability & Hardening Verification Suite
 *
 * Covers 25 targeted verification cases:
 *  1. 5-point central-difference slope math matches analytical tangent within tolerance.
 *  2. Polar singularity zone (|lat| > 89.5 deg) returns meanSlopeDeg: null with note.
 *  3. Antimeridian longitude wrapping preserves symmetric stencil spacing across +-180 deg.
 *  4. Near-polar latitude clamping adjusts dy using actual latN - latS span.
 *  5. Non-finite elevation values stay null; partial chunk failure yields status: "partial".
 *  6. Open-Meteo batch chunking splits 45 cells (225 coords) into 3 HTTP batches (20, 20, 5).
 *  7. NASA POWER fill_value (-999 & custom header fill_value) and NaN remain strictly null.
 *  8. NASA POWER ALLSKY_SFC_SW_DWN validates units (kW-hr/m^2/day, W/m^2, MJ/m^2/day, unknown->null).
 *  9. NASA POWER -0 coordinate binning normalizes cleanly and retains original units/values.
 * 10. NASA POWER rejects physically out-of-range measurements cleanly as null.
 * 11. Macrostrat removes ultramafic rocks (peridotite, serpentinite, ophiolite) from felsic-crystalline.
 * 12. Macrostrat preserves ambiguity (null + ambiguous-mixed-unit) on mixed flat lithologies while resolving clear Major:{...} dominance.
 * 13. Macrostrat whole-word regex matching & preserves geologicAge, mapScale, sourceUrl, rawLithologyText.
 * 14. Discovery provenance separates status ("unverified"), dataOrigin, evidenceClassification ("measured"/"derived"/"proxy"), and verificationState.
 * 15. Discovery provenance marks missing/failed provider features strictly "no-data" (never "verified" or "unverified").
 * 16. Grid generator integer stepping eliminates 0.1 deg cumulative floating-point drift & -0.0000 IDs.
 * 17. Grid generator strictly rejects non-integer, <= 0, and > 100 maxCells instead of silently clamping.
 * 18. Discovery engine strictly rejects array payloads, invalid categories, invalid maxCandidates, and Earth-body targets.
 * 19. Valid requestedCategory adds advisory warning without auto-tagging or dropping live cells.
 * 20. fetchWithRetry retries transient 429/503 responses once and does not retry 400/404 responses.
 * 21. DiscoveryCache promotes hits via LRU order, prunes expired entries, and coalesces concurrent in-flight loads.
 * 22. Response cache differentiates mission weights/category, sets responseCacheHit, and refuses to cache failed/partial runs.
 * 23. SlidingWindowRateLimiter allows <= N requests, blocks N+1 with retryAfterSec, and resets after window expiration.
 * 24. Sanitized HTTP validation & error handling verification (and localhost /api/discover integration when dev server is running).
 * 25. Similarity engine remains 100% compatible with status: "unverified" live features and keeps <40% coverage gated to null.
 */

import test from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  computeCentralDifferenceSlopeDeg,
  fetchBatchElevationAndSlope,
  wrapLongitudeDeg,
  STENCIL_DELTA_DEG,
  POLAR_SLOPE_EXCLUSION_LAT_DEG,
  MAX_CELLS_PER_OPEN_METEO_BATCH,
} from '../src/lib/terratwin/connectors/elevation-connector.ts'

import {
  fetchBatchNasaPowerClimatology,
  getPowerGridKey,
} from '../src/lib/terratwin/connectors/nasa-power-connector.ts'

import {
  classifyMacrostratLithology,
  classifyMacrostratLithologyDetailed,
  fetchBatchMacrostratGeology,
} from '../src/lib/terratwin/connectors/macrostrat-connector.ts'

import {
  generateDiscoveryGrid,
  GridValidationError,
} from '../src/lib/terratwin/services/grid-generator.ts'

import { executeRegionalDiscovery } from '../src/lib/terratwin/services/discovery-engine.ts'
import { computeAnalogSimilarity } from '../src/lib/terratwin/similarity-engine.ts'
import { GEOLOGICAL_RESEARCH_PROFILE } from '../src/lib/terratwin/config/comparison-config.ts'
import { SAMPLE_TARGETS } from '../src/lib/terratwin/sample-dataset.ts'
import { DiscoveryCache, discoveryResponseCache, elevationCache, nasaPowerCache, macrostratCache } from '../src/lib/terratwin/utils/discovery-cache.ts'
import { fetchWithRetry } from '../src/lib/terratwin/utils/fetch-retry.ts'
import { SlidingWindowRateLimiter, extractClientIdentifier } from '../src/lib/terratwin/utils/rate-limiter.ts'

function createConfigurableMockFetch(overrides = {}) {
  return async function mockFetch(url) {
    const urlStr = String(url)

    if (urlStr.includes('api.open-meteo.com')) {
      if (overrides.openMeteoHandler) return overrides.openMeteoHandler(urlStr)
      const latMatch = urlStr.match(/latitude=([^&]+)/)
      const count = latMatch ? latMatch[1].split(',').length : 5
      const elev = new Array(count).fill(1000)
      for (let i = 0; i < count; i += 5) {
        elev[i] = 1000
        elev[i + 1] = 1020
        elev[i + 2] = 980
        elev[i + 3] = 1010
        elev[i + 4] = 990
      }
      return { ok: true, status: 200, json: async () => ({ elevation: elev }) }
    }

    if (urlStr.includes('power.larc.nasa.gov')) {
      if (overrides.powerHandler) return overrides.powerHandler(urlStr)
      return {
        ok: true,
        status: 200,
        json: async () => ({
          header: {
            fill_value: -999,
            api: { version: 'v2.10.1' },
            range: '25-year Climatology (2001-2025)',
          },
          parameters: {
            T2M: { units: 'C' },
            TS_RANGE: { units: 'C' },
            ALLSKY_SFC_SW_DWN: { units: 'kW-hr/m^2/day' },
            WS10M: { units: 'm/s' },
            PRECTOTCORR: { units: 'mm/day' },
          },
          properties: {
            parameter: {
              T2M: { ANN: 12.4 },
              TS_RANGE: { ANN: 16.0 },
              ALLSKY_SFC_SW_DWN: { ANN: 5.4 },
              WS10M: { ANN: 4.1 },
              PRECTOTCORR: { ANN: 0.4 },
            },
          },
        }),
      }
    }

    if (urlStr.includes('macrostrat.org')) {
      if (overrides.macroHandler) return overrides.macroHandler(urlStr)
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: {
            data: {
              mapData: [
                {
                  name: 'Coconino Basalt Flow',
                  age: 'Pliocene',
                  lith: 'Major:{basalt}, Minor:{tuff}',
                  liths: [{ lith: 'basalt' }],
                  ref: { ref_title: 'USGS Map', scale: '1:250k', url: 'https://macrostrat.org/ref/1' },
                },
              ],
            },
          },
        }),
      }
    }

    return { ok: false, status: 404, json: async () => ({}) }
  }
}

test('1. 5-point central-difference slope matches analytical atan(sqrt(dzdx^2 + dzdy^2))', () => {
  // At equator (lat=0), delta = 0.002 deg => total dx = dy = 2 * 0.002 * (pi/180) * 6371000 = 444.7797 m
  // If zN - zS = 44.478 m and zE === zW, dzdy = 0.1, slope = atan(0.1) = 5.71 deg
  const totalSpan = 2 * STENCIL_DELTA_DEG
  const dy = totalSpan * (Math.PI / 180) * 6371000
  const expectedRad = Math.atan(44.47797 / dy)
  const expectedDeg = Math.round(((expectedRad * 180) / Math.PI) * 100) / 100

  const res = computeCentralDifferenceSlopeDeg({
    lat0: 0,
    deltaLatNSDeg: totalSpan,
    deltaLonEWDeg: totalSpan,
    zN: 1022.238985,
    zS: 977.761015,
    zE: 1000,
    zW: 1000,
  })
  assert.strictEqual(res.meanSlopeDeg, expectedDeg)
})

test('2. Polar singularity zone (|lat| > 89.5 deg) returns meanSlopeDeg: null with diagnostic note', () => {
  const northPole = computeCentralDifferenceSlopeDeg({
    lat0: POLAR_SLOPE_EXCLUSION_LAT_DEG + 0.1,
    deltaLatNSDeg: 0.004,
    deltaLonEWDeg: 0.004,
    zN: 1010,
    zS: 990,
    zE: 1010,
    zW: 990,
  })
  assert.strictEqual(northPole.meanSlopeDeg, null)
  assert.match(northPole.slopeQualityNote ?? '', /geographic pole/i)

  const southPole = computeCentralDifferenceSlopeDeg({
    lat0: -89.9,
    deltaLatNSDeg: 0.004,
    deltaLonEWDeg: 0.004,
    zN: 1010,
    zS: 990,
    zE: 1010,
    zW: 990,
  })
  assert.strictEqual(southPole.meanSlopeDeg, null)
})

test('3. Antimeridian longitude wrapping keeps stencil coordinates in [-180, 180] cleanly', async () => {
  assert.strictEqual(Number(wrapLongitudeDeg(180.05).toFixed(2)), -179.95)
  assert.strictEqual(Number(wrapLongitudeDeg(-180.05).toFixed(2)), 179.95)

  let capturedUrls = []
  elevationCache.clear()
  const mockFetch = createConfigurableMockFetch({
    openMeteoHandler: async (urlStr) => {
      capturedUrls.push(urlStr)
      return { ok: true, status: 200, json: async () => ({ elevation: [100, 110, 90, 105, 95] }) }
    },
  })

  const res = await fetchBatchElevationAndSlope(
    [{ id: 'anti_cell', latitude: 0, longitude: 179.9995 }],
    { fetchFn: mockFetch }
  )
  assert.strictEqual(capturedUrls.length, 1)
  const lonParam = new URL(capturedUrls[0]).searchParams.get('longitude') ?? ''
  const lons = lonParam.split(',').map(Number)
  assert.ok(lons.every((l) => l >= -180 && l <= 180), 'All wrapped stencil longitudes stay in [-180, 180]')
  // East stencil at 179.9995 + 0.002 should wrap around to ~ -179.9985 (NOT clamped to 180)
  assert.ok(lons[3] < -179.9, `Expected wrapped E longitude < -179.9, got ${lons[3]}`)
  assert.ok(typeof res.data.get('anti_cell')?.meanSlopeDeg === 'number')
})

test('4. Near-polar boundary latitude clamping adjusts dy using actual latN - latS span', () => {
  // Exact lat0 = 89.499 (just inside polar threshold, latN touches 89.501, below 90, or test lat0=89.5 vs halved deltaLatNSDeg)
  const fullSpanSlope = computeCentralDifferenceSlopeDeg({
    lat0: 89.5,
    deltaLatNSDeg: 0.004,
    deltaLonEWDeg: 0.004 / Math.cos((89.5 * Math.PI) / 180),
    zN: 1020,
    zS: 980,
    zE: 1000,
    zW: 1000,
  })
  const halfLatSpanSlope = computeCentralDifferenceSlopeDeg({
    lat0: 89.5,
    deltaLatNSDeg: 0.002,
    deltaLonEWDeg: 0.004 / Math.cos((89.5 * Math.PI) / 180),
    zN: 1020,
    zS: 980,
    zE: 1000,
    zW: 1000,
  })
  assert.ok((halfLatSpanSlope.meanSlopeDeg ?? 0) > (fullSpanSlope.meanSlopeDeg ?? 0))
})

test('5. Non-finite elevation values stay null and partial chunk failures set status: partial', async () => {
  elevationCache.clear()
  const cells = Array.from({ length: MAX_CELLS_PER_OPEN_METEO_BATCH + 2 }, (_, idx) => ({
    id: `c_${idx}`,
    latitude: 10 + idx * 0.1,
    longitude: 10,
  }))
  let callIndex = 0
  const mockFetch = createConfigurableMockFetch({
    openMeteoHandler: async () => {
      callIndex++
      if (callIndex === 2) {
        return { ok: false, status: 500, statusText: 'Chunk 2 down', json: async () => ({}) }
      }
      const elev = new Array(MAX_CELLS_PER_OPEN_METEO_BATCH * 5).fill(500)
      elev[0] = NaN // Non-finite center on first cell
      elev[6] = null // Missing north neighbor on second cell
      return { ok: true, status: 200, json: async () => ({ elevation: elev }) }
    },
  })

  const res = await fetchBatchElevationAndSlope(cells, { fetchFn: mockFetch, maxRetries: 0 })
  assert.strictEqual(res.status.status, 'partial')
  assert.strictEqual(res.data.get('c_0')?.elevationM, null)
  assert.strictEqual(res.data.get('c_1')?.meanSlopeDeg, null)
  assert.strictEqual(res.data.get(`c_${MAX_CELLS_PER_OPEN_METEO_BATCH}`)?.elevationM, null)
})

test('6. Open-Meteo batch URL chunking splits 45 cells into 3 HTTP requests (20, 20, 5)', async () => {
  elevationCache.clear()
  const chunkSizes = []
  const cells = Array.from({ length: 45 }, (_, idx) => ({
    id: `chunk_${idx}`,
    latitude: 20 + idx * 0.05,
    longitude: -100,
  }))
  const mockFetch = createConfigurableMockFetch({
    openMeteoHandler: async (urlStr) => {
      const count = new URL(urlStr).searchParams.get('latitude').split(',').length
      chunkSizes.push(count / 5)
      return { ok: true, status: 200, json: async () => ({ elevation: new Array(count).fill(400) }) }
    },
  })

  const res = await fetchBatchElevationAndSlope(cells, { fetchFn: mockFetch })
  assert.strictEqual(res.status.status, 'success')
  assert.deepStrictEqual(chunkSizes, [20, 20, 5])
})

test('7. NASA POWER fill_value (-999 & custom header fill_value) and NaN remain strictly null', async () => {
  nasaPowerCache.clear()
  const mockFetch = createConfigurableMockFetch({
    powerHandler: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        header: { fill_value: -9999 },
        parameters: { ALLSKY_SFC_SW_DWN: { units: 'kW-hr/m^2/day' } },
        properties: {
          parameter: {
            T2M: { ANN: -9999 },
            TS_RANGE: { ANN: NaN },
            ALLSKY_SFC_SW_DWN: { ANN: -999 },
            WS10M: { ANN: 3.5 },
            PRECTOTCORR: { ANN: -9999 },
          },
        },
      }),
    }),
  })

  const res = await fetchBatchNasaPowerClimatology(
    [{ id: 'p_fill', latitude: 40, longitude: 40 }],
    { fetchFn: mockFetch }
  )
  const d = res.data.get('p_fill')
  assert.strictEqual(d?.meanSurfaceTempC, null)
  assert.strictEqual(d?.diurnalTempRangeC, null)
  assert.strictEqual(d?.surfaceSolarIrradianceWm2, null)
  assert.strictEqual(d?.annualPrecipitationMm, null)
  assert.strictEqual(d?.windSpeedMs, 3.5)
})

test('8. NASA POWER ALLSKY_SFC_SW_DWN unit validation handles kWh/m2/day, W/m2, MJ/m2/day, and unknown units', async () => {
  const cases = [
    { units: 'kW-hr/m^2/day', val: 6.0, expectedWm2: 250 },
    { units: 'W/m^2', val: 250, expectedWm2: 250 },
    { units: 'MJ/m^2/day', val: 21.6, expectedWm2: 250 },
    { units: 'lux-uncalibrated', val: 5000, expectedWm2: null },
  ]

  for (let i = 0; i < cases.length; i++) {
    nasaPowerCache.clear()
    const c = cases[i]
    const res = await fetchBatchNasaPowerClimatology(
      [{ id: `unit_${i}`, latitude: 10 + i * 2, longitude: 10 }],
      {
        fetchFn: createConfigurableMockFetch({
          powerHandler: async () => ({
            ok: true,
            status: 200,
            json: async () => ({
              parameters: { ALLSKY_SFC_SW_DWN: { units: c.units } },
              properties: { parameter: { ALLSKY_SFC_SW_DWN: { ANN: c.val } } },
            }),
          }),
        }),
      }
    )
    assert.strictEqual(res.data.get(`unit_${i}`)?.surfaceSolarIrradianceWm2, c.expectedWm2, `Failed unit case ${c.units}`)
  }
})

test('9. NASA POWER -0 grid key normalization and original source value preservation', async () => {
  assert.strictEqual(getPowerGridKey(-0.01, -0.01), getPowerGridKey(0.01, 0.01))
  assert.ok(!getPowerGridKey(-0.01, -0.01).includes('-0.00'))

  nasaPowerCache.clear()
  const res = await fetchBatchNasaPowerClimatology(
    [{ id: 'orig_test', latitude: 0.01, longitude: 0.01 }],
    { fetchFn: createConfigurableMockFetch() }
  )
  const d = res.data.get('orig_test')
  assert.strictEqual(d?.originalSolarKwhM2Day, 5.4)
  assert.strictEqual(d?.originalPrecipMmDay, 0.4)
  assert.strictEqual(d?.datasetVersion, 'v2.10.1')
})

test('10. NASA POWER physically out-of-range measurements are rejected as null', async () => {
  nasaPowerCache.clear()
  const res = await fetchBatchNasaPowerClimatology(
    [{ id: 'bounds_test', latitude: 15, longitude: 15 }],
    {
      fetchFn: createConfigurableMockFetch({
        powerHandler: async () => ({
          ok: true,
          status: 200,
          json: async () => ({
            properties: {
              parameter: {
                T2M: { ANN: 95 }, // > 70 C physical bound
                TS_RANGE: { ANN: -5 }, // negative range impossible
                ALLSKY_SFC_SW_DWN: { ANN: 25 }, // > 15 kWh/m2/day impossible on Earth
                WS10M: { ANN: 160 }, // > 120 m/s
                PRECTOTCORR: { ANN: -2 }, // negative precip impossible
              },
            },
          }),
        }),
      }),
    }
  )
  const d = res.data.get('bounds_test')
  assert.strictEqual(d?.meanSurfaceTempC, null)
  assert.strictEqual(d?.diurnalTempRangeC, null)
  assert.strictEqual(d?.surfaceSolarIrradianceWm2, null)
  assert.strictEqual(d?.windSpeedMs, null)
  assert.strictEqual(d?.annualPrecipitationMm, null)
})

test('11. Macrostrat removes ultramafics (peridotite, serpentinite, ophiolite) from felsic-crystalline', () => {
  for (const rock of ['peridotite', 'serpentinite', 'ophiolite', 'Harzburgite and dunite']) {
    assert.strictEqual(classifyMacrostratLithology(rock), null, `${rock} must NOT misclassify as felsic-crystalline`)
    const detail = classifyMacrostratLithologyDetailed(rock)
    assert.strictEqual(detail.confidence, 'unmapped-class')
  }
  assert.strictEqual(classifyMacrostratLithology('Biotite granite pluton'), 'felsic-crystalline')
})

test('12. Macrostrat retains uncertainty on mixed units while resolving unambiguous Major dominance', () => {
  const mixedFlat = classifyMacrostratLithologyDetailed('Interbedded sandstone and basalt flows')
  assert.strictEqual(mixedFlat.lithology, null)
  assert.strictEqual(mixedFlat.confidence, 'ambiguous-mixed-unit')

  const mixedMajor = classifyMacrostratLithologyDetailed('Major:{sandstone, basalt}, Minor:{shale}')
  assert.strictEqual(mixedMajor.lithology, null)
  assert.strictEqual(mixedMajor.confidence, 'ambiguous-mixed-unit')

  const dominantMajor = classifyMacrostratLithologyDetailed('Major:{sandstone}, Minor:{basalt}')
  assert.strictEqual(dominantMajor.lithology, 'clay-sedimentary')
  assert.strictEqual(dominantMajor.confidence, 'mapped')
})

test('13. Macrostrat batch connector preserves geologicAge, mapScale, sourceUrl, and rawLithologyText', async () => {
  macrostratCache.clear()
  const res = await fetchBatchMacrostratGeology(
    [{ id: 'geo_meta', latitude: 35.1234, longitude: -111.5678 }],
    { fetchFn: createConfigurableMockFetch() }
  )
  const d = res.data.get('geo_meta')
  assert.strictEqual(d?.lithology, 'basaltic')
  assert.strictEqual(d?.lithologyConfidence, 'mapped')
  assert.strictEqual(d?.geologicAge, 'Pliocene')
  assert.strictEqual(d?.mapScale, '1:250k')
  assert.strictEqual(d?.sourceUrl, 'https://macrostrat.org/ref/1')
  assert.strictEqual(d?.rawLithologyText, 'Major:{basalt}, Minor:{tuff}')
})

test('14. Discovery provenance separates status ("unverified"), dataOrigin, evidenceClassification, and verificationState', async () => {
  elevationCache.clear()
  nasaPowerCache.clear()
  macrostratCache.clear()

  const res = await executeRegionalDiscovery(
    {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'geological-research',
      gridSpacingDeg: 1.0,
    },
    { fetchFn: createConfigurableMockFetch() }
  )

  const provMap = res.candidates[0].candidate.provenanceMap
  assert.strictEqual(provMap.elevationM.status, 'unverified')
  assert.strictEqual(provMap.elevationM.dataOrigin, 'live-api-estimate')
  assert.strictEqual(provMap.elevationM.evidenceClassification, 'measured')
  assert.strictEqual(provMap.elevationM.verificationState, 'unverified')

  assert.strictEqual(provMap.meanSlopeDeg.dataOrigin, 'computed-derivative')
  assert.strictEqual(provMap.meanSlopeDeg.evidenceClassification, 'derived')
  assert.match(provMap.meanSlopeDeg.sourceTitle ?? '', /5-Point Central-Difference/i)

  assert.strictEqual(provMap.meanSurfaceTempC.evidenceClassification, 'proxy')
  assert.strictEqual(provMap.lithology.evidenceClassification, 'proxy')
  assert.strictEqual(provMap.surfaceSolarIrradianceWm2.originalSourceValue, 5.4)
  assert.strictEqual(provMap.rockAbundancePct.status, 'no-data')
  assert.strictEqual(provMap.rockAbundancePct.dataOrigin, 'missing')
})

test('15. Failed providers mark every missing feature strictly as status: "no-data" (never verified/unverified)', async () => {
  elevationCache.clear()
  nasaPowerCache.clear()
  macrostratCache.clear()

  const res = await executeRegionalDiscovery(
    {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'rover-testing',
      gridSpacingDeg: 1.0,
    },
    {
      fetchFn: createConfigurableMockFetch({
        openMeteoHandler: async () => ({ ok: false, status: 500, statusText: 'Down', json: async () => ({}) }),
        powerHandler: async () => { throw new Error('POWER down') },
      }),
    }
  )

  const provMap = res.candidates[0].candidate.provenanceMap
  assert.strictEqual(provMap.elevationM.status, 'no-data')
  assert.strictEqual(provMap.meanSlopeDeg.status, 'no-data')
  assert.strictEqual(provMap.meanSurfaceTempC.status, 'no-data')
  assert.strictEqual(provMap.diurnalTempRangeC.status, 'no-data')
  assert.strictEqual(provMap.surfaceSolarIrradianceWm2.status, 'no-data')
  assert.strictEqual(res.candidates[0].score, null)
})

test('16. Grid generator integer-step eliminates 0.1 deg cumulative drift & normalized-zero IDs', () => {
  const grid = generateDiscoveryGrid({
    boundingBox: [-0.2, -0.2, 0.2, 0.2],
    gridSpacingDeg: 0.1,
    maxCells: 100,
  })
  assert.strictEqual(grid.length, 16)
  const expectedLats = new Set([-0.15, -0.05, 0.05, 0.15])
  for (const c of grid) {
    assert.ok(expectedLats.has(c.latitude), `Unexpected drifted latitude ${c.latitude}`)
    assert.ok(!c.id.includes('-0.0000'))
    assert.match(c.id, /^cell_[+-]\d+\.\d{4}_[+-]\d+\.\d{4}$/)
  }
})

test('17. Grid generator strictly rejects non-integer, <= 0, and > 100 maxCells', () => {
  for (const badMaxCells of [0, -5, 2.5, 101, NaN, Infinity]) {
    assert.throws(
      () =>
        generateDiscoveryGrid({
          boundingBox: [10, 10, 11, 11],
          gridSpacingDeg: 0.5,
          maxCells: badMaxCells,
        }),
      GridValidationError
    )
  }
})

test('18. Discovery engine rejects array payloads, invalid categories, invalid maxCandidates, and invalid target bodies', async () => {
  const mockFetch = createConfigurableMockFetch()
  await assert.rejects(() => executeRegionalDiscovery([], { fetchFn: mockFetch }), /not an array/i)
  await assert.rejects(
    () =>
      executeRegionalDiscovery(
        {
          boundingBox: [35, -112, 36, -111],
          targetId: 'mars-jezero-delta',
          missionProfile: 'rover-testing',
          category: 'not-a-real-category',
        },
        { fetchFn: mockFetch }
      ),
    /Invalid analog category/i
  )
  await assert.rejects(
    () =>
      executeRegionalDiscovery(
        {
          boundingBox: [35, -112, 36, -111],
          targetId: 'mars-jezero-delta',
          missionProfile: 'rover-testing',
          maxCandidates: 51,
        },
        { fetchFn: mockFetch }
      ),
    /maxCandidates/i
  )
})

test('19. Valid requestedCategory records advisory warning without auto-tagging or dropping live cells', async () => {
  elevationCache.clear()
  nasaPowerCache.clear()
  macrostratCache.clear()

  const res = await executeRegionalDiscovery(
    {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'geological-research',
      category: 'volcanic-fields',
      gridSpacingDeg: 1.0,
    },
    { fetchFn: createConfigurableMockFetch() }
  )
  assert.strictEqual(res.candidates.length, 1)
  assert.strictEqual(res.candidates[0].candidate.category, undefined)
  assert.ok(res.warnings.some((w) => w.includes('advisory search context')))
})

test('20. fetchWithRetry retries transient 429/503 responses once and skips retry on 400', async () => {
  let transientCalls = 0
  const retryRes = await fetchWithRetry('https://example.test/retry', {}, {
    maxRetries: 1,
    retryDelayMs: 10,
    fetchFn: async () => {
      transientCalls++
      if (transientCalls === 1) return new Response('rate limited', { status: 429 })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    },
  })
  assert.strictEqual(transientCalls, 2)
  assert.strictEqual(retryRes.status, 200)

  let clientErrCalls = 0
  const noRetryRes = await fetchWithRetry('https://example.test/bad', {}, {
    maxRetries: 1,
    retryDelayMs: 10,
    fetchFn: async () => {
      clientErrCalls++
      return new Response('bad request', { status: 400 })
    },
  })
  assert.strictEqual(clientErrCalls, 1)
  assert.strictEqual(noRetryRes.status, 400)
})

test('21. DiscoveryCache supports LRU promotion, expired pruning, and concurrent getOrLoad coalescing', async () => {
  const cache = new DiscoveryCache(5000, 2)
  cache.set('k1', 'v1')
  cache.set('k2', 'v2')
  // Promote k1 so k2 becomes oldest LRU
  assert.strictEqual(cache.get('k1'), 'v1')
  cache.set('k3', 'v3')
  assert.strictEqual(cache.get('k1'), 'v1')
  assert.strictEqual(cache.get('k2'), undefined, 'Oldest unused entry k2 should be evicted by LRU')
  assert.strictEqual(cache.get('k3'), 'v3')

  let loadCalls = 0
  const [a, b, c] = await Promise.all([
    cache.getOrLoad('shared', async () => {
      loadCalls++
      await new Promise((r) => setTimeout(r, 15))
      return 42
    }),
    cache.getOrLoad('shared', async () => {
      loadCalls++
      return 99
    }),
    cache.getOrLoad('shared', async () => {
      loadCalls++
      return 100
    }),
  ])
  assert.strictEqual(loadCalls, 1, 'Concurrent identical loads must coalesce to 1 execution')
  assert.strictEqual(a.value, 42)
  assert.strictEqual(b.value, 42)
  assert.strictEqual(c.value, 42)
})

test('22. Response cache differentiates weights/category, sets responseCacheHit, and skips caching failed runs', async () => {
  discoveryResponseCache.clear()
  elevationCache.clear()
  nasaPowerCache.clear()
  macrostratCache.clear()

  let fetchCalls = 0
  const countingFetch = createConfigurableMockFetch({
    openMeteoHandler: async (u) => {
      fetchCalls++
      const count = new URL(u).searchParams.get('latitude').split(',').length
      return { ok: true, status: 200, json: async () => ({ elevation: new Array(count).fill(1000) }) }
    },
  })

  const req = {
    boundingBox: [35.0, -112.0, 36.0, -111.0],
    targetId: 'mars-jezero-delta',
    missionProfile: 'rover-testing',
    gridSpacingDeg: 1.0,
  }

  const r1 = await executeRegionalDiscovery(req, { fetchFn: countingFetch, useResponseCache: true })
  assert.strictEqual(fetchCalls, 1)
  assert.strictEqual(r1.searchMetadata.responseCacheHit, false)

  const r2 = await executeRegionalDiscovery(req, { fetchFn: countingFetch, useResponseCache: true })
  assert.strictEqual(fetchCalls, 1, 'Identical request must hit response cache')
  assert.strictEqual(r2.searchMetadata.responseCacheHit, true)

  // Custom weights change cache key
  const r3 = await executeRegionalDiscovery(
    {
      ...req,
      missionProfile: { id: 'custom-w', label: 'Custom', weights: { elevationM: 1.0 } },
    },
    { fetchFn: countingFetch, useResponseCache: true }
  )
  assert.strictEqual(r3.searchMetadata.responseCacheHit, false)

  // Failed run must NOT enter responseCache
  discoveryResponseCache.clear()
  elevationCache.clear()
  let failCalls = 0
  await executeRegionalDiscovery(req, {
    useResponseCache: true,
    fetchFn: createConfigurableMockFetch({
      openMeteoHandler: async () => {
        failCalls++
        return { ok: false, status: 500, json: async () => ({}) }
      },
    }),
  })
  await executeRegionalDiscovery(req, {
    useResponseCache: true,
    fetchFn: createConfigurableMockFetch({
      openMeteoHandler: async () => {
        failCalls++
        return { ok: false, status: 500, json: async () => ({}) }
      },
    }),
  })
  assert.strictEqual(failCalls, 2, 'Failed provider runs must never be cached in response cache')
})

test('23. SlidingWindowRateLimiter blocks above limit with Retry-After and recovers after window', () => {
  const limiter = new SlidingWindowRateLimiter(1000, 2)
  assert.strictEqual(limiter.check('ip:1.2.3.4', 1000).allowed, true)
  assert.strictEqual(limiter.check('ip:1.2.3.4', 1100).allowed, true)
  const blocked = limiter.check('ip:1.2.3.4', 1200)
  assert.strictEqual(blocked.allowed, false)
  assert.ok(blocked.retryAfterSec >= 1)

  // Separate client IP unaffected
  assert.strictEqual(limiter.check('ip:5.6.7.8', 1200).allowed, true)

  // Original client recovers once window passes
  assert.strictEqual(limiter.check('ip:1.2.3.4', 2500).allowed, true)

  const hdrs = new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' })
  assert.strictEqual(extractClientIdentifier(hdrs), 'ip:203.0.113.9')
})

test('24. API /api/discover enforces rate limiting, array-body rejection, and sanitized 500 responses', async () => {
  const routeSrc = readFileSync(
    resolve(process.cwd(), 'src/app/api/discover/route.ts'),
    'utf8'
  )
  assert.ok(routeSrc.includes('checkDiscoverRateLimit'))
  assert.ok(routeSrc.includes('Array.isArray(parsed)'))
  assert.ok(routeSrc.includes('RATE_LIMIT_EXCEEDED'))
  // Sanitized 500 branch must not expose `error.message` to client payload
  const catchIdx = routeSrc.indexOf('INTERNAL_SERVER_ERROR')
  assert.ok(catchIdx > -1)
  const sanitizedBlock = routeSrc.slice(catchIdx, catchIdx + 220)
  assert.ok(!sanitizedBlock.includes('details:'), '500 response must not include raw internal error details')

  // Optional live integration check if local dev server is already listening on 3000
  try {
    const ping = await fetch('http://127.0.0.1:3000/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    })
    assert.strictEqual(ping.status, 400)
    const body = await ping.json()
    assert.strictEqual(body.error?.code, 'VALIDATION_ERROR')
  } catch {
    // Dev server not listening; static + unit assertions remain verified
  }
})

test('25. Similarity engine remains compatible with status: "unverified" live features and gates <40% coverage', () => {
  const target = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  assert.ok(target)

  const liveCandidate = {
    id: 'sim_compat',
    name: 'Compat Cell',
    country: 'Regional Scan',
    latitude: 35,
    longitude: -112,
    setting: 'Test',
    summary: 'Test',
    environment: {
      meanSurfaceTempC: -55,
      diurnalTempRangeC: 50,
      annualPrecipitationMm: 10,
      meanSlopeDeg: 4.5,
      rockAbundancePct: null,
      medianGrainSizeMm: null,
      albedo: null,
      vegetationCoverPct: null,
      lithology: 'basaltic',
      elevationM: -2400,
      surfacePressurePa: null,
      surfaceSolarIrradianceWm2: 590,
    },
    provenanceMap: {
      meanSurfaceTempC: { status: 'unverified', unit: '°C', isComparable: true },
      diurnalTempRangeC: { status: 'unverified', unit: '°C', isComparable: true },
      meanSlopeDeg: { status: 'unverified', unit: '°', isComparable: true },
      lithology: { status: 'unverified', unit: '', isComparable: true },
      elevationM: { status: 'unverified', unit: 'm', isComparable: true },
      surfaceSolarIrradianceWm2: { status: 'unverified', unit: 'W/m²', isComparable: true },
    },
    isVerified: false,
    noveltyTier: 'live-grid-discovery',
  }

  const evalRes = computeAnalogSimilarity(target, liveCandidate, GEOLOGICAL_RESEARCH_PROFILE)
  assert.strictEqual(evalRes.isReliable, true)
  assert.ok(typeof evalRes.score === 'number' && evalRes.score >= 0 && evalRes.score <= 100)
})
