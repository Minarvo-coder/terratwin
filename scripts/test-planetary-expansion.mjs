import test from 'node:test'
import assert from 'node:assert'

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

test('Milestone B - Test 1: GET /api/sources returns MER Opportunity and Apollo/LRO Exosphere sources', async () => {
  const { status, json } = await apiFetch('/api/sources')

  assert.strictEqual(status, 200)
  assert.strictEqual(json.success, true)
  assert.ok(json.totalCount >= 10, `Expected at least 10 sources, got ${json.totalCount}`)

  // Verify MER Opportunity source
  const oppSource = json.sources.find((s) => s.id === '99999999-9999-4999-8999-999999999999')
  assert.ok(oppSource, 'MER Opportunity Athena source must be present in sources list')
  assert.strictEqual(oppSource.title, 'Mars Exploration Rover Opportunity Athena Science Payload')
  assert.ok(oppSource.provider.includes('Cornell') || oppSource.provider.includes('JPL-Caltech'))
  assert.strictEqual(oppSource.datasetVersion, 'MER2-M-ATHENA-4-GSE-V1.0')
  assert.ok(oppSource.sourceUrl.includes('pds-geosciences.wustl.edu'))

  // Verify Apollo CCGE / LRO LAMP exosphere source
  const exosphereSource = json.sources.find((s) => s.id === 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
  assert.ok(exosphereSource, 'Apollo CCGE / LRO LAMP exosphere source must be present in sources list')
  assert.strictEqual(exosphereSource.title, 'Apollo CCGE & LRO LAMP Lunar Exosphere Baseline')
  assert.ok(exosphereSource.provider.includes('Apollo Science Archive') || exosphereSource.provider.includes('NASA GSFC'))
})

test('Milestone B - Test 2: Meridiani Planum attribution fix and authentic telemetry', async () => {
  const { status, json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000003-0000-4000-8000-000000000003', // Meridiani Planum
      missionProfile: 'rover-testing',
    }),
  })

  assert.strictEqual(status, 200)
  assert.strictEqual(json.success, true)
  assert.strictEqual(json.target.name, 'Meridiani Planum')

  const env = json.target.environment
  const provMap = json.target.provenanceMap

  // Attribution test: temperature, pressure, solar, grain size must NOT cite MSL Curiosity REMS
  assert.strictEqual(provMap.meanSurfaceTempC.sourceTitle, 'Mars Exploration Rover Opportunity Athena Science Payload')
  assert.strictEqual(provMap.surfaceSolarIrradianceWm2.sourceTitle, 'Mars Exploration Rover Opportunity Athena Science Payload')
  assert.strictEqual(provMap.surfacePressurePa.sourceTitle, 'Mars Exploration Rover Opportunity Athena Science Payload')
  assert.ok(!provMap.meanSurfaceTempC.sourceTitle.includes('Curiosity'))
  assert.ok(!provMap.meanSurfaceTempC.sourceTitle.includes('REMS'))

  // Telemetry values
  assert.strictEqual(env.surfacePressurePa, 730)
  assert.strictEqual(provMap.surfacePressurePa.status, 'verified')
  assert.strictEqual(provMap.surfacePressurePa.unit, 'Pa')
  assert.strictEqual(provMap.surfacePressurePa.isComparable, false)
  assert.ok(provMap.surfacePressurePa.incomparabilityReason.includes('Martian surface pressure'))

  assert.strictEqual(env.surfaceSolarIrradianceWm2, 168)
  assert.strictEqual(provMap.surfaceSolarIrradianceWm2.isComparable, true)

  // Datum test for elevation
  assert.strictEqual(env.elevationM, -1420)
  assert.ok(provMap.elevationM.qualityNotes.includes('Mars IAU2000 Areoid'))
})

test('Milestone B - Test 3: Gale Crater and alias mars-gale-crater return authentic pressure and solar telemetry', async () => {
  const targetsToTest = ['a0000002-0000-4000-8000-000000000002', 'mars-gale-crater']

  for (const tid of targetsToTest) {
    const { status, json } = await apiFetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetId: tid,
        missionProfile: 'rover-testing',
      }),
    })

    assert.strictEqual(status, 200, `Target ${tid} should return 200`)
    assert.strictEqual(json.success, true)
    assert.ok(json.target.name.includes('Gale Crater'))

    const env = json.target.environment
    const provMap = json.target.provenanceMap

    // Pressure
    assert.strictEqual(env.surfacePressurePa, 840)
    assert.strictEqual(provMap.surfacePressurePa.status, 'verified')
    assert.strictEqual(provMap.surfacePressurePa.isComparable, false)
    assert.ok(provMap.surfacePressurePa.sourceTitle.includes('REMS'))

    // Solar Irradiance
    assert.strictEqual(env.surfaceSolarIrradianceWm2, 148)
    assert.strictEqual(provMap.surfaceSolarIrradianceWm2.isComparable, true)

    // Elevation Datum
    assert.ok(provMap.elevationM.qualityNotes.includes('Mars IAU2000 Areoid'))
  }
})

