-- ==============================================================================
-- TerraTwin Supabase PostgreSQL Migration
-- Migration Name: 20261031000000_expand_planetary_and_earth_datasets.sql
-- Description: Expand authoritative NASA/ESA dataset sources and populate verified
--              telemetry for planetary surface barometric pressure, solar irradiance,
--              and correct attribution of MER Opportunity Athena measurements.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Insert Canonical Dataset Sources
-- ------------------------------------------------------------------------------

-- MER Opportunity Athena Science Payload (PDS Geosciences Node)
INSERT INTO public.dataset_sources (id, title, provider, source_url, dataset_version, accessed_at, processing_method, limitations)
VALUES (
  '99999999-9999-4999-8999-999999999999',
  'Mars Exploration Rover Opportunity Athena Science Payload',
  'NASA / JPL-Caltech / Cornell / PDS Geosciences Node',
  'https://pds-geosciences.wustl.edu/missions/mer/',
  'MER2-M-ATHENA-4-GSE-V1.0',
  '2026-10-31T00:00:00Z',
  'In situ Athena science payload measurements at Meridiani Planum: Microscopic Imager (MI) regolith texture, Mossbauer/APXS jarosite and hematite composition, Mini-TES surface thermometry, and Pancam solar optical depth.',
  'Traverse ground point measurements across Eagle, Endurance, and Victoria craters; long-term baseline (2004-2018 sols 1-5111).'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider = EXCLUDED.provider,
  source_url = EXCLUDED.source_url,
  dataset_version = EXCLUDED.dataset_version,
  accessed_at = EXCLUDED.accessed_at,
  processing_method = EXCLUDED.processing_method,
  limitations = EXCLUDED.limitations;

-- Apollo CCGE & LRO LAMP Lunar Exosphere Baseline
INSERT INTO public.dataset_sources (id, title, provider, source_url, dataset_version, accessed_at, processing_method, limitations)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Apollo CCGE & LRO LAMP Lunar Exosphere Baseline',
  'NASA GSFC / LRO LAMP / Apollo Science Archive',
  'https://pds-geosciences.wustl.edu/missions/apollo/apollo_ccge.htm',
  'Apollo-CCGE / LRO-LAMP-EDR-V1.0',
  '2026-10-31T00:00:00Z',
  'Cold cathode gauge pressure measurements and far-ultraviolet spectroscopic exospheric column density observations.',
  'Ultra-high vacuum regime (~3e-10 Pa daytime, ~1e-12 Pa lunar night); dominated by solar wind implantation (He, Ar, Ne).'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider = EXCLUDED.provider,
  source_url = EXCLUDED.source_url,
  dataset_version = EXCLUDED.dataset_version,
  accessed_at = EXCLUDED.accessed_at,
  processing_method = EXCLUDED.processing_method,
  limitations = EXCLUDED.limitations;

-- ------------------------------------------------------------------------------
-- 2. Correct Attribution for Meridiani Planum (MER Opportunity Athena)
-- ------------------------------------------------------------------------------
UPDATE public.environmental_features
SET source_id = '99999999-9999-4999-8999-999999999999'
WHERE location_id = 'a0000003-0000-4000-8000-000000000003'
  AND source_id = '44444444-4444-4444-8444-444444444444';

-- ------------------------------------------------------------------------------
-- 3. Populate Surface Pressure Telemetry (surface_pressure_pa)
-- ------------------------------------------------------------------------------

-- Gale Crater (MSL Curiosity REMS)
INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-0000000000e1',
  'a0000002-0000-4000-8000-000000000002',
  '44444444-4444-4444-8444-444444444444',
  'surface_pressure_pa',
  840,
  'Pa',
  '2012-08 to 2022-08 (MSL REMS Sols 0-3500)',
  'In situ rover traverse point',
  'In situ barometric pressure sensor on MSL rover mast; 10-year mean ~840 Pa with seasonal CO2 sublimation cycle amplitude of ~190 Pa. Not comparable to Earth 101,325 Pa.'
)
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

