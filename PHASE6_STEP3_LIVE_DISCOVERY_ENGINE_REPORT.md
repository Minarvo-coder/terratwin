# TERRATWIN — PHASE 6, STEP 3 REPORT
## LIVE REGIONAL ANALOG DISCOVERY ENGINE IMPLEMENTATION & SCIENTIFIC AUDIT

**Date**: November 14, 2026  
**Milestone**: Phase 6, Step 3 (Live Regional Analog Discovery Engine)  
**Status**: Completed & Verified  

---

## 1. ARCHITECTURE OVERVIEW

Phase 6.3 delivers TerraTwin's **Live Regional Analog Discovery Engine**, transforming the application from a static catalog browser into an exploratory screening platform capable of analyzing arbitrary geographic regions on Earth.

### Core Architecture Components:
1. **Request Validation & Spatial Guardrails (`grid-generator.ts`)**:
   - Accepts WGS84 bounding box `[minLatitude, minLongitude, maxLatitude, maxLongitude]`.
   - Strictly enforces bounds: $-90^\circ \le \text{lat} \le 90^\circ$, $-180^\circ \le \text{lon} \le 180^\circ$.
   - Enforces regional search area limits: maximum $10.0^\circ$ latitude $\times 10.0^\circ$ longitude span.
   - Rejects antimeridian crossings ($\text{minLon} > \text{maxLon}$) with scientific guidance to divide requests into two sub-regions.
   - Enforces configurable server-side capacity limits: user `maxCells` parameter capped at server hard ceiling of $100$ cells.
2. **Deterministic Grid Generation**:
   - Generates stable, non-overlapping grid cells with predictable IDs: `cell_+{lat.toFixed(4)}_{lon.toFixed(4)}` (hardened in Phase 6.3.1 from `.toFixed(3)` with integer stepping).
   - Associates each cell with its individual sub-bounding box and centroid coordinates.
3. **Multi-Source Environmental Data Connectors**:
   - **Open-Meteo Elevation / Copernicus DEM GLO-90**: Retrieves elevation and derives local topographic slope via a 5-point central-difference gradient across $\Delta = 0.002^\circ$ (~445 m N-S baseline; corrected in Phase 6.3.1 from mislabeled "Horn stencil").
   - **NASA POWER Climatology API**: Retrieves 25-year native climatological means for 2 m air temperature (`T2M`), diurnal thermal range (`TS_RANGE`), all-sky surface solar irradiance (`ALLSKY_SFC_SW_DWN`), and 10 m wind speed (`WS10M`).
   - **Macrostrat Geological Map API**: Queries regional geological map units and maps rock types to standardized project lithologies.
4. **Data Normalization & Provenance Preservation (`discovery-engine.ts`)**:
   - Populates typed `EarthCandidate` records with `noveltyTier: "live-grid-discovery"` and `isVerified: false`.
   - Records detailed metadata in `FeatureProvenanceMap` for every observation.
   - Preserves unmeasured parameters as `null` (never replaced with 0 or synthetic approximations).
5. **Direct Similarity Engine Integration**:
   - Reuses `computeAnalogSimilarity()` and `rankCandidateLocations()` from `similarity-engine.ts`.
   - Strictly decouples data coverage ($0$ to $1$) from similarity score ($0$ to $100\%$).
   - Cells with coverage $< 40\%$ (`MIN_RELIABLE_COVERAGE`) receive `score: null` and `scoreDisplay: "Insufficient data to rank reliably"`.
6. **API Route (`POST /api/discover`)**:
   - High-performance, cached, and robust endpoint returning ranked candidate cells, telemetry statuses, and scientific caveats.

---

## 2. FILES CREATED AND MODIFIED

| Action | File Path | Description |
| :--- | :--- | :--- |
| **Created** | `src/lib/terratwin/types/discovery.ts` | Request, grid cell, telemetry status, candidate result, and response interfaces. |
| **Created** | `src/lib/terratwin/utils/discovery-cache.ts` | In-memory TTL cache with bounded capacity and coordinate binning. |
| **Created** | `src/lib/terratwin/services/grid-generator.ts` | Deterministic geographic grid generation, bounding box validation, and resource limits. |
| **Created** | `src/lib/terratwin/connectors/elevation-connector.ts` | Open-Meteo Copernicus DEM elevation & 5-point slope stencil. |
| **Created** | `src/lib/terratwin/connectors/nasa-power-connector.ts` | NASA POWER 25-year climatology connector (T2M, TS_RANGE, ALLSKY, WS10M). |
| **Created** | `src/lib/terratwin/connectors/macrostrat-connector.ts` | Macrostrat regional geological map unit & lithology classifier. |
| **Created** | `src/lib/terratwin/services/discovery-engine.ts` | Orchestrator service linking grid generation, connectors, normalization, and scoring. |
| **Created** | `src/app/api/discover/route.ts` | `POST /api/discover` endpoint with input validation and standardized error handling. |
| **Created** | `scripts/test-phase6-step3-live-discovery.mjs` | Automated 21-point verification suite with mocked tests and live smoke test. |
| **Created** | `PHASE6_STEP3_LIVE_DISCOVERY_ENGINE_REPORT.md` | This technical delivery and verification document. |

