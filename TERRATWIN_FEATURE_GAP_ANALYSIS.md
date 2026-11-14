# TERRATWIN — FEATURE GAP ANALYSIS (PHASE 5 AUDIT)

**Document ID:** `TERRATWIN_FEATURE_GAP_ANALYSIS.md`  
**Audit Date:** November 14, 2026  
**Purpose:** Detailed technical and scientific gap analysis comparing the existing TerraTwin implementation (Phases 1–4) against the official NASA Space Apps Challenge requirements.

---

## 1. Capability Matrix: Existing System vs. Official Challenge Requirements

| Capability Requirement | Existing Phase 1–4 Implementation | Gap Severity | Technical Root Cause | Required Phase 6 Solution |
| :--- | :--- | :--- | :--- | :--- |
| **Search across large areas of Earth** | ❌ **Not Supported.** Only loads 8 static rows from `public.locations` (`location_role = 'candidate'`). | **CRITICAL** | `analog-service.ts` and `planetary-repository.ts` only query pre-seeded point locations rather than spatial bounding boxes or discovery grids. | Build `src/lib/terratwin/discovery-engine.ts` and `/api/discover` supporting regional bounding-box grid generation and global discovery atlas screening. |
| **Divide geographic areas into candidate regions** | ❌ **Not Supported.** Candidates are single point coordinates `(lat, lon)` without spatial cell bounds or regional tessellation. | **CRITICAL** | No spatial gridding or bounding-box tessellation utility exists in `src/lib/terratwin/geo.ts`. | Add geodesic grid tessellation (`generateCandidateGridCells()`) in `geo.ts` that divides a regional search box into $N \times M$ candidate cells with $3\times 3$ DEM sampling stencils. |
| **Extract environmental features from real datasets for new regions** | ⚠️ **Partial (CLI Only).** `ingest-nasa-power.mjs` and `generate-earth-transects.mjs` only iterate over the hardcoded 8-site `EARTH_ANALOG_REGISTRY`. | **CRITICAL** | Feature extraction logic is locked inside CLI scripts (`scripts/*.mjs`) instead of a reusable runtime TypeScript service. | Promote Copernicus DEM $3\times 3$ Horn slope sampling, NASA POWER point/regional retrieval, and Macrostrat lithology lookup into a runtime service (`src/lib/terratwin/services/discovery-service.ts`). |
| **Screen candidate regions against Moon/Mars targets** | ⚠️ **Fixed Catalog Only.** Screens the 8 fixed sites against 5 fixed targets. Cannot screen newly generated grid cells or custom planetary coordinates. | **HIGH** | `findAnalogs()` only accepts `targetId` from the 5-target list and compares against the 8-site array. | Allow `computeAnalogSimilarity()` to evaluate dynamically extracted `DiscoveredCandidateCell` objects and custom `(body, lat, lon)` MOLA/LOLA target points. |
| **Identify previously overlooked analog environments** | ❌ **Not Supported.** All 8 current sites (Atacama, McMurdo, Haughton, Mauna Kea, Salda, Craters of the Moon, Askja, Río Tinto) are famous benchmark sites. | **CRITICAL** | No novelty metric or expanded screening dataset exists to highlight lesser-known geological formations with high physical similarity. | Add a **Novelty / Overlooked Analog Score** (geodesic distance & literature-rarity classification relative to famous benchmark analogs) and expand the pre-screened global discovery grid across 9 under-studied geomorphological categories. |
| **Rank candidates using multiple scientific dimensions** | ✅ **Supported (2 Profiles).** Ranks using 10 comparable parameters across `rover-testing` and `geological-research`. | **MODERATE** | Missing dedicated profiles for **Permanent Lunar Base / ISRU Construction** and **Astrobiology / Extremophile Habitability**, and lacks interactive weight customization in the UI. | Add `lunar-base-construction` and `astrobiology-habitability` profiles to `features.ts` and `comparison-config.ts`, plus optional user weight sliders. |
| **Explain strengths and weaknesses of each candidate** | ✅ **Supported.** `terrain-comparison.ts` and `portfolio-optimizer.ts` deterministically generate strengths, limitations, and parameter-level divergence. | **LOW** | Explanations do not yet explicitly contrast why a newly discovered/overlooked site outperforms or complements a famous benchmark site (e.g., Lonar Crater vs. Haughton Crater). | Enhance `generateScientificInterpretation()` to include benchmark comparison and planetary physics failure modes (gravity, radiation, vacuum, cryogenics). |
| **Show underlying scientific evidence** | ✅ **Supported.** `scientific-evidence-explorer.tsx` displays 5-stage provenance lineage with instrument metadata and archive URLs. | **LOW** | Dynamic discovery cells need clear provenance badges distinguishing **Direct Orbital Measurement** (DEM slope, NASA POWER temp/solar) from **Proxy / Inferred Estimates** (Macrostrat lithology, aridity-derived rock/vegetation proxies). | Extend `FeatureProvenance` with `measurementMethod: "direct" \| "proxy" \| "in-situ"` so dynamically screened cells maintain 100% scientific transparency. |

