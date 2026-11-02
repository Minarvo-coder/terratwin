/**
 * Scientific Elevation Transect Sampling & Planetary Datum Harmonization Engine
 * 
 * Supports:
 * - Mars Global Surveyor MOLA MEGDR (IAU2000 Areoid, 4 pix/deg binary raster)
 * - Lunar Reconnaissance Orbiter LOLA LDEM_4 (1,737.4 km Sphere, 4 pix/deg binary raster)
 * - Copernicus Global 90m DEM (COP-DEM-GLO-90) & SRTMGL1 (Earth EGM96 Geoid)
 * 
 * Implements geodesic great-circle slerp interpolation, local slope calculation,
 * relative relief transformation (delta z), and planetary datum isolation.
 */

import fs from 'node:fs'
import path from 'node:path'
import type {
  ElevationProfilePoint,
  ElevationTransectProfile,
  ElevationComparisonResponse,
  PlanetaryBody,
} from './types.ts'

// Planetary radii in meters
const MARS_RADIUS_M = 3389500
const MOON_RADIUS_M = 1737400

export const TARGET_ID_ALIASES: Record<string, { id: string; name: string; body: PlanetaryBody }> = {
  // Jezero
  'a0000001-0000-4000-8000-000000000001': { id: 'a0000001-0000-4000-8000-000000000001', name: 'Jezero Crater Delta', body: 'mars' },
  'mars-jezero': { id: 'a0000001-0000-4000-8000-000000000001', name: 'Jezero Crater Delta', body: 'mars' },
  'jezero': { id: 'a0000001-0000-4000-8000-000000000001', name: 'Jezero Crater Delta', body: 'mars' },
  // Gale
  'a0000002-0000-4000-8000-000000000002': { id: 'a0000002-0000-4000-8000-000000000002', name: 'Gale Crater (Aeolis Mons)', body: 'mars' },
  'mars-gale': { id: 'a0000002-0000-4000-8000-000000000002', name: 'Gale Crater (Aeolis Mons)', body: 'mars' },
  'gale': { id: 'a0000002-0000-4000-8000-000000000002', name: 'Gale Crater (Aeolis Mons)', body: 'mars' },
  // Meridiani
  'a0000003-0000-4000-8000-000000000003': { id: 'a0000003-0000-4000-8000-000000000003', name: 'Meridiani Planum', body: 'mars' },
  'mars-meridiani': { id: 'a0000003-0000-4000-8000-000000000003', name: 'Meridiani Planum', body: 'mars' },
  'meridiani': { id: 'a0000003-0000-4000-8000-000000000003', name: 'Meridiani Planum', body: 'mars' },
  // Shackleton
  'b0000001-0000-4000-8000-000000000001': { id: 'b0000001-0000-4000-8000-000000000001', name: 'Shackleton Crater Rim', body: 'moon' },
  'moon-shackleton': { id: 'b0000001-0000-4000-8000-000000000001', name: 'Shackleton Crater Rim', body: 'moon' },
  'shackleton': { id: 'b0000001-0000-4000-8000-000000000001', name: 'Shackleton Crater Rim', body: 'moon' },
  // Mare Tranquillitatis
  'b0000002-0000-4000-8000-000000000002': { id: 'b0000002-0000-4000-8000-000000000002', name: 'Mare Tranquillitatis', body: 'moon' },
  'moon-tranquillitatis': { id: 'b0000002-0000-4000-8000-000000000002', name: 'Mare Tranquillitatis', body: 'moon' },
  'tranquillitatis': { id: 'b0000002-0000-4000-8000-000000000002', name: 'Mare Tranquillitatis', body: 'moon' },
}

