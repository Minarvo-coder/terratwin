import test from 'node:test'
import assert from 'node:assert'

// Load local environment variables for direct service tests
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env.local')
  } catch {}
}

import {
  executeAnalogComparison,
  NotFoundError,
} from '../src/lib/terratwin/services/compare-service.ts'
import { DatabaseError } from '../src/lib/terratwin/db/planetary-repository.ts'
import { computeAnalogSimilarity } from '../src/lib/terratwin/similarity-engine.ts'
import { ROVER_TESTING_PROFILE } from '../src/lib/terratwin/config/comparison-config.ts'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

// Helper to safely fetch from local dev server
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
// 1. GET /api/locations
// -----------------------------------------------------------------------------
test('GET /api/locations: Returns 200 with verified targets and candidates', async () => {
  const { status, ok, json } = await apiFetch('/api/locations')
  assert.strictEqual(status, 200, 'Expected status 200')
  assert.strictEqual(ok, true)
  assert.strictEqual(json.success, true)
  assert.ok(json.totalCount >= 8, `Expected at least 8 locations, got ${json.totalCount}`)
  assert.ok(json.targetsCount >= 4, `Expected at least 4 targets, got ${json.targetsCount}`)
  assert.ok(json.candidatesCount >= 4, `Expected at least 4 candidates, got ${json.candidatesCount}`)
  assert.strictEqual(json.targets.length, json.targetsCount)
  assert.strictEqual(json.candidates.length, json.candidatesCount)

  // Verify fields do not leak database internal secrets
  for (const loc of [...json.targets, ...json.candidates]) {
    assert.ok(loc.id, 'Location has id')
    assert.ok(loc.name, 'Location has name')
    assert.ok(loc.planetaryBody, 'Location has planetaryBody')
    assert.ok(loc.locationRole, 'Location has locationRole')
    assert.strictEqual(loc.secret, undefined, 'No secret field')
    assert.strictEqual(loc.service_role, undefined, 'No service_role field')
  }
})

test('GET /api/locations: Supports query parameter filtering (?role=target & ?body=Mars)', async () => {
  const targetsRes = await apiFetch('/api/locations?role=target')
  assert.strictEqual(targetsRes.status, 200)
  assert.strictEqual(targetsRes.json.candidatesCount, 0, 'Candidates should be 0 when filtering for role=target')
  assert.ok(targetsRes.json.targetsCount >= 4)

  const marsRes = await apiFetch('/api/locations?body=Mars')
  assert.strictEqual(marsRes.status, 200)
  assert.ok(marsRes.json.targets.every((t) => t.planetaryBody === 'Mars'))

  const invalidRes = await apiFetch('/api/locations?role=invalid-role')
  assert.strictEqual(invalidRes.status, 400, 'Expected 400 Bad Request for invalid role')
  assert.strictEqual(invalidRes.json.error.code, 'INVALID_PARAM')
})

// -----------------------------------------------------------------------------
// 2. GET /api/sources
// -----------------------------------------------------------------------------
test('GET /api/sources: Returns 200 with official NASA/ESA dataset archives', async () => {
  const { status, ok, json } = await apiFetch('/api/sources')
  assert.strictEqual(status, 200)
  assert.strictEqual(ok, true)
  assert.strictEqual(json.success, true)
  assert.ok(json.totalCount >= 8, `Expected at least 8 dataset sources, got ${json.totalCount}`)

  const titles = json.sources.map((s) => s.title)
  assert.ok(titles.some((t) => t.includes('MOLA')), 'Contains MOLA dataset')
  assert.ok(titles.some((t) => t.includes('LOLA')), 'Contains LOLA dataset')
  assert.ok(titles.some((t) => t.includes('POWER')), 'Contains NASA POWER dataset')
  assert.ok(titles.some((t) => t.includes('REMS')), 'Contains Curiosity REMS dataset')
  assert.ok(titles.some((t) => t.includes('MEDA')), 'Contains Perseverance MEDA dataset')

  // Verify no credentials or internal config leaked
  for (const src of json.sources) {
    assert.ok(src.id)
    assert.ok(src.title)
    assert.strictEqual(src.api_key, undefined)
    assert.strictEqual(src.secret, undefined)
  }
})