---

## 3. PROVIDER APIS, ENDPOINTS & PHYSICAL PARAMETERS

| Provider & Dataset | Official API Endpoint | Parameters Retrieved | Physical Unit | Spatial Resolution | Provenance (Post Phase 6.3.1 Hardening) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Open-Meteo Elevation** (Copernicus DEM GLO-90) | `https://api.open-meteo.com/v1/elevation` | `elevation` | meters ($m$) | 90 m | `measured` / `live-api-estimate` (`unverified`) |
| **Open-Meteo Derived** (5-Point Central-Difference) | Stencil across $\Delta = 0.002^\circ$ | `meanSlopeDeg` | degrees ($^\circ$) | ~445 m baseline | `derived` / `computed-derivative` (`unverified`) |
| **NASA POWER Climatology** (LaRC POWER API v2.10.1) | `https://power.larc.nasa.gov/api/temporal/climatology/point` | `T2M` (2 m air temp proxy) | $^\circ\text{C}$ | 0.5° × 0.625° | `proxy` / `live-api-estimate` (`unverified`) |
| **NASA POWER Climatology** | LaRC POWER API v2.10.1 | `TS_RANGE` (Diurnal Range) | $^\circ\text{C}$ | 0.5° × 0.625° | `derived` / `live-api-estimate` (`unverified`) |
| **NASA POWER Climatology** | LaRC POWER API v2.10.1 | `ALLSKY_SFC_SW_DWN` (24 h mean flux) | $W/m^2$ (from $kWh/m^2/d$) | 1.0° × 1.0° (CERES) | `derived` / `computed-derivative` (`unverified`) |
| **NASA POWER Climatology** | LaRC POWER API v2.10.1 | `WS10M` (10m Wind Speed) | $m/s$ | 0.5° × 0.625° | Context metadata (`unverified`) |
| **NASA POWER Climatology** | LaRC POWER API v2.10.1 | `PRECTOTCORR` (Precipitation) | $mm/\text{yr}$ | 0.5° × 0.625° | `derived` / `incompatible` (`isComparable: false`) |
| **Macrostrat Geology** (Macrostrat API v2) | `https://macrostrat.org/api/v2/mobile/map_query_v2` | `lithology`, `mapUnitName` | Category | Regional (1:250k–1:5M) | `proxy` / `live-api-estimate` (`unverified`) |
| **Unmeasured Parameters** | — | `rockAbundancePct`, `medianGrainSizeMm`, `albedo`, `vegetationCoverPct`, `surfacePressurePa` | — | None | `missing_data` / `no-data` (null) |

---

## 4. MATHEMATICAL METHODOLOGY & SLOPE CALCULATION

> **Correction Note (Phase 6.3.1 Hardening Audit)**: During Phase 6.3.1 review, Section 1 and Section 3 were updated to correct the slope stencil terminology (a 5-point central-difference gradient across $\Delta = 0.002^\circ$, not Horn's 3×3 stencil) and to separate live provider provenance into `status: "unverified"`, `dataOrigin`, and `evidenceClassification` rather than `"verified"`. See `PHASE6_STEP3_1_SCIENTIFIC_HARDENING_REPORT.md` for full details.

### 5-Point Central-Difference Topographic Slope Stencil:
To compute slope without downloading multi-gigabyte raster tiles, the engine queries Open-Meteo for a 5-point cross stencil centered on cell centroid $(lat_0, lon_0)$ with $\Delta = 0.002^\circ \approx 222\text{ m}$ (excluding $|lat_0| > 89.5^\circ$ where meridian convergence distorts finite-difference spacing, and wrapping longitudes across $\pm 180^\circ$):
- Center: $(lat_0, lon_0) \rightarrow z_C$
- North: $(lat_0 + \Delta, lon_0) \rightarrow z_N$
- South: $(lat_0 - \Delta, lon_0) \rightarrow z_S$
- East: $(lat_0, lon_0 + \frac{\Delta}{\cos(lat_0)}) \rightarrow z_E$
- West: $(lat_0, lon_0 - \frac{\Delta}{\cos(lat_0)}) \rightarrow z_W$

The partial gradients are calculated as:
$$\frac{\partial z}{\partial x} = \frac{z_E - z_W}{dx}, \quad \frac{\partial z}{\partial y} = \frac{z_N - z_S}{dy}$$
where $dx = dy = 2 \cdot \Delta \cdot \frac{\pi}{180} \cdot R_{Earth} \approx 444.6\text{ meters}$.
The gradient magnitude and slope angle are:
$$\theta = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right) \times \frac{180}{\pi}$$

