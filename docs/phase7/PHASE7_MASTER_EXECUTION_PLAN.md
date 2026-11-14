# TERRATWIN — PHASE 7 MASTER EXECUTION PLAN
## NASA INTERNATIONAL SPACE APPS CHALLENGE — FINAL PRESENTATION, DEMONSTRATION, JUDGE PREPARATION & SUBMISSION READINESS
**Project:** TerraTwin — Planetary Analog Discovery & Research Platform  
**Team:** HEXARCHY (Six Members)  
**Challenge:** *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars."*  
**Date:** November 15, 2026  

---

## 1. Verified Repository Baseline Entering Phase 7

Before planning or modifying any Phase 7 file, the actual repository code, database state, test suites, and prior Phase 1–6.7 reports were audited:

### 1.1 Completed Phases & Verified Subsystems
- **Phases 1–2 (Foundation & Mission Control):** Next.js 16.4.3 (App Router, Turbopack), React 19.3, TypeScript 5, Tailwind CSS 4, Three.js 3D Moon/Mars globe (`/explore`), Leaflet 2D Earth GIS map, and Combinatorial Multi-Site Portfolio Optimizer (`Mission Suite`, $C(n,k)$ for $k=2,3$).
- **Phase 3 (NASA & Partner Scientific Data Integration):**
  - 5 Planetary Targets: `mars-jezero-delta` (Jezero Crater Delta), `mars-gale-crater` (Gale Crater / Aeolis Mons), `mars-meridiani-planum` (Meridiani Planum), `moon-shackleton-rim` (Shackleton Crater Rim), and `moon-mare-tranquillitatis` (Mare Tranquillitatis).
  - 8 Canonical Verified Earth Candidates in Supabase PostgreSQL (`ndqycqbrxgaauvmqqpjr`) + local binary MGS MOLA (`megt90n000cb.img`) and LRO LOLA (`ldem_4.img`) DEM rasters (`raw-data/dem/*.bin`).
  - 4-Tier Scientific Comparability Framework excluding `surfacePressurePa` and `annualPrecipitationMm` from cross-body similarity denominators.
- **Phase 4 (Advanced Scientific Visualizations):**
  - 6 NASA GIBS & Esri WMTS remote-sensing layers (MODIS True Color, NDVI, Day LST, Bands 7-2-1, ASTER GDEM, Dark Canvas) with explicit browse-imagery vs. calibrated-telemetry disclaimers.
  - Geodesic Slerp Topographic Elevation Profile Engine (`/api/elevation`) with Horn (1981) $3\times 3$ slope on MOLA/LOLA rasters, Copernicus DEM GLO-90 transects, and Relative Relief ($\Delta z$).
  - 5-Axis Terrain Comparison Workspace and 5-Stage Scientific Evidence Lineage Explorer (`/sources` and `/explore`).
- **Phase 5 & Phase 6.1–6.7 (Global Discovery Architecture, Live Regional Discovery, Intelligence & Reproducible Research Workflow):**
  - **Phase 6.1:** 4 Mission Profiles (`rover-testing`, `geological-research`, `lunar-base-construction`, `astrobiology-habitability`), 9 `AnalogEnvironmentCategory` classifications, and 3 `AnalogNoveltyTier` levels (`canonical-benchmark`, `under-explored-analog`, `live-grid-discovery`).
  - **Phase 6.2:** 31-Site Curated Global Discovery Atlas (`8` canonical benchmarks + `23` under-explored analogs across `18` countries/territories and all `9` analog categories).
  - **Phase 6.3 / 6.3.1:** Live Regional Discovery Engine (`POST /api/discover`, bounded to $\le 10^\circ \times 10^\circ$ and $\le 100$ cells) integrating Open-Meteo Copernicus DEM GLO-90 (5-point cardinal central-difference slope stencil over $\sim 445\text{ m}$ baseline, $|lat| \ge 89.5^\circ$ polar guard), NASA POWER 25-year climatology (`2001–2025`), and Macrostrat Geologic Map API v2 (ultramafics excluded from `felsic-crystalline`, ambiguous mixed units returned as `null`).
  - **Phase 6.4 / 6.4.1:** Interactive Global & Regional Discovery Scanner at `/discover` with desktop, compact desktop, tablet, and mobile responsive layouts.
  - **Phase 6.5:** Scientific Discovery Intelligence (`candidate-intelligence-service.ts`) providing feature-level explainability, qualitative evidence-quality assessment, mismatch analysis, validation checklist, research priority, and bounded $\pm 25\%$ sensitivity analysis.
  - **Phase 6.6 / 6.7:** Reproducible Research Workspace (`research-snapshot-service.ts`) with FNV-1a 64-bit integrity digests (`fnv64-...`), immutable assessment revisions, research tasks (`observationStatus: "recommended-not-completed"`), user-authored notes, 11-section pure-TypeScript PDF generator, 4 RFC 4180 CSV exports (formula-injection hardened), and JSON snapshot import/export.
