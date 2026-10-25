import fs from 'fs'
import path from 'path'

// 1. Parsing Functions for Planetary Rasters
function sampleMarsElevation(buffer, lat, lonEast) {
  const normLon = ((lonEast % 360) + 360) % 360
  const line = Math.min(719, Math.max(0, Math.floor((90 - lat) * 4)))
  const sample = Math.min(1439, Math.max(0, Math.floor(normLon * 4)))
  const offset = (line * 1440 + sample) * 2
  return buffer.readInt16BE(offset)
}

function sampleMoonHeight(buffer, lat, lonEast) {
  const normLon = ((lonEast % 360) + 360) % 360
  const line = Math.min(719, Math.max(0, Math.floor((90 - lat) * 4)))
  const sample = Math.min(1439, Math.max(0, Math.floor(normLon * 4)))
  const offset = (line * 1440 + sample) * 2
  const dn = buffer.readInt16LE(offset)
  return dn * 0.5
}

// 2. Load Raw Files
console.log('--- Loading Raw Data Files ---')
const marsBuffer = fs.readFileSync('raw-data/mars/megt90n000cb.img')
const moonBuffer = fs.readFileSync('raw-data/moon/ldem_4.img')

const earthRaw = {
  atacama: JSON.parse(fs.readFileSync('raw-data/earth/nasa_power_atacama_raw.json', 'utf8')),
  mauna_kea: JSON.parse(fs.readFileSync('raw-data/earth/nasa_power_mauna_kea_raw.json', 'utf8')),
  haughton: JSON.parse(fs.readFileSync('raw-data/earth/nasa_power_haughton_crater_raw.json', 'utf8')),
  mcmurdo: JSON.parse(fs.readFileSync('raw-data/earth/nasa_power_mcmurdo_raw.json', 'utf8')),
}

console.log('Mars MOLA buffer size:', marsBuffer.length, 'bytes')
console.log('Moon LOLA buffer size:', moonBuffer.length, 'bytes')
console.log('Earth datasets loaded:', Object.keys(earthRaw).length)

// 3. Define Sources
const datasetSources = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Mars Global Surveyor MOLA Mission Experiment Gridded Data Record (MEGDR)',
    provider: 'NASA Goddard Space Flight Center / PDS Geosciences Node',
    source_url: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megt90n000cb.img',
    dataset_version: 'MGS-M-MOLA-5-MEGDR-L3-V1.0 (Product Version 2.0)',
    accessed_at: '2026-10-26T00:47:00Z',
    processing_method: 'Direct binary sampling of 16-bit signed integer big-endian array (720x1440, 4 pix/deg) relative to Mars IAU2000 areoid (GMM3).',
    limitations: 'Global 4 pix/deg spatial resolution (~14.8 km/pix at equator); equatorial gaps up to 12 km between along-track profiles.',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Lunar Reconnaissance Orbiter LOLA Gridded Digital Elevation Model (LDEM_4)',
    provider: 'NASA Goddard Space Flight Center / PDS Geosciences Node',
    source_url: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_4.img',
    dataset_version: 'LRO-L-LOLA-4-GDR-V1.0 (Product Version V3.0)',
    accessed_at: '2026-10-26T00:48:00Z',
    processing_method: 'Direct binary sampling of 16-bit signed integer little-endian array (720x1440, 4 pix/deg) scaled by factor 0.5 to yield elevation in meters relative to 1737.4 km reference sphere.',
    limitations: 'Resampled to 4 pix/deg (~7.58 km/pix); GMT surface interpolation used for small profile coverage gaps.',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    title: 'NASA POWER Climatology Native Resolution (Meteorological and Solar)',
    provider: 'NASA Langley Research Center (LaRC)',
    source_url: 'https://power.larc.nasa.gov/api/temporal/climatology/point',
    dataset_version: 'POWER Climatology API v2.10.1 (25-year baseline: Jan 2001 - Dec 2025)',
    accessed_at: '2026-10-26T00:48:20Z',
    processing_method: 'REST point query extracting 25-year climatological monthly and annual averages (MERRA-2/SYN1DEG). Converted temperature Celsius to Kelvin (+273.15) and surface pressure kPa to Pa (x1000).',
    limitations: 'Spatial grid cell resolution ~0.5 x 0.625 degrees (~50 km); represents regional atmospheric reanalysis rather than local micro-meteorological station measurements.',
  },
]