export const CANDIDATE_ID_ALIASES: Record<string, string> = {
  // Salda
  'c0000005-0000-4000-8000-000000000005': 'c0000005-0000-4000-8000-000000000005',
  'salda': 'c0000005-0000-4000-8000-000000000005',
  'earth-salda': 'c0000005-0000-4000-8000-000000000005',
  // Craters of the Moon
  'c0000006-0000-4000-8000-000000000006': 'c0000006-0000-4000-8000-000000000006',
  'craters_of_the_moon': 'c0000006-0000-4000-8000-000000000006',
  'earth-craters-of-the-moon': 'c0000006-0000-4000-8000-000000000006',
  // Askja
  'c0000007-0000-4000-8000-000000000007': 'c0000007-0000-4000-8000-000000000007',
  'askja': 'c0000007-0000-4000-8000-000000000007',
  'earth-askja': 'c0000007-0000-4000-8000-000000000007',
  // Rio Tinto
  'c0000008-0000-4000-8000-000000000008': 'c0000008-0000-4000-8000-000000000008',
  'rio_tinto': 'c0000008-0000-4000-8000-000000000008',
  'earth-rio-tinto': 'c0000008-0000-4000-8000-000000000008',
  // Atacama
  'c0000001-0000-4000-8000-000000000001': 'c0000001-0000-4000-8000-000000000001',
  'atacama': 'c0000001-0000-4000-8000-000000000001',
  'earth-atacama': 'c0000001-0000-4000-8000-000000000001',
  // McMurdo
  'c0000004-0000-4000-8000-000000000004': 'c0000004-0000-4000-8000-000000000004',
  'mcmurdo': 'c0000004-0000-4000-8000-000000000004',
  'earth-mcmurdo': 'c0000004-0000-4000-8000-000000000004',
  // Haughton
  'c0000003-0000-4000-8000-000000000003': 'c0000003-0000-4000-8000-000000000003',
  'haughton': 'c0000003-0000-4000-8000-000000000003',
  'earth-haughton': 'c0000003-0000-4000-8000-000000000003',
  // Mauna Kea
  'c0000002-0000-4000-8000-000000000002': 'c0000002-0000-4000-8000-000000000002',
  'mauna_kea': 'c0000002-0000-4000-8000-000000000002',
  'earth-mauna-kea': 'c0000002-0000-4000-8000-000000000002',
}

export function resolveTargetTransectId(identifier: string): { id: string; name: string; body: PlanetaryBody } {
  const norm = identifier.toLowerCase().trim()
  if (TARGET_ID_ALIASES[norm]) return TARGET_ID_ALIASES[norm]
  if (norm.includes('jezero')) return TARGET_ID_ALIASES['a0000001-0000-4000-8000-000000000001']
  if (norm.includes('gale')) return TARGET_ID_ALIASES['a0000002-0000-4000-8000-000000000002']
  if (norm.includes('meridiani')) return TARGET_ID_ALIASES['a0000003-0000-4000-8000-000000000003']
  if (norm.includes('shackleton')) return TARGET_ID_ALIASES['b0000001-0000-4000-8000-000000000001']
  if (norm.includes('tranquillitatis') || norm.includes('apollo')) return TARGET_ID_ALIASES['b0000002-0000-4000-8000-000000000002']
  // Default to Jezero
  return TARGET_ID_ALIASES['a0000001-0000-4000-8000-000000000001']
}

export function resolveCandidateTransectId(identifier: string): string {
  const norm = identifier.toLowerCase().trim()
  if (CANDIDATE_ID_ALIASES[norm]) return CANDIDATE_ID_ALIASES[norm]
  if (norm.includes('salda')) return CANDIDATE_ID_ALIASES['salda']
  if (norm.includes('craters') || norm.includes('moon')) return CANDIDATE_ID_ALIASES['craters_of_the_moon']
  if (norm.includes('askja') || norm.includes('holuhraun')) return CANDIDATE_ID_ALIASES['askja']
  if (norm.includes('rio') || norm.includes('tinto')) return CANDIDATE_ID_ALIASES['rio_tinto']
  if (norm.includes('atacama')) return CANDIDATE_ID_ALIASES['atacama']
  if (norm.includes('mcmurdo') || norm.includes('taylor')) return CANDIDATE_ID_ALIASES['mcmurdo']
  if (norm.includes('haughton')) return CANDIDATE_ID_ALIASES['haughton']
  if (norm.includes('mauna')) return CANDIDATE_ID_ALIASES['mauna_kea']
  // Default to Lake Salda
  return CANDIDATE_ID_ALIASES['salda']
}