-- Jezero Crater (M2020 Perseverance MEDA)
INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-0000000000e2',
  'a0000001-0000-4000-8000-000000000001',
  '55555555-5555-4555-8555-555555555555',
  'surface_pressure_pa',
  750,
  'Pa',
  '2021-02 to 2024-10 (Perseverance MEDA)',
  'In situ rover traverse point',
  'In situ pressure sensor (MEDA PRS) recording atmospheric pressure continuous diurnal cycle with dust devil signatures. Not comparable to Earth 101,325 Pa.'
)
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

-- Meridiani Planum (MER Opportunity Athena Baseline)
INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-0000000000e3',
  'a0000003-0000-4000-8000-000000000003',
  '99999999-9999-4999-8999-999999999999',
  'surface_pressure_pa',
  730,
  'Pa',
  '2004-2018 (MER Opportunity baseline)',
  'Equatorial landing plain (-1.94° N, -5.53° E)',
  'Surface barometric pressure derived from MOLA elevation datum (-1420 m) and atmospheric scale height models. Not comparable to Earth 101,325 Pa.'
)
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

-- Shackleton Crater Rim (Apollo / LRO Exosphere Baseline)
INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-0000000000e4',
  'b0000001-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'surface_pressure_pa',
  0.0000000003,
  'Pa',
  'Apollo Cold Cathode Gauge / LRO LAMP exosphere observations',
  'Planetary lunar exosphere',
  'Ultra-high vacuum regime (~3e-10 Pa daytime, ~1e-12 Pa lunar night). Incompatible with terrestrial barometric pressure scale.'
)
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

-- Mare Tranquillitatis (Apollo 11 / LRO Exosphere Baseline)
INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES (
  'f0000000-0000-4000-8000-0000000000e5',
  'b0000002-0000-4000-8000-000000000002',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'surface_pressure_pa',
  0.0000000003,
  'Pa',
  'Apollo 11 / Apollo 14 CCGE / LRO LAMP observations',
  'Planetary lunar exosphere',
  'Ultra-high vacuum regime (~3e-10 Pa). Incompatible with terrestrial barometric pressure scale.'
)
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

-- ------------------------------------------------------------------------------
-- 4. Insert Phase 3 Expanded Earth Analog Locations
-- ------------------------------------------------------------------------------

-- Lake Salda (Turkey)
INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'c0000005-0000-4000-8000-000000000005',
  'Lake Salda (Stromatalites & Hydromagnesite)',
  'Earth',
  'candidate',
  37.550000,
  29.680000,
  'Deep alkaline hydromagnesite microbialite lake in Burdur, Turkey. Premier Earth analog for Jezero Crater delta carbonates and fossilized microbial biosignatures.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

-- Craters of the Moon (USA)
INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'c0000006-0000-4000-8000-000000000006',
  'Craters of the Moon National Monument',
  'Earth',
  'candidate',
  43.460000,
  -113.560000,
  'Holocene basaltic lava plain and cinder cone complex in Idaho, USA. Apollo astronaut training ground and prime operational analog for lunar mare terrain and lava tube exploration.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

-- Askja Caldera & Holuhraun Lava Field (Iceland)
INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'c0000007-0000-4000-8000-000000000007',
  'Askja Caldera & Holuhraun Lava Field',
  'Earth',
  'candidate',
  64.900000,
  -16.830000,
  'Subarctic basaltic caldera and fresh 2014-2015 flood basalt field in Iceland. Historic Apollo 11/15/17 lunar geology field site featuring unweathered basalt sands and zero vegetation.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

