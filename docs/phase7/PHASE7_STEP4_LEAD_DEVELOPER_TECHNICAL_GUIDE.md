# PHASE 7.4 — LEAD DEVELOPER TECHNICAL GUIDE (BEGINNER-FRIENDLY ARCHITECTURE WALKTHROUGH)

**Project:** TerraTwin  
**Team:** HEXARCHY (Lead Developer Guide)  
**Phase:** 7.4 — Judge Technical Defense & Six-Member Training  

> **Purpose:** Written specifically for the HEXARCHY Lead Developer so you can confidently explain every folder, file, equation, API route, database table, and architectural decision to technical judges — even if they ask you to open the codebase live!

---

## 1. How TerraTwin Works in Plain English (The 60-Second Mental Model)

Think of TerraTwin as a **4-stage pipeline**:

1. **The Reference Library (`src/lib/terratwin/data/`):** Holds the measurements for **5 Moon/Mars targets**, **8 famous Earth analog sites**, and **31 Global Atlas sites**.
2. **The Live Regional Scanner (`src/app/api/discover/route.ts` + `src/lib/terratwin/services/discovery-engine.ts`):** When a user draws a box on `/discover`, the server divides that box into up to **16 grid cells** and asks 3 live scientific APIs (**Open-Meteo** for elevation/slope, **NASA POWER** for climate, **Macrostrat** for geology) for measurements at each cell.
3. **The Math Judge (`src/lib/terratwin/scoring/similarity-engine.ts`):** Compares each Earth site's 12 measurements against the Moon/Mars target using the selected **Mission Profile's weights**. First, it checks the **40% Evidence Coverage Gate**: if less than 40% of the mission weight has real data, it refuses to guess (`score: null`). If at least 40% is present, it computes the exact `0–100%` similarity score.
4. **The Research Notebook & Exporters (`src/hooks/use-cloud-research-workspace.ts` + `src/lib/terratwin/reporting/research-exporters.ts`):** Lets the user save an immutable snapshot of their findings (with an `fnv1a` fingerprint), sync it to **Supabase PostgreSQL 17** (or browser `localStorage` when offline), and download a **PDF**, **CSV**, or **JSON** report.

---

## 2. File-by-File Code Map (Where Everything Lives)

If a judge asks *"Show me where X is implemented in your code"*, open these exact files:

| What the Judge Asks to See | Exact File to Open | Key Function / Constant to Point Out |
|---|---|---|
| **"Show me your similarity math and the 40% gate."** | `src/lib/terratwin/scoring/similarity-engine.ts` | `MIN_RELIABLE_COVERAGE_RATIO = 0.4` and `calculateSimilarity()` |
| **"Show me the 12 parameters and 4 mission profiles."** | `src/lib/terratwin/config/comparison-config.ts` | `COMPARISON_PARAMETERS` (12 items) and `CONFIGURABLE_MISSION_PROFILES` (4 profiles whose weights each sum to `1.0`) |
| **"Show me the 31-site Global Discovery Atlas."** | `src/lib/terratwin/data/global-discovery-atlas.ts` | `GLOBAL_DISCOVERY_ATLAS` (31 entries: 8 `canonical-benchmark` + 23 `under-explored-candidate`) and `getAtlasSummaryStatistics()` |
| **"Show me how the live regional scanner fetches NASA/DEM data."** | `src/lib/terratwin/services/discovery-engine.ts` | `runRegionalDiscoveryScan()`, `fetchElevationAndSlope()` (`open-meteo.ts`), `fetchNasaPowerClimatology()` (`nasa-power.ts`), `fetchMacrostratGeology()` (`macrostrat.ts`) |
| **"Show me how you calculate slope from elevation."** | `src/lib/terratwin/integrations/open-meteo.ts` | Queries 5 points (`center`, `north`, `south`, `east`, `west` at `±0.01°`) and applies the central finite-difference formula `Math.atan(Math.sqrt(dzDx^2 + dzDy^2))` |
| **"Show me your Multi-Site Portfolio Optimizer."** | `src/lib/terratwin/services/mission-suite-engine.ts` | `computeAnalogPortfolio()` — pairs sites and takes `Math.max(scoreA, scoreB)` for each parameter |
| **"Show me your Upstash Redis rate limiting and caching."** | `src/lib/terratwin/services/rate-limiter.ts` & `upstash-redis.ts` | `checkDistributedRateLimit()` (`12 req/min` on `/api/discover`) and `getCachedDiscoveryScan()` (24-hour TTL with in-memory fallback) |
| **"Show me your Supabase Cloud RLS security."** | `supabase/migrations/20261115000000_create_cloud_research_workspace.sql` | 4 tables (`research_records`, `research_assessment_revisions`, `research_tasks`, `research_notes`), 15 RLS policies checking `(select auth.uid()) = user_id`, and `prevent_revision_mutation_trigger` |
| **"Show me how PDF, CSV, and JSON exports work."** | `src/lib/terratwin/reporting/research-exporters.ts` | `generateResearchPdfBytes()`, `generateResearchCsvString()`, `generateResearchJsonString()`, and `sanitizeCsvCell()` |

---

## 3. How to Explain Our 3 Key Engineering Decisions

### Decision 1: Why TypeScript + Deterministic Math Instead of an LLM?
- **What to say:** *"In planetary science, if two researchers evaluate Jezero Crater against Lake Salda with the same mission weights, they must get the exact same score (`86.4%`) every single time. LLMs hallucinate numbers and change outputs between runs. By writing our tolerance functions and candidate intelligence in pure, deterministic TypeScript, our scores are 100% reproducible and auditable."*

### Decision 2: Why Dual-Mode Persistence (`localStorage` + Supabase Cloud RLS)?
- **What to say:** *"Hackathon judges need to test the app immediately without being forced through a sign-up wall, so browser `localStorage` works out-of-the-box. At the same time, real research teams need secure multi-device sync, so signing in with Supabase Auth syncs snapshots to PostgreSQL 17 with Row-Level Security and an immutable revision history."*

### Decision 3: Why Bounded Regional Grids (`<= 16` cells) Instead of Global Live Scraping?
- **What to say:** *"Querying NASA POWER, Open-Meteo, and Macrostrat for the entire planet in real time would take hours and get our IP banned. Instead, we curate a 31-site Global Atlas for instant global screening, and let researchers run live API scans on focused bounding boxes (`<= 16` cells, `<= 6° × 6°`) around candidate basins."*