interface CachedEarthSample {
  step: number
  distanceKm: number
  latitude: number
  longitude: number
  elevationM: number
  relativeElevationM: number
}

interface CachedEarthTransectRecord {
  candidateId: string
  candidateSlug: string
  name: string
  country: string
  setting: string
  geologicalRationale: string
  sourceDataset: string
  sourceUrl: string
  datum: string
  resolution: string
  totalDistanceKm: number
  minElevationM: number
  maxElevationM: number
  reliefM: number
  meanSlopeDeg: number
  samples: CachedEarthSample[]
  generatedAt: string
}

let marsBufferCache: Buffer | null = null
let moonBufferCache: Buffer | null = null
let earthTransectsCache: Record<string, CachedEarthTransectRecord> | null = null

function getMarsBuffer(): Buffer {
  if (!marsBufferCache) {
    const p = path.resolve(process.cwd(), 'raw-data', 'mars', 'megt90n000cb.img')
    if (!fs.existsSync(p)) {
      throw new Error(`Mars MOLA raster not found at ${p}`)
    }
    marsBufferCache = fs.readFileSync(p)
  }
  return marsBufferCache
}

function getMoonBuffer(): Buffer {
  if (!moonBufferCache) {
    const p = path.resolve(process.cwd(), 'raw-data', 'moon', 'ldem_4.img')
    if (!fs.existsSync(p)) {
      throw new Error(`Moon LOLA raster not found at ${p}`)
    }
    moonBufferCache = fs.readFileSync(p)
  }
  return moonBufferCache
}

function getEarthTransectsJson(): Record<string, CachedEarthTransectRecord> {
  if (!earthTransectsCache) {
    const p = path.resolve(process.cwd(), 'raw-data', 'earth', 'earth_elevation_transects.json')
    if (!fs.existsSync(p)) {
      throw new Error(`Earth transects cache not found at ${p}`)
    }
    earthTransectsCache = JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, CachedEarthTransectRecord>
  }
  return earthTransectsCache
}

export interface TransectDefinition {
  id: string
  name: string
  geologicalRationale: string
  startCoords: { lat: number; lon: number }
  endCoords: { lat: number; lon: number }
  defaultPointCount: number
}

export const PLANETARY_TRANSECT_REGISTRY: Record<string, TransectDefinition> = {
  // Mars Targets
  'a0000001-0000-4000-8000-000000000001': {
    id: 'a0000001-0000-4000-8000-000000000001',
    name: 'Neretva Vallis Delta Breach to Jezero Crater Floor Transect',
    geologicalRationale: 'Descends from the western crater rim and ancient fluvial valley breach down across the river-delta depositional front onto the lacustrine carbonate crater floor.',
    startCoords: { lat: 18.60, lon: 77.20 },
    endCoords: { lat: 18.25, lon: 77.80 },
    defaultPointCount: 35,
  },
  'a0000002-0000-4000-8000-000000000002': {
    id: 'a0000002-0000-4000-8000-000000000002',
    name: 'Gale Crater Northern Rim to Mount Sharp (Aeolis Mons) Transect',
    geologicalRationale: 'Crosses Peace Vallis alluvial fan and Bradbury Landing plains, ascending the sulfate and clay-bearing stratigraphy of Mount Sharp (Aeolis Mons).',
    startCoords: { lat: -5.00, lon: 137.60 },
    endCoords: { lat: -5.55, lon: 138.10 },
    defaultPointCount: 35,
  },
  'a0000003-0000-4000-8000-000000000003': {
    id: 'a0000003-0000-4000-8000-000000000003',
    name: 'Meridiani Planum Eagle to Victoria Crater Plain Transect',
    geologicalRationale: 'Crosses the sulfate-rich sandstones and hematite concretion plains investigated by the MER Opportunity rover across Eagle, Endurance, and Victoria craters.',
    startCoords: { lat: -0.10, lon: 357.30 },
    endCoords: { lat: -0.30, lon: 357.80 },
    defaultPointCount: 35,
  },
  // Moon Targets
  'b0000001-0000-4000-8000-000000000001': {
    id: 'b0000001-0000-4000-8000-000000000001',
    name: 'Shackleton Crater Ridge to Permanently Shadowed Interior Transect',
    geologicalRationale: 'Traverses the illuminated South Pole rim crest and plunges steeply down the 30-degree inner crater wall into the ultra-cold (40 K) permanently shadowed region.',
    startCoords: { lat: -89.60, lon: 0.00 },
    endCoords: { lat: -90.00, lon: 180.00 },
    defaultPointCount: 35,
  },
  'b0000002-0000-4000-8000-000000000002': {
    id: 'b0000002-0000-4000-8000-000000000002',
    name: 'Mare Tranquillitatis Wrinkle Ridge to Apollo 11 Landing Plain Transect',
    geologicalRationale: 'Crosses mare basalt plains and compressive wrinkle ridges towards the historic Apollo 11 touchdown site, characterizing fine regolith micro-craters.',
    startCoords: { lat: 0.40, lon: 23.20 },
    endCoords: { lat: 0.90, lon: 23.80 },
    defaultPointCount: 35,
  },
}