---

## 2. Detailed Scientific & Parameter Gaps

### Gap 1: Missing "Permanent Moon Base" Operational Criteria
The official challenge title is *"Identify Earth Locations that Analog the **Permanent Moon Base Locations** and Mars"*.
- **Current State:** TerraTwin has two Moon targets (`Shackleton Crater Rim` at $89.9^\circ\text{S}$ and `Mare Tranquillitatis` at $0.67^\circ\text{N}$), but the only mission purposes are `Rover testing & trafficability` and `Geological field research`.
- **Scientific Problem:** Siting and preparing for a **Permanent Lunar Base** (such as Artemis Base Camp at the Lunar South Pole or a Mare lava-tube habitat) has fundamentally different priorities than a mobile rover traverse:
  - Requires **low regional slope ($<5^\circ$)** for lander touchdown stability and habitat module leveling.
  - Prioritizes **solar irradiance illumination (`surfaceSolarIrradianceWm2`)** and **thermal cycling resilience (`diurnalTempRangeC`)** for power generation and radiator rejection.
  - Prioritizes **anorthositic or basaltic regolith (`lithology` & `medianGrainSizeMm`)** for In-Situ Resource Utilization (ISRU oxygen extraction via ilmenite/regolith reduction and 3D regolith sintering for radiation shielding).
  - Requires **low boulder hazard (`rockAbundancePct`)** for landing pad clearing.

### Gap 2: Aeolian / Wind & Surface Process Telemetry
- **Current State:** The official challenge requires investigating *"Dust, wind, erosion and surface processes."* Currently, TerraTwin has zero wind or aeolian parameters.
- **Technical Opportunity:** Our existing `scripts/ingest-nasa-power.mjs` pipeline queries `https://power.larc.nasa.gov/api/temporal/climatology/point`. NASA POWER natively provides **`WS10M`** (10-meter wind speed in $\text{m/s}$) and **`RH2M`** (2-meter relative humidity in $\%$) in the exact same API call at zero extra latency!
- **Scientific Value:** Adding `meanWindSpeedMs` (or displaying it in the environmental profile and discovery screening) directly quantifies aeolian sand transport potential and dust-loading stress on Mars/Lunar surface hardware.