// 4. Define Locations
const locations = [
  // Mars Targets
  {
    id: 'a0000001-0000-4000-8000-000000000001',
    name: 'Jezero Crater Delta',
    planetary_body: 'Mars',
    location_role: 'target',
    latitude: 18.38,
    longitude: 77.58,
    description: 'Ancient deltaic lake basin landing site of NASA Mars 2020 Perseverance rover, featuring clay and carbonate mineralogy.',
  },
  {
    id: 'a0000002-0000-4000-8000-000000000002',
    name: 'Gale Crater (Aeolis Mons)',
    planetary_body: 'Mars',
    location_role: 'target',
    latitude: -5.36,
    longitude: 137.86,
    description: 'Layered sedimentary mound landing site of NASA MSL Curiosity rover, recording ancient aqueous transition to hyper-arid regime.',
  },
  // Moon Targets
  {
    id: 'b0000001-0000-4000-8000-000000000001',
    name: 'Shackleton Crater Rim',
    planetary_body: 'Moon',
    location_role: 'target',
    latitude: -89.90,
    longitude: 0.00,
    description: 'Lunar South Pole impact crater rim with adjacent permanently shadowed regions (PSRs) exhibiting cryogenic volatile cold traps.',
  },
  {
    id: 'b0000002-0000-4000-8000-000000000002',
    name: 'Mare Tranquillitatis (Apollo 11)',
    planetary_body: 'Moon',
    location_role: 'target',
    latitude: 0.67,
    longitude: 23.47,
    description: 'Equatorial basaltic volcanic plain, classic titanium-rich mare regolith benchmark site from Apollo 11 lunar return samples.',
  },
  // Earth Candidates
  {
    id: 'c0000001-0000-4000-8000-000000000001',
    name: 'Atacama Desert (Yungay Plateau)',
    planetary_body: 'Earth',
    location_role: 'candidate',
    latitude: -23.8634,
    longitude: -68.2384,
    description: 'Hyper-arid high-UV desert plateau in Chile, premier terrestrial analog for hyper-arid Martian perchlorate and oxidized soils.',
    rawKey: 'atacama',
  },
  {
    id: 'c0000002-0000-4000-8000-000000000002',
    name: 'Mauna Kea Summit Cones',
    planetary_body: 'Earth',
    location_role: 'candidate',
    latitude: 19.8207,
    longitude: -155.4681,
    description: 'High-altitude weathered basaltic tephra cinder cones and palagonitized dust, geomorphic analog for lunar and Martian volcanic terrains.',
    rawKey: 'mauna_kea',
  },
  {
    id: 'c0000003-0000-4000-8000-000000000003',
    name: 'Haughton Impact Structure',
    planetary_body: 'Earth',
    location_role: 'candidate',
    latitude: 75.3833,
    longitude: -89.6833,
    description: 'Devon Island high-arctic impact crater in Nunavut, Canada. Cold-desert permafrost and shatter cone target for polar planetary analogs.',
    rawKey: 'haughton',
  },
  {
    id: 'c0000004-0000-4000-8000-000000000004',
    name: 'McMurdo Dry Valleys',
    planetary_body: 'Earth',
    location_role: 'candidate',
    latitude: -77.5000,
    longitude: 162.0000,
    description: 'Antarctic polar ice-free desert exhibiting extreme low humidity, ventifacts, and permafrost polygonal ground comparable to Martian soils.',
    rawKey: 'mcmurdo',
  },
]

// 5. Build Environmental Features
const environmentalFeatures = []
let featIdCounter = 1

function createFeatId() {
  const hex = (featIdCounter++).toString(16).padStart(12, '0')
  return `f0000000-0000-4000-8000-${hex}`
}

// 5a. Process Mars Targets
for (const loc of locations.filter((l) => l.planetary_body === 'Mars')) {
  const elev = sampleMarsElevation(marsBuffer, loc.latitude, loc.longitude)
  environmentalFeatures.push({
    id: createFeatId(),
    location_id: loc.id,
    source_id: '11111111-1111-4111-8111-111111111111',
    feature_name: 'elevation_areoid_datum_m',
    value: elev,
    unit: 'm',
    measurement_period: '1997-09-15 to 2001-06-30 (MOLA Mapping & Extended Phase)',
    spatial_resolution: '4 pixels/deg (~14.8 km/pixel)',
    quality_notes: `Sampled directly from binary raster megt90n000cb.img at row ${Math.floor((90 - loc.latitude) * 4)}, col ${Math.floor((((loc.longitude % 360) + 360) % 360) * 4)}. Big-endian signed 16-bit int.`,
  })
}

