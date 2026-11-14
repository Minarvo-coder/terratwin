# TERRATWIN — PHASE 6.3.1: SCIENTIFIC ACCURACY, API RELIABILITY & PRODUCTION READINESS AUDIT REPORT

**Project**: TerraTwin (NASA Space Apps Challenge — Team HEXARCHY)  
**Audit Scope**: Phase 6.3 Live Regional Analog Discovery Engine (`/api/discover`, spatial grid generator, Open-Meteo/NASA POWER/Macrostrat connectors, discovery orchestrator, provenance model, caching, rate limiting, and tests)  
**Completion Status**: Completed & Verified (`npm run build`, `tsc --noEmit`, and all Phase 3, 4, 6.1, 6.2, 6.3, and 6.3.1 test suites passing)

---

## 1. EXECUTIVE AUDIT SUMMARY

Phase 6.3 established an operational live regional discovery pipeline backed by Open-Meteo Copernicus DEM GLO-90, NASA POWER Climatology v2.10.1, and Macrostrat API v2. A rigorous Phase 6.3.1 audit identified **6 scientific accuracy issues**, **5 provenance/methodology issues**, and **6 API reliability, concurrency, and input-validation gaps**. All findings have been corrected without breaking Phases 1–5, 6.1, 6.2, similarity engine weighting, or the 40% minimum reliable coverage gate.

---

## 2. REAL DATA FLOW TRACE (`/api/discover`)

1. **`POST /api/discover` (`src/app/api/discover/route.ts`)**:
   - Applies `discoverRouteRateLimiter` (`20` req / `60s` sliding window per client IP, single-instance in-memory safeguard).
   - Parses JSON and rejects non-object or array payloads (`HTTP 400 VALIDATION_ERROR`).
   - Invokes `executeRegionalDiscovery(body)` and returns HTTP `200`, `400`, `404`, `429`, or sanitized `500` (without leaking internal exception strings).
2. **`executeRegionalDiscovery` (`src/lib/terratwin/services/discovery-engine.ts`)**:
   - Validates `targetId`, `missionProfile`, optional `category` (against `ANALOG_ENVIRONMENT_CATEGORIES`), `maxCells` (`1..100` integer), `maxCandidates` (`1..50` integer), and target planetary body (`"moon"` or `"mars"`).
   - Generates deterministic grid cells via `generateDiscoveryGrid` (`grid-generator.ts`).
   - Checks canonical key in `discoveryResponseCache` (keyed on target ID, mission profile ID, sorted feature weight vector, bounding box, grid spacing, `maxCells`, `maxCandidates`, and `category`).
   - Concurrently invokes `fetchBatchElevationAndSlope`, `fetchBatchNasaPowerClimatology`, and `fetchBatchMacrostratGeology`.
   - Builds `EarthCandidate` records (`isVerified: false`, `noveltyTier: "live-grid-discovery"`) with separated `FeatureProvenanceMap` fields (`status`, `dataOrigin`, `evidenceClassification`, `verificationState`).
   - Calls unmodified `computeAnalogSimilarity(target, candidate, profile)`.
   - Caches complete response **only when all providers report `success` or `cached`**.

---

## 3. SCIENTIFIC & MATHEMATICAL FINDINGS & FIXES

### 3.1 Topographic Slope Method Terminology & Boundary Math (`elevation-connector.ts`)
- **Defect Found**: Slope calculation was documented and labeled `"Horn Stencil"` / `"Horn finite-difference"`. Horn's method requires an 8-neighbor 3×3 weighted kernel, whereas the code actually evaluates a **5-point cardinal central-difference gradient** (center + N/S/E/W at $\Delta = 0.002^\circ$). Furthermore, naive `Math.min(180, ...)` / `Math.min(90, ...)` clamping distorted ground baselines while `dx`/`dy` remained fixed, and a 100-cell request (500 coordinates) risked HTTP 414 URI Length errors on Open-Meteo.
- **Fixes Applied**:
  - Extracted pure exported `computeCentralDifferenceSlopeDeg()` and updated labels to `"5-Point Central-Difference Gradient (Copernicus DEM GLO-90)"`.
  - Excluded polar singularities ($|\text{lat}_0| > 89.5^\circ$ -> `meanSlopeDeg: null` with diagnostic quality note).
  - Implemented `wrapLongitudeDeg()` to wrap E/W stencil longitudes cleanly across $\pm 180^\circ$ without clamping distortion.
  - Computed `dy` from true `latN - latS` separation and `dx` using true $\cos(\text{lat}_0) \cdot R_{\text{Earth}}$.
  - Added strict `Number.isFinite()` checks for center and all four cardinal neighbors.
  - Chunked Open-Meteo HTTP GET batches to `MAX_CELLS_PER_OPEN_METEO_BATCH = 20` cells (`100` coordinates per URL), reporting `"partial"` when a subset of chunks fails.

