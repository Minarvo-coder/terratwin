import type {
  AnalogEnvironmentCategory,
  FeatureProvenance,
  GeographicBoundingBox,
  ProvenanceStatus,
} from "../types.ts"
import type {
  DiscoveryCandidateResult,
  ProviderTelemetryStatus,
  RegionalDiscoveryRequest,
  RegionalDiscoveryResponse,
} from "../types/discovery.ts"

export const SCANNER_MAX_LAT_SPAN_DEG = 10.0
export const SCANNER_MAX_LON_SPAN_DEG = 10.0
export const SCANNER_MIN_SPACING_DEG = 0.1
export const SCANNER_MAX_SPACING_DEG = 5.0
export const SCANNER_MIN_CELLS = 1
export const SCANNER_HARD_MAX_CELLS = 100
export const SCANNER_MIN_CANDIDATES = 1
export const SCANNER_HARD_MAX_CANDIDATES = 50

export type CandidateVisualTier =
  | "high-similarity"
  | "moderate-similarity"
  | "low-similarity"
  | "insufficient-data"

export interface VisualTierStyle {
  tier: CandidateVisualTier
  label: string
  shortBadge: string
  fillColor: string
  strokeColor: string
  fillOpacity: number
  dashArray?: string
  textClass: string
  badgeClass: string
}

export interface ScannerRegionValidation {
  isValid: boolean
  error: string | null
  latSpan: number
  lonSpan: number
}

export interface GridEstimateResult {
  isValid: boolean
  error: string | null
  rows: number
  cols: number
  totalCells: number
}

export interface ScannerConfigDraft {
  targetId: string
  missionProfile: string
  boundingBox: GeographicBoundingBox | null
  gridSpacingDeg: number
  maxCells: number
  maxCandidates: number
  advisoryCategory?: AnalogEnvironmentCategory | ""
}

export interface ParsedDiscoverApiError {
  status: number
  code: string
  message: string
  retryAfterSec: number | null
  isRateLimited: boolean
}

export type SubmitDiscoveryResult =
  | {
      ok: true
      outcome: "success" | "partial-success" | "insufficient-data"
      response: RegionalDiscoveryResponse
    }
  | {
      ok: false
      aborted: boolean
      error: ParsedDiscoverApiError
    }

function round4(n: number): number {
  const rounded = Math.round(n * 10000) / 10000
  return Object.is(rounded, -0) ? 0 : rounded
}

function wrapLon(lon: number): number {
  let w = ((lon + 180) % 360 + 360) % 360 - 180
  if (w === -180 && lon > 0) w = 180
  return Object.is(w, -0) ? 0 : w
}

/**
 * Validates a WGS84 bounding box [minLatitude, minLongitude, maxLatitude, maxLongitude]
 * matching the exact constraints enforced by backend grid-generator.ts.
 */
export function validateScannerBoundingBox(
  bbox: GeographicBoundingBox | null | undefined
): ScannerRegionValidation {
  if (!Array.isArray(bbox) || bbox.length !== 4) {
    return {
      isValid: false,
      error: "Select an Earth region [minLat, minLon, maxLat, maxLon] to begin a scientific analog scan.",
      latSpan: 0,
      lonSpan: 0,
    }
  }

  const [minLat, minLon, maxLat, maxLon] = bbox
  for (let i = 0; i < 4; i++) {
    if (typeof bbox[i] !== "number" || !Number.isFinite(bbox[i])) {
      return {
        isValid: false,
        error: `Bounding box coordinate at position ${i + 1} must be a finite decimal degree number.`,
        latSpan: 0,
        lonSpan: 0,
      }
    }
  }

  if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
    return {
      isValid: false,
      error: "Latitude coordinates must stay strictly between -90° and +90°.",
      latSpan: 0,
      lonSpan: 0,
    }
  }

  if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
    return {
      isValid: false,
      error: "Longitude coordinates must stay strictly between -180° and +180°.",
      latSpan: 0,
      lonSpan: 0,
    }
  }

  if (minLat > maxLat) {
    return {
      isValid: false,
      error: `Minimum latitude (${minLat.toFixed(2)}°) cannot exceed maximum latitude (${maxLat.toFixed(2)}°).`,
      latSpan: 0,
      lonSpan: 0,
    }
  }

  if (minLon > maxLon) {
    return {
      isValid: false,
      error: "This region crosses the antimeridian (±180°). Select one side at a time.",
      latSpan: round4(maxLat - minLat),
      lonSpan: 0,
    }
  }

  const latSpan = round4(maxLat - minLat)
  const lonSpan = round4(maxLon - minLon)

  if (latSpan <= 0 || lonSpan <= 0) {
    return {
      isValid: false,
      error: "Selected region has zero area. Drag or enter distinct latitude and longitude bounds.",
      latSpan,
      lonSpan,
    }
  }

  if (latSpan > SCANNER_MAX_LAT_SPAN_DEG || lonSpan > SCANNER_MAX_LON_SPAN_DEG) {
    return {
      isValid: false,
      error: `The selected region (${latSpan.toFixed(2)}° lat × ${lonSpan.toFixed(2)}° lon) exceeds the supported scan limits of ${SCANNER_MAX_LAT_SPAN_DEG}° × ${SCANNER_MAX_LON_SPAN_DEG}°.`,
      latSpan,
      lonSpan,
    }
  }

  return {
    isValid: true,
    error: null,
    latSpan,
    lonSpan,
  }
}

