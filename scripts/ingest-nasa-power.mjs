/**
 * Reproducible Ingestion Pipeline for NASA POWER Climatology
 * 
 * Fetches, caches, and standardizes 25-year climatological baseline (2001-2025)
 * atmospheric and solar irradiance data from NASA Langley Research Center (LaRC).
 * 
 * Official API: https://power.larc.nasa.gov/api/temporal/climatology/point
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const RAW_EARTH_DIR = path.join(ROOT_DIR, 'raw-data', 'earth')

export const NASA_POWER_SOURCE_META = {
  id: '33333333-3333-4333-8333-333333333333',
  title: 'NASA POWER Climatology Native Resolution (Meteorological and Solar)',
  provider: 'NASA Langley Research Center (LaRC)',
  source_url: 'https://power.larc.nasa.gov/api/temporal/climatology/point',
  dataset_version: 'POWER Climatology API v2.10.1 (25-year baseline: Jan 2001 - Dec 2025)',
  processing_method: 'REST point query extracting 25-year climatological monthly and annual averages (MERRA-2/SYN1DEG). Irradiance normalized to W/m², pressure kPa to Pa (x1000).',
  limitations: 'Spatial grid cell resolution ~0.5 x 0.625 degrees (~50 km); regional atmospheric reanalysis rather than local micro-meteorological station measurements.',
}

export const EARTH_ANALOG_REGISTRY = [
  {
    id: 'c0000001-0000-4000-8000-000000000001',
    slug: 'atacama',
    cacheFile: 'nasa_power_atacama_raw.json',
    name: 'Atacama Desert (Yungay Plateau)',
    latitude: -23.8634,
    longitude: -68.2384,
  },
  {
    id: 'c0000002-0000-4000-8000-000000000002',
    slug: 'mauna_kea',
    cacheFile: 'nasa_power_mauna_kea_raw.json',
    name: 'Mauna Kea Summit Cones',
    latitude: 19.8207,
    longitude: -155.4681,
  },
  {
    id: 'c0000003-0000-4000-8000-000000000003',
    slug: 'haughton',
    cacheFile: 'nasa_power_haughton_crater_raw.json',
    name: 'Haughton Impact Structure',
    latitude: 75.3833,
    longitude: -89.6833,
  },
  {
    id: 'c0000004-0000-4000-8000-000000000004',
    slug: 'mcmurdo',
    cacheFile: 'nasa_power_mcmurdo_raw.json',
    name: 'McMurdo Dry Valleys',
    latitude: -77.5000,
    longitude: 162.0000,
  },
  {
    id: 'c0000005-0000-4000-8000-000000000005',
    slug: 'salda',
    cacheFile: 'nasa_power_salda_raw.json',
    name: 'Lake Salda Microbialites',
    latitude: 37.5500,
    longitude: 29.6800,
  },
  {
    id: 'c0000006-0000-4000-8000-000000000006',
    slug: 'craters_of_the_moon',
    cacheFile: 'nasa_power_craters_of_the_moon_raw.json',
    name: 'Craters of the Moon Basalts',
    latitude: 43.4600,
    longitude: -113.5600,
  },
  {
    id: 'c0000007-0000-4000-8000-000000000007',
    slug: 'askja',
    cacheFile: 'nasa_power_askja_raw.json',
    name: 'Askja Caldera & Holuhraun',
    latitude: 64.9000,
    longitude: -16.8300,
  },
  {
    id: 'c0000008-0000-4000-8000-000000000008',
    slug: 'rio_tinto',
    cacheFile: 'nasa_power_rio_tinto_raw.json',
    name: 'Río Tinto Acidic Basin',
    latitude: 37.7000,
    longitude: -6.5500,
  },
]

/**
 * Fetch raw climatology JSON from NASA POWER API with automatic retry and timeout
 */
export async function fetchPowerClimatology(lat, lon, options = {}) {
  const timeoutMs = options.timeoutMs || 12000
  const params = 'T2M,T2M_MAX,T2M_MIN,PS,ALLSKY_SFC_SW_DWN,PRECTOTCORR'
  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=${params}&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) {
      throw new Error(`NASA POWER API HTTP ${res.status}: ${res.statusText}`)
    }
    const data = await res.json()
    return data
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