- **Post-Phase 6.7 Infrastructure Upgrades Completed:**
  - **Distributed API Reliability (`TERRATWIN_DISTRIBUTED_API_RELIABILITY_REPORT.md`):** Shared Upstash Redis sliding-window rate limiter (`20 requests / 60s`) and SHA-256 deterministic response cache (`15 min` TTL, `512 KB` max payload) with safe `degraded-memory` / `fail-closed` fallback.
  - **Secure Cloud Research Workspace (`TERRATWIN_CLOUD_RESEARCH_WORKSPACE_REPORT.md`):** Live Supabase PostgreSQL 17 tables (`public.research_records`, `public.research_assessment_revisions`, `public.research_tasks`, `public.research_notes`) deployed on project `ndqycqbrxgaauvmqqpjr` with strict `SELECT`/`INSERT`/`UPDATE`/`DELETE` Row Level Security (`(select auth.uid()) = user_id`), revision immutability trigger, safe `localStorage` batch import, and non-destructive offline conflict merging.

### 1.2 Actual Application Routes Verified
- `/` (`src/app/page.tsx`) — Landing page (Hero, Problem Matrix, Algorithmic Execution Pipeline)
- `/explore` (`src/app/explore/page.tsx`) — Planetary Analog Mission Control (3D Mars/Moon Globe, 2D Earth GIS Map, Single-Site Ranking, Mission Suite Multi-Site Portfolio Optimizer, Terrain Radar, Elevation Transects, Evidence Lineage)
- `/discover` (`src/app/discover/page.tsx`) — Interactive Regional Discovery Scanner & 31-Site Curated Global Atlas + Scientific Intelligence + Cloud/Local Research Workspace
- `/sources` (`src/app/sources/page.tsx`) — Scientific Data Sources, 13×12 Coverage Matrix, & 4-Tier Harmonization Explorer
- `/methodology` (`src/app/methodology/page.tsx`) — Mathematical Equations, Mission Weight Vectors, Data Sources, & Scientific Limitations
- `/login` (`src/app/login/page.tsx`) — Researcher Authentication Portal (`@supabase/ssr`)
- *(Note identified during audit: Judges or external links visiting `/explorer`, `/globe`, or `/about` currently hit a Next.js 404 because the actual route paths are `/explore` and `/methodology`. In Phase 7.2, we will add clean Next.js redirects in `next.config.ts` from `/explorer` $\rightarrow$ `/explore`, `/globe` $\rightarrow$ `/explore`, and `/about` $\rightarrow$ `/methodology`.)*

### 1.3 Reconciliation with `UPDATED_IMPLEMENTATION_ROADMAP.md` & Existing `docs/`
- `UPDATED_IMPLEMENTATION_ROADMAP.md` was authored prior to Phase 6 execution to plan the Phase 6 Discovery Upgrade. All Category A and B discovery, mission profile, intelligence, and export features were completed in Phases 6.1–6.7.
- Existing `docs/` files (`docs/JUDGING_PRESENTATION_GUIDE.md`, `docs/TEAM_STUDY_PLAN.md`, `docs/TECHNICAL_ARCHITECTURE.md`, `docs/SCIENTIFIC_METHODOLOGY.md`) and `README.md` were written after Phase 4 and **do not yet cover Phase 6 (`/discover`, the 31-site Global Discovery Atlas, the 4 mission profiles, Live Regional Discovery, Scientific Intelligence, PDF/CSV/JSON Research Snapshots) or the Upstash Redis + Supabase Cloud Research Workspace upgrades**.
- Phase 7 will preserve those existing files while producing the comprehensive Phase 7 deliverables in `docs/phase7/` and updating `README.md` to accurately reflect the complete Phase 1–7 system.

---

## 2. Phase 7 Milestone Boundaries & Execution Sequence

