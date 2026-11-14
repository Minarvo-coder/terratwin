import { elevationCache, type ElevationCacheRecord } from "../utils/discovery-cache.ts"
import { fetchWithRetry } from "../utils/fetch-retry.ts"
import type { ProviderTelemetryStatus } from "../types/discovery.ts"

export interface CellElevationData {
  elevationM: number | null
  meanSlopeDeg: number | null
  slopeMethod?: string
  slopeQualityNote?: string
}

export interface ElevationBatchResult {
  data: Map<string, CellElevationData>
  status: ProviderTelemetryStatus
}

export interface CentralDifferenceSlopeInput {
  lat0: number
  deltaLatNSDeg: number
  deltaLonEWDeg: number
  zN: number | null | undefined
  zS: number | null | undefined
  zE: number | null | undefined
  zW: number | null | undefined
}

const EARTH_RADIUS_M = 6371000
export const STENCIL_DELTA_DEG = 0.002 // ~222 m half-span (~445 m total stencil baseline)
export const POLAR_SLOPE_EXCLUSION_LAT_DEG = 89.5
export const MAX_CELLS_PER_OPEN_METEO_BATCH = 20
export const SLOPE_METHOD_LABEL = "5-point central-difference gradient (4 cardinal neighbors)"

const inFlightElevationByKey = new Map<string, Promise<ElevationCacheRecord>>()

/**
 * Wraps longitude into canonical [-180, 180] WGS84 decimal degrees.
 */
export function wrapLongitudeDeg(lon: number): number {
  let wrapped = ((lon + 180) % 360 + 360) % 360 - 180
  if (wrapped === -180 && lon > 0) {
    wrapped = 180
  }
  return Object.is(wrapped, -0) ? 0 : wrapped
}

/**
 * Computes local topographic terrain slope (in degrees) using a 5-point central-difference
 * gradient across North/South/East/West neighbor elevations around the center point.
 *
 * Scientific limitations:
 * - Derived from a ~445 m total finite-difference baseline across 90 m DEM pixels; smooths
 *   sub-100 m roughness, local cliffs, and crater-wall micro-topography.
 * - Excludes extreme polar latitudes (|lat| > 89.5 deg) where meridian convergence distorts
 *   rectangular finite-difference spacing.
 */
export function computeCentralDifferenceSlopeDeg(
  input: CentralDifferenceSlopeInput
): { meanSlopeDeg: number | null; slopeQualityNote?: string } {
  const { lat0, deltaLatNSDeg, deltaLonEWDeg, zN, zS, zE, zW } = input

  if (!Number.isFinite(lat0) || Math.abs(lat0) > POLAR_SLOPE_EXCLUSION_LAT_DEG) {
    return {
      meanSlopeDeg: null,
      slopeQualityNote: `Slope omitted near geographic pole (|lat| > ${POLAR_SLOPE_EXCLUSION_LAT_DEG} deg) due to meridian convergence singularity.`,
    }
  }

  if (
    typeof zN !== "number" || !Number.isFinite(zN) ||
    typeof zS !== "number" || !Number.isFinite(zS) ||
    typeof zE !== "number" || !Number.isFinite(zE) ||
    typeof zW !== "number" || !Number.isFinite(zW)
  ) {
    return {
      meanSlopeDeg: null,
      slopeQualityNote: "One or more cardinal stencil neighbor elevations were missing or non-finite.",
    }
  }

  const cosLat = Math.cos((lat0 * Math.PI) / 180)
  if (!Number.isFinite(cosLat) || cosLat <= 0 || deltaLatNSDeg <= 0 || deltaLonEWDeg <= 0) {
    return {
      meanSlopeDeg: null,
      slopeQualityNote: "Invalid physical stencil spacing.",
    }
  }

  const dx = deltaLonEWDeg * (Math.PI / 180) * cosLat * EARTH_RADIUS_M
  const dy = deltaLatNSDeg * (Math.PI / 180) * EARTH_RADIUS_M
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || dx <= 0 || dy <= 0) {
    return {
      meanSlopeDeg: null,
      slopeQualityNote: "Degenerate stencil baseline distance.",
    }
  }

  const dzdx = (zE - zW) / dx
  const dzdy = (zN - zS) / dy
  const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy))
  const meanSlopeDeg = Math.round(((slopeRad * 180) / Math.PI) * 100) / 100

  return { meanSlopeDeg }
}

function buildElevationCacheKey(lat: number, lon: number): string {
  return `elev_v2_${lat.toFixed(4)}_${lon.toFixed(4)}`
}

