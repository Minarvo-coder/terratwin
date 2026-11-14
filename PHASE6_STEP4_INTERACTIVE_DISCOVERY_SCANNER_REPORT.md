# TERRATWIN — PHASE 6.4 REPORT: INTERACTIVE GLOBAL & REGIONAL DISCOVERY SCANNER UI

**Milestone:** Phase 6, Step 4 — Interactive Global & Regional Discovery Scanner UI  
**Official Challenge:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars* (Team HEXARCHY)  
**Primary Route:** `/discover` (`src/app/discover/page.tsx`)  
**Status:** Implementation, TypeScript, ESLint, Automated Regression Suites, and Production Build Completed; Live Chrome DevTools Browser E2E Verification Blocked by Unstarted Chrome Remote Debugging Session

---

## 1. Executive Summary
Phase 6.4 transforms TerraTwin's Phase 6.3/6.3.1 Live Regional Analog Discovery Engine (`POST /api/discover`) and Phase 6.2 Global Discovery Atlas (31 curated sites) into an interactive, scientifically honest three-region mission-control workstation at `/discover` (`Discovery Scanner`). Users can select Moon or Mars exploration targets, inspect and choose among all four repository mission profiles, define bounded terrestrial regions (`<= 10° × 10°`, `<= 100` cells) via interactive Leaflet pointer drag, current map viewport capture, manual `[minLat, minLon, maxLat, maxLon]` coordinate inputs, or preset geological regions, run live geospatial screening against Open-Meteo Elevation (Copernicus GLO-90), NASA POWER Climatology, and Macrostrat geology, inspect unverified vs. missing-data provenance per parameter, and pivot seamlessly between live regional scan cells and the 31-site Curated Global Discovery Atlas without leaving the workspace or disturbing any Phases 1–6.3.1 scientific pipelines.

---

## 2. Repository & Architecture Alignment Assessment
- Preserved existing Next.js 16.4.3 (Turbopack) App Router dark mission-control visual language (`site-header.tsx`, `site-nav.tsx`, Tailwind v4 styling, `lucide-react` icons).
- Preserved `src/middleware.ts`, public exploration routes (`/`, `/explore`, `/sources`, `/methodology`), and existing similarity weights/configs in `src/lib/terratwin/config/comparison-config.ts`.
- Followed the established Leaflet pattern from `src/components/explorer/analog-map-canvas.tsx` (`L.map(...)` imperative instance inside `next/dynamic(..., { ssr: false })`) to prevent React 19 StrictMode container re-initialization crashes and SSR `window` errors.
- Consumed existing server data loaders (`listTargets()`, `getAllAtlasCandidates()`) directly inside Server Component `src/app/discover/page.tsx` and dispatched live scans exclusively via `POST /api/discover`.

---

## 3. Navigation & App Integration Changes
- [src/components/site/site-nav.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/site/site-nav.tsx): Added `{ href: "/discover", label: "Discovery Scanner", icon: ScanSearch }` between Explorer and Data Sources, with horizontal scroll/compact mobile padding (`overflow-x-auto`, `whitespace-nowrap`) to prevent nav overflow on 375 px viewports.
- [src/components/landing/landing-hero.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/landing/landing-hero.tsx): Added a secondary `<Link href="/discover">` (`Discovery Scanner`) call-to-action button alongside Explorer and Methodology.
- [src/app/discover/page.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/app/discover/page.tsx): Added the new `/discover` App Router page wrapped in `<Suspense>`, pre-loading `listTargets()` and `getAllAtlasCandidates()` on the server and passing props to `<DiscoveryScannerWorkspace />`.

---

## 4. Scanner Page Layout & Information Architecture
Implemented inside [src/components/discover/discovery-scanner-workspace.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-scanner-workspace.tsx):
- **Desktop (`>= lg`)**: Responsive 3-column workstation (Left Config Panel, Center Interactive Earth Discovery Map, Right Results & Atlas Panel), with collapsible left/right drawer toggles (`PanelLeftClose`/`PanelLeftOpen`, `PanelRightClose`/`PanelRightOpen`) allowing expanded map focus without losing state.
- **Mobile (`< lg`)**: Accessible 3-tab mobile switcher (`Config`, `Map`, `Results`) keeping controls usable without horizontal clipping.
- **Below Main Workstation**:
  1. `<DiscoveryCandidateDetails />` — Selected grid cell or curated Atlas site scientific inspector, provenance matrix, and pinned side-by-side comparison strip.
  2. `<DiscoveryMethodologyPanel />` — Collapsible scientific formula, 40% coverage gate (`MIN_RELIABLE_COVERAGE = 0.40`), spatial-scale disparity, and limitation disclosure.