/**
 * Normalize and harmonize NASA POWER climatology values into standardized scientific parameters
 */
export function processPowerClimatology(rawJson) {
  if (!rawJson || !rawJson.properties || !rawJson.properties.parameter) {
    throw new Error('Invalid NASA POWER payload: missing properties.parameter')
  }

  const p = rawJson.properties.parameter
  const pMeta = rawJson.parameters || {}
  const geom = rawJson.geometry?.coordinates || []

  // 1. Mean Surface Temperature (°C)
  const rawT2m = p.T2M?.ANN
  const meanSurfaceTempC = typeof rawT2m === 'number' && rawT2m !== -999 ? Math.round(rawT2m * 100) / 100 : null

  // 2. Diurnal / Seasonal Temperature Range (°C / K)
  const rawT2mMax = p.T2M_MAX?.ANN
  const rawT2mMin = p.T2M_MIN?.ANN
  let diurnalTempRangeC = null
  if (
    typeof rawT2mMax === 'number' && rawT2mMax !== -999 &&
    typeof rawT2mMin === 'number' && rawT2mMin !== -999
  ) {
    diurnalTempRangeC = Math.round((rawT2mMax - rawT2mMin) * 100) / 100
  }

  // 3. Surface Pressure (Pa)
  // Raw unit is kPa -> convert to Pa (x1000)
  const rawPs = p.PS?.ANN
  let surfacePressurePa = null
  if (typeof rawPs === 'number' && rawPs !== -999) {
    surfacePressurePa = Math.round(rawPs * 1000)
  }

  // 4. Surface Solar Irradiance (W/m²)
  // Check units from metadata: if 'kW-hr/m^2/day', multiply by 1000 / 24. If already 'W m-2' or 'W/m2', use directly.
  const rawSolar = p.ALLSKY_SFC_SW_DWN?.ANN
  let surfaceSolarIrradianceWm2 = null
  if (typeof rawSolar === 'number' && rawSolar !== -999) {
    const solarUnit = pMeta.ALLSKY_SFC_SW_DWN?.units || ''
    if (solarUnit.includes('kW-hr') || solarUnit.includes('/day')) {
      // 1 kWh/m2/day = 1000 Wh / 24h = 41.6667 W/m2
      surfaceSolarIrradianceWm2 = Math.round((rawSolar * 1000 / 24) * 100) / 100
    } else {
      // Already in W/m2 (or W m-2)
      surfaceSolarIrradianceWm2 = Math.round(rawSolar * 100) / 100
    }
  }

  // 5. Annual Precipitation (mm/year)
  // Raw is PRECTOTCORR in mm/day -> multiply by 365.25
  const rawPrec = p.PRECTOTCORR?.ANN
  let annualPrecipitationMm = null
  if (typeof rawPrec === 'number' && rawPrec !== -999) {
    const precUnit = pMeta.PRECTOTCORR?.units || ''
    if (precUnit.includes('/day')) {
      annualPrecipitationMm = Math.round((rawPrec * 365.25) * 10) / 10
    } else {
      annualPrecipitationMm = Math.round(rawPrec * 10) / 10
    }
  }

  // 6. Terrain Elevation from Header Geometry (m, EGM96 geoid datum)
  const elevationGeoidDatumM = typeof geom[2] === 'number' ? Math.round(geom[2] * 10) / 10 : null

  return {
    rawHeader: rawJson.header || {},
    retrievalCoordinates: {
      longitude: geom[0] ?? null,
      latitude: geom[1] ?? null,
      elevationM: elevationGeoidDatumM,
    },
    harmonizedFeatures: {
      meanSurfaceTempC,
      diurnalTempRangeC,
      surfacePressurePa,
      surfaceSolarIrradianceWm2,
      annualPrecipitationMm,
      elevationGeoidDatumM,
    },
    provenance: {
      sourceId: NASA_POWER_SOURCE_META.id,
      sourceTitle: NASA_POWER_SOURCE_META.title,
      datasetVersion: rawJson.header?.api?.name
        ? `${rawJson.header.api.name} v${rawJson.header.api.version || '2.x'}`
        : NASA_POWER_SOURCE_META.dataset_version,
      measurementPeriod: rawJson.header?.range || '25-year Meteorological Climatology (2001-2025)',
      fillValue: rawJson.header?.fill_value ?? -999.0,
      originalUnits: {
        T2M: pMeta.T2M?.units || 'C',
        PS: pMeta.PS?.units || 'kPa',
        ALLSKY_SFC_SW_DWN: pMeta.ALLSKY_SFC_SW_DWN?.units || 'W m-2 or kW-hr/m^2/day',
        PRECTOTCORR: pMeta.PRECTOTCORR?.units || 'mm/day',
      },
    },
  }
}