// 5b. Process Moon Targets
for (const loc of locations.filter((l) => l.planetary_body === 'Moon')) {
  const height = sampleMoonHeight(moonBuffer, loc.latitude, loc.longitude)
  environmentalFeatures.push({
    id: createFeatId(),
    location_id: loc.id,
    source_id: '22222222-2222-4222-8222-222222222222',
    feature_name: 'elevation_sphere_datum_m',
    value: height,
    unit: 'm',
    measurement_period: '2009-07-13 to 2016-11-29 (LOLA Mission Phases through LRO_ES_52)',
    spatial_resolution: '4 pixels/deg (~7.58 km/pixel)',
    quality_notes: `Sampled from binary raster ldem_4.img at row ${Math.floor((90 - loc.latitude) * 4)}, col ${Math.floor((((loc.longitude % 360) + 360) % 360) * 4)}. Formula: HEIGHT = DN * 0.5 relative to 1737.4 km sphere.`,
  })
}

// 5c. Process Earth Candidates
for (const loc of locations.filter((l) => l.planetary_body === 'Earth')) {
  const raw = earthRaw[loc.rawKey]
  const p = raw.properties.parameter

  // Coordinates from geometry
  const geomElev = raw.geometry.coordinates[2] // Elevation in meters from NASA POWER terrain model
  if (typeof geomElev === 'number') {
    environmentalFeatures.push({
      id: createFeatId(),
      location_id: loc.id,
      source_id: '33333333-3333-4333-8333-333333333333',
      feature_name: 'elevation_geoid_datum_m',
      value: Math.round(geomElev * 100) / 100,
      unit: 'm',
      measurement_period: '2001-01 to 2025-12 Climatological baseline',
      spatial_resolution: '0.5 x 0.625 deg grid cell',
      quality_notes: `Terrain surface elevation extracted from NASA POWER geometry header for coordinate [${loc.longitude}, ${loc.latitude}].`,
    })
  }

  // Mean Annual Temperature (T2M in Celsius -> Kelvin)
  const t2mC = p.T2M.ANN
  const t2mK = Math.round((t2mC + 273.15) * 100) / 100
  environmentalFeatures.push({
    id: createFeatId(),
    location_id: loc.id,
    source_id: '33333333-3333-4333-8333-333333333333',
    feature_name: 'mean_annual_temp_k',
    value: t2mK,
    unit: 'K',
    measurement_period: '25-year Climatology (2001-2025)',
    spatial_resolution: '0.5 x 0.625 deg',
    quality_notes: `Standardized from raw T2M.ANN = ${t2mC} deg C to Kelvin via K = C + 273.15.`,
  })

  // Annual Max Temperature
  const t2mMaxC = p.T2M_MAX.ANN
  const t2mMaxK = Math.round((t2mMaxC + 273.15) * 100) / 100
  environmentalFeatures.push({
    id: createFeatId(),
    location_id: loc.id,
    source_id: '33333333-3333-4333-8333-333333333333',
    feature_name: 'max_monthly_temp_k',
    value: t2mMaxK,
    unit: 'K',
    measurement_period: '25-year Climatology (2001-2025)',
    spatial_resolution: '0.5 x 0.625 deg',
    quality_notes: `Standardized from raw T2M_MAX.ANN = ${t2mMaxC} deg C to Kelvin.`,
  })

  // Annual Min Temperature
  const t2mMinC = p.T2M_MIN.ANN
  const t2mMinK = Math.round((t2mMinC + 273.15) * 100) / 100
  environmentalFeatures.push({
    id: createFeatId(),
    location_id: loc.id,
    source_id: '33333333-3333-4333-8333-333333333333',
    feature_name: 'min_monthly_temp_k',
    value: t2mMinK,
    unit: 'K',
    measurement_period: '25-year Climatology (2001-2025)',
    spatial_resolution: '0.5 x 0.625 deg',
    quality_notes: `Standardized from raw T2M_MIN.ANN = ${t2mMinC} deg C to Kelvin.`,
  })

  // Diurnal/Seasonal Temperature Swing (Delta T)
  const deltaT = Math.round((t2mMaxC - t2mMinC) * 100) / 100
  environmentalFeatures.push({
    id: createFeatId(),
    location_id: loc.id,
    source_id: '33333333-3333-4333-8333-333333333333',
    feature_name: 'diurnal_seasonal_temp_swing_k',
    value: deltaT,
    unit: 'K',
    measurement_period: '25-year Climatology (2001-2025)',
    spatial_resolution: '0.5 x 0.625 deg',
    quality_notes: `Calculated as T2M_MAX.ANN (${t2mMaxC} C) minus T2M_MIN.ANN (${t2mMinC} C). Delta T in C equals Delta T in K.`,
  })

  // Surface Solar Irradiance (W/m^2)
  const solarFlux = p.ALLSKY_SFC_SW_DWN.ANN
  environmentalFeatures.push({
    id: createFeatId(),
    location_id: loc.id,
    source_id: '33333333-3333-4333-8333-333333333333',
    feature_name: 'surface_solar_irradiance_wm2',
    value: solarFlux,
    unit: 'W/m2',
    measurement_period: '25-year Climatology (2001-2025)',
    spatial_resolution: '0.5 x 0.625 deg',
    quality_notes: `All-sky surface downward solar flux raw annual average (ALLSKY_SFC_SW_DWN.ANN).`,
  })

  // Surface Atmospheric Pressure (kPa -> Pa)
  const psKpa = p.PS.ANN
  const psPa = Math.round(psKpa * 1000 * 100) / 100
  environmentalFeatures.push({
    id: createFeatId(),
    location_id: loc.id,
    source_id: '33333333-3333-4333-8333-333333333333',
    feature_name: 'surface_pressure_pa',
    value: psPa,
    unit: 'Pa',
    measurement_period: '25-year Climatology (2001-2025)',
    spatial_resolution: '0.5 x 0.625 deg',
    quality_notes: `Standardized from raw PS.ANN = ${psKpa} kPa to Pascals (x1000). NOTE: Atmospheric pressure is flagged unsuitable for direct analog comparison against Mars/Moon.`,
  })
}

