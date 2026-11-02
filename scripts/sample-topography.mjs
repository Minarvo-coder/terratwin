/**
 * Reproducible Raster Sampling Tool for Planetary Digital Elevation Models
 * 
 * Supports:
 * - Mars Global Surveyor (MGS) MOLA MEGDR (4 pix/deg, 16-bit signed BE, IAU2000 Areoid)
 * - Lunar Reconnaissance Orbiter (LRO) LOLA LDEM (4 pix/deg, 16-bit signed LE, 0.5m scale, 1737.4 km sphere)
 * 
 * Implements Horn (1981) 3x3 finite-difference gradient estimation to derive
 * authentic regional terrain slope (degrees) and local relief metrics.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const MOLA_PATH = path.join(ROOT_DIR, 'raw-data', 'mars', 'megt90n000cb.img')
const LOLA_PATH = path.join(ROOT_DIR, 'raw-data', 'moon', 'ldem_4.img')

// Physical Planetary Radii (m)
export const MARS_EQUATORIAL_RADIUS_M = 3396190
export const MARS_POLAR_RADIUS_M = 3376200
export const MARS_VOLUMETRIC_MEAN_RADIUS_M = 3389500
export const MOON_MEAN_RADIUS_M = 1737400

export const TOPOGRAPHY_SOURCES = {
  mars_mola: {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Mars Global Surveyor MOLA Mission Experiment Gridded Data Record (MEGDR)',
    provider: 'NASA Goddard Space Flight Center / PDS Geosciences Node',
    source_url: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megt90n000cb.img',
    datum: 'Mars IAU2000 Areoid (GMM3)',
    resolution: '4 pixels/degree (~14.8 km/pixel at equator)',
  },
  moon_lola: {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Lunar Reconnaissance Orbiter LOLA Gridded Digital Elevation Model (LDEM_4)',
    provider: 'NASA Goddard Space Flight Center / PDS Geosciences Node',
    source_url: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_4.img',
    datum: 'Lunar Reference Sphere (R = 1,737.4 km)',
    resolution: '4 pixels/degree (~7.58 km/pixel at equator)',
  },
}

export const KNOWN_PLANETARY_TARGETS = [
  {
    id: 'a0000001-0000-4000-8000-000000000001',
    body: 'Mars',
    slug: 'jezero',
    name: 'Jezero Crater Delta',
    latitude: 18.38,
    longitude: 77.58,
  },
  {
    id: 'a0000002-0000-4000-8000-000000000002',
    body: 'Mars',
    slug: 'gale',
    name: 'Gale Crater (Aeolis Mons)',
    latitude: -5.36,
    longitude: 137.86,
  },
  {
    id: 'a0000003-0000-4000-8000-000000000003',
    body: 'Mars',
    slug: 'meridiani',
    name: 'Meridiani Planum',
    latitude: -0.20,
    longitude: 357.50, // 2.5°W = 357.5°E
  },
  {
    id: 'b0000001-0000-4000-8000-000000000001',
    body: 'Moon',
    slug: 'shackleton',
    name: 'Shackleton Crater Rim',
    latitude: -89.90,
    longitude: 0.00,
  },
  {
    id: 'b0000002-0000-4000-8000-000000000002',
    body: 'Moon',
    slug: 'tranquillitatis',
    name: 'Mare Tranquillitatis (Apollo 11)',
    latitude: 0.67,
    longitude: 23.47,
  },
]

// Buffer cache to prevent redundant disk I/O
let cachedMarsBuffer = null
let cachedMoonBuffer = null

export function getMarsBuffer() {
  if (!cachedMarsBuffer) {
    if (!fs.existsSync(MOLA_PATH)) {
      throw new Error(`Mars MOLA raster not found at ${MOLA_PATH}`)
    }
    cachedMarsBuffer = fs.readFileSync(MOLA_PATH)
  }
  return cachedMarsBuffer
}

export function getMoonBuffer() {
  if (!cachedMoonBuffer) {
    if (!fs.existsSync(LOLA_PATH)) {
      throw new Error(`Moon LOLA raster not found at ${LOLA_PATH}`)
    }
    cachedMoonBuffer = fs.readFileSync(LOLA_PATH)
  }
  return cachedMoonBuffer
}

/**
 * Coordinate indexing for 720x1440 cylindrical equirectangular raster (4 pix/deg)
 * Row 0 = +90° (North pole), Row 719 = -90° (South pole)
 * Col 0 = 0° East, Col 1439 = ~359.75° East
 */
export function getRasterIndices(lat, lonEast) {
  const normLon = ((lonEast % 360) + 360) % 360
  const row = Math.min(719, Math.max(0, Math.floor((90 - lat) * 4)))
  const col = Math.min(1439, Math.max(0, Math.floor(normLon * 4)))
  return { row, col }
}

/**
 * Direct cell lookup for MOLA MEGDR raster
 */
export function readMarsPixel(buffer, row, col) {
  const r = Math.min(719, Math.max(0, row))
  const c = ((col % 1440) + 1440) % 1440
  const offset = (r * 1440 + c) * 2
  return buffer.readInt16BE(offset)
}

/**
 * Direct cell lookup for LOLA LDEM raster (scaled by 0.5m)
 */
export function readMoonPixel(buffer, row, col) {
  const r = Math.min(719, Math.max(0, row))
  const c = ((col % 1440) + 1440) % 1440
  const offset = (r * 1440 + c) * 2
  const dn = buffer.readInt16LE(offset)
  return dn * 0.5
}

/**
 * Calculate Horn (1981) 3x3 finite-difference slope in degrees
 * accounting for planetary curvature and latitude cell convergence
 */
