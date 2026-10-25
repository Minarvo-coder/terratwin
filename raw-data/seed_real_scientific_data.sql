-- ==============================================================================
-- TerraTwin Real Scientific Data Seed
-- Generated from official NASA PDS & NASA Earthdata Archives
-- ==============================================================================

BEGIN;

-- 1. Insert Dataset Sources
INSERT INTO public.dataset_sources (id, title, provider, source_url, dataset_version, accessed_at, processing_method, limitations)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Mars Global Surveyor MOLA Mission Experiment Gridded Data Record (MEGDR)',
  'NASA Goddard Space Flight Center / PDS Geosciences Node',
  'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megt90n000cb.img',
  'MGS-M-MOLA-5-MEGDR-L3-V1.0 (Product Version 2.0)',
  '2026-10-26T00:47:00Z',
  'Direct binary sampling of 16-bit signed integer big-endian array (720x1440, 4 pix/deg) relative to Mars IAU2000 areoid (GMM3).',
  'Global 4 pix/deg spatial resolution (~14.8 km/pix at equator); equatorial gaps up to 12 km between along-track profiles.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider = EXCLUDED.provider,
  source_url = EXCLUDED.source_url,
  dataset_version = EXCLUDED.dataset_version,
  accessed_at = EXCLUDED.accessed_at,
  processing_method = EXCLUDED.processing_method,
  limitations = EXCLUDED.limitations;

INSERT INTO public.dataset_sources (id, title, provider, source_url, dataset_version, accessed_at, processing_method, limitations)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  'Lunar Reconnaissance Orbiter LOLA Gridded Digital Elevation Model (LDEM_4)',
  'NASA Goddard Space Flight Center / PDS Geosciences Node',
  'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_4.img',
  'LRO-L-LOLA-4-GDR-V1.0 (Product Version V3.0)',
  '2026-10-26T00:48:00Z',
  'Direct binary sampling of 16-bit signed integer little-endian array (720x1440, 4 pix/deg) scaled by factor 0.5 to yield elevation in meters relative to 1737.4 km reference sphere.',
  'Resampled to 4 pix/deg (~7.58 km/pix); GMT surface interpolation used for small profile coverage gaps.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider = EXCLUDED.provider,
  source_url = EXCLUDED.source_url,
  dataset_version = EXCLUDED.dataset_version,
  accessed_at = EXCLUDED.accessed_at,
  processing_method = EXCLUDED.processing_method,
  limitations = EXCLUDED.limitations;

INSERT INTO public.dataset_sources (id, title, provider, source_url, dataset_version, accessed_at, processing_method, limitations)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  'NASA POWER Climatology Native Resolution (Meteorological and Solar)',
  'NASA Langley Research Center (LaRC)',
  'https://power.larc.nasa.gov/api/temporal/climatology/point',
  'POWER Climatology API v2.10.1 (25-year baseline: Jan 2001 - Dec 2025)',
  '2026-10-26T00:48:20Z',
  'REST point query extracting 25-year climatological monthly and annual averages (MERRA-2/SYN1DEG). Converted temperature Celsius to Kelvin (+273.15) and surface pressure kPa to Pa (x1000).',
  'Spatial grid cell resolution ~0.5 x 0.625 degrees (~50 km); represents regional atmospheric reanalysis rather than local micro-meteorological station measurements.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider = EXCLUDED.provider,
  source_url = EXCLUDED.source_url,
  dataset_version = EXCLUDED.dataset_version,
  accessed_at = EXCLUDED.accessed_at,
  processing_method = EXCLUDED.processing_method,
  limitations = EXCLUDED.limitations;


-- 2. Insert Locations
INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'Jezero Crater Delta',
  'Mars',
  'target',
  18.38,
  77.58,
  'Ancient deltaic lake basin landing site of NASA Mars 2020 Perseverance rover, featuring clay and carbonate mineralogy.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'a0000002-0000-4000-8000-000000000002',
  'Gale Crater (Aeolis Mons)',
  'Mars',
  'target',
  -5.36,
  137.86,
  'Layered sedimentary mound landing site of NASA MSL Curiosity rover, recording ancient aqueous transition to hyper-arid regime.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'b0000001-0000-4000-8000-000000000001',
  'Shackleton Crater Rim',
  'Moon',
  'target',
  -89.9,
  0,
  'Lunar South Pole impact crater rim with adjacent permanently shadowed regions (PSRs) exhibiting cryogenic volatile cold traps.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'b0000002-0000-4000-8000-000000000002',
  'Mare Tranquillitatis (Apollo 11)',
  'Moon',
  'target',
  0.67,
  23.47,
  'Equatorial basaltic volcanic plain, classic titanium-rich mare regolith benchmark site from Apollo 11 lunar return samples.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'c0000001-0000-4000-8000-000000000001',
  'Atacama Desert (Yungay Plateau)',
  'Earth',
  'candidate',
  -23.8634,
  -68.2384,
  'Hyper-arid high-UV desert plateau in Chile, premier terrestrial analog for hyper-arid Martian perchlorate and oxidized soils.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'c0000002-0000-4000-8000-000000000002',
  'Mauna Kea Summit Cones',
  'Earth',
  'candidate',
  19.8207,
  -155.4681,
  'High-altitude weathered basaltic tephra cinder cones and palagonitized dust, geomorphic analog for lunar and Martian volcanic terrains.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'c0000003-0000-4000-8000-000000000003',
  'Haughton Impact Structure',
  'Earth',
  'candidate',
  75.3833,
  -89.6833,
  'Devon Island high-arctic impact crater in Nunavut, Canada. Cold-desert permafrost and shatter cone target for polar planetary analogs.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'c0000004-0000-4000-8000-000000000004',
  'McMurdo Dry Valleys',
  'Earth',
  'candidate',
  -77.5,
  162,
  'Antarctic polar ice-free desert exhibiting extreme low humidity, ventifacts, and permafrost polygonal ground comparable to Martian soils.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;