/**
 * Estimates exact grid cell counts using the backend integer-stepping formula in grid-generator.ts.
 */
export function estimateScannerGrid(
  bbox: GeographicBoundingBox | null | undefined,
  gridSpacingDeg: number,
  maxCells: number
): GridEstimateResult {
  const regionCheck = validateScannerBoundingBox(bbox)
  if (!regionCheck.isValid || !bbox) {
    return {
      isValid: false,
      error: regionCheck.error,
      rows: 0,
      cols: 0,
      totalCells: 0,
    }
  }

  if (
    typeof gridSpacingDeg !== "number" ||
    !Number.isFinite(gridSpacingDeg) ||
    gridSpacingDeg < SCANNER_MIN_SPACING_DEG ||
    gridSpacingDeg > SCANNER_MAX_SPACING_DEG
  ) {
    return {
      isValid: false,
      error: `Grid spacing must be between ${SCANNER_MIN_SPACING_DEG}° and ${SCANNER_MAX_SPACING_DEG}°.`,
      rows: 0,
      cols: 0,
      totalCells: 0,
    }
  }

  if (
    typeof maxCells !== "number" ||
    !Number.isFinite(maxCells) ||
    !Number.isInteger(maxCells) ||
    maxCells < SCANNER_MIN_CELLS ||
    maxCells > SCANNER_HARD_MAX_CELLS
  ) {
    return {
      isValid: false,
      error: `Max cells must be an integer between ${SCANNER_MIN_CELLS} and ${SCANNER_HARD_MAX_CELLS}.`,
      rows: 0,
      cols: 0,
      totalCells: 0,
    }
  }

  const [minLat, minLon, maxLat, maxLon] = bbox
  const rawRowCount = Math.floor((maxLat - minLat + 1e-9) / gridSpacingDeg)
  const rawColCount = Math.floor((maxLon - minLon + 1e-9) / gridSpacingDeg)
  const rows = Math.max(1, rawRowCount)
  const cols = Math.max(1, rawColCount)
  const totalCells = rows * cols

  if (totalCells > maxCells) {
    return {
      isValid: false,
      error: `Current ${gridSpacingDeg.toFixed(1)}° spacing produces ${totalCells} cells (${rows}×${cols}), exceeding your max cell cap of ${maxCells}. Increase spacing or narrow the region.`,
      rows,
      cols,
      totalCells,
    }
  }

  return {
    isValid: true,
    error: null,
    rows,
    cols,
    totalCells,
  }
}

/**
 * Converts map corners into the backend [minLatitude, minLongitude, maxLatitude, maxLongitude]
 * convention, safely handling Leaflet world-copy longitudes and antimeridian detection.
 */
