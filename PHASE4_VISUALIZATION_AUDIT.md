# TerraTwin Phase 4: Scientific Data & Visualization Architecture Audit

**Document Version:** `1.0.0-phase4-milestone-a`  
**Audit Date:** 2026-11-03  
**Scope:** Complete inspection of existing visualization components, scientific datasets, raster archives, and API endpoints prior to Phase 4 implementation.

---

## 1. Subsystem & Component Architecture Audit

### 1.1 Existing Leaflet Earth Reconnaissance Map
- **Files Inspected:**
  - [`src/components/explorer/analog-map.tsx`](src/components/explorer/analog-map.tsx)
  - [`src/components/explorer/analog-map-canvas.tsx`](src/components/explorer/analog-map-canvas.tsx)
- **Current Capabilities:**
  - Uses `react-leaflet` (`v5.0.0`) and `leaflet` (`v1.9.4`) dynamically imported with `ssr: false`.
  - Renders candidate `CircleMarker` overlays scaled by similarity score (`0–100%`) with interactive hover `Tooltip` and click `Popup` telemetry briefs.
  - Auto-pans to selected candidate (`KeepSelectionInView`) and fits bounds (`FitToResults`).
- **Identified Gaps for Phase 4:**
  - Currently hardcoded to a single base layer (`Esri World_Dark_Gray_Base`).
  - Lacks NASA GIBS (`gibs.earthdata.nasa.gov`) satellite imagery layers (VIIRS/MODIS True Color, MODIS NDVI Vegetation, MODIS Land Surface Temperature, NASADEM/SRTM Shaded Relief, Esri/USGS High-Res Optical).
  - Lacks a layer switcher, date selector for temporal GIBS layers, and quantitative data-driven spatial symbolization layers (e.g., coloring/scaling markers by specific environmental parameters such as `meanSlopeDeg`, `albedo`, `rockAbundancePct`, or `surfaceSolarIrradianceWm2` with a dynamic scientific unit legend).

### 1.2 3D Moon and Mars Planetary Globe Components
- **Files Inspected:**
  - [`src/components/explorer/planetary-globe.tsx`](src/components/explorer/planetary-globe.tsx)
  - [`src/components/explorer/planetary-globe-canvas.tsx`](src/components/explorer/planetary-globe-canvas.tsx)
  - [`src/lib/terratwin/planet-math.ts`](src/lib/terratwin/planet-math.ts)
- **Current Capabilities:**
  - Raw WebGL `THREE.WebGLRenderer` (`three v0.187.0`) with ACES Filmic tone mapping, solar terminator directional lighting, axial tilt (`25.19°` Mars, `1.54°` Moon), quaternion slerp camera targeting, and raycasted 3D target markers.
  - Displays physical planetary specifications (Mean Radius, Surface Gravity, Surface Pressure, Axial Tilt).
- **Identified Gaps for Phase 4:**
  - Does not yet visualize or synchronize spatial elevation transects on the planetary target alongside the elevation profile tool.

### 1.3 Environmental Feature Schema & Harmonization Rules
- **Files Inspected:**
  - [`src/lib/terratwin/features.ts`](src/lib/terratwin/features.ts)
  - [`src/lib/terratwin/config/compatibility-matrix.ts`](src/lib/terratwin/config/compatibility-matrix.ts)
  - [`src/lib/terratwin/types.ts`](src/lib/terratwin/types.ts)
- **Current Capabilities:**
  - Defines 12 physical parameters across 4 comparability tiers:
    1. **Directly Comparable (6):** `meanSurfaceTempC`, `surfaceSolarIrradianceWm2`, `rockAbundancePct`, `albedo`, `medianGrainSizeMm`, `vegetationCoverPct`.
    2. **Comparable After Transformation (2):** `diurnalTempRangeC`, `meanSlopeDeg`.
    3. **Proxy-Based Comparison (1):** `lithology` (`basaltic`, `anorthositic`, `volcanic-tephra`, `sulfate-evaporite`, `clay-sedimentary`, `impact-breccia`, `felsic-crystalline` mapped to 4 rock families).
    4. **Not Scientifically Comparable (3):** `surfacePressurePa`, `annualPrecipitationMm`, `elevationM` (datum-dependent).

