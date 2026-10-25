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
    isCrossBodyComparable: true,
  },
  {
    key: "diurnalTempRangeC",
    label: "Diurnal temperature range",
    shortLabel: "Diurnal range",
    unit: "°C",
    description: "Typical day–night surface temperature swing.",
    kind: "linear",
    tolerance: 150,
    isCrossBodyComparable: true,
  },
  {
    key: "annualPrecipitationMm",
    label: "Annual precipitation",
    shortLabel: "Precipitation",
    unit: "mm/yr",
    description: "Liquid-equivalent precipitation. Target bodies lack active rainfall.",
    kind: "linear",
    tolerance: 500,
    isCrossBodyComparable: false,
    incomparabilityNotice: "Target bodies have 0 mm/yr liquid rainfall; active precipitation cannot be physically matched to dry/vacuum surfaces.",
  },
  {
    key: "meanSlopeDeg",
    label: "Mean terrain slope",
    shortLabel: "Slope",
    unit: "°",
    description: "Average slope across a rover-scale traverse area.",
    kind: "linear",
    tolerance: 25,
    isCrossBodyComparable: true,
  },
  {
    key: "rockAbundancePct",
    label: "Rock abundance",
    shortLabel: "Rock cover",
    unit: "%",
    description: "Fraction of surface covered by clasts larger than ~10 cm.",
    kind: "linear",
    tolerance: 40,
    isCrossBodyComparable: true,
  },
  {
    key: "medianGrainSizeMm",
    label: "Median grain size",
    shortLabel: "Grain size",
    unit: "mm",
    description: "Median particle size of loose surface material, compared on a log scale.",
    kind: "logarithmic",
    tolerance: 2,
    isCrossBodyComparable: true,
  },
  {
    key: "albedo",
    label: "Surface albedo",
    shortLabel: "Albedo",
    unit: "",
    description: "Broadband visible reflectance (0–1).",
    kind: "linear",
    tolerance: 0.35,
    isCrossBodyComparable: true,
  },
  {
    key: "vegetationCoverPct",
    label: "Vegetation cover",
    shortLabel: "Vegetation",
    unit: "%",
    description: "Fractional plant cover. Extraterrestrial targets are zero.",
    kind: "linear",
    tolerance: 40,
    isCrossBodyComparable: true,
  },
  {
    key: "lithology",
    label: "Dominant lithology",
    shortLabel: "Lithology",
    unit: "",
    description: "Dominant rock or regolith type, compared by category and rock family.",
    kind: "categorical",
    isCrossBodyComparable: true,
  },
  {
    key: "elevationM",
    label: "Elevation relative to datum",
    shortLabel: "Elevation",
    unit: "m",
    description: "Surface elevation relative to planetary reference datum (MOLA areoid, LOLA sphere, or Earth geoid).",
    kind: "linear",
    tolerance: 5000,
    isCrossBodyComparable: true,
  },
  {
    key: "surfacePressurePa",
    label: "Surface atmospheric pressure",
    shortLabel: "Pressure",
    unit: "Pa",
    description: "Surface atmospheric pressure.",
    kind: "logarithmic",
    tolerance: 2,
    isCrossBodyComparable: false,
    incomparabilityNotice: "Extreme physical disparity: Moon is vacuum (~0 Pa) and Mars is ~700 Pa, compared to Earth sea level (~101,325 Pa). Excluded from similarity scoring.",
  },
  {
    key: "surfaceSolarIrradianceWm2",
    label: "Surface solar irradiance",
    shortLabel: "Solar flux",
    unit: "W/m²",
    description: "Incident downward solar irradiance at the surface.",
    kind: "linear",
    tolerance: 300,
    isCrossBodyComparable: true,
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
      annualPrecipitationMm: 0, // Flagged non-comparable across bodies
      meanSlopeDeg: 3,
      rockAbundancePct: 3,
      medianGrainSizeMm: 2.5,
      albedo: 1,
      vegetationCoverPct: 2,
      lithology: 0.5,
      elevationM: 1,
      surfacePressurePa: 0, // Excluded from planetary matching
      surfaceSolarIrradianceWm2: 1,
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
      annualPrecipitationMm: 0, // Flagged non-comparable across bodies
      meanSlopeDeg: 0.5,
      rockAbundancePct: 0.5,
      medianGrainSizeMm: 1,
      albedo: 1.5,
      vegetationCoverPct: 1.5,
      lithology: 3,
      elevationM: 0.5,
      surfacePressurePa: 0, // Excluded from planetary matching
      surfaceSolarIrradianceWm2: 1,
    },
  },
]

export function getMissionPurpose(id: string): MissionPurposeDefinition | undefined {
  return MISSION_PURPOSES.find((purpose) => purpose.id === id)
}

export function isMissionPurpose(value: string): value is MissionPurpose {
  return MISSION_PURPOSES.some((purpose) => purpose.id === value)
}
