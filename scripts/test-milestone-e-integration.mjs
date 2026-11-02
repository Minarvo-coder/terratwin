/**
 * Milestone E Verification Suite:
 * Scientific Similarity Engine Integration, Rich Provenance Badges,
 * Comparability Classifications, and Mission Suite Portfolio Views
 */

import test from 'node:test'
import assert from 'node:assert'
import {
  formatFeatureValue,
  getProvenanceBadgeInfo,
  getFeatureComparabilityInfo,
} from '../src/lib/terratwin/format.ts'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`
  try {
    const res = await fetch(url, options)
    const json = await res.json()
    return { status: res.status, json }
  } catch (err) {
    throw new Error(`Failed to connect to ${url}. Is Next.js running on port 3000? ${err}`)
  }
}

test('Milestone E - Test 1: Rich Scientific Provenance Badge Generation', () => {
  // Test PDS instruments
  const mola = getProvenanceBadgeInfo('Mars Global Surveyor MOLA MEGDR', 'verified')
  assert.strictEqual(mola.label, 'MOLA')
  assert.strictEqual(mola.sublabel, 'PDS')
  assert.strictEqual(mola.variant, 'pds')

  const lola = getProvenanceBadgeInfo('LRO LOLA Gridded Digital Elevation Model LDEM', 'verified')
  assert.strictEqual(lola.label, 'LOLA')
  assert.strictEqual(lola.sublabel, 'PDS')
  assert.strictEqual(lola.variant, 'pds')

  const meda = getProvenanceBadgeInfo('Mars 2020 Perseverance MEDA Environmental Station', 'verified')
  assert.strictEqual(meda.label, 'MEDA')
  assert.strictEqual(meda.sublabel, 'M2020')

  const rems = getProvenanceBadgeInfo('MSL Curiosity REMS Environmental Monitoring Station', 'verified')
  assert.strictEqual(rems.label, 'REMS')
  assert.strictEqual(rems.sublabel, 'MSL')

  const athena = getProvenanceBadgeInfo('Mars Exploration Rover Opportunity Athena APXS / Moessbauer', 'verified')
  assert.strictEqual(athena.label, 'ATHENA')
  assert.strictEqual(athena.sublabel, 'MER')

  const apollo = getProvenanceBadgeInfo('Apollo 17 Lunar Atmospheric Composition Experiment (LACE) Exosphere', 'verified')
  assert.strictEqual(apollo.label, 'APOLLO')
  assert.strictEqual(apollo.sublabel, 'LACE')

  // Test Earthdata & NASA POWER
  const power = getProvenanceBadgeInfo('NASA POWER Climatology Native Resolution (LaRC)', 'verified')
  assert.strictEqual(power.label, 'NASA POWER')
  assert.strictEqual(power.sublabel, 'LaRC')
  assert.strictEqual(power.variant, 'power')

  // Test Field Study & Literature
  const lit = getProvenanceBadgeInfo('Field study & peer-reviewed literature (Salda microbialites)', 'verified')
  assert.strictEqual(lit.label, 'LITERATURE')
  assert.strictEqual(lit.sublabel, 'PEER-REVIEWED')
  assert.strictEqual(lit.variant, 'literature')

  // Test Illustrative Demo
  const demo = getProvenanceBadgeInfo('Local illustrative catalog', 'illustrative')
  assert.strictEqual(demo.label, 'DEMO')
  assert.strictEqual(demo.variant, 'demo')
})

test('Milestone E - Test 2: 4-Tier Scientific Comparability Classifications', () => {
  // 1. Directly Comparable
  const temp = getFeatureComparabilityInfo('meanSurfaceTempC')
  assert.strictEqual(temp.classification, 'DIRECTLY_COMPARABLE')
  assert.strictEqual(temp.badgeVariant, 'emerald')

  const solar = getFeatureComparabilityInfo('surfaceSolarIrradianceWm2')
  assert.strictEqual(solar.classification, 'DIRECTLY_COMPARABLE')

  const rock = getFeatureComparabilityInfo('rockAbundancePct')
  assert.strictEqual(rock.classification, 'DIRECTLY_COMPARABLE')

  // 2. Comparable after Transformation
  const diurnal = getFeatureComparabilityInfo('diurnalTempRangeC')
  assert.strictEqual(diurnal.classification, 'COMPARABLE_AFTER_TRANSFORMATION')
  assert.strictEqual(diurnal.badgeVariant, 'amber')

  const slope = getFeatureComparabilityInfo('meanSlopeDeg')
  assert.strictEqual(slope.classification, 'COMPARABLE_AFTER_TRANSFORMATION')

  // 3. Proxy-Based
  const lith = getFeatureComparabilityInfo('lithology')
  assert.strictEqual(lith.classification, 'PROXY_BASED')
  assert.strictEqual(lith.badgeVariant, 'purple')

  // 4. Not Comparable (Physical Disparity / Distinct Datums)
  const pressure = getFeatureComparabilityInfo('surfacePressurePa')
  assert.strictEqual(pressure.classification, 'NOT_COMPARABLE')
  assert.strictEqual(pressure.badgeVariant, 'rose')
  assert.ok(pressure.rationale.includes('orders of magnitude'))

  const precip = getFeatureComparabilityInfo('annualPrecipitationMm')
  assert.strictEqual(precip.classification, 'NOT_COMPARABLE')
  assert.strictEqual(precip.badgeVariant, 'rose')

  const elev = getFeatureComparabilityInfo('elevationM')
  assert.strictEqual(elev.classification, 'NOT_COMPARABLE')
})

test('Milestone E - Test 3: Precision Formatting for Lunar Vacuum & Extreme Pressures', () => {
  // Lunar exosphere vacuum: 3e-10 Pa MUST format in scientific notation, not "0 Pa"
  const formattedLunarPressure = formatFeatureValue('surfacePressurePa', 3e-10)
  assert.ok(
    formattedLunarPressure.includes('3.0e-10 Pa') || formattedLunarPressure.includes('3.0e-10'),
    `Expected scientific notation for lunar pressure, got: ${formattedLunarPressure}`
  )

  // Mars surface pressure
  const formattedMarsPressure = formatFeatureValue('surfacePressurePa', 840)
  assert.strictEqual(formattedMarsPressure, '840 Pa')

  // Earth surface pressure
  const formattedEarthPressure = formatFeatureValue('surfacePressurePa', 101325)
  assert.strictEqual(formattedEarthPressure, '101,325 Pa')

  // Zero check
  const formattedZero = formatFeatureValue('surfacePressurePa', 0)
  assert.strictEqual(formattedZero, '0 Pa')
})

test('Milestone E - Test 4: Mission Suite Portfolio Optimization with Expanded Candidates', async () => {
  // Test Jezero Crater Portfolio under geological research
  const { status: s1, json: j1 } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000001-0000-4000-8000-000000000001',
      missionProfile: 'geological-research',
      portfolioSize: 2,
    }),
  })

  assert.strictEqual(s1, 200)
  assert.strictEqual(j1.success, true)
  assert.strictEqual(j1.result.totalCombinationsEvaluated, 28) // C(8, 2)
  const topPair = j1.result.portfolios[0]
  assert.ok(topPair.score >= 95.0, `Expected top pair score >= 95%, got ${topPair.score}`)
  assert.ok(
    topPair.candidates.some((c) => c.name.includes('Lake Salda')),
    'Expected Lake Salda in top portfolio for Jezero Crater'
  )

  // Test Meridiani Planum Portfolio
  const { status: s2, json: j2 } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000003-0000-4000-8000-000000000003',
      missionProfile: 'geological-research',
      portfolioSize: 2,
    }),
  })

  assert.strictEqual(s2, 200)
  assert.strictEqual(j2.success, true)
  const topMeridiani = j2.result.portfolios[0]
  assert.ok(
    topMeridiani.candidates.some((c) => c.name.includes('Río Tinto')),
    'Expected Río Tinto in top portfolio for Meridiani Planum'
  )
})

test('Milestone E - Test 5: Full UI Integration & SSR Rendering on /explore', async () => {
  const res = await fetch(`${BASE_URL}/explore`)
  assert.strictEqual(res.status, 200)
  const html = await res.text()

  assert.ok(html.includes('Planetary Analog Mission Control'), 'Contains main heading')
  assert.ok(html.includes('TARGET SENSOR SUITE'), 'Contains target sensor suite')
  assert.ok(html.includes('3D RECON ACTIVE'), 'Contains 3D recon flight deck status')
  assert.ok(html.includes('NASA SPACE APPS'), 'Contains NASA Space Apps branding')
})

test('Milestone E - Test 6: Scientific Incomparability Safeguard in Portfolio Scoring', async () => {
  const { status, json } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000001-0000-4000-8000-000000000001',
      missionProfile: 'geological-research',
      portfolioSize: 2,
    }),
  })

  assert.strictEqual(status, 200)
  const attributions = json.result.portfolios[0].attributions

  // Verify surfacePressurePa is never given active comparable attribution
  const pressureAttr = attributions.find((a) => a.featureKey === 'surfacePressurePa')
  if (pressureAttr) {
    assert.ok(
      pressureAttr.status === 'incompatible_quantities' || pressureAttr.weight === 0,
      'surfacePressurePa must be excluded from portfolio score'
    )
  }
})