### 1.4 Expanded Phase 3 Dataset Catalog & Raw Data Archives
- **Files Inspected:**
  - [`NASA_DATA_CATALOG.md`](NASA_DATA_CATALOG.md)
  - [`src/lib/terratwin/data-sources.ts`](src/lib/terratwin/data-sources.ts)
  - `raw-data/mars/megt90n000cb.img` & `.lbl` (2,073,600 bytes)
  - `raw-data/moon/ldem_4.img` & `.lbl` (2,073,600 bytes)
  - `raw-data/earth/nasa_power_*_raw.json` (8 complete NASA POWER climatology JSON payloads)
- **Current Capabilities:**
  - **Mars Global DEM (`megt90n000cb.img`):** Complete $1440 \times 720$ 16-bit signed big-endian binary raster (4 pixels/degree, $\sim 14.8\text{ km/px}$ at equator, referenced to Mars IAU2000 Areoid). Supports real multi-point spatial elevation transect extraction anywhere on Mars.
  - **Moon Global DEM (`ldem_4.img`):** Complete $1440 \times 720$ 16-bit signed little-endian binary raster ($0.5\text{ m}$ scale factor, 4 pixels/degree, $\sim 7.58\text{ km/px}$ at equator, referenced to Lunar $1,737.4\text{ km}$ sphere). Supports real multi-point spatial elevation transect extraction anywhere on the Moon.
  - **Earth NASA POWER Climatology Archives:** All 8 Earth analog sites have cached 12-month (`JAN`–`DEC`) + annual (`ANN`) multi-decadal (2001–2025) time-series in `raw-data/earth/` for `T2M`, `T2M_MAX`, `T2M_MIN`, `ALLSKY_SFC_SW_DWN`, `PS`, and `PRECTOTCORR`.
- **Identified Gaps for Phase 4:**
  - **Earth Spatial Elevation Transects:** While Mars and Moon have local gridded DEM rasters (`megt90n000cb.img` and `ldem_4.img`), Earth analog candidates currently store only single-point `elevationM` and regional `meanSlopeDeg` in the database. To support authentic Earth elevation transects in Milestone C without fabricating profiles from a single number, we must ingest real multi-point elevation transects from an authoritative DEM service (e.g., Copernicus GLO-30 / SRTM 30m/90m via Open-Meteo / USGS / OpenTopography) across each candidate's documented bounding transect and cache them with full provenance in `raw-data/earth/`.

### 1.5 Supabase Tables, Repository & API Endpoints
- **Files Inspected:**
  - [`src/lib/terratwin/db/planetary-repository.ts`](src/lib/terratwin/db/planetary-repository.ts)
  - [`src/app/api/analogs/route.ts`](src/app/api/analogs/route.ts)
  - [`src/app/api/compare/route.ts`](src/app/api/compare/route.ts)
  - [`src/app/api/portfolio/route.ts`](src/app/api/portfolio/route.ts)
  - [`src/app/api/locations/route.ts`](src/app/api/locations/route.ts)
  - [`src/app/api/sources/route.ts`](src/app/api/sources/route.ts)
  - [`src/app/api/export/route.ts`](src/app/api/export/route.ts)
- **Current Capabilities:**
  - Queries Supabase (`locations`, `environmental_features`, `dataset_sources`) and seamlessly merges canonical Phase 3 verified expansions (5 planetary targets, 8 Earth candidates, 10 active verified dataset sources).

### 1.6 Similarity Engine, Portfolio Optimizer & Recharts UI
- **Files Inspected:**
  - [`src/lib/terratwin/engine/similarity.ts`](src/lib/terratwin/engine/similarity.ts)
  - [`src/lib/terratwin/engine/portfolio.ts`](src/lib/terratwin/engine/portfolio.ts)
  - [`src/components/explorer/feature-similarity-chart.tsx`](src/components/explorer/feature-similarity-chart.tsx)
  - [`src/components/ui/chart.tsx`](src/components/ui/chart.tsx)