-- Río Tinto Acidic Basin (Spain)
INSERT INTO public.locations (id, name, planetary_body, location_role, latitude, longitude, description)
VALUES (
  'c0000008-0000-4000-8000-000000000008',
  'Río Tinto Acidic Basin',
  'Earth',
  'candidate',
  37.700000,
  -6.550000,
  'Hyper-acidic (pH ~2) iron- and sulfate-rich river basin in Spain. Premier terrestrial analog for Meridiani Planum jarosite evaporites, hematite spherules, and subsurface extremophile life.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  planetary_body = EXCLUDED.planetary_body,
  location_role = EXCLUDED.location_role,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 5. Insert Environmental Features for Expanded Earth Analogs
-- ------------------------------------------------------------------------------

-- Features for Lake Salda (c0000005)
INSERT INTO public.environmental_features (location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES
  ('c0000005-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', 'mean_surface_temp_c', 12.5, NULL, '°C', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER 25-yr mean surface skin temperature'),
  ('c0000005-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', 'diurnal_temp_range_c', 14.0, NULL, '°C', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER diurnal thermal swing'),
  ('c0000005-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', 'annual_precipitation_mm', 435, NULL, 'mm/yr', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER annual precipitation in Burdur closed basin'),
  ('c0000005-0000-4000-8000-000000000005', '77777777-7777-4777-8777-777777777777', 'mean_slope_deg', 6.5, NULL, '°', 'Copernicus GLO-30', '30 meters', 'Topographic gradient across lake shoreline and lacustrine terraces'),
  ('c0000005-0000-4000-8000-000000000005', '88888888-8888-4888-8888-888888888888', 'rock_abundance_pct', 12, NULL, '%', 'Landsat 8/9 & field survey', '30 m satellite / local ground transects', 'Hydromagnesite microbialite platforms and limestone blocks'),
  ('c0000005-0000-4000-8000-000000000005', '88888888-8888-4888-8888-888888888888', 'median_grain_size_mm', 0.45, NULL, 'mm', 'Sedimentological sieving', 'Core samples', 'Hydromagnesite sand and fine carbonate-bearing deltaic silt'),
  ('c0000005-0000-4000-8000-000000000005', '88888888-8888-4888-8888-888888888888', 'surface_albedo', 0.28, NULL, '', 'MODIS MOD09GA Collection 6.1', '500 meters', 'High-reflectance white hydromagnesite beaches'),
  ('c0000005-0000-4000-8000-000000000005', '88888888-8888-4888-8888-888888888888', 'vegetation_cover_pct', 10, NULL, '%', 'MODIS NDVI Collection 6.1', '250 m', 'Sparse Mediterranean macrophyte scrub and pine on ridges'),
  ('c0000005-0000-4000-8000-000000000005', '88888888-8888-4888-8888-888888888888', 'dominant_lithology', NULL, 'clay-sedimentary', '', 'MTA geological mapping', 'Field XRD/XRF', 'Lithology class: clay-sedimentary. Hydromagnesite microbialites matching Jezero delta carbonates'),
  ('c0000005-0000-4000-8000-000000000005', '77777777-7777-4777-8777-777777777777', 'elevation_geoid_datum_m', 1193, NULL, 'm', 'Copernicus GLO-30', '30 meters', 'Lake water level relative to EGM96 geoid. Datum: Earth EGM96 Geoid / Mean Sea Level (SRTMGL1 / Copernicus GLO-30).'),
  ('c0000005-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', 'surface_pressure_pa', 88200, NULL, 'Pa', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER 25-yr mean barometric pressure at 1193 m altitude'),
  ('c0000005-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', 'surface_solar_irradiance_wm2', 210, NULL, 'W/m²', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER all-sky surface downward solar flux')
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

-- Features for Craters of the Moon (c0000006)
INSERT INTO public.environmental_features (location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES
  ('c0000006-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 'mean_surface_temp_c', 6.2, NULL, '°C', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER 25-yr mean surface skin temperature'),
  ('c0000006-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 'diurnal_temp_range_c', 17.5, NULL, '°C', '2001-2025 climatology', '0.5° × 0.625°', 'High-elevation continental desert diurnal thermal swing'),
  ('c0000006-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 'annual_precipitation_mm', 385, NULL, 'mm/yr', '2001-2025 climatology', '0.5° × 0.625°', 'Combined rain and snow precipitation equivalent'),
  ('c0000006-0000-4000-8000-000000000006', '77777777-7777-4777-8777-777777777777', 'mean_slope_deg', 5.0, NULL, '°', 'SRTMGL1 / USGS 3DEP', '30 meters', 'Regional slope across Great Rift volcanic fissures and lava plains'),
  ('c0000006-0000-4000-8000-000000000006', '88888888-8888-4888-8888-888888888888', 'rock_abundance_pct', 42, NULL, '%', 'USGS Geological Map & Apollo field notes', 'Local transects / 30 m satellite', 'Extremely rough aa and slabby pahoehoe lava flows'),
  ('c0000006-0000-4000-8000-000000000006', '88888888-8888-4888-8888-888888888888', 'median_grain_size_mm', 0.20, NULL, 'mm', 'USGS sieve granulometry', 'Cinder field samples', 'Basaltic cinder and volcanic ash'),
  ('c0000006-0000-4000-8000-000000000006', '88888888-8888-4888-8888-888888888888', 'surface_albedo', 0.09, NULL, '', 'MODIS MOD09GA Collection 6.1', '500 meters', 'Dark tholeiitic basalt lava reflectance'),
  ('c0000006-0000-4000-8000-000000000006', '88888888-8888-4888-8888-888888888888', 'vegetation_cover_pct', 6, NULL, '%', 'MODIS NDVI Collection 6.1', '250 m', 'Sparse pioneering sagebrush and dwarf limber pine'),
  ('c0000006-0000-4000-8000-000000000006', '88888888-8888-4888-8888-888888888888', 'dominant_lithology', NULL, 'basaltic', '', 'USGS Scientific Investigations Map 3000', 'Bedrock mapping', 'Lithology class: basaltic. Quaternary olivine tholeiite basalt flows matching lunar mare regolith'),
  ('c0000006-0000-4000-8000-000000000006', '77777777-7777-4777-8777-777777777777', 'elevation_geoid_datum_m', 1805, NULL, 'm', 'SRTMGL1', '30 meters', 'Elevation relative to Earth EGM96 Geoid / Mean Sea Level (SRTMGL1 / Copernicus GLO-30).'),
  ('c0000006-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 'surface_pressure_pa', 82100, NULL, 'Pa', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER 25-yr mean barometric pressure at 1805 m altitude'),
  ('c0000006-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 'surface_solar_irradiance_wm2', 195, NULL, 'W/m²', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER all-sky surface downward solar flux')
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

-- Features for Askja Caldera & Holuhraun (c0000007)
INSERT INTO public.environmental_features (location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES
  ('c0000007-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 'mean_surface_temp_c', -1.2, NULL, '°C', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER 25-yr subarctic highland mean temperature'),
  ('c0000007-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 'diurnal_temp_range_c', 8.5, NULL, '°C', '2001-2025 climatology', '0.5° × 0.625°', 'Maritime-moderated subarctic diurnal thermal swing'),
  ('c0000007-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 'annual_precipitation_mm', 450, NULL, 'mm/yr', '2001-2025 climatology', '0.5° × 0.625°', 'Subarctic volcanic desert rain and snow equivalent'),
  ('c0000007-0000-4000-8000-000000000007', '77777777-7777-4777-8777-777777777777', 'mean_slope_deg', 4.0, NULL, '°', 'Copernicus GLO-30', '30 meters', 'Gentle gradients across Holuhraun flood basalt plain'),
  ('c0000007-0000-4000-8000-000000000007', '88888888-8888-4888-8888-888888888888', 'rock_abundance_pct', 38, NULL, '%', 'Univ. of Iceland field survey', 'Field camera transects', 'High rock cover of vesicular basalt blocks and aa margins'),
  ('c0000007-0000-4000-8000-000000000007', '88888888-8888-4888-8888-888888888888', 'median_grain_size_mm', 0.35, NULL, 'mm', 'Tephrochronology sieve granulometry', 'Tephra samples', 'Unweathered black basalt sand and eolian tephra'),
  ('c0000007-0000-4000-8000-000000000007', '88888888-8888-4888-8888-888888888888', 'surface_albedo', 0.08, NULL, '', 'MODIS MOD09GA Collection 6.1', '500 meters', 'Ultra-low reflectance of fresh unoxidized tholeiitic basalt'),
  ('c0000007-0000-4000-8000-000000000007', '88888888-8888-4888-8888-888888888888', 'vegetation_cover_pct', 0, NULL, '%', 'MODIS NDVI Collection 6.1', '250 m', 'Zero vascular plant cover in subarctic highland volcanic desert'),
  ('c0000007-0000-4000-8000-000000000007', '88888888-8888-4888-8888-888888888888', 'dominant_lithology', NULL, 'basaltic', '', 'Icelandic Institute of Natural History', 'Geological map', 'Lithology class: basaltic. Fresh sub-recent tholeiite flood basalts'),
  ('c0000007-0000-4000-8000-000000000007', '77777777-7777-4777-8777-777777777777', 'elevation_geoid_datum_m', 1100, NULL, 'm', 'Copernicus GLO-30', '30 meters', 'Central plateau elevation relative to Earth EGM96 Geoid / Mean Sea Level (SRTMGL1 / Copernicus GLO-30).'),
  ('c0000007-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 'surface_pressure_pa', 88500, NULL, 'Pa', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER 25-yr mean barometric pressure at 1100 m altitude'),
  ('c0000007-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 'surface_solar_irradiance_wm2', 105, NULL, 'W/m²', '2001-2025 climatology', '0.5° × 0.625°', 'High-latitude cloud-attenuated annual downward solar flux')
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

-- Features for Río Tinto (c0000008)
INSERT INTO public.environmental_features (location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES
  ('c0000008-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', 'mean_surface_temp_c', 17.8, NULL, '°C', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER 25-yr warm Mediterranean mean skin temperature'),
  ('c0000008-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', 'diurnal_temp_range_c', 13.5, NULL, '°C', '2001-2025 climatology', '0.5° × 0.625°', 'Diurnal surface ground thermal range'),
  ('c0000008-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', 'annual_precipitation_mm', 650, NULL, 'mm/yr', '2001-2025 climatology', '0.5° × 0.625°', 'Mediterranean winter-dominated annual rainfall'),
  ('c0000008-0000-4000-8000-000000000008', '77777777-7777-4777-8777-777777777777', 'mean_slope_deg', 8.5, NULL, '°', 'Copernicus GLO-30 / SRTMGL1', '30 meters', 'Topographic gradient across incised river valley flanks and terraces'),
  ('c0000008-0000-4000-8000-000000000008', '88888888-8888-4888-8888-888888888888', 'rock_abundance_pct', 16, NULL, '%', 'MARTE & CSIC analog reports', 'Field photographic transects', 'Iron-oxide cemented conglomerate terraces and gossan boulders'),
  ('c0000008-0000-4000-8000-000000000008', '88888888-8888-4888-8888-888888888888', 'median_grain_size_mm', 0.80, NULL, 'mm', 'CSIC-INTA sediment analysis', 'Evaporite terrace samples', 'Jarosite, schwertmannite, and quartz sand with ferruginous matrix'),
  ('c0000008-0000-4000-8000-000000000008', '88888888-8888-4888-8888-888888888888', 'surface_albedo', 0.22, NULL, '', 'MODIS MOD09GA Collection 6.1', '500 meters', 'Surface reflectance over bright yellow jarosite and red-ochre hematite terraces'),
  ('c0000008-0000-4000-8000-000000000008', '88888888-8888-4888-8888-888888888888', 'vegetation_cover_pct', 18, NULL, '%', 'MODIS NDVI Collection 6.1', '250 m', 'Riparian active riverbed is sterile (0%); peripheral valley slopes have sparse scrub (~18%)'),
  ('c0000008-0000-4000-8000-000000000008', '88888888-8888-4888-8888-888888888888', 'dominant_lithology', NULL, 'sulfate-evaporite', '', 'IGME Geological Map 1:50,000', 'Regional quadrangle mapping', 'Lithology class: sulfate-evaporite. Jarosite, goethite, and hematite evaporitic sediments'),
  ('c0000008-0000-4000-8000-000000000008', '77777777-7777-4777-8777-777777777777', 'elevation_geoid_datum_m', 310, NULL, 'm', 'SRTMGL1', '30 meters', 'River terrace elevation relative to Earth EGM96 Geoid / Mean Sea Level (SRTMGL1 / Copernicus GLO-30).'),
  ('c0000008-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', 'surface_pressure_pa', 98200, NULL, 'Pa', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER 25-yr mean barometric pressure at 310 m altitude'),
  ('c0000008-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', 'surface_solar_irradiance_wm2', 215, NULL, 'W/m²', '2001-2025 climatology', '0.5° × 0.625°', 'NASA POWER all-sky annual mean solar irradiance')
ON CONFLICT (location_id, feature_name, source_id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;

COMMIT;

