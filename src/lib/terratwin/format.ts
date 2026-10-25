import { FEATURE_MAP, LITHOLOGY_LABELS } from "./features"
import type { DataConfidence, FeatureKey, Lithology } from "./types"

export function formatFeatureValue(key: FeatureKey, value: number | string | null): string {
  if (value === null) return "No data"
  if (key === "lithology") return LITHOLOGY_LABELS[value as Lithology]

  const { unit } = FEATURE_MAP[key]
  const numeric = value as number
  const formatted =
    key === "albedo" ? numeric.toFixed(2) : key === "medianGrainSizeMm" ? numeric.toString() : numeric.toFixed(0)
  return unit ? `${formatted} ${unit}` : formatted
}

export function formatScore(score: number): string {
  return score.toFixed(1)
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
}
