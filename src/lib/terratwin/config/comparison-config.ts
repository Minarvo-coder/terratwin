import type { FeatureKey } from "../types"

export type NormalizationKind = "linear" | "logarithmic" | "categorical"

export interface ConfigurableFeatureDefinition {
  key: FeatureKey
  label: string
  shortLabel: string
  unit: string
  description: string
  kind: NormalizationKind
  tolerance?: number
  isCrossBodyComparable: boolean
  incomparabilityNotice?: string
  normalizationMethod: string
  scientificJustification: string
  statusLabel: string
}

export interface ConfigurableMissionProfile {
  id: string
  label: string
  summary: string
  statusNotice: string
  weights: Record<FeatureKey, number>
}

/**
 * Dedicated Environmental Comparison Feature Definitions.
 * 
 * NOTE ON SCIENTIFIC STATUS:
 * Normalization methods, tolerances, and feature selections are initial prototype
 * assumptions formulated for the TerraTwin Earth-Moon-Mars Analog Explorer.
 * They represent physically defensible initial approximations that require formal
 * scientific review by the mission design team.
 */
export const COMPARISON_FEATURES: ConfigurableFeatureDefinition[] = [
  {
    key: "meanSlopeDeg",
    label: "Mean terrain slope",
    shortLabel: "Slope",
    unit: "°",
    description: "Average topographic gradient across rover-scale traverse areas.",
    kind: "linear",
    tolerance: 25,
    isCrossBodyComparable: true,
    normalizationMethod: "Linear difference normalized by maximum operational slope threshold: min(1, |T - C| / 25°).",
    scientificJustification:
      "Primary trafficability factor: governs wheel slip, drivetrain torque limits, tipping risk, and safe autonomous navigation paths.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "rockAbundancePct",
    label: "Rock abundance / Terrain roughness",
    shortLabel: "Rock cover",
    unit: "%",
    description: "Fraction of surface covered by cobbles and boulders (> ~10 cm).",
    kind: "linear",
    tolerance: 40,
    isCrossBodyComparable: true,
    normalizationMethod: "Linear difference normalized by rock hazard threshold: min(1, |T - C| / 40%).",
    scientificJustification:
      "Obstacle density and clearance hazard: controls wheel wear, suspension stress, clearance margin, and obstacle-avoidance algorithms.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "medianGrainSizeMm",
    label: "Median regolith grain size",
    shortLabel: "Grain size",
    unit: "mm",
    description: "Median particle size (D50) of loose surface regolith and soil.",
    kind: "logarithmic",
    tolerance: 2.0,
    isCrossBodyComparable: true,
    normalizationMethod: "Logarithmic difference across decades: min(1, |log10(T) - log10(C)| / 2.0).",
    scientificJustification:
      "Terramechanics and sinkage: dictates soil cohesion, internal friction angle, wheel sinkage (Bekker-Wong theory), and abrasive dust suspension.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "elevationM",
    label: "Elevation relative to datum",
    shortLabel: "Elevation",
    unit: "m",
    description: "Surface elevation relative to planetary datum (MOLA areoid, LOLA sphere, or Earth geoid).",
    kind: "linear",
    tolerance: 5000,
    isCrossBodyComparable: true,
    normalizationMethod: "Linear difference normalized by relief threshold: min(1, |T - C| / 5000 m).",
    scientificJustification:
      "Regional topographical context: provides elevation relief scale and correlates with planetary atmospheric scale height.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "vegetationCoverPct",
    label: "Vegetation cover",
    shortLabel: "Vegetation",
    unit: "%",
    description: "Fractional vascular/cryptogamic plant cover. Target planetary bodies are 0%.",
    kind: "linear",
    tolerance: 40,
    isCrossBodyComparable: true,
    normalizationMethod: "Linear difference normalized by vegetation threshold: min(1, |T - C| / 40%).",
    scientificJustification:
      "Ensures terrestrial analog ground is free of biological obstructions that do not exist on the Moon or Mars.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "diurnalTempRangeC",
    label: "Diurnal temperature range",
    shortLabel: "Diurnal swing",
    unit: "°C",
    description: "Typical day-to-night ground surface temperature variation.",
    kind: "linear",
    tolerance: 150,
    isCrossBodyComparable: true,
    normalizationMethod: "Linear difference normalized by thermal swing threshold: min(1, |T - C| / 150°C).",
    scientificJustification:
      "Thermal cycling stress: tests actuator grease viscosity, cold-start battery performance, and structural thermal fatigue.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "meanSurfaceTempC",
    label: "Mean surface temperature",
    shortLabel: "Mean temp.",
    unit: "°C",
    description: "Annual or diurnally averaged surface ground temperature.",
    kind: "linear",
    tolerance: 150,
    isCrossBodyComparable: true,
    normalizationMethod: "Linear difference normalized by extreme temperature threshold: min(1, |T - C| / 150°C).",
    scientificJustification:
      "Operating thermal baseline: determines baseline power draw for survival heaters and avionics thermal regulation.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "surfaceSolarIrradianceWm2",
    label: "Surface solar irradiance",
    shortLabel: "Solar flux",
    unit: "W/m²",
    description: "Mean incident downward solar flux reaching the surface.",
    kind: "linear",
    tolerance: 300,
    isCrossBodyComparable: true,
    normalizationMethod: "Linear difference normalized by maximum solar variance: min(1, |T - C| / 300 W/m²).",
    scientificJustification:
      "Power budget and optical navigation: dictates solar array power recharge profiles and ambient lighting for visual odometry.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "lithology",
    label: "Dominant lithology",
    shortLabel: "Lithology",
    unit: "",
    description: "Dominant rock or regolith mineralogical petrology class.",
    kind: "categorical",
    isCrossBodyComparable: true,
    normalizationMethod: "Categorical distance: 0.0 (exact match), 0.5 (same petrological family), 1.0 (different family).",
    scientificJustification:
      "Bedrock hardness and cleat traction: controls wheel abrasion against basaltic vs. sedimentary rock and boulder fracture behavior.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "albedo",
    label: "Surface albedo",
    shortLabel: "Albedo",
    unit: "",
    description: "Broadband visible/shortwave solar reflectance (0 to 1).",
    kind: "linear",
    tolerance: 0.35,
    isCrossBodyComparable: true,
    normalizationMethod: "Linear difference normalized by albedo span: min(1, |T - C| / 0.35).",
    scientificJustification:
      "Thermal radiation balance and camera dynamic range: controls surface heating rates and camera exposure contrast.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "annualPrecipitationMm",
    label: "Annual precipitation",
    shortLabel: "Precipitation",
    unit: "mm/yr",
    description: "Liquid-equivalent atmospheric precipitation.",
    kind: "linear",
    tolerance: 500,
    isCrossBodyComparable: false,
    incomparabilityNotice:
      "Target planetary bodies lack active liquid water cycles (0 mm/yr). Active precipitation cannot be meaningfully compared against desiccated or vacuum planetary surfaces.",
    normalizationMethod: "Physically excluded from planetary cross-body scoring.",
    scientificJustification:
      "Preserved as contextual terrestrial environmental metric, but strictly excluded (weight = 0) from planetary similarity.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
  {
    key: "surfacePressurePa",
    label: "Surface atmospheric pressure",
    shortLabel: "Pressure",
    unit: "Pa",
    description: "Surface atmospheric barometric pressure.",
    kind: "logarithmic",
    tolerance: 2.0,
    isCrossBodyComparable: false,
    incomparabilityNotice:
      "Extreme physical disparity: Moon is hard vacuum (~0 Pa) and Mars is ~700 Pa, compared to Earth sea level (~101,325 Pa). Excluded from similarity scoring.",
    normalizationMethod: "Physically excluded from planetary cross-body scoring.",
    scientificJustification:
      "Atmospheric drag and aerodynamics cannot be matched between Earth sea level and extraterrestrial vacuum.",
    statusLabel: "Initial prototype assumption — requires team review",
  },
]

export const COMPARISON_FEATURE_MAP: Record<FeatureKey, ConfigurableFeatureDefinition> = Object.fromEntries(
  COMPARISON_FEATURES.map((f) => [f.key, f]),
) as Record<FeatureKey, ConfigurableFeatureDefinition>

/**
 * Validates mission profile weights:
 * 1. Every weight must be non-negative (>= 0).
 * 2. Sum of all weights must equal 1.0 within a reasonable tolerance (default: 1e-5).
 */
export function validateMissionWeights(
  weights: Record<string, number>,
  tolerance = 1e-5,
): { isValid: boolean; sum: number; errors: string[] } {
  const errors: string[] = []
  let sum = 0

  for (const [key, val] of Object.entries(weights)) {
    if (typeof val !== "number" || Number.isNaN(val)) {
      errors.push(`Feature "${key}" has non-numeric weight: ${val}`)
      continue
    }
    if (val < 0) {
      errors.push(`Feature "${key}" has negative weight: ${val}. Weights must be non-negative.`)
    }
    sum += val
  }

  const diff = Math.abs(sum - 1.0)
  if (diff > tolerance) {
    errors.push(`Weights must sum to 1.0 (actual sum: ${sum.toFixed(6)}, diff: ${diff.toFixed(6)}).`)
  }

  return {
    isValid: errors.length === 0,
    sum: Math.round(sum * 1e6) / 1e6,
    errors,
  }
}

/**
 * Initial Rover-Testing Mission Profile
 * Calibrated specifically for mobility, obstacle hazards, and terrain trafficability.
 * 
 * Weights are strictly non-negative and sum exactly to 1.00:
 * - meanSlopeDeg: 0.25
 * - rockAbundancePct: 0.20
 * - medianGrainSizeMm: 0.15
 * - elevationM: 0.10
 * - vegetationCoverPct: 0.10
 * - diurnalTempRangeC: 0.05
 * - meanSurfaceTempC: 0.05
 * - surfaceSolarIrradianceWm2: 0.05
 * - lithology: 0.05
 * - albedo: 0.00
 * - annualPrecipitationMm: 0.00 (excluded)
 * - surfacePressurePa: 0.00 (excluded)
 * Total: 1.00
 */
export const ROVER_TESTING_PROFILE: ConfigurableMissionProfile = {
  id: "rover-testing",
  label: "Rover testing & trafficability",
  summary:
    "Prioritises vehicle mobility, obstacle clearance, terrain slope, regolith shear strength, and bare ground trials.",
  statusNotice:
    "Initial prototype profile assumption. Weights reflect rover engineering priorities and require formal team review.",
  weights: {
    meanSlopeDeg: 0.25,
    rockAbundancePct: 0.20,
    medianGrainSizeMm: 0.15,
    elevationM: 0.10,
    vegetationCoverPct: 0.10,
    diurnalTempRangeC: 0.05,
    meanSurfaceTempC: 0.05,
    surfaceSolarIrradianceWm2: 0.05,
    lithology: 0.05,
    albedo: 0.0,
    annualPrecipitationMm: 0.0,
    surfacePressurePa: 0.0,
  },
}

/**
 * Secondary Geological Field Research Profile
 * Calibrated for rock petrology, minimal vegetative overprint, and desert weathering analogy.
 * Weights are strictly non-negative and sum exactly to 1.00.
 */
export const GEOLOGICAL_RESEARCH_PROFILE: ConfigurableMissionProfile = {
  id: "geological-research",
  label: "Geological field research",
  summary:
    "Prioritises lithological petrology, low vegetative overprint, regolith maturity, and surface albedo.",
  statusNotice:
    "Initial prototype profile assumption. Weights reflect geological field training priorities and require team review.",
  weights: {
    lithology: 0.30,
    vegetationCoverPct: 0.15,
    albedo: 0.15,
    medianGrainSizeMm: 0.10,
    rockAbundancePct: 0.10,
    meanSlopeDeg: 0.10,
    meanSurfaceTempC: 0.05,
    surfaceSolarIrradianceWm2: 0.05,
    diurnalTempRangeC: 0.0,
    elevationM: 0.0,
    annualPrecipitationMm: 0.0,
    surfacePressurePa: 0.0,
  },
}

export const CONFIGURABLE_MISSION_PROFILES: ConfigurableMissionProfile[] = [
  ROVER_TESTING_PROFILE,
  GEOLOGICAL_RESEARCH_PROFILE,
]

// Validate default profiles at module load time to guarantee structural integrity
const roverValidation = validateMissionWeights(ROVER_TESTING_PROFILE.weights)
if (!roverValidation.isValid) {
  throw new Error(`Invalid ROVER_TESTING_PROFILE weights: ${roverValidation.errors.join("; ")}`)
}

const geoValidation = validateMissionWeights(GEOLOGICAL_RESEARCH_PROFILE.weights)
if (!geoValidation.isValid) {
  throw new Error(`Invalid GEOLOGICAL_RESEARCH_PROFILE weights: ${geoValidation.errors.join("; ")}`)
}
