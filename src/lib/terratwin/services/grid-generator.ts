import type { DiscoveryGridCell } from "../types/discovery.ts"
import type { GeographicBoundingBox } from "../types.ts"

export const MAX_LATITUDE_SPAN_DEG = 10.0
export const MAX_LONGITUDE_SPAN_DEG = 10.0
export const MIN_GRID_SPACING_DEG = 0.1
export const MAX_GRID_SPACING_DEG = 5.0
export const DEFAULT_GRID_SPACING_DEG = 0.5
export const DEFAULT_MAX_CELLS = 25
export const HARD_CEILING_MAX_CELLS = 100

export class GridValidationError extends Error {
  public readonly status: number = 400
  public readonly details?: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = "GridValidationError"
    this.details = details
  }
}

/**
 * Validates a WGS84 bounding box [minLatitude, minLongitude, maxLatitude, maxLongitude].
 */
export function validateDiscoveryBoundingBox(bbox: GeographicBoundingBox): void {
  if (!Array.isArray(bbox) || bbox.length !== 4) {
    throw new GridValidationError(
      "Bounding box must be an array of four numbers: [minLatitude, minLongitude, maxLatitude, maxLongitude]."
    )
  }

  const [minLat, minLon, maxLat, maxLon] = bbox

  for (let i = 0; i < 4; i++) {
    if (typeof bbox[i] !== "number" || Number.isNaN(bbox[i]) || !Number.isFinite(bbox[i])) {
      throw new GridValidationError(`Bounding box coordinate at index ${i} is not a valid finite number.`)
    }
  }

  if (minLat < -90 || minLat > 90) {
    throw new GridValidationError(`minLatitude (${minLat}) must be between -90 and 90 degrees.`)
  }
  if (maxLat < -90 || maxLat > 90) {
    throw new GridValidationError(`maxLatitude (${maxLat}) must be between -90 and 90 degrees.`)
  }
  if (minLon < -180 || minLon > 180) {
    throw new GridValidationError(`minLongitude (${minLon}) must be between -180 and 180 degrees.`)
  }
  if (maxLon < -180 || maxLon > 180) {
    throw new GridValidationError(`maxLongitude (${maxLon}) must be between -180 and 180 degrees.`)
  }

  if (minLat > maxLat) {
    throw new GridValidationError(`minLatitude (${minLat}) cannot be greater than maxLatitude (${maxLat}).`)
  }

  if (minLon > maxLon) {
    throw new GridValidationError(
      `Antimeridian crossing detected: minLongitude (${minLon}) exceeds maxLongitude (${maxLon}). Please divide the search region into two separate bounding boxes east and west of 180° longitude.`
    )
  }

  const latSpan = maxLat - minLat
  const lonSpan = maxLon - minLon

  if (latSpan <= 0) {
    throw new GridValidationError("Bounding box latitude span must be strictly greater than 0.")
  }
  if (lonSpan <= 0) {
    throw new GridValidationError("Bounding box longitude span must be strictly greater than 0.")
  }

  if (latSpan > MAX_LATITUDE_SPAN_DEG || lonSpan > MAX_LONGITUDE_SPAN_DEG) {
    throw new GridValidationError(
      `Bounding box span (${latSpan.toFixed(2)}° lat × ${lonSpan.toFixed(2)}° lon) exceeds maximum allowable regional search area of ${MAX_LATITUDE_SPAN_DEG}° × ${MAX_LONGITUDE_SPAN_DEG}°. Please narrow the search area.`
    )
  }
}

export interface GridGeneratorOptions {
  boundingBox: GeographicBoundingBox
  gridSpacingDeg?: number
  maxCells?: number
}

function roundCoord4(val: number): number {
  const rounded = Math.round(val * 10000) / 10000
  return Object.is(rounded, -0) ? 0 : rounded
}

function formatCellCoord(val: number): string {
  const normalized = roundCoord4(val)
  return `${normalized >= 0 ? "+" : ""}${normalized.toFixed(4)}`
}

