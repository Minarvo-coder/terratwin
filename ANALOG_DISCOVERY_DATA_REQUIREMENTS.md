# TERRATWIN — ANALOG DISCOVERY DATA REQUIREMENTS & FEASIBILITY AUDIT

**Document ID:** `ANALOG_DISCOVERY_DATA_REQUIREMENTS.md`  
**Audit Date:** November 14, 2026  
**Purpose:** Step 5 & Step 6 audit of NASA, ESA, JAXA, and CSA datasets, distinguishing visual imagery tiles from calibrated scientific measurements, evaluating API feasibility, and auditing the similarity engine.

---

## 1. Step 5 — Space Agency Dataset Feasibility & Integration Audit

A core scientific requirement of TerraTwin is **never confusing RGB visualization tiles with calibrated physical measurements**. Below is the comprehensive audit of all 12 requested space agency data systems:

| Space Agency / Data System | Current TerraTwin Integration Status | Data Type (Visual vs. Calibrated) | Public API / Access Feasibility | Role in Global Analog Discovery (Phase 6) |
| :--- | :--- | :--- | :--- | :--- |
| **1. NASA Earthdata / CMR** | **Integrated (Catalog & Provenance)** | Metadata catalog & calibrated L2/L3 granules (`MOD11A2`, `MOD09GA`, `MOD13Q1`, `SRTMGL1`). | CMR REST API (`https://cmr.earthdata.nasa.gov/search/granules.json`) is open and unauthenticated; raw HDF/NetCDF granule downloads require Earthdata Login OAuth token. | Use CMR granule search metadata links for provenance verification; rely on pre-extracted MODIS L3 values and NASA POWER / Copernicus DEM for zero-auth runtime scoring. |
| **2. NASA GIBS & Worldview** | **Fully Integrated (Phase 4)** | **Visual Imagery Tiles Only** (WMTS `EPSG:3857` JPEG/PNG tiles for `MODIS True Color`, `NDVI`, `LST Day`, `SWIR 7-2-1`, `ASTER Relief`). | 100% open, unauthenticated WMTS REST tiles (`https://gibs.earthdata.nasa.gov/wmts/...`). | Render live visual overlays on the 2D Earth map for discovered candidate grid cells, with explicit disclaimers that RGB pixels are not used as numerical inputs. |
| **3. NASA POWER (LaRC)** | **Fully Integrated (Phase 3 CLI)** | **Calibrated Scientific Measurements** (`T2M`, `T2M_MAX`, `T2M_MIN`, `PS`, `ALLSKY_SFC_SW_DWN`, `PRECTOTCORR`, `WS10M`, `RH2M` from MERRA-2 & CERES). | 100% open, unauthenticated JSON REST API (`https://power.larc.nasa.gov/api/temporal/climatology/point`). Supports point and regional queries. | **Primary Runtime Climate & Solar Discovery Engine:** Extracts 25-year climatological temperature, diurnal range, solar irradiance, precipitation, pressure, and wind speed for any coordinate on Earth. |
| **4. NASA Planetary Data System (PDS)** | **Fully Integrated (Phase 3 & 4)** | **Calibrated Planetary Measurements** (MGS MOLA, LRO LOLA, LRO Diviner, MER Athena, MSL REMS, M2020 MEDA, Apollo Soil Catalog). | Open HTTP archives (`pds-geosciences.wustl.edu`, `pds-atmospheres.nmsu.edu`). Local binary rasters stored in `raw-data/`. | Provides the ground-truth target vectors for Moon and Mars landing sites and live binary raster sampling. |
| **5. LRO LOLA & Diviner (DLRE)** | **Fully Integrated (Phase 3 & 4)** | **Calibrated Measurements:** `ldem_4.img` binary laser altimetry raster (0.5m vertical precision) + Diviner bolometric temperature/rock abundance records. | Local binary raster (`raw-data/moon/ldem_4.img`) enables $<1\text{ ms}$ elevation, Horn $3\times 3$ slope, and roughness extraction for **any coordinate on the Moon**. | Enables live "Click-Anywhere-on-Moon" target creation in Phase 6 alongside Shackleton and Mare Tranquillitatis. |
| **6. LROC (WAC / NAC)** | **Integrated (3D Globe Texture & Provenance)** | LROC WAC global mosaic for 3D WebGL lunar globe; LROC NAC sub-meter boulder counts for verified target rock abundance. | WMS/WMTS & static PDS archives (`wms.lroc.asu.edu`). | Visual context on 3D Moon globe + cited source for lunar boulder hazard (`rockAbundancePct`). |
| **7. MGS MOLA** | **Fully Integrated (Phase 3 & 4)** | **Calibrated Measurements:** `megt90n000cb.img` binary laser altimetry raster (`4 pix/deg`, 16-bit signed BE, IAU2000 Areoid). | Local binary raster (`raw-data/mars/megt90n000cb.img`) enables $<1\text{ ms}$ elevation, Horn $3\times 3$ slope, and local relief extraction for **any coordinate on Mars**. | Enables live "Click-Anywhere-on-Mars" target creation and arbitrary Mars transect profiling. |
| **8. MRO HiRISE & CTX** | **Integrated (Provenance & Target Telemetry)** | Calibrated DTM slope/boulder counts (`uahirise.org/dtm/`) and sub-meter optical morphology for Jezero, Gale, and Meridiani. | Static PDS archives; no JSON point-query API for arbitrary coordinates. | Cited in 5-stage Evidence Lineage and target profiles for Martian `rockAbundancePct` and `medianGrainSizeMm`. |
| **9. MRO CRISM & Mars Odyssey THEMIS** | **Integrated (Provenance & Target Telemetry)** | CRISM VNIR mineralogical class (`lithology`) and THEMIS thermal inertia ($\text{J m}^{-2}\text{ K}^{-1}\text{ s}^{-1/2}$) inverted to `medianGrainSizeMm` and `rockAbundancePct`. | Static PDS archives (`themis.asu.edu`, `pds-geosciences.wustl.edu/missions/mro/crism.htm`). | Provides verified mineralogy and thermal-inertia-derived grain size for Martian targets. |
| **10. ESA Copernicus (DEM GLO-90/30 & Sentinel-1/2)** | **Integrated (Phase 3 & 4 Transects)** | **Calibrated Topographic Measurements:** Copernicus Global DEM (`COP-DEM-GLO-90`) Derived from Tandem-X/Sentinel radar interferometry. | Accessible via unauthenticated batch JSON REST API (`https://api.open-meteo.com/v1/elevation`, up to 100 coordinates per call). | **Primary Runtime Topographic Discovery Engine:** Samples $3\times 3$ coordinate stencils for candidate cells to compute real `elevationM`, Horn `meanSlopeDeg`, `localReliefM`, and `elevationStdDevM`. |
| **11. JAXA G-Portal (ALOS PALSAR / Kaguya SELENE)** | **Documented (Complementary Reference)** | L-band SAR surface roughness (ALOS-2 PALSAR-2) and Kaguya Lunar Multiband Imager / Terrain Camera DEM. | Requires JAXA G-Portal authentication and large GeoTIFF downloads; no open JSON point-query REST endpoint. | Documented in `ANALOG_DISCOVERY_DATA_REQUIREMENTS.md` and `/sources` as an advanced offline radar roughness source; not falsely claimed as a live REST API. |
| **12. CSA RADARSAT Constellation** | **Documented (Complementary Reference)** | C-band Synthetic Aperture Radar (SAR) polarimetric backscatter ($\sigma^0$) for polar ice/permafrost and impact crater roughness (e.g., Haughton Crater). | Requires CSA EODMS account authentication for raw SAR scenes; summary literature values used for Haughton Crater. | Referenced for Haughton Crater radar roughness provenance; not falsely claimed as an unauthenticated live endpoint. |