### 3.2 NASA POWER Climatology Handling (`nasa-power-connector.ts`)
- **Defect Found**: Missing `Number.isFinite()` checks allowed `NaN` to bypass `-999` fill detection; `ALLSKY_SFC_SW_DWN` conversion (`kW-hr/m^2/day * 1000/24`) assumed units without verifying `parameters.ALLSKY_SFC_SW_DWN.units`; `T2M` (2 m air temperature) lacked explicit proxy labeling; `-0` rounding in `getPowerGridKey` produced inconsistent cache keys (`power_-0.00_...`).
- **Fixes Applied**:
  - Reads dynamic `json.header.fill_value` (defaulting to `-999`), API `version`, and `range` (`"2001-2025"`).
  - Enforces `Number.isFinite()` plus physical range bounds (`T2M` $[-90, 70]^\circ\text{C}$, `TS_RANGE` $[0, 90]^\circ\text{C}$, `WS10M` $[0, 120]\text{ m/s}$, `PRECTOTCORR` $[0, 500]\text{ mm/day}$).
  - Verifies `parameters.ALLSKY_SFC_SW_DWN.units`, explicitly supporting `kW-hr/m^2/day`, `W/m^2`, and `MJ/m^2/day` while rejecting unrecognized units as `null`.
  - Uses Gregorian $365.25\text{ days/yr}$ for annual precipitation context and preserves `originalSolarKwhM2Day` and `originalPrecipMmDay`.
  - Normalizes `-0` in `getPowerGridKey` and bumps cache namespace to `power_v2_...`.

### 3.3 Macrostrat Geological Classification (`macrostrat-connector.ts`)
- **Defect Found**: Ultramafic rocks (`peridotite`, `serpentinite`, `ophiolite`) were grouped under `"felsic-crystalline"` (petrologically opposite end-member). Sequential `if/else` keyword checks silently picked the first matching class on mixed/interbedded units without reporting ambiguity.
- **Fixes Applied**:
  - Removed all ultramafic terms from `"felsic-crystalline"`; ultramafics now return `lithology: null` with `lithologyConfidence: "unmapped-class"`.
  - Evaluates all 7 TerraTwin lithology rules with whole-word regex matching (`classifyMacrostratLithologyDetailed()`).
  - Honors explicit `Major:{...}` dominance clauses when unambiguous, while returning `lithology: null` (`confidence: "ambiguous-mixed-unit"`) when multiple incompatible rock classes co-occur without clear dominance.
  - Preserves `geologicAge`, `mapScale`, `rawLithologyText`, `sourceRef`, and `sourceUrl`, with cache keys at 4 decimal places (`macro_v2_...`).

---

## 4. PROVENANCE SEPARATION & TRANSPARENCY (`types.ts`, `discovery-engine.ts`)