/**
 * Great-circle spherical interpolation between two coordinates on a sphere
 */
export function interpolateGreatCircle(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number },
  f: number
): { lat: number; lon: number } {
  const toRad = Math.PI / 180
  const toDeg = 180 / Math.PI

  const phi1 = p1.lat * toRad
  const lambda1 = p1.lon * toRad
  const phi2 = p2.lat * toRad
  const lambda2 = p2.lon * toRad

  const dLambda = lambda2 - lambda1
  const cosDelta =
    Math.sin(phi1) * Math.sin(phi2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda)
  const delta = Math.acos(Math.max(-1, Math.min(1, cosDelta)))

  if (delta < 1e-9) {
    return { lat: p1.lat, lon: p1.lon }
  }

  const a = Math.sin((1 - f) * delta) / Math.sin(delta)
  const b = Math.sin(f * delta) / Math.sin(delta)

  const x = a * Math.cos(phi1) * Math.cos(lambda1) + b * Math.cos(phi2) * Math.cos(lambda2)
  const y = a * Math.cos(phi1) * Math.sin(lambda1) + b * Math.cos(phi2) * Math.sin(lambda2)
  const z = a * Math.sin(phi1) + b * Math.sin(phi2)

  const phiF = Math.atan2(z, Math.sqrt(x * x + y * y))
  const lambdaF = Math.atan2(y, x)

  return {
    lat: Math.round(phiF * toDeg * 10000) / 10000,
    lon: Math.round(lambdaF * toDeg * 10000) / 10000,
  }
}

/**
 * Great-circle metric distance on a planetary sphere
 */
export function greatCircleDistanceM(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number },
  radiusM: number
): number {
  const toRad = Math.PI / 180
  const phi1 = p1.lat * toRad
  const lambda1 = p1.lon * toRad
  const phi2 = p2.lat * toRad
  const lambda2 = p2.lon * toRad
  const dLambda = lambda2 - lambda1

  const cosDelta =
    Math.sin(phi1) * Math.sin(phi2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda)
  const delta = Math.acos(Math.max(-1, Math.min(1, cosDelta)))
  return radiusM * delta
}

/**
 * Sample Mars elevation from MGS MOLA MEGDR (4 pix/deg, 16-bit signed BE)
 */
function readMarsElevation(lat: number, lonEast: number): number {
  const buffer = getMarsBuffer()
  const normLon = ((lonEast % 360) + 360) % 360
  const row = Math.min(719, Math.max(0, Math.floor((90 - lat) * 4)))
  const col = Math.min(1439, Math.max(0, Math.floor(normLon * 4)))
  const offset = (row * 1440 + col) * 2
  return buffer.readInt16BE(offset)
}

/**
 * Sample Moon elevation from LRO LOLA LDEM (4 pix/deg, 16-bit signed LE, 0.5m scale)
 */