// -----------------------------------------------------------------------------
// 3. POST /api/compare: Success
// -----------------------------------------------------------------------------
test('POST /api/compare: Successfully ranks Earth candidates against Gale Crater', async () => {
  const galeCraterId = 'a0000002-0000-4000-8000-000000000002'
  const payload = {
    targetId: galeCraterId,
    missionProfile: 'rover-testing',
  }

  const { status, ok, json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  assert.strictEqual(status, 200, `Expected status 200, got ${status}: ${JSON.stringify(json)}`)
  assert.strictEqual(ok, true)
  assert.strictEqual(json.success, true)
  assert.strictEqual(json.target.id, galeCraterId)
  assert.strictEqual(json.target.name, 'Gale Crater (Aeolis Mons)')
  assert.strictEqual(json.missionProfile.id, 'rover-testing')
  assert.ok(json.rankings.length >= 4, 'Ranks all Earth candidates')

  // Check top ranked candidate structure
  const topCandidate = json.rankings[0]
  assert.strictEqual(topCandidate.rank, 1)
  assert.ok(typeof topCandidate.score === 'number' && topCandidate.score >= 0 && topCandidate.score <= 100)
  assert.ok(typeof topCandidate.weightedDistance === 'number' && topCandidate.weightedDistance >= 0 && topCandidate.weightedDistance <= 1)
  assert.ok(typeof topCandidate.coverage === 'number' && topCandidate.coverage >= 0.40)
  assert.strictEqual(topCandidate.isReliable, true)
  assert.ok(Array.isArray(topCandidate.featureScores))

  // Verify feature scores contain provenance and no fabricated values
  const slopeScore = topCandidate.featureScores.find((f) => f.key === 'meanSlopeDeg')
  assert.ok(slopeScore, 'Contains meanSlopeDeg feature')
  assert.ok(slopeScore.targetValue !== null)
  assert.ok(slopeScore.candidateValue !== null)
  assert.strictEqual(slopeScore.targetProvenance.status, 'verified')
})

// -----------------------------------------------------------------------------
// 4. POST /api/compare: Input Validation (400 Bad Request)
// -----------------------------------------------------------------------------
test('POST /api/compare: Rejects missing targetId with 400 Bad Request', async () => {
  const { status, json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionProfile: 'rover-testing' }),
  })

  assert.strictEqual(status, 400)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'VALIDATION_ERROR')
  assert.ok(json.error.message.includes('targetId'))
})

test('POST /api/compare: Rejects unknown mission profile with 400 Bad Request', async () => {
  const { status, json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000002-0000-4000-8000-000000000002',
      missionProfile: 'warp-drive-testing',
    }),
  })

  assert.strictEqual(status, 400)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'VALIDATION_ERROR')
  assert.ok(json.error.message.includes('Unknown mission profile'))
})

test('POST /api/compare: Rejects custom profile with negative weights with 400 Bad Request', async () => {
  const { status, json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000002-0000-4000-8000-000000000002',
      missionProfile: {
        id: 'negative-weights-profile',
        weights: { meanSlopeDeg: -0.25, rockAbundancePct: 1.25 },
      },
    }),
  })

  assert.strictEqual(status, 400)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'VALIDATION_ERROR')
  assert.ok(json.error.message.includes('negative weight'))
})

test('POST /api/compare: Rejects custom profile whose weights do not sum to 1.0 with 400 Bad Request', async () => {
  const { status, json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000002-0000-4000-8000-000000000002',
      missionProfile: {
        id: 'bad-sum-profile',
        weights: { meanSlopeDeg: 0.20, rockAbundancePct: 0.20 }, // sums to 0.40 != 1.0
      },
    }),
  })

  assert.strictEqual(status, 400)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'VALIDATION_ERROR')
  assert.ok(json.error.message.includes('Weights must sum to 1.0'))
})