---

## 5. Interactive Earth Map & Region Selection System
Implemented in [src/components/discover/discovery-earth-map.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-earth-map.tsx), [src/components/discover/discovery-earth-map-canvas.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-earth-map-canvas.tsx), and [src/components/discover/discovery-map-legend.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-map-legend.tsx):
- **Base & NASA Imagery Layers**: Supports `"dark-base"` (Carto Dark), `"modis-true-color"` (NASA MODIS True Color), and `"aster-gdem-relief"` (NASA SRTM/ASTER Relief) via `resolveSatelliteTileUrl` in `src/lib/terratwin/config/satellite-layers.ts`.
- **Bounding Box Selection Modes**:
  1. Pointer/touch drag rectangle (`isDrawMode` toggle via `Select Region`) converting screen drags via `leafletBoundsToGeoBbox` into exact `[minLat, minLon, maxLat, maxLon]`.
  2. `Use Current Map View` (`capture-viewport` command).
  3. Manual accessible numeric coordinate inputs (`minLat`, `minLon`, `maxLat`, `maxLon`) with `aria-invalid` and `aria-describedby`.
  4. Built-in preset Earth regions (`EXAMPLE_REGIONS`: Lake Salda, Turkey; Flagstaff Volcanic Field, US; Atacama Yungay, Chile; Askja Highlands, Iceland) plus `Use as Regional Scan Seed` from any Curated Atlas site via `computeBboxAroundPoint`.
- **Map Overlays & Visual Separation**:
  - Active scan region rendered as a dashed cyan preview rectangle.
  - Previous live scan rectangle layer cleared cleanly before rendering new results.
  - Live grid rectangles styled deterministically by `classifyCandidateVisualTier` (`high-similarity` `>= 70%`, `moderate-similarity` `45–69%`, `low-similarity` `< 45%`, and hatched/dashed `insufficient-data` when `score === null`).
  - Curated Global Discovery Atlas overlay (`showAtlasLayer` toggle): distinct circular markers (`canonical-benchmark` 8 sites in amber vs. `under-explored-analog` 23 sites in purple) visually and semantically separated from live rectangular grid cells.

---

## 6. Target & Mission Profile Selection Controls
Implemented in [src/components/discover/discovery-config-panel.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-config-panel.tsx):
- Planetary body toggle (`Moon` / `Mars`) filtering targets loaded from `listTargets()`.
- Mission profile selector supporting all four repository mission profiles directly from `CONFIGURABLE_MISSION_PROFILES`:
  - `rover-testing`
  - `geological-research`
  - `lunar-base-construction`
  - `astrobiology-habitability`
- Expandable `"View exact profile weights"` disclosure printing unmodified feature labels (`FEATURE_MAP`) and weights (`sum = 1.0`).
- Grid controls respecting backend bounds: `gridSpacingDeg` (`0.1°–5.0°`), `maxCells` (`1–100`), `maxCandidates` (`1–50`), live client-side deterministic cell count preview (`estimateScannerGrid`), and advisory-only `AnalogEnvironmentCategory` selector clearly labeled as metadata-advisory (`requestedCategory`) so users know the backend returns evaluated cells without category pre-filtering.

---

