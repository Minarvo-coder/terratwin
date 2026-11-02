import type { FeatureKey, Lithology } from "../types.ts"

export type SatelliteImageryLayerId =
  | "dark-base"
  | "modis-true-color"
  | "modis-ndvi"
  | "modis-lst-day"
  | "modis-bands721"
  | "aster-gdem-relief"

export interface ImageryLegendStop {
  label: string
  color: string
}

export interface SatelliteImageryLayerDefinition {
  id: SatelliteImageryLayerId
  name: string
  shortName: string
  category: "Base Cartography" | "Optical Reflectance" | "Biosphere & Vegetation" | "Thermal Infrared" | "Shortwave Infrared (SWIR)" | "Topographic Relief"
  provider: string
  instrument: string
  productId: string
  sourceUrl: string
  tileUrlTemplate: string
  attribution: string
  maxNativeZoom: number
  maxZoom: number
  supportsDate: boolean
  defaultDate: string
  minDate?: string
  maxDate?: string
  spatialResolution: string
  temporalResolution: string
  isOverlayOnDarkBase: boolean
  defaultOpacity: number
  scientificDescription: string
  visualizationDisclaimer: string
  legendUnit: string
  legendStops: ImageryLegendStop[]
}

export const IMAGERY_DATE_PRESETS: { label: string; date: string; description: string }[] = [
  {
    label: "Boreal Summer (2024-07-15)",
    date: "2024-07-15",
    description: "Clear northern hemisphere summer pass (ideal for Iceland, Idaho, Turkey, Spain, Devon Island)",
  },
  {
    label: "Austral Summer (2024-01-15)",
    date: "2024-01-15",
    description: "Clear southern hemisphere summer pass (ideal for Atacama Desert & McMurdo Dry Valleys)",
  },
  {
    label: "Vernal Equinox (2024-03-20)",
    date: "2024-03-20",
    description: "Balanced solar illumination across both hemispheres",
  },
  {
    label: "Autumnal Equinox (2024-09-22)",
    date: "2024-09-22",
    description: "Late-season minimum snow cover in high-altitude volcanic fields",
  },
]

