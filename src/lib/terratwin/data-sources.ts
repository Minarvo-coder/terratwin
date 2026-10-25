export type DataSourceStatus = "in-use" | "candidate"

export interface DataSource {
  name: string
  provider: string
  scope: "Moon" | "Mars" | "Earth"
  informs: string
  status: DataSourceStatus
}

export const DATA_SOURCES: DataSource[] = [
  {
    name: "TerraTwin illustrative sample dataset",
    provider: "Hand-authored for this prototype",
    scope: "Earth",
    informs: "Every value currently shown in the explorer",
    status: "in-use",
  },
  { name: "LRO Diviner Lunar Radiometer", provider: "NASA / UCLA", scope: "Moon", informs: "Surface temperature, diurnal range, rock abundance", status: "candidate" },
  { name: "LRO LOLA topography", provider: "NASA GSFC", scope: "Moon", informs: "Slope and roughness", status: "candidate" },
  { name: "MRO HiRISE / CTX imagery", provider: "NASA JPL / Univ. of Arizona", scope: "Mars", informs: "Rock abundance, terrain morphology", status: "candidate" },
  { name: "MGS MOLA topography", provider: "NASA GSFC", scope: "Mars", informs: "Slope and elevation", status: "candidate" },
  { name: "Mars Odyssey THEMIS", provider: "NASA / ASU", scope: "Mars", informs: "Thermal inertia, grain size, temperature", status: "candidate" },
  { name: "ERA5 reanalysis", provider: "ECMWF Copernicus", scope: "Earth", informs: "Temperature and precipitation climatology", status: "candidate" },
  { name: "Copernicus GLO-30 DEM", provider: "ESA", scope: "Earth", informs: "Terrain slope", status: "candidate" },
  { name: "MODIS albedo (MCD43)", provider: "NASA LP DAAC", scope: "Earth", informs: "Surface albedo", status: "candidate" },
  { name: "ESA WorldCover", provider: "ESA", scope: "Earth", informs: "Vegetation cover", status: "candidate" },
  { name: "Macrostrat / national geological surveys", provider: "Various", scope: "Earth", informs: "Lithology", status: "candidate" },
]