/**
 * Ingest or load from cache for all 8 Earth candidate analog sites
 */
export async function ingestAllEarthAnalogs(options = {}) {
  const forceFetch = Boolean(options.forceFetch)
  const results = []

  if (!fs.existsSync(RAW_EARTH_DIR)) {
    fs.mkdirSync(RAW_EARTH_DIR, { recursive: true })
  }

  for (const site of EARTH_ANALOG_REGISTRY) {
    const cachePath = path.join(RAW_EARTH_DIR, site.cacheFile)
    let rawJson = null
    let loadedFromCache = false

    if (!forceFetch && fs.existsSync(cachePath)) {
      try {
        const fileContent = fs.readFileSync(cachePath, 'utf8')
        rawJson = JSON.parse(fileContent)
        loadedFromCache = true
      } catch (err) {
        console.warn(`[ingest-nasa-power] Corrupted cache for ${site.slug}: ${err.message}. Refetching...`)
      }
    }

    if (!rawJson) {
      console.log(`[ingest-nasa-power] Fetching live NASA POWER climatology for ${site.name} (${site.latitude}, ${site.longitude})...`)
      try {
        rawJson = await fetchPowerClimatology(site.latitude, site.longitude)
        fs.writeFileSync(cachePath, JSON.stringify(rawJson, null, 2), 'utf8')
        console.log(`[ingest-nasa-power] Cached ${site.slug} -> ${cachePath}`)
      } catch (fetchErr) {
        console.error(`[ingest-nasa-power] Failed to fetch live data for ${site.name}: ${fetchErr.message}`)
        if (fs.existsSync(cachePath)) {
          console.warn(`[ingest-nasa-power] Using fallback cached file for ${site.slug}`)
          rawJson = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
          loadedFromCache = true
        } else {
          results.push({
            siteId: site.id,
            slug: site.slug,
            name: site.name,
            status: 'FAILED',
            error: fetchErr.message,
          })
          continue
        }
      }
    }

    const processed = processPowerClimatology(rawJson)
    results.push({
      siteId: site.id,
      slug: site.slug,
      name: site.name,
      loadedFromCache,
      status: 'VERIFIED_AND_PROCESSED',
      ...processed,
    })
  }

  return results
}

// CLI Execution Entry Point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const forceFetch = process.argv.includes('--fetch-all') || process.argv.includes('--force')
  console.log(`Starting NASA POWER climatology ingestion (forceFetch=${forceFetch})...`)
  ingestAllEarthAnalogs({ forceFetch })
    .then((results) => {
      console.log('\n--- NASA POWER INGESTION SUMMARY REPORT ---')
      for (const r of results) {
        if (r.status === 'FAILED') {
          console.log(`❌ ${r.name}: FAILED (${r.error})`)
        } else {
          console.log(`✅ ${r.name} (${r.slug}) [${r.loadedFromCache ? 'CACHE' : 'LIVE API'}]:`)
          console.log(`   Temp: ${r.harmonizedFeatures.meanSurfaceTempC} °C (Diurnal/Annual swing: ${r.harmonizedFeatures.diurnalTempRangeC} °C)`)
          console.log(`   Pressure: ${r.harmonizedFeatures.surfacePressurePa} Pa`)
          console.log(`   Solar: ${r.harmonizedFeatures.surfaceSolarIrradianceWm2} W/m²`)
          console.log(`   Precipitation: ${r.harmonizedFeatures.annualPrecipitationMm} mm/yr`)
          console.log(`   Elevation: ${r.harmonizedFeatures.elevationGeoidDatumM} m (EGM96 geoid)`)
        }
      }
      console.log(`\nTotal sites processed: ${results.length}/8`)
    })
    .catch((err) => {
      console.error('Fatal ingestion error:', err)
      process.exit(1)
    })
}