function readMoonElevation(lat: number, lonEast: number): number {
  const buffer = getMoonBuffer()
  const normLon = ((lonEast % 360) + 360) % 360
  const row = Math.min(719, Math.max(0, Math.floor((90 - lat) * 4)))
  const col = Math.min(1439, Math.max(0, Math.floor(normLon * 4)))
  const offset = (row * 1440 + col) * 2
  const dn = buffer.readInt16LE(offset)
  return dn * 0.5
}

/**
 * Generate authentic elevation profile for a planetary target (Mars or Moon)
 */
export function samplePlanetaryTargetProfile(
  targetId: string,
  targetName: string,
  body: PlanetaryBody,
  pointCount = 35
): ElevationTransectProfile {
  const def = PLANETARY_TRANSECT_REGISTRY[targetId]
  if (!def) {
    throw new Error(`No defined transect for planetary target ID ${targetId}`)
  }

  const radiusM = body === 'mars' ? MARS_RADIUS_M : MOON_RADIUS_M
  const totalDistM = greatCircleDistanceM(def.startCoords, def.endCoords, radiusM)
  const totalDistKm = Math.round((totalDistM / 1000) * 100) / 100

  const samples: ElevationProfilePoint[] = []

  for (let i = 0; i < pointCount; i++) {
    const f = i / (pointCount - 1)
    const coord = interpolateGreatCircle(def.startCoords, def.endCoords, f)
    const distKm = Math.round((f * totalDistKm) * 100) / 100

    let elevM = 0
    if (body === 'mars') {
      elevM = readMarsElevation(coord.lat, coord.lon)
    } else {
      elevM = readMoonElevation(coord.lat, coord.lon)
    }

    samples.push({
      step: i,
      distanceKm: distKm,
      normalizedProgressPct: Math.round(f * 1000) / 10,
      latitude: coord.lat,
      longitude: coord.lon,
      elevationM: Math.round(elevM * 10) / 10,
      relativeElevationM: 0, // Computed below
      localSlopeDeg: 0,     // Computed below
    })
  }

  // Calculate relative relief relative to start point (z - z_0)
  const startElev = samples[0].elevationM
  samples.forEach((s) => {
    s.relativeElevationM = Math.round((s.elevationM - startElev) * 10) / 10
  })

  // Calculate local slope between adjacent steps in degrees
  for (let i = 0; i < samples.length - 1; i++) {
    const p1 = samples[i]
    const p2 = samples[i + 1]
    const dz = Math.abs(p2.elevationM - p1.elevationM)
    const dx = (p2.distanceKm - p1.distanceKm) * 1000
    const slopeDeg = dx > 0 ? Math.atan(dz / dx) * (180 / Math.PI) : 0
    p1.localSlopeDeg = Math.round(slopeDeg * 10) / 10
  }
  samples[samples.length - 1].localSlopeDeg = samples[samples.length - 2].localSlopeDeg

  const elevValues = samples.map((s) => s.elevationM)
  const minElev = Math.min(...elevValues)
  const maxElev = Math.max(...elevValues)
  const reliefM = Math.round((maxElev - minElev) * 10) / 10
  const slopes = samples.map((s) => s.localSlopeDeg)
  const meanSlopeDeg = Math.round((slopes.reduce((a, b) => a + b, 0) / slopes.length) * 10) / 10

  const datum =
    body === 'mars'
      ? 'Mars IAU2000 Areoid (MOLA GMM-3 equipotential datum)'
      : 'Lunar Reference Sphere (R = 1,737.4 km, LOLA LDEM)'

  const sourceDataset =
    body === 'mars'
      ? 'Mars Global Surveyor MOLA MEGDR (MGS-M-MOLA-5-MEGDR-L3-V1.0)'
      : 'Lunar Reconnaissance Orbiter LOLA LDEM_4 (LRO-L-LOLA-4-GDR-V1.0)'

  const sourceUrl =
    body === 'mars'
      ? 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/'
      : 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/'

  const spatialResolution =
    body === 'mars'
      ? '4 pix/deg (~14.8 km/pixel at equator)'
      : '4 pix/deg (~7.58 km/pixel at equator)'

  return {
    locationId: targetId,
    locationName: targetName,
    planetaryBody: body === 'mars' ? 'Mars' : 'Moon',
    transectName: def.name,
    geologicalRationale: def.geologicalRationale,
    sourceDataset,
    sourceUrl,
    datum,
    spatialResolution,
    totalDistanceKm: totalDistKm,
    minElevationM: minElev,
    maxElevationM: maxElev,
    reliefM,
    meanSlopeDeg,
    samples,
  }
}

