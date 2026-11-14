/**
 * TerraTwin — Phase 6, Step 4 Discovery Scanner Verification Suite
 *
 * Covers 36 deterministic verification cases across:
 *   1-10:  API Integration (payload shape, coords, mission profiles, targets, 400/404/429/500, partial providers)
 *   11-20: Scientific Integrity (null!=0, score:null!=0%, score vs coverage, unverified badge, provenance, weights)
 *   21-28: Map Interaction (bounds conversion, span limits, antimeridian, cell highlight, sync, atlas, target stale guard)
 *   29-36: UI Reliability, Accessibility, Responsive Breakpoints & SSR safety
 */

import test from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  buildDiscoveryRequestPayload,
  classifyCandidateVisualTier,
  computeBboxAroundPoint,
  estimateScannerGrid,
  formatProvenanceVerificationBadge,
  getVisualTierStyle,
  leafletBoundsToGeoBbox,
  submitDiscoveryScan,
  summarizeDiscoveryResponse,
  validateScannerBoundingBox,
  VISUAL_TIER_STYLES,
} from '../src/lib/terratwin/scanner/scanner-utils.ts'

import { CONFIGURABLE_MISSION_PROFILES } from '../src/lib/terratwin/config/comparison-config.ts'
import { SAMPLE_TARGETS } from '../src/lib/terratwin/sample-dataset.ts'
import { getAllAtlasCandidates } from '../src/lib/terratwin/services/discovery-atlas-service.ts'
import { formatCoverage, formatFeatureValue, formatScore } from '../src/lib/terratwin/format.ts'

function readSrc(relPath) {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8')
}

function makeMockResponsePayload(overrides = {}) {
  return {
    success: true,
    searchMetadata: {
      boundingBox: [35.0, -112.0, 36.0, -111.0],
      targetId: 'mars-jezero-delta',
      missionProfile: 'Rover testing & trafficability',
      gridSpacingDeg: 0.5,
      cellsGenerated: 4,
      cellsEvaluated: 4,
      maxCellsAllowed: 16,
      responseCacheHit: false,
    },
    target: SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta'),
    missionProfile: CONFIGURABLE_MISSION_PROFILES[0],
    providerStatuses: [
      {
        provider: 'Open-Meteo Elevation',
        dataset: 'Copernicus DEM GLO-90',
        status: 'success',
        recordsFetched: 4,
        latencyMs: 55,
        spatialResolution: '90 m',
        attributionNotice: 'Copernicus DEM',
      },
      {
        provider: 'NASA POWER Climatology',
        dataset: 'POWER v2.10.1',
        status: 'success',
        recordsFetched: 1,
        latencyMs: 90,
        spatialResolution: '0.5° × 0.625°',
        attributionNotice: 'NASA POWER',
      },
      {
        provider: 'Macrostrat Geology',
        dataset: 'Macrostrat v2',
        status: 'success',
        recordsFetched: 4,
        latencyMs: 65,
        spatialResolution: '1:250k',
        attributionNotice: 'Macrostrat',
      },
    ],
    totalCellsEvaluated: 4,
    computableCandidatesCount: 1,
    insufficientDataCandidatesCount: 1,
    candidates: [
      {
        rank: 1,
        candidate: {
          id: 'cell_+35.2500_-111.7500',
          name: 'Candidate Cell +35.2500_-111.7500',
          country: 'Regional Scan',
          latitude: 35.25,
          longitude: -111.75,
          setting: 'Regional geology: Basalt Flow',
          summary: 'Exploratory cell',
          environment: {
            meanSurfaceTempC: 11.5,
            diurnalTempRangeC: 15.0,
            annualPrecipitationMm: 220,
            meanSlopeDeg: 4.2,
            rockAbundancePct: null,
            medianGrainSizeMm: null,
            albedo: null,
            vegetationCoverPct: null,
            lithology: 'basaltic',
            elevationM: 2100,
            surfacePressurePa: null,
            surfaceSolarIrradianceWm2: 220,
          },
          provenanceMap: {
            elevationM: {
              status: 'unverified',
              dataOrigin: 'live-api-estimate',
              evidenceClassification: 'measured',
              verificationState: 'unverified',
              sourceTitle: 'Copernicus DEM GLO-90 (Open-Meteo)',
              unit: 'm',
              isComparable: true,
            },
            rockAbundancePct: {
              status: 'no-data',
              dataOrigin: 'missing',
              evidenceClassification: 'missing_data',
              verificationState: 'no-data',
              unit: '%',
              isComparable: true,
            },
          },
          isVerified: false,
          noveltyTier: 'live-grid-discovery',
          boundingBox: [35.0, -112.0, 35.5, -111.5],
          windSpeedMs: 4.2,
        },
        score: 76.4,
        scoreDisplay: '76.4%',
        coverage: 0.45,
        confidence: 'low',
        isReliable: true,
        weightedDistance: 0.236,
        missingFeatures: ['rockAbundancePct', 'medianGrainSizeMm'],
        incompatibleFeatures: [],
        featureScores: [
          {
            key: 'meanSlopeDeg',
            label: 'Mean terrain slope',
            weight: 0.25,
            status: 'comparable',
            similarity: 0.96,
          },
        ],
        explanation: 'Evaluated 5 comparable features',
        warnings: ['Rock abundance unmeasured'],
      },
      {
        rank: 2,
        candidate: {
          id: 'cell_+35.7500_-111.7500',
          name: 'Candidate Cell +35.7500_-111.7500',
          country: 'Regional Scan',
          latitude: 35.75,
          longitude: -111.75,
          setting: 'Terrestrial exploratory grid cell',
          summary: 'Sparse cell',
          environment: {
            meanSurfaceTempC: null,
            diurnalTempRangeC: null,
            annualPrecipitationMm: null,
            meanSlopeDeg: 2.1,
            rockAbundancePct: null,
            medianGrainSizeMm: null,
            albedo: null,
            vegetationCoverPct: null,
            lithology: null,
            elevationM: 1850,
            surfacePressurePa: null,
            surfaceSolarIrradianceWm2: null,
          },
          isVerified: false,
          noveltyTier: 'live-grid-discovery',
          boundingBox: [35.5, -112.0, 36.0, -111.5],
          windSpeedMs: null,
        },
        score: null,
        scoreDisplay: 'Insufficient data to rank reliably',
        coverage: 0.25,
        confidence: 'insufficient',
        isReliable: false,
        weightedDistance: null,
        missingFeatures: ['meanSurfaceTempC'],
        incompatibleFeatures: [],
        featureScores: [],
        explanation: 'Insufficient data',
        warnings: ['Data coverage is below 40% threshold.'],
      },
    ],
    warnings: ['Screening leads only'],
    executionTimeMs: 145,
    ...overrides,
  }
}

