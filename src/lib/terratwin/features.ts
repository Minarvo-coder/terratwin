import type {
  FeatureDefinition,
  FeatureKey,
  Lithology,
  MissionPurposeDefinition,
  MissionPurpose,
} from "./types"

export const FEATURES: FeatureDefinition[] = [
  {
    key: "meanSurfaceTempC",
    label: "Mean surface temperature",
    shortLabel: "Mean temp.",
    unit: "°C",
    description: "Annual or diurnally averaged surface temperature.",
    kind: "linear",
    tolerance: 150,
  },
  {
    key: "diurnalTempRangeC",
    label: "Diurnal temperature range",
    shortLabel: "Diurnal range",
    unit: "°C",
    description: "Typical day–night surface temperature swing.",
    kind: "linear",
    tolerance: 150,
  },
  {
    key: "annualPrecipitationMm",
    label: "Annual precipitation",
    shortLabel: "Precipitation",
    unit: "mm/yr",
    description: "Liquid-equivalent precipitation. Moon and Mars targets are treated as zero.",
    kind: "linear",
    tolerance: 500,
  },
  {
    key: "meanSlopeDeg",
    label: "Mean terrain slope",
    shortLabel: "Slope",
    unit: "°",
    description: "Average slope across a rover-scale traverse area.",
    kind: "linear",
    tolerance: 25,
  },
  {
    key: "rockAbundancePct",
    label: "Rock abundance",
    shortLabel: "Rock cover",
    unit: "%",
    description: "Fraction of surface covered by clasts larger than ~10 cm.",
    kind: "linear",
    tolerance: 40,
  },
  {
    key: "medianGrainSizeMm",
    label: "Median grain size",
    shortLabel: "Grain size",
    unit: "mm",
    description: "Median particle size of loose surface material, compared on a log scale.",
    kind: "logarithmic",
    tolerance: 2,
  },
  {
    key: "albedo",
    label: "Surface albedo",
    shortLabel: "Albedo",
    unit: "",
    description: "Broadband visible reflectance (0–1).",
    kind: "linear",
    tolerance: 0.35,
  },
  {
    key: "vegetationCoverPct",
    label: "Vegetation cover",
    shortLabel: "Vegetation",
    unit: "%",
    description: "Fractional plant cover. Targets are treated as zero.",
    kind: "linear",
    tolerance: 40,
  },
  {
    key: "lithology",
    label: "Dominant lithology",
    shortLabel: "Lithology",
    unit: "",
    description: "Dominant rock or regolith type, compared by category and rock family.",
    kind: "categorical",
  },
]

export const FEATURE_MAP: Record<FeatureKey, FeatureDefinition> = Object.fromEntries(
  FEATURES.map((feature) => [feature.key, feature]),
) as Record<FeatureKey, FeatureDefinition>

export const LITHOLOGY_LABELS: Record<Lithology, string> = {
  basaltic: "Basaltic",
  anorthositic: "Anorthositic",
  "volcanic-tephra": "Volcanic tephra",
  "sulfate-evaporite": "Sulfate / evaporite",
  "clay-sedimentary": "Clay-bearing sedimentary",
  "impact-breccia": "Impact breccia",
  "felsic-crystalline": "Felsic crystalline",
}

export const LITHOLOGY_FAMILIES: Record<Lithology, "igneous" | "sedimentary" | "impact" | "crystalline"> = {
  basaltic: "igneous",
  anorthositic: "igneous",
  "volcanic-tephra": "igneous",
  "sulfate-evaporite": "sedimentary",
  "clay-sedimentary": "sedimentary",
  "impact-breccia": "impact",
  "felsic-crystalline": "crystalline",
}

export const MISSION_PURPOSES: MissionPurposeDefinition[] = [
  {
    id: "rover-testing",
    label: "Rover testing",
    summary:
      "Prioritises trafficability: slope, rock abundance, grain size and a vegetation-free surface for mobility and navigation trials.",
    weights: {
      meanSurfaceTempC: 1,
      diurnalTempRangeC: 1.5,
      annualPrecipitationMm: 1,
      meanSlopeDeg: 3,
      rockAbundancePct: 3,
      medianGrainSizeMm: 2.5,
      albedo: 1,
      vegetationCoverPct: 2,
      lithology: 0.5,
    },
  },
  {
    id: "geological-research",
    label: "Geological field research",
    summary:
      "Prioritises compositional and process analogy: lithology, aridity and limited biological overprint for science-team training.",
    weights: {
      meanSurfaceTempC: 1,
      diurnalTempRangeC: 0.5,
      annualPrecipitationMm: 2,
      meanSlopeDeg: 0.5,
      rockAbundancePct: 0.5,
      medianGrainSizeMm: 1,
      albedo: 1.5,
      vegetationCoverPct: 1.5,
      lithology: 3,
    },
  },
]

export function getMissionPurpose(id: string): MissionPurposeDefinition | undefined {
  return MISSION_PURPOSES.find((purpose) => purpose.id === id)
}

export function isMissionPurpose(value: string): value is MissionPurpose {
  return MISSION_PURPOSES.some((purpose) => purpose.id === value)
}
