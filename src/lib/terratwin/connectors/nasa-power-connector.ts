import { nasaPowerCache, type NasaPowerCacheRecord } from "../utils/discovery-cache.ts"
import { fetchWithRetry } from "../utils/fetch-retry.ts"
import type { ProviderTelemetryStatus } from "../types/discovery.ts"

export type CellNasaPowerData = NasaPowerCacheRecord

export interface NasaPowerBatchResult {
  data: Map<string, CellNasaPowerData>
  status: ProviderTelemetryStatus
}

const DEFAULT_NASA_POWER_FILL = -999.0
const KWH_DAY_TO_WM2 = 1000 / 24 // 41.66667 W/m^2 per kW-hr/(m^2*day) averaged over 24 hours
const MJ_DAY_TO_WM2 = 1_000_000 / 86_400 // 11.57407 W/m^2 per MJ/(m^2*day)
const DAYS_PER_YEAR = 365.25
const NASA_POWER_TEMPORAL_COVERAGE = "2001-2025 (25-year Climatology Monthly/Annual)"

/**
 * NASA POWER MERRA-2 grid resolution is ~0.5° lat x ~0.625° lon;
 * CERES SYN1DEG solar irradiance inside POWER is ~1.0° x 1.0°.
 */
export function getPowerGridKey(lat: number, lon: number): string {
  const rawLat = Math.round(lat * 2) / 2
  const rawLon = Math.round(lon * 1.6) / 1.6
  const binnedLat = Object.is(rawLat, -0) ? 0 : rawLat
  const binnedLon = Object.is(rawLon, -0) ? 0 : rawLon
  return `power_v2_${binnedLat.toFixed(2)}_${binnedLon.toFixed(3)}`
}

function isValidPowerNumber(value: unknown, fillValue: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value - fillValue) > 1e-6 &&
    value > -900
  )
}

function normalizeSolarIrradianceToWm2(
  rawValue: unknown,
  units: unknown,
  fillValue: number
): { wm2: number | null; originalKwhM2Day: number | null } {
  if (!isValidPowerNumber(rawValue, fillValue)) {
    return { wm2: null, originalKwhM2Day: null }
  }

  const unitStr = typeof units === "string" ? units.trim().toLowerCase() : ""

  // Default NASA POWER ALLSKY_SFC_SW_DWN Climatology unit is kW-hr/m^2/day
  if (unitStr === "" || unitStr.includes("kw-hr") || unitStr.includes("kwh")) {
    if (rawValue < 0 || rawValue > 15) {
      return { wm2: null, originalKwhM2Day: null }
    }
    return {
      wm2: Math.round(rawValue * KWH_DAY_TO_WM2),
      originalKwhM2Day: Math.round(rawValue * 100) / 100,
    }
  }

  if (unitStr.includes("w/m^2") || unitStr.includes("w/m2")) {
    if (rawValue < 0 || rawValue > 1500) {
      return { wm2: null, originalKwhM2Day: null }
    }
    return {
      wm2: Math.round(rawValue),
      originalKwhM2Day: Math.round((rawValue / KWH_DAY_TO_WM2) * 100) / 100,
    }
  }

  if (unitStr.includes("mj/m")) {
    const wm2Val = rawValue * MJ_DAY_TO_WM2
    if (wm2Val < 0 || wm2Val > 1500) {
      return { wm2: null, originalKwhM2Day: null }
    }
    return {
      wm2: Math.round(wm2Val),
      originalKwhM2Day: Math.round((wm2Val / KWH_DAY_TO_WM2) * 100) / 100,
    }
  }

  // Unsupported or ambiguous unit: refuse silent misconversion
  return { wm2: null, originalKwhM2Day: null }
}

/**
 * Fetches regional climatology (2001-2025) from NASA POWER Climatology API v2.10.1.
 */