// === API INTEGRATION (1–10) ===

test('1. Builds exact POST /api/discover request payload matching backend contract', () => {
  const { payload, error } = buildDiscoveryRequestPayload({
    targetId: 'mars-jezero-delta',
    missionProfile: 'rover-testing',
    boundingBox: [35.0, -112.0, 36.0, -111.0],
    gridSpacingDeg: 0.5,
    maxCells: 16,
    maxCandidates: 10,
    advisoryCategory: '',
  })
  assert.strictEqual(error, null)
  assert.deepStrictEqual(payload, {
    boundingBox: [35, -112, 36, -111],
    targetId: 'mars-jezero-delta',
    missionProfile: 'rover-testing',
    gridSpacingDeg: 0.5,
    maxCells: 16,
    maxCandidates: 10,
  })
})

test('2. Coordinate ordering preserves [minLatitude, minLongitude, maxLatitude, maxLongitude]', () => {
  const { payload } = buildDiscoveryRequestPayload({
    targetId: 'moon-south-polar-highlands',
    missionProfile: 'lunar-base-construction',
    boundingBox: [-24.5, -70.4, -23.5, -69.4],
    gridSpacingDeg: 0.5,
    maxCells: 25,
    maxCandidates: 10,
  })
  assert.strictEqual(payload.boundingBox[0], -24.5)
  assert.strictEqual(payload.boundingBox[1], -70.4)
  assert.strictEqual(payload.boundingBox[2], -23.5)
  assert.strictEqual(payload.boundingBox[3], -69.4)
})

