import test from 'node:test'
import assert from 'node:assert'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function postPortfolio(body) {
  const res = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  return { status: res.status, json }
}

test('E2E Flow 1: Mars Jezero Delta with Rover Testing (Pairs and Trios)', async () => {
  // 1. Dual-Site Suite
  const { status: s2, json: j2 } = await postPortfolio({
    targetId: 'a0000001-0000-4000-8000-000000000001', // Jezero Crater Delta
    missionProfile: 'rover-testing',
    portfolioSize: 2,
    limit: 6,
  })

  assert.strictEqual(s2, 200)
  assert.strictEqual(j2.success, true)
  assert.strictEqual(j2.result.target.name, 'Jezero Crater Delta')
  assert.strictEqual(j2.result.portfolioSize, 2)
  assert.ok(j2.result.portfolios.length > 0)

  const topPair = j2.result.portfolios[0]
  assert.strictEqual(topPair.rank, 1)
  assert.strictEqual(topPair.candidates.length, 2)
  assert.ok(topPair.score >= (topPair.bestSingleScore ?? 0))
  assert.ok(topPair.coverage >= 0.40)
  assert.ok(topPair.attributions.some((a) => a.bestCandidateId !== null))
  assert.ok(topPair.scientificExplanation.includes('Mission Suite'))

  // 2. Triple-Site Suite
  const { status: s3, json: j3 } = await postPortfolio({
    targetId: 'a0000001-0000-4000-8000-000000000001',
    missionProfile: 'rover-testing',
    portfolioSize: 3,
    limit: 6,
  })

  assert.strictEqual(s3, 200)
  assert.strictEqual(j3.success, true)
  assert.strictEqual(j3.result.portfolioSize, 3)
  assert.strictEqual(j3.result.portfolios[0].candidates.length, 3)
})

test('E2E Flow 2: Moon Shackleton Crater Rim with Geological Research', async () => {
  const { status, json } = await postPortfolio({
    targetId: 'b0000001-0000-4000-8000-000000000001', // Shackleton Crater Rim
    missionProfile: 'geological-research',
    portfolioSize: 2,
  })

  assert.strictEqual(status, 200)
  assert.strictEqual(json.success, true)
  assert.strictEqual(json.result.target.name, 'Shackleton Crater Rim')
  assert.ok(json.result.portfolios.length > 0)

  const top = json.result.portfolios[0]
  assert.strictEqual(top.rank, 1)
  assert.ok(top.attributions.find((a) => a.featureKey === 'lithology'))
})

test('E2E Flow 3: Mars Meridiani Planum with Rover Testing', async () => {
  const { status, json } = await postPortfolio({
    targetId: 'a0000003-0000-4000-8000-000000000003', // Meridiani Planum
    missionProfile: 'rover-testing',
    portfolioSize: 2,
  })

  assert.strictEqual(status, 200)
  assert.strictEqual(json.success, true)
  assert.strictEqual(json.result.target.name, 'Meridiani Planum')
})

test('E2E Flow 4: Moon Mare Tranquillitatis with Rover Testing', async () => {
  const { status, json } = await postPortfolio({
    targetId: 'b0000002-0000-4000-8000-000000000002', // Mare Tranquillitatis Apollo 11
    missionProfile: 'rover-testing',
    portfolioSize: 2,
  })

  assert.strictEqual(status, 200)
  assert.strictEqual(json.success, true)
  assert.strictEqual(json.result.target.name, 'Mare Tranquillitatis (Apollo 11)')
})

test('E2E Flow 5: Slug Aliases Compatibility', async () => {
  const aliases = [
    'mars-jezero-delta',
    'mars-meridiani-planum',
    'moon-south-polar-highlands',
    'moon-mare-tranquillitatis',
  ]

  for (const slug of aliases) {
    const { status, json } = await postPortfolio({
      targetId: slug,
      missionProfile: 'rover-testing',
      portfolioSize: 2,
    })

    assert.strictEqual(status, 200, `Expected 200 for slug ${slug}`)
    assert.strictEqual(json.success, true)
    assert.ok(json.result.portfolios.length > 0)
  }
})