export function leafletBoundsToGeoBbox(bounds: {
  south: number
  west: number
  north: number
  east: number
}): { bbox: GeographicBoundingBox | null; error: string | null } {
  const { south, west, north, east } = bounds
  if (
    !Number.isFinite(south) ||
    !Number.isFinite(west) ||
    !Number.isFinite(north) ||
    !Number.isFinite(east)
  ) {
    return { bbox: null, error: "Invalid map boundary coordinates." }
  }

  const minLat = round4(Math.max(-90, Math.min(90, Math.min(south, north))))
  const maxLat = round4(Math.max(-90, Math.min(90, Math.max(south, north))))
  const rawSpan = east - west

  if (rawSpan >= 360) {
    return {
      bbox: null,
      error: `The selected region exceeds the maximum ${SCANNER_MAX_LAT_SPAN_DEG}° × ${SCANNER_MAX_LON_SPAN_DEG}° scan limits.`,
    }
  }

  let minLon = round4(wrapLon(west))
  let maxLon = round4(wrapLon(east))

  // Handle Leaflet world copy when e.g. west=350, east=352 (2° span inside one hemisphere)
  if (rawSpan > 0 && rawSpan <= 180 && minLon > maxLon) {
    return {
      bbox: null,
      error: "This region crosses the antimeridian (±180°). Select one side at a time.",
    }
  }

  if (rawSpan <= 0 && minLon > maxLon) {
    const tmp = minLon
    minLon = maxLon
    maxLon = tmp
  }

  const bbox: GeographicBoundingBox = [minLat, minLon, maxLat, maxLon]
  const validation = validateScannerBoundingBox(bbox)
  if (!validation.isValid) {
    return { bbox: null, error: validation.error }
  }

  return { bbox, error: null }
}

/**
 * Computes a valid bounded scan box centered near an existing coordinate (e.g., an Atlas site)
 * without crossing global latitude limits or the antimeridian.
 */
export function computeBboxAroundPoint(
  latitude: number,
  longitude: number,
  spanDeg: number = 1.5
): GeographicBoundingBox {
  const half = Math.min(SCANNER_MAX_LAT_SPAN_DEG / 2, Math.max(0.15, spanDeg / 2))
  const minLat = round4(Math.max(-89.9, latitude - half))
  const maxLat = round4(Math.min(89.9, latitude + half))
  // Clamp at +/-179.99 rather than wrapping so the generated box never crosses the antimeridian
  let minLon = round4(Math.max(-179.99, longitude - half))
  let maxLon = round4(Math.min(179.99, longitude + half))

  if (maxLat - minLat < 0.2) {
    return [minLat, minLon, round4(Math.min(90, minLat + 0.5)), maxLon]
  }
  if (maxLon - minLon < 0.2) {
    if (longitude >= 0) {
      minLon = round4(Math.max(-180, maxLon - 0.5))
    } else {
      maxLon = round4(Math.min(180, minLon + 0.5))
    }
  }

  return [minLat, minLon, maxLat, maxLon]
}

/**
 * Classifies a returned discovery cell for accessible map and list visual semantics.
 * Cells with score: null or coverage < 40% are NEVER assigned a numeric low-score color.
 */
export function classifyCandidateVisualTier(
  candidate: Pick<DiscoveryCandidateResult, "score" | "isReliable">
): CandidateVisualTier {
  if (candidate.score === null || !candidate.isReliable || !Number.isFinite(candidate.score)) {
    return "insufficient-data"
  }
  if (candidate.score >= 70) return "high-similarity"
  if (candidate.score >= 45) return "moderate-similarity"
  return "low-similarity"
}

export const VISUAL_TIER_STYLES: Record<CandidateVisualTier, VisualTierStyle> = {
  "high-similarity": {
    tier: "high-similarity",
    label: "High Similarity Lead (≥ 70%)",
    shortBadge: "HIGH LEAD",
    fillColor: "#10b981",
    strokeColor: "#34d399",
    fillOpacity: 0.42,
    textClass: "text-emerald-300",
    badgeClass: "border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
  },
  "moderate-similarity": {
    tier: "moderate-similarity",
    label: "Moderate Similarity Lead (45–69%)",
    shortBadge: "MODERATE",
    fillColor: "#0ea5e9",
    strokeColor: "#38bdf8",
    fillOpacity: 0.36,
    textClass: "text-cyan-300",
    badgeClass: "border-cyan-500/40 bg-cyan-950/60 text-cyan-300",
  },
  "low-similarity": {
    tier: "low-similarity",
    label: "Low Similarity Lead (< 45%)",
    shortBadge: "LOW MATCH",
    fillColor: "#f59e0b",
    strokeColor: "#fbbf24",
    fillOpacity: 0.32,
    textClass: "text-amber-300",
    badgeClass: "border-amber-500/40 bg-amber-950/60 text-amber-300",
  },
  "insufficient-data": {
    tier: "insufficient-data",
    label: "Insufficient Evidence (< 40% coverage — unranked)",
    shortBadge: "INSUFFICIENT",
    fillColor: "#475569",
    strokeColor: "#94a3b8",
    fillOpacity: 0.24,
    dashArray: "5 4",
    textClass: "text-slate-300",
    badgeClass: "border-slate-500/40 bg-slate-900/80 text-slate-300",
  },
}