- **Defect Found**: Live unvalidated API estimates were marked `status: "verified"`, conflating provider retrieval with scientific ground-truthing. Moreover, `elev?.elevationM !== null` evaluated `undefined !== null` as `true` if a provider lookup was absent.
- **Fixes Applied**:
  - Extended `FeatureProvenance` in `src/lib/terratwin/types.ts` with backward-compatible optional fields: `dataOrigin` (`"live-api-estimate" | "computed-derivative" | "missing" | "static-curated"`), `evidenceClassification` (`"measured" | "derived" | "proxy" | "illustrative" | "missing_data"`), `verificationState` (`"unverified" | "no-data" | "verified" | "illustrative"`), `originalSourceValue`, and `originalSourceUnit`.
  - Live candidate cells use `status: "unverified"`, `verificationState: "unverified"`, explicit `"proxy"` classification for `T2M` (2 m air temperature) and `lithology` (regional map polygon), `"derived"` for 5-point slope / converted irradiance / annual precip, and `"measured"` for DEM elevation.
  - Missing/unmeasured fields (including satellite gaps: `rockAbundancePct`, `medianGrainSizeMm`, `albedo`, `vegetationCoverPct`, `surfacePressurePa`) are explicitly documented with `status: "no-data"`, `dataOrigin: "missing"`, `evidenceClassification: "missing_data"`.

---

## 5. GRID DETERMINISM, CACHING, RETRIES & API HARDENING

- **Grid Generator (`grid-generator.ts`)**: Replaced cumulative floating-point stepping (`lat += spacing`) with exact integer `row`/`col` indexing; clamped cell boxes strictly inside `[minLat, minLon, maxLat, maxLon]`; normalized `-0` and upgraded cell IDs to `.toFixed(4)` (`cell_+lat4_+lon4`); strictly rejects invalid `maxCells` (`!isInteger`, `< 1`, `> 100`) instead of silently clamping.
- **Retries (`fetch-retry.ts`)**: Bounded timeout + retry wrapper (`maxRetries: 1` default) retrying only transient `429/502/503/504` and network/abort failures while never retrying `400/404`.
- **Cache (`discovery-cache.ts`)**: Added MRU promotion on `get()`, expired-entry pruning before capacity eviction, `getOrLoad()` in-flight Promise coalescing, and `discoveryResponseCache`. Failed/partial responses and missing elevation batches are excluded from caching.
- **Validation (`discovery-engine.ts`)**: Rejects JSON array bodies (`[]`), invalid `category` values, invalid `maxCandidates`, and non-Moon/Mars targets (`400`). Valid `category` emits an advisory context warning instead of filtering or tagging live cells.
- **API Route (`src/app/api/discover/route.ts`) & Rate Limiter (`rate-limiter.ts`)**: Added `SlidingWindowRateLimiter` (`20 req / 60s` per IP, `429` + `Retry-After`) with explicit documentation that it is a **single-instance in-memory safeguard (not shared across distributed serverless workers)**. Sanitized `HTTP 500` responses so internal error details never leak to clients.

---

## 6. FILES CREATED & MODIFIED

| Status | File | Purpose |
| :--- | :--- | :--- |
| **Created** | `src/lib/terratwin/utils/fetch-retry.ts` | Bounded timeout & transient HTTP retry helper (`429/502/503/504`) |
| **Created** | `src/lib/terratwin/utils/rate-limiter.ts` | Single-instance sliding-window per-IP rate limiter & documentation |
| **Created** | `scripts/test-phase6-step3-1-hardening.mjs` | 25-test Phase 6.3.1 scientific accuracy & reliability verification suite |
| **Created** | `PHASE6_STEP3_1_SCIENTIFIC_HARDENING_REPORT.md` | This audit & hardening verification report |
| **Modified** | `src/lib/terratwin/types.ts` | Added separated provenance origin/classification/verification fields |
| **Modified** | `src/lib/terratwin/types/discovery.ts` | Extended provider telemetry & `scientificMethodology` metadata |
| **Modified** | `src/lib/terratwin/utils/discovery-cache.ts` | LRU promotion, expiry pruning, `getOrLoad` coalescing, `discoveryResponseCache` |
| **Modified** | `src/lib/terratwin/services/grid-generator.ts` | Integer row/col stepping, strict `maxCells` check, `.toFixed(4)` normalized IDs |
| **Modified** | `src/lib/terratwin/connectors/elevation-connector.ts` | Pure 5-point central-difference slope, polar exclusion, antimeridian wrap, chunking |
| **Modified** | `src/lib/terratwin/connectors/nasa-power-connector.ts` | Dynamic fill checks, bounds, solar unit validation, original values, `-0` key fix |
| **Modified** | `src/lib/terratwin/connectors/macrostrat-connector.ts` | Ultramafic removal, mixed-unit ambiguity preservation, geologic metadata |
| **Modified** | `src/lib/terratwin/services/discovery-engine.ts` | Strict validation, separated provenance, `discoveryResponseCache`, methodology notes |
| **Modified** | `src/app/api/discover/route.ts` | Rate limiting (`429`), array rejection (`400`), sanitized `500` error handling |
| **Modified** | `scripts/test-phase6-step3-live-discovery.mjs` | Updated Test 12 slope provenance check to `'5-Point Central-Difference'` |
| **Modified** | `PHASE6_STEP3_LIVE_DISCOVERY_ENGINE_REPORT.md` | Corrected `"Horn Stencil"` and `"verified"` documentation inaccuracies |

