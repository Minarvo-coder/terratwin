import {
  fetchBatchElevationAndSlope,
  POLAR_SLOPE_EXCLUSION_LAT_DEG,
  SLOPE_METHOD_LABEL,
  STENCIL_DELTA_DEG,
} from "../connectors/elevation-connector.ts"
import {
  fetchBatchNasaPowerClimatology,
} from "../connectors/nasa-power-connector.ts"
import {
  fetchBatchMacrostratGeology,
} from "../connectors/macrostrat-connector.ts"
import {
  DEFAULT_GRID_SPACING_DEG,
  generateDiscoveryGrid,
  GridValidationError,
  HARD_CEILING_MAX_CELLS,
  validateMaxCells,
} from "./grid-generator.ts"
import {
  computeAnalogSimilarity,
} from "../similarity-engine.ts"
import {
  NotFoundError,
  resolveMissionProfile,
  TARGET_ID_ALIASES,
} from "./compare-service.ts"
import { ANALOG_ENVIRONMENT_CATEGORIES } from "../features.ts"
import { discoveryResponseCache } from "../utils/discovery-cache.ts"
import { loadVerifiedLocationsAndFeatures } from "../db/planetary-repository.ts"
import { SAMPLE_TARGETS } from "../sample-dataset.ts"
import type {
  DiscoveryCandidateResult,
  DiscoveryGridCell,
  ProviderTelemetryStatus,
  RegionalDiscoveryRequest,
  RegionalDiscoveryResponse,
} from "../types/discovery.ts"
import type {
  EarthCandidate,
  EnvironmentProfile,
  FeatureProvenance,
  FeatureProvenanceMap,
  PlanetaryTarget,
} from "../types.ts"

const VALID_ANALOG_CATEGORIES = new Set<string>(
  ANALOG_ENVIRONMENT_CATEGORIES.map((category) => category.id)
)

export const DEFAULT_MAX_CANDIDATES = 10
export const HARD_CEILING_MAX_CANDIDATES = 50
const RESPONSE_CACHE_VERSION = "v2"

function validateMaxCandidates(rawMax?: number): number {
  if (rawMax === undefined) {
    return DEFAULT_MAX_CANDIDATES
  }
  if (
    typeof rawMax !== "number" ||
    !Number.isFinite(rawMax) ||
    !Number.isInteger(rawMax) ||
    rawMax < 1 ||
    rawMax > HARD_CEILING_MAX_CANDIDATES
  ) {
    throw new GridValidationError(
      `maxCandidates (${String(rawMax)}) must be an integer between 1 and ${HARD_CEILING_MAX_CANDIDATES}.`
    )
  }
  return rawMax
}

function buildMissingProvenance(unit: string, note: string): FeatureProvenance {
  return {
    status: "no-data",
    dataOrigin: "missing",
    evidenceClassification: "missing_data",
    verificationState: "no-data",
    unit,
    qualityNotes: note,
    isComparable: true,
  }
}

function buildResponseCacheKey(params: {
  targetId: string
  profileId: string
  weights: Record<string, number | undefined>
  boundingBox: [number, number, number, number]
  gridSpacingDeg: number
  maxCells: number
  maxCandidates: number
  category?: string
}): string {
  const canonicalWeights = Object.keys(params.weights)
    .sort()
    .map((key) => [key, params.weights[key] ?? 0])

  return `disc_${RESPONSE_CACHE_VERSION}_${JSON.stringify({
    targetId: params.targetId,
    profileId: params.profileId,
    weights: canonicalWeights,
    boundingBox: params.boundingBox,
    gridSpacingDeg: params.gridSpacingDeg,
    maxCells: params.maxCells,
    maxCandidates: params.maxCandidates,
    category: params.category ?? null,
  })}`
}

/**
 * Executes live regional analog screening across a user-specified bounding box.
 */
