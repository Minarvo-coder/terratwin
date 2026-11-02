# TerraTwin — Planetary Analog Mission Control & Scientific Data Engine

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-Planetary%20Analogs-blue.svg)](https://www.spaceappschallenge.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black.svg)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Phase 4 Master Suite](https://img.shields.io/badge/Phase%204%20Visualizations-Passing%20(5%2F5)-cyan.svg)](./scripts)
[![Test Suite](https://img.shields.io/badge/Phase%203%20Master-12%2F12%20Passing-emerald.svg)](./scripts)

**TerraTwin** is an open-source, scientifically grounded planetary analog research platform designed for the **NASA Space Apps Challenge**. It integrates authentic orbital and in situ telemetry from NASA and ESA planetary missions with high-resolution terrestrial observations, enabling planetary scientists, rover mission planners, and astronauts to discover, evaluate, and optimize Earth analog field test sites for Moon and Mars exploration.

---

## Architecture Overview

TerraTwin unites four core scientific capabilities:

1. **3D Planetary Mission Control Flight Deck**
   - High-fidelity 3D visualization of the **Moon** and **Mars** rendered with Three.js using authentic NASA PDS planetary texture maps.
   - Synchronized dual-projection reconnaissance: 3D planetary target tracking paired with an interactive Leaflet GIS Earth analog map.
2. **Combinatorial Multi-Site Analog Portfolio Optimizer**
   - Evaluates combinations of complementary Earth analog sites ($C(n, 2)$ pairs and $C(n, 3)$ trios) to maximize cumulative scientific coverage over extraterrestrial mission profiles.
   - Computes rigorous **Synergy Gain** ($\Delta S = S_{portfolio} - \max(S_i)$) and detects residual environmental deficits.
3. **NASA Scientific Data Foundation & Harmonization Engine**
   - **Zero synthetic measurements**: 100% of telemetry is traceable to official NASA Planetary Data System (PDS) products, NASA Earthdata / Langley POWER climatology, and peer-reviewed geological field studies.
   - **4-Tier Scientific Comparability Framework**: Strictly prevents mathematically flawed comparisons between incompatible physical regimes (e.g., lunar vacuum vs. Earth sea-level pressure).
   - **Reproducible Ingestion & Sampling Pipelines**: Direct binary sampling of MGS MOLA and LRO LOLA GDR rasters using Horn (1981) 3x3 finite-difference slope estimation.
4. **Advanced Scientific Visualization & Planetary Explorer (Phase 4)**
   - **NASA GIBS & Esri Satellite Imagery Integration**: 6 remote-sensing layers (MODIS True Color, NDVI, Land Surface Temp, Bands 7-2-1 SWIR, ASTER GDEM, and Dark Canvas) with seasonal presets, date picker, and 9 parameter telemetry overlays.
   - **Topographic Elevation Profile & Relief Engine**: Geodesic slerp interpolation across MOLA MEGDR and LOLA LDEM crater transects compared with 30-point Copernicus DEM 90m (`COP-DEM-GLO-90`) profiles with relative relief ($\Delta z$) and datum isolation.
   - **Dedicated Terrain Comparison Workspace**: Multi-axis Recharts radar chart, side-by-side morphology cards with Wentworth sediment grain sizing, categorized parameter matrix, and automated data-driven terramechanics synthesis.
   - **Scientific Evidence Explorer**: Interactive 5-stage traceability pipeline tracing *Location → Parameter → Measurement → Instrument/Dataset → Official Documentation*.

---

## Official Integrated NASA & Authoritative Dataset Archives

| Dataset ID | Instrument / Product | Responsible Organization | Informs | Reference Datum |
| :--- | :--- | :--- | :--- | :--- |
| `11111111-...` | **MGS MOLA MEGDR** (`megt90n000cb.img`) | NASA GSFC / PDS Geosciences | Topography, elevation, Horn 3x3 regional slope | **Mars IAU2000 Areoid** (0 m datum) |
| `22222222-...` | **LRO LOLA LDEM** (`ldem_4.img`) | NASA GSFC / PDS Geosciences | Lunar polar and equatorial topography, relief | **Lunar Reference Sphere** ($R = 1,737.4\text{ km}$) |
| `33333333-...` | **NASA POWER Climatology Native Resolution** | NASA Langley Research Center (LaRC) | 25-yr mean temp, diurnal $\Delta T$, solar flux, barometric pressure | **Earth EGM96 Geoid** (sea level) |
| `44444444-...` | **MSL Curiosity Rover REMS Weather Station** | Centro de Astrobiología / NASA PDS | In situ ground temperature, diurnal amplitude, pressure | Gale Crater floor traverse |
| `55555555-...` | **Mars 2020 Perseverance Rover MEDA** | Centro de Astrobiología / NASA PDS | In situ surface thermal excursion, atmospheric pressure | Jezero Crater delta traverse |
| `66666666-...` | **LRO Diviner Lunar Radiometer (DLRE GDR)** | UCLA / NASA PDS Geosciences | Cryogenic PSR cold traps, lunar diurnal thermometry | Lunar surface radiometric |
| `77777777-...` | **NASA SRTMGL1 & Copernicus GLO-30 DEM** | NASA LP DAAC / USGS / ESA | High-resolution slope gradients and terrain elevation | Earth EGM96 / WGS84 |
| `88888888-...` | **MODIS/Terra Land Surface Temp & Albedo** | NASA LP DAAC | Broadband albedo, thermal range, vegetation index | Earth WGS84 |
| `99999999-...` | **MER Opportunity Athena Science Payload** | NASA JPL-Caltech / Cornell / PDS | In situ jarosite/hematite evaporites, APXS, Mini-TES | Meridiani Planum traverse |
| `aaaaaaaa-...` | **Apollo CCGE & LRO LAMP Lunar Exosphere** | NASA GSFC / Apollo Science Archive | Lunar surface ambient pressure ($3 \times 10^{-10}\text{ Pa}$) | Lunar surface ambient exosphere |

---

## Indexed Planetary Targets & Earth Analog Candidates

### Planetary Targets (Moon & Mars)
1. **Jezero Crater Delta (Mars)** ($18.38^\circ\text{ N}, 77.58^\circ\text{ E}$, $-2,651\text{ m}$): Ancient deltaic lake basin landing site of NASA Perseverance rover featuring smectite clays and carbonate microbialites.
2. **Gale Crater / Aeolis Mons (Mars)** ($-5.36^\circ\text{ S}, 137.86^\circ\text{ E}$, $-893\text{ m}$): Layered sedimentary sulfate mound landing site of NASA MSL Curiosity rover recording the transition to hyper-aridity.
3. **Meridiani Planum (Mars)** ($-0.20^\circ\text{ S}, 357.50^\circ\text{ E}$, $-1,305\text{ m}$): Flat hematite- and jarosite-bearing evaporite plain explored by MER Opportunity (sols 1–5111).
4. **Shackleton Crater Rim (Moon)** ($-89.90^\circ\text{ S}, 0.00^\circ\text{ E}$, $+102.5\text{ m}$): Lunar South Pole impact rim adjacent to permanently shadowed regions (PSRs) exhibiting cryogenic volatile cold traps ($40\text{ K}$).
5. **Mare Tranquillitatis (Moon)** ($0.67^\circ\text{ N}, 23.47^\circ\text{ E}$, $-1,883\text{ m}$): Low-relief titanium-rich basaltic mare volcanic plain benchmarked by Apollo 11 lunar sample returns.

### Earth Analog Candidates
1. **Atacama Desert (Yungay Plateau, Chile)** ($-23.86^\circ\text{ N}, -68.24^\circ\text{ W}$, $3,409\text{ m}$): Extreme hyper-arid desert plateau with high UV flux, perchlorates, and oxidized soils.
2. **Mauna Kea Summit Cones (Hawaii, USA)** ($19.82^\circ\text{ N}, -155.47^\circ\text{ W}$, $636\text{ m}$): High-altitude weathered basaltic tephra cinder cones and palagonitized dust.
3. **Haughton Impact Structure (Devon Island, Canada)** ($75.38^\circ\text{ N}, -89.68^\circ\text{ W}$, $173\text{ m}$): High-arctic impact crater in cold polar desert permafrost with shatter cones.
4. **McMurdo Dry Valleys (Antarctica)** ($-77.50^\circ\text{ S}, 162.00^\circ\text{ E}$, $1,139\text{ m}$): Polar cold desert with ventifacts, extreme low humidity, and permafrost polygonal ground.
5. **Lake Salda (Burdur, Turkey)** ($37.55^\circ\text{ N}, 29.68^\circ\text{ E}$, $1,193\text{ m}$): Alkaline hydromagnesite microbialite lake, premier mineralogical analog for Jezero Crater delta carbonates.
6. **Craters of the Moon National Monument (Idaho, USA)** ($43.46^\circ\text{ N}, -113.56^\circ\text{ W}$, $1,805\text{ m}$): Pristine Holocene olivine tholeiite basalt lava flows and cinder plains matching lunar mare regolith.
7. **Askja Caldera & Holuhraun Lava Field (Iceland)** ($64.90^\circ\text{ N}, -16.83^\circ\text{ W}$, $1,100\text{ m}$): Apollo astronaut geology training site featuring unvegetated basaltic tephra and unweathered blocky lavas.
8. **Río Tinto Acidic Basin (Huelva, Spain)** ($37.70^\circ\text{ N}, -6.55^\circ\text{ W}$, $310\text{ m}$): Hyper-acidic (pH $\sim 2$) iron/sulfate river basin with jarosite evaporites and hematite spherules matching Meridiani Planum.

---

## 4-Tier Scientific Harmonization Framework

Earth, Mars, and the Moon have fundamentally distinct physical environments. TerraTwin enforces rigorous physical comparability rules:

1. 🟢 **DIRECTLY COMPARABLE**:
   - `meanSurfaceTempC`: Standardized kinetic/radiometric temperature in Celsius.
   - `surfaceSolarIrradianceWm2`: Surface downward solar flux (accounts for orbital solar constant $1.0\text{ AU}$ vs $1.52\text{ AU}$).
   - `rockAbundancePct`: Area fraction covered by clasts $> 0.1\text{ m}$.
   - `albedo`: Broadband hemispherical surface reflectance (0–1).
   - `medianGrainSizeMm`: Particulate size compared in logarithmic dex space.
   - `vegetationCoverPct`: Extraterrestrial targets are identically 0.0%.
2. 🟡 **COMPARABLE AFTER TRANSFORMATION**:
   - `diurnalTempRangeC`: Diurnal/seasonal thermal amplitude. Normalized for Earth/Mars diurnal cycles ($24.0\text{ h}$ vs $24.6\text{ h}$) vs lunar synodic cycle ($29.5\text{ d}$).
   - `meanSlopeDeg`: Gravitational gradient angle derived via Horn (1981) 3x3 finite-difference filtering.
3. 🟣 **PROXY-BASED COMPARISON**:
   - `lithology`: Categorical petrogenetic distance matrix reflecting basaltic, carbonate, sulfate-evaporite, and felsic geochemical affinities.
4. 🔴 **NOT SCIENTIFICALLY COMPARABLE (EXCLUDED FROM DENOMINATOR)**:
   - `surfacePressurePa`: Barometric pressure spans 2 to 14 orders of magnitude (Earth $\sim 100\text{ kPa}$, Mars $\sim 0.7\text{ kPa}$, Moon $< 10^{-9}\text{ Pa}$). Displayed for environmental context only.
   - `annualPrecipitationMm`: Extraterrestrial targets have identically 0.0 mm liquid rainfall.
   - `elevationM`: Reference datums are physically distinct equipotentials (EGM96 geoid vs IAU2000 areoid vs $1,737.4\text{ km}$ sphere). Cannot be subtracted across bodies.

---

## Getting Started

### Prerequisites
- Node.js 20+ (Node.js 24 recommended)
- npm 10+

### Installation
```bash
# Clone the repository
git clone https://github.com/Minarvo/TerraTwin.git
cd TerraTwin

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the application.

---

## Reproducible Scientific Ingestion & Sampling Tools

```bash
# 1. Fetch, normalize, and cache live NASA POWER climatology records for all Earth candidate sites
node scripts/ingest-nasa-power.mjs

# 2. Sample authentic elevation and calculate Horn 3x3 slope from MGS MOLA and LRO LOLA GDR rasters
node scripts/sample-topography.mjs

# 3. Execute automated scientific data quality audit across all 13 locations
node scripts/validate-harmonization.mjs
```

---

## Machine-Readable Scientific Export API

TerraTwin provides RESTful endpoints to export full telemetry and provenance metadata for research papers and proposals:

- **Full CSV Telemetry Matrix**:
  ```bash
  curl "http://localhost:3000/api/export?format=csv" -o terratwin_telemetry.csv
  ```
- **Full JSON Scientific Catalog**:
  ```bash
  curl "http://localhost:3000/api/export?format=json" -o terratwin_catalog.json
  ```
- **Single-Site Analog Scoring**:
  ```bash
  curl -X POST "http://localhost:3000/api/compare" \
    -H "Content-Type: application/json" \
    -d '{"targetId": "a0000001-0000-4000-8000-000000000001", "missionProfile": "geological-research"}'
  ```
- **Multi-Site Portfolio Optimization**:
  ```bash
  curl -X POST "http://localhost:3000/api/portfolio" \
    -H "Content-Type: application/json" \
    -d '{"targetId": "a0000001-0000-4000-8000-000000000001", "missionProfile": "geological-research", "portfolioSize": 2}'
  ```

---

## Technical Documentation & Methodology Guides

Comprehensive scientific methodologies and architecture references are available in the repository:

- [`SCIENTIFIC_VISUALIZATION_GUIDE.md`](./SCIENTIFIC_VISUALIZATION_GUIDE.md): Master technical guide for all Phase 4 visual instruments and component interactions.
- [`NASA_IMAGERY_INTEGRATION.md`](./NASA_IMAGERY_INTEGRATION.md): NASA GIBS WMTS endpoints, zoom constraints, seasonal presets, and browse-product disclaimers.
- [`ELEVATION_PROFILE_METHODOLOGY.md`](./ELEVATION_PROFILE_METHODOLOGY.md): Geodesic slerp interpolation, MOLA/LOLA binary raster sampling, datum isolation, and relative relief ($\Delta z$).
- [`TERRAIN_COMPARISON_METHODOLOGY.md`](./TERRAIN_COMPARISON_METHODOLOGY.md): Multi-axis radar normalization, Wentworth regolith scale, hazard classifications, and terramechanics synthesis.
- [`NASA_DATA_CATALOG.md`](./NASA_DATA_CATALOG.md): Complete Phase 3 NASA and ESA dataset catalog across all 13 locations and 12 dimensions.
- [`PHASE4_VISUALIZATION_AUDIT.md`](./PHASE4_VISUALIZATION_AUDIT.md): Milestone A visualization feasibility audit matrix and parameter mappings.

---

## Comprehensive Test Suite

TerraTwin includes automated verification suites for continuous scientific validation:

```bash
# 1. Run Phase 4 Master Scientific Visualization Suite (All 5 milestones)
node scripts/test-phase4-master.mjs

# 2. Run Phase 3 Master Scientific Foundation Suite (All 12 suites)
npm test
```

### Test Suites Included

#### Phase 4 Visualization Suites
1. `scripts/audit-visualization-feasibility.mjs`: Milestone A data availability and resolution feasibility audit.
2. `scripts/test-milestone-b-satellite-layers.mjs`: Milestone B GIBS WMTS endpoints, seasonal presets, and parameter layers.
3. `scripts/test-milestone-c-elevation.mjs`: Milestone C MOLA/LOLA altimetry, Copernicus DEM 90m, and relative relief engine.
4. `scripts/test-milestone-d-terrain.mjs`: Milestone D Recharts radar chart, Wentworth grain size scaling, and synthesis generation.
5. `scripts/test-milestone-e-lineage.mjs`: Milestone E 5-stage scientific evidence lineage and instrument attribution.

#### Phase 3 Foundation Suites
1. `scripts/test-planetary-expansion.mjs`: MER Opportunity attribution fix & lunar exosphere pressure.
2. `scripts/test-earth-analog-expansion.mjs`: Expanded Earth candidates (Lake Salda, Craters of the Moon, Askja, Río Tinto).
3. `scripts/test-ingestion-pipelines.mjs`: NASA POWER API parsing, Horn 3x3 slope gradients, and harmonization validation.
4. `scripts/test-milestone-e-integration.mjs`: Scientific provenance badges, comparability warnings, and portfolio views.
5. `scripts/test-milestone-f-explorer.mjs`: Sources explorer (`/sources`), coverage matrix, and CSV/JSON export engine.
6. `scripts/test-similarity-engine.mjs`: Mathematical similarity engine, zero-handling, and weight constraints.
7. `scripts/test-portfolio-optimizer.mjs`: Combinatorial multi-site optimizer ($C(n, k)$) and synergy gain.
8. `scripts/test-api-endpoints.mjs`: Error handling (400, 404, 503) and validation.
9. `scripts/test-portfolio-api.mjs`: Portfolio API validation.
10. `scripts/test-globe-integration.mjs`: 3D planetary rendering and spherical trigonometry.
11. `scripts/test-map-integration.mjs`: Leaflet GIS coordinate validation and synchronizer.
12. `scripts/test-e2e-suite.mjs`: End-to-end mission reconnaissance flows.

---

## License

This project is licensed under the Apache 2.0 / MIT Open Source License for the **NASA Space Apps Challenge**.
NASA PDS, LOLA, MOLA, REMS, MEDA, and NASA POWER datasets are public domain government scientific assets.
