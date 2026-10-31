import test from 'node:test'
import assert from 'node:assert'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`
  try {
    const res = await fetch(url, options)
    const json = await res.json().catch(() => null)
    return { status: res.status, ok: res.ok, json, headers: res.headers }
  } catch (err) {
    throw new Error(`Failed to connect to ${url}. Is Next.js running on port 3000? Error: ${err.message}`)
  }
}

// -----------------------------------------------------------------------------
// 1. POST /api/portfolio: 2-Site Portfolio Optimization
// -----------------------------------------------------------------------------
test('POST /api/portfolio: Computes 2-site analog suites for Jezero Crater', async () => {
  const payload = {
    targetId: 'mars-jezero-delta',
    missionProfile: 'rover-testing',
    portfolioSize: 2,
    limit: 5,
  }

  const { status, ok, json } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  assert.strictEqual(status, 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`)
  assert.strictEqual(ok, true)
  assert.strictEqual(json.success, true)

  const { result } = json
  assert.ok(result, 'Result object present')
  assert.strictEqual(result.target.id, 'mars-jezero-delta')
  assert.strictEqual(result.portfolioSize, 2)
  assert.strictEqual(result.missionProfile.id, 'rover-testing')
  assert.ok(result.portfolios.length > 0, 'Should return portfolios')
  assert.ok(result.portfolios.length <= 5, 'Should respect limit')

  // Inspect Rank #1 Portfolio
  const topPortfolio = result.portfolios[0]
  assert.strictEqual(topPortfolio.rank, 1)
  assert.strictEqual(topPortfolio.candidates.length, 2)
  assert.notStrictEqual(topPortfolio.candidates[0].id, topPortfolio.candidates[1].id, 'Sites must be distinct')
  assert.ok(typeof topPortfolio.score === 'number' && topPortfolio.score >= 0 && topPortfolio.score <= 100)
  assert.ok(typeof topPortfolio.coverage === 'number' && topPortfolio.coverage >= 0.40)
  assert.strictEqual(topPortfolio.isReliable, true)
  assert.ok(topPortfolio.scientificExplanation.length > 50, 'Explanation generated')

  // Check synergy gain: portfolio score must be >= single best site
  if (topPortfolio.bestSingleScore !== null) {
    assert.ok(
      topPortfolio.score >= topPortfolio.bestSingleScore,
      `Portfolio score (${topPortfolio.score}) should meet or exceed best single site (${topPortfolio.bestSingleScore})`
    )
    assert.ok(typeof topPortfolio.synergyGain === 'number' && topPortfolio.synergyGain >= 0)
  }

  // Check feature attributions
  assert.ok(Array.isArray(topPortfolio.attributions))
  const slopeAttr = topPortfolio.attributions.find((a) => a.featureKey === 'meanSlopeDeg')
  assert.ok(slopeAttr, 'Contains meanSlopeDeg attribution')
  assert.ok(slopeAttr.bestCandidateName !== null, 'Has winning candidate name')
  assert.strictEqual(slopeAttr.status, 'comparable')
})

// -----------------------------------------------------------------------------
// 2. POST /api/portfolio: 3-Site Portfolio Optimization
// -----------------------------------------------------------------------------
test('POST /api/portfolio: Computes 3-site analog suites for Shackleton Crater', async () => {
  const payload = {
    targetId: 'moon-south-polar-highlands',
    missionProfile: 'geological-research',
    portfolioSize: 3,
    limit: 3,
  }

  const { status, ok, json } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  assert.strictEqual(status, 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`)
  assert.strictEqual(ok, true)
  assert.strictEqual(json.success, true)

  const { result } = json
  assert.strictEqual(result.portfolioSize, 3)
  assert.ok(result.portfolios.length > 0)
  assert.strictEqual(result.portfolios[0].candidates.length, 3, 'Portfolio contains 3 sites')
  assert.ok(result.portfolios[0].coverage >= 0.40)
})

// -----------------------------------------------------------------------------
// 3. POST /api/portfolio: Input Validation Rejections (400 Bad Request)
// -----------------------------------------------------------------------------
test('POST /api/portfolio: Rejects missing targetId with 400 Bad Request', async () => {
  const { status, json } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionProfile: 'rover-testing' }),
  })

  assert.strictEqual(status, 400)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'VALIDATION_ERROR')
  assert.ok(json.error.message.includes('targetId'))
})

test('POST /api/portfolio: Rejects invalid portfolioSize with 400 Bad Request', async () => {
  const { status, json } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'mars-jezero-delta',
      missionProfile: 'rover-testing',
      portfolioSize: 8, // invalid: only 2 or 3 allowed
    }),
  })

  assert.strictEqual(status, 400)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'VALIDATION_ERROR')
  assert.ok(json.error.message.includes('portfolioSize'))
})

test('POST /api/portfolio: Rejects invalid limit with 400 Bad Request', async () => {
  const { status, json } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'mars-jezero-delta',
      missionProfile: 'rover-testing',
      limit: 100, // over max 20
    }),
  })

  assert.strictEqual(status, 400)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'VALIDATION_ERROR')
  assert.ok(json.error.message.includes('limit'))
})

// -----------------------------------------------------------------------------
// 4. POST /api/portfolio: Missing Target (404 Not Found)
// -----------------------------------------------------------------------------
test('POST /api/portfolio: Returns 404 when targetId does not exist', async () => {
  const { status, json } = await apiFetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'non-existent-interstellar-comet',
      missionProfile: 'rover-testing',
    }),
  })

  assert.strictEqual(status, 404)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'TARGET_NOT_FOUND')
})

