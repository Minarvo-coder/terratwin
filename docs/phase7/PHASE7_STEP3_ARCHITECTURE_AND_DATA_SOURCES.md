# PHASE 7.3 — ARCHITECTURE AND DATA SOURCES REFERENCE

**Project:** TerraTwin  
**Team:** HEXARCHY (Six Members)  
**Phase:** 7.3 — Submission Materials & Project Documentation  

---

## 1. End-to-End System Architecture

TerraTwin is architected as a modular **Next.js 16 App Router** application written in strict **TypeScript**, separating deterministic scientific computation (`src/lib/terratwin/`) from interactive visualization (`src/components/`) and cloud/API infrastructure (`src/app/api/`, `src/lib/supabase/`).

### 1.1 Layer Breakdown

| Layer | Key Files | Responsibility |
|---|---|---|
| **1. Domain & Configuration Layer** | `src/lib/terratwin/types.ts`, `src/lib/terratwin/config/comparison-config.ts`, `src/lib/terratwin/data/seed-data.ts`, `src/lib/terratwin/data/global-discovery-atlas.ts` | Defines the 12 environmental parameters, 4 mission weight vectors, 5 planetary targets, 8 canonical benchmarks, and 31-site Global Discovery Atlas. |
| **2. Deterministic Scoring & Portfolio Layer** | `src/lib/terratwin/scoring/similarity-engine.ts`, `src/lib/terratwin/services/mission-suite-engine.ts` | Implements linear, logarithmic, and categorical tolerance functions, enforces `MIN_RELIABLE_COVERAGE_RATIO = 0.40`, and computes 2-site portfolio synergy (`max(sim_A, sim_B)`). |
| **3. Live Regional Discovery Layer** | `src/lib/terratwin/services/discovery-engine.ts`, `src/lib/terratwin/integrations/open-meteo.ts`, `nasa-power.ts`, `macrostrat.ts` | Generates bounded WGS84 grid cells (`<= 16` cells, `<= 6° × 6°`), queries Open-Meteo DEM (5-point slope stencil), NASA POWER climatology, and Macrostrat geology with concurrency control and per-provider timeouts (`4500 ms`). |
| **4. Distributed API Guardrail Layer** | `src/lib/terratwin/services/rate-limiter.ts`, `src/lib/terratwin/services/upstash-redis.ts`, `src/app/api/discover/route.ts`, `src/app/api/compare/route.ts` | Provides Upstash Redis REST sliding-window rate limiting (`12 req/min` on `/api/discover`, `60 req/min` on `/api/compare`) and 24-hour normalized regional scan caching with automatic in-memory fallback. |
| **5. Scientific Intelligence & Reporting Layer** | `src/lib/terratwin/intelligence/candidate-intelligence.ts`, `src/lib/terratwin/reporting/research-exporters.ts` | Computes primary drivers, limiting mismatches, missing high-weight evidence alerts (`weight >= 0.05`), field validation plans, and generates reproducible `PDF`, `CSV`, and `JSON` exports. |
| **6. Cloud & Local Research Workspace Layer** | `src/hooks/use-cloud-research-workspace.ts`, `src/lib/terratwin/services/cloud-research-service.ts`, `supabase/migrations/20261115000000_create_cloud_research_workspace.sql` | Persists research records, immutable assessment revisions (`research_assessment_revisions`), tasks, and notes in Supabase PostgreSQL 17 with strict `auth.uid() = user_id` RLS and offline `localStorage` synchronization. |

---

## 2. Complete Data Sources & Provenance Registry

### 2.1 Planetary Reference Datasets (`src/lib/terratwin/data/seed-data.ts`)

| Target | Body | Coordinates | Verification Status | Primary NASA / Partner Instruments & Citations |
|---|---|---|---|---|
| **Jezero Crater Delta** | Mars | `18.38°N, 77.58°E` | `Verified` (12/12 params) | NASA Mars 2020 *Perseverance* (MEDA, RIMFAX, PIXL, SuperCam), MRO CRISM/HiRISE, MGS MOLA |
| **Gale Crater (Aeolis Mons)** | Mars | `5.40°S, 137.80°E` | `Verified` (12/12 params) | NASA MSL *Curiosity* (REMS, CheMin, SAM, Mastcam), MRO HiRISE, MGS MOLA |
| **Valles Marineris — Coprates Chasma** | Mars | `13.90°S, 60.50°W` | `Partial` (`grainSizeMm: null`) | MRO HiRISE/CRISM, Mars Express HRSC, MGS MOLA (orbital remote sensing only; no landed grain-size truth) |
| **Shackleton Crater Rim** | Moon | `89.90°S, 0.00°E` | `Verified` (12/12 params) | NASA LRO LOLA (Laser Altimeter), LRO Diviner Lunar Radiometer, Mini-RF, Artemis III candidate studies |
| **Mare Tranquillitatis** | Moon | `0.67°N, 23.47°E` | `Verified` (12/12 params) | NASA Apollo 11 Lunar Receiving Laboratory sample catalog, LRO LOLA, LRO Diviner, Clementine UVVIS |

### 2.2 Live Terrestrial Provider APIs (`src/lib/terratwin/integrations/`)

| Provider | Endpoint | Parameters Populated | Resolution / Cadence | Missing-Data / Fallback Behavior |
|---|---|---|---|---|
| **Open-Meteo Elevation API (Copernicus DEM GLO-90)** | `https://api.open-meteo.com/v1/elevation` | `elevationM`, `slopeDeg` (via 5-point central-difference stencil at `±0.01°`) | `90 m` horizontal resolution | On HTTP error or timeout (`4500 ms`), sets `elevationM: null, slopeDeg: null` and records a structured provider warning. |
| **NASA POWER Climatology API** | `https://power.larc.nasa.gov/api/temporal/climatology/point` | `meanTempC` (`T2M`), `diurnalTempRangeC` (`T2M_RANGE`), `annualPrecipMm` (`PRECTOTCORR * 365`), `albedo` (`SRF_ALB`), plus solar/UV telemetry | `0.5° × 0.625°` MERRA-2 / CERES long-term multi-year climatology | Filters NASA sentinel values (`-999`, `-99`, `-9999`) to `null`; derives `waterIceRegime: "arid-saline"` only when `annualPrecipMm < 50 && meanTempC > 0` (`"periglacial"` when `meanTempC <= -2`), otherwise `null`. |
| **Macrostrat API v2** | `https://macrostrat.org/api/v2/geologic_units/map` | `lithology`, geologic age, unit name | Multi-scale regional geologic maps (highest coverage in North America) | Maps clear igneous/sedimentary/metamorphic/evaporite/carbonate terms; maps `"undifferentiated"` or empty responses strictly to `null`. |

### 2.3 Parameters Never Claimed from Global Live APIs
In live regional scans (`/api/discover`), the following parameters are **always `null`** unless supplied by a curated field dataset:
- `rockAbundancePct` (`null` — requires sub-meter boulder counts or drone/HiRISE-scale imagery)
- `grainSizeMm` (`null` — requires sieve analysis or microscopic imaging)
- `mineralogy` (`null` unless evaporite/halite/gypsum is explicitly stated in the Macrostrat unit description)
- `radiationRegime` (`"earth-high-altitude"` only when `elevationM >= 3000`, `"earth-surface"` when `elevationM < 3000`, `null` if elevation is unavailable)
