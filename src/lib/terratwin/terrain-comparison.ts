import { FEATURE_MAP, LITHOLOGY_FAMILIES, LITHOLOGY_LABELS } from "./features.ts"
import { clamp01 } from "./similarity-engine.ts"
import type {
  EarthCandidate,
  FeatureKey,
  Lithology,
  MissionPurposeDefinition,
  PlanetaryTarget,
  RankedCandidate,
} from "./types.ts"

export type TerrainDomainKey =
  | "topography"
  | "geomorphology"
  | "radiative_thermal"
  | "geology"
  | "incomparable"

export interface TerrainDomainDefinition {
  key: TerrainDomainKey
  label: string
  shortLabel: string
  description: string
  features: FeatureKey[]
}

export const TERRAIN_DOMAINS: TerrainDomainDefinition[] = [
  {
    key: "topography",
    label: "Topography & Relief",
    shortLabel: "Topography",
    description: "Surface incline, terrain gradient, and datum-relative elevation.",
    features: ["meanSlopeDeg", "elevationM"],
  },
  {
    key: "geomorphology",
    label: "Geomorphology & Trafficability",
    shortLabel: "Trafficability",
    description: "Surface boulder distribution, regolith grain size, and terrain roughness.",
    features: ["rockAbundancePct", "medianGrainSizeMm"],
  },
  {
    key: "radiative_thermal",
    label: "Radiative & Thermal Environment",
    shortLabel: "Thermal & Solar",
    description: "Surface temperature extremes, diurnal thermal swings, albedo, and incident solar flux.",
    features: ["meanSurfaceTempC", "diurnalTempRangeC", "albedo", "surfaceSolarIrradianceWm2"],
  },
  {
    key: "geology",
    label: "Geology & Composition",
    shortLabel: "Geology",
    description: "Dominant rock petrology and vegetative cover overprint.",
    features: ["lithology", "vegetationCoverPct"],
  },
  {
    key: "incomparable",
    label: "Non-Comparable Planetary Physics",
    shortLabel: "Physical Disparities",
    description: "Planetary atmospheric pressure and active precipitation exhibiting extreme physical disparities.",
    features: ["surfacePressurePa", "annualPrecipitationMm"],
  },
]

export interface RadarDataPoint {
  parameter: string
  featureKey: FeatureKey
  targetNorm: number
  candidateNorm: number
  targetRaw: number | string | null
  candidateRaw: number | string | null
  unit: string
  targetDisplay: string
  candidateDisplay: string
}

/**
 * Normalizes physical environmental measurements into a 0-100 radar chart space
 * preserving authentic physical values in metadata for tooltips.
 */
export function buildTerrainRadarData(
  target: PlanetaryTarget,
  candidate: EarthCandidate,
): RadarDataPoint[] {
  const radarFeatures: Array<{
    key: FeatureKey
    label: string
    min: number
    max: number
    isLog?: boolean
  }> = [
    { key: "meanSlopeDeg", label: "Slope (°)", min: 0, max: 30 },
    { key: "rockAbundancePct", label: "Rock Abundance (%)", min: 0, max: 35 },
    { key: "medianGrainSizeMm", label: "Grain Size (mm)", min: 0.01, max: 5.0, isLog: true },
    { key: "albedo", label: "Albedo (0–1)", min: 0.05, max: 0.40 },
    { key: "meanSurfaceTempC", label: "Mean Temp (°C)", min: -150, max: 35 },
    { key: "surfaceSolarIrradianceWm2", label: "Solar Flux (W/m²)", min: 50, max: 350 },
  ]

  return radarFeatures.map(({ key, label, min, max, isLog }) => {
    const targetVal = target.environment[key] as number | null | undefined
    const candVal = candidate.environment[key] as number | null | undefined
    const def = FEATURE_MAP[key]

    let targetNorm = 0
    let candNorm = 0

    if (targetVal !== null && targetVal !== undefined && Number.isFinite(targetVal)) {
      if (isLog) {
        const logMin = Math.log10(Math.max(1e-4, min))
        const logMax = Math.log10(max)
        const logVal = Math.log10(Math.max(1e-4, targetVal))
        targetNorm = Math.round(clamp01((logVal - logMin) / (logMax - logMin)) * 100)
      } else {
        targetNorm = Math.round(clamp01((targetVal - min) / (max - min)) * 100)
      }
    }

    if (candVal !== null && candVal !== undefined && Number.isFinite(candVal)) {
      if (isLog) {
        const logMin = Math.log10(Math.max(1e-4, min))
        const logMax = Math.log10(max)
        const logVal = Math.log10(Math.max(1e-4, candVal))
        candNorm = Math.round(clamp01((logVal - logMin) / (logMax - logMin)) * 100)
      } else {
        candNorm = Math.round(clamp01((candVal - min) / (max - min)) * 100)
      }
    }

    return {
      parameter: label,
      featureKey: key,
      targetNorm,
      candidateNorm: candNorm,
      targetRaw: targetVal ?? null,
      candidateRaw: candVal ?? null,
      unit: def?.unit ?? "",
      targetDisplay: targetVal !== null && targetVal !== undefined ? `${targetVal} ${def?.unit ?? ""}`.trim() : "N/A",
      candidateDisplay: candVal !== null && candVal !== undefined ? `${candVal} ${def?.unit ?? ""}`.trim() : "N/A",
    }
  })
}