export async function executeRegionalDiscovery(
  request: RegionalDiscoveryRequest,
  options: { fetchFn?: typeof fetch; useResponseCache?: boolean } = {}
): Promise<RegionalDiscoveryResponse> {
  const startTime = Date.now()

  // 1. Strict request structure validation
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new GridValidationError("Request body must be a valid JSON object (not an array or primitive).")
  }

  if (!request.targetId || typeof request.targetId !== "string" || request.targetId.trim() === "") {
    throw new GridValidationError("Missing or invalid 'targetId'. Must be a non-empty string.")
  }

  if (!request.missionProfile) {
    throw new GridValidationError("Missing required field 'missionProfile'.")
  }

  if (request.category !== undefined) {
    if (typeof request.category !== "string" || !VALID_ANALOG_CATEGORIES.has(request.category)) {
      throw new GridValidationError(
        `Invalid analog category '${String(request.category)}'. Must be one of: ${Array.from(VALID_ANALOG_CATEGORIES).join(", ")}.`
      )
    }
  }

  const maxCellsAllowed = validateMaxCells(request.maxCells)
  const maxCandidates = validateMaxCandidates(request.maxCandidates)
  const gridSpacingDeg = request.gridSpacingDeg ?? DEFAULT_GRID_SPACING_DEG

  const profile = resolveMissionProfile(request.missionProfile)

  // 2. Resolve planetary target and ensure it is Moon or Mars
  const trimmedTargetId = request.targetId.trim()
  const resolvedTargetId = TARGET_ID_ALIASES[trimmedTargetId] ?? trimmedTargetId
  let target: PlanetaryTarget | undefined

  try {
    const verified = await loadVerifiedLocationsAndFeatures()
    if (verified) {
      target = verified.targets.find(
        (t) =>
          t.id === resolvedTargetId ||
          t.databaseId === resolvedTargetId ||
          t.id === trimmedTargetId ||
          t.databaseId === trimmedTargetId
      )
    }
  } catch {
    // Database unavailable; fall back cleanly to registry sample targets
  }

  if (!target) {
    target = SAMPLE_TARGETS.find(
      (t) => t.id === trimmedTargetId || t.id === resolvedTargetId
    )
  }

  if (!target) {
    throw new NotFoundError(
      `Planetary target '${request.targetId}' not found in verified database or target registry.`
    )
  }

  if (target.body !== "moon" && target.body !== "mars") {
    throw new GridValidationError(
      `Target '${request.targetId}' has body '${String(target.body)}'; regional discovery only compares Earth cells against 'moon' or 'mars' targets.`
    )
  }

  // 3. Validate grid & generate deterministic spatial grid cells upfront
  const cells: DiscoveryGridCell[] = generateDiscoveryGrid({
    boundingBox: request.boundingBox,
    gridSpacingDeg,
    maxCells: maxCellsAllowed,
  })

  // Enable response cache by default in production; allow opt-in during custom mock tests
  const useResponseCache = options.useResponseCache ?? !options.fetchFn
  const responseCacheKey = buildResponseCacheKey({
    targetId: target.id,
    profileId: profile.id,
    weights: profile.weights as Record<string, number | undefined>,
    boundingBox: request.boundingBox,
    gridSpacingDeg,
    maxCells: maxCellsAllowed,
    maxCandidates,
    category: request.category,
  })

  const runLiveScreening = async (): Promise<RegionalDiscoveryResponse> => {
    // 4. Fetch environmental data from connectors concurrently
    const [elevationResult, powerResult, macrostratResult] = await Promise.all([
      fetchBatchElevationAndSlope(cells, { fetchFn: options.fetchFn }),
      fetchBatchNasaPowerClimatology(cells, { fetchFn: options.fetchFn }),
      fetchBatchMacrostratGeology(cells, { fetchFn: options.fetchFn }),
    ])

    const providerStatuses: ProviderTelemetryStatus[] = [
      elevationResult.status,
      powerResult.status,
      macrostratResult.status,
    ]

    // 5. Build normalized candidate records with separated provenance fields
    const candidateResults: DiscoveryCandidateResult[] = []
    let computableCount = 0
    let insufficientCount = 0

    for (const cell of cells) {
      const elev = elevationResult.data.get(cell.id)
      const power = powerResult.data.get(cell.id)
      const macro = macrostratResult.data.get(cell.id)

      const env: EnvironmentProfile = {
        meanSurfaceTempC: power?.meanSurfaceTempC ?? null,
        diurnalTempRangeC: power?.diurnalTempRangeC ?? null,
        annualPrecipitationMm: power?.annualPrecipitationMm ?? null,
        meanSlopeDeg: elev?.meanSlopeDeg ?? null,
        rockAbundancePct: null,
        medianGrainSizeMm: null,
        albedo: null,
        vegetationCoverPct: null,
        lithology: macro?.lithology ?? null,
        elevationM: elev?.elevationM ?? null,
        surfacePressurePa: null,
        surfaceSolarIrradianceWm2: power?.surfaceSolarIrradianceWm2 ?? null,
      }

      const hasElev = elev?.elevationM != null
      const hasSlope = elev?.meanSlopeDeg != null
      const hasTemp = power?.meanSurfaceTempC != null
      const hasDiurnal = power?.diurnalTempRangeC != null
      const hasSolar = power?.surfaceSolarIrradianceWm2 != null
      const hasPrecip = power?.annualPrecipitationMm != null
      const hasLithology = macro?.lithology != null

      const lithologyDetailParts = [
        macro?.mapUnitName ? `Unit: ${macro.mapUnitName}` : null,
        macro?.geologicAge ? `Age: ${macro.geologicAge}` : null,
        macro?.mapScale ? `Scale: ${macro.mapScale}` : null,
        macro?.lithologyConfidence ? `Classifier: ${macro.lithologyConfidence}` : null,
        macro?.rawLithologyText ? `Raw: ${macro.rawLithologyText}` : null,
        macro?.sourceRef ? `Source: ${macro.sourceRef}` : null,
      ].filter(Boolean)

      const provMap: FeatureProvenanceMap = {
        elevationM: {
          status: hasElev ? "unverified" : "no-data",
          dataOrigin: hasElev ? "live-api-estimate" : "missing",
          evidenceClassification: hasElev ? "measured" : "missing_data",
          verificationState: hasElev ? "unverified" : "no-data",
          provider: "Open-Meteo Elevation",
          sourceTitle: "Copernicus DEM GLO-90 (Open-Meteo)",
          sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
          datasetVersion: "Copernicus GLO-90",
          unit: "m",
          spatialResolution: "90 m grid cell",
          qualityNotes: hasElev
            ? "Elevation above EGM2008/geoid datum from Copernicus GLO-90; unverified field point."
            : "Elevation missing from Open-Meteo response.",
          isComparable: true,
        },
        meanSlopeDeg: {
          status: hasSlope ? "unverified" : "no-data",
          dataOrigin: hasSlope ? "computed-derivative" : "missing",
          evidenceClassification: hasSlope ? "derived" : "missing_data",
          verificationState: hasSlope ? "unverified" : "no-data",
          provider: "Open-Meteo Elevation (Derived)",
          sourceTitle: "5-Point Central-Difference Gradient (Copernicus DEM GLO-90)",
          sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
          datasetVersion: "Copernicus GLO-90",
          unit: "°",
          spatialResolution: "Derived from 5-point cardinal central difference over ~445 m baseline (90 m DEM pixels)",
          qualityNotes:
            elev?.slopeQualityNote ??
            "Derived macro-slope across ~445 m central-difference baseline; smooths meter-scale boulders and micro-roughness.",
          isComparable: true,
        },
        meanSurfaceTempC: {
          status: hasTemp ? "unverified" : "no-data",
          dataOrigin: hasTemp ? "live-api-estimate" : "missing",
          evidenceClassification: hasTemp ? "proxy" : "missing_data",
          verificationState: hasTemp ? "unverified" : "no-data",
          provider: "NASA POWER",
          sourceTitle: "NASA POWER Climatology (T2M 2-meter air temp proxy)",
          sourceUrl: power?.sourceUrl ?? "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
          datasetVersion: power?.datasetVersion ?? "v2.10.1",
          measurementPeriod: power?.temporalCoverage ?? "2001-2025",
          unit: "°C",
          spatialResolution: "0.5° × 0.625° (MERRA-2 reanalysis)",
          qualityNotes:
            "25-year annual mean 2-meter air temperature (T2M) used as an atmospheric proxy for bare-ground surface skin temperature.",
          isComparable: true,
        },
        diurnalTempRangeC: {
          status: hasDiurnal ? "unverified" : "no-data",
          dataOrigin: hasDiurnal ? "live-api-estimate" : "missing",
          evidenceClassification: hasDiurnal ? "derived" : "missing_data",
          verificationState: hasDiurnal ? "unverified" : "no-data",
          provider: "NASA POWER",
          sourceTitle: "NASA POWER Climatology (TS_RANGE)",
          sourceUrl: power?.sourceUrl ?? "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
          datasetVersion: power?.datasetVersion ?? "v2.10.1",
          measurementPeriod: power?.temporalCoverage ?? "2001-2025",
          unit: "°C",
          spatialResolution: "0.5° × 0.625° (MERRA-2 reanalysis)",
          qualityNotes: "25-year climatological annual average diurnal earth-skin temperature amplitude.",
          isComparable: true,
        },
        surfaceSolarIrradianceWm2: {
          status: hasSolar ? "unverified" : "no-data",
          dataOrigin: hasSolar ? "computed-derivative" : "missing",
          evidenceClassification: hasSolar ? "derived" : "missing_data",
          verificationState: hasSolar ? "unverified" : "no-data",
          provider: "NASA POWER",
          sourceTitle: "NASA POWER Climatology (ALLSKY_SFC_SW_DWN, 24h mean)",
          sourceUrl: power?.sourceUrl ?? "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
          datasetVersion: power?.datasetVersion ?? "v2.10.1",
          measurementPeriod: power?.temporalCoverage ?? "2001-2025",
          unit: "W/m²",
          originalSourceValue: power?.originalSolarKwhM2Day ?? null,
          originalSourceUnit: "kW-hr/m^2/day",
          spatialResolution: "1.0° × 1.0° (CERES SYN1DEG via NASA POWER)",
          qualityNotes:
            "24-hour climatological average shortwave downward flux (converted from kW-hr/m^2/day); not instantaneous noon peak and not equivalent to lunar polar illumination geometry.",
          isComparable: true,
        },
        annualPrecipitationMm: {
          status: hasPrecip ? "unverified" : "no-data",
          dataOrigin: hasPrecip ? "computed-derivative" : "missing",
          evidenceClassification: hasPrecip ? "derived" : "missing_data",
          verificationState: hasPrecip ? "unverified" : "no-data",
          provider: "NASA POWER",
          sourceTitle: "NASA POWER Climatology (PRECTOTCORR)",
          sourceUrl: power?.sourceUrl ?? "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
          datasetVersion: power?.datasetVersion ?? "v2.10.1",
          measurementPeriod: power?.temporalCoverage ?? "2001-2025",
          unit: "mm/year",
          originalSourceValue: power?.originalPrecipMmDay ?? null,
          originalSourceUnit: "mm/day",
          spatialResolution: "0.5° × 0.625° (MERRA-2 reanalysis)",
          isComparable: false,
          incomparabilityReason:
            "Active terrestrial rainfall/snowfall is physically non-comparable against dry/vacuum Moon and Mars targets.",
        },
        lithology: {
          status: hasLithology ? "unverified" : "no-data",
          dataOrigin: hasLithology ? "live-api-estimate" : "missing",
          evidenceClassification: hasLithology ? "proxy" : "missing_data",
          verificationState: hasLithology ? "unverified" : "no-data",
          provider: "Macrostrat",
          sourceTitle: `Macrostrat (${macro?.mapUnitName || "Regional Map Unit"})`,
          sourceUrl: macro?.sourceUrl ?? "https://macrostrat.org/api/v2/mobile/map_query_v2",
          datasetVersion: "Macrostrat API v2",
          unit: "",
          spatialResolution: "Regional geologic map polygon scale (typically 1:250k–1:5M)",
          qualityNotes:
            lithologyDetailParts.length > 0
              ? lithologyDetailParts.join(" | ")
              : "No deterministically resolvable single lithology unit from Macrostrat.",
          isComparable: true,
        },
        rockAbundancePct: buildMissingProvenance("%", "Meter-scale rock/boulder abundance is unmeasured at regional screening resolution."),
        medianGrainSizeMm: buildMissingProvenance("mm", "Granulometric regolith sieve size requires laboratory or in-situ sieving."),
        albedo: buildMissingProvenance("", "Broadband Bond/hemispherical surface albedo not queried in regional screening tier."),
        vegetationCoverPct: buildMissingProvenance("%", "Fractional vegetation cover excluded from coarse climate/DEM pass."),
        surfacePressurePa: buildMissingProvenance("Pa", "Station atmospheric surface pressure omitted in coarse climatology request."),
      }

      const candidate: EarthCandidate = {
        id: cell.id,
        name: `Candidate Cell ${cell.id.replace("cell_", "")}`,
        country: "Regional Scan",
        latitude: cell.latitude,
        longitude: cell.longitude,
        setting: macro?.mapUnitName
          ? `Regional geology: ${macro.mapUnitName}`
          : "Terrestrial exploratory grid cell",
        summary: `Exploratory candidate cell at (${cell.latitude.toFixed(4)}°, ${cell.longitude.toFixed(4)}°) evaluated via Copernicus DEM, NASA POWER climatology, and Macrostrat.`,
        environment: env,
        provenanceMap: provMap,
        isVerified: false,
        noveltyTier: "live-grid-discovery",
        boundingBox: cell.boundingBox,
        windSpeedMs: power?.windSpeedMs ?? null,
      }

      // 6. Compute similarity using the existing Phase 3/4/6.1 engine
      const evaluation = computeAnalogSimilarity(target, candidate, profile)

      const warnings: string[] = []
      if (!evaluation.isReliable) {
        warnings.push("Data coverage is below 40% threshold for reliable similarity scoring.")
        insufficientCount++
      } else {
        computableCount++
      }

      if (candidate.environment.rockAbundancePct === null) {
        warnings.push("Rock abundance and surface roughness unmeasured at regional resolution.")
      }
      if (macro?.lithologyConfidence === "ambiguous-mixed-unit") {
        warnings.push("Macrostrat geologic unit contains mixed lithologies; lithology kept null to avoid false rock assignment.")
      } else if (macro?.lithologyConfidence === "unmapped-class" && macro.rawLithologyText) {
        warnings.push(`Macrostrat lithology '${macro.rawLithologyText}' falls outside TerraTwin's 7-class taxonomy.`)
      }
      if (elev?.slopeQualityNote) {
        warnings.push(elev.slopeQualityNote)
      }

      candidateResults.push({
        rank: 0,
        candidate,
        score: evaluation.score,
        scoreDisplay: evaluation.scoreDisplay,
        coverage: evaluation.coverage,
        confidence: evaluation.confidence,
        isReliable: evaluation.isReliable,
        weightedDistance: evaluation.weightedDistance,
        missingFeatures: evaluation.missingFeatures,
        incompatibleFeatures: evaluation.incompatibleFeatures,
        featureScores: evaluation.featureScores,
        explanation: `Evaluated ${evaluation.validFeaturesCount} comparable features across ${profile.label} profile (Coverage: ${Math.round(evaluation.coverage * 100)}%).`,
        warnings,
      })
    }

    // 7. Sort candidates reliably
    candidateResults.sort((a, b) => {
      if (a.isReliable && !b.isReliable) return -1
      if (!a.isReliable && b.isReliable) return 1
      if (a.score !== null && b.score !== null) {
        return b.score - a.score || b.coverage - a.coverage
      }
      return b.coverage - a.coverage
    })

    candidateResults.forEach((res, idx) => {
      res.rank = idx + 1
    })

    const slicedCandidates = candidateResults.slice(0, maxCandidates)

    const warnings: string[] = [
      "Regional grid cells represent unverified screening leads for exploration, NOT field-tested planetary analogs.",
      "Copernicus 90 m DEM slopes use a 5-point central-difference gradient across ~445 m and do not resolve meter-scale boulders.",
      "NASA POWER T2M is 2-meter air temperature (~50 km MERRA-2 grid) used as a proxy for surface skin temperature.",
      "NASA POWER ALLSKY_SFC_SW_DWN is converted to a 24-hour climatological mean irradiance flux and is not equivalent to lunar polar illumination geometry.",
    ]
    if (request.category) {
      warnings.push(
        `Requested category '${request.category}' is recorded as advisory search context; live grid cells are unverified regional telemetry polygons and are not auto-classified into curated analog categories.`
      )
    }

    const executionTimeMs = Date.now() - startTime

    return {
      success: true,
      searchMetadata: {
        boundingBox: request.boundingBox,
        targetId: request.targetId,
        missionProfile: profile.label,
        requestedCategory: request.category,
        gridSpacingDeg,
        cellsGenerated: cells.length,
        cellsEvaluated: cells.length,
        maxCellsAllowed,
        responseCacheHit: false,
        scientificMethodology: {
          slopeMethod: SLOPE_METHOD_LABEL,
          slopeStencilDeltaDeg: STENCIL_DELTA_DEG,
          polarExclusionLatDeg: POLAR_SLOPE_EXCLUSION_LAT_DEG,
          nasaPowerPeriod: "2001-2025 Climatology (v2.10.1)",
          temperatureProxyNote: "NASA POWER T2M is 2m air temperature proxy on a 0.5°×0.625° MERRA-2 grid.",
          lithologyClassifierPolicy: "Ambiguous mixed units and ultramafic rocks remain null rather than forcing first-keyword guesses.",
        },
      },
      target,
      missionProfile: {
        id: profile.id,
        label: profile.label,
        summary: profile.summary,
        statusNotice: profile.statusNotice ?? "Mission profile configured for regional discovery.",
        weights: profile.weights,
      },
      providerStatuses,
      totalCellsEvaluated: cells.length,
      computableCandidatesCount: computableCount,
      insufficientDataCandidatesCount: insufficientCount,
      candidates: slicedCandidates,
      warnings,
      executionTimeMs,
    }
  }

  if (!useResponseCache) {
    return runLiveScreening()
  }

  const allProvidersHealthy = (resp: RegionalDiscoveryResponse) =>
    resp.providerStatuses.every((s) => s.status === "success" || s.status === "cached")

  const cachedResult = await discoveryResponseCache.getOrLoad(
    responseCacheKey,
    runLiveScreening,
    undefined,
    allProvidersHealthy,
    { useSharedRedis: !options.fetchFn }
  )

  return {
    ...cachedResult.value,
    searchMetadata: {
      ...cachedResult.value.searchMetadata,
      responseCacheHit: cachedResult.cacheHit,
    },
  }
}
