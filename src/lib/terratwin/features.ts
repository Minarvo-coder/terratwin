import type {
  AnalogEnvironmentCategory,
  AnalogEnvironmentCategoryDefinition,
  AnalogNoveltyTier,
  AnalogNoveltyTierDefinition,
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
    label: "Rover testing & trafficability",
    summary:
      "Prioritises vehicle mobility, obstacle clearance, terrain slope, regolith shear strength, and bare ground trials.",
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
      annualPrecipitationMm: 0.0, // Flagged non-comparable across bodies
      surfacePressurePa: 0.0, // Excluded from planetary matching
    },
  },
  {
    id: "geological-research",
    label: "Geological field research",
    summary:
      "Prioritises compositional petrology, aridity, limited vegetative overprint, and regolith maturity.",
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
      annualPrecipitationMm: 0.0, // Flagged non-comparable across bodies
      surfacePressurePa: 0.0, // Excluded from planetary matching
    },
  },
  {
    id: "lunar-base-construction",
    label: "Lunar base construction & ISRU",
    summary:
      "Prioritises civil engineering slope stability, low boulder clearance hazard, solar radiative flux context, thermal cycling resilience, and regolith ISRU feedstock petrology.",
    weights: {
      meanSlopeDeg: 0.25,
      rockAbundancePct: 0.20,
      surfaceSolarIrradianceWm2: 0.15,
      diurnalTempRangeC: 0.10,
      lithology: 0.10,
      medianGrainSizeMm: 0.10,
      vegetationCoverPct: 0.05,
      meanSurfaceTempC: 0.05,
      elevationM: 0.0, // Excluded: planetary reference datums are physically independent
      albedo: 0.0,
      annualPrecipitationMm: 0.0, // Flagged non-comparable across bodies
      surfacePressurePa: 0.0, // Excluded from planetary matching
    },
  },
  {
    id: "astrobiology-habitability",
    label: "Astrobiology & habitability",
    summary:
      "Prioritises biosignature-preserving lithology (clays, carbonates, evaporites), thermal extremes, diurnal freeze–thaw cycling, and fine-grained sedimentary matrices.",
    weights: {
      lithology: 0.30,
      meanSurfaceTempC: 0.15,
      diurnalTempRangeC: 0.15,
      surfaceSolarIrradianceWm2: 0.10,
      albedo: 0.10,
      medianGrainSizeMm: 0.10,
      meanSlopeDeg: 0.05,
      rockAbundancePct: 0.05,
      vegetationCoverPct: 0.0, // Never treated as evidence of extraterrestrial life or direct measure of habitability
      elevationM: 0.0, // Excluded: planetary reference datums are physically independent
      annualPrecipitationMm: 0.0, // Flagged non-comparable across bodies
      surfacePressurePa: 0.0, // Excluded from planetary matching
    },
  },
]

export function getMissionPurpose(id: string): MissionPurposeDefinition | undefined {
  return MISSION_PURPOSES.find((purpose) => purpose.id === id)
}

export function isMissionPurpose(value: string): value is MissionPurpose {
  return MISSION_PURPOSES.some((purpose) => purpose.id === value)
}

/**
 * Nine terrestrial environment categories of scientific interest for planetary analog investigation.
 * NOTE: Category membership classifies the terrestrial geological/geomorphological setting;
 * it does not automatically prove that a location is a valid planetary analog without telemetry verification.
 */
