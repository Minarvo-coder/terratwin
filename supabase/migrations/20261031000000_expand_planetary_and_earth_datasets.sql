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

COMMIT;