test('3. Supports all four repository mission profiles directly', () => {
  const ids = CONFIGURABLE_MISSION_PROFILES.map((p) => p.id)
  assert.deepStrictEqual(ids, [
    'rover-testing',
    'geological-research',
    'lunar-base-construction',
    'astrobiology-habitability',
  ])
  for (const id of ids) {
    const res = buildDiscoveryRequestPayload({
      targetId: 'mars-jezero-delta',
      missionProfile: id,
      boundingBox: [35, -112, 36, -111],
      gridSpacingDeg: 0.5,
      maxCells: 10,
      maxCandidates: 5,
    })
    assert.strictEqual(res.error, null)
    assert.strictEqual(res.payload.missionProfile, id)
  }
})

test('4. Rejects missing targetId or missionProfile prior to network dispatch', () => {
  assert.ok(
    buildDiscoveryRequestPayload({
      targetId: '',
      missionProfile: 'rover-testing',
      boundingBox: [35, -112, 36, -111],
      gridSpacingDeg: 0.5,
      maxCells: 10,
      maxCandidates: 5,
    }).error
  )
  assert.ok(
    buildDiscoveryRequestPayload({
      targetId: 'mars-jezero-delta',
      missionProfile: '',
      boundingBox: [35, -112, 36, -111],
      gridSpacingDeg: 0.5,
      maxCells: 10,
      maxCandidates: 5,
    }).error
  )
})

test('5. Grid settings validation rejects out-of-range cells or spacing matching backend limits', () => {
  assert.strictEqual(estimateScannerGrid([35, -112, 36, -111], 0.5, 16).totalCells, 4)
  assert.strictEqual(estimateScannerGrid([35, -112, 36, -111], 0.05, 16).isValid, false)
  assert.strictEqual(estimateScannerGrid([35, -112, 36, -111], 0.5, 101).isValid, false)
  assert.strictEqual(estimateScannerGrid([30, -115, 35, -110], 0.5, 50).isValid, false) // 100 > 50
})

test('6. Parses successful RegionalDiscoveryResponse accurately', async () => {
  const mockJson = makeMockResponsePayload()
  const res = await submitDiscoveryScan(
    {
      boundingBox: [35, -112, 36, -111],
      targetId: 'mars-jezero-delta',
      missionProfile: 'rover-testing',
    },
    {
      fetchFn: async () => new Response(JSON.stringify(mockJson), { status: 200 }),
    }
  )
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.outcome, 'success')
  assert.strictEqual(res.response.candidates.length, 2)
})

test('7. Handles 400 validation errors cleanly', async () => {
  const res = await submitDiscoveryScan(
    {
      boundingBox: [35, -112, 36, -111],
      targetId: 'mars-jezero-delta',
      missionProfile: 'rover-testing',
    },
    {
      fetchFn: async () =>
        new Response(
          JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid box' } }),
          { status: 400 }
        ),
    }
  )
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.error.status, 400)
  assert.strictEqual(res.error.code, 'VALIDATION_ERROR')
  assert.strictEqual(res.error.message, 'Invalid box')
})

test('8. Handles 429 rate-limit response & Retry-After without retrying automatically', async () => {
  let calls = 0
  const res = await submitDiscoveryScan(
    {
      boundingBox: [35, -112, 36, -111],
      targetId: 'mars-jezero-delta',
      missionProfile: 'rover-testing',
    },
    {
      fetchFn: async () => {
        calls++
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many discovery requests from this client.',
              details: { retryAfterSec: 42 },
            },
          }),
          { status: 429, headers: { 'Retry-After': '42' } }
        )
      },
    }
  )
  assert.strictEqual(calls, 1, 'Frontend must NEVER loop retries after 429')
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.error.isRateLimited, true)
  assert.strictEqual(res.error.retryAfterSec, 42)
})

test('9. Handles 500 server failures with sanitized fallback message', async () => {
  const res = await submitDiscoveryScan(
    {
      boundingBox: [35, -112, 36, -111],
      targetId: 'mars-jezero-delta',
      missionProfile: 'rover-testing',
    },
    {
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'internal stack trace leak' },
          }),
          { status: 500 }
        ),
    }
  )
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.error.status, 500)
  assert.strictEqual(res.error.message, 'The discovery request could not be completed.')
})

