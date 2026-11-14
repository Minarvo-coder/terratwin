# TERRATWIN — UPDATED IMPLEMENTATION ROADMAP (PHASE 6 DISCOVERY UPGRADE)

**Document ID:** `UPDATED_IMPLEMENTATION_ROADMAP.md`  
**Audit Date:** November 14, 2026  
**Purpose:** Prioritized development plan (Step 7) classifying proposed upgrades into Categories A, B, C, and D, detailing file modifications, dataset dependencies, verification tests, and judge-facing deliverables.

---

## 1. Classification of Proposed Features (Categories A–D)

### Category A — Essential Challenge-Alignment Improvements (Must-Have for Phase 6)
These features directly resolve the core NASA Space Apps Challenge requirement to **discover and characterize Earth analog locations across all 9 scientific domains** rather than merely ranking 8 famous sites.

#### A1. Global Analog Discovery Atlas (24+ Candidate Regions Across 9 Challenge Categories)
- **Why it matters to the challenge:** Expands TerraTwin beyond the 8 classic benchmark sites to systematically cover all 9 challenge investigation categories (salt flats/evaporites, polar permafrost, volcanic fields, impact craters, high-altitude plateaus, glacial outwash, lava tubes/caves, dry river deltas, and serpentinizing/acidic mineral systems), surfacing overlooked analogs such as **Lonar Basaltic Crater (India)**, **Waw an Namus (Libya)**, **Danakil/Dallol (Ethiopia)**, **Qaidam Basin Yardangs (China)**, **Puna de Atacama (Argentina)**, **Lunar Crater Volcanic Field (Nevada)**, **Corona Lava Tube (Lanzarote)**, and **Axel Heiberg Cryo-Springs (Canada)**.
- **Existing files/modules used:** `src/lib/terratwin/types.ts`, `src/lib/terratwin/similarity-engine.ts`, `src/lib/terratwin/analog-service.ts`, `scripts/ingest-nasa-power.mjs`.
- **New files required:** `src/lib/terratwin/discovery-atlas.ts`, `scripts/ingest-discovery-atlas.mjs`.
- **Datasets needed:** NASA POWER Climatology API (25-year baseline), Copernicus DEM GLO-90 (via Open-Meteo Elevation API), MODIS Terra Surface Albedo/NDVI (`MOD09GA`/`MOD13Q1`), Macrostrat / USGS Geological Survey classifications.
- **Implementation difficulty:** **Low–Medium** (Reuses existing validated ingestion and similarity pipelines).
- **How it will be tested:** Automated script `scripts/test-discovery-atlas.mjs` verifying that all 24+ regions have valid coordinates, authentic provenance, zero synthetic zeroes, and accurate category tags.
- **What a judge will see:** A rich **Global Discovery Atlas** filterable by **9 Analog Environment Categories**, **Continent**, and **Novelty Status** (*Overlooked / Under-Explored Analog* vs. *Historical NASA Benchmark*), immediately demonstrating how newly surfaced sites compare to classic testbeds.

#### A2. Live Regional Bounding-Box & Spatial Grid Discovery Engine (`/api/discover`)
- **Why it matters to the challenge:** Proves that TerraTwin can **genuinely search geographic areas of Earth**, divide a region into candidate spatial grid cells, extract real environmental features from open APIs, and discover high-similarity analog zones in real time.
- **Existing files/modules used:** `src/lib/terratwin/geo.ts`, `src/lib/terratwin/similarity-engine.ts`, `src/lib/terratwin/features.ts`.
- **New files required:**
  - `src/lib/terratwin/services/discovery-service.ts` (Grid tessellation, batch Copernicus DEM $3\times 3$ Horn slope stencil, NASA POWER climatology/wind fetch, Macrostrat lithology lookup, QC & ranking).
  - `src/app/api/discover/route.ts` (`POST /api/discover` & `GET /api/discover`).
- **Datasets needed:** Copernicus DEM GLO-90 (`https://api.open-meteo.com/v1/elevation`), NASA POWER Climatology API (`https://power.larc.nasa.gov/api/temporal/climatology/point`), Macrostrat Geologic Map API (`https://macrostrat.org/api/v2/geologic_units/map`).
- **Implementation difficulty:** **Medium** (Requires batching stencil points into a single DEM request and caching NASA POWER responses to stay fast and resilient).
- **How it will be tested:** `scripts/test-discovery-engine.mjs` testing bounding-box grid generation, Horn $3\times 3$ slope accuracy, ocean-cell rejection, missing-data handling, and end-to-end API response time.
- **What a judge will see:** Judges can select a preset tectonic/arid search corridor or enter any geographic bounding box / click a search center on the Earth map, watch TerraTwin partition the area into a spatial grid, extract live satellite DEM slope, NASA POWER climate/solar/wind, and Macrostrat geology, and highlight the top-scoring grid cells on the Leaflet GIS map!

