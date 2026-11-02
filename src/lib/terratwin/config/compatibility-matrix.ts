import type { FeatureKey } from "../types"

export interface FeatureCompatibilityDefinition {
  key: FeatureKey
  name: string
  category: "Thermal Environment" | "Radiative Environment" | "Atmospheric Physics" | "Hydrology" | "Topography & Relief" | "Geomorphology" | "Geology & Mineralogy"
  classification: "DIRECTLY COMPARABLE" | "COMPARABLE AFTER TRANSFORMATION" | "PROXY-BASED COMPARISON" | "NOT SCIENTIFICALLY COMPARABLE"
  scientificBasis: string
  harmonizationNotes: string
}

export const FEATURE_COMPATIBILITY_MATRIX: FeatureCompatibilityDefinition[] = [
  {
    key: "meanSurfaceTempC",
    name: "Mean Surface Temperature",
    category: "Thermal Environment",
    classification: "DIRECTLY COMPARABLE",
    scientificBasis: "Standardized surface kinetic/radiometric temperature in Celsius (or Kelvin). Direct physical thermodynamic state.",
    harmonizationNotes: "Derived from long-term radiometric or meteorological baselines (REMS/MEDA, Diviner, POWER/MODIS).",
  },
  {
    key: "diurnalTempRangeC",
    name: "Diurnal/Seasonal Thermal Amplitude",
    category: "Thermal Environment",
    classification: "COMPARABLE AFTER TRANSFORMATION",
    scientificBasis: "Represents peak-to-trough thermal excursion. Earth/Mars diurnal cycles (24h vs 24h 39m) are directly comparable; Moon diurnal cycle is ~29.5 Earth days.",
    harmonizationNotes: "Thermal inertia proxy. Lunar values capture extreme diurnal cycle across synodic month.",
  },
  {
    key: "surfaceSolarIrradianceWm2",
    name: "Surface Solar Irradiance",
    category: "Radiative Environment",
    classification: "DIRECTLY COMPARABLE",
    scientificBasis: "All-sky downward solar radiative flux at surface in W/m². Governs solar power generation and photo-chemical weathering.",
    harmonizationNotes: "Accounts for orbital distance (1.0 AU vs 1.52 AU) and atmospheric scattering/attenuation.",
  },
  {
    key: "surfacePressurePa",
    name: "Atmospheric Surface Pressure",
    category: "Atmospheric Physics",
    classification: "NOT SCIENTIFICALLY COMPARABLE",
    scientificBasis: "Barometric pressure spans 2 to 14 orders of magnitude: Earth (~100 kPa) vs Mars (~0.7-0.9 kPa) vs Moon (< 10⁻⁹ Pa).",
    harmonizationNotes: "Flagged isComparable: false. Displayed for environmental context only. Excluded from similarity scoring.",
  },
  {
    key: "annualPrecipitationMm",
    name: "Annual Precipitation",
    category: "Hydrology",
    classification: "NOT SCIENTIFICALLY COMPARABLE",
    scientificBasis: "Liquid/solid meteoric precipitation is 0.0 mm across all Martian and Lunar surfaces in the present epoch.",
    harmonizationNotes: "Flagged isComparable: false. Included for Earth candidate hyper-aridity characterization.",
  },
  {
    key: "meanSlopeDeg",
    name: "Regional Terrain Slope",
    category: "Topography & Relief",
    classification: "COMPARABLE AFTER TRANSFORMATION",
    scientificBasis: "Local gravitational gradient angle in degrees. Governs rover locomotion trafficability and mass wasting.",
    harmonizationNotes: "Derived using Horn (1981) 3x3 filter from official MOLA, LOLA, and SRTM digital elevation models.",
  },
  {
    key: "rockAbundancePct",
    name: "Surface Rock Abundance",
    category: "Geomorphology",
    classification: "DIRECTLY COMPARABLE",
    scientificBasis: "Area percentage of surface covered by rocks > 0.1-1.0m diameter. Directly governs landing hazards and surface roughness.",
    harmonizationNotes: "Thermal inertia and radar/optical derived measurements (Christensen 1986, Bandfield 2011).",
  },
  {
    key: "lithology",
    name: "Primary Mineralogy & Lithology",
    category: "Geology & Mineralogy",
    classification: "PROXY-BASED COMPARISON",
    scientificBasis: "Categorical classification of surface bedrock and dominant mineral assemblage.",
    harmonizationNotes: "Mapped via lithological distance matrix reflecting basaltic, carbonate, sulfate, and felsic petrogenetic affinity.",
  },
  {
    key: "elevationM",
    name: "Surface Elevation",
    category: "Topography & Relief",
    classification: "NOT SCIENTIFICALLY COMPARABLE",
    scientificBasis: "Reference datums are physically distinct: Earth (EGM96 geoid/sea level), Mars (IAU2000 Areoid gravitational equipotential), Moon (1,737.4 km sphere).",
    harmonizationNotes: "Displayed with explicit datum labeling. Cannot be subtracted directly across bodies.",
  },
  {
    key: "albedo",
    name: "Surface Albedo (Visible)",
    category: "Radiative Environment",
    classification: "DIRECTLY COMPARABLE",
    scientificBasis: "Broadband hemispherical surface reflectance (0-1). Governs thermal absorption and optical tracking.",
    harmonizationNotes: "Derived from calibrated orbital spectrometer and radiometer surface reflectance products.",
  },
  {
    key: "medianGrainSizeMm",
    name: "Median Regolith Grain Size",
    category: "Geomorphology",
    classification: "DIRECTLY COMPARABLE",
    scientificBasis: "Loose particulate size diameter compared in logarithmic dex space.",
    harmonizationNotes: "Thermal inertia inversion and in situ microscopic imager measurements.",
  },
  {
    key: "vegetationCoverPct",
    name: "Vegetation Fractional Cover",
    category: "Hydrology",
    classification: "DIRECTLY COMPARABLE",
    scientificBasis: "Fractional botanical cover percentage. Extraterrestrial targets are identically 0.0%.",
    harmonizationNotes: "Ensures analog field selection prioritizes unvegetated arid landscapes.",
  },
]