-- 3. Insert Environmental Features
INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'elevation_areoid_datum_m',
  -2651,
  'm',
  '1997-09-15 to 2001-06-30 (MOLA Mapping & Extended Phase)',
  '4 pixels/deg (~14.8 km/pixel)',
  'Sampled directly from binary raster megt90n000cb.img at row 286, col 310. Big-endian signed 16-bit int.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000002',
  'a0000002-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  'elevation_areoid_datum_m',
  -893,
  'm',
  '1997-09-15 to 2001-06-30 (MOLA Mapping & Extended Phase)',
  '4 pixels/deg (~14.8 km/pixel)',
  'Sampled directly from binary raster megt90n000cb.img at row 381, col 551. Big-endian signed 16-bit int.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000003',
  'b0000001-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222',
  'elevation_sphere_datum_m',
  102.5,
  'm',
  '2009-07-13 to 2016-11-29 (LOLA Mission Phases through LRO_ES_52)',
  '4 pixels/deg (~7.58 km/pixel)',
  'Sampled from binary raster ldem_4.img at row 719, col 0. Formula: HEIGHT = DN * 0.5 relative to 1737.4 km sphere.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000004',
  'b0000002-0000-4000-8000-000000000002',
  '22222222-2222-4222-8222-222222222222',
  'elevation_sphere_datum_m',
  -1883,
  'm',
  '2009-07-13 to 2016-11-29 (LOLA Mission Phases through LRO_ES_52)',
  '4 pixels/deg (~7.58 km/pixel)',
  'Sampled from binary raster ldem_4.img at row 357, col 93. Formula: HEIGHT = DN * 0.5 relative to 1737.4 km sphere.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000005',
  'c0000001-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'elevation_geoid_datum_m',
  3409.24,
  'm',
  '2001-01 to 2025-12 Climatological baseline',
  '0.5 x 0.625 deg grid cell',
  'Terrain surface elevation extracted from NASA POWER geometry header for coordinate [-68.2384, -23.8634].'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000006',
  'c0000001-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'mean_annual_temp_k',
  281.98,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M.ANN = 8.83 deg C to Kelvin via K = C + 273.15.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000007',
  'c0000001-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'max_monthly_temp_k',
  301.71,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M_MAX.ANN = 28.56 deg C to Kelvin.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000008',
  'c0000001-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'min_monthly_temp_k',
  262.04,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M_MIN.ANN = -11.11 deg C to Kelvin.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000009',
  'c0000001-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'diurnal_seasonal_temp_swing_k',
  39.67,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Calculated as T2M_MAX.ANN (28.56 C) minus T2M_MIN.ANN (-11.11 C). Delta T in C equals Delta T in K.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000000a',
  'c0000001-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'surface_solar_irradiance_wm2',
  294.68,
  'W/m2',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'All-sky surface downward solar flux raw annual average (ALLSKY_SFC_SW_DWN.ANN).'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000000b',
  'c0000001-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'surface_pressure_pa',
  67860,
  'Pa',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw PS.ANN = 67.86 kPa to Pascals (x1000). NOTE: Atmospheric pressure is flagged unsuitable for direct analog comparison against Mars/Moon.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000000c',
  'c0000002-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'elevation_geoid_datum_m',
  635.57,
  'm',
  '2001-01 to 2025-12 Climatological baseline',
  '0.5 x 0.625 deg grid cell',
  'Terrain surface elevation extracted from NASA POWER geometry header for coordinate [-155.4681, 19.8207].'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000000d',
  'c0000002-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'mean_annual_temp_k',
  294.05,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M.ANN = 20.9 deg C to Kelvin via K = C + 273.15.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000000e',
  'c0000002-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'max_monthly_temp_k',
  301.82,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M_MAX.ANN = 28.67 deg C to Kelvin.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000000f',
  'c0000002-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'min_monthly_temp_k',
  285.9,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M_MIN.ANN = 12.75 deg C to Kelvin.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000010',
  'c0000002-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'diurnal_seasonal_temp_swing_k',
  15.92,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Calculated as T2M_MAX.ANN (28.67 C) minus T2M_MIN.ANN (12.75 C). Delta T in C equals Delta T in K.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000011',
  'c0000002-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'surface_solar_irradiance_wm2',
  220,
  'W/m2',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'All-sky surface downward solar flux raw annual average (ALLSKY_SFC_SW_DWN.ANN).'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000012',
  'c0000002-0000-4000-8000-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'surface_pressure_pa',
  94530,
  'Pa',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw PS.ANN = 94.53 kPa to Pascals (x1000). NOTE: Atmospheric pressure is flagged unsuitable for direct analog comparison against Mars/Moon.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000013',
  'c0000003-0000-4000-8000-000000000003',
  '33333333-3333-4333-8333-333333333333',
  'elevation_geoid_datum_m',
  173.12,
  'm',
  '2001-01 to 2025-12 Climatological baseline',
  '0.5 x 0.625 deg grid cell',
  'Terrain surface elevation extracted from NASA POWER geometry header for coordinate [-89.6833, 75.3833].'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000014',
  'c0000003-0000-4000-8000-000000000003',
  '33333333-3333-4333-8333-333333333333',
  'mean_annual_temp_k',
  258.73,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M.ANN = -14.42 deg C to Kelvin via K = C + 273.15.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000015',
  'c0000003-0000-4000-8000-000000000003',
  '33333333-3333-4333-8333-333333333333',
  'max_monthly_temp_k',
  289.96,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M_MAX.ANN = 16.81 deg C to Kelvin.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000016',
  'c0000003-0000-4000-8000-000000000003',
  '33333333-3333-4333-8333-333333333333',
  'min_monthly_temp_k',
  224.6,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M_MIN.ANN = -48.55 deg C to Kelvin.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000017',
  'c0000003-0000-4000-8000-000000000003',
  '33333333-3333-4333-8333-333333333333',
  'diurnal_seasonal_temp_swing_k',
  65.36,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Calculated as T2M_MAX.ANN (16.81 C) minus T2M_MIN.ANN (-48.55 C). Delta T in C equals Delta T in K.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000018',
  'c0000003-0000-4000-8000-000000000003',
  '33333333-3333-4333-8333-333333333333',
  'surface_solar_irradiance_wm2',
  96.48,
  'W/m2',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'All-sky surface downward solar flux raw annual average (ALLSKY_SFC_SW_DWN.ANN).'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000019',
  'c0000003-0000-4000-8000-000000000003',
  '33333333-3333-4333-8333-333333333333',
  'surface_pressure_pa',
  99060,
  'Pa',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw PS.ANN = 99.06 kPa to Pascals (x1000). NOTE: Atmospheric pressure is flagged unsuitable for direct analog comparison against Mars/Moon.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000001a',
  'c0000004-0000-4000-8000-000000000004',
  '33333333-3333-4333-8333-333333333333',
  'elevation_geoid_datum_m',
  1138.8,
  'm',
  '2001-01 to 2025-12 Climatological baseline',
  '0.5 x 0.625 deg grid cell',
  'Terrain surface elevation extracted from NASA POWER geometry header for coordinate [162, -77.5].'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000001b',
  'c0000004-0000-4000-8000-000000000004',
  '33333333-3333-4333-8333-333333333333',
  'mean_annual_temp_k',
  245.92,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M.ANN = -27.23 deg C to Kelvin via K = C + 273.15.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000001c',
  'c0000004-0000-4000-8000-000000000004',
  '33333333-3333-4333-8333-333333333333',
  'max_monthly_temp_k',
  269.36,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M_MAX.ANN = -3.79 deg C to Kelvin.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000001d',
  'c0000004-0000-4000-8000-000000000004',
  '33333333-3333-4333-8333-333333333333',
  'min_monthly_temp_k',
  221.14,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw T2M_MIN.ANN = -52.01 deg C to Kelvin.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000001e',
  'c0000004-0000-4000-8000-000000000004',
  '33333333-3333-4333-8333-333333333333',
  'diurnal_seasonal_temp_swing_k',
  48.22,
  'K',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Calculated as T2M_MAX.ANN (-3.79 C) minus T2M_MIN.ANN (-52.01 C). Delta T in C equals Delta T in K.'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-00000000001f',
  'c0000004-0000-4000-8000-000000000004',
  '33333333-3333-4333-8333-333333333333',
  'surface_solar_irradiance_wm2',
  124.97,
  'W/m2',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'All-sky surface downward solar flux raw annual average (ALLSKY_SFC_SW_DWN.ANN).'
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

INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-000000000020',
  'c0000004-0000-4000-8000-000000000004',
  '33333333-3333-4333-8333-333333333333',
  'surface_pressure_pa',
  85120,
  'Pa',
  '25-year Climatology (2001-2025)',
  '0.5 x 0.625 deg',
  'Standardized from raw PS.ANN = 85.12 kPa to Pascals (x1000). NOTE: Atmospheric pressure is flagged unsuitable for direct analog comparison against Mars/Moon.'
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

COMMIT;
