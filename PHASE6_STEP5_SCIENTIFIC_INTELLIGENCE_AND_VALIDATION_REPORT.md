# TERRATWIN — PHASE 6.5 SCIENTIFIC DISCOVERY INTELLIGENCE & CANDIDATE VALIDATION REPORT

**Project:** TerraTwin (NASA International Space Apps Challenge — Team HEXARCHY)  
**Challenge:** *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars."*  
**Phase Scope:** Phase 6.5 — Scientific Discovery Intelligence & Candidate Validation (strictly scoped; Phase 6.6 not started)  
**Verification Status:** Complete — Unit tests (`7/7`), Next.js `tsc`/`lint`/`build`, Phase 6.1–6.4 (`109/109`), Phase 3 (`12/12`), Phase 4 (`5/5`), Phase 6.4.1 real-browser E2E (`10/10`), and Phase 6.5 real-browser E2E (`2/2`) all passed after final edits.

---

## 1. Executive Summary & Architectural Integration

Phase 6.5 layers an explainable, evidence-aware **Scientific Discovery Intelligence & Candidate Validation** system on top of the existing TerraTwin Phase 6.3.1 live regional discovery engine and Phase 6.2 curated Global Discovery Atlas, integrated into the `/discover` workbench via progressive disclosure inside the Candidate Detail Inspector.

**Architectural Choice (Lazy On-Demand Option C):**
- Intelligence evaluation is implemented as a pure, deterministic TypeScript layer (`src/lib/terratwin/services/candidate-intelligence-service.ts`) evaluated on demand via `useMemo` only for the currently inspected candidate or curated Atlas site inside `DiscoveryScientificIntelligence`.
- `POST /api/discover` request/response schemas and execution latency remain completely untouched, avoiding unnecessary 100-cell sensitivity fan-out on the backend.

**Preserved Phase 1–6.4.1 Invariants:**
- Exact repository similarity scores (`computeAnalogSimilarity()`), weighted coverage denominators, missing-data omission rules (`null` never coerced to `0`), unit-incompatibility guards (`incompatible_units`), mission profile weights across all 4 profiles, the `40%` reliability gate (`MIN_RELIABLE_COVERAGE = 0.40`), `noveltyTier` decoupling, and live-cell `isVerified: false` semantics are 100% preserved.

---

## 2. Files Added & Modified

| File | Role | Status |
| --- | --- | --- |
| [`src/lib/terratwin/types/candidate-intelligence.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/types/candidate-intelligence.ts) | Strongly typed data contracts (`CandidateScientificIntelligence`, `CandidateFeatureExplanation`, `EvidenceQualitySummary`, `ScientificMismatchItem`, `ValidationChecklistItem`, `ResearchPriorityAssessment`, `SensitivityAnalysisResult`, `FollowUpRecommendation`, `IntelligenceSourceReference`) | Added |
| [`src/lib/terratwin/services/candidate-intelligence-service.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/services/candidate-intelligence-service.ts) | Pure deterministic engine (`buildLiveCandidateIntelligence`, `buildAtlasCandidateIntelligence`, `runBoundedSensitivityAnalysis`) | Added |
| [`src/components/discover/discovery-scientific-intelligence.tsx`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-scientific-intelligence.tsx) | Collapsible dark aerospace Scientific Intelligence drawer with 4 accessible ARIA tabs, dimensionless 0–100% feature bars, status badges, context-invalidation alert, sensitivity table, and citations | Added |
| [`src/components/discover/discovery-candidate-details.tsx`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-candidate-details.tsx) | Embeds `<DiscoveryScientificIntelligence />` cleanly beneath the existing Breakdown and Scientific Limitations grid | Modified |
| [`src/components/discover/discovery-scanner-workspace.tsx`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-scanner-workspace.tsx) | Passes `allEvaluatedCandidates`, `liveMissionProfile`, `activeTarget`, `activeMissionProfile`, and `isStaleContext` to `DiscoveryCandidateDetails` | Modified |
| [`scripts/test-phase6-step5-scientific-intelligence.mjs`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/scripts/test-phase6-step5-scientific-intelligence.mjs) | 7-group / 30-check deterministic scientific unit verification suite (including controlled Examples A–F) | Added |
| [`tests/e2e/scientific-intelligence.spec.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/tests/e2e/scientific-intelligence.spec.ts) | Real headless Chrome CDP E2E test suite verifying live candidate intelligence workflows, 4 sub-tabs, `<40%` sensitivity gating, context invalidation, curated Atlas mode, keyboard focus, and `375x812` mobile zero-overflow | Added |
| `PHASE6_STEP5_SCIENTIFIC_INTELLIGENCE_AND_VALIDATION_REPORT.md` | Complete scientific & QA engineering report | Added |

---

## 3. Feature-by-Feature Explainability & Documented Presentation Thresholds

Implemented in `classifyContribution()` and `buildFeatureInterpretation()` inside [`candidate-intelligence-service.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/services/candidate-intelligence-service.ts):