### Gap 3: Distinction Between Direct Measurements and Proxies During Global Screening
When screening arbitrary candidate cells across Earth using open global datasets:
- **Directly Measurable Everywhere on Earth (100% Global Coverage):**
  1. `elevationM` — Copernicus GLO-90 / SRTMGL1 (90m / 30m).
  2. `meanSlopeDeg` — Derived via Horn (1981) $3\times 3$ finite-difference kernel on Copernicus DEM.
  3. `localReliefM` & `terrainRoughnessM` — Derived from $3\times 3$ DEM window standard deviation.
  4. `meanSurfaceTempC` — NASA POWER 25-year climatology (`T2M` / `TS`).
  5. `diurnalTempRangeC` — NASA POWER (`T2M_MAX - T2M_MIN`).
  6. `surfaceSolarIrradianceWm2` — NASA POWER (`ALLSKY_SFC_SW_DWN`).
  7. `annualPrecipitationMm` — NASA POWER (`PRECTOTCORR`).
  8. `surfacePressurePa` — NASA POWER (`PS`).
- **Geologically Mapped via Open API:**
  9. `lithology` — Macrostrat Global Geologic Map API (`/api/v2/geologic_units/map?lat=...&lng=...`) returns bedrock lithology strings (`basalt`, `evaporite`, `shale`, `sandstone`, `gneiss`, `impact`, etc.) which map deterministically to TerraTwin's 7 `Lithology` classes.
- **Requires In-Situ Field Sampling or Remote-Sensing Proxy:**
  10. `medianGrainSizeMm` — Cannot be directly measured from space at millimeter accuracy without thermal inertia inversion or field sieving. In global discovery mode, unless in-situ data exists, it must either be marked `missing_data` (handled gracefully by TerraTwin's coverage-weighted formula!) or flagged explicitly as a `PROXY_BASED` geomorphological estimate excluded from strict verified scoring.
  11. `rockAbundancePct` — Can be approximated via topographic roughness proxy (`elevationStdDevM` / slope steepness) or left `null` (`missing_data`) for unvisited grid cells so that TerraTwin's `coverage` metric honestly reflects that only orbital parameters were evaluated!

> **Key Architectural Insight:** Because TerraTwin's `similarity-engine.ts` already separates **Similarity Score ($S$)** from **Data Coverage ($C = \sum w_{\text{valid}} / \sum w_{\text{total}}$)** with a minimum $40\%$ reliability threshold (`MIN_RELIABLE_COVERAGE = 0.40`), a newly screened Earth grid cell that has verified DEM slope, elevation, NASA POWER temperature, diurnal range, solar irradiance, vegetation cover, and Macrostrat lithology immediately achieves **$65\%\text{–}85\%$ verified mission weight coverage** without fabricating `medianGrainSizeMm` or `rockAbundancePct`!

---

## 3. Summary of Missing Modules to Build in Phase 6

1. **Global Discovery Atlas (`src/lib/terratwin/discovery-atlas.ts`)**:
   - Pre-screened, verified dataset of **24+ Earth candidate regions** spanning all 9 official challenge analog categories (including 16+ lesser-known / overlooked sites alongside the 8 canonical benchmarks), complete with novelty scores and category tags.
2. **Live Regional Grid Scanner (`src/lib/terratwin/services/discovery-service.ts` & `src/app/api/discover/route.ts`)**:
   - Accepts a geographic bounding box or center coordinate + radius, generates a candidate spatial grid, batch-extracts real Copernicus 90m DEM $3\times 3$ slope/roughness + NASA POWER climatology + Macrostrat bedrock lithology, and ranks candidate cells against any Moon/Mars target.
3. **Custom Planetary Target Sampler (`src/app/api/planetary-sample/route.ts`)**:
   - Samples any `(body, latitude, longitude)` clicked on the 3D Moon/Mars globe directly from `raw-data/mars/megt90n000cb.img` (MOLA) and `raw-data/moon/ldem_4.img` (LOLA).
4. **Discovery UI Workspace (`src/components/explorer/discovery-workspace.tsx`)**:
   - Integrates seamlessly as a 3rd top-level strategy tab in `ExplorerDashboard` (`1-to-1 Site Matching` | `Mission Suite Optimizer` | `Global Analog Discovery Scanner`) without altering or breaking Phases 1–4.