export function validateMaxCells(maxCells?: number): number {
  if (maxCells === undefined) {
    return DEFAULT_MAX_CELLS
  }
  if (
    typeof maxCells !== "number" ||
    !Number.isFinite(maxCells) ||
    !Number.isInteger(maxCells) ||
    maxCells < 1 ||
    maxCells > HARD_CEILING_MAX_CELLS
  ) {
    throw new GridValidationError(
      `maxCells (${String(maxCells)}) must be an integer between 1 and ${HARD_CEILING_MAX_CELLS}.`
    )
  }
  return maxCells
}

/**
 * Deterministically generates geographic grid sampling cells across a validated bounding box
 * using exact integer row/column indexing to avoid floating-point accumulation drift.
 */
export function generateDiscoveryGrid(options: GridGeneratorOptions): DiscoveryGridCell[] {
  const { boundingBox } = options
  validateDiscoveryBoundingBox(boundingBox)

  const spacing = options.gridSpacingDeg ?? DEFAULT_GRID_SPACING_DEG
  if (typeof spacing !== "number" || Number.isNaN(spacing) || !Number.isFinite(spacing)) {
    throw new GridValidationError("gridSpacingDeg must be a valid number.")
  }
  if (spacing < MIN_GRID_SPACING_DEG || spacing > MAX_GRID_SPACING_DEG) {
    throw new GridValidationError(
      `gridSpacingDeg (${spacing}°) must be between ${MIN_GRID_SPACING_DEG}° and ${MAX_GRID_SPACING_DEG}°.`
    )
  }

  const maxAllowedCells = validateMaxCells(options.maxCells)

  const [minLat, minLon, maxLat, maxLon] = boundingBox
  const latSpan = maxLat - minLat
  const lonSpan = maxLon - minLon

  const rawRowCount = Math.floor((latSpan + 1e-9) / spacing)
  const rawColCount = Math.floor((lonSpan + 1e-9) / spacing)
  const rowCount = Math.max(1, rawRowCount)
  const colCount = Math.max(1, rawColCount)
  const totalCells = rowCount * colCount

  if (totalCells > maxAllowedCells) {
    throw new GridValidationError(
      `Requested search area with ${spacing}° spacing yields ${totalCells} cells, exceeding the limit of ${maxAllowedCells} cells (server hard ceiling: ${HARD_CEILING_MAX_CELLS}). Increase gridSpacingDeg or reduce bounding box size.`,
      { estimatedTotal: totalCells, maxAllowedCells, spacing }
    )
  }

  const cells: DiscoveryGridCell[] = []
  const halfSpacing = spacing / 2

  for (let row = 0; row < rowCount; row++) {
    const rawLat =
      rawRowCount === 0
        ? (minLat + maxLat) / 2
        : minLat + (row + 0.5) * spacing
    const roundedLat = roundCoord4(rawLat)
    const cellMinLat = rawRowCount === 0 ? roundCoord4(minLat) : Math.max(minLat, roundCoord4(rawLat - halfSpacing))
    const cellMaxLat = rawRowCount === 0 ? roundCoord4(maxLat) : Math.min(maxLat, roundCoord4(rawLat + halfSpacing))

    for (let col = 0; col < colCount; col++) {
      const rawLon =
        rawColCount === 0
          ? (minLon + maxLon) / 2
          : minLon + (col + 0.5) * spacing
      const roundedLon = roundCoord4(rawLon)
      const cellMinLon = rawColCount === 0 ? roundCoord4(minLon) : Math.max(minLon, roundCoord4(rawLon - halfSpacing))
      const cellMaxLon = rawColCount === 0 ? roundCoord4(maxLon) : Math.min(maxLon, roundCoord4(rawLon + halfSpacing))

      const id = `cell_${formatCellCoord(roundedLat)}_${formatCellCoord(roundedLon)}`

      cells.push({
        id,
        latitude: roundedLat,
        longitude: roundedLon,
        boundingBox: [cellMinLat, cellMinLon, cellMaxLat, cellMaxLon],
        row,
        col,
      })
    }
  }

  return cells
}