export function classifyWentworthGrainSize(sizeMm: number | null | undefined): string {
  if (sizeMm === null || sizeMm === undefined || !Number.isFinite(sizeMm)) return "Uncharacterized"
  if (sizeMm < 0.004) return "Clay (<0.004 mm)"
  if (sizeMm < 0.0625) return "Silt (0.004–0.063 mm)"
  if (sizeMm < 0.125) return "Very Fine Sand (0.063–0.125 mm)"
  if (sizeMm < 0.25) return "Fine Sand (0.125–0.25 mm)"
  if (sizeMm < 0.5) return "Medium Sand (0.25–0.5 mm)"
  if (sizeMm < 1.0) return "Coarse Sand (0.5–1.0 mm)"
  if (sizeMm < 2.0) return "Very Coarse Sand (1–2 mm)"
  if (sizeMm < 64.0) return "Gravel / Granule (2–64 mm)"
  return "Cobble / Boulder (>64 mm)"
}

export function classifySlopeHazard(slopeDeg: number | null | undefined): {
  level: "gentle" | "moderate" | "steep" | "critical" | "unknown"
  label: string
  color: string
} {
  if (slopeDeg === null || slopeDeg === undefined || !Number.isFinite(slopeDeg)) {
    return { level: "unknown", label: "No Data", color: "text-slate-400" }
  }
  if (slopeDeg < 5) return { level: "gentle", label: "Low Slope (<5°)", color: "text-emerald-400" }
  if (slopeDeg <= 15) return { level: "moderate", label: "Moderate Incline (5°–15°)", color: "text-cyan-400" }
  if (slopeDeg <= 25) return { level: "steep", label: "Steep Incline (15°–25°)", color: "text-amber-400" }
  return { level: "critical", label: "Critical Hazard (>25°)", color: "text-rose-400" }
}

export function classifyRockHazard(rockPct: number | null | undefined): {
  level: "low" | "nominal" | "high" | "unknown"
  label: string
  color: string
} {
  if (rockPct === null || rockPct === undefined || !Number.isFinite(rockPct)) {
    return { level: "unknown", label: "No Data", color: "text-slate-400" }
  }
  if (rockPct < 7) return { level: "low", label: "Low Rock Coverage (<7%)", color: "text-emerald-400" }
  if (rockPct <= 16) return { level: "nominal", label: "Nominal Boulder Field (7%–16%)", color: "text-cyan-400" }
  return { level: "high", label: "Severe Obstacle Hazard (>16%)", color: "text-rose-400" }
}

export interface TerrainScientificInterpretation {
  mobilityTrafficability: {
    title: string
    slopeAssessment: string
    rockClearanceAssessment: string
    regolithMechanicsAssessment: string
    overallMobilitySuitability: "Optimal" | "Good" | "Moderate" | "Challenging"
  }
  thermalRadiative: {
    title: string
    temperatureDeltaAssessment: string
    diurnalSwingAssessment: string
    solarFluxAssessment: string
  }
  geologicalComposition: {
    title: string
    lithologyMatchStatus: "Exact Lithology Match" | "Shared Petrological Family" | "Divergent Rock Family"
    petrologyAssessment: string
    vegetationOverprintAssessment: string
  }
  missionSuitabilityVerdict: {
    verdict: string
    primaryTestingStrengths: string[]
    criticalTestingLimitations: string[]
  }
}

