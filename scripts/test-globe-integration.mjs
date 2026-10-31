import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

import {
  latLonToVector3,
  resolveTargetCoordinates,
  PLANETARY_SPECS,
} from '../src/lib/terratwin/planet-math.ts'

test('Spherical Trigonometry: latLonToVector3 correctly maps coordinates to 3D Cartesian vectors', () => {
  const R = 2.0

  // 1. North Pole
  const [nx, ny, nz] = latLonToVector3(90, 0, R)
  assert.ok(Math.abs(nx) < 1e-6, `Expected nx ~ 0, got ${nx}`)
  assert.ok(Math.abs(ny - R) < 1e-6, `Expected ny = ${R}, got ${ny}`)
  assert.ok(Math.abs(nz) < 1e-6, `Expected nz ~ 0, got ${nz}`)

  // 2. South Pole
  const [sx, sy, sz] = latLonToVector3(-90, 0, R)
  assert.ok(Math.abs(sx) < 1e-6, `Expected sx ~ 0, got ${sx}`)
  assert.ok(Math.abs(sy - (-R)) < 1e-6, `Expected sy = ${-R}, got ${sy}`)
  assert.ok(Math.abs(sz) < 1e-6, `Expected sz ~ 0, got ${sz}`)

  // 3. Equator at Prime Meridian
  const [ex, ey, ez] = latLonToVector3(0, 0, R)
  assert.ok(Math.abs(ex - R) < 1e-6, `Expected ex = ${R}, got ${ex}`)
  assert.ok(Math.abs(ey) < 1e-6, `Expected ey ~ 0, got ${ey}`)
  assert.ok(Math.abs(ez) < 1e-6, `Expected ez ~ 0, got ${ez}`)

  // 4. Vector Magnitude always equals radius R
  const coords = [
    [18.38, 77.58],   // Jezero
    [-5.36, 137.86],  // Gale
    [-1.94, -5.53],   // Meridiani
    [0.67, 23.47],    // Tranquillitatis
    [-89.9, 0.0],     // Shackleton
  ]

  for (const [lat, lon] of coords) {
    const [x, y, z] = latLonToVector3(lat, lon, R)
    const magnitude = Math.sqrt(x * x + y * y + z * z)
    assert.ok(Math.abs(magnitude - R) < 1e-5, `Expected magnitude ${R}, got ${magnitude}`)
  }
})

test('Target Coordinates Resolver: Correctly identifies known scientific coordinates', () => {
  // Mars Jezero
  const jezero = resolveTargetCoordinates({
    id: 'mars-jezero-delta',
    body: 'mars',
    name: 'Jezero Crater Delta',
    region: 'Isidis Planitia',
    summary: 'Deltaic fan',
    environment: {},
  })
  assert.strictEqual(jezero.latitude, 18.38)
  assert.strictEqual(jezero.longitude, 77.58)

  // Mars Gale
  const gale = resolveTargetCoordinates({
    id: 'mars-gale-crater',
    body: 'mars',
    name: 'Gale Crater (Aeolis Mons)',
    region: 'Elysium Quadrangle',
    summary: 'Sedimentary mound',
    environment: {},
  })
  assert.strictEqual(gale.latitude, -5.36)
  assert.strictEqual(gale.longitude, 137.86)

  // Moon South Pole
  const shackleton = resolveTargetCoordinates({
    id: 'moon-south-polar-highlands',
    body: 'moon',
    name: 'South Polar Highlands',
    region: 'Shackleton Crater',
    summary: 'Cryogenic PSRs',
    environment: {},
  })
  assert.strictEqual(shackleton.latitude, -89.9)
  assert.strictEqual(shackleton.longitude, 0.0)
})

test('Texture Assets: Authentic NASA planetary texture maps exist and have non-trivial size', () => {
  const marsPath = path.join(process.cwd(), 'public', 'textures', 'planets', 'mars.jpg')
  const moonPath = path.join(process.cwd(), 'public', 'textures', 'planets', 'moon.jpg')

  assert.ok(fs.existsSync(marsPath), 'Mars texture file must exist at public/textures/planets/mars.jpg')
  assert.ok(fs.existsSync(moonPath), 'Moon texture file must exist at public/textures/planets/moon.jpg')

  const marsStats = fs.statSync(marsPath)
  const moonStats = fs.statSync(moonPath)

  assert.ok(marsStats.size > 500000, `Mars texture should be > 500 KB, got ${marsStats.size} bytes`)
  assert.ok(moonStats.size > 500000, `Moon texture should be > 500 KB, got ${moonStats.size} bytes`)
})

test('Moon Target Positioning & Polar Targeting: Shackleton South Pole orientation', () => {
  const R = 1.6
  // Shackleton is located at South Pole (-89.9°, 0.0°)
  const [sx, sy, sz] = latLonToVector3(-89.9, 0.0, R)
  // Near the south pole, sy must be very close to -R (-1.6), and x, z near 0
  assert.ok(sy < -1.59, `Expected sy near -1.6, got ${sy}`)
  assert.ok(Math.abs(sx) < 0.01, `Expected sx near 0, got ${sx}`)
  assert.ok(Math.abs(sz) < 0.01, `Expected sz near 0, got ${sz}`)

  // Mare Tranquillitatis is near the equator (+0.67°, +23.47°)
  const [tx, ty, tz] = latLonToVector3(0.67, 23.47, R)
  // Near equator, ty is near 0
  assert.ok(Math.abs(ty) < 0.05, `Expected ty near 0 for equator, got ${ty}`)
  const mag = Math.sqrt(tx * tx + ty * ty + tz * tz)
  assert.ok(Math.abs(mag - R) < 1e-5, `Expected mag = ${R}`)

  // Verify Tranquillitatis target resolver
  const tranquillitatis = resolveTargetCoordinates({
    id: 'moon-mare-tranquillitatis',
    body: 'moon',
    name: 'Mare Tranquillitatis',
    region: 'Equatorial',
    summary: 'Apollo 11 basaltic plains',
    environment: {},
  })
  assert.strictEqual(tranquillitatis.latitude, 0.67)
  assert.strictEqual(tranquillitatis.longitude, 23.47)
})

test('Planetary Physical Telemetry: Contains rigorous physical constants for Moon and Mars', () => {
  const mars = PLANETARY_SPECS.mars
  assert.strictEqual(mars.body, 'mars')
  assert.strictEqual(mars.radiusKm, 3389.5)
  assert.ok(mars.surfaceGravity.includes('3.72'))
  assert.strictEqual(mars.axialTiltDeg, 25.19)
  assert.ok(mars.atmosphereColor, 'Mars must have atmospheric haze color defined')

  const moon = PLANETARY_SPECS.moon
  assert.strictEqual(moon.body, 'moon')
  assert.strictEqual(moon.radiusKm, 1737.4)
  assert.ok(moon.surfaceGravity.includes('1.62'))
  assert.strictEqual(moon.axialTiltDeg, 1.54)
  assert.strictEqual(moon.atmosphereColor, undefined, 'Moon must have no atmospheric haze for scientific honesty')
})
