/**
 * Milestone F Verification Suite:
 * Scientific Data Explorer, Provenance Inspector, Coverage Matrix & Export Engine
 */

import test from 'node:test'
import assert from 'node:assert'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

test('Milestone F - Test 1: GET /api/export?format=csv generates valid RFC 4180 CSV matrix', async () => {
  const res = await fetch(`${BASE_URL}/api/export?format=csv`)
  assert.strictEqual(res.status, 200)

  const contentType = res.headers.get('content-type') || ''
  assert.ok(contentType.includes('text/csv'), `Expected text/csv, got ${contentType}`)

  const disposition = res.headers.get('content-disposition') || ''
  assert.ok(disposition.includes('attachment'), 'Missing attachment disposition')
  assert.ok(disposition.includes('.csv'), 'Missing .csv filename in disposition')

  const csvText = await res.text()
  const lines = csvText.split('\r\n').filter((line) => line.trim().length > 0)

  // Header + 13 data rows (5 targets + 8 candidates) = 14 rows
  assert.strictEqual(lines.length, 14, `Expected 14 CSV rows (1 header + 13 locations), got ${lines.length}`)

  const header = lines[0]
  assert.ok(header.includes('Location ID'))
  assert.ok(header.includes('Planetary Body'))
  assert.ok(header.includes('Mean Surface Temp (°C)'))
  assert.ok(header.includes('Surface Pressure (Pa)'))
  assert.ok(header.includes('Solar Irradiance (W/m²)'))
  assert.ok(header.includes('Attributed Instruments & Sources'))

  // Verify Gale Crater line
  const galeLine = lines.find((l) => l.includes('Gale Crater'))
  assert.ok(galeLine, 'Gale Crater row missing from CSV export')
  assert.ok(galeLine.includes('Mars'))
  assert.ok(galeLine.includes('840')) // 840 Pa surface pressure
  assert.ok(galeLine.includes('-893')) // -893 m elevation
  assert.ok(galeLine.includes('MOLA') || galeLine.includes('REMS'))

  // Verify Lake Salda line
  const saldaLine = lines.find((l) => l.includes('Lake Salda'))
  assert.ok(saldaLine, 'Lake Salda row missing from CSV export')
  assert.ok(saldaLine.includes('Earth'))
  assert.ok(saldaLine.includes('Turkey'))
})

test('Milestone F - Test 2: GET /api/export?format=json generates complete scientific catalog schema', async () => {
  const res = await fetch(`${BASE_URL}/api/export?format=json`)
  assert.strictEqual(res.status, 200)

  const json = await res.json()
  assert.strictEqual(json.terratwin_version, '1.0.0')
  assert.ok(json.export_timestamp)

  // Validate sources
  assert.strictEqual(json.official_dataset_sources.length, 10, 'Expected 10 active dataset sources')
  const mola = json.official_dataset_sources.find((s) => s.title.includes('MOLA') || s.title.includes('MEGDR'))
  assert.ok(mola, 'MOLA source missing from JSON catalog')
  assert.ok(mola.sourceUrl.includes('pds-geosciences'))

  // Validate targets & candidates
  assert.strictEqual(json.planetary_targets.length, 5, 'Expected 5 planetary targets')
  assert.strictEqual(json.earth_analog_candidates.length, 8, 'Expected 8 Earth analog candidates')

  // Validate feature definitions & compatibility matrix
  assert.strictEqual(json.physical_feature_definitions.length, 12)
  assert.strictEqual(json.feature_compatibility_matrix.length, 12)

  const pressureComp = json.feature_compatibility_matrix.find((f) => f.key === 'surfacePressurePa')
  assert.strictEqual(pressureComp.classification, 'NOT SCIENTIFICALLY COMPARABLE')
})

test('Milestone F - Test 3: GET /sources page renders full telemetry matrix and dataset archives', async () => {
  const res = await fetch(`${BASE_URL}/sources`)
  assert.strictEqual(res.status, 200)

  const html = await res.text()

  assert.ok(html.includes('SCIENTIFIC DATA PROVENANCE &amp; NASA ARCHIVES') || html.includes('SCIENTIFIC DATA PROVENANCE'))
  assert.ok(html.includes('Coverage Matrix'))
  assert.ok(html.includes('NASA Dataset Archives'))
  assert.ok(html.includes('Harmonization Guide'))
  assert.ok(html.includes('EXPORT CSV MATRIX'))
  assert.ok(html.includes('EXPORT JSON CATALOG'))

  // Check presence of key planetary and analog locations in the table
  assert.ok(html.includes('Jezero Crater Delta'))
  assert.ok(html.includes('Gale Crater (Aeolis Mons)'))
  assert.ok(html.includes('Meridiani Planum'))
  assert.ok(html.includes('Shackleton Crater Rim'))
  assert.ok(html.includes('Mare Tranquillitatis'))
  assert.ok(html.includes('Lake Salda'))
  assert.ok(html.includes('Craters of the Moon'))
  assert.ok(html.includes('Askja Caldera'))
  assert.ok(html.includes('Río Tinto'))
})

test('Milestone F - Test 4: Primary Site Navigation incorporates /sources route', async () => {
  const res = await fetch(`${BASE_URL}`)
  assert.strictEqual(res.status, 200)

  const html = await res.text()
  assert.ok(html.includes('href="/sources"'), 'Navigation header missing href="/sources"')
  assert.ok(html.includes('Data Sources'), 'Navigation header missing "Data Sources" label')
})

test('Milestone F - Test 5: Comparison Panel flight deck provides direct telemetry export actions', async () => {
  const res = await fetch(`${BASE_URL}/explore`)
  assert.strictEqual(res.status, 200)

  const html = await res.text()
  assert.ok(html.includes('/api/export?format=csv'), 'Comparison panel missing quick CSV export link')
  assert.ok(html.includes('/api/export?format=json'), 'Comparison panel missing quick JSON export link')
})

test('Milestone F - Test 6: Scientific Traceability & Attribution Verification', async () => {
  const res = await fetch(`${BASE_URL}/api/export?format=json`)
  const json = await res.json()

  // 1. Meridiani Planum attribution verification
  const meridiani = json.planetary_targets.find((t) => t.name.includes('Meridiani Planum'))
  assert.ok(meridiani, 'Meridiani Planum missing from targets')
  const meridianiSolarProv = meridiani.provenance.surfaceSolarIrradianceWm2
  assert.ok(
    meridianiSolarProv.sourceTitle.includes('Opportunity') || meridianiSolarProv.sourceTitle.includes('Athena'),
    'Meridiani Planum must cite MER Opportunity Athena, not Curiosity REMS'
  )

  // 2. Lunar exosphere pressure verification
  const shackleton = json.planetary_targets.find((t) => t.name.includes('Shackleton'))
  assert.strictEqual(shackleton.environmentalTelemetry.surfacePressurePa, 3e-10)
  assert.strictEqual(shackleton.provenance.surfacePressurePa.isComparable, false)

  // 3. Río Tinto acidic basin verification
  const rioTinto = json.earth_analog_candidates.find((c) => c.name.includes('Río Tinto'))
  assert.ok(rioTinto, 'Río Tinto candidate missing')
  assert.strictEqual(rioTinto.environmentalTelemetry.lithology, 'sulfate-evaporite')
})