| Milestone | Scope & Objective | Primary Deliverables (`docs/phase7/`) | Gate Criteria |
| :--- | :--- | :--- | :--- |
| **Phase 7.1** | Project Narrative, 3 Verified Scientific Demo Scenarios (Mars Salda/Jezero, Lunar Shackleton, 31-Site Global Atlas), Judge Storyboard & Claims Register | `PHASE7_STEP1_PROJECT_NARRATIVE.md`<br>`PHASE7_STEP1_SCIENTIFIC_DEMO_PLAYBOOK.md`<br>`PHASE7_STEP1_JUDGE_EXPERIENCE_STORYBOARD.md`<br>`PHASE7_STEP1_SCIENTIFIC_CLAIMS_REGISTER.md` | Every claim and demo step verified against real code and real API/database behavior; Salda `<40%` live coverage honesty explicitly preserved. |
| **Phase 7.2** | Focused Demo UX Audit, Landing Page Telemetry Alignment, Route Alias Redirects (`/explorer`, `/globe`, `/about`), & Dismissible Judge Demo Walkthrough Bar on `/discover` | `PHASE7_STEP2_DEMO_UX_AUDIT.md`<br>`PHASE7_STEP2_PRESENTATION_POLISH_REPORT.md` + minimal code polish | All routes render with 0 errors; no horizontal overflow on desktop/tablet/mobile; zero scientific formula or weight changes. |
| **Phase 7.3** | Official NASA Space Apps Submission Rules Check, Master Submission Drafts, Updated `README.md`, Architecture Diagrams & Data Source Citations | `PHASE7_STEP3_SUBMISSION_MASTER_DRAFT.md`<br>`PHASE7_STEP3_ARCHITECTURE_AND_DATA_SOURCES.md`<br>`PHASE7_STEP3_OFFICIAL_REQUIREMENTS_CHECKLIST.md`<br>`PHASE7_STEP3_DOCUMENTATION_REPORT.md`<br>Updated `README.md` | All dataset URLs, licenses, candidate counts (`31`), mission profiles (`4`), and architecture diagrams verified against source code. |
| **Phase 7.4** | Judge Technical Defense Q&A Bank, Lead Developer Master Technical Guide, 6-Member Team HEXARCHY Preparation & Timed Scripts (`90s`, `3m`, `5m`, `7m`) | `PHASE7_STEP4_JUDGE_QA_MASTER_GUIDE.md`<br>`PHASE7_STEP4_LEAD_DEVELOPER_TECHNICAL_GUIDE.md`<br>`PHASE7_STEP4_HEXARCHY_TEAM_PREPARATION.md`<br>`PHASE7_STEP4_PRESENTATION_SCRIPTS.md` | Every formula, file reference, and worked example verified against `similarity-engine.ts`, `discovery-engine.ts`, and `portfolio-optimizer.ts`. |
| **Phase 7.5** | Deployment Readiness Audit, 3-Tier Demo Fallback Strategy, Security Audit, Cold-Cache & Full Real-Browser E2E Verification (`artifacts/phase7/`) | `PHASE7_STEP5_DEPLOYMENT_READINESS_REPORT.md`<br>`PHASE7_STEP5_DEMO_RELIABILITY_CHECKLIST.md`<br>`PHASE7_STEP5_BROWSER_VERIFICATION_REPORT.md`<br>`tests/e2e/phase7-demo-readiness.spec.ts` | `tsc`, `eslint`, `next build`, all Node regression suites, and headless Chrome CDP E2E tests pass with screenshots in `artifacts/phase7/`. |
| **Phase 7.6** | Final Submission Checklist, Demo Video Script & Storyboard, Final Judge Presentation Guide, Final Acceptance Matrix & Completion Report | `PHASE7_STEP6_FINAL_SUBMISSION_CHECKLIST.md`<br>`PHASE7_STEP6_DEMO_VIDEO_SCRIPT_AND_STORYBOARD.md`<br>`PHASE7_STEP6_FINAL_JUDGE_PRESENTATION_GUIDE.md`<br>`PHASE7_FINAL_ACCEPTANCE_MATRIX.md`<br>`PHASE7_FINAL_COMPLETION_AND_SUBMISSION_READINESS_REPORT.md` | All acceptance checklist items evidenced; manual actions for the team leader clearly separated. |

---

## 3. Files Likely to Change in Phase 7

