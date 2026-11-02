/**
 * Milestone D Verification Suite:
 * Reproducible Ingestion Pipelines, Planetary Topography Sampling & Scientific Harmonization
 */

import test from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  processPowerClimatology,
  EARTH_ANALOG_REGISTRY,
} from './ingest-nasa-power.mjs'

import {
  sampleMarsTopography,
  sampleMoonTopography,
  calculateHornSlope,
} from './sample-topography.mjs'

import {
  runHarmonizationAudit,
  FEATURE_COMPATIBILITY_MATRIX,
} from './validate-harmonization.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const RAW_EARTH_DIR = path.join(ROOT_DIR, 'raw-data', 'earth')

test('Milestone D - Test 1: NASA POWER Ingestion & Parameter Harmonization', () => {
  // Synthetic authentic NASA POWER mock payload with dual units to test transformation
  const mockPayload = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [29.68, 37.55, 1181.02] },
    properties: {
      parameter: {
        T2M: { ANN: 12.14 },
        T2M_MAX: { ANN: 38.94 },
        T2M_MIN: { ANN: -19.36 },
        PS: { ANN: 88.17 },
        ALLSKY_SFC_SW_DWN: { ANN: 4.9346 },
        PRECTOTCORR: { ANN: 1.89 },
      },
    },
    header: {
      title: 'NASA/POWER Source Native Resolution Climatology',
      api: { version: 'v2.10.1', name: 'POWER Climatology API' },
      range: '25-year Meteorological Climatology (January 2001 - December 2025)',
      fill_value: -999.0,
    },
    parameters: {
      T2M: { units: 'C' },
      PS: { units: 'kPa' },
      ALLSKY_SFC_SW_DWN: { units: 'kW-hr/m^2/day' },
      PRECTOTCORR: { units: 'mm/day' },
    },
  }

  const processed = processPowerClimatology(mockPayload)
  const f = processed.harmonizedFeatures

  // 1. Mean Temperature preserved in °C
  assert.strictEqual(f.meanSurfaceTempC, 12.14)

  // 2. Diurnal / Seasonal Range = 38.94 - (-19.36) = 58.30 °C
  assert.strictEqual(f.diurnalTempRangeC, 58.3)

  // 3. Pressure converted from kPa to Pa (88.17 kPa * 1000 = 88170 Pa)
  assert.strictEqual(f.surfacePressurePa, 88170)

  // 4. Solar irradiance converted from kWh/m2/day to W/m2 (4.9346 * 1000 / 24 ≈ 205.61 W/m2)
  assert.ok(Math.abs(f.surfaceSolarIrradianceWm2 - 205.61) < 0.1)

  // 5. Precipitation converted from mm/day to mm/year (1.89 * 365.25 ≈ 690.3 mm/yr)
  assert.ok(Math.abs(f.annualPrecipitationMm - 690.3) < 0.2)

  // 6. Terrain elevation from geometry
  assert.strictEqual(f.elevationGeoidDatumM, 1181)

  // 7. Provenance recorded
  assert.ok(processed.provenance.sourceTitle.includes('NASA POWER'))
  assert.strictEqual(processed.provenance.originalUnits.PS, 'kPa')
})

test('Milestone D - Test 2: All 8 Earth Analog Cache Files Present & Structurally Valid', () => {
  assert.strictEqual(EARTH_ANALOG_REGISTRY.length, 8)

  for (const site of EARTH_ANALOG_REGISTRY) {
    const cachePath = path.join(RAW_EARTH_DIR, site.cacheFile)
    assert.ok(fs.existsSync(cachePath), `Missing raw cache file for ${site.slug} at ${cachePath}`)

    const content = fs.readFileSync(cachePath, 'utf8')
    const json = JSON.parse(content)

    assert.strictEqual(json.type, 'Feature')
    assert.ok(Array.isArray(json.geometry?.coordinates))
    assert.ok(json.properties?.parameter?.T2M?.ANN !== undefined)
    assert.ok(json.properties?.parameter?.PS?.ANN !== undefined)
  }
})