export const ANALOG_ENVIRONMENT_CATEGORIES: AnalogEnvironmentCategoryDefinition[] = [
  {
    id: "salt-flats-evaporites",
    label: "Salt flats & evaporite basins",
    shortLabel: "Evaporite basins",
    description:
      "Closed-basin playas, sabkhas, and hypersaline lakes precipitating sulfates (gypsum, jarosite), halides, and carbonates under arid evaporation.",
    planetaryRelevance:
      "Investigates late-Noachian/Hesperian Martian evaporite stratigraphy (e.g. Meridiani Planum, Gale Crater sulfate unit) and brine deliquescence processes.",
    scientificCaveat:
      "Category classification identifies evaporite mineralogy context only; quantitative similarity requires verified thermal, topographic, and grain-size telemetry.",
  },
  {
    id: "polar-permafrost",
    label: "Polar deserts & permafrost environments",
    shortLabel: "Polar permafrost",
    description:
      "High-latitude cryospheric valleys, ice-cemented polygonal regolith, and cold-arid deserts experiencing sub-zero mean annual temperatures.",
    planetaryRelevance:
      "Investigates Martian high-latitude ground-ice stability, polygonal patterned ground, and cryogenic thermal regimes relevant to polar landers.",
    scientificCaveat:
      "Terrestrial permafrost forms under ~101 kPa atmospheric pressure and seasonal meteoric snow/melt, unlike lunar vacuum cold traps or Martian CO₂ frost cycles.",
  },
  {
    id: "volcanic-fields",
    label: "Volcanic fields & basaltic lava landscapes",
    shortLabel: "Volcanic fields",
    description:
      "Mafic shield volcanoes, fissure flood basalts, cinder cones, and unweathered tephra plains dominated by tholeiitic or alkali basalt petrology.",
    planetaryRelevance:
      "Investigates lunar mare basalt plains, volcanic pyroclastic dark mantle deposits, and Martian volcanic provinces for regolith ISRU and trafficability.",
    scientificCaveat:
      "Terrestrial basalts weather in an oxidizing, hydrous atmosphere and lack space-weathered nanophase metallic iron (npFe⁰) and micrometeoroid agglutinates.",
  },
  {
    id: "impact-craters",
    label: "Impact craters & shock-metamorphosed structures",
    shortLabel: "Impact craters",
    description:
      "Hypervelocity bolide impact structures preserving overturned rim flaps, allochthonous impact breccia lenses, shatter cones, and post-impact lake sediments.",
    planetaryRelevance:
      "Investigates crater rim slope mechanics, ejecta block distributions, shock-fractured bedrock habitats, and intracrater fluvio-lacustrine basins.",
    scientificCaveat:
      "Most terrestrial impact craters have undergone substantial fluvial/aeolian erosion or burial compared to pristine lunar craters.",
  },
  {
    id: "high-altitude-plateaus",
    label: "Arid high-altitude plateaus & yardang basins",
    shortLabel: "High plateaus",
    description:
      "Elevated continental plateaus (>2,500 m) characterized by high solar UV irradiance, large diurnal thermal swings, low atmospheric water vapor, and wind-scoured yardangs.",
    planetaryRelevance:
      "Investigates radiative flux extremes, aeolian bedrock abrasion morphologies, and high-elevation desert soil geochemistry.",
    scientificCaveat:
      "Even at >4,000 m elevation on Earth, barometric pressure (~60 kPa) remains nearly two orders of magnitude higher than Mars (~0.7 kPa).",
  },
  {
    id: "glacial-outwash",
    label: "Glacial, subglacial & catastrophic outwash environments",
    shortLabel: "Glacial outwash",
    description:
      "Ice-marginal moraines, subglacial geothermal cauldrons, and jökulhlaup outburst flood plains depositing poorly sorted basaltic boulders and gravels.",
    planetaryRelevance:
      "Investigates Martian outflow channel boulder bars (e.g. Ares Vallis, Kasei Valles), volcano-ice interactions, and sub-ice astrobiological refugia.",
    scientificCaveat:
      "Active liquid-water glacial melt streams do not occur on present-day Mars or the Moon; analogy applies to relict geomorphology and cryospheric interfaces.",
  },
  {
    id: "lava-tubes-caves",
    label: "Caves, basaltic lava tubes & subsurface voids",
    shortLabel: "Lava tubes & caves",
    description:
      "Roofed volcanic lava conduits, collapse skylights (jameos/pits), and subterranean karst or cryospheric cavities shielded from surface weather.",
    planetaryRelevance:
      "Investigates lunar mare pit craters and Martian volcano-tectonic lava tubes for radiation-shielded human habitat siting and autonomous subsurface robotics.",
    scientificCaveat:
      "Surface orbital datasets (0.5° climatology / 90m DEM) do not resolve subterranean void dimensions; cave geometry requires ground-truth speleological survey.",
  },
  {
    id: "dry-river-deltas",
    label: "Dry river systems, paleolakes & sedimentary deltas",
    shortLabel: "Fluvial & paleolakes",
    description:
      "Desiccated fluvial channels, inverted distributary fan deltas, and carbonate/smectite clay-bearing lacustrine basins.",
    planetaryRelevance:
      "Investigates ancient Martian fluvio-deltaic systems (e.g. Jezero Crater western delta, Eberswalde delta) and fine-grained sedimentary biosignature preservation.",
    scientificCaveat:
      "Terrestrial paleolake basins frequently retain modern groundwater or sparse desert scrub that must be accounted for during instrument calibration.",
  },
  {
    id: "serpentinizing-acidic-mineral-systems",
    label: "Unusual geochemical, acidic & serpentinizing mineral systems",
    shortLabel: "Geochemical extremes",
    description:
      "Hyper-acidic iron-sulfate drainage systems (pH < 3) and hyper-alkaline ultramafic serpentinization zones (pH > 10) generating H₂/CH₄ fluids and authigenic carbonates.",
    planetaryRelevance:
      "Investigates Martian olivine-carbonate alteration zones (e.g. Nili Fossae, Jezero margin), jarosite/hematite acid-sulfate geochemistry, and chemolithoautotrophic life limits.",
    scientificCaveat:
      "Geochemical analogy focuses on mineralogical pathways and pH/redox extremes rather than macro-scale topographic landform similarity.",
  },
]