---

## 7. VERIFICATION RESULTS (RUN AFTER FINAL EDITS)

| Check / Suite | Command | Outcome | Notes |
| :--- | :--- | :---: | :--- |
| TypeScript Check | `npx tsc --noEmit` | **PASS** | Exit code 0, zero type errors |
| Phase 6.3.1 Hardening Suite | `node --test scripts/test-phase6-step3-1-hardening.mjs` | **25/25 PASS** | Mocked HTTP handlers + unit math/cache/rate-limit tests + optional localhost `/api/discover` check |
| Phase 6.3 Live Discovery Suite | `node --test scripts/test-phase6-step3-live-discovery.mjs` | **21/21 PASS** | 20 deterministic/mocked tests + Test 21 live Open-Meteo smoke test (`smoke_salda`) |
| Phase 6.2 Atlas Suite | `node --test scripts/test-phase6-step2-discovery-atlas.mjs` | **17/17 PASS** | All 31 atlas entries & backward compatibility verified |
| Phase 6.1 Profiles Suite | `node --test scripts/test-phase6-step1-types-and-profiles.mjs` | **10/10 PASS** | All 4 mission profiles & 9 categories intact |
| Phase 4 Visualization Master | `node scripts/test-phase4-master.mjs` | **5/5 Suites PASS** | Milestones A–E all passed |
| Phase 3 Scientific Master | `node scripts/test-phase3-master.mjs` | **12/12 Suites PASS** | Core engine, APIs, 3D/map & end-to-end flows passed |
| Production Next.js Build | `npm run build` | **PASS** | Next.js 16.4.3 Turbopack compiled, TypeScript passed in 8.2s, 18/18 static pages + `/api/discover` built |

*Note on Test Scope*: Tests 1–20 in `test-phase6-step3-live-discovery.mjs` and Tests 1–23, 25 in `test-phase6-step3-1-hardening.mjs` run deterministically against mock HTTP handlers so network flakiness cannot mask regression bugs; Test 21 (`smoke_salda`) executed against the live Open-Meteo endpoint, and Test 24 exercised `POST http://127.0.0.1:3000/api/discover` directly against the running local server alongside static route checks.

---

## 8. REMAINING KNOWN LIMITATIONS & PHASE 6.4 READINESS

1. **Single-Instance Rate Limiting & Cache Scope**: `DiscoveryCache` and `SlidingWindowRateLimiter` live inside the Node.js process heap and do not synchronize across horizontally scaled serverless instances. Production multi-worker deployment would require a shared Redis/Upstash backend.
2. **Coarse Reanalysis & Polygon Resolution**: NASA POWER ($0.5^\circ \times 0.625^\circ$ MERRA-2 / $1^\circ$ CERES) and Macrostrat map polygons remain regional screening proxies, not in-situ field measurements.
3. **Unmeasured Regolith Features**: Meter-scale `rockAbundancePct`, `medianGrainSizeMm`, `albedo`, `vegetationCoverPct`, and `surfacePressurePa` remain `null` (`missing_data`) until Phase 6.4+ field/sensor enrichment or curated atlas promotion.

**Phase 6.4 Readiness**: `/api/discover` now provides scientifically honest provenance fields (`status`, `dataOrigin`, `evidenceClassification`, `verificationState`), methodology disclosures (`scientificMethodology`), explicit uncertainty warnings, and strict validation guarantees suitable for rendering in a Phase 6.4 Global & Regional Scanner UI. **Phase 6.4 has NOT been started.**