## 7. API Request Lifecycle & State Management
Implemented in [src/lib/terratwin/scanner/scanner-utils.ts](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/scanner/scanner-utils.ts) and [src/hooks/use-discovery-scanner.ts](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/hooks/use-discovery-scanner.ts):
- `buildDiscoveryRequestPayload` enforces required `targetId`, `missionProfile`, valid WGS84 bounding box (`validateScannerBoundingBox`), antimeridian rejection (`minLon > maxLon`), zero-area/inverted latitude checks, and span ceiling (`<= 10° × 10°`) prior to network dispatch.
- `useDiscoveryScanner` maintains an `AbortController` ref and monotonic `requestSeqRef` to prevent duplicate simultaneous clicks (`isBusy` + controller lock), allow clean user cancellation (`aborted` lifecycle), cancel in-flight fetches on unmount, and ignore stale async responses.
- `submitDiscoveryScan` and `parseDiscoverErrorResponse` parse `200`, `400`, `404`, `429` (extracting `Retry-After` seconds without automatic retry), and `500` errors into explicit lifecycle states: `idle`, `validating`, `submitting`, `success`, `partial-success`, `insufficient-data`, `rate-limited`, `error`, and `aborted`.
- Changing target or mission profile while previous scan results remain mounted flags `isStaleTargetOrProfile` and renders an explicit warning banner until re-scanned.

---

## 8. Results Display, Filtering, Sorting & Map Synchronization
Implemented in [src/components/discover/discovery-results-panel.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-results-panel.tsx) and synchronized via `selectedCandidateId` / `selectedAtlasId` / `compareCandidateIds` in `discovery-scanner-workspace.tsx`:
- **Live Regional Results Tab**: Displays summary telemetry (`evaluatedCells`, `rankedCount`, `insufficientDataCount`, `responseCacheHit`), three provider telemetry badges (`Open-Meteo DEM`, `NASA POWER`, `Macrostrat Geo` with status, record count, latency, and errors), ranked vs. unranked (`< 40%` coverage) candidate separation, display-only UI sort (`backend-rank`, `score-desc`, `coverage-desc`), and optional side-by-side compare pinning.
- **Curated Atlas Tab**: Browsable index of all 31 curated sites filterable by text search, all 9 `AnalogEnvironmentCategory` values, and `AnalogNoveltyTier` (`canonical-benchmark`, `under-explored-analog`), with `Focus Map` and `Use as Regional Scan Seed` actions.
- Clicking a candidate row highlights its rectangle on the map (white border) and scrolls/populates the detail inspector; clicking a rectangle or Atlas pin on the map activates the matching item in the right panel and detail inspector.

---

## 9. Candidate Scientific Details, Provenance & Limitations UI
Implemented in [src/components/discover/discovery-candidate-details.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-candidate-details.tsx):
- **Parameter & Provenance Matrix**: Lists inspected candidate features alongside target reference values, measured/null value (`"Not measured (null)"`), raw `originalSourceValue` + `originalSourceUnit`, `EvidenceClassificationPill` (`evidenceClassification`), verification badge via `formatProvenanceVerificationBadge(prov)`, `dataOrigin`, `verificationState`, spatial resolution, measurement period, `qualityNotes`, non-comparability reason, and clickable `sourceUrl`.
- **Mission Breakdown**: Displays actual server-returned `featureScores` resolved via `FEATURE_MAP[fs.key]?.label ?? fs.key` and backend weights without client-side weight mutation or synthetic scoring.
- **Planetary Limitations & Warnings**: Explicitly documents Earth gravity/atmosphere differences, radiation/solar illumination limits, regional proxy scales (NASA POWER MERRA-2 ~50 km & Macrostrat polygons vs. core/rover scales), DEM slope smoothing baseline (~445 m), and backend cell `warnings[]`.
- **Atlas Site Detail View**: Displays category, novelty tier (`canonical-benchmark` vs. `under-explored-analog`), geological description, planetary relevance, and regional scan seed trigger.

---

## 10. Visual Design & Mission-Control Polish
Dark slate/cyan palette consistent with existing `/`, `/explore`, `/sources`, and `/methodology` routes; high-contrast `amber`/`purple`/`emerald`/`sky`/`rose`/`slate` tier cues paired with border styles (`dashed` vs. `solid`) and explicit text badges so meaning never depends solely on color.

---

## 11. Accessibility & Responsive Behavior
- Keyboard-focusable controls, explicit `<label>` + `aria-invalid` + `aria-describedby` bindings on South/West/North/East inputs, `aria-expanded` disclosures, and status live region announcements.
- 3-column desktop grid collapses gracefully via `Config` / `Map` / `Results` tabs below `lg` breakpoint and scrollable primary navigation bar.
- *Limitation*: Responsive visual layout and computed focus/contrast in a live Chromium viewport could not be visually inspected because Chrome remote debugging was unavailable during this run (see Section 19).