### 3.1 Minimal, Targeted Application Polish (Phase 7.2)
1. `next.config.ts` — Add clean route redirects for `/explorer` $\rightarrow$ `/explore`, `/globe` $\rightarrow$ `/explore`, and `/about` $\rightarrow$ `/methodology` so judge URL guesses never 404.
2. `src/components/landing/landing-hero.tsx` — Replace Phase 1 placeholder match percentages (`91%`, `87%`), `SYNTHETIC` HUD label, and outdated stat strip (`08 Scientific Dimensions`, `15+ Calibrated Earth Basins`) with exact verified repository values (`86.4%` Geological / `83.6%` Rover match for Lake Salda vs. Jezero; `12` Environmental Parameters; `31` Curated Atlas Sites + Live Regional Scanner; `4` Mission Profiles).
3. `src/components/landing/workflow-section.tsx` — Update the 4 workflow cards and status banner so visitors on `/` immediately understand the complete pipeline: Target & Mission Selection (4 profiles) $\rightarrow$ Dual Flight Deck & Multi-Site Portfolio (`/explore`) $\rightarrow$ Live Regional Discovery & 31-Site Global Atlas (`/discover`) $\rightarrow$ Scientific Intelligence & Reproducible PDF/CSV/JSON Research Reports.
4. `src/components/discover/discovery-scanner-workspace.tsx` — Add an optional, lightweight, keyboard-accessible, dismissible **"Judge Demo Scenarios (Quick Load)"** bar that configures real controls for **Demo A (Mars Jezero · Lake Salda)**, **Demo B (Moon Shackleton · Lunar Base & ISRU)**, and **Demo C (31-Site Global Atlas)** with one click and zero fabricated data.

### 3.2 Documentation & Test Deliverables (Phases 7.1–7.6)
- `README.md` (updated in Phase 7.3)
- `docs/phase7/PHASE7_*.md` (20 milestone documents + root copies of the master plan, final acceptance matrix, and final completion report)
- `tests/e2e/phase7-demo-readiness.spec.ts` & `artifacts/phase7/*` (real-browser E2E verification and screenshots)

---

## 4. Scientific Claims Requiring Verification & Guardrails

1. **Lake Salda Live Scan vs. Curated Atlas Distinction:**
   - In a live `/api/discover` 2×2 scan of `Lake Salda, Turkey` (`[37.1, 29.2, 37.9, 30.1]`) against `mars-jezero-delta` under `geological-research`, Macrostrat's global 1:5M map unit returns `"Pliocene undifferentiated"`, which `macrostrat-connector.ts` conservatively maps to `lithology: null`. Because `geological-research` weights `lithology` (`0.30`), `vegetationCoverPct` (`0.15`), `albedo` (`0.15`), `rockAbundancePct` (`0.10`), and `medianGrainSizeMm` (`0.10`), only `meanSlopeDeg` (`0.10`) + `meanSurfaceTempC` (`0.05`) = **`15%` weighted coverage** is available from live remote APIs, which is below the `40%` reliability threshold (`MIN_RELIABLE_COVERAGE = 0.40`). TerraTwin therefore withholds a numerical similarity score (`score: null`, `"Insufficient data to rank reliably"`).
   - Conversely, under `rover-testing` (`meanSlopeDeg: 0.25`, `elevationM: 0.10`, `diurnalTempRangeC: 0.05`, `meanSurfaceTempC: 0.05`, `surfaceSolarIrradianceWm2: 0.05`) or in North American regions where Macrostrat maps explicit bedrock units (e.g., `Mojave / Lunar Crater, USA`), live scans exceed the `40%` coverage gate and return exploratory scores (`isVerified: false`).
   - Meanwhile, the curated **Lake Salda** entry in the 31-site Global Discovery Atlas (`atlas-lake-salda`) and `/explore` database (`c0000005`) includes peer-reviewed field and MODIS/SRTM measurements (`100%` coverage), yielding **`86.4%`** under `geological-research` and **`83.6%`** under `rover-testing`.
2. **Non-Negotiable Scientific Rules Enforced Across All Phase 7 Materials:**
   - Never modify similarity formulas, tolerances, or mission profile weights.
   - Never lower or bypass the `40%` evidence-coverage threshold.
   - Never convert `null` missing values to `0`.
   - Never present live grid cells (`isVerified: false`) as field-verified sites or curated Atlas sites as newly discovered grid cells.
   - Never claim official NASA endorsement.

---

## 5. Explicit Non-Goals

- Do **not** rebuild TerraTwin or introduce a new scientific subsystem.
- Do **not** modify `similarity-engine.ts`, `portfolio-optimizer.ts`, `comparison-config.ts` weights, or the 40% coverage gate.
- Do **not** deploy to Vercel, push to GitHub, publish external packages, or submit to the NASA Space Apps portal without explicit user authorization.