export function getVisualTierStyle(
  candidate: Pick<DiscoveryCandidateResult, "score" | "isReliable">
): VisualTierStyle {
  return VISUAL_TIER_STYLES[classifyCandidateVisualTier(candidate)]
}

/**
 * Builds an exact backend-compatible POST /api/discover request body from validated UI configuration.
 */
export function buildDiscoveryRequestPayload(
  draft: ScannerConfigDraft
): { payload: RegionalDiscoveryRequest | null; error: string | null } {
  if (!draft.targetId || draft.targetId.trim() === "") {
    return { payload: null, error: "Select a planetary target before launching a scan." }
  }
  if (!draft.missionProfile || draft.missionProfile.trim() === "") {
    return { payload: null, error: "Select a mission profile before launching a scan." }
  }

  const gridCheck = estimateScannerGrid(draft.boundingBox, draft.gridSpacingDeg, draft.maxCells)
  if (!gridCheck.isValid || !draft.boundingBox) {
    return { payload: null, error: gridCheck.error ?? "Invalid scan region or grid configuration." }
  }

  if (
    typeof draft.maxCandidates !== "number" ||
    !Number.isInteger(draft.maxCandidates) ||
    draft.maxCandidates < SCANNER_MIN_CANDIDATES ||
    draft.maxCandidates > SCANNER_HARD_MAX_CANDIDATES
  ) {
    return {
      payload: null,
      error: `Max candidates returned must be an integer between ${SCANNER_MIN_CANDIDATES} and ${SCANNER_HARD_MAX_CANDIDATES}.`,
    }
  }

  const payload: RegionalDiscoveryRequest = {
    boundingBox: [
      round4(draft.boundingBox[0]),
      round4(draft.boundingBox[1]),
      round4(draft.boundingBox[2]),
      round4(draft.boundingBox[3]),
    ],
    targetId: draft.targetId.trim(),
    missionProfile: draft.missionProfile.trim(),
    gridSpacingDeg: Math.round(draft.gridSpacingDeg * 100) / 100,
    maxCells: draft.maxCells,
    maxCandidates: draft.maxCandidates,
  }

  if (draft.advisoryCategory) {
    payload.category = draft.advisoryCategory
  }

  return { payload, error: null }
}

/**
 * Parses error HTTP responses returned by POST /api/discover (400, 404, 429, 500)
 * without fabricating details or exposing raw stack traces.
 */
export function parseDiscoverErrorResponse(
  status: number,
  body: unknown,
  headers?: Pick<Headers, "get"> | null
): ParsedDiscoverApiError {
  let code = status === 429 ? "RATE_LIMIT_EXCEEDED" : "DISCOVERY_REQUEST_FAILED"
  let message =
    status === 429
      ? "Too many scans were requested. Please wait before trying again."
      : "The discovery request could not be completed."
  let retryAfterSec: number | null = null

  if (headers) {
    const rawRetry = headers.get("retry-after") ?? headers.get("Retry-After")
    if (rawRetry) {
      const parsed = Number(rawRetry)
      if (Number.isFinite(parsed) && parsed > 0) {
        retryAfterSec = Math.ceil(parsed)
      }
    }
  }

  if (body && typeof body === "object" && "error" in body) {
    const errObj = (body as { error?: { code?: unknown; message?: unknown; details?: unknown } }).error
    if (errObj) {
      if (typeof errObj.code === "string" && errObj.code) {
        code = errObj.code
      }
      if (typeof errObj.message === "string" && errObj.message && status !== 500) {
        message = errObj.message
      }
      if (
        retryAfterSec === null &&
        errObj.details &&
        typeof errObj.details === "object" &&
        "retryAfterSec" in errObj.details
      ) {
        const detailRetry = Number((errObj.details as { retryAfterSec?: unknown }).retryAfterSec)
        if (Number.isFinite(detailRetry) && detailRetry > 0) {
          retryAfterSec = Math.ceil(detailRetry)
        }
      }
    }
  }

  return {
    status,
    code,
    message,
    retryAfterSec,
    isRateLimited: status === 429 || code === "RATE_LIMIT_EXCEEDED",
  }
}

/**
 * Executes POST /api/discover safely with AbortSignal and honest outcome classification.
 * Never retries automatically after 429 or injects placeholder results on failure.
 */