/**
 * Retrieves digital elevation and computes local topographic slope using
 * Copernicus DEM GLO-90 via Open-Meteo Elevation API.
 */
export async function fetchBatchElevationAndSlope(
  cells: Array<{ id: string; latitude: number; longitude: number }>,
  options: { timeoutMs?: number; maxRetries?: number; retryDelayMs?: number; fetchFn?: typeof fetch } = {}
): Promise<ElevationBatchResult> {
  const startTime = Date.now()
  const timeoutMs = options.timeoutMs ?? 8000
  const maxRetries = options.maxRetries ?? 1
  const retryDelayMs = options.retryDelayMs ?? 150
  const fetchImpl = options.fetchFn ?? fetch
  const resultMap = new Map<string, CellElevationData>()

  const uniqueUncachedByKey = new Map<
    string,
    { key: string; latitude: number; longitude: number; cellIds: string[] }
  >()
  const awaitingInFlight: Array<{ cellId: string; key: string; promise: Promise<ElevationCacheRecord> }> = []
  let cacheHits = 0

  const useSharedRedis = !options.fetchFn
  const cellKeys = cells.map((cell) => buildElevationCacheKey(cell.latitude, cell.longitude))
  const preloadedHits = await elevationCache.mgetAsync(cellKeys, { useSharedRedis })

  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx]
    const key = cellKeys[idx]
    const cached = preloadedHits.get(key)
    if (cached) {
      resultMap.set(cell.id, cached)
      cacheHits++
      continue
    }

    const inFlight = inFlightElevationByKey.get(key)
    if (inFlight && !options.fetchFn) {
      awaitingInFlight.push({ cellId: cell.id, key, promise: inFlight })
      continue
    }

    const existingGroup = uniqueUncachedByKey.get(key)
    if (existingGroup) {
      existingGroup.cellIds.push(cell.id)
    } else {
      uniqueUncachedByKey.set(key, {
        key,
        latitude: cell.latitude,
        longitude: cell.longitude,
        cellIds: [cell.id],
      })
    }
  }

  // Wait for any already in-flight coordinates before checking if anything still needs fetching
  if (awaitingInFlight.length > 0) {
    const resolvedInFlight = await Promise.all(
      awaitingInFlight.map(async (item) => ({
        cellId: item.cellId,
        data: await item.promise,
      }))
    )
    for (const item of resolvedInFlight) {
      resultMap.set(item.cellId, item.data)
    }
  }

  const uncachedGroups = Array.from(uniqueUncachedByKey.values())

  if (uncachedGroups.length === 0) {
    return {
      data: resultMap,
      status: {
        provider: "Open-Meteo Elevation",
        dataset: "Copernicus DEM GLO-90 (European Space Agency / Open-Meteo)",
        datasetVersion: "Copernicus GLO-90 via Open-Meteo v1",
        status: "cached",
        recordsFetched: cells.length,
        cacheHits,
        latencyMs: Date.now() - startTime,
        spatialResolution: `90 m grid cell (${SLOPE_METHOD_LABEL} over ~445 m baseline)`,
        sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
        attributionNotice: "Copernicus DEM GLO-90 by European Space Agency, served via Open-Meteo Elevation API.",
      },
    }
  }

  // Register resolvers for concurrent coalescing when using default production fetch
  const resolvers = new Map<string, (val: ElevationCacheRecord) => void>()
  if (!options.fetchFn) {
    for (const grp of uncachedGroups) {
      const p = new Promise<ElevationCacheRecord>((resolve) => {
        resolvers.set(grp.key, resolve)
      })
      inFlightElevationByKey.set(grp.key, p)
    }
  }

  let succeededChunks = 0
  let failedChunks = 0
  let totalRecordsFetched = 0
  const chunkErrors: string[] = []

  try {
    for (let offset = 0; offset < uncachedGroups.length; offset += MAX_CELLS_PER_OPEN_METEO_BATCH) {
      const chunk = uncachedGroups.slice(offset, offset + MAX_CELLS_PER_OPEN_METEO_BATCH)
      const lats: number[] = []
      const lons: number[] = []

      interface StencilGeometry {
        lat0: number
        deltaLatNSDeg: number
        deltaLonEWDeg: number
      }
      const geometries: StencilGeometry[] = []

      for (const grp of chunk) {
        const lat0 = grp.latitude
        const lon0 = grp.longitude
        const isPolarExcluded = Math.abs(lat0) > POLAR_SLOPE_EXCLUSION_LAT_DEG

        const latN = Math.min(90, lat0 + STENCIL_DELTA_DEG)
        const latS = Math.max(-90, lat0 - STENCIL_DELTA_DEG)
        const deltaLatNSDeg = latN - latS

        const cosLat = Math.cos((lat0 * Math.PI) / 180)
        const deltaLon = isPolarExcluded || cosLat <= 0 ? 0 : STENCIL_DELTA_DEG / cosLat
        const lonE = wrapLongitudeDeg(lon0 + deltaLon)
        const lonW = wrapLongitudeDeg(lon0 - deltaLon)

        geometries.push({
          lat0,
          deltaLatNSDeg,
          deltaLonEWDeg: deltaLon * 2,
        })

        // Stencil order: [0: Center, 1: North, 2: South, 3: East, 4: West]
        lats.push(lat0, latN, latS, lat0, lat0)
        lons.push(lon0, lon0, lon0, lonE, lonW)
      }

      const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(",")}&longitude=${lons.join(",")}`

      try {
        const res = await fetchWithRetry(
          url,
          { headers: { Accept: "application/json" } },
          { timeoutMs, maxRetries, retryDelayMs, fetchFn: fetchImpl }
        )

        if (!res.ok) {
          throw new Error(`Open-Meteo HTTP ${res.status}: ${res.statusText}`)
        }

        const json = await res.json()
        if (!Array.isArray(json?.elevation)) {
          throw new Error("Open-Meteo response missing 'elevation' array")
        }

        const elevations: Array<number | null> = json.elevation
        succeededChunks++

        for (let i = 0; i < chunk.length; i++) {
          const grp = chunk[i]
          const geom = geometries[i]
          const baseIdx = i * 5
          const zCenter = elevations[baseIdx]
          const zN = elevations[baseIdx + 1]
          const zS = elevations[baseIdx + 2]
          const zE = elevations[baseIdx + 3]
          const zW = elevations[baseIdx + 4]

          const elevationM =
            typeof zCenter === "number" && Number.isFinite(zCenter)
              ? Math.round(zCenter)
              : null

          const slopeResult = computeCentralDifferenceSlopeDeg({
            lat0: geom.lat0,
            deltaLatNSDeg: geom.deltaLatNSDeg,
            deltaLonEWDeg: geom.deltaLonEWDeg,
            zN,
            zS,
            zE,
            zW,
          })

          const cellData: ElevationCacheRecord = {
            elevationM,
            meanSlopeDeg: slopeResult.meanSlopeDeg,
            slopeMethod: SLOPE_METHOD_LABEL,
            slopeQualityNote: slopeResult.slopeQualityNote,
          }

          if (elevationM !== null || slopeResult.meanSlopeDeg !== null) {
            await elevationCache.setAsync(grp.key, cellData, undefined, { useSharedRedis })
          }

          for (const cid of grp.cellIds) {
            resultMap.set(cid, cellData)
          }
          resolvers.get(grp.key)?.(cellData)
          totalRecordsFetched++
        }
      } catch (chunkErr) {
        failedChunks++
        const msg = chunkErr instanceof Error ? chunkErr.message : String(chunkErr)
        chunkErrors.push(msg)
        console.warn(`[ElevationConnector] Failed Open-Meteo chunk: ${msg}`)

        const missingRecord: ElevationCacheRecord = {
          elevationM: null,
          meanSlopeDeg: null,
          slopeMethod: SLOPE_METHOD_LABEL,
          slopeQualityNote: "Elevation provider request failed for this batch.",
        }
        for (const grp of chunk) {
          for (const cid of grp.cellIds) {
            resultMap.set(cid, missingRecord)
          }
          resolvers.get(grp.key)?.(missingRecord)
        }
      }
    }
  } finally {
    for (const grp of uncachedGroups) {
      inFlightElevationByKey.delete(grp.key)
    }
  }

  const finalStatus: ProviderTelemetryStatus["status"] =
    failedChunks === 0
      ? "success"
      : succeededChunks > 0
      ? "partial"
      : "failed"

  return {
    data: resultMap,
    status: {
      provider: "Open-Meteo Elevation",
      dataset: "Copernicus DEM GLO-90 (European Space Agency / Open-Meteo)",
      datasetVersion: "Copernicus GLO-90 via Open-Meteo v1",
      status: finalStatus,
      recordsFetched: totalRecordsFetched,
      cacheHits,
      latencyMs: Date.now() - startTime,
      spatialResolution: `90 m grid cell (${SLOPE_METHOD_LABEL} over ~445 m baseline)`,
      sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
      attributionNotice: "Copernicus DEM GLO-90 by European Space Agency, served via Open-Meteo Elevation API.",
      ...(chunkErrors.length > 0 ? { error: chunkErrors[0] } : {}),
    },
  }
}
