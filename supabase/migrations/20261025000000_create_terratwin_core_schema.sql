-- ==============================================================================
-- TerraTwin Supabase PostgreSQL Migration
-- Migration Name: 20261025000000_create_terratwin_core_schema.sql
-- Description: Core schema for planetary targets, Earth analog candidate locations,
--              scientific dataset sources, and environmental feature vectors.
-- Note: Does NOT insert any synthetic or placeholder data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: locations
-- Stores celestial targets (Moon, Mars) and candidate terrestrial analog sites (Earth).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    planetary_body TEXT NOT NULL,
    location_role TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Integrity Constraints
    CONSTRAINT chk_planetary_body CHECK (planetary_body IN ('Earth', 'Moon', 'Mars')),
    CONSTRAINT chk_location_role CHECK (location_role IN ('target', 'candidate')),
    CONSTRAINT chk_latitude_range CHECK (latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)),
    CONSTRAINT chk_longitude_range CHECK (longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0))
);

-- ------------------------------------------------------------------------------
-- 2. Table: dataset_sources
-- Stores origin, citations, and sensor limitations for planetary & Earth observation data.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dataset_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    provider TEXT,
    source_url TEXT,
    dataset_version TEXT,
    accessed_at TIMESTAMPTZ,
    processing_method TEXT,
    limitations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. Table: environmental_features
-- Stores individual normalized physical, climatic, and mineralogical measurements.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.environmental_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.dataset_sources(id) ON DELETE SET NULL,
    feature_name TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    measurement_period TEXT,
    spatial_resolution TEXT,
    quality_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Prevent duplicate metric readings from the same source for a location
    CONSTRAINT uq_location_feature_source UNIQUE (location_id, feature_name, source_id)
);

-- ------------------------------------------------------------------------------
-- 4. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_locations_planetary_body ON public.locations(planetary_body);
CREATE INDEX IF NOT EXISTS idx_locations_role ON public.locations(location_role);
CREATE INDEX IF NOT EXISTS idx_environmental_features_location ON public.environmental_features(location_id);
CREATE INDEX IF NOT EXISTS idx_environmental_features_source ON public.environmental_features(source_id);
CREATE INDEX IF NOT EXISTS idx_environmental_features_name ON public.environmental_features(feature_name);

-- ------------------------------------------------------------------------------
-- 5. Schema Comments & Documentation
-- ------------------------------------------------------------------------------
COMMENT ON TABLE public.locations IS 'Catalog of extraterrestrial planetary exploration targets (Moon/Mars) and terrestrial candidate analog sites (Earth).';
COMMENT ON COLUMN public.locations.planetary_body IS 'Host body: Earth, Moon, or Mars.';
COMMENT ON COLUMN public.locations.location_role IS 'Designation: target (destination of exploration) or candidate (terrestrial analog testbed).';
COMMENT ON COLUMN public.locations.latitude IS 'Signed degrees latitude (-90.0 to +90.0). Nullable for sites without single pinpoint coordinates.';
COMMENT ON COLUMN public.locations.longitude IS 'Signed degrees longitude (-180.0 to +180.0). Nullable for sites without single pinpoint coordinates.';

COMMENT ON TABLE public.dataset_sources IS 'Provenance, institutions, and citations for planetary and Earth observation datasets (e.g. USGS, PDS, Copernicus, ESA).';
COMMENT ON COLUMN public.dataset_sources.processing_method IS 'Methodology used to extract or derive the feature values (e.g. kriging, spectral unmixing, raster resampling).';
COMMENT ON COLUMN public.dataset_sources.limitations IS 'Known sensor noise, resolution constraints, seasonal biases, or calibration caveats.';

COMMENT ON TABLE public.environmental_features IS 'Individual scientific parameters (e.g. slope, mean temp, rock abundance, albedo) linked to a location and dataset source.';
COMMENT ON COLUMN public.environmental_features.value IS 'Standardized numeric reading. Nullable if parameter is qualitative or missing from observation.';

-- ------------------------------------------------------------------------------
-- 6. Row Level Security (RLS) & Access Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_features ENABLE ROW LEVEL SECURITY;

-- Read Access: Scientific records are publicly readable by anonymous and authenticated users
CREATE POLICY "Public Read Access for Locations"
    ON public.locations
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public Read Access for Dataset Sources"
    ON public.dataset_sources
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public Read Access for Environmental Features"
    ON public.environmental_features
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Write Access: ANONYMOUS USERS CANNOT INSERT, UPDATE, OR DELETE.
-- Only authenticated users (e.g. signed-in researchers/crew) may insert or update records.
CREATE POLICY "Authenticated Staff Insert Locations"
    ON public.locations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated Staff Update Locations"
    ON public.locations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated Staff Insert Dataset Sources"
    ON public.dataset_sources
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated Staff Update Dataset Sources"
    ON public.dataset_sources
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated Staff Insert Environmental Features"
    ON public.environmental_features
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated Staff Update Environmental Features"
    ON public.environmental_features
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