/**
 * Generates an authoritative, data-driven scientific interpretation comparing
 * the planetary target with the candidate analog using actual calculated values.
 */
export function generateScientificInterpretation(
  target: PlanetaryTarget,
  candidate: EarthCandidate,
  result: RankedCandidate,
  purpose: MissionPurposeDefinition,
): TerrainScientificInterpretation {
  const targetEnv = target.environment
  const candEnv = candidate.environment

  // 1. Mobility & Trafficability Analysis
  const targetSlope = targetEnv.meanSlopeDeg ?? null
  const candSlope = candEnv.meanSlopeDeg ?? null
  const slopeDiff = targetSlope !== null && candSlope !== null ? Math.abs(targetSlope - candSlope) : null

  let slopeText = ""
  if (targetSlope !== null && candSlope !== null) {
    if (slopeDiff! <= 3) {
      slopeText = `Target slope (${targetSlope}°) and candidate slope (${candSlope}°) exhibit near-identical gradient characteristics (Δ${slopeDiff!.toFixed(1)}°), providing an authentic physical match for rover climb kinematics and center-of-gravity tilt.`
    } else if (slopeDiff! <= 10) {
      slopeText = `Target slope (${targetSlope}°) compared to candidate (${candSlope}°) exhibits a moderate delta of Δ${slopeDiff!.toFixed(1)}°. Drive motor torque and braking algorithms remain representative within nominal scaling.`
    } else {
      slopeText = `Significant topographic slope divergence observed: Target is ${targetSlope}° while candidate is ${candSlope}° (Δ${slopeDiff!.toFixed(1)}°). Rover incline certification requires pitch-angle compensation.`
    }
  } else {
    slopeText = "Topographic slope data missing for one or both locations; traverse gradient cannot be certified."
  }

  const targetRock = targetEnv.rockAbundancePct ?? null
  const candRock = candEnv.rockAbundancePct ?? null
  const rockDiff = targetRock !== null && candRock !== null ? Math.abs(targetRock - candRock) : null

  let rockText = ""
  if (targetRock !== null && candRock !== null) {
    if (rockDiff! <= 4) {
      rockText = `Rock abundance is closely matched (${targetRock}% on ${target.body.toUpperCase()} vs. ${candRock}% on Earth, Δ${rockDiff!.toFixed(1)}%), replicating surface obstacle frequency and hazard detection camera point-cloud density.`
    } else {
      rockText = `Rock coverage differs by Δ${rockDiff!.toFixed(1)}% (${targetRock}% target vs. ${candRock}% candidate). Obstacle clearance and belly-pan clearance testing must factor in the differing clast density.`
    }
  } else {
    rockText = "Rock abundance telemetry unavailable for rigorous obstacle clearance evaluation."
  }

  const targetGrain = targetEnv.medianGrainSizeMm ?? null
  const candGrain = candEnv.medianGrainSizeMm ?? null
  const targetWentworth = classifyWentworthGrainSize(targetGrain)
  const candWentworth = classifyWentworthGrainSize(candGrain)

  let grainText = ""
  if (targetGrain !== null && candGrain !== null) {
    grainText = `Substrate regolith comparison: Target features ${targetWentworth} (${targetGrain} mm) versus candidate ${candWentworth} (${candGrain} mm). `
    if (targetGrain < 0.2 && candGrain < 0.2) {
      grainText += "Both sites feature cohesive, fine-particulate matrices, ideal for wheel sinkage, trenching, and grousers slip evaluation."
    } else if (candGrain >= 0.5 && targetGrain < 0.2) {
      grainText += "The candidate contains coarser granular particles than the planetary target regolith; wheel traction and sinkage friction angles will be higher than on the planetary surface."
    } else {
      grainText += "Regolith grain distributions are within workable geotechnical bounds for terramechanics trials."
    }
  } else {
    grainText = "Grain size measurement incomplete for full terramechanics modeling."
  }

  let mobilityOverall: "Optimal" | "Good" | "Moderate" | "Challenging" = "Good"
  if (slopeDiff !== null && slopeDiff <= 5 && rockDiff !== null && rockDiff <= 5) {
    mobilityOverall = "Optimal"
  } else if ((slopeDiff !== null && slopeDiff > 15) || (rockDiff !== null && rockDiff > 15)) {
    mobilityOverall = "Challenging"
  } else if (slopeDiff !== null && slopeDiff > 8) {
    mobilityOverall = "Moderate"
  }

  // 2. Thermal & Radiative Environment
  const targetTemp = targetEnv.meanSurfaceTempC ?? null
  const candTemp = candEnv.meanSurfaceTempC ?? null
  const tempDiff = targetTemp !== null && candTemp !== null ? Math.abs(targetTemp - candTemp) : null

  let tempText = ""
  if (targetTemp !== null && candTemp !== null) {
    tempText = `Mean surface temperature shows a Δ${tempDiff!.toFixed(1)}°C delta (${targetTemp}°C on ${target.name} vs. ${candTemp}°C at ${candidate.name}). `
    if (target.body === "moon" || target.body === "mars") {
      tempText += `Extraterrestrial vacuum / thin-atmosphere cooling mechanisms (radiative cooling dominant) cannot be duplicated in Earth's convective boundary layer, but terrestrial extremes stress thermal control loops.`
    }
  } else {
    tempText = "Thermal measurement incomplete."
  }

  const targetDiurnal = targetEnv.diurnalTempRangeC ?? null
  const candDiurnal = candEnv.diurnalTempRangeC ?? null
  let diurnalText = ""
  if (targetDiurnal !== null && candDiurnal !== null) {
    diurnalText = `Diurnal thermal swings: Target experiences ${targetDiurnal}°C diurnal variance, compared to ${candDiurnal}°C at the analog site (Δ${Math.abs(targetDiurnal - candDiurnal).toFixed(1)}°C).`
  } else {
    diurnalText = "Diurnal thermal amplitude telemetry incomplete."
  }

  const targetSolar = targetEnv.surfaceSolarIrradianceWm2 ?? null
  const candSolar = candEnv.surfaceSolarIrradianceWm2 ?? null
  let solarText = ""
  if (targetSolar !== null && candSolar !== null) {
    solarText = `Solar irradiance: Target receives ${targetSolar} W/m² (at orbital distance from Sun) vs. ${candSolar} W/m² at candidate surface. Photovoltaic power sizing requires solar flux attenuation factors.`
  } else {
    solarText = "Solar flux telemetry incomplete."
  }

  // 3. Geological & Petrological Compatibility
  const targetLithology = targetEnv.lithology as Lithology
  const candLithology = candEnv.lithology as Lithology
  const targetFamily = LITHOLOGY_FAMILIES[targetLithology] ?? "igneous"
  const candFamily = LITHOLOGY_FAMILIES[candLithology] ?? "igneous"

  let lithologyMatchStatus: "Exact Lithology Match" | "Shared Petrological Family" | "Divergent Rock Family"
  let petrologyText = ""

  if (targetLithology === candLithology) {
    lithologyMatchStatus = "Exact Lithology Match"
    petrologyText = `Exact lithological match: Both environments are characterized by ${LITHOLOGY_LABELS[targetLithology]} substrates (${targetFamily} rock family). Mineral crystal structures, spectral absorption signatures, and drilling resistance are directly comparable.`
  } else if (targetFamily === candFamily) {
    lithologyMatchStatus = "Shared Petrological Family"
    petrologyText = `Shared petrological family (${targetFamily}): Target is ${LITHOLOGY_LABELS[targetLithology]} while candidate is ${LITHOLOGY_LABELS[candLithology]}. While exact mineral phases differ, fundamental mechanical properties and geomorphological weathering patterns share igneous/sedimentary characteristics.`
  } else {
    lithologyMatchStatus = "Divergent Rock Family"
    petrologyText = `Divergent petrological families: Target is ${LITHOLOGY_LABELS[targetLithology]} (${targetFamily}) whereas candidate is ${LITHOLOGY_LABELS[candLithology]} (${candFamily}). Mechanical abrasion rates and spectroscopy will diverge; test focus should emphasize navigation and geometry rather than geochemistry.`
  }

  const vegCover = candEnv.vegetationCoverPct ?? null
  let vegText = ""
  if (vegCover !== null) {
    if (vegCover < 5) {
      vegText = `Minimal vegetation overprint (${vegCover}%): Near-zero biological coverage replicates pristine planetary regolith exposure without root cohesion or vegetative spectral contamination.`
    } else {
      vegText = `Vegetation cover (${vegCover}%): Terrestrial flora introduces root-bound soil cohesion and spectral chlorophyll signatures absent on planetary surfaces.`
    }
  } else {
    vegText = "Vegetation telemetry unavailable."
  }

  // 4. Mission Suitability Verdict
  const strengths: string[] = []
  const limitations: string[] = []

  if (slopeDiff !== null && slopeDiff <= 8) {
    strengths.push(`High-fidelity slope and incline replication (${targetSlope}° vs. ${candSlope}°) for rover drive motor and stability testing.`)
  }
  if (rockDiff !== null && rockDiff <= 6) {
    strengths.push(`Accurate boulder obstacle density (${targetRock}% vs. ${candRock}%) for stereo-vision hazard detection and route planning.`)
  }
  if (lithologyMatchStatus === "Exact Lithology Match") {
    strengths.push(`Identical ${LITHOLOGY_LABELS[targetLithology]} bedrock for drill bit wear, core-sample capture, and Raman/LIBS spectroscopy calibration.`)
  } else if (lithologyMatchStatus === "Shared Petrological Family") {
    strengths.push(`Compatible ${targetFamily} substrate for geotechnical shear tests and trenching mechanics.`)
  }
  if (vegCover !== null && vegCover < 5) {
    strengths.push("Near-zero vegetation ensures raw regolith exposure free of biological mechanical interference.")
  }

  // Inherent scientific limitations
  limitations.push(`Atmospheric pressure disparity: Earth's ~101 kPa ambient pressure cannot replicate planetary vacuum (${target.body === "moon" ? "10⁻¹⁰ Pa" : "~700 Pa CO₂"}), altering volatile retention and regolith gas-pore dynamics.`)
  limitations.push("Atmospheric humidity & hydrological weathering: Earth regolith contains adsorbed moisture, altering particle cohesion relative to hyper-dry or vacuum lunar/Martian regolith.")
  if (slopeDiff !== null && slopeDiff > 10) {
    limitations.push(`Slope divergence of Δ${slopeDiff.toFixed(1)}° requires artificial gradient ramps or software pitch compensation.`)
  }
  if (tempDiff !== null && tempDiff > 40) {
    limitations.push(`Surface thermal delta (Δ${tempDiff.toFixed(1)}°C) means cryogenic or extreme planetary heat dissipation cannot be validated in ambient conditions.`)
  }

  const scoreVal = result.score ?? 0
  const verdict =
    scoreVal >= 75
      ? `${candidate.name} is a high-priority, scientifically verified terrestrial analog for ${target.name} under ${purpose.label.toLowerCase()} objectives.`
      : scoreVal >= 55
      ? `${candidate.name} serves as a moderately representative physical analog for ${target.name}, suitable for specific subsystem validation with known boundary limitations.`
      : `${candidate.name} exhibits partial morphological overlap with ${target.name}; recommended primarily for standalone environmental or robotic test procedures.`

  return {
    mobilityTrafficability: {
      title: "Rover Mobility & Terramechanics Synthesis",
      slopeAssessment: slopeText,
      rockClearanceAssessment: rockText,
      regolithMechanicsAssessment: grainText,
      overallMobilitySuitability: mobilityOverall,
    },
    thermalRadiative: {
      title: "Thermal & Radiative Boundary Conditions",
      temperatureDeltaAssessment: tempText,
      diurnalSwingAssessment: diurnalText,
      solarFluxAssessment: solarText,
    },
    geologicalComposition: {
      title: "Geological & Petrological Fidelity",
      lithologyMatchStatus,
      petrologyAssessment: petrologyText,
      vegetationOverprintAssessment: vegText,
    },
    missionSuitabilityVerdict: {
      verdict,
      primaryTestingStrengths: strengths,
      criticalTestingLimitations: limitations,
    },
  }
}