test('Milestone D - Test 3: Mars MOLA Planetary Binary Raster Sampling', () => {
  // Test Jezero Crater Delta
  const jezero = sampleMarsTopography(18.38, 77.58)
  assert.strictEqual(jezero.planetaryBody, 'Mars')
  assert.strictEqual(jezero.elevationDatumM, -2651)
  assert.ok(jezero.datumName.includes('IAU2000 Areoid'))
  assert.ok(jezero.slopeDeg >= 0 && jezero.slopeDeg <= 5)

  // Test Gale Crater (Aeolis Mons)
  const gale = sampleMarsTopography(-5.36, 137.86)
  assert.strictEqual(gale.elevationDatumM, -893)
  assert.ok(gale.slopeDeg >= 2 && gale.slopeDeg <= 10)

  // Test Meridiani Planum
  const meridiani = sampleMarsTopography(-0.20, 357.50)
  assert.strictEqual(meridiani.elevationDatumM, -1305)
  assert.ok(meridiani.slopeDeg < 1.0) // Extremely flat plains
})

test('Milestone D - Test 4: Moon LOLA Planetary Binary Raster Sampling', () => {
  // Test Mare Tranquillitatis (Apollo 11)
  const mare = sampleMoonTopography(0.67, 23.47)
  assert.strictEqual(mare.planetaryBody, 'Moon')
  assert.strictEqual(mare.elevationDatumM, -1883)
  assert.ok(mare.datumName.includes('1,737.4 km'))
  assert.ok(mare.slopeDeg >= 0 && mare.slopeDeg <= 2.5)

  // Test Shackleton Crater Rim (South Pole)
  const shackleton = sampleMoonTopography(-89.90, 0.00)
  assert.strictEqual(shackleton.elevationDatumM, 102.5)
  assert.ok(shackleton.slopeDeg >= 2.0)
})

test('Milestone D - Test 5: Horn (1981) 3x3 Slope Gradient Differentiation', () => {
  // Flat synthetic grid
  const flatFn = () => 1000
  const flatSlope = calculateHornSlope(flatFn, 100, 100, 0, 3389500)
  assert.strictEqual(flatSlope.slopeDeg, 0)
  assert.strictEqual(flatSlope.localReliefM, 0)

  // Real slope comparison between rugged crater rim vs flat mare plain
  const gale = sampleMarsTopography(-5.36, 137.86)
  const meridiani = sampleMarsTopography(-0.20, 357.50)
  assert.ok(
    gale.slopeDeg > meridiani.slopeDeg,
    `Expected Gale slope (${gale.slopeDeg}°) to exceed Meridiani slope (${meridiani.slopeDeg}°)`
  )

  const shackleton = sampleMoonTopography(-89.90, 0.00)
  const mare = sampleMoonTopography(0.67, 23.47)
  assert.ok(
    shackleton.slopeDeg > mare.slopeDeg,
    `Expected Shackleton rim slope (${shackleton.slopeDeg}°) to exceed Mare slope (${mare.slopeDeg}°)`
  )
})

test('Milestone D - Test 6: Scientific Data Harmonization & Incomparability Enforcement', async () => {
  const audit = await runHarmonizationAudit()

  assert.strictEqual(audit.issues.length, 0, `Harmonization audit found issues: ${JSON.stringify(audit.issues)}`)
  assert.ok(audit.targetsAudited === 5)
  assert.ok(audit.candidatesAudited >= 4)
  assert.ok(audit.passedChecks > 60)
  assert.ok(audit.incomparabilityEnforced >= 8)

  // Verify feature compatibility matrix has all required classifications
  const classifications = new Set(FEATURE_COMPATIBILITY_MATRIX.map((f) => f.classification))
  assert.ok(classifications.has('DIRECTLY COMPARABLE'))
  assert.ok(classifications.has('COMPARABLE AFTER TRANSFORMATION'))
  assert.ok(classifications.has('PROXY-BASED COMPARISON'))
  assert.ok(classifications.has('NOT SCIENTIFICALLY COMPARABLE'))

  const pressureEntry = FEATURE_COMPATIBILITY_MATRIX.find((f) => f.key === 'surfacePressurePa')
  assert.strictEqual(pressureEntry.classification, 'NOT SCIENTIFICALLY COMPARABLE')
})