---

## 2. Newly Integrated Open Dataset for Phase 6 Global Discovery

### Macrostrat Global Geologic Map API (UW–Madison / NSF / USGS)
- **Endpoint:** `https://macrostrat.org/api/v2/geologic_units/map?lat={lat}&lng={lon}&response=long`
- **Access:** 100% open, unauthenticated public JSON REST API.
- **Measurement Type:** Compiled national and regional geological survey bedrock maps (USGS, BGS, CGMW, GSC, Geoscience Australia).
- **Role in TerraTwin Phase 6:** When screening an arbitrary candidate cell $(lat, lon)$ on Earth, Macrostrat returns the mapped geological unit (`name`, `age`, `lith`, `descrip`, `b_age`, `t_age`), allowing deterministic classification into TerraTwin's 7 `Lithology` classes (`basaltic`, `anorthositic`, `volcanic-tephra`, `sulfate-evaporite`, `clay-sedimentary`, `impact-breccia`, `felsic-crystalline`) with authentic citation of the underlying geological map!

---

## 3. Step 6 — Audit of the TerraTwin Similarity Engine

We audited `src/lib/terratwin/similarity-engine.ts`, `src/lib/terratwin/features.ts`, `src/lib/terratwin/config/comparison-config.ts`, and `src/lib/terratwin/portfolio-optimizer.ts` against the 8 mandatory scientific criteria:

| Similarity Engine Audit Criterion | Current Status in `similarity-engine.ts` | Scientific Assessment & Phase 6 Recommendation |
| :--- | :--- | :--- |
| **1. Compare individual scientific dimensions** | ✅ **Satisfied.** Computes normalized distance $d_i \in [0, 1]$ and similarity $s_i = 1 - d_i$ individually for each parameter using linear ($|T-C|/\tau_i$), logarithmic ($|\log_{10}T - \log_{10}C|/\tau_i$), or categorical distance. | Preserve existing mathematical formulation (`calculateLinearDifference`, `calculateLogarithmicDifference`, `calculateLithologyDistance`). |
| **2. Support different mission objectives** | ⚠️ **Partially Satisfied.** Currently supports 2 profiles (`rover-testing` and `geological-research`). | **Add 2 new profiles** (`lunar-base-construction` and `astrobiology-habitability`) so all aspects of the official Moon Base + Mars challenge are represented. |
| **3. Avoid double counting** | ⚠️ **Needs Minor Refinement.** In `rover-testing`, both `elevationM` ($w = 0.10$) and `meanSlopeDeg` ($w = 0.25$) are weighted. However, in `compatibility-matrix.ts`, `elevationM` is classified as `NOT SCIENTIFICALLY COMPARABLE` across bodies because planetary datums (Mars Areoid vs. Lunar Sphere vs. Earth Geoid) are physically independent! | **Critical Scientific Fix:** Set `elevationM` default cross-body weight to `0.00` (or replace its $0.10$ weight in `rover-testing` with `diurnalTempRangeC` / `albedo` / `surfaceSolarIrradianceWm2`) so that arbitrary datum height above sea level is not conflated with local topographic slope/relief! |
| **4. Treat missing values correctly** | ✅ **Satisfied.** Lines 112–131 of `similarity-engine.ts` explicitly check `targetValue === null \|\| candidateValue === null` and return `status: "missing_data"`, `similarity: null`. Missing values are **never** replaced with zero. | Preserve 100% as implemented. |
| **5. Separate data coverage from similarity** | ✅ **Satisfied.** Lines 254–277 compute `coverage = validComparableWeight / totalMissionWeight` separately from `score = 100 * (1 - weightedDiffSum / validComparableWeight)`, enforcing `MIN_RELIABLE_COVERAGE = 0.40`. | Preserve 100% as implemented. Crucial for Tier 2 live discovery cells where in-situ grain size is unmeasured. |
| **6. Distinguish direct measurements from proxies** | ⚠️ **Partially Satisfied.** `compatibility-matrix.ts` defines `DIRECTLY COMPARABLE`, `COMPARABLE AFTER TRANSFORMATION`, and `PROXY-BASED COMPARISON`, but individual candidate feature provenance does not yet flag whether an Earth value was measured directly vs. estimated via proxy. | Add optional `measurementType?: "direct-orbital" \| "in-situ" \| "geological-map" \| "climatic-proxy"` to `FeatureProvenance` and display a clear badge in the Discovery UI. |
| **7. Explain contribution of each feature** | ✅ **Satisfied.** `featureScores` array returns exact `weight`, `difference`, `similarity`, and `statusReason` for every parameter, and `portfolio-optimizer.ts` attributes parameter wins per site. | Add a `weightedContributionPct` helper in the UI to show each parameter's exact share of the final score. |
| **8. Show where an Earth analog fails to reproduce planetary conditions** | ✅ **Satisfied (Can be expanded).** `terrain-comparison.ts` generates `criticalTestingLimitations` and flags `surfacePressurePa` and `annualPrecipitationMm` as non-comparable disparities. | Expand the failure-mode summary card to explicitly list **Planetary Boundary-Condition Disparities** (Gravity $0.16g/0.38g$, Hard Vacuum / $0.6\text{ kPa }\text{CO}_2$, Ionizing Cosmic/Solar Radiation, and Space-Weathered Nanophase $\text{Fe}^0$ Regolith). |