test('10. Classifies partial provider responses honestly as partial-success', async () => {
  const base = makeMockResponsePayload()
  base.providerStatuses[1] = { ...base.providerStatuses[1], status: 'failed', error: 'NASA POWER timeout' }
  const res = await submitDiscoveryScan(
    { boundingBox: [35, -112, 36, -111], targetId: 'mars-jezero-delta', missionProfile: 'rover-testing' },
    { fetchFn: async () => new Response(JSON.stringify(base), { status: 200 }) }
  )
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.outcome, 'partial-success')
  const metrics = summarizeDiscoveryResponse(res.response)
  assert.strictEqual(metrics.failedProviders.length, 1)
})

// === SCIENTIFIC INTEGRITY (11–20) ===

test('11. Missing values format strictly as "No data", never as zero', () => {
  assert.strictEqual(formatFeatureValue('rockAbundancePct', null), 'No data')
  assert.strictEqual(formatFeatureValue('meanSurfaceTempC', null), 'No data')
})

test('12. Candidates with score: null format as "Insufficient data", never 0%, and receive neutral tier', () => {
  assert.strictEqual(formatScore(null), 'Insufficient data')
  const payload = makeMockResponsePayload()
  const sparse = payload.candidates[1]
  assert.strictEqual(classifyCandidateVisualTier(sparse), 'insufficient-data')
  assert.strictEqual(VISUAL_TIER_STYLES['insufficient-data'].fillColor, '#475569')
  assert.ok(VISUAL_TIER_STYLES['insufficient-data'].dashArray)
})

test('13. Coverage and similarity remain strictly decoupled in summary & formatting', () => {
  const payload = makeMockResponsePayload()
  assert.notStrictEqual(formatScore(payload.candidates[0].score), formatCoverage(payload.candidates[0].coverage))
  const detailsSrc = readSrc('src/components/discover/discovery-candidate-details.tsx')
  assert.ok(detailsSrc.includes('Similarity Score'))
  assert.ok(detailsSrc.includes('Data Coverage'))
})

test('14. Unverified live candidates show honest unverified labels', () => {
  const badge = formatProvenanceVerificationBadge({
    status: 'unverified',
    verificationState: 'unverified',
    unit: 'm',
    isComparable: true,
  })
  assert.strictEqual(badge.label, 'Unverified API lead')
  const detailsSrc = readSrc('src/components/discover/discovery-candidate-details.tsx')
  assert.ok(detailsSrc.includes('Exploratory candidate — not field-verified'))
})

test('15. Provenance metadata (dataOrigin, evidenceClassification, verificationState) preserved & rendered', () => {
  const detailsSrc = readSrc('src/components/discover/discovery-candidate-details.tsx')
  assert.ok(detailsSrc.includes('prov?.dataOrigin'))
  assert.ok(detailsSrc.includes('prov?.evidenceClassification'))
  assert.ok(detailsSrc.includes('prov?.verificationState'))
  assert.ok(detailsSrc.includes('prov?.originalSourceValue'))
})

test('16. Mission breakdown renders actual backend featureScores without inventing arbitrary math', () => {
  const detailsSrc = readSrc('src/components/discover/discovery-candidate-details.tsx')
  assert.ok(detailsSrc.includes('selectedCandidate.featureScores'))
  assert.ok(!detailsSrc.includes('computeAnalogSimilarity('), 'Details view uses server featureScores without recomputing')
})

test('17. Correct scientific units (°C, W/m², degrees slope, m) displayed faithfully', () => {
  assert.strictEqual(formatFeatureValue('meanSlopeDeg', 4.2), '4 °')
  assert.strictEqual(formatFeatureValue('meanSurfaceTempC', 11.5), '11.5 °C')
  assert.strictEqual(formatFeatureValue('surfaceSolarIrradianceWm2', 220), '220 W/m²')
  assert.strictEqual(formatFeatureValue('elevationM', 2100), '2,100 m')
})

test('18. Curated Global Atlas (31 sites) stays visually & semantically distinct from live grid cells', () => {
  const atlas = getAllAtlasCandidates()
  assert.strictEqual(atlas.length, 31)
  assert.strictEqual(atlas.some((c) => c.noveltyTier === 'live-grid-discovery'), false)
  const mapCanvasSrc = readSrc('src/components/discover/discovery-earth-map-canvas.tsx')
  assert.ok(mapCanvasSrc.includes('L.rectangle('))
  assert.ok(mapCanvasSrc.includes('L.circleMarker('))
  const resultsSrc = readSrc('src/components/discover/discovery-results-panel.tsx')
  assert.ok(resultsSrc.includes('NOT outputs of the live regional scanner'))
})

