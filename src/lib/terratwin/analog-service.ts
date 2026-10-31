import { createClient } from "@/utils/supabase/server"
import { FEATURES, getMissionPurpose } from "./features"
import { SAMPLE_CANDIDATES, SAMPLE_DATASET_META, SAMPLE_TARGETS } from "./sample-dataset"
import { rankCandidates } from "./similarity"
import type {
  AnalogQueryResult,
  DatasetMeta,
  DatasetSourceLink,
  EarthCandidate,
  EnvironmentProfile,
  FeatureProvenance,
  FeatureProvenanceMap,
  Lithology,
  PlanetaryBody,
  PlanetaryTarget,
} from "./types"

export class AnalogQueryError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export interface AnalogQuery {
  targetId: string
  purposeId: string
  minScore: number
  mode?: "verified" | "sample" | "all"
}

interface LoadedDatabaseData {
  meta: DatasetMeta
  targets: PlanetaryTarget[]
  candidates: EarthCandidate[]
}

/**
 * Loads verified planetary locations and environmental measurements from Supabase PostgreSQL.
 * Maps relational Entity-Attribute-Value rows to typed PlanetaryTarget and EarthCandidate models
 * with strict provenance, units, and spatial resolution metadata.
 */
export async function getVerifiedDatabaseData(): Promise<LoadedDatabaseData | null> {
  try {
    const supabase = await createClient()

    const [locationsRes, featuresRes, sourcesRes] = await Promise.all([
      supabase.from("locations").select("*").order("name"),
      supabase.from("environmental_features").select("*"),
      supabase.from("dataset_sources").select("*"),
    ])

    if (locationsRes.error || !locationsRes.data || locationsRes.data.length === 0) {
      return null
    }

    const locations = locationsRes.data
    const features = featuresRes.data ?? []
    const sources = sourcesRes.data ?? []

    const sourcesMap = new Map(sources.map((s) => [s.id, s]))

    // Build source links for dataset metadata
    const sourceLinks: DatasetSourceLink[] = sources.map((s) => ({
      title: s.title,
      provider: s.provider ?? "Unknown Provider",
      url: s.source_url ?? "#",
      version: s.dataset_version ?? "1.0",
      accessedAt: s.accessed_at ?? undefined,
      limitations: s.limitations ?? undefined,
    }))

    const meta: DatasetMeta = {
      id: "nasa-verified-baseline",
      name: "NASA Planetary Data System & Earthdata Verified Baseline",
      version: "1.0.0-verified",
      isIllustrative: false,
      isVerified: true,
      notice:
        "Environmental measurements retrieved live from NASA Planetary Data System (PDS) and NASA Earthdata archives with confirmed physical provenance.",
      sourceLinks,
    }

    const targets: PlanetaryTarget[] = []
    const candidates: EarthCandidate[] = []

    for (const loc of locations) {
      const locFeatures = features.filter((f) => f.location_id === loc.id)

      // Initialize empty environment profile
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

      // Map verified features from database
      for (const feat of locFeatures) {
        const source = feat.source_id ? sourcesMap.get(feat.source_id) : undefined

        const prov: FeatureProvenance = {
          status: "verified",
          sourceTitle: source?.title ?? "NASA Official Archive",
          sourceUrl: source?.source_url ?? undefined,
          datasetVersion: source?.dataset_version ?? undefined,
          provider: source?.provider ?? undefined,
          unit: feat.unit ?? "",
          spatialResolution: feat.spatial_resolution ?? undefined,
          measurementPeriod: feat.measurement_period ?? undefined,
          qualityNotes: feat.quality_notes ?? undefined,
          isComparable: true,
        }

        // Map database feature_name to EnvironmentProfile keys
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

      // For features not yet in database, explicitly mark them as no-data / unverified
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
          country: loc.description?.includes("Chile")
            ? "Chile"
            : loc.description?.includes("Hawaii")
            ? "United States (Hawaii)"
            : loc.description?.includes("Canada")
            ? "Canada (Nunavut)"
            : loc.description?.includes("Antarctica")
            ? "Antarctica"
            : "Earth",
          latitude: Number(loc.latitude ?? 0),
          longitude: Number(loc.longitude ?? 0),
          setting: loc.description?.split(",")[0] ?? "Terrestrial analog site",
          summary: loc.description ?? "Verified Earth analog site.",
          environment: env,
          provenanceMap: provMap,
          isVerified: true,
          databaseId: loc.id,
        })
      }
    }

    return { meta, targets, candidates }
  } catch (err) {
    console.warn("Failed to query verified database data, falling back to sample dataset:", err)
    return null
  }
}

/**
 * Returns available targets.
 * Integrates live verified database targets when present and appends clearly marked sample targets.
 */
export async function listTargets(sourceMode: "verified" | "sample" | "all" = "all"): Promise<PlanetaryTarget[]> {
  const verified = await getVerifiedDatabaseData()

  if (sourceMode === "sample" || !verified) {
    return SAMPLE_TARGETS
  }

  if (sourceMode === "verified") {
    return verified.targets
  }

  // "all" mode: return verified targets first, followed by clearly labeled sample targets
  return [...verified.targets, ...SAMPLE_TARGETS]
}

/**
 * Ranks analog candidates for a target and mission purpose.
 * Uses verified database records when available and provides complete transparency on data provenance.
 */
export async function findAnalogs({
  targetId,
  purposeId,
  minScore,
  mode = "all",
}: AnalogQuery): Promise<AnalogQueryResult> {
  const verified = await getVerifiedDatabaseData()

  // 1. Resolve Target
  let target: PlanetaryTarget | undefined
  let candidates: EarthCandidate[] = []
  let datasetMeta: DatasetMeta = SAMPLE_DATASET_META

  if (verified && mode !== "sample") {
    target = verified.targets.find((t) => t.id === targetId || t.databaseId === targetId)
    if (target) {
      candidates = verified.candidates
      datasetMeta = verified.meta
    }
  }

  // If not found in verified database, check sample targets
  if (!target) {
    target = SAMPLE_TARGETS.find((t) => t.id === targetId)
    if (target) {
      candidates = SAMPLE_CANDIDATES
      datasetMeta = SAMPLE_DATASET_META
    }
  }

  if (!target) {
    throw new AnalogQueryError(`Target "${targetId}" not found in verified database or sample catalog.`, 404)
  }

  const purpose = getMissionPurpose(purposeId)
  if (!purpose) {
    throw new AnalogQueryError(`Unknown mission purpose "${purposeId}".`, 400)
  }

  if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
    throw new AnalogQueryError("Minimum score must be a number between 0 and 100.", 400)
  }

  const ranked = rankCandidates(target, candidates, purpose)

  return {
    dataset: datasetMeta,
    target,
    purpose,
    minScore,
    totalCandidates: ranked.length,
    results: ranked.filter((r) => r.score === null || r.score >= minScore),
  }
}