export async function submitDiscoveryScan(
  payload: RegionalDiscoveryRequest,
  options: { signal?: AbortSignal; fetchFn?: typeof fetch } = {}
): Promise<SubmitDiscoveryResult> {
  const fetchImpl = options.fetchFn ?? fetch

  try {
    const res = await fetchImpl("/api/discover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    })

    let parsedJson: unknown = null
    try {
      parsedJson = await res.json()
    } catch {
      parsedJson = null
    }

    if (!res.ok) {
      return {
        ok: false,
        aborted: false,
        error: parseDiscoverErrorResponse(res.status, parsedJson, res.headers),
      }
    }

    if (
      !parsedJson ||
      typeof parsedJson !== "object" ||
      (parsedJson as { success?: unknown }).success !== true ||
      !Array.isArray((parsedJson as { candidates?: unknown }).candidates)
    ) {
      return {
        ok: false,
        aborted: false,
        error: {
          status: 502,
          code: "INVALID_API_PAYLOAD",
          message: "Discovery server returned an unexpected response structure.",
          retryAfterSec: null,
          isRateLimited: false,
        },
      }
    }

    const response = parsedJson as RegionalDiscoveryResponse
    const hasProviderIssues = response.providerStatuses.some(
      (s) => s.status === "failed" || s.status === "partial"
    )
    const outcome: "success" | "partial-success" | "insufficient-data" =
      response.computableCandidatesCount === 0
        ? "insufficient-data"
        : hasProviderIssues
        ? "partial-success"
        : "success"

    return {
      ok: true,
      outcome,
      response,
    }
  } catch (err) {
    const isAbort =
      (err instanceof Error && err.name === "AbortError") ||
      Boolean(options.signal?.aborted)

    if (isAbort) {
      return {
        ok: false,
        aborted: true,
        error: {
          status: 0,
          code: "CLIENT_ABORTED",
          message: "Browser wait was cancelled. Note: server processing already underway cannot be cancelled mid-flight.",
          retryAfterSec: null,
          isRateLimited: false,
        },
      }
    }

    return {
      ok: false,
      aborted: false,
      error: {
        status: 0,
        code: "NETWORK_ERROR",
        message: "Network error while contacting /api/discover. Verify server availability and try again.",
        retryAfterSec: null,
        isRateLimited: false,
      },
    }
  }
}

export interface DiscoverySummaryMetrics {
  cellsEvaluated: number
  candidatesReturned: number
  computableCandidatesCount: number
  insufficientDataCandidatesCount: number
  highestValidScore: number | null
  failedProviders: ProviderTelemetryStatus[]
  partialProviders: ProviderTelemetryStatus[]
  allProvidersFailed: boolean
  responseCacheHit: boolean
}

export function summarizeDiscoveryResponse(
  response: RegionalDiscoveryResponse
): DiscoverySummaryMetrics {
  const validScores = response.candidates
    .map((c) => c.score)
    .filter((s): s is number => typeof s === "number" && Number.isFinite(s))

  const failedProviders = response.providerStatuses.filter((p) => p.status === "failed")
  const partialProviders = response.providerStatuses.filter((p) => p.status === "partial")
  const allProvidersFailed =
    response.providerStatuses.length > 0 &&
    failedProviders.length === response.providerStatuses.length

  return {
    cellsEvaluated: response.totalCellsEvaluated,
    candidatesReturned: response.candidates.length,
    computableCandidatesCount: response.computableCandidatesCount,
    insufficientDataCandidatesCount: response.insufficientDataCandidatesCount,
    highestValidScore: validScores.length > 0 ? Math.max(...validScores) : null,
    failedProviders,
    partialProviders,
    allProvidersFailed,
    responseCacheHit: Boolean(response.searchMetadata.responseCacheHit),
  }
}

export function formatProvenanceVerificationBadge(
  prov?: FeatureProvenance
): { label: string; toneClass: string } {
  if (!prov) {
    return {
      label: "Missing data",
      toneClass: "border-slate-700 bg-slate-900 text-slate-400",
    }
  }
  const state: ProvenanceStatus = prov.verificationState ?? prov.status
  if (state === "verified") {
    return {
      label: "Verified dataset",
      toneClass: "border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
    }
  }
  if (state === "unverified") {
    return {
      label: "Unverified API lead",
      toneClass: "border-amber-500/40 bg-amber-950/50 text-amber-300",
    }
  }
  if (state === "illustrative") {
    return {
      label: "Illustrative",
      toneClass: "border-purple-500/40 bg-purple-950/50 text-purple-300",
    }
  }
  return {
    label: "No data",
    toneClass: "border-slate-700 bg-slate-900/90 text-slate-400",
  }
}