---

## 12. Scientific Integrity Verification in UI
Verified by automated tests (`scripts/test-phase6-step4-scanner-ui.mjs`) and source inspection:
- `score: null` is formatted as `"Insufficient data"`, never `0%`, and assigned the neutral dashed `insufficient-data` visual style.
- `null` measurements render via `formatFeatureValue` as `"No data"` or `"Not measured (null)"`, never substituted with `0`.
- Similarity score and evidence coverage remain strictly decoupled in summary stats, cards, and details.
- Live grid candidates show `"Unverified API lead"` / `"Exploratory candidate — not field-verified"` rather than verified/endorsed labels.
- Client `featureScores` display consumes server output directly without recomputing `computeAnalogSimilarity`.

---

## 13. Build & Integration Fixes Performed During Verification
Two TypeScript issues caught by `npx tsc --noEmit` were fixed and cleanly re-verified:
1. `FeatureScore` label mismatch in [src/components/discover/discovery-candidate-details.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-candidate-details.tsx): replaced nonexistent `fs.label` with `FEATURE_MAP[fs.key]?.label ?? fs.key`, and rendered `prov.verificationState` alongside `prov.dataOrigin` in the Provenance Matrix.
2. Non-distributive `Omit<MapActionCommand, "seq">` union issue in [src/components/discover/discovery-earth-map-canvas.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-earth-map-canvas.tsx) and [src/components/discover/discovery-scanner-workspace.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-scanner-workspace.tsx): extracted `export type MapActionInput` and typed `MapActionCommand = MapActionInput & { seq: number }` and `issueMapCommand(cmd: MapActionInput)`.
3. Removed unused imports flagged by ESLint in `discovery-scanner-workspace.tsx` and `scripts/test-phase6-step4-scanner-ui.mjs` so all Phase 6.4 files pass `npm run lint` with zero warnings and zero errors.

---

## 14. Automated UI & Integration Test Suite Results
Executed after final code edits:
- `npx tsc --noEmit`: **Exited 0** (0 errors).
- `node --test scripts/test-phase6-step4-scanner-ui.mjs`: **36/36 passed** (`fail: 0`, `skipped: 0`, `218.67ms`).
  - Covers exact `POST /api/discover` payload/coordinate ordering (1–5), `200`/`400`/`429`/`500`/partial response handling without automatic `429` retry (6–10), missing `null` & `<40%` coverage integrity (11–13), provenance & unverified labeling (14–16), physical units & 31-site atlas separation (17–20), map bounds/oversized/antimeridian validation (21–24), workspace selection sync & seed bbox clipping (25–28), loading/empty/error/abort/concurrency/ARIA/SSR safety (29–36).

---

## 15. Regression Verification (Phases 3, 4, 6.1, 6.2, 6.3, 6.3.1)
Executed during this final verification cycle after Phase 6.4 changes:
- `node --test scripts/test-phase6-step1-types-and-profiles.mjs scripts/test-phase6-step2-discovery-atlas.mjs scripts/test-phase6-step3-live-discovery.mjs scripts/test-phase6-step3-1-hardening.mjs`: **73/73 passed** (`fail: 0`, `skipped: 0`):
  - Phase 6.1: 10/10 passed
  - Phase 6.2: 17/17 passed
  - Phase 6.3.1 hardening: 25/25 passed
  - Phase 6.3 live discovery (+ live 1-cell Open-Meteo smoke test): 21/21 passed
- `node scripts/test-phase4-master.mjs`: **5/5 suites passed** (`24.88s`).
- `node scripts/test-phase3-master.mjs`: **12/12 suites passed** (`35.02s`).

---

## 16. Lint & Production Build Results
Executed after final edits:
- `npm run lint`: **Exited 0** (`0 errors`, `46 warnings` across pre-existing non-Phase-6.4 files; `0` errors and `0` warnings in all Phase 6.4 files).
- `npm run build` (`next build` Next.js 16.4.3 Turbopack): **Exited 0**. Route `/discover` compiled and prerendered cleanly (`◐ /discover`, `ƒ /api/discover`).

