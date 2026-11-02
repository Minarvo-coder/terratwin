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

test('Milestone C - Test 1: GET /api/locations returns 8 verified Earth analog candidates', async () => {
  const { status, json } = await apiFetch('/api/locations?role=candidate')

  assert.strictEqual(status, 200)
  assert.strictEqual(json.success, true)
  assert.strictEqual(json.candidatesCount, 8, `Expected exactly 8 candidates, got ${json.candidatesCount}`)
  assert.strictEqual(json.candidates.length, 8)

  const requiredIds = [
    'c0000001-0000-4000-8000-000000000001', // Atacama
    'c0000002-0000-4000-8000-000000000002', // Mauna Kea
    'c0000003-0000-4000-8000-000000000003', // Haughton
    'c0000004-0000-4000-8000-000000000004', // McMurdo
    'c0000005-0000-4000-8000-000000000005', // Lake Salda
    'c0000006-0000-4000-8000-000000000006', // Craters of the Moon
    'c0000007-0000-4000-8000-000000000007', // Askja / Holuhraun
    'c0000008-0000-4000-8000-000000000008', // Río Tinto
  ]

  for (const id of requiredIds) {
    const found = json.candidates.find((c) => c.id === id)
    assert.ok(found, `Candidate location ${id} must be present in /api/locations response`)
    assert.strictEqual(found.planetaryBody, 'Earth')
    assert.strictEqual(found.locationRole, 'candidate')
    assert.ok(typeof found.latitude === 'number' && found.latitude >= -90 && found.latitude <= 90)
    assert.ok(typeof found.longitude === 'number' && found.longitude >= -180 && found.longitude <= 180)
  }
})

test('Milestone C - Test 2: Lake Salda (c0000005) authentic telemetry and Jezero analogy', async () => {
  const { json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000001-0000-4000-8000-000000000001', // Jezero Crater Delta
      missionProfile: 'geological-research',
    }),
  })

  assert.strictEqual(json.totalCandidatesEvaluated, 8)
  const salda = json.rankings.find((r) => r.candidate.id === 'c0000005-0000-4000-8000-000000000005')
  assert.ok(salda, 'Lake Salda must be evaluated in rankings')
  assert.strictEqual(salda.candidate.name, 'Lake Salda (Stromatalites & Hydromagnesite)')
  assert.strictEqual(salda.candidate.country, 'Turkey')

  const env = salda.candidate.environment
  assert.strictEqual(env.lithology, 'clay-sedimentary', 'Lake Salda carbonate microbialite sedimentary lithology')
  assert.strictEqual(env.meanSurfaceTempC, 12.5)
  assert.strictEqual(env.elevationM, 1193)
  assert.strictEqual(env.albedo, 0.28)
  assert.strictEqual(env.annualPrecipitationMm, 435)
  assert.strictEqual(env.surfacePressurePa, 88200)

  // Lake Salda should achieve high similarity for Jezero Crater delta
  assert.ok(salda.score >= 70, `Expected score >= 70 for Lake Salda on Jezero, got ${salda.score}`)
})

test('Milestone C - Test 3: Craters of the Moon (c0000006) basaltic terrain and lunar analogy', async () => {
  const { json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'b0000002-0000-4000-8000-000000000002', // Mare Tranquillitatis
      missionProfile: 'rover-testing',
    }),
  })

  const crmo = json.rankings.find((r) => r.candidate.id === 'c0000006-0000-4000-8000-000000000006')
  assert.ok(crmo, 'Craters of the Moon must be evaluated in rankings')
  assert.strictEqual(crmo.candidate.name, 'Craters of the Moon National Monument')
  assert.strictEqual(crmo.candidate.country, 'United States (Idaho)')

  const env = crmo.candidate.environment
  assert.strictEqual(env.lithology, 'basaltic', 'Craters of the Moon olivine tholeiite basalt')
  assert.strictEqual(env.meanSurfaceTempC, 6.2)
  assert.strictEqual(env.rockAbundancePct, 42)
  assert.strictEqual(env.albedo, 0.09)
  assert.strictEqual(env.elevationM, 1805)
  assert.strictEqual(env.surfacePressurePa, 82100)
})

test('Milestone C - Test 4: Askja Caldera & Holuhraun (c0000007) zero vegetation and subarctic basaltic plain', async () => {
  const { json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'b0000002-0000-4000-8000-000000000002',
      missionProfile: 'rover-testing',
    }),
  })

  const askja = json.rankings.find((r) => r.candidate.id === 'c0000007-0000-4000-8000-000000000007')
  assert.ok(askja, 'Askja / Holuhraun must be evaluated in rankings')
  assert.strictEqual(askja.candidate.name, 'Askja Caldera & Holuhraun Lava Field')
  assert.strictEqual(askja.candidate.country, 'Iceland')

  const env = askja.candidate.environment
  assert.strictEqual(env.lithology, 'basaltic')
  assert.strictEqual(env.meanSurfaceTempC, -1.2)
  assert.strictEqual(env.vegetationCoverPct, 0, 'Zero vegetation cover in Icelandic volcanic highland desert')
  assert.strictEqual(env.rockAbundancePct, 38)
  assert.strictEqual(env.albedo, 0.08)
  assert.strictEqual(env.elevationM, 1100)
})

test('Milestone C - Test 5: Río Tinto (c0000008) ranks #1 for Meridiani Planum under geological research', async () => {
  const { json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000003-0000-4000-8000-000000000003', // Meridiani Planum
      missionProfile: 'geological-research',
    }),
  })

  assert.strictEqual(json.totalCandidatesEvaluated, 8)
  const topCandidate = json.rankings[0]
  assert.strictEqual(topCandidate.candidate.id, 'c0000008-0000-4000-8000-000000000008', 'Río Tinto must rank #1 for Meridiani Planum')
  assert.strictEqual(topCandidate.candidate.name, 'Río Tinto Acidic Basin')
  assert.strictEqual(topCandidate.candidate.country, 'Spain (Andalucía)')
  assert.strictEqual(topCandidate.candidate.environment.lithology, 'sulfate-evaporite')
  assert.ok(topCandidate.score >= 78.0, `Expected score >= 78.0 for Río Tinto, got ${topCandidate.score}`)
})

test('Milestone C - Test 6: Mission Suite portfolio optimizer combinatorial expansion (C(8,2)=28, C(8,3)=56)', async () => {
  // Test 2-site combinations
  const { json: j2 } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000001-0000-4000-8000-000000000001', // Jezero
      missionProfile: 'rover-testing',
      portfolioSize: 2,
    }),
  })

  assert.strictEqual(j2.result.totalCandidatesEvaluated, 8)
  assert.strictEqual(j2.result.totalCombinationsEvaluated, 28, 'C(8, 2) = 28 combinations')
  assert.ok(j2.result.portfolios.length > 0)
  assert.ok(j2.result.portfolios[0].score >= (j2.result.portfolios[0].bestSingleScore ?? 0))

  // Test 3-site combinations
  const { json: j3 } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000001-0000-4000-8000-000000000001',
      missionProfile: 'geological-research',
      portfolioSize: 3,
    }),
  })

  assert.strictEqual(j3.result.totalCandidatesEvaluated, 8)
  assert.strictEqual(j3.result.totalCombinationsEvaluated, 56, 'C(8, 3) = 56 combinations')
  assert.ok(j3.result.portfolios[0].score >= 90.0, 'Top 3-site portfolio achieves high synergy score (> 90%)')
  assert.ok(j3.result.portfolios[0].synergyGain > 0, 'Portfolio synergy gain is strictly positive')
})