- **Preserved Backend Scores:** `similarity` on every `CandidateFeatureExplanation` is taken verbatim from `FeatureScore.similarity` (or `evaluateFeatureComparison()` for Atlas inspection); no normalized feature values or backend formulas are altered.
- **Documented Presentation Thresholds (Explicitly Disclosed):**
  - `EXPLORATORY_STRONG_MATCH_MIN_SIMILARITY = 0.75` (`>= 75%` -> `strong-supporting-match`, badge `Strong match`)
  - `EXPLORATORY_PARTIAL_MATCH_MIN_SIMILARITY = 0.45` (`45%–74%` -> `partial-match`, badge `Partial match`)
  - Below `45%` (`< 45%` -> `significant-mismatch`, badge `Significant mismatch`)
  - `incompatible_units` -> `not-comparable` (`Not comparable`)
  - `missing_data` -> `missing-evidence` (`Insufficient evidence`, `similarity: null`)
- **Mandatory Disclosure (`PRESENTATION_THRESHOLD_DISCLOSURE`):** Explicitly informs users in both structured JSON and UI that `>= 75% / 45–74% / < 45%` labels are TerraTwin presentation helpers, not validated planetary-science boundaries.
- **Dimensionless UI Bars:** Rendered strictly on `0–100%` (`similarity * 100`) without aggregating incompatible physical units (`°C`, `W/m²`, `Pa`, `deg`, `m`).

---

## 4. Qualitative Evidence Quality & Provenance Separation

Implemented in `buildEvidenceQualitySummary()`:
- **Strict Separation:** Evidence Quality is kept completely separate from Similarity Score, Weighted Coverage (`weightedCoverage`), and Statistical Confidence (no fabricated probability or `"Confidence: XX%"` metric).
- **Qualitative Tags (`EvidenceQualityTag`):** `source-supported`, `proxy-limited`, `spatially-coarse`, `missing-critical-measurements`, `independently-validated`.
- **Per-Feature Evidence Accounting:** Tracks `comparableCount`, `missingCount`, `incompatibleCount`, `measuredCount`, `derivedCount`, `proxyCount`, `illustrativeCount`, and `independentlyVerifiedCount`, plus spatial-scale caveats (e.g., ~445 m Copernicus DEM 5-point gradient stencil, ~50 km MERRA-2 2 m air temperature proxy, regional Macrostrat map polygons).
- **Curated Global Atlas Support (`buildAtlasCandidateIntelligence`):** Inspects the 31 Phase 6.2 curated Atlas sites feature-by-feature without mutating `noveltyTier` or fabricating aggregate live regional scanner scores (`score: null`, `weightedCoverage: null`).

---

## 5. Mismatches, Unknowns, Contextual Limits & Validation Checklist

Implemented in `buildMismatchesAndContextualLimits()` and `determineValidationStatusAndChecklist()`:

1. **Three-Way Separation of Limitations (`MismatchKind`):**
   - `scored-mismatch`: Quantified divergence on comparable weighted features (`similarity < 0.45`).
   - `unknown`: Unmeasured/`null` weighted mission inputs or blocked incompatible units (e.g., unmeasured surface albedo, regolith grain size, rock abundance).
   - `known-contextual-limitation`: Fundamental Earth vs. Moon/Mars physical boundary conditions that regional screening cannot equate (1g Earth gravity vs. 0.16g Moon / 0.38g Mars; ~101 kPa oxic atmosphere vs. lunar vacuum / 600–800 Pa CO₂ Mars; magnetospheric radiation attenuation and 24 h climatological solar flux).