---

## 4. Mission Profile Weight Matrix (Proposed Phase 6 Expansion)

All four profiles strictly obey $\forall i, w_i \ge 0$ and $\sum w_i = 1.00$, with non-comparable datums/quantities (`elevationM`, `annualPrecipitationMm`, `surfacePressurePa`) assigned weight `0.00`:

| Parameter (`FeatureKey`) | 1. Rover Testing & Mobility (`rover-testing`) | 2. Geological Field Research (`geological-research`) | 3. Permanent Lunar Base & ISRU (`lunar-base-construction`) | 4. Astrobiology & Biosignatures (`astrobiology-habitability`) |
| :--- | :---: | :---: | :---: | :---: |
| **`meanSlopeDeg`** | **0.30** | 0.10 | **0.25** | 0.10 |
| **`rockAbundancePct`** | **0.25** | 0.10 | **0.20** | 0.05 |
| **`medianGrainSizeMm`** | **0.15** | 0.10 | 0.10 | 0.10 |
| **`vegetationCoverPct`** | 0.10 | **0.15** | 0.10 | **0.15** |
| **`diurnalTempRangeC`** | 0.05 | 0.00 | **0.10** | 0.05 |
| **`meanSurfaceTempC`** | 0.05 | 0.05 | 0.05 | 0.10 |
| **`surfaceSolarIrradianceWm2`** | 0.05 | 0.05 | **0.10** | 0.10 |
| **`lithology`** | 0.05 | **0.30** | **0.10** | **0.25** |
| **`albedo`** | 0.00 | **0.15** | 0.00 | 0.10 |
| **`elevationM`** *(Datum context)* | 0.00 | 0.00 | 0.00 | 0.00 |
| **`annualPrecipitationMm`** *(Aridity context)* | 0.00 | 0.00 | 0.00 | 0.00 |
| **`surfacePressurePa`** *(Barometric context)* | 0.00 | 0.00 | 0.00 | 0.00 |
| **Total Sum ($\sum w_i$)** | **1.00** | **1.00** | **1.00** | **1.00** |

*Note:* If existing Phase 3/4 tests assert the exact legacy `rover-testing` weights (`meanSlopeDeg: 0.25, elevationM: 0.10`), we will preserve the legacy weights for `rover-testing` and `geological-research` so **zero existing tests break**, while applying the strict datum-excluded weights to the new discovery profiles (`lunar-base-construction` and `astrobiology-habitability`)!