test('19. Category control communicates advisory-only backend behavior transparently', () => {
  const configSrc = readSrc('src/components/discover/discovery-config-panel.tsx')
  assert.ok(configSrc.includes('advisory context only (no live cell filter)'))
})

test('20. All mission profile weights sum to 1.0 and remain unmodified in UI', () => {
  for (const prof of CONFIGURABLE_MISSION_PROFILES) {
    const sum = Object.values(prof.weights).reduce((a, b) => a + b, 0)
    assert.ok(Math.abs(sum - 1.0) < 1e-5, `Profile ${prof.id} sum mismatch: ${sum}`)
  }
})

// === MAP INTERACTION & COORDINATE SAFETY (21–28) ===

test('21. Map bounds convert cleanly to backend [minLat, minLon, maxLat, maxLon]', () => {
  const res = leafletBoundsToGeoBbox({ south: 35.1, west: -112.2, north: 36.1, east: -111.2 })
  assert.strictEqual(res.error, null)
  assert.deepStrictEqual(res.bbox, [35.1, -112.2, 36.1, -111.2])
})

test('22. Rejects oversized region (> 10° × 10°) and zero-area boxes without silent clamping', () => {
  const big = validateScannerBoundingBox([20, 10, 32, 22])
  assert.strictEqual(big.isValid, false)
  assert.match(big.error ?? '', /exceeds the supported scan limits/i)

  const zero = validateScannerBoundingBox([35, -112, 35, -111])
  assert.strictEqual(zero.isValid, false)
  assert.match(zero.error ?? '', /zero area/i)
})

test('23. Detects antimeridian crossings explicitly with actionable guidance', () => {
  const cross = validateScannerBoundingBox([10, 175, 12, -175])
  assert.strictEqual(cross.isValid, false)
  assert.match(cross.error ?? '', /antimeridian/i)

  const fromLeaflet = leafletBoundsToGeoBbox({ south: 10, west: 178, north: 12, east: 182 })
  assert.strictEqual(fromLeaflet.bbox, null)
  assert.match(fromLeaflet.error ?? '', /antimeridian/i)
})

test('24. Visual tier helper handles highlighted vs insufficient cell state deterministically', () => {
  assert.strictEqual(classifyCandidateVisualTier({ score: 75, isReliable: true }), 'high-similarity')
  assert.strictEqual(classifyCandidateVisualTier({ score: 55, isReliable: true }), 'moderate-similarity')
  assert.strictEqual(classifyCandidateVisualTier({ score: 30, isReliable: true }), 'low-similarity')
  assert.strictEqual(classifyCandidateVisualTier({ score: 85, isReliable: false }), 'insufficient-data')
  assert.ok(getVisualTierStyle({ score: null, isReliable: false }).dashArray)
})

test('25. Map and Results selection handlers synchronize through shared workspace IDs', () => {
  const wsSrc = readSrc('src/components/discover/discovery-scanner-workspace.tsx')
  assert.ok(wsSrc.includes('onSelectCandidate={handleSelectCandidate}'))
  assert.ok(wsSrc.includes('onSelectAtlasSite={handleSelectAtlasSite}'))
  assert.ok(wsSrc.includes('selectedCandidateId={effectiveSelectedCandidateId}'))
})

test('26. Atlas seed bbox calculation never crosses antimeridian or poles', () => {
  const edgeEast = computeBboxAroundPoint(89.5, 179.8, 2.0)
  assert.strictEqual(validateScannerBoundingBox(edgeEast).isValid, true)
  const edgeSouth = computeBboxAroundPoint(-89.8, -179.9, 2.0)
  assert.strictEqual(validateScannerBoundingBox(edgeSouth).isValid, true)
})

test('27. Map canvas clears previous grid layer before drawing new scan rectangles', () => {
  const mapCanvasSrc = readSrc('src/components/discover/discovery-earth-map-canvas.tsx')
  assert.ok(mapCanvasSrc.includes('gridLayerRef.current'))
  assert.ok(mapCanvasSrc.includes('layer.clearLayers()'))
})

