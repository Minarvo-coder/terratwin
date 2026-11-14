# TerraTwin — Phase 6.7 Pre-Edit Audit Baseline

## 1. Purpose & Scope
This baseline captures the pre-edit state of **TerraTwin** entering **Phase 6.7 (Final Integration, Scientific Validation & Phase 6 Completion)** before applying targeted scientific, security, typography, and documentation fixes.

## 2. Verified Baseline Subsystems Entering Phase 6.7
The following Phase 5 and Phase 6.1–6.6 subsystems are present and verified prior to Phase 6.7 edits:
- **Mission Profiles & Taxonomy (`Phase 6.1`)**: 4 canonical mission profiles, 9 `AnalogEnvironmentCategory` values, 3 `AnalogNoveltyTier` classifications, extended `EarthCandidate` provenance metadata, and backward-compatible legacy mission resolution.
- **Global Analog Discovery Atlas (`Phase 6.2`)**: 31 curated sites (`8` canonical, `23` under-explored, `0` live-grid) across `18` unique countries/territories.
- **Live Regional Discovery Engine & Hardening (`Phase 6.3` / `6.3.1`)**:
  - Spatial grid generator (`grid-generator.ts`): integer `row`/`col` stepping, antimeridian rejection (`minLon > maxLon`), span cap (`10.0 deg`), cell cap (`25` default / `100` hard ceiling).
  - Elevation/slope connector (`elevation-connector.ts`): `6371000 m` sphere radius, `0.002 deg` central-difference stencil, `cos(lat)` zonal scaling, `>= 89.5 deg` polar slope exclusion, batch size <= 20 (`SLOPE_METHOD_LABEL = "5-point central-difference gradient (4 cardinal neighbors)"`).
  - NASA POWER connector (`nasa-power-connector.ts`): exact `1000/24` kW-hr/m²/day -> W/m² and `1_000_000/86_400` MJ/m²/day -> W/m² conversions, `2001-2025 (25-year Climatology Monthly/Annual)` reference, dynamic `header.fill_value` filtering.
  - Macrostrat connector (`macrostrat-connector.ts`): lithology taxonomy mapping, explicit exclusion of ultramafic rocks from `felsic-crystalline`, `Major:{...}` dominance vs `ambiguous-mixed-unit` -> `null`.
  - Similarity engine (`similarity-engine.ts`): `MIN_RELIABLE_COVERAGE = 0.40` (weighted coverage gate returning `score: null` below 40%), no silent zero coercion for null values, unit/comparability guards (`incompatible_quantities`, `incompatible_units`), lithology distance (`0.0` / `0.5` / `1.0`).
- **Discovery Scanner UI & E2E Stabilization (`Phase 6.4` / `6.4.1`)**: Interactive regional & global discovery scanner, Leaflet map/viewport synchronization, compact desktop / tablet / mobile responsiveness.
- **Scientific Discovery Intelligence (`Phase 6.5`)**: `candidate-intelligence-service.ts` providing structured scientific validity/comparability narratives, bounded ±25% sensitivity perturbations (capped at 5 scenarios), exploratory threshold annotations (`0.75` strong / `0.45` partial), and verification-status separation.
- **Scientific Reports, Exports & Research Workflow (`Phase 6.6`)**: `research-snapshot-service.ts` (`MAX_STORED_RESEARCH_RECORDS = 20`, `MAX_JSON_IMPORT_BYTES = 1_500_000`), pure-TypeScript 11-section PDF generator (`pdf-report-generator.ts`), CSV formula-neutralized exporters (`csv-export.ts`), and integrated Research Workspace UI.

## 3. Pre-Edit Baseline Test Posture (Prior Phase Reports)
Entering Phase 6.7, prior phase reports record passing suites across:
- `scripts/test-phase3-master.mjs` (12/12)
- `scripts/test-phase4-master.mjs` (5/5)
- `scripts/test-phase6-step1` through `step4` unit/regression suites (109/109)
- `scripts/test-phase6-step5-scientific-intelligence.mjs` (7/7)
- `scripts/test-phase6-step6-reports-and-workflow.mjs` (6/6)
- `tests/e2e/discovery-scanner.spec.ts` (11/11), `tests/e2e/scientific-intelligence.spec.ts` (2/2), `tests/e2e/research-reports-workflow.spec.ts` (2/2).