// -----------------------------------------------------------------------------
// 5. POST /api/compare: Missing Target (404 Not Found)
// -----------------------------------------------------------------------------
test('POST /api/compare: Returns 404 when targetId does not exist in database', async () => {
  const nonExistentTargetId = '00000000-0000-0000-0000-000000000000'
  const { status, json } = await apiFetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: nonExistentTargetId,
      missionProfile: 'rover-testing',
    }),
  })

  assert.strictEqual(status, 404)
  assert.strictEqual(json.success, false)
  assert.strictEqual(json.error.code, 'TARGET_NOT_FOUND')
  assert.ok(json.error.message.includes('was not found in the verified database'))
})

// -----------------------------------------------------------------------------
// 6. Database Failure Handling (No Data Fabrication)
// -----------------------------------------------------------------------------
test('Database Error Handling: DatabaseError yields 503 Service Unavailable without fabricating data', async () => {
  const simulatedDbError = new DatabaseError('Simulated PostgreSQL socket timeout')
  assert.strictEqual(simulatedDbError.status, 503)
  assert.strictEqual(simulatedDbError.name, 'DatabaseError')
  assert.ok(simulatedDbError.message.includes('socket timeout'))

  // Verify service-level error handling: executing with an invalid/unreachable target query does not fabricate fake records
  await assert.rejects(
    async () => {
      await executeAnalogComparison({
        targetId: 'totally-invalid-uuid-format',
        missionProfile: 'rover-testing',
      })
    },
    (err) => {
      assert.ok(err instanceof NotFoundError, 'Expected NotFoundError, never synthetic fabrication')
      return true
    }
  )
})

// -----------------------------------------------------------------------------
// 7. Insufficient Scientific Data Behavior (< 40% coverage)
// -----------------------------------------------------------------------------
test('Scientific Integrity: Candidate with < 40% mission coverage returns isReliable: false and score: null', () => {
  const sparseCandidate = {
    id: 'sparse-arctic-outpost',
    name: 'Sparse Outpost',
    country: 'Canada',
    latitude: 80.0,
    longitude: -90.0,
    setting: 'Arctic permafrost',
    summary: 'Candidate missing 80% of required measurements.',
    environment: {
      meanSurfaceTempC: -25.0, // weight: 0.05
      diurnalTempRangeC: null,
      annualPrecipitationMm: null,
      meanSlopeDeg: null, // missing weight 0.25
      rockAbundancePct: null, // missing weight 0.20
      medianGrainSizeMm: null, // missing weight 0.15
      albedo: null,
      vegetationCoverPct: null,
      lithology: null,
      elevationM: null,
      surfacePressurePa: null,
      surfaceSolarIrradianceWm2: null,
    },
  }

  const marsTarget = {
    id: 'mars-test-target',
    body: 'mars',
    name: 'Mars Crater Target',
    region: 'Elysium',
    summary: 'Test target',
    environment: {
      meanSurfaceTempC: -50.0,
      diurnalTempRangeC: 80.0,
      annualPrecipitationMm: 0,
      meanSlopeDeg: 5.0,
      rockAbundancePct: 15.0,
      medianGrainSizeMm: 0.3,
      albedo: 0.2,
      vegetationCoverPct: 0,
      lithology: 'clay-sedimentary',
      elevationM: -1000,
      surfacePressurePa: 700,
      surfaceSolarIrradianceWm2: 150,
    },
  }

  const result = computeAnalogSimilarity(marsTarget, sparseCandidate, ROVER_TESTING_PROFILE)

  assert.ok(result.coverage < 0.40, `Expected coverage < 0.40, got ${result.coverage}`)
  assert.strictEqual(result.isReliable, false, 'Candidate must not be reliable')
  assert.strictEqual(result.score, null, 'Score must be explicitly null when coverage < 40%')
  assert.ok(result.scoreDisplay.includes('Insufficient data to rank reliably'))
})