---

## 17. Real-World & Edge-Case Behavior Validation
- Client-side validation (`validateScannerBoundingBox`, `estimateScannerGrid`) rejects `> 10° × 10°` regions, `totalCells > maxCells`, zero-area boxes, inverted bounds, and antimeridian-crossing selections (`minLon > maxLon`) prior to issuing any `/api/discover` request.
- Partial/rate-limited/errored provider responses preserve explicit honest status banners (`Retry-After` guidance on `429`, zero auto-retry, failed-provider non-comparable messaging).
- Live Open-Meteo API connectivity verified at backend level via Test 21 of `scripts/test-phase6-step3-live-discovery.mjs` (`1 cell against real Open-Meteo API`, passed in `3064.78ms`).

---

## 18. Files Created or Modified Inventory
Created:
- [src/lib/terratwin/scanner/scanner-utils.ts](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/scanner/scanner-utils.ts)
- [src/hooks/use-discovery-scanner.ts](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/hooks/use-discovery-scanner.ts)
- [src/components/discover/discovery-map-legend.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-map-legend.tsx)
- [src/components/discover/discovery-earth-map-canvas.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-earth-map-canvas.tsx)
- [src/components/discover/discovery-earth-map.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-earth-map.tsx)
- [src/components/discover/discovery-config-panel.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-config-panel.tsx)
- [src/components/discover/discovery-results-panel.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-results-panel.tsx)
- [src/components/discover/discovery-candidate-details.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-candidate-details.tsx)
- [src/components/discover/discovery-methodology-panel.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-methodology-panel.tsx)
- [src/components/discover/discovery-scanner-workspace.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-scanner-workspace.tsx)
- [src/app/discover/page.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/app/discover/page.tsx)
- [scripts/test-phase6-step4-scanner-ui.mjs](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/scripts/test-phase6-step4-scanner-ui.mjs)

Modified:
- [src/components/site/site-nav.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/site/site-nav.tsx)
- [src/components/landing/landing-hero.tsx](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/landing/landing-hero.tsx)

---

## 19. Manual End-to-End Verification Status & Known Blockers
- Attempted live browser E2E verification against `http://localhost:3000` (`npm run dev` running cleanly) via the `browser` subagent (`chrome_devtools` MCP).
- **Blocked**: Chrome remote debugging could not connect (`Could not find DevToolsActivePort for chrome at C:\Users\Minarvo\AppData\Local\Google\Chrome\User Data\DevToolsActivePort`).
- Consequently, live browser visual rendering, interactive pointer-drag box drawing, live `POST /api/discover` browser round-trip, and desktop/mobile screenshots have **not** been executed yet. Once Chrome remote debugging is enabled at `chrome://inspect/#remote-debugging`, the idle browser subagent can resume verification against `http://localhost:3000/discover`.

---

## 20. Remaining Limitations & Honest Scientific Caveats
1. Earth regional discovery evaluates bounded areas (`<= 10° × 10°`, `<= 100` cells) — not automated planetary-scale scanning of the entire Earth in one request.
2. Live rate limits (`20 req/60s` per IP) and in-memory caches are single-instance.
3. Regional scans rely on coarse NASA POWER (~50 km MERRA-2 climatology) and regional Macrostrat polygons plus Copernicus 90 m DEM ~445 m central-difference slopes; unmeasured regolith grain size, albedo, rock abundance, and vegetation leave evidence coverage < 100% and require field follow-up.
4. `requestedCategory` remains advisory metadata (`category` matching is not pre-filtered on `/api/discover`).

---

## 21. Next Steps Before Phase 6.5 (And Phase 6.4 Readiness Verdict)
- **Before Phase 6.5**: Enable Chrome remote debugging (`chrome://inspect/#remote-debugging`) and run the visual E2E checklist + screenshot capture across `/discover` (desktop & mobile) to confirm zero runtime console/layout defects in live Chromium.
- **Readiness Verdict**: Codebase, TypeScript, ESLint, 109 Phase 6 tests (36 Step 4 + 73 Step 1–3.1), 17 Phase 3–4 master suites, and Next.js production build are green and ready for live browser sign-off prior to starting Phase 6.5 (not started).