2. **Candidate Validation Checklist (`ValidationChecklistItem[]`):**
   - Strictly separates `"supported"`, `"not-supported"`, `"unknown"`, and `"not-applicable"` — missing evidence marks `"unknown"`, never `"not-supported"`.
   - Checks coordinate validity, environmental data retrieval, unit compatibility, source traceability, geological documentation, elevation/slope/climate availability, top-weighted feature coverage, and independent peer-reviewed verification.
   - Live regional cells (`cell_*`) remain strictly `isVerified: false` (`validationStatus: "exploratory-screening-lead"` or `"evidence-review-needed"`) regardless of high similarity score — never labeled `"Independently validated"` or NASA-certified.

---

## 6. Deterministic Research Priority & Follow-Up Recommendations

Implemented in `buildResearchPriority()` and `buildFollowUpRecommendations()`:

- **Four Research Priority Levels (`ResearchPriorityLevel`):**
  1. `not-presently-assessable` — Deterministic gate: any candidate with `coverage < 0.40` (`MIN_RELIABLE_COVERAGE`), `isReliable === false`, or `score === null`. Guarantees low-coverage leads cannot receive high priority.
  2. `limited-current-evidence` — `coverage < 0.55`, `score < 50`, or `>= 2` high-weight (`>= 15%`) missing drivers.
  3. `additional-data-required` — `coverage < 0.70`, `score < 70`, any weighted missing feature (`>= 5%`), severe high-weight mismatch, proxy/derived active layers requiring local confirmation, or sensitivity rank shift.
  4. `promising-follow-up-lead` — High coverage (`>= 70%`), strong alignment (`>= 70%`), zero missing weighted mission drivers, and stable rank ordering across bounded sensitivity perturbations.
- **`noveltyTier` & Benchmark Neutrality:** Neither `noveltyTier` nor benchmark labels add bonus priority points.
- **Actionable Follow-Up Recommendations:** Prioritized observation actions mapped to missing/proxy mission drivers (e.g., sub-meter photogrammetry / LiDAR for slope & boulders, VIS-NIR reflectance spectroscopy for albedo/mineralogy, grain-size/bearing geotechnical assays, NDVI vegetation verification, localized IR surface radiometry). Every item carries `observationStatus: "recommended-not-completed"`.

---

## 7. Bounded Weight-Sensitivity Analysis (`±25%`, Secondary Exploration)

Implemented in `runBoundedSensitivityAnalysis()`:
- **Secondary Only:** Does not alter candidate similarity score or ranking in `DiscoveryResultsPanel` or map styling.
- **Engine Reuse:** Re-evaluates `computeAnalogSimilarity()` and `rankCandidateLocations()` across up to `MAX_SENSITIVITY_SCENARIOS = 5` scenarios (`Baseline mission weights` + `±25%` scaled and re-normalized perturbations of the top 2 active comparable weighted drivers).
- **Strict Gating:** Disabled cleanly when `coverage < 0.40` or `score === null` (`status: "insufficient-evidence"`), when `< 2` comparable active drivers exist (`status: "unavailable"`), or for unscored curated Global Atlas entries.
- **Explicit Disclaimer:** Reports exact tested min/max score bounds and whether rank order shifted within the evaluated candidate set, stating explicitly that results are *not* a statistical confidence interval or measurement error distribution.

---

## 8. Context Invalidation & UI Safety Rules

In [`discovery-scanner-workspace.tsx`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-scanner-workspace.tsx) and [`discovery-scientific-intelligence.tsx`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/components/discover/discovery-scientific-intelligence.tsx):
- Switching the workspace target or mission profile after a scan does **not** recompute a mismatched assessment silently against stale scan weights. Instead, intelligence remains anchored to `liveTarget` + `liveMissionProfile`, while rendering a high-contrast **"Context Changed — Prior Scan Assessment Displayed"** warning banner prompting a fresh regional scan.
- Mandatory site-level screening disclaimer (`TERRATWIN_SCREENING_DISCLAIMER`) is visibly rendered inside the collapsible Scientific Intelligence panel.

---

## 9. Verification Summary (All Runs Executed After Final Edit)

