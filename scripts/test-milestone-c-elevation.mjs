/**
 * Phase 4 — Milestone C: Scientific Elevation Profiles & Topographic Relief Test Suite
 *
 * Verifies:
 * 1. MGS MOLA MEGDR and LRO LOLA LDEM geodesic transect sampling across planetary targets.
 * 2. Authentic Copernicus DEM 90m / SRTMGL1 profiles across all 8 Earth candidates.
 * 3. Relative relief transformation (Δz = z - z₀) and datum isolation rules.
 * 4. API endpoint (/api/elevation) functionality with slug and UUID resolution.
 * 5. SSR rendering of the Topographic Relief & Elevation Profile Engine in /explore.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  samplePlanetaryTargetProfile,
  getEarthCandidateProfile,
  compareElevationProfiles,
} from '../src/lib/terratwin/elevation.ts'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

test('Milestone C.1: Planetary Target Elevation Profiles (MOLA & LOLA)', () => {
  // 1. Jezero Crater Delta (Mars MOLA)
  const jezero = samplePlanetaryTargetProfile(
    'a0000001-0000-4000-8000-000000000001',
    'Jezero Crater Delta',
    'mars',
    35
  )
  assert.equal(jezero.planetaryBody, 'Mars')
  assert.ok(jezero.samples.length === 35, 'Must return 35 samples')
  assert.ok(jezero.totalDistanceKm > 30, 'Jezero transect must exceed 30 km')
  assert.ok(jezero.reliefM > 400, 'Jezero crater rim to floor relief must exceed 400 m')
  assert.ok(jezero.datum.includes('IAU2000 Areoid'), 'Must cite IAU2000 Areoid datum')
  assert.equal(jezero.samples[0].relativeElevationM, 0, 'First relative point must be 0 m')
  assert.ok(typeof jezero.meanSlopeDeg === 'number' && jezero.meanSlopeDeg > 0)

  // 2. Shackleton Crater Rim (Moon LOLA)
  const shackleton = samplePlanetaryTargetProfile(
    'b0000001-0000-4000-8000-000000000001',
    'Shackleton Crater Rim',
    'moon',
    30
  )
  assert.equal(shackleton.planetaryBody, 'Moon')
  assert.ok(shackleton.samples.length === 30, 'Must return 30 samples')
  assert.ok(shackleton.reliefM > 500, 'Shackleton rim plunge relief must exceed 500 m')
  assert.ok(shackleton.datum.includes('1,737.4 km'), 'Must cite 1,737.4 km lunar sphere datum')
  assert.equal(shackleton.samples[0].relativeElevationM, 0)
})

test('Milestone C.2: Authentic Copernicus DEM 90m Profiles across all 8 Earth Candidates', () => {
  const candidateIds = [
    'c0000005-0000-4000-8000-000000000005', // Lake Salda
    'c0000006-0000-4000-8000-000000000006', // Craters of the Moon
    'c0000007-0000-4000-8000-000000000007', // Askja / Holuhraun
    'c0000008-0000-4000-8000-000000000008', // Río Tinto
    'c0000001-0000-4000-8000-000000000001', // Atacama
    'c0000004-0000-4000-8000-000000000004', // McMurdo
    'c0000003-0000-4000-8000-000000000003', // Haughton
    'c0000002-0000-4000-8000-000000000002', // Mauna Kea
  ]

  for (const id of candidateIds) {
    const profile = getEarthCandidateProfile(id)
    assert.equal(profile.planetaryBody, 'Earth')
    assert.ok(profile.locationName.length > 3)
    assert.ok(profile.totalDistanceKm > 3, `${profile.locationName} transect distance must be > 3 km`)
    assert.ok(profile.reliefM > 50, `${profile.locationName} relief must exceed 50 m`)
    assert.ok(profile.samples.length >= 25, `${profile.locationName} must have >= 25 samples`)
    assert.ok(profile.datum.includes('EGM96 Geoid'), `${profile.locationName} must cite EGM96 Geoid datum`)
    assert.ok(profile.sourceDataset.includes('Copernicus'), `${profile.locationName} must cite Copernicus DEM`)
    assert.equal(profile.samples[0].relativeElevationM, 0, 'First relative relief sample must be 0')
  }
})

test('Milestone C.3: Profile Comparison Engine & Scientific Datum Isolation', () => {
  const target = samplePlanetaryTargetProfile(
    'a0000002-0000-4000-8000-000000000002',
    'Gale Crater',
    'mars',
    25
  )
  const candidate = getEarthCandidateProfile('c0000006-0000-4000-8000-000000000006') // Craters of the Moon

  const comparison = compareElevationProfiles(target, candidate)
  assert.equal(comparison.success, true)
  assert.equal(comparison.target.locationName, 'Gale Crater')
  assert.equal(comparison.candidate.locationName, 'Great Rift Cinder Cones to Basalt Flow Transect')
  assert.ok(comparison.scientificNotice.datumDisparityExplanation.includes('IAU2000 Areoid'))
  assert.ok(comparison.scientificNotice.datumDisparityExplanation.includes('EGM96 Geoid'))
  assert.ok(comparison.scientificNotice.spatialResolutionDisparity.includes('Resolution Disparity'))
})

test('Milestone C.4: /api/elevation Endpoint (GET & POST) with Alias Resolution', async () => {
  // 1. GET request with slug parameters
  const resGet = await fetch(`${BASE_URL}/api/elevation?targetId=jezero&candidateId=salda&points=25`)
  assert.equal(resGet.status, 200, '/api/elevation GET must return HTTP 200')
  const jsonGet = await resGet.json()
  assert.equal(jsonGet.success, true)
  assert.equal(jsonGet.target.planetaryBody, 'Mars')
  assert.equal(jsonGet.target.samples.length, 25)
  assert.equal(jsonGet.candidate.planetaryBody, 'Earth')
  assert.ok(jsonGet.candidate.reliefM > 100)

  // 2. GET request with Moon target
  const resMoon = await fetch(`${BASE_URL}/api/elevation?targetId=shackleton&candidateId=askja`)
  assert.equal(resMoon.status, 200)
  const jsonMoon = await resMoon.json()
  assert.equal(jsonMoon.target.planetaryBody, 'Moon')
  assert.ok(jsonMoon.target.datum.includes('1,737.4 km'))
  assert.ok(jsonMoon.candidate.datum.includes('EGM96'))

  // 3. POST request with UUID parameters
  const resPost = await fetch(`${BASE_URL}/api/elevation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetId: 'a0000002-0000-4000-8000-000000000002', // Gale
      candidateId: 'c0000008-0000-4000-8000-000000000008', // Rio Tinto
      points: 40,
    }),
  })
  assert.equal(resPost.status, 200, '/api/elevation POST must return HTTP 200')
  const jsonPost = await resPost.json()
  assert.equal(jsonPost.success, true)
  assert.equal(jsonPost.target.samples.length, 40)
})

test('Milestone C.5: UI Route & Elevation Profile Architecture Validation', async () => {
  // 1. SSR /explore page health
  const res = await fetch(`${BASE_URL}/explore`)
  assert.equal(res.status, 200, '/explore route must return HTTP 200')
  const html = await res.text()
  assert.ok(html.includes('Planetary Analog Mission Control'), 'Contains main heading')
  assert.ok(html.includes('TARGET SENSOR SUITE'), 'Contains target sensor suite')

  // 2. Elevation comparison API returns complete model for UI charts
  const elevationRes = await fetch(`${BASE_URL}/api/elevation?targetId=jezero&candidateId=salda&points=35`)
  assert.equal(elevationRes.status, 200)
  const data = await elevationRes.json()
  assert.equal(data.success, true)
  assert.ok(data.target.samples.length === 35, 'Target samples array for Recharts AreaChart')
  assert.ok(data.candidate.samples.length >= 25, 'Candidate samples array for Recharts AreaChart')
  assert.ok(data.scientificNotice.datumDisparityExplanation.length > 20, 'Scientific notice for datum disparity callout')
})