export const ANALOG_ENVIRONMENT_CATEGORY_MAP: Record<
  AnalogEnvironmentCategory,
  AnalogEnvironmentCategoryDefinition
> = Object.fromEntries(
  ANALOG_ENVIRONMENT_CATEGORIES.map((c) => [c.id, c]),
) as Record<AnalogEnvironmentCategory, AnalogEnvironmentCategoryDefinition>

export const ANALOG_ENVIRONMENT_CATEGORY_LABELS: Record<AnalogEnvironmentCategory, string> =
  Object.fromEntries(
    ANALOG_ENVIRONMENT_CATEGORIES.map((c) => [c.id, c.label]),
  ) as Record<AnalogEnvironmentCategory, string>

export function isAnalogEnvironmentCategory(value: string): value is AnalogEnvironmentCategory {
  return ANALOG_ENVIRONMENT_CATEGORIES.some((c) => c.id === value)
}

/**
 * Catalogue provenance tiers classifying how an Earth candidate location entered the TerraTwin registry.
 * IMPORTANT: A novelty tier is a catalogue metadata classification, NOT a scientific similarity score.
 * Absence from the eight canonical benchmark sites does not automatically make a location scientifically valid or superior.
 */
export const ANALOG_NOVELTY_TIERS: AnalogNoveltyTierDefinition[] = [
  {
    id: "canonical-benchmark",
    label: "Canonical NASA/ESA Benchmark Site",
    shortLabel: "Canonical Benchmark",
    description:
      "Historically established planetary analog testbed with extensive published space-agency field campaigns, rover trials, or astronaut geological training heritage.",
    assignmentCriteria:
      "Assigned only to the foundational benchmark locations documented in official NASA, ESA, or CSA planetary analog field guides (e.g. Atacama Yungay, McMurdo Dry Valleys, Haughton Crater, Mauna Kea, Lake Salda, Craters of the Moon, Askja/Holuhraun, Río Tinto).",
    evidenceRequired:
      "Peer-reviewed planetary analog field campaign citations plus verified multi-parameter satellite and in-situ telemetry in the TerraTwin database.",
    scientificCaveat:
      "Benchmark status reflects historical testing heritage; a canonical site may still score poorly for a specific target or mission profile if physical parameters diverge.",
  },
  {
    id: "under-explored-analog",
    label: "Under-Explored / Regional Candidate Site",
    shortLabel: "Under-Explored Candidate",
    description:
      "Documented terrestrial geological formation outside the primary eight benchmark stations that exhibits candidate geomorphological, mineralogical, or climatic traits worthy of comparative screening.",
    assignmentCriteria:
      "Assigned to curated regional candidates in the Discovery Atlas that lie outside the 8 canonical sites and possess documented geological literature plus verified orbital/climatological telemetry.",
    evidenceRequired:
      "Verified NASA POWER climatology, Copernicus DEM topography/slope, MODIS reflectance/vegetation, and published geological survey or Macrostrat bedrock attribution.",
    scientificCaveat:
      "Catalogue label only; does not imply superiority over canonical benchmarks. Must be evaluated strictly through its quantitative similarity score and data coverage.",
  },
  {
    id: "live-grid-discovery",
    label: "Live Spatial Grid Screening Cell",
    shortLabel: "Grid Screening Cell",
    description:
      "Dynamically generated geographic grid cell or bounding-box sub-region evaluated via automated orbital DEM, climatology, and geological map extraction.",
    assignmentCriteria:
      "Assigned automatically to spatial grid cells generated during regional bounding-box discovery scans.",
    evidenceRequired:
      "Live or cached Copernicus GLO-90 DEM 5-point cardinal central-difference slope stencil, NASA POWER climatology retrieval, and Macrostrat geological map lookup, with unmeasured in-situ parameters explicitly marked as missing_data.",
    scientificCaveat:
      "Represents a preliminary remote-sensing screening candidate, not a field-certified analog discovery. Requires field verification of grain size, boulder hazards, and local outcrop geology.",
  },
]

export const ANALOG_NOVELTY_TIER_MAP: Record<AnalogNoveltyTier, AnalogNoveltyTierDefinition> =
  Object.fromEntries(
    ANALOG_NOVELTY_TIERS.map((t) => [t.id, t]),
  ) as Record<AnalogNoveltyTier, AnalogNoveltyTierDefinition>

export const ANALOG_NOVELTY_TIER_LABELS: Record<AnalogNoveltyTier, string> =
  Object.fromEntries(
    ANALOG_NOVELTY_TIERS.map((t) => [t.id, t.label]),
  ) as Record<AnalogNoveltyTier, string>

export function isAnalogNoveltyTier(value: string): value is AnalogNoveltyTier {
  return ANALOG_NOVELTY_TIERS.some((t) => t.id === value)
}