/**
 * Retrieve authentic Earth candidate elevation profile from cached Copernicus DEM 90m dataset
 */
export function getEarthCandidateProfile(candidateId: string): ElevationTransectProfile {
  const cache = getEarthTransectsJson()
  const cached = cache[candidateId]
  if (!cached) {
    throw new Error(`No authentic elevation profile found for candidate ID ${candidateId}`)
  }

  // Format samples to ensure standardized ElevationProfilePoint structure
  const samples: ElevationProfilePoint[] = cached.samples.map((s) => ({
    step: s.step,
    distanceKm: s.distanceKm,
    normalizedProgressPct: Math.round((s.distanceKm / cached.totalDistanceKm) * 1000) / 10,
    latitude: s.latitude,
    longitude: s.longitude,
    elevationM: s.elevationM,
    relativeElevationM: s.relativeElevationM,
    localSlopeDeg: 0,
  }))

  // Calculate local slopes
  for (let i = 0; i < samples.length - 1; i++) {
    const p1 = samples[i]
    const p2 = samples[i + 1]
    const dz = Math.abs(p2.elevationM - p1.elevationM)
    const dx = (p2.distanceKm - p1.distanceKm) * 1000
    const slopeDeg = dx > 0 ? Math.atan(dz / dx) * (180 / Math.PI) : 0
    p1.localSlopeDeg = Math.round(slopeDeg * 10) / 10
  }
  samples[samples.length - 1].localSlopeDeg = samples[samples.length - 2].localSlopeDeg

  return {
    locationId: cached.candidateId,
    locationName: cached.name,
    planetaryBody: 'Earth',
    transectName: cached.name,
    geologicalRationale: cached.geologicalRationale,
    sourceDataset: cached.sourceDataset,
    sourceUrl: cached.sourceUrl,
    datum: cached.datum,
    spatialResolution: cached.resolution,
    totalDistanceKm: cached.totalDistanceKm,
    minElevationM: cached.minElevationM,
    maxElevationM: cached.maxElevationM,
    reliefM: cached.reliefM,
    meanSlopeDeg: cached.meanSlopeDeg,
    samples,
  }
}

/**
 * Compare target and candidate profiles with physical datum isolation & relative relief alignment
 */
export function compareElevationProfiles(
  targetProfile: ElevationTransectProfile,
  candidateProfile: ElevationTransectProfile
): ElevationComparisonResponse {
  const datumDisparityExplanation =
    targetProfile.planetaryBody === 'Mars'
      ? 'Mars elevations are referenced to the IAU2000 Areoid (gravitational equipotential defining 610.5 Pa atmospheric triple point of water), whereas Earth elevations are referenced to the EGM96 Geoid (Mean Sea Level). Raw vertical values cannot be subtracted directly; Relative Relief (delta z) normalizes both traverses.'
      : 'Lunar elevations are referenced to a fixed 1,737.4 km sphere (LOLA datum), whereas Earth elevations are referenced to the EGM96 Geoid (Mean Sea Level). Raw vertical values cannot be subtracted directly; Relative Relief (delta z) normalizes both traverses.'

  const spatialResolutionDisparity = `Resolution Disparity: ${targetProfile.locationName} is sampled at ${targetProfile.spatialResolution}, while ${candidateProfile.locationName} is sampled at ${candidateProfile.spatialResolution}.`

  return {
    success: true,
    target: targetProfile,
    candidate: candidateProfile,
    scientificNotice: {
      comparisonType: 'relative-relief',
      datumDisparityExplanation,
      spatialResolutionDisparity,
    },
  }
}