| Check / Suite | Command | Result |
| --- | --- | --- |
| TypeScript Type Check | `npx tsc --noEmit` | `0` errors (`TSC_EXIT:0`) |
| ESLint Check | `npm run lint` | `0` errors, `46` pre-existing warnings; zero new warnings (`LINT_EXIT:0`) |
| Production Build (Next.js 16.4.3 Turbopack) | `npm run build` | Compiled, TypeScript checked, `19/19` routes built cleanly (`BUILD_EXIT:0`) |
| Phase 6.5 Unit Verification | `node --test scripts/test-phase6-step5-scientific-intelligence.mjs` | `7/7` test groups passed, `0` failed (`P65_UNIT_EXIT:0`) |
| Phase 6.1–6.4 Regression Suites | `node --test scripts/test-phase6-step4-scanner-ui.mjs scripts/test-phase6-step3-1-hardening.mjs scripts/test-phase6-step3-live-discovery.mjs scripts/test-phase6-step2-discovery-atlas.mjs scripts/test-phase6-step1-types-and-profiles.mjs` | `109/109` tests passed, `0` failed (`P6_REGR_EXIT:0`) |
| Phase 3 Master Verification | `node scripts/test-phase3-master.mjs` | `12/12` suites passed (`P3_EXIT:0`) |
| Phase 4 Master Verification | `node scripts/test-phase4-master.mjs` | `5/5` suites passed (`P4_EXIT:0`) |
| Phase 6.4.1 Browser E2E Regression (Headless Chrome 157 CDP) | `node --test tests/e2e/discovery-scanner.spec.ts` | `10/10` E2E tests passed, `0` failed (`P64_E2E_EXIT:0`) |
| Phase 6.5 Scientific Intelligence Browser E2E (Headless Chrome 157 CDP) | `node --test tests/e2e/scientific-intelligence.spec.ts` | `2/2` E2E tests passed, `0` failed |

**Note on Phase 6.4.1 `E2E 6` Observation:** On an initial cold-cache run, `discovery-scanner.spec.ts` `E2E 6` timed past its `800ms` post-`Open-Meteo DEM` check because `"Open-Meteo DEM"` appears in the `/discover` page header text while the external request took ~`877ms` on cold fetch; with warm server cache, `E2E 6` and the full `10/10` `discovery-scanner.spec.ts` suite passed cleanly (`P64_E2E_EXIT:0`) without modifying Phase 6.4.1 test code.

---

## 10. Visual Browser Verification Screenshots (`artifacts/phase6-step5/`)

All 5 Playwright/Chrome CDP PNG captures were visually inspected via `read_file`:
- [`artifacts/phase6-step5/desktop-intel-explainability.png`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/artifacts/phase6-step5/desktop-intel-explainability.png): Verified desktop (`1440×900`) collapsible header, disclaimer banner, mission-specific interpretation, clean matching context (no false stale alert), and accessible sub-tabs.
- [`artifacts/phase6-step5/desktop-intel-checklist.png`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/artifacts/phase6-step5/desktop-intel-checklist.png): Verified side-by-side Mismatches/Unknowns/Contextual Limits cards (`UNKNOWN` separation) alongside Candidate Validation Checklist (`SUPPORTED`) and active amber Context Changed banner.
- [`artifacts/phase6-step5/desktop-intel-sensitivity.png`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/artifacts/phase6-step5/desktop-intel-sensitivity.png): Verified bounded `±25%` sensitivity analysis table (`Baseline mission weights`, `91.5% – 93.7%` tested range across `5` scenarios, unchanged `#1` set rank, explicit non-confidence-interval caveat).
- [`artifacts/phase6-step5/desktop-intel-atlas.png`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/artifacts/phase6-step5/desktop-intel-atlas.png): Verified curated Phase 6.2 Global Discovery Atlas intelligence, clean non-fabricated sensitivity unavailability banner, visible keyboard `:focus-visible` tab outline, and traceable source cards/limitations.
- [`artifacts/phase6-step5/mobile-intel.png`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/artifacts/phase6-step5/mobile-intel.png): Verified mobile (`375×812`) clean single-column wrapping, readable cards, and zero horizontal overflow.

---

## 11. Known Boundaries & Non-Goals (Next Phase Deferred)

- Regional live cells use ~445 m Copernicus DEM gradients, ~50 km MERRA-2 climatology, and 1:250k–1:5M Macrostrat geology polygons; TerraTwin cannot validate micro-scale rover trafficability, subterranean ice depth, mineral purity, or human-rating readiness.
- Full multi-variable Monte Carlo / Bayesian measurement-error propagation, field-campaign workflow submission, and PDF/CSV intelligence report export remain deferred to **Phase 6.6+** (not started here).