export async function fetchBatchNasaPowerClimatology(
  cells: Array<{ id: string; latitude: number; longitude: number }>,
  options: {
    timeoutMs?: number
    concurrency?: number
    maxRetries?: number
    retryDelayMs?: number
    fetchFn?: typeof fetch
  } = {}
): Promise<NasaPowerBatchResult> {
  const startTime = Date.now()
  const timeoutMs = options.timeoutMs ?? 12000
  const concurrency = Math.max(1, options.concurrency ?? 3)
  const maxRetries = options.maxRetries ?? 1
  const retryDelayMs = options.retryDelayMs ?? 150
  const resultMap = new Map<string, CellNasaPowerData>()

  const uniqueGridMap = new Map<string, { lat: number; lon: number; cellIds: string[] }>()
  let cacheHits = 0

  const useSharedRedis = !options.fetchFn
  const cellKeys = cells.map((cell) => getPowerGridKey(cell.latitude, cell.longitude))
  const preloadedHits = await nasaPowerCache.mgetAsync(cellKeys, { useSharedRedis })

  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx]
    const key = cellKeys[idx]
    const cached = preloadedHits.get(key)
    if (cached) {
      resultMap.set(cell.id, cached)
      cacheHits++
    } else {
      if (!uniqueGridMap.has(key)) {
        uniqueGridMap.set(key, { lat: cell.latitude, lon: cell.longitude, cellIds: [] })
      }
      uniqueGridMap.get(key)!.cellIds.push(cell.id)
    }
  }

  const uncachedKeys = Array.from(uniqueGridMap.keys())

  if (uncachedKeys.length === 0) {
    return {
      data: resultMap,
      status: {
        provider: "NASA POWER Climatology",
        dataset: "POWER Climatology API v2.10.1 (MERRA-2 / CERES SYN1DEG)",
        datasetVersion: "v2.10.1",
        status: "cached",
        recordsFetched: cells.length,
        cacheHits,
        latencyMs: Date.now() - startTime,
        spatialResolution: "0.5° × 0.625° (MERRA-2 met) / 1.0° × 1.0° (CERES solar)",
        temporalCoverage: NASA_POWER_TEMPORAL_COVERAGE,
        sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
        attributionNotice: "NASA POWER Project funded by NASA Earth Science (MERRA-2 & CERES SYN1DEG).",
      },
    }
  }

  let successCount = 0
  let failedCount = 0
  let coalescedHits = 0
  let lastError: string | undefined
  let detectedVersion = "v2.10.1"
  let detectedTemporalRange = NASA_POWER_TEMPORAL_COVERAGE

  async function fetchGridBin(key: string): Promise<void> {
    const info = uniqueGridMap.get(key)!
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?latitude=${info.lat.toFixed(4)}&longitude=${info.lon.toFixed(4)}&community=RE&parameters=T2M,TS_RANGE,ALLSKY_SFC_SW_DWN,WS10M,PRECTOTCORR&format=JSON`

    const loadBin = async (): Promise<NasaPowerCacheRecord> => {
      const res = await fetchWithRetry(
        url,
        { headers: { Accept: "application/json" } },
        { timeoutMs, maxRetries, retryDelayMs, fetchFn: options.fetchFn }
      )

      if (!res.ok) {
        throw new Error(`NASA POWER API HTTP ${res.status}`)
      }

      const json = await res.json()
      const fillValue =
        typeof json?.header?.fill_value === "number" && Number.isFinite(json.header.fill_value)
          ? json.header.fill_value
          : DEFAULT_NASA_POWER_FILL

      if (typeof json?.header?.api?.version === "string" && json.header.api.version.trim()) {
        detectedVersion = json.header.api.version.trim()
      }
      if (typeof json?.header?.range === "string" && json.header.range.trim()) {
        detectedTemporalRange = json.header.range.trim()
      }

      const params = json?.properties?.parameter ?? {}
      const paramMeta = json?.parameters ?? {}

      const rawT2m = params.T2M?.ANN
      const rawTsRange = params.TS_RANGE?.ANN
      const rawAllsky = params.ALLSKY_SFC_SW_DWN?.ANN
      const rawWs10m = params.WS10M?.ANN
      const rawPrecip = params.PRECTOTCORR?.ANN

      const meanSurfaceTempC =
        isValidPowerNumber(rawT2m, fillValue) && rawT2m >= -90 && rawT2m <= 70
          ? Math.round(rawT2m * 10) / 10
          : null

      const diurnalTempRangeC =
        isValidPowerNumber(rawTsRange, fillValue) && rawTsRange >= 0 && rawTsRange <= 90
          ? Math.round(rawTsRange * 10) / 10
          : null

      const solarNormalized = normalizeSolarIrradianceToWm2(
        rawAllsky,
        paramMeta.ALLSKY_SFC_SW_DWN?.units,
        fillValue
      )

      const windSpeedMs =
        isValidPowerNumber(rawWs10m, fillValue) && rawWs10m >= 0 && rawWs10m <= 120
          ? Math.round(rawWs10m * 10) / 10
          : null

      let annualPrecipitationMm: number | null = null
      let originalPrecipMmDay: number | null = null
      if (isValidPowerNumber(rawPrecip, fillValue) && rawPrecip >= 0 && rawPrecip <= 500) {
        const precipUnits =
          typeof paramMeta.PRECTOTCORR?.units === "string"
            ? paramMeta.PRECTOTCORR.units.trim().toLowerCase()
            : ""
        if (precipUnits === "" || precipUnits.includes("mm/day")) {
          originalPrecipMmDay = Math.round(rawPrecip * 100) / 100
          annualPrecipitationMm = Math.round(rawPrecip * DAYS_PER_YEAR)
        }
      }

      const sourceVariablesUsed: string[] = []
      if (meanSurfaceTempC !== null) sourceVariablesUsed.push("T2M")
      if (diurnalTempRangeC !== null) sourceVariablesUsed.push("TS_RANGE")
      if (solarNormalized.wm2 !== null) sourceVariablesUsed.push("ALLSKY_SFC_SW_DWN")
      if (windSpeedMs !== null) sourceVariablesUsed.push("WS10M")
      if (annualPrecipitationMm !== null) sourceVariablesUsed.push("PRECTOTCORR")

      return {
        meanSurfaceTempC,
        diurnalTempRangeC,
        surfaceSolarIrradianceWm2: solarNormalized.wm2,
        windSpeedMs,
        annualPrecipitationMm,
        originalSolarKwhM2Day: solarNormalized.originalKwhM2Day,
        originalPrecipMmDay,
        datasetVersion: detectedVersion,
        temporalCoverage: detectedTemporalRange,
        sourceVariablesUsed,
        sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
      }
    }

    try {
      const hasAnyValue = (v: NasaPowerCacheRecord) =>
        v.meanSurfaceTempC !== null ||
        v.diurnalTempRangeC !== null ||
        v.surfaceSolarIrradianceWm2 !== null ||
        v.windSpeedMs !== null ||
        v.annualPrecipitationMm !== null

      const loaded = options.fetchFn
        ? {
            value: await (async () => {
              const val = await loadBin()
              if (hasAnyValue(val)) nasaPowerCache.set(key, val)
              return val
            })(),
            cacheHit: false,
            coalesced: false,
          }
        : await nasaPowerCache.getOrLoad(key, loadBin, undefined, hasAnyValue, { useSharedRedis })

      if (loaded.cacheHit || loaded.coalesced) {
        coalescedHits++
      }

      for (const cellId of info.cellIds) {
        resultMap.set(cellId, loaded.value)
      }
      successCount++
    } catch (err) {
      failedCount++
      lastError = err instanceof Error ? err.message : String(err)
      const emptyData: CellNasaPowerData = {
        meanSurfaceTempC: null,
        diurnalTempRangeC: null,
        surfaceSolarIrradianceWm2: null,
        windSpeedMs: null,
        annualPrecipitationMm: null,
      }
      for (const cellId of info.cellIds) {
        resultMap.set(cellId, emptyData)
      }
    }
  }

  for (let i = 0; i < uncachedKeys.length; i += concurrency) {
    const chunk = uncachedKeys.slice(i, i + concurrency)
    await Promise.all(chunk.map((k) => fetchGridBin(k)))
  }

  const overallStatus =
    failedCount === 0 ? "success" : successCount > 0 ? "partial" : "failed"

  return {
    data: resultMap,
    status: {
      provider: "NASA POWER Climatology",
      dataset: `POWER Climatology API ${detectedVersion} (MERRA-2 / CERES SYN1DEG)`,
      datasetVersion: detectedVersion,
      status: overallStatus,
      recordsFetched: successCount,
      cacheHits: cacheHits + coalescedHits,
      latencyMs: Date.now() - startTime,
      spatialResolution: "0.5° × 0.625° (MERRA-2 met) / 1.0° × 1.0° (CERES solar)",
      temporalCoverage: detectedTemporalRange,
      sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
      attributionNotice: "NASA POWER Project funded by NASA Earth Science (MERRA-2 & CERES SYN1DEG).",
      error: lastError,
    },
  }
}