## 4. Discrepancies, Risks & Gaps Identified During Phase 6.7 Audit
1. **Stale Slope Terminology in `features.ts` (Moderate — Scientific Accuracy)**:
   `src/lib/terratwin/features.ts` line 416 describes `live-grid-discovery` evidence as using `"3x3 Horn slope stencil"`, whereas the hardened `elevation-connector.ts` implements a 5-point cardinal central-difference gradient stencil.
2. **Undifferentiated Slope Filter Description in `format.ts` (Minor — Scientific Clarity)**:
   `src/lib/terratwin/format.ts` line 91 attributes `meanSlopeDeg` generically to `"Horn 3x3 finite-difference spatial filter"` without distinguishing Phase 3 MOLA/LOLA 3x3 Horn raster derivatives from Phase 6.3 live Copernicus 5-point central-difference DEM slopes.
3. **Atlas Country Count Documentation Mismatch (Minor — Report Accuracy)**:
   `PHASE6_STEP2_GLOBAL_DISCOVERY_ATLAS_REPORT.md` line 44 reports `13` unique countries/territories while enumerating 15 names and omitting `Argentina`, `Greenland`, and `Turkey`; `getAtlasSummaryStatistics()` returns `18`.
4. **Solar Flux Wording Drift in Step 3 Report (Minor — Documentation Clarity)**:
   `PHASE6_STEP3_LIVE_DISCOVERY_ENGINE_REPORT.md` line 93 writes `"instantaneous diurnally-averaged flux"`, whereas `discovery-engine.ts` line 340 already correctly documents `"24-hour climatological average shortwave downward flux (converted from kW-hr/m^2/day); not instantaneous noon peak"`.
5. **JSON Snapshot Import Hardening Gaps (`research-snapshot-service.ts`, Moderate — Security & Integrity)**:
   `validateAndImportResearchRecord()` does not recursively strip prototype-pollution keys (`__proto__`, `constructor`, `prototype`), does not strictly sanitize imported task `status`/`notes`/`observationStatus` or normalize `contextKey`/`storageMode`, and does not detect/flag `contentDigest` mismatches on tampered imported snapshots.
6. **PDF WinAnsi ASCII Fallback Coverage Gaps (`pdf-report-generator.ts`, Minor — Export Typography)**:
   `ASCII_FALLBACKS` omits common scientific symbols (`µ`, `μ`, `Δ`, `−`, superscripts `⁰`, `¹`, `⁴`, `⁵`, `⁻`, and non-breaking space `\u00a0`), causing them to fall back to `?` in WinAnsi PDF output.

## 5. Known Architectural & Operational Boundaries
- **Single-Instance Rate Limiting**: `POST /api/discover` enforces a `20 requests / 60s` sliding-window limit in Node.js process heap memory (`rate-limiter.ts`). It protects single-instance deployments against bursts, not multi-replica serverless fleets.
- **Persistence Boundary**: Research assessments, notes, and tasks persist in browser `localStorage` (`RESEARCH_STORAGE_KEY`, capped at 20 records) plus explicit JSON/CSV/PDF file exports; there is no cloud database backend or cross-device sync in Phase 6.
- **No Unmeasured In-Situ Substitutions**: Live discovery grid cells evaluate remote-sensing/geology proxies and keep unmeasured parameters (`regolithFePct`, `waterIceProbability`, `iceWaterIndex`, etc.) explicitly `null` (`missing_data`). Exploratory analog status does not represent NASA site certification.

## 6. Phase 6.7 Corrective & Verification Plan
1. Apply minimal, non-breaking fixes for all 6 identified defects above (preserving all mission weights, similarity formulas, and the 40% coverage gate).
2. Create `scripts/test-phase6-step7-final-integration.mjs` to independently verify spatial math, physical unit conversions, petrological rules, weighted similarity arithmetic, 40% coverage gates, Mission Scenarios A–D, 31-site Atlas counts, prototype-pollution/CSV-injection defense, WinAnsi PDF checks, and 6-format cross-export consistency.
3. Create `tests/e2e/phase6-final-acceptance.spec.ts` to execute real-browser verification across desktop/tablet/mobile viewports, a genuine live provider-backed regional scan (`Lake Salda, Turkey` for `mars-jezero-delta`), low-coverage (<40%) workflows, curated Atlas assessment, and full PDF/CSV/JSON export & re-import validation while archiving evidence in `artifacts/phase6-step7/`.
4. Run full post-edit TypeScript, ESLint, Next.js production build, unit/regression scripts, and all 4 Playwright browser E2E suites, then compile `PHASE6_FINAL_ACCEPTANCE_MATRIX.md` and `PHASE6_FINAL_COMPLETION_AND_PHASE7_READINESS_REPORT.md`.
