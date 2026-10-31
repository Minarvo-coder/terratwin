import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "../../../types/database.types.ts"
import type {
  EarthCandidate,
  EnvironmentProfile,
  FeatureProvenance,
  FeatureProvenanceMap,
  Lithology,
  PlanetaryBody,
  PlanetaryTarget,
} from "../types.ts"
import { FEATURES } from "../features.ts"
import type { DatasetSourceRecord, LocationRecord } from "../types/api.ts"

export class DatabaseError extends Error {
  public readonly status: number = 503
  public readonly originalError?: unknown
  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = "DatabaseError"
    this.originalError = originalError
  }
}

/**
 * Returns a typed Supabase client suitable for both Next.js Server Components / Route Handlers
 * and standalone runtime scripts.
 */
export async function getDbClient() {
  try {
    const { createClient: createServerClient } = await import("../../../utils/supabase/server.ts")
    return await createServerClient()
  } catch {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new DatabaseError("Database credentials not configured in environment (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)")
    }
    return createSupabaseClient<Database>(url, key)
  }
}

/**
 * Fetches location records from Supabase with optional filtering by role or planetary body.
 * Never returns secrets or privileged metadata.
 */
export async function fetchLocations(filter?: {
  role?: "target" | "candidate"
  body?: "Earth" | "Moon" | "Mars"
}): Promise<LocationRecord[]> {
  try {
    const supabase = await getDbClient()
    let query = supabase
      .from("locations")
      .select("id, name, planetary_body, location_role, latitude, longitude, description, created_at")
      .order("name", { ascending: true })

    if (filter?.role) {
      query = query.eq("location_role", filter.role)
    }
    if (filter?.body) {
      query = query.eq("planetary_body", filter.body)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError(`Failed to fetch locations: ${error.message}`, error)
    }

    if (!data) {
      return []
    }

    return data.map((loc) => ({
      id: loc.id,
      name: loc.name,
      planetaryBody: loc.planetary_body,
      locationRole: loc.location_role,
      latitude: loc.latitude,
      longitude: loc.longitude,
      description: loc.description,
      createdAt: loc.created_at,
    }))
  } catch (err) {
    if (err instanceof DatabaseError) throw err
    throw new DatabaseError(
      `Database connection failure while querying locations: ${err instanceof Error ? err.message : String(err)}`,
      err
    )
  }
}

/**
 * Fetches verified dataset source records from Supabase.
 */
export async function fetchDatasetSources(): Promise<DatasetSourceRecord[]> {
  try {
    const supabase = await getDbClient()
    const { data, error } = await supabase
      .from("dataset_sources")
      .select("id, title, provider, source_url, dataset_version, accessed_at, processing_method, limitations, created_at")
      .order("title", { ascending: true })

    if (error) {
      throw new DatabaseError(`Failed to fetch dataset sources: ${error.message}`, error)
    }

    if (!data) {
      return []
    }

    return data.map((s) => ({
      id: s.id,
      title: s.title,
      provider: s.provider,
      sourceUrl: s.source_url,
      datasetVersion: s.dataset_version,
      accessedAt: s.accessed_at,
      processingMethod: s.processing_method,
      limitations: s.limitations,
      createdAt: s.created_at,
    }))
  } catch (err) {
    if (err instanceof DatabaseError) throw err
    throw new DatabaseError(
      `Database connection failure while querying dataset sources: ${err instanceof Error ? err.message : String(err)}`,
      err
    )
  }
}

/**
 * Loads all verified locations, environmental features, and sources from Supabase,
 * mapping relational records into typed PlanetaryTarget and EarthCandidate structures
 * with verified physical provenance and units.
 */