export function calculateHornSlope(getElevationFn, row, col, lat, radiusM) {
  const rad = Math.PI / 180
  const cellRad = 0.25 * rad // 0.25 deg grid cell in radians

  const dy = radiusM * cellRad // North-South metric distance between grid points
  // Clamped cosine to prevent polar singularity division by zero at extreme high latitudes
  const cosLat = Math.max(0.015, Math.cos(lat * rad))
  const dx = radiusM * cellRad * cosLat // East-West metric distance between grid points

  // Sample 3x3 elevation kernel
  const nw = getElevationFn(row - 1, col - 1)
  const n  = getElevationFn(row - 1, col)
  const ne = getElevationFn(row - 1, col + 1)
  const w  = getElevationFn(row, col - 1)
  const e  = getElevationFn(row, col + 1)
  const sw = getElevationFn(row + 1, col - 1)
  const s  = getElevationFn(row + 1, col)
  const se = getElevationFn(row + 1, col + 1)

  // Horn (1981) weighted gradient estimators
  const dzdx = ((ne + 2 * e + se) - (nw + 2 * w + sw)) / (8 * dx)
  const dzdy = ((nw + 2 * n + ne) - (sw + 2 * s + se)) / (8 * dy)

  const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy))
  const slopeDeg = slopeRad * (180 / Math.PI)

  // Local Relief and standard deviation in 3x3 window
  const windowValues = [nw, n, ne, w, getElevationFn(row, col), e, sw, s, se]
  const minVal = Math.min(...windowValues)
  const maxVal = Math.max(...windowValues)
  const localReliefM = maxVal - minVal

  const mean = windowValues.reduce((acc, v) => acc + v, 0) / 9
  const variance = windowValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / 9
  const elevationStdDevM = Math.sqrt(variance)

  return {
    slopeDeg: Math.round(slopeDeg * 100) / 100,
    dzdx: Math.round(dzdx * 10000) / 10000,
    dzdy: Math.round(dzdy * 10000) / 10000,
    localReliefM: Math.round(localReliefM * 10) / 10,
    elevationStdDevM: Math.round(elevationStdDevM * 10) / 10,
  }
}

/**
 * Sample elevation, slope, and topographic metrics on Mars
 */
export function sampleMarsTopography(lat, lonEast) {
  const buffer = getMarsBuffer()
  const { row, col } = getRasterIndices(lat, lonEast)
  const elevationM = readMarsPixel(buffer, row, col)

  const slopeMetrics = calculateHornSlope(
    (r, c) => readMarsPixel(buffer, r, c),
    row,
    col,
    lat,
    MARS_VOLUMETRIC_MEAN_RADIUS_M
  )

  return {
    planetaryBody: 'Mars',
    targetCoordinates: { latitude: lat, longitudeEast: lonEast },
    rasterIndices: { row, col },
    elevationDatumM: elevationM,
    datumName: TOPOGRAPHY_SOURCES.mars_mola.datum,
    sourceId: TOPOGRAPHY_SOURCES.mars_mola.id,
    sourceTitle: TOPOGRAPHY_SOURCES.mars_mola.title,
    ...slopeMetrics,
  }
}

/**
 * Sample elevation, slope, and topographic metrics on the Moon
 */
export function sampleMoonTopography(lat, lonEast) {
  const buffer = getMoonBuffer()
  const { row, col } = getRasterIndices(lat, lonEast)
  const elevationM = readMoonPixel(buffer, row, col)

  const slopeMetrics = calculateHornSlope(
    (r, c) => readMoonPixel(buffer, r, c),
    row,
    col,
    lat,
    MOON_MEAN_RADIUS_M
  )

  return {
    planetaryBody: 'Moon',
    targetCoordinates: { latitude: lat, longitudeEast: lonEast },
    rasterIndices: { row, col },
    elevationDatumM: elevationM,
    datumName: TOPOGRAPHY_SOURCES.moon_lola.datum,
    sourceId: TOPOGRAPHY_SOURCES.moon_lola.id,
    sourceTitle: TOPOGRAPHY_SOURCES.moon_lola.title,
    ...slopeMetrics,
  }
}

/**
 * Universal dispatcher for planetary topography sampling
 */
export function sampleTopography(body, lat, lonEast) {
  const normalizedBody = body.toLowerCase()
  if (normalizedBody === 'mars') {
    return sampleMarsTopography(lat, lonEast)
  }
  if (normalizedBody === 'moon' || normalizedBody === 'luna') {
    return sampleMoonTopography(lat, lonEast)
  }
  throw new Error(`Unsupported planetary body for raster sampling: ${body}. Only 'Mars' and 'Moon' have local DEM rasters.`)
}

// CLI Execution Entry Point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('--- REPRODUCIBLE PLANETARY TOPOGRAPHY SAMPLER ---')
  console.log('Instruments: NASA MGS MOLA MEGDR & LRO LOLA LDEM (4 pix/deg)\n')

  for (const target of KNOWN_PLANETARY_TARGETS) {
    const res = sampleTopography(target.body, target.latitude, target.longitude)
    console.log(`📍 [${target.body.toUpperCase()}] ${target.name} (${target.latitude}°, ${target.longitude}°E):`)
    console.log(`   Elevation: ${res.elevationDatumM} m (Datum: ${res.datumName})`)
    console.log(`   Horn Slope: ${res.slopeDeg}°`)
    console.log(`   Local Relief (3x3): ${res.localReliefM} m | Elevation StdDev: ${res.elevationStdDevM} m`)
    console.log(`   Raster Grid: row ${res.rasterIndices.row}, col ${res.rasterIndices.col}`)
    console.log(`   Source: ${res.sourceTitle}\n`)
  }
}
