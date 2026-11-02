import { FEATURE_MAP, LITHOLOGY_LABELS } from "./features.ts"
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
  } else if (key === "surfacePressurePa") {
    if (numeric > 0 && numeric < 0.01) {
      formatted = numeric.toExponential(1)
    } else {
      formatted = Math.round(numeric).toLocaleString("en-US")
    }
  } else if (key === "elevationM") {
    formatted = Math.round(numeric).toLocaleString("en-US")
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

export type ComparabilityClassification =
  | "DIRECTLY_COMPARABLE"
  | "COMPARABLE_AFTER_TRANSFORMATION"
  | "PROXY_BASED"
  | "NOT_COMPARABLE"

export interface ComparabilityInfo {
  classification: ComparabilityClassification
  label: string
  badgeVariant: "emerald" | "amber" | "purple" | "rose"
  rationale: string
}

export function getFeatureComparabilityInfo(key: FeatureKey): ComparabilityInfo {
  switch (key) {
    case "meanSurfaceTempC":
    case "surfaceSolarIrradianceWm2":
    case "rockAbundancePct":
    case "medianGrainSizeMm":
    case "albedo":
    case "vegetationCoverPct":
      return {
        classification: "DIRECTLY_COMPARABLE",
        label: "Directly Comparable",
        badgeVariant: "emerald",
        rationale: "Standardized physical parameter directly comparable across planetary bodies.",
      }
    case "diurnalTempRangeC":
    case "meanSlopeDeg":
      return {
        classification: "COMPARABLE_AFTER_TRANSFORMATION",
        label: "Transformed Proxy",
        badgeVariant: "amber",
        rationale: "Derived using thermal cycle normalization or Horn 3x3 finite-difference spatial filter.",
      }
    case "lithology":
      return {
        classification: "PROXY_BASED",
        label: "Petrogenetic Proxy",
        badgeVariant: "purple",
        rationale: "Categorical distance matrix comparing mineralogical and geochemical assemblage.",
      }
    case "surfacePressurePa":
      return {
        classification: "NOT_COMPARABLE",
        label: "Physically Incomparable",
        badgeVariant: "rose",
        rationale: "Extreme 2 to 14 orders of magnitude disparity (Earth ~100 kPa vs Mars ~0.7 kPa vs Moon < 10⁻⁹ Pa). Excluded from similarity denominator.",
      }
    case "annualPrecipitationMm":
      return {
        classification: "NOT_COMPARABLE",
        label: "Physically Incomparable",
        badgeVariant: "rose",
        rationale: "Active extraterrestrial surfaces have 0.0 mm liquid rainfall in the present epoch. Excluded from similarity denominator.",
      }
    case "elevationM":
      return {
        classification: "NOT_COMPARABLE",
        label: "Distinct Datums",
        badgeVariant: "rose",
        rationale: "Referenced to physically distinct datums (EGM96 geoid, MOLA IAU2000 areoid, or LOLA 1,737.4 km sphere).",
      }
    default:
      return {
        classification: "DIRECTLY_COMPARABLE",
        label: "Comparable",
        badgeVariant: "emerald",
        rationale: "Standard feature comparison.",
      }
  }
}

export interface ProvenanceBadgeInfo {
  label: string
  sublabel?: string
  variant: "pds" | "power" | "literature" | "demo"
}

export function getProvenanceBadgeInfo(sourceTitle?: string, status?: string): ProvenanceBadgeInfo {
  if (status === "illustrative" || status === "no-data" || !sourceTitle) {
    return { label: "DEMO", variant: "demo" }
  }

  const titleUpper = sourceTitle.toUpperCase()

  if (titleUpper.includes("MOLA") || titleUpper.includes("MEGDR")) {
    return { label: "MOLA", sublabel: "PDS", variant: "pds" }
  }
  if (titleUpper.includes("LOLA") || titleUpper.includes("LDEM")) {
    return { label: "LOLA", sublabel: "PDS", variant: "pds" }
  }
  if (titleUpper.includes("MEDA")) {
    return { label: "MEDA", sublabel: "M2020", variant: "pds" }
  }
  if (titleUpper.includes("REMS")) {
    return { label: "REMS", sublabel: "MSL", variant: "pds" }
  }
  if (titleUpper.includes("ATHENA") || titleUpper.includes("OPPORTUNITY")) {
    return { label: "ATHENA", sublabel: "MER", variant: "pds" }
  }
  if (titleUpper.includes("DIVINER")) {
    return { label: "DIVINER", sublabel: "LRO", variant: "pds" }
  }
  if (titleUpper.includes("EXOSPHERE") || titleUpper.includes("APOLLO")) {
    return { label: "APOLLO", sublabel: "LACE", variant: "pds" }
  }
  if (titleUpper.includes("POWER") || titleUpper.includes("LARC") || titleUpper.includes("NASA POWER")) {
    return { label: "NASA POWER", sublabel: "LaRC", variant: "power" }
  }
  if (titleUpper.includes("LITERATURE") || titleUpper.includes("FIELD STUDY") || titleUpper.includes("USGS")) {
    return { label: "LITERATURE", sublabel: "PEER-REVIEWED", variant: "literature" }
  }

  if (status === "verified") {
    return { label: "VERIFIED", sublabel: "NASA", variant: "pds" }
  }

  return { label: "CATALOG", variant: "literature" }
}
