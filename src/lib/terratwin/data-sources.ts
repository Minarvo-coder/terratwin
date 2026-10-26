export type DataSourceStatus = "integrated" | "candidate" | "in-use"

export interface DataSource {
  id?: string
  name: string
  provider: string
  scope: "Moon" | "Mars" | "Earth" | "Multi-body"
  informs: string
  status: DataSourceStatus
  version?: string
  sourceUrl?: string
  resolution?: string
  integrationNotes?: string
}

export const DATA_SOURCES: DataSource[] = [
  // --- INTEGRATED DATASETS (Active in Supabase PostgreSQL database) ---
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "MGS MOLA Topography (MEGDR)",
    provider: "NASA GSFC / PDS Geosciences Node",
    scope: "Mars",
    informs: "Topographic elevation, regional slope angles, crater depths",
    status: "integrated",
    version: "MGS-M-MOLA-5-MEGDR-L3-V1.0 (Product Version 2.0)",
    sourceUrl: "https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megt90n000cb.img",
    resolution: "4 pix/deg (~14.8 km/pix)",
    integrationNotes: "Ingested in database via binary raster sampling (megt90n000cb.img) relative to Mars IAU2000 areoid.",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "LRO LOLA Topography (LDEM_4)",
    provider: "NASA GSFC / PDS Geosciences Node",
    scope: "Moon",
    informs: "Lunar polar and equatorial topography, slope gradients",
    status: "integrated",
    version: "LRO-L-LOLA-4-GDR-V1.0 (Product Version V3.0)",
    sourceUrl: "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_4.img",
    resolution: "4 pix/deg (~7.58 km/pix)",
    integrationNotes: "Ingested in database via binary raster sampling (ldem_4.img) scaled to 1737.4 km reference sphere.",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "NASA POWER Climatology Native Resolution",
    provider: "NASA Langley Research Center (LaRC)",
    scope: "Earth",
    informs: "25-year surface temperature, diurnal temp range, solar irradiance, surface pressure",
    status: "integrated",
    version: "POWER Climatology API v2.10.1 (2001-2025)",
    sourceUrl: "https://power.larc.nasa.gov/api/temporal/climatology/point",
    resolution: "0.5° × 0.625° (~50 km)",
    integrationNotes: "Ingested in database via REST API climatology query across all 4 Earth analog sites.",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "MSL Curiosity Rover REMS Weather Station",
    provider: "Centro de Astrobiología (CSIC-INTA) / NASA PDS",
    scope: "Mars",
    informs: "In situ ground temperature, diurnal amplitude, surface pressure at Gale Crater",
    status: "integrated",
    version: "MSL-M-REMS-5-MODR-V1.0 (Sols 0-3500)",
    sourceUrl: "https://pds-geosciences.wustl.edu/missions/msl/rems.htm",
    resolution: "In situ rover traverse point",
    integrationNotes: "Ingested in database from 10-year in situ ground temperature sensor (GTS) climatology.",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Mars 2020 Perseverance Rover MEDA Dynamics Analyzer",
    provider: "Centro de Astrobiología / NASA PDS Atmospheres Node",
    scope: "Mars",
    informs: "In situ ground temperature, diurnal thermal range, atmospheric pressure at Jezero Crater",
    status: "integrated",
    version: "M2020-M-MEDA-2-RDR-V1.0",
    sourceUrl: "https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/perseverance.html",
    resolution: "In situ rover traverse point",
    integrationNotes: "Ingested in database from thermal infrared sensor (TIRS) and pressure transducer records.",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "LRO Diviner Lunar Radiometer Experiment (DLRE GDR)",
    provider: "UCLA / NASA PDS Geosciences Node",
    scope: "Moon",
    informs: "Surface temperature, diurnal range, cryogenic cold traps, rock abundance",
    status: "integrated",
    version: "LRO-L-DLRE-4-GDR-V1.0",
    sourceUrl: "https://pds-geosciences.wustl.edu/missions/lro/diviner.htm",
    resolution: "0.5° polar / 1.0° global",
    integrationNotes: "Ingested in database for Shackleton Crater Rim (cryogenic cold traps) and Mare Tranquillitatis.",
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    name: "NASA SRTMGL1 & Copernicus GLO-30 DEM",
    provider: "NASA LP DAAC / USGS / ESA",
    scope: "Earth",
    informs: "High-resolution regional slope gradients and terrain elevation",
    status: "integrated",
    version: "SRTMGL1 v003 / Copernicus GLO-30",
    sourceUrl: "https://lpdaac.usgs.gov/products/srtmgl1v003/",
    resolution: "30 meters",
    integrationNotes: "Ingested in database with Sobel gradient sampling across all 4 Earth candidate regions.",
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    name: "MODIS/Terra Land Surface Temperature & Albedo (MOD11A2 / MOD09GA)",
    provider: "NASA Land Processes DAAC (LP DAAC)",
    scope: "Earth",
    informs: "Surface broadband albedo, diurnal thermal range, vegetation cover",
    status: "integrated",
    version: "Collection 6.1 (2000-2025)",
    sourceUrl: "https://lpdaac.usgs.gov/products/mod11a2v061/",
    resolution: "1 km thermal / 500 m surface reflectance",
    integrationNotes: "Ingested in database 25-year composited climatology for Earth analog sites.",
  },

  // --- CANDIDATE SOURCES (Queued for Future Pipeline Expansion) ---
  {
    name: "MRO HiRISE / CTX High-Resolution Imagery",
    provider: "NASA JPL / Univ. of Arizona",
    scope: "Mars",
    informs: "Rover-scale boulder distribution, meter-scale obstacle hazards",
    status: "candidate",
    version: "PDS Imaging Node EDR/RDR",
    resolution: "0.25 m (HiRISE) / 6 m (CTX)",
    integrationNotes: "Pipeline requirement: Requires multi-gigabyte orthorectified raster pyramids and automated computer vision rock detection.",
  },
  {
    name: "Mars Odyssey THEMIS Thermal Infrared",
    provider: "NASA / Arizona State University (ASU)",
    scope: "Mars",
    informs: "Thermal inertia, regolith grain size estimation",
    status: "candidate",
    version: "THEMIS Daytime/Nighttime IR Mosaics v12",
    resolution: "100 m/pixel",
    integrationNotes: "Pipeline requirement: Requires calibrated nighttime IR brightness temperature inversion to derive spatial thermal inertia.",
  },
  {
    name: "ESA WorldCover Global Land Cover",
    provider: "European Space Agency (ESA)",
    scope: "Earth",
    informs: "Botanical ground cover percentage",
    status: "candidate",
    version: "WorldCover 10m v200",
    resolution: "10 meters",
    integrationNotes: "Pipeline requirement: Requires continental-scale Sentinel-1/Sentinel-2 10m land cover GeoTIFF sampling.",
  },
  {
    name: "Macrostrat / Global Geological Surveys",
    provider: "Univ. of Wisconsin / USGS / International Surveys",
    scope: "Earth",
    informs: "Automated spatial lithostratigraphy and rock mineralogy",
    status: "candidate",
    version: "Macrostrat API v2",
    resolution: "Vector polygon geologic maps",
    integrationNotes: "Pipeline requirement: Requires dynamic spatial API joins to geological polygon databases for arbitrary coordinates.",
  },
]