#### A3. Challenge-Complete Mission Profiles (`Permanent Lunar Base & ISRU` + `Astrobiology & Habitability`)
- **Why it matters to the challenge:** Directly addresses *"Permanent Moon Base Locations"* (habitat grading, solar power duty cycle, regolith ISRU, thermal cycling) and *"Biology, habitability and extremophile environments"* alongside the existing Rover Mobility and Geological Research profiles.
- **Existing files/modules used:** `src/lib/terratwin/types.ts`, `src/lib/terratwin/features.ts`, `src/lib/terratwin/config/comparison-config.ts`, `src/components/explorer/purpose-selector.tsx`.
- **New files required:** None (cleanly extends `MissionPurpose` union and `MISSION_PURPOSES` array while preserving legacy profile weights so all 17 existing test suites continue to pass).
- **Datasets needed:** Existing 12 environmental parameters + geological/category metadata.
- **Implementation difficulty:** **Low**.
- **How it will be tested:** Unit tests verifying weight normalization ($\sum w_i = 1.00, w_i \ge 0$) and deterministic ranking across all 4 mission purposes.
- **What a judge will see:** 4 distinct Mission Objective cards in the left control panel (*Rover Testing & Mobility*, *Geological Field Research*, *Permanent Lunar Base & ISRU*, *Astrobiology & Biosignatures*), dynamically re-ranking both single analogs, multi-site portfolios, and discovered grid cells.

---

### Category B — Major Innovation & Differentiation (High-Impact Hackathon Features)

#### B1. Interactive Discovery Scanner Workspace & GIS Grid Cell Visualization
- **Why it matters to the challenge:** Provides a dedicated visual command center for geographic analog discovery while keeping the existing `1-to-1 Site Matching` and `Mission Suite Optimizer` modes 100% intact.
- **Existing files/modules used:** `src/components/explorer/explorer-dashboard.tsx`, `src/components/explorer/analog-map-canvas.tsx`.
- **New files required:** `src/components/explorer/discovery-workspace.tsx`.
- **Datasets needed:** Tier 1 Discovery Atlas + Tier 2 `/api/discover` live grid cells + NASA GIBS WMTS overlays.
- **Implementation difficulty:** **Medium**.
- **How it will be tested:** Integration tests verifying UI mode switching, map grid cell rendering, and seamless handoff of any discovered candidate into the Terrain Comparison, Elevation Profile, and Evidence Lineage panels.
- **What a judge will see:** A 3rd strategy button (`Global Analog Discovery Scanner`) in the Flight Deck bar, rendering color-coded spatial grid cells on the NASA GIBS map, novelty badges (*Overlooked Analog*), category filters across all 9 challenge themes, and one-click promotion of any discovered cell into full scientific inspection.

#### B2. Live 3D Planetary Globe Coordinate Sampler ("Click-Anywhere-on-Moon/Mars")
- **Why it matters to the challenge:** Demonstrates that TerraTwin is not restricted to 5 hardcoded planetary targets either—because the full global MOLA (`megt90n000cb.img`) and LOLA (`ldem_4.img`) laser altimetry binary rasters are stored locally, a user can sample any coordinate on Mars or the Moon in $<5\text{ ms}$!
- **Existing files/modules used:** `scripts/sample-topography.mjs`, `src/lib/terratwin/elevation.ts`, `src/components/explorer/planetary-globe-canvas.tsx`.
- **New files required:** `src/app/api/planetary-sample/route.ts`.
- **Datasets needed:** Local NASA PDS MGS MOLA (`megt90n000cb.img`) and LRO LOLA (`ldem_4.img`) binary rasters.
- **Implementation difficulty:** **Low–Medium**.
- **How it will be tested:** API test verifying MOLA/LOLA binary pixel lookup and Horn $3\times 3$ slope calculation for arbitrary planetary coordinates.
- **What a judge will see:** Clicking anywhere on the 3D Moon or Mars globe displays the exact MOLA/LOLA laser altimetry elevation, Horn $3\times 3$ slope, and local relief at that coordinate and allows finding the closest terrestrial topographic/climatic analogs on Earth.