// 6. Generate Clean SQL Migration / Seed Script
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL'
  return `'${String(str).replace(/'/g, "''")}'`
}

let sql = `-- ==============================================================================
-- TerraTwin Real Scientific Data Seed
-- Generated from official NASA PDS & NASA Earthdata Archives
-- ==============================================================================

BEGIN;

-- 1. Insert Dataset Sources
`

for (const ds of datasetSources) {
  sql += `INSERT INTO public.dataset_sources (id, title, provider, source_url, dataset_version, accessed_at, processing_method, limitations)
VALUES (
  ${escapeSql(ds.id)},
  ${escapeSql(ds.title)},
  ${escapeSql(ds.provider)},
  ${escapeSql(ds.source_url)},
  ${escapeSql(ds.dataset_version)},
  ${escapeSql(ds.accessed_at)},
  ${escapeSql(ds.processing_method)},
  ${escapeSql(ds.limitations)}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider = EXCLUDED.provider,
  source_url = EXCLUDED.source_url,
  dataset_version = EXCLUDED.dataset_version,
  accessed_at = EXCLUDED.accessed_at,
  processing_method = EXCLUDED.processing_method,
  limitations = EXCLUDED.limitations;

`
}

sql += `\n-- 2. Insert Locations\n`
for (const loc of locations) {
  sql += `INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  ${escapeSql(loc.id)},
  ${escapeSql(loc.name)},
  ${escapeSql(loc.planetary_body)},
  ${escapeSql(loc.location_role)},
  ${loc.latitude},
  ${loc.longitude},
  ${escapeSql(loc.description)}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

`
}

sql += `\n-- 3. Insert Environmental Features\n`
for (const f of environmentalFeatures) {
  sql += `INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  ${escapeSql(f.id)},
  ${escapeSql(f.location_id)},
  ${escapeSql(f.source_id)},
  ${escapeSql(f.feature_name)},
  ${f.value},
  ${escapeSql(f.unit)},
  ${escapeSql(f.measurement_period)},
  ${escapeSql(f.spatial_resolution)},
  ${escapeSql(f.quality_notes)}
)
ON CONFLICT (id) DO UPDATE SET
  location_id = EXCLUDED.location_id,
  source_id = EXCLUDED.source_id,
  feature_name = EXCLUDED.feature_name,
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

`
}

sql += `COMMIT;\n`

fs.writeFileSync('raw-data/seed_real_scientific_data.sql', sql)
fs.writeFileSync('raw-data/cleaned_standardized_records.json', JSON.stringify({ datasetSources, locations, environmentalFeatures }, null, 2))

console.log('--- Processing Complete ---')
console.log('Dataset Sources created:', datasetSources.length)
console.log('Locations created:', locations.length)
console.log('Environmental Features extracted:', environmentalFeatures.length)
console.log('Output written to:')
console.log('- raw-data/seed_real_scientific_data.sql')
console.log('- raw-data/cleaned_standardized_records.json')