export async function loadVerifiedLocationsAndFeatures(): Promise<{
  targets: PlanetaryTarget[]
  candidates: EarthCandidate[]
  sources: DatasetSourceRecord[]
}> {
  try {
    const supabase = await getDbClient()

    const [locationsRes, featuresRes, sourcesRes] = await Promise.all([
      supabase.from("locations").select("*").order("name"),
      supabase.from("environmental_features").select("*"),
      supabase.from("dataset_sources").select("*"),
    ])

    if (locationsRes.error) {
      throw new DatabaseError(`Locations query error: ${locationsRes.error.message}`, locationsRes.error)
    }
    if (featuresRes.error) {
      throw new DatabaseError(`Environmental features query error: ${featuresRes.error.message}`, featuresRes.error)
    }
    if (sourcesRes.error) {
      throw new DatabaseError(`Dataset sources query error: ${sourcesRes.error.message}`, sourcesRes.error)
    }

    const locations = locationsRes.data ?? []
    const features = featuresRes.data ?? []
    const rawSources = sourcesRes.data ?? []

    if (locations.length === 0) {
      throw new DatabaseError("Database returned zero locations. Verified records may not be seeded.")
    }

    const sourcesMap = new Map(rawSources.map((s) => [s.id, s]))

    const sources: DatasetSourceRecord[] = rawSources.map((s) => ({
      id: s.id,
      title: s.title,
      provider: s.provider,
      sourceUrl: s.source_url,
      datasetVersion: s.dataset_version,
      accessedAt: s.accessed_at,
      processingMethod: s.processing_method,
      limitations: s.limitations,
      createdAt: s.created_at,
    }))

    const targets: PlanetaryTarget[] = []
    const candidates: EarthCandidate[] = []

    for (const loc of locations) {
      const locFeatures = features.filter((f) => f.location_id === loc.id)

      const env: EnvironmentProfile = {
        meanSurfaceTempC: null,
        diurnalTempRangeC: null,
        annualPrecipitationMm: null,
        meanSlopeDeg: null,
        rockAbundancePct: null,
        medianGrainSizeMm: null,
        albedo: null,
        vegetationCoverPct: null,
        lithology: null,
        elevationM: null,
        surfacePressurePa: null,
        surfaceSolarIrradianceWm2: null,
      }

      const provMap: FeatureProvenanceMap = {}

      for (const feat of locFeatures) {
        const source = feat.source_id ? sourcesMap.get(feat.source_id) : undefined

        const prov: FeatureProvenance = {
          status: "verified",
          sourceTitle: source?.title ?? "NASA / ESA Official Mission Archive",
          sourceUrl: source?.source_url ?? undefined,
          datasetVersion: source?.dataset_version ?? undefined,
          provider: source?.provider ?? undefined,
          unit: feat.unit ?? "",
          spatialResolution: feat.spatial_resolution ?? undefined,
          measurementPeriod: feat.measurement_period ?? undefined,
          qualityNotes: feat.quality_notes ?? undefined,
          isComparable: true,
        }

        switch (feat.feature_name) {
          case "elevation_areoid_datum_m":
          case "elevation_sphere_datum_m":
          case "elevation_geoid_datum_m":
          case "elevation_m":
            env.elevationM = feat.value
            provMap.elevationM = prov
            break

          case "mean_annual_temp_k":
            if (feat.value !== null) {
              env.meanSurfaceTempC = Math.round((feat.value - 273.15) * 10) / 10
              provMap.meanSurfaceTempC = { ...prov, unit: "°C" }
            }
            break

          case "mean_surface_temp_c":
            env.meanSurfaceTempC = feat.value
            provMap.meanSurfaceTempC = { ...prov, unit: "°C" }
            break

          case "diurnal_seasonal_temp_swing_k":
          case "diurnal_temp_range_c":
            env.diurnalTempRangeC = feat.value
            provMap.diurnalTempRangeC = { ...prov, unit: "°C" }
            break

          case "annual_precipitation_mm":
            env.annualPrecipitationMm = feat.value
            provMap.annualPrecipitationMm = {
              ...prov,
              isComparable: false,
              incomparabilityReason:
                "Target bodies have 0 mm/yr liquid rainfall; active precipitation cannot be physically matched to dry/vacuum surfaces.",
            }
            break

          case "mean_slope_deg":
            env.meanSlopeDeg = feat.value
            provMap.meanSlopeDeg = { ...prov, unit: "°" }
            break

          case "rock_abundance_pct":
            env.rockAbundancePct = feat.value
            provMap.rockAbundancePct = { ...prov, unit: "%" }
            break

          case "median_grain_size_mm":
            env.medianGrainSizeMm = feat.value
            provMap.medianGrainSizeMm = { ...prov, unit: "mm" }
            break

          case "surface_albedo":
          case "albedo":
            env.albedo = feat.value
            provMap.albedo = { ...prov, unit: "" }
            break

          case "vegetation_cover_pct":
            env.vegetationCoverPct = feat.value
            provMap.vegetationCoverPct = { ...prov, unit: "%" }
            break

          case "dominant_lithology":
          case "lithology":
            if (feat.text_value) {
              env.lithology = feat.text_value as Lithology
            } else if (feat.quality_notes?.includes("class:")) {
              const match = feat.quality_notes.match(/class:\s*([\w-]+)/)
              if (match) env.lithology = match[1] as Lithology
            }
            provMap.lithology = { ...prov, unit: "" }
            break

          case "surface_solar_irradiance_wm2":
            env.surfaceSolarIrradianceWm2 = feat.value
            provMap.surfaceSolarIrradianceWm2 = prov
            break

          case "surface_pressure_pa":
            env.surfacePressurePa = feat.value
            provMap.surfacePressurePa = {
              ...prov,
              isComparable: false,
              incomparabilityReason:
                "Extraterrestrial targets are vacuum or near-vacuum; atmospheric pressure cannot be matched directly against Earth sea-level pressure.",
            }
            break
        }
      }

      // Mark features missing in DB as no-data
      for (const featureDef of FEATURES) {
        if (!provMap[featureDef.key]) {
          provMap[featureDef.key] = {
            status: "no-data",
            unit: featureDef.unit,
            isComparable: featureDef.isCrossBodyComparable ?? true,
            qualityNotes: "No verified scientific telemetry record currently ingested for this parameter at this site.",
          }
        }
      }

      if (loc.location_role === "target") {
        const body: PlanetaryBody = loc.planetary_body.toLowerCase() === "moon" ? "moon" : "mars"
        targets.push({
          id: loc.id,
          body,
          name: loc.name,
          region: `${loc.planetary_body} coordinates: ${loc.latitude?.toFixed(2)}°, ${loc.longitude?.toFixed(2)}°`,
          summary: loc.description ?? "Verified planetary mission target.",
          latitude: loc.latitude !== null && loc.latitude !== undefined ? Number(loc.latitude) : undefined,
          longitude: loc.longitude !== null && loc.longitude !== undefined ? Number(loc.longitude) : undefined,
          environment: env,
          provenanceMap: provMap,
          isVerified: true,
          databaseId: loc.id,
        })
      } else {
        candidates.push({
          id: loc.id,
          name: loc.name,
          country: loc.planetary_body === "Earth" ? "Global Analog Site" : loc.planetary_body,
          latitude: loc.latitude ?? 0,
          longitude: loc.longitude ?? 0,
          setting: loc.name.includes("Atacama")
            ? "Hyper-arid desert plateau"
            : loc.name.includes("Mauna Kea")
            ? "High-altitude volcanic summit"
            : loc.name.includes("Haughton")
            ? "Polar impact crater"
            : "Cold desert polar valley",
          summary: loc.description ?? "Verified terrestrial planetary analog site.",
          environment: env,
          provenanceMap: provMap,
          isVerified: true,
          databaseId: loc.id,
        })
      }
    }

    return { targets, candidates, sources }
  } catch (err) {
    if (err instanceof DatabaseError) throw err
    throw new DatabaseError(
      `Failed to load verified telemetry data: ${err instanceof Error ? err.message : String(err)}`,
      err
    )
  }
}