test('Milestone B - Test 4: Jezero Crater returns authentic pressure and solar flux from MEDA', async () => {
  const { status, json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000001-0000-4000-8000-000000000001',
      missionProfile: 'rover-testing',
    }),
  })

  assert.strictEqual(status, 200)
  assert.strictEqual(json.success, true)
  assert.ok(json.target.name.includes('Jezero'))

  const env = json.target.environment
  const provMap = json.target.provenanceMap

  // Pressure: ~750 Pa
  assert.strictEqual(env.surfacePressurePa, 750)
  assert.strictEqual(provMap.surfacePressurePa.status, 'verified')
  assert.strictEqual(provMap.surfacePressurePa.isComparable, false)
  assert.ok(provMap.surfacePressurePa.sourceTitle.includes('MEDA'))

  // Solar irradiance: 152 W/m2
  assert.strictEqual(env.surfaceSolarIrradianceWm2, 152)
  assert.strictEqual(provMap.surfaceSolarIrradianceWm2.isComparable, true)
  assert.ok(
    provMap.surfaceSolarIrradianceWm2.sourceTitle.includes('MEDA') ||
      provMap.surfaceSolarIrradianceWm2.measurementPeriod?.includes('MEDA'),
    'Jezero solar irradiance should be attributed to MEDA'
  )
})

test('Milestone B - Test 5: Lunar targets (Shackleton & Mare Tranquillitatis) authentic exosphere vacuum', async () => {
  const lunarTargets = [
    { id: 'b0000001-0000-4000-8000-000000000001', name: 'Shackleton', expectedSolar: 110 },
    { id: 'b0000002-0000-4000-8000-000000000002', name: 'Mare Tranquillitatis', expectedSolar: 300 },
  ]

  for (const t of lunarTargets) {
    const { status, json } = await apiFetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetId: t.id,
        missionProfile: 'geological-research',
      }),
    })

    assert.strictEqual(status, 200, `Target ${t.id} should return 200`)
    assert.strictEqual(json.success, true)
    assert.ok(json.target.name.includes(t.name))

    const env = json.target.environment
    const provMap = json.target.provenanceMap

    // Ambient pressure: ultra-high vacuum ~3e-10 Pa
    assert.strictEqual(env.surfacePressurePa, 3e-10)
    assert.strictEqual(provMap.surfacePressurePa.status, 'verified')
    assert.strictEqual(provMap.surfacePressurePa.isComparable, false)
    assert.ok(provMap.surfacePressurePa.sourceTitle.includes('Apollo') || provMap.surfacePressurePa.sourceTitle.includes('Exosphere'))

    // Solar flux
    assert.strictEqual(env.surfaceSolarIrradianceWm2, t.expectedSolar)
    assert.strictEqual(provMap.surfaceSolarIrradianceWm2.isComparable, true)

    // Elevation Datum: Lunar 1,737.4 km reference sphere
    assert.ok(provMap.elevationM.qualityNotes.includes('1,737.4 km reference sphere'))
  }
})

test('Milestone B - Test 6: Invariance check - Non-comparable surface pressure does not distort similarity rankings', async () => {
  const { json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000001-0000-4000-8000-000000000001', // Jezero
      missionProfile: 'rover-testing',
    }),
  })

  // Ensure every ranking score is between 0 and 100
  assert.ok(json.rankings.length > 0)
  for (const r of json.rankings) {
    if (r.score !== null) {
      assert.ok(r.score >= 0 && r.score <= 100, `Score ${r.score} should be between 0 and 100`)
      // Check feature scores: surfacePressurePa and annualPrecipitationMm must have weight 0 or not be in active weighted distance
      const pressureScore = r.featureScores?.find((f) => f.key === 'surfacePressurePa')
      if (pressureScore) {
        assert.strictEqual(pressureScore.weight, 0)
      }
    }
  }
})