- **Current Capabilities:**
  - `recharts` (`v3.10.1`) and shadcn `ChartContainer` / `ChartTooltip` are installed and configured in `src/components/ui/chart.tsx`, though `feature-similarity-chart.tsx` currently uses CSS progress bars rather than interactive Recharts Cartesian/Radar/Area charts.
  - Recharts is ready for Milestone C (Interactive Elevation Profile `AreaChart` / `LineChart` with dual/relative elevation modes and hover crosshairs) and Milestone D (Terrain & Multi-Parameter Comparison visualizations).

---

## 2. Phase 4 Visualization Availability Matrix

Below is the required availability matrix assessing every planned Phase 4 visualization against our verified data holdings:

| Visualization | Required data | Status | Supporting Verified Datasets & Technical Notes |
| :--- | :--- | :--- | :--- |
| **NASA imagery** | Verified imagery source | **Available** (via NASA GIBS WMTS + Esri/USGS) | Official public NASA GIBS WMTS tiles (`EPSG:3857`): `VIIRS_SNPP_CorrectedReflectance_TrueColor`, `MODIS_Terra_CorrectedReflectance_TrueColor`, `MODIS_Terra_NDVI_8Day`, `MODIS_Terra_Land_Surface_Temp_Day`, `ASTER_GDEM_Color_Shaded_Relief` / `SRTM_Color_Index`, plus existing `Esri World_Dark_Gray_Base`. Note: GIBS tiles are visualization products, not raw pixel telemetry. |
| **Elevation profile** | Spatial elevation data | **Available for Mars & Moon; Earth Transects Require Ingestion in Milestone C** | **Mars:** Local binary DEM `raw-data/mars/megt90n000cb.img` (MGS MOLA MEGDR, 4 px/deg, IAU2000 Areoid).<br>**Moon:** Local binary DEM `raw-data/moon/ldem_4.img` (LRO LOLA LDEM_4, 4 px/deg, 1737.4 km sphere).<br>**Earth:** Currently single-point elevation in DB; Milestone C will ingest verified SRTM / Copernicus GLO-30 spatial transects across each candidate's study area into `raw-data/earth/` so real multi-point transects are compared (using relative $\Delta z$ relief to respect distinct planetary datums). |
| **Terrain comparison** | Compatible terrain measurements | **Available** (for `meanSlopeDeg`, `rockAbundancePct`, `medianGrainSizeMm`, `albedo`, `meanSurfaceTempC`, `diurnalTempRangeC`, and local 3x3 DEM relief) | Verified across all 5 planetary targets and 8 Earth analogs (`100%` coverage). Note: Sub-meter micro-roughness (RMS height at $<1\text{ cm}$) is **Missing** for most sites and will not be fabricated; regional Horn (1981) $3\times 3$ slope, local relief ($\Delta z$), rock abundance ($\%$), and median grain size ($\text{mm}$, log scale) are verified and available. |
| **Geological comparison** | Verified geological classifications | **Available** | Verified categorical `lithology` and rock family classifications (`igneous`, `sedimentary`, `impact`, `crystalline`) across all 13 locations from M2020 PIXL/SHERLOC, MSL CheMin, MER Opportunity APXS/Mössbauer, Apollo Sample Compendium, and USGS GLiM / national geological surveys. |
| **Environmental layers** | Valid spatial or environmental dataset | **Available** | All 12 environmental parameters in Phase 3 have verified values, units, spatial resolutions, and dataset provenance across the 8 Earth candidates and 5 planetary targets, plus NASA GIBS raster overlays for Earth and MOLA/LOLA raster grids for Mars/Moon. |

---

## 3. Parameter-by-Parameter Readiness Audit Across All 13 Locations