### Solar Irradiance Conversion:
NASA POWER delivers all-sky solar insolation in $kW\cdot h / (m^2 \cdot \text{day})$. The engine normalizes this to 24-hour time-averaged climatological flux in $W/m^2$:
$$\text{flux } (W/m^2) = \text{insolation } (kWh/(m^2\cdot d)) \times \frac{1000\text{ Wh}}{24\text{ h}} \approx \text{insolation} \times 41.6667$$

---

## 5. MISSING DATA SAFEGUARDS & SCIENTIFIC CAVEATS

1. **No Data Fabrication**: Parameters that cannot be responsibly extracted from satellite DEMs or regional climatology (`rockAbundancePct`, `medianGrainSizeMm`, `albedo`, `vegetationCoverPct`) remain strictly `null`.
2. **Coverage-Gated Scoring**: Candidates require at least $40\%$ mission feature weight coverage (`MIN_RELIABLE_COVERAGE`) to receive a numerical similarity score. If coverage is below $40\%$, the candidate receives `score: null` and is labeled `"Insufficient data to rank reliably"`.
3. **Screening Units vs. Confirmed Sites**: Every candidate returned by `/api/discover` is assigned `noveltyTier: "live-grid-discovery"` and `isVerified: false`. The response includes explicit warnings stating that grid cells are exploratory leads, not confirmed planetary analogs.
4. **Dem Resolution Caveat**: Copernicus 90 m DEM slopes reflect kilometer-scale terrain gradients and do not resolve boulder obstacles, rover trafficability hazards, or micro-roughness.

---

## 6. VERIFICATION TEST RESULTS

### Test 1: Phase 6 Step 3 Dedicated Test Suite (`scripts/test-phase6-step3-live-discovery.mjs`)
- **Command**: `node --test scripts/test-phase6-step3-live-discovery.mjs`
- **Result**: **21 / 21 Tests Passed (100%)**
- **Execution Time**: 1242 ms
- **Checks Verified**:
  1. `Test 1 — Valid bounding-box validation passes cleanly`: **PASS**
  2. `Test 2 — Invalid latitude and longitude values are rejected`: **PASS**
  3. `Test 3 — Invalid bounding-box ordering (minLat > maxLat) is rejected`: **PASS**
  4. `Test 4 — Grid generation is strictly deterministic`: **PASS**
  5. `Test 5 — Grid cells have strictly unique IDs`: **PASS**
  6. `Test 6 — Grid generation respects maximum cell limits and server ceiling`: **PASS**
  7. `Test 7 — Grid cell centers remain strictly inside the requested region`: **PASS**
  8. `Test 8 — Bounding-box coordinate ordering is correctly maintained`: **PASS**
  9. `Test 9 — Antimeridian crossing is safely handled and rejected with clear guidance`: **PASS**
  10. `Test 10 — Missing provider data remains strictly missing (never converted to 0)`: **PASS**
  11. `Test 11 — Provider failures do not become zero measurements`: **PASS**
  12. `Test 12 — Data provenance is retained across all candidate features`: **PASS**
  13. `Test 13 — Unit normalization works correctly (°C, W/m², degrees slope)`: **PASS**
  14. `Test 14 — Data coverage is strictly distinct from similarity score`: **PASS**
  15. `Test 15 — Insufficient evidence does not produce fabricated scores (coverage < 40% yields score: null)`: **PASS**
  16. `Test 16 — Novelty tier (live-grid-discovery) has zero effect on similarity scoring`: **PASS**
  17. `Test 17 — Existing mission profiles resolve correctly across all 4 profiles`: **PASS**
  18. `Test 18 — Existing Global Discovery Atlas candidates remain completely unchanged`: **PASS**
  19. `Test 19 — API validation and error handling work cleanly`: **PASS**
  20. `Test 20 — In-memory caching prevents unnecessary repeated provider requests`: **PASS**
  21. `Test 21 — Safe live smoke test (1 cell against real Open-Meteo API)`: **PASS**

### Test 2: TypeScript Strict Compilation
- **Command**: `npx tsc --noEmit`
- **Result**: **PASS (0 errors)**

### Test 3: Phase 6 Step 1 & Step 2 Regressions
- `node --test scripts/test-phase6-step1-types-and-profiles.mjs` $\rightarrow$ **10/10 PASS**
- `node --test scripts/test-phase6-step2-discovery-atlas.mjs` $\rightarrow$ **17/17 PASS**

---

## 7. CONFIRMATION OF ARCHITECTURAL COMPLIANCE

- **Phases 1–5 Preserved**: The 3D flight deck, Mission Suite, Portfolio Optimizer, NASA satellite layers, and scientific evidence explorer remain 100% operational.
- **Phases 6.1 & 6.2 Preserved**: All 4 mission profiles, 9 categories, 3 novelty tiers, and 31 atlas candidates remain intact.
- **Scope Restriction**: No discovery scanner UI or page redesign was introduced in this step. The scope remained strictly confined to backend engine, connectors, scoring, and the `/api/discover` endpoint.
