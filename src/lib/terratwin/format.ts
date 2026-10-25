import { FEATURE_MAP, LITHOLOGY_LABELS } from "./features"
import type { DataConfidence, FeatureKey, Lithology } from "./types"

export function formatFeatureValue(key: FeatureKey, value: number | string | null): string {
  if (value === null || value === undefined) return "No data"
  if (key === "lithology") return LITHOLOGY_LABELS[value as Lithology] ?? String(value)

  const feature = FEATURE_MAP[key]
  const unit = feature?.unit ?? ""
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) return String(value)

  let formatted: string
  if (key === "albedo") {
    formatted = numeric.toFixed(2)
  } else if (key === "medianGrainSizeMm") {
    formatted = numeric.toString()
  } else if (key === "elevationM" || key === "surfacePressurePa") {
    formatted = Math.round(numeric).toLocaleString()
  } else if (key === "meanSurfaceTempC" || key === "diurnalTempRangeC") {
    formatted = numeric.toFixed(1)
  } else {
    formatted = Math.round(numeric).toString()
  }

  return unit ? `${formatted} ${unit}` : formatted
}

export function formatScore(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return "Insufficient data"
  return `${score.toFixed(1)}%`
}

export function formatCoverage(coverage: number): string {
  return `${Math.round(coverage * 100)}%`
}

export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? "N" : "S"}`
  const lng = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? "E" : "W"}`
  return `${lat}, ${lng}`
}

export const CONFIDENCE_LABELS: Record<DataConfidence, string> = {
  high: "High data coverage",
  moderate: "Partial data",
  low: "Low data coverage",
  insufficient: "Insufficient data to rank reliably",
}