export const SATELLITE_IMAGERY_LAYERS: SatelliteImageryLayerDefinition[] = [
  {
    id: "dark-base",
    name: "Tactical Dark Base (Esri World Dark Gray)",
    shortName: "Dark Base",
    category: "Base Cartography",
    provider: "Esri / HERE / Garmin / OpenStreetMap",
    instrument: "Global Vector & Bathymetric Cartography",
    productId: "World_Dark_Gray_Base (EPSG:3857)",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=c11ce4f7801740b2905eb03ddc963ac8",
    tileUrlTemplate:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxNativeZoom: 16,
    maxZoom: 16,
    supportsDate: false,
    defaultDate: "2024-07-15",
    spatialResolution: "Multi-scale vector tile pyramid (down to ~10 m)",
    temporalResolution: "Static cartographic reference",
    isOverlayOnDarkBase: false,
    defaultOpacity: 1.0,
    scientificDescription:
      "High-contrast dark reference basemap designed to emphasize quantitative environmental marker overlays without background color distortion.",
    visualizationDisclaimer:
      "Cartographic reference layer only. Does not represent satellite radiance.",
    legendUnit: "Contrast Reference",
    legendStops: [
      { label: "Ocean Basin", color: "#1d2227" },
      { label: "Continental Shelf", color: "#262b30" },
      { label: "Continental Landmass", color: "#32383e" },
    ],
  },
  {
    id: "modis-true-color",
    name: "NASA MODIS Terra True Color (Corrected Reflectance)",
    shortName: "True Color (MODIS)",
    category: "Optical Reflectance",
    provider: "NASA Earthdata GIBS / Goddard Space Flight Center",
    instrument: "MODIS / Terra (Bands 1, 4, 3)",
    productId: "MODIS_Terra_CorrectedReflectance_TrueColor",
    sourceUrl: "https://earthdata.nasa.gov/gibs",
    tileUrlTemplate:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    attribution: "Imagery &copy; NASA EOSDIS GIBS / MODIS Terra",
    maxNativeZoom: 9,
    maxZoom: 16,
    supportsDate: true,
    defaultDate: "2024-07-15",
    minDate: "2000-03-01",
    maxDate: "2025-12-31",
    spatialResolution: "250 m/pixel (Level 9 WMTS)",
    temporalResolution: "Daily orbital swath composite",
    isOverlayOnDarkBase: false,
    defaultOpacity: 1.0,
    scientificDescription:
      "Natural-color visible reflectance (Red 645 nm, Green 555 nm, Blue 469 nm) corrected for molecular Rayleigh scattering to show authentic surface albedo, desert evaporites, dark basaltic lava fields, and cloud cover.",
    visualizationDisclaimer:
      "GIBS imagery tiles are visualization products. Displayed RGB colors are stretched for visual interpretation; similarity calculations use calibrated MOD09GA surface albedo.",
    legendUnit: "Visible Surface Reflectance (RGB)",
    legendStops: [
      { label: "Dark Basalt / Water (~0.05)", color: "#1e293b" },
      { label: "Arid Regolith / Oxide (~0.25)", color: "#b47b48" },
      { label: "Carbonate / Salt / Ice (>0.60)", color: "#f1f5f9" },
    ],
  },
  {
    id: "modis-ndvi",
    name: "NASA MODIS Terra Vegetation Index (NDVI 16-Day)",
    shortName: "Vegetation (NDVI)",
    category: "Biosphere & Vegetation",
    provider: "NASA Earthdata GIBS / LP DAAC",
    instrument: "MODIS / Terra (MOD13C1 / MOD13A2)",
    productId: "MODIS_Terra_L3_NDVI_16Day",
    sourceUrl: "https://lpdaac.usgs.gov/products/mod13a2v061/",
    tileUrlTemplate:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_NDVI_16Day/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
    attribution: "Imagery &copy; NASA EOSDIS GIBS / LP DAAC MODIS NDVI",
    maxNativeZoom: 9,
    maxZoom: 16,
    supportsDate: true,
    defaultDate: "2024-07-15",
    minDate: "2000-03-01",
    maxDate: "2025-12-31",
    spatialResolution: "250 m – 500 m (Level 9 WMTS)",
    temporalResolution: "16-day cloud-cleared L3 composite",
    isOverlayOnDarkBase: true,
    defaultOpacity: 0.85,
    scientificDescription:
      "Normalized Difference Vegetation Index [(NIR - Red) / (NIR + Red)] quantifying photosynthetic plant density. Critical for verifying barren, unvegetated planetary analog terrain (< 5% cover).",
    visualizationDisclaimer:
      "GIBS color-mapped visualization tile. Quantitative analog scoring uses multi-year calibrated MOD13/MOD09 fractional vegetation cover.",
    legendUnit: "NDVI Index (-0.2 to +1.0)",
    legendStops: [
      { label: "Barren Rock / Sand (~0.0)", color: "#d6c29d" },
      { label: "Sparse Scrub (0.2)", color: "#9ecae1" },
      { label: "Moderate Vegetation (0.5)", color: "#41ab5d" },
      { label: "Dense Canopy (>0.8)", color: "#005a32" },
    ],
  },
  {
    id: "modis-lst-day",
    name: "NASA MODIS Terra Daytime Land Surface Temperature",
    shortName: "Surface Temp (LST)",
    category: "Thermal Infrared",
    provider: "NASA Earthdata GIBS / LP DAAC",
    instrument: "MODIS / Terra Thermal IR (Bands 31 & 32)",
    productId: "MODIS_Terra_Land_Surface_Temp_Day",
    sourceUrl: "https://lpdaac.usgs.gov/products/mod11a1v061/",
    tileUrlTemplate:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/{date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
    attribution: "Imagery &copy; NASA EOSDIS GIBS / LP DAAC MODIS LST",
    maxNativeZoom: 7,
    maxZoom: 16,
    supportsDate: true,
    defaultDate: "2024-07-15",
    minDate: "2000-03-01",
    maxDate: "2025-12-31",
    spatialResolution: "1,000 m (1 km Level 7 WMTS)",
    temporalResolution: "Daily daytime split-window thermal retrieval",
    isOverlayOnDarkBase: true,
    defaultOpacity: 0.85,
    scientificDescription:
      "Radiometric skin temperature derived from split-window thermal infrared bands (10.78–12.27 µm). Directly analogous to Mars REMS/MEDA GTS and Lunar Diviner radiometric skin temperature.",
    visualizationDisclaimer:
      "Daily clear-sky visualization product (cloud-obscured pixels appear transparent). Multi-decadal climatology in similarity engine uses NASA POWER & MOD11A2.",
    legendUnit: "Skin Temp (°C / K)",
    legendStops: [
      { label: "< -25°C (248 K)", color: "#313695" },
      { label: "0°C (273 K)", color: "#74add1" },
      { label: "+25°C (298 K)", color: "#fdae61" },
      { label: "> +50°C (323 K)", color: "#a50026" },
    ],
  },
  {
    id: "modis-bands721",
    name: "NASA MODIS Surface Reflectance (Bands 7-2-1 SWIR)",
    shortName: "Surface Reflectance (SWIR)",
    category: "Shortwave Infrared (SWIR)",
    provider: "NASA Earthdata GIBS / LP DAAC",
    instrument: "MODIS / Terra (SWIR 2.1µm, NIR 0.85µm, Red 0.65µm)",
    productId: "MODIS_Terra_CorrectedReflectance_Bands721",
    sourceUrl: "https://lpdaac.usgs.gov/products/mod09gav061/",
    tileUrlTemplate:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_Bands721/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    attribution: "Imagery &copy; NASA EOSDIS GIBS / MODIS Bands 7-2-1",
    maxNativeZoom: 9,
    maxZoom: 16,
    supportsDate: true,
    defaultDate: "2024-07-15",
    minDate: "2000-03-01",
    maxDate: "2025-12-31",
    spatialResolution: "250 m – 500 m (Level 9 WMTS)",
    temporalResolution: "Daily false-color SWIR composite",
    isOverlayOnDarkBase: false,
    defaultOpacity: 1.0,
    scientificDescription:
      "Shortwave-infrared geological composite (Band 7 = R, Band 2 = G, Band 1 = B). Distinguishes bare basaltic lava flows (dark brown/black), ferric/sulfate soils (amber/red), snow/ice (bright cyan), and vegetation (bright green).",
    visualizationDisclaimer:
      "False-color spectral composite tile for geological discrimination; not a direct single-channel measurement.",
    legendUnit: "Spectral Signature (7-2-1)",
    legendStops: [
      { label: "Basalt / Mafic Lava", color: "#2d1e18" },
      { label: "Exposed Evaporite / Soil", color: "#c26a4a" },
      { label: "Snow / Glacier Ice", color: "#06b6d4" },
      { label: "Photosynthetic Flora", color: "#22c55e" },
    ],
  },
  {
    id: "aster-gdem-relief",
    name: "NASA/METI ASTER GDEM Color Shaded Relief",
    shortName: "Terrain Relief (ASTER)",
    category: "Topographic Relief",
    provider: "NASA Earthdata GIBS / LP DAAC / METI",
    instrument: "ASTER / Terra Stereo Photogrammetry",
    productId: "ASTER_GDEM_Color_Shaded_Relief",
    sourceUrl: "https://lpdaac.usgs.gov/products/astgtmv003/",
    tileUrlTemplate:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/ASTER_GDEM_Color_Shaded_Relief/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpg",
    attribution: "Imagery &copy; NASA/METI ASTER GDEM v3 via EOSDIS GIBS",
    maxNativeZoom: 12,
    maxZoom: 16,
    supportsDate: false,
    defaultDate: "2024-07-15",
    spatialResolution: "30 meters (Level 12 WMTS)",
    temporalResolution: "Static multi-year stereo DEM compilation",
    isOverlayOnDarkBase: false,
    defaultOpacity: 1.0,
    scientificDescription:
      "Hypsometric color-coded topographic hillshade derived from the 30-meter ASTER Global Digital Elevation Model. Highlights impact craters, volcanic calderas, rift zones, and drainage canyons.",
    visualizationDisclaimer:
      "Hypsometric relief visualization. Quantitative elevation and slope in TerraTwin are sampled from SRTMGL1 / Copernicus GLO-30.",
    legendUnit: "Hypsometric Elevation (m)",
    legendStops: [
      { label: "0 – 250 m", color: "#5c8e62" },
      { label: "500 – 1,500 m", color: "#d8c37a" },
      { label: "1,500 – 3,000 m", color: "#b37c4d" },
      { label: "> 3,500 m", color: "#f8fafc" },
    ],
  },
]

export const SATELLITE_LAYER_MAP: Record<SatelliteImageryLayerId, SatelliteImageryLayerDefinition> =
  Object.fromEntries(SATELLITE_IMAGERY_LAYERS.map((l) => [l.id, l])) as Record<
    SatelliteImageryLayerId,
    SatelliteImageryLayerDefinition
  >

/**
 * Step 5: Interactive Scientific Data Layers (Spatial Parameter Overlay on Map)
 * Connects candidate markers directly to verified Phase 3 environmental measurements.
 */
export type MapParameterLayerId =
  | "similarity"
  | "elevationM"
  | "meanSlopeDeg"
  | "meanSurfaceTempC"
  | "albedo"
  | "vegetationCoverPct"
  | "surfaceSolarIrradianceWm2"
  | "rockAbundancePct"
  | "lithology"

export interface MapParameterLayerDefinition {
  id: MapParameterLayerId
  featureKey: FeatureKey | null
  label: string
  shortLabel: string
  unit: string
  sourceDataset: string
  sourceUrl: string
  spatialResolution: string
  temporalResolution: string
  scientificMeaning: string
  planetaryAvailabilityNote: string
  legendStops: ImageryLegendStop[]
  getColor: (value: number | string | null) => string
}

const LITHOLOGY_COLORS: Record<Lithology, string> = {
  basaltic: "#38bdf8",
  "clay-sedimentary": "#34d399",
  "sulfate-evaporite": "#f59e0b",
  "impact-breccia": "#c084fc",
  "volcanic-tephra": "#fb7185",
  anorthositic: "#e2e8f0",
  "felsic-crystalline": "#818cf8",
}

export const ENVIRONMENTAL_MAP_LAYERS: MapParameterLayerDefinition[] = [
  {
    id: "similarity",
    featureKey: null,
    label: "Overall Mission Similarity Score",
    shortLabel: "Similarity %",
    unit: "%",
    sourceDataset: "TerraTwin Harmonized Weighted Euclidean Engine",
    sourceUrl: "https://pds-geosciences.wustl.edu/",
    spatialResolution: "Site-integrated multi-sensor composite",
    temporalResolution: "Long-term climatological & geological baseline",
    scientificMeaning:
      "Composite environmental similarity (0–100%) between the selected Mars/Moon target and each Earth analog site using mission-weighted comparable parameters.",
    planetaryAvailabilityNote: "Computed dynamically across Mars, Moon, and Earth analog sites.",
    legendStops: [
      { label: "< 55% (Low Match)", color: "#f43f5e" },
      { label: "55–75% (Moderate)", color: "#f59e0b" },
      { label: "> 75% (High Match)", color: "#00f0ff" },
    ],
    getColor: (val) => {
      if (typeof val !== "number") return "#f43f5e"
      if (val >= 75) return "#00f0ff"
      if (val >= 55) return "#f59e0b"
      return "#f43f5e"
    },
  },
  {
    id: "elevationM",
    featureKey: "elevationM",
    label: "Surface Elevation (Datum-Referenced)",
    shortLabel: "Elevation (m)",
    unit: "m",
    sourceDataset: "NASA SRTMGL1 v003 & Copernicus GLO-30 DEM",
    sourceUrl: "https://lpdaac.usgs.gov/products/srtmgl1v003/",
    spatialResolution: "30 meters (1 arc-second)",
    temporalResolution: "2000–2024 global radar/optical elevation baseline",
    scientificMeaning:
      "Orthometric height above Earth EGM96 Geoid (mean sea level). Excluded from direct cross-body subtraction because Mars (IAU2000 Areoid) and Moon (1,737.4 km sphere) use distinct reference datums.",
    planetaryAvailabilityNote: "Available for Earth (EGM96), Mars (MOLA Areoid), and Moon (LOLA Sphere) with datum isolation.",
    legendStops: [
      { label: "< 500 m", color: "#34d399" },
      { label: "500–2,000 m", color: "#fbbf24" },
      { label: "> 2,000 m", color: "#f87171" },
    ],
    getColor: (val) => {
      if (typeof val !== "number") return "#64748b"
      if (val >= 2000) return "#f87171"
      if (val >= 500) return "#fbbf24"
      return "#34d399"
    },
  },
  {
    id: "meanSlopeDeg",
    featureKey: "meanSlopeDeg",
    label: "Regional Terrain Slope",
    shortLabel: "Slope (°)",
    unit: "°",
    sourceDataset: "NASA SRTMGL1 / Copernicus GLO-30 (Horn 3×3 Filter)",
    sourceUrl: "https://lpdaac.usgs.gov/products/srtmgl1v003/",
    spatialResolution: "30 meters (Earth) / 4 pix/deg (MOLA/LOLA)",
    temporalResolution: "Static geomorphometric baseline",
    scientificMeaning:
      "Mean topographic gradient across the analog traverse footprint. Directly governs rover wheel slip, tip-over stability, and landing ellipse safety.",
    planetaryAvailabilityNote: "Available across Earth, Mars, and Moon via Horn (1981) finite-difference gradient.",
    legendStops: [
      { label: "< 5° (Benign Flats)", color: "#34d399" },
      { label: "5–10° (Moderate)", color: "#fbbf24" },
      { label: "> 10° (Steep Scarp)", color: "#f43f5e" },
    ],
    getColor: (val) => {
      if (typeof val !== "number") return "#64748b"
      if (val >= 10) return "#f43f5e"
      if (val >= 5) return "#fbbf24"
      return "#34d399"
    },
  },
  {
    id: "meanSurfaceTempC",
    featureKey: "meanSurfaceTempC",
    label: "Mean Surface Temperature",
    shortLabel: "Temp (°C)",
    unit: "°C",
    sourceDataset: "NASA POWER Climatology API v2.10.1 & MODIS MOD11A2",
    sourceUrl: "https://power.larc.nasa.gov/api/temporal/climatology/point",
    spatialResolution: "0.5° × 0.625° (POWER) / 1 km (MODIS LST)",
    temporalResolution: "25-year climatological baseline (2001–2025)",
    scientificMeaning:
      "Annual mean surface temperature governing thermal survival of rover electronics, battery heating budgets, and permafrost stability.",
    planetaryAvailabilityNote: "Directly comparable across Earth, Mars (REMS/MEDA), and Moon (LRO Diviner).",
    legendStops: [
      { label: "< 0°C (Cryogenic/Polar)", color: "#38bdf8" },
      { label: "0–12°C (Temperate)", color: "#fbbf24" },
      { label: "> 12°C (Warm Arid)", color: "#fb7185" },
    ],
    getColor: (val) => {
      if (typeof val !== "number") return "#64748b"
      if (val < 0) return "#38bdf8"
      if (val <= 12) return "#fbbf24"
      return "#fb7185"
    },
  },
  {
    id: "albedo",
    featureKey: "albedo",
    label: "Broadband Surface Albedo",
    shortLabel: "Albedo (0–1)",
    unit: "",
    sourceDataset: "NASA MODIS/Terra MOD09GA & LROC/CRISM Reflectance",
    sourceUrl: "https://lpdaac.usgs.gov/products/mod09gav061/",
    spatialResolution: "500 meters (MODIS) / 100 m (LROC)",
    temporalResolution: "2000–2025 multi-year composite",
    scientificMeaning:
      "Fraction of incident shortwave solar radiation reflected by the surface (0 = blackbody, 1 = total reflection). Distinguishes dark tholeiitic basalts (~0.09) from bright carbonate/evaporite playas (~0.30).",
    planetaryAvailabilityNote: "Directly comparable across Earth, Mars, and Moon.",
    legendStops: [
      { label: "< 0.14 (Dark Mafic)", color: "#94a3b8" },
      { label: "0.14–0.24 (Intermediate)", color: "#38bdf8" },
      { label: "> 0.24 (Bright Evaporite)", color: "#f8fafc" },
    ],
    getColor: (val) => {
      if (typeof val !== "number") return "#64748b"
      if (val < 0.14) return "#94a3b8"
      if (val <= 0.24) return "#38bdf8"
      return "#f8fafc"
    },
  },
  {
    id: "vegetationCoverPct",
    featureKey: "vegetationCoverPct",
    label: "Vegetation Fractional Cover",
    shortLabel: "Vegetation (%)",
    unit: "%",
    sourceDataset: "NASA MODIS/Terra NDVI & Landsat 8/9 OLI",
    sourceUrl: "https://lpdaac.usgs.gov/products/mod13a2v061/",
    spatialResolution: "250 m (MODIS) / 30 m (Landsat)",
    temporalResolution: "2000–2025 annual mean",
    scientificMeaning:
      "Percentage of ground obscured by vascular plants or macro-flora. High-fidelity planetary analogs require near-zero botanical cover so sensors and wheels interact with bare regolith.",
    planetaryAvailabilityNote: "Extraterrestrial targets on Mars and Moon are identically 0.0%.",
    legendStops: [
      { label: "0–1% (Barren Regolith)", color: "#00f0ff" },
      { label: "1–8% (Sparse Scrub)", color: "#34d399" },
      { label: "> 8% (Vegetated Margin)", color: "#f59e0b" },
    ],
    getColor: (val) => {
      if (typeof val !== "number") return "#64748b"
      if (val <= 1) return "#00f0ff"
      if (val <= 8) return "#34d399"
      return "#f59e0b"
    },
  },
  {
    id: "surfaceSolarIrradianceWm2",
    featureKey: "surfaceSolarIrradianceWm2",
    label: "Surface Solar Irradiance",
    shortLabel: "Solar (W/m²)",
    unit: "W/m²",
    sourceDataset: "NASA POWER CERES SYN1deg Radiative Flux",
    sourceUrl: "https://power.larc.nasa.gov/api/temporal/climatology/point",
    spatialResolution: "1.0° × 1.0° global CERES grid",
    temporalResolution: "2001–2025 all-sky climatology",
    scientificMeaning:
      "Downward shortwave radiative power incident per square meter. Critical for sizing solar photovoltaic arrays and modeling UV/photo-oxidative mineral weathering.",
    planetaryAvailabilityNote: "Directly comparable across Earth, Mars (MEDA RBS), and Moon (LOLA/Diviner).",
    legendStops: [
      { label: "< 150 W/m² (High Latitude)", color: "#60a5fa" },
      { label: "150–240 W/m² (Mid-Lat)", color: "#fbbf24" },
      { label: "> 240 W/m² (Hyper-Arid High)", color: "#f97316" },
    ],
    getColor: (val) => {
      if (typeof val !== "number") return "#64748b"
      if (val < 150) return "#60a5fa"
      if (val <= 240) return "#fbbf24"
      return "#f97316"
    },
  },
  {
    id: "rockAbundancePct",
    featureKey: "rockAbundancePct",
    label: "Surface Rock Abundance (>10 cm)",
    shortLabel: "Rock Cover (%)",
    unit: "%",
    sourceDataset: "Field Transects, LRO Diviner & Mars THEMIS Thermal Inertia",
    sourceUrl: "https://pds-geosciences.wustl.edu/missions/lro/diviner.htm",
    spatialResolution: "In situ ground transects / 100–240 m orbital thermal inertia",
    temporalResolution: "Multi-year geological baseline",
    scientificMeaning:
      "Areal fraction covered by rocks and clasts >10 cm diameter. Governs landing hazard avoidance and autonomous rover path planning.",
    planetaryAvailabilityNote: "Directly comparable across Earth, Mars, and Moon.",
    legendStops: [
      { label: "< 15% (Fine Regolith)", color: "#34d399" },
      { label: "15–30% (Moderate Clasts)", color: "#fbbf24" },
      { label: "> 30% (Blocky Boulder Field)", color: "#f43f5e" },
    ],
    getColor: (val) => {
      if (typeof val !== "number") return "#64748b"
      if (val < 15) return "#34d399"
      if (val <= 30) return "#fbbf24"
      return "#f43f5e"
    },
  },
  {
    id: "lithology",
    featureKey: "lithology",
    label: "Dominant Geological Classification",
    shortLabel: "Lithology",
    unit: "",
    sourceDataset: "USGS Global Lithologic Map (GLiM) & Rover XRD/APXS",
    sourceUrl: "https://www.chemie.uni-hamburg.de/institut-geologie/forschung/geochemie/glim.html",
    spatialResolution: "Regional geological quadrangle & in situ petrography",
    temporalResolution: "Bedrock geological baseline",
    scientificMeaning:
      "Primary rock and regolith petrogenetic class (basaltic, clay-sedimentary, sulfate-evaporite, impact-breccia) used for ISRU and astrobiology instrument calibration.",
    planetaryAvailabilityNote: "Compared across bodies via petrogenetic rock-family affinity matrix.",
    legendStops: [
      { label: "Basaltic (Igneous)", color: "#38bdf8" },
      { label: "Clay-Sedimentary", color: "#34d399" },
      { label: "Sulfate-Evaporite", color: "#f59e0b" },
      { label: "Impact Breccia", color: "#c084fc" },
    ],
    getColor: (val) => {
      if (typeof val !== "string") return "#64748b"
      return LITHOLOGY_COLORS[val as Lithology] ?? "#38bdf8"
    },
  },
]

export const ENVIRONMENTAL_MAP_LAYER_MAP: Record<MapParameterLayerId, MapParameterLayerDefinition> =
  Object.fromEntries(ENVIRONMENTAL_MAP_LAYERS.map((l) => [l.id, l])) as Record<
    MapParameterLayerId,
    MapParameterLayerDefinition
  >

/**
 * Resolves the concrete tile URL for a given NASA GIBS / Esri layer and observation date.
 */
export function resolveSatelliteTileUrl(
  layerId: SatelliteImageryLayerId,
  date: string
): string {
  const layer = SATELLITE_LAYER_MAP[layerId] ?? SATELLITE_LAYER_MAP["dark-base"]
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : layer.defaultDate
  return layer.tileUrlTemplate.replace("{date}", safeDate)
}