| Parameter Key | Unit | Comparability Tier | Mars Targets (3/3) | Moon Targets (2/2) | Earth Candidates (8/8) | Visualization Readiness |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `meanSurfaceTempC` | `°C` | Direct | 3/3 Verified | 2/2 Verified | 8/8 Verified | Ready for Terrain Comparison, Layer Explorer, & Evidence Explorer |
| `diurnalTempRangeC` | `°C` | Transformed | 3/3 Verified | 2/2 Verified | 8/8 Verified | Ready (requires diurnal period annotation: 24h vs 24.6h vs 708.7h) |
| `surfaceSolarIrradianceWm2` | `W/m²` | Direct | 3/3 Verified | 2/2 Verified | 8/8 Verified | Ready for Layer Explorer & Evidence Explorer |
| `meanSlopeDeg` | `°` | Transformed | 3/3 Verified | 2/2 Verified | 8/8 Verified | Ready for Terrain Comparison & Spatial Layer Explorer |
| `rockAbundancePct` | `%` | Direct | 3/3 Verified | 2/2 Verified | 8/8 Verified | Ready for Terrain Comparison & Hazard Visualization |
| `medianGrainSizeMm` | `mm` | Direct (Log) | 3/3 Verified | 2/2 Verified | 8/8 Verified | Ready for Logarithmic Regolith Texture Comparison |
| `albedo` | `0–1` | Direct | 3/3 Verified | 2/2 Verified | 8/8 Verified | Ready for Optical Reflectance & Thermal Comparison |
| `vegetationCoverPct` | `%` | Direct | 3/3 Verified (`0%`) | 2/2 Verified (`0%`) | 8/8 Verified | Ready for Earth Map Layer & Analog Filtering |
| `lithology` | `class` | Proxy-Based | 3/3 Verified | 2/2 Verified | 8/8 Verified | Ready for Geological Comparison Matrix |
| `elevationM` | `m` | Not Comparable | 3/3 + Full DEM | 2/2 + Full DEM | 8/8 Point (Transect in Milestone C) | Ready with Datum Isolation & Relative Relief ($\Delta z$) Transformation |
| `surfacePressurePa` | `Pa` | Not Comparable | 3/3 Verified | 2/2 Verified | 8/8 Verified | Context Display Only (Excluded from Similarity Score) |
| `annualPrecipitationMm` | `mm/yr` | Not Comparable | 3/3 Verified (`0`) | 2/2 Verified (`0`) | 8/8 Verified | Earth Aridity Layer Only (Excluded from Similarity Score) |

---

## 4. Scientific Guardrails & Limitations Identified in Audit

1. **NASA GIBS Tile Disclaimers:**
   - GIBS WMTS tiles are rendered RGB visualization products. When displaying MODIS Land Surface Temperature, MODIS NDVI, or True Color reflectance on the Leaflet map, the UI must explicitly state that tile colors represent visual browse composites while quantitative similarity scoring uses the calibrated tabular/reanalysis telemetry (NASA POWER, MOD11A2, SRTM).
2. **Planetary Elevation Datum Isolation:**
   - Mars (`IAU2000 Areoid`), Moon (`1,737.4 km Sphere`), and Earth (`EGM96 Geoid / Mean Sea Level`) have physically incompatible zero-elevation reference surfaces.
   - In Milestone C, elevation profiles must **never** plot raw Martian elevation (e.g., $-2,575\text{ m}$ at Jezero) on the same absolute axis as Earth elevation ($+1,193\text{ m}$ at Lake Salda) without either:
     - **Relative Relief Mode ($\Delta z = z(x) - z_{\text{start}}$ or $z(x) - \bar{z}$):** Comparing topographic relief and gradient across horizontal distance $x$, OR
     - **Separated / Dual-Datum Reference Panels:** Clearly labeling each planetary datum and spatial resolution ($14.8\text{ km/px}$ MOLA vs $7.58\text{ km/px}$ LOLA vs $30–90\text{ m}$ SRTM/Copernicus).
3. **Resolution Disparity Transparency:**
   - Global MOLA (`4 px/deg`) and LOLA (`4 px/deg`) grids capture macro-scale basin and crater rim topography, whereas terrestrial SRTM/Copernicus DEMs capture meso-scale (`30–90 m`) landforms. Both resolutions must be explicitly badged on every profile chart.