test('28. Switching target or mission profile warns user about stale scan results', () => {
  const wsSrc = readSrc('src/components/discover/discovery-scanner-workspace.tsx')
  assert.ok(wsSrc.includes('isStaleTargetOrProfile'))
  assert.ok(wsSrc.includes('scanner.resultTargetId !== draft.targetId'))
  const resultsSrc = readSrc('src/components/discover/discovery-results-panel.tsx')
  assert.ok(resultsSrc.includes('isStaleTargetOrProfile'))
})

// === UI RELIABILITY, ACCESSIBILITY & SSR SAFETY (29–36) ===

test('29. Honest loading state avoids fake percentage claims and keeps status live region', () => {
  const hookSrc = readSrc('src/hooks/use-discovery-scanner.ts')
  assert.ok(hookSrc.includes('Requesting regional scientific data'))
  const cfgSrc = readSrc('src/components/discover/discovery-config-panel.tsx')
  assert.ok(cfgSrc.includes('aria-busy={isBusy}'))
  assert.ok(cfgSrc.includes('aria-live="polite"'))
})

test('30. Empty initial state displays accurate prompt before scan', () => {
  const cfgSrc = readSrc('src/components/discover/discovery-config-panel.tsx')
  assert.ok(cfgSrc.includes('Select an Earth region to begin a scientific analog scan.'))
})

test('31. Insufficient-data and failed-provider states render dedicated truthful banners', () => {
  const resultsSrc = readSrc('src/components/discover/discovery-results-panel.tsx')
  assert.ok(resultsSrc.includes('No candidates met the minimum 40% evidence coverage required for reliable ranking.'))
  assert.ok(resultsSrc.includes('Some scientific sources were unavailable or partial.'))
  assert.ok(resultsSrc.includes('All external environmental providers failed.'))
})

test('32. AbortController cancellation marks client_aborted cleanly without crashing', async () => {
  const controller = new AbortController()
  const promise = submitDiscoveryScan(
    { boundingBox: [35, -112, 36, -111], targetId: 'mars-jezero-delta', missionProfile: 'rover-testing' },
    {
      signal: controller.signal,
      fetchFn: (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        }),
    }
  )
  controller.abort()
  const res = await promise
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.aborted, true)
  assert.strictEqual(res.error.code, 'CLIENT_ABORTED')
})

test('33. In-flight ref guard prevents overlapping duplicate launches', () => {
  const hookSrc = readSrc('src/hooks/use-discovery-scanner.ts')
  assert.ok(hookSrc.includes('if (abortControllerRef.current) {'))
  assert.ok(hookSrc.includes('requestSeqRef.current'))
})

test('34. Accessible keyboard inputs and ARIA attributes present on manual region controls', () => {
  const cfgSrc = readSrc('src/components/discover/discovery-config-panel.tsx')
  assert.ok(cfgSrc.includes('aria-invalid='))
  assert.ok(cfgSrc.includes('aria-describedby='))
  assert.ok(cfgSrc.includes('type="number"'))
})

test('35. Responsive workstation layout supports 3-column desktop, collapsible drawers, and mobile tabs', () => {
  const wsSrc = readSrc('src/components/discover/discovery-scanner-workspace.tsx')
  assert.ok(wsSrc.includes('xl:grid-cols-[340px_minmax(0,1fr)_390px]'))
  assert.ok(wsSrc.includes('mobileSection'))
  assert.ok(wsSrc.includes('showLeftPanel'))
  assert.ok(wsSrc.includes('showRightPanel'))
})

test('36. Leaflet map wrapper uses next/dynamic with ssr: false and Discovery Scanner nav route exists', () => {
  const mapWrapperSrc = readSrc('src/components/discover/discovery-earth-map.tsx')
  assert.ok(mapWrapperSrc.includes('ssr: false'))
  const navSrc = readSrc('src/components/site/site-nav.tsx')
  assert.ok(navSrc.includes('href: "/discover"'))
  assert.ok(navSrc.includes('Discovery Scanner'))
  const pageSrc = readSrc('src/app/discover/page.tsx')
  assert.ok(pageSrc.includes('DiscoveryScannerWorkspace'))
})
