import test from 'node:test'
import assert from 'node:assert'
import { isValidCoordinate } from '../src/lib/terratwin/geo.ts'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

test('Map Coordinates: isValidCoordinate correctly validates WGS84 bounds', () => {
  // Valid coordinates
  assert.strictEqual(isValidCoordinate(0, 0), true)
  assert.strictEqual(isValidCoordinate(-23.8634, -68.2384), true, 'Atacama valid')
  assert.strictEqual(isValidCoordinate(19.8207, -155.4681), true, 'Mauna Kea valid')
  assert.strictEqual(isValidCoordinate(75.3833, -89.6833), true, 'Haughton valid')
  assert.strictEqual(isValidCoordinate(-77.5, 162.0), true, 'McMurdo valid')
  assert.strictEqual(isValidCoordinate(90, 180), true, 'Poles valid')
  assert.strictEqual(isValidCoordinate(-90, -180), true, 'Poles valid')

  // Invalid coordinates
  assert.strictEqual(isValidCoordinate(null, -68.2), false, 'Null latitude')
  assert.strictEqual(isValidCoordinate(20, undefined), false, 'Undefined longitude')
  assert.strictEqual(isValidCoordinate(NaN, 10), false, 'NaN latitude')
  assert.strictEqual(isValidCoordinate(10, NaN), false, 'NaN longitude')
  assert.strictEqual(isValidCoordinate(91.5, 50), false, 'Out of bounds lat (> 90)')
  assert.strictEqual(isValidCoordinate(-90.1, 50), false, 'Out of bounds lat (< -90)')
  assert.strictEqual(isValidCoordinate(50, 180.5), false, 'Out of bounds lon (> 180)')
  assert.strictEqual(isValidCoordinate(50, -181), false, 'Out of bounds lon (< -180)')
  assert.strictEqual(isValidCoordinate('20', '30'), false, 'Strings rejected')
})

test('Map Data Integration: Verified candidates from API have valid coordinates', async () => {
  const res = await fetch(`${BASE_URL}/api/locations?role=candidate`)
  assert.strictEqual(res.status, 200)
  const json = await res.json()
  assert.strictEqual(json.success, true)
  assert.ok(json.candidates.length >= 4, 'At least 4 candidate sites')

  for (const candidate of json.candidates) {
    assert.strictEqual(
      isValidCoordinate(candidate.latitude, candidate.longitude),
      true,
      `Candidate ${candidate.name} must have valid coordinates, got: (${candidate.latitude}, ${candidate.longitude})`
    )
  }
})

test('Map & Compare API Synchronization: Compare response candidates match map coordinates', async () => {
  const galeCraterId = 'a0000002-0000-4000-8000-000000000002'
  const res = await fetch(`${BASE_URL}/api/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId: galeCraterId, missionProfile: 'rover-testing' }),
  })

  assert.strictEqual(res.status, 200)
  const json = await res.json()
  assert.strictEqual(json.success, true)
  assert.ok(json.rankings.length >= 4)

  for (const ranking of json.rankings) {
    const { candidate } = ranking
    assert.ok(candidate.id, 'Candidate has ID for selection synchronization')
    assert.ok(candidate.name, 'Candidate has name')
    assert.strictEqual(
      isValidCoordinate(candidate.latitude, candidate.longitude),
      true,
      `Candidate ${candidate.name} has valid coordinates for map marker placement`
    )
  }
})