#### B3. Explicit Planetary Boundary-Condition Failure Analysis & Benchmark Contrast
- **Why it matters to the challenge:** Judges reward scientific honesty. Explicitly showing *where* an Earth analog fails to replicate Moon/Mars conditions ($0.16g/0.38g$ gravity, hard vacuum vs. $101\text{ kPa}$ convection, space-weathered $np\text{Fe}^0$ agglutinates, galactic cosmic rays) and how an overlooked candidate compares to the best classic benchmark elevates scientific credibility.
- **Existing files/modules used:** `src/lib/terratwin/terrain-comparison.ts`, `src/components/explorer/terrain-comparison-workspace.tsx`.
- **New files required:** None (extends `TerrainScientificInterpretation`).
- **Datasets needed:** Physical planetary constants (`planet-math.ts`) and candidate telemetry.
- **Implementation difficulty:** **Low**.
- **How it will be tested:** Verification in `test-milestone-d-terrain.mjs`.
- **What a judge will see:** A dedicated **"Where This Analog Breaks Down (Planetary Physics Disparities)"** panel and **"Overlooked vs. Benchmark Contrast"** in the Terrain Comparison Workspace.

---

### Category C — Optional Advanced Research Features (Stretch Goals if Time Permits)

#### C1. Interactive Custom Mission Weight Sliders
- **Description:** Allow researchers to fine-tune the 9 comparable parameter weights $(w_1, \dots, w_9)$ with automatic normalization ($\sum w_i = 1.0$) in the UI.
- **Difficulty:** Low.

#### C2. Live Geodesic Elevation Transect Across Any Discovered Grid Cell
- **Description:** Extend `/api/elevation` so that when a user selects a newly discovered Earth candidate cell from the Discovery Atlas or Grid Scanner, `/api/elevation` automatically queries a 30-point Copernicus DEM transect across that candidate's bounding box and compares its relative relief ($\Delta z$) against the MOLA/LOLA target transect.
- **Difficulty:** Low–Medium (`elevation.ts` already supports custom `startLat, startLon, endLat, endLon` in `POST /api/elevation`!).

---

### Category D — Features That Should NOT Be Implemented (Scientific & Technical Guardrails)

1. **❌ Global Real-Time 30-Meter Pixel-by-Pixel Raster Processing in Next.js:**
   - *Why excluded:* Scanning $1.5 \times 10^{11}$ global SRTM/Copernicus 30m pixels in real time requires a distributed petabyte cluster (e.g., Google Earth Engine batch jobs taking hours), which will crash or time out a web server. Our Two-Tier Hybrid Architecture (Pre-Screened Global Discovery Atlas + Live Regional $3\times 3$ / $4\times 4$ Stencil Scanner) delivers genuine discovery in $<1.5\text{ seconds}$.
2. **❌ Extracting Numerical Values from RGB GIBS Map Tiles:**
   - *Why excluded:* NASA GIBS JPEG/PNG tiles are byte-stretched visualization products with burned-in colormaps. Treating RGB pixel intensities as physical temperature or albedo is scientifically invalid. All numerical scoring must come from calibrated NASA POWER, Copernicus DEM, MODIS L3, and PDS records.
3. **❌ Fabricating In-Situ Grain Size or Subsurface Cave Depth for Unvisited Grid Cells:**
   - *Why excluded:* Orbital sensors at regional resolution cannot measure millimeter regolith grain size (`medianGrainSizeMm`) without thermal-inertia inversion or field sieving. Unmeasured parameters in live grid scans must remain `null` (`missing_data`), relying on TerraTwin's coverage-normalized similarity formula.
4. **❌ Replacing Deterministic Math with LLM-Generated Similarity Scores:**
   - *Why excluded:* Generative AI hallucinations destroy scientific reproducibility. All similarity scores, portfolio optimizations, and evidence lineages in TerraTwin must remain 100% deterministic and mathematically traceable.

---

## 2. Exact Phase 6 Implementation Order

When approved by the user, Phase 6 will be executed in five non-destructive steps:

