/**
 * Phase 4 — Milestone D: Advanced Terrain & Environmental Parameter Comparison Test Suite
 *
 * Verifies:
 * 1. Terrain domain groupings (Topography, Geomorphology, Thermal, Geology, Incomparable).
 * 2. Multi-dimensional Radar/Spider chart data normalization (bounded in [0, 100], log-scaling).
 * 3. Wentworth sediment grain size and hazard classifiers (slope gradient and boulder abundance).
 * 4. Data-driven Scientific Interpretation synthesis across authentic planetary targets and analogs.
 * 5. Full UI integration and SSR verification for /explore.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TERRAIN_DOMAINS,
  buildTerrainRadarData,
  classifyWentworthGrainSize,
  classifySlopeHazard,
  classifyRockHazard,
  generateScientificInterpretation,
} from '../src/lib/terratwin/terrain-comparison.ts'
import { scoreCandidate } from '../src/lib/terratwin/similarity.ts'
import { MISSION_PURPOSES } from '../src/lib/terratwin/features.ts'
import { SAMPLE_TARGETS } from '../src/lib/terratwin/sample-dataset.ts'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

test('Milestone D.1: Terrain Domain Categorization & Feature Coverage', () => {
  assert.equal(TERRAIN_DOMAINS.length, 5, 'Must define exactly 5 scientific domains')

  const domainKeys = TERRAIN_DOMAINS.map((d) => d.key)
  assert.deepEqual(domainKeys, [
    'topography',
    'geomorphology',
    'radiative_thermal',
    'geology',
    'incomparable',
  ])

  const topo = TERRAIN_DOMAINS.find((d) => d.key === 'topography')
  assert.ok(topo.features.includes('meanSlopeDeg'))
  assert.ok(topo.features.includes('elevationM'))

  const geomorph = TERRAIN_DOMAINS.find((d) => d.key === 'geomorphology')
  assert.ok(geomorph.features.includes('rockAbundancePct'))
  assert.ok(geomorph.features.includes('medianGrainSizeMm'))

  const thermal = TERRAIN_DOMAINS.find((d) => d.key === 'radiative_thermal')
  assert.ok(thermal.features.includes('meanSurfaceTempC'))
  assert.ok(thermal.features.includes('albedo'))
  assert.ok(thermal.features.includes('surfaceSolarIrradianceWm2'))

  const geology = TERRAIN_DOMAINS.find((d) => d.key === 'geology')
  assert.ok(geology.features.includes('lithology'))
  assert.ok(geology.features.includes('vegetationCoverPct'))

  const incomparable = TERRAIN_DOMAINS.find((d) => d.key === 'incomparable')
  assert.ok(incomparable.features.includes('surfacePressurePa'))
  assert.ok(incomparable.features.includes('annualPrecipitationMm'))
})

test('Milestone D.2: Multi-Axis Radar Normalization & Boundedness', () => {
  const jezero = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  assert.ok(jezero, 'Jezero target must exist')

  const dummyCandidate = {
    id: 'test-analog',
    name: 'Test Analog Site',
    country: 'Global',
    setting: 'Desert',
    summary: 'Mock analog for testing normalization bounds',
    latitude: 25.0,
    longitude: 35.0,
    environment: {
      meanSlopeDeg: 6.0,
      rockAbundancePct: 14.0,
      medianGrainSizeMm: 0.25,
      albedo: 0.22,
      meanSurfaceTempC: 18.0,
      diurnalTempRangeC: 22.0,
      annualPrecipitationMm: 12.0,
      vegetationCoverPct: 1.0,
      lithology: 'clay-sedimentary',
      elevationM: 950,
      surfacePressurePa: 91000,
      surfaceSolarIrradianceWm2: 230,
    },
  }

  const radarData = buildTerrainRadarData(jezero, dummyCandidate)
  assert.equal(radarData.length, 6, 'Radar chart must have exactly 6 normalized physical axes')

  for (const point of radarData) {
    assert.ok(
      point.targetNorm >= 0 && point.targetNorm <= 100,
      `targetNorm for ${point.parameter} must be in [0, 100], got ${point.targetNorm}`
    )
    assert.ok(
      point.candidateNorm >= 0 && point.candidateNorm <= 100,
      `candidateNorm for ${point.parameter} must be in [0, 100], got ${point.candidateNorm}`
    )
    assert.ok(point.targetRaw !== null, `targetRaw must be preserved for ${point.parameter}`)
    assert.ok(point.candidateRaw !== null, `candidateRaw must be preserved for ${point.parameter}`)
    assert.ok(point.targetDisplay.length > 0)
    assert.ok(point.candidateDisplay.length > 0)
  }

  // Check logarithmic grain size scaling
  const grainPoint = radarData.find((p) => p.featureKey === 'medianGrainSizeMm')
  assert.ok(grainPoint, 'Grain size point must exist')
  assert.ok(grainPoint.unit === 'mm')
  assert.ok(grainPoint.targetDisplay.includes('0.3 mm'))
})

test('Milestone D.3: Wentworth Grain Size & Hazard Classification', () => {
  // Wentworth Scale
  assert.equal(classifyWentworthGrainSize(0.002), 'Clay (<0.004 mm)')
  assert.equal(classifyWentworthGrainSize(0.04), 'Silt (0.004–0.063 mm)')
  assert.equal(classifyWentworthGrainSize(0.08), 'Very Fine Sand (0.063–0.125 mm)')
  assert.equal(classifyWentworthGrainSize(0.2), 'Fine Sand (0.125–0.25 mm)')
  assert.equal(classifyWentworthGrainSize(0.35), 'Medium Sand (0.25–0.5 mm)')
  assert.equal(classifyWentworthGrainSize(0.75), 'Coarse Sand (0.5–1.0 mm)')
  assert.equal(classifyWentworthGrainSize(1.5), 'Very Coarse Sand (1–2 mm)')
  assert.equal(classifyWentworthGrainSize(8.0), 'Gravel / Granule (2–64 mm)')
  assert.equal(classifyWentworthGrainSize(80.0), 'Cobble / Boulder (>64 mm)')
  assert.equal(classifyWentworthGrainSize(null), 'Uncharacterized')

  // Slope Hazard
  assert.equal(classifySlopeHazard(2.5).level, 'gentle')
  assert.equal(classifySlopeHazard(10).level, 'moderate')
  assert.equal(classifySlopeHazard(20).level, 'steep')
  assert.equal(classifySlopeHazard(32).level, 'critical')
  assert.equal(classifySlopeHazard(null).level, 'unknown')

  // Rock Hazard
  assert.equal(classifyRockHazard(4).level, 'low')
  assert.equal(classifyRockHazard(12).level, 'nominal')
  assert.equal(classifyRockHazard(25).level, 'high')
  assert.equal(classifyRockHazard(null).level, 'unknown')
})

test('Milestone D.4: Data-Driven Scientific Interpretation Synthesis', () => {
  const jezero = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  const purpose = MISSION_PURPOSES.find((p) => p.id === 'rover-testing')

  const mockCandidate = {
    id: 'test-salda',
    name: 'Lake Salda',
    country: 'Turkey',
    setting: 'Endorheic alkaline lake',
    summary: 'Lacustrine hydromagnesite stromatolite analog',
    latitude: 37.55,
    longitude: 29.68,
    environment: {
      meanSlopeDeg: 4.5,
      rockAbundancePct: 12.0,
      medianGrainSizeMm: 0.28,
      albedo: 0.22,
      meanSurfaceTempC: 13.0,
      diurnalTempRangeC: 18.0,
      annualPrecipitationMm: 450.0,
      vegetationCoverPct: 2.0,
      lithology: 'clay-sedimentary',
      elevationM: 1193,
      surfacePressurePa: 87500,
      surfaceSolarIrradianceWm2: 215,
    },
  }

  const scored = scoreCandidate(jezero, mockCandidate, purpose)
  const ranked = { rank: 1, ...scored }

  const interpretation = generateScientificInterpretation(jezero, mockCandidate, ranked, purpose)

  // 1. Mobility analysis
  assert.ok(interpretation.mobilityTrafficability.title.includes('Rover Mobility'))
  assert.ok(interpretation.mobilityTrafficability.slopeAssessment.includes('near-identical'))
  assert.ok(interpretation.mobilityTrafficability.rockClearanceAssessment.includes('Rock abundance is closely matched'))
  assert.equal(interpretation.mobilityTrafficability.overallMobilitySuitability, 'Optimal')

  // 2. Thermal & radiative analysis
  assert.ok(interpretation.thermalRadiative.temperatureDeltaAssessment.includes('delta'))
  assert.ok(interpretation.thermalRadiative.diurnalSwingAssessment.includes('Diurnal thermal swings'))

  // 3. Geological fidelity
  assert.equal(interpretation.geologicalComposition.lithologyMatchStatus, 'Exact Lithology Match')
  assert.ok(interpretation.geologicalComposition.petrologyAssessment.includes('Exact lithological match'))

  // 4. Mission suitability verdict
  assert.ok(interpretation.missionSuitabilityVerdict.verdict.includes('high-priority'))
  assert.ok(interpretation.missionSuitabilityVerdict.primaryTestingStrengths.length >= 3)
  assert.ok(interpretation.missionSuitabilityVerdict.criticalTestingLimitations.length >= 2)
  assert.ok(
    interpretation.missionSuitabilityVerdict.criticalTestingLimitations.some((l) =>
      l.includes('Atmospheric pressure disparity')
    ),
    'Must explicitly warn about atmospheric pressure vacuum disparity'
  )
})

test('Milestone D.5: Explorer Page SSR and Integration Health', async () => {
  const res = await fetch(`${BASE_URL}/explore`)
  assert.equal(res.status, 200, '/explore must return HTTP 200')
  const html = await res.text()

  assert.ok(html.includes('Planetary Analog Mission Control'), 'Must include mission control header')
  assert.ok(html.includes('TARGET SENSOR SUITE'), 'Must render Target Sensor Suite')
  assert.ok(html.includes('Flight Deck Reconnaissance') || html.includes('1-to-1 Analog Site Matching'), 'Must render reconnaissance controls')
})