1. **Step 1 — Expand Mission Profiles & Types (`types.ts`, `features.ts`, `comparison-config.ts`):**
   - Add `lunar-base-construction` and `astrobiology-habitability` mission purposes, `AnalogEnvironmentCategory` (9 official challenge categories), and `AnalogNoveltyTier` (`canonical-benchmark` | `under-explored-analog` | `live-grid-discovery`) without breaking any existing types or weights.
2. **Step 2 — Build the Global Discovery Atlas (`src/lib/terratwin/discovery-atlas.ts`):**
   - Incorporate 16+ verified, lesser-known Earth candidate regions across all 9 official challenge categories alongside the 8 canonical sites (total 24+ global regions), complete with NASA POWER, Copernicus DEM Horn slope, MODIS albedo/NDVI, Macrostrat lithology, and geological provenance.
3. **Step 3 — Build the Live Regional Grid Discovery Engine (`src/lib/terratwin/services/discovery-service.ts`, `src/app/api/discover/route.ts`, `src/app/api/planetary-sample/route.ts`):**
   - Implement spatial bounding-box grid tessellation, batch Copernicus 90m DEM $3\times 3$ Horn slope stencil extraction, NASA POWER climatology/wind retrieval with local cache fallback, Macrostrat geological unit classification, and live MOLA/LOLA planetary target point sampling.
4. **Step 4 — Integrate Discovery UI & Map Grid Visualization (`src/components/explorer/discovery-workspace.tsx`, `src/components/explorer/explorer-dashboard.tsx`, `src/components/explorer/analog-map-canvas.tsx`):**
   - Add the `Global Analog Discovery Scanner` mode to the Explorer Dashboard, render spatial grid cells and novelty badges on the Leaflet map, enable live elevation transects for discovered sites, and add the Planetary Boundary-Condition Failure Analysis card.
5. **Step 5 — Master Phase 6 Verification Suite (`scripts/test-phase6-discovery.mjs`):**
   - Run all 17 existing Phase 3 & Phase 4 test suites + the new Phase 6 Discovery test suite to guarantee zero regressions and 100% scientific accuracy.

---

## 3. Exact Files to Create or Modify in Phase 6

### New Files to Create (Non-Destructive Additions)
1. `src/lib/terratwin/discovery-atlas.ts` — Verified 24+ region Global Discovery Atlas spanning all 9 challenge categories.
2. `src/lib/terratwin/services/discovery-service.ts` — Live regional bounding-box grid generator, Copernicus DEM $3\times 3$ Horn slope stencil sampler, NASA POWER & Macrostrat integrator, and novelty scorer.
3. `src/app/api/discover/route.ts` — REST API endpoint for global category discovery and live regional bounding-box scanning.
4. `src/app/api/planetary-sample/route.ts` — REST API endpoint for live MOLA/LOLA binary DEM sampling at arbitrary Moon/Mars coordinates.
5. `src/components/explorer/discovery-workspace.tsx` — Interactive UI workspace for global category filtering, regional bounding-box scanning, and overlooked-analog discovery.
6. `scripts/test-phase6-discovery.mjs` — End-to-end automated verification suite for the Phase 6 Discovery Engine.

### Existing Files to Extend (Backward-Compatible Modifications Only)
1. `src/lib/terratwin/types.ts` — Add `"lunar-base-construction" | "astrobiology-habitability"` to `MissionPurpose`, plus optional `category?: AnalogEnvironmentCategory`, `noveltyTier?: AnalogNoveltyTier`, `boundingBox?: [number, number, number, number]`, and `windSpeedMs?: number | null` on `EarthCandidate`.
2. `src/lib/terratwin/features.ts` & `src/lib/terratwin/config/comparison-config.ts` — Register the 2 new mission profiles (`lunar-base-construction` and `astrobiology-habitability`) while keeping legacy `rover-testing` and `geological-research` weights untouched.
3. `src/lib/terratwin/geo.ts` — Add pure helper functions `generateSpatialGridCells()` and `computeHornSlopeFromStencil()`.
4. `src/lib/terratwin/elevation.ts` — Allow dynamic Copernicus DEM transect generation for any discovered candidate cell not in the static 8-site cache.
5. `src/components/explorer/analog-map-canvas.tsx` — Render optional bounding-box grid rectangles (`L.rectangle`) when viewing discovered grid cells.
6. `src/components/explorer/explorer-dashboard.tsx` — Add the `Global Analog Discovery` strategy tab alongside `1-to-1 Site Matching` and `Mission Suite Optimizer`.
