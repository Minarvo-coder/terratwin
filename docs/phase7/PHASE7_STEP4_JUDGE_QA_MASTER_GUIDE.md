# PHASE 7.4 — JUDGE Q&A MASTER GUIDE (30 TOUGH QUESTIONS & ANSWERS)

**Project:** TerraTwin  
**Team:** HEXARCHY (Six Members)  
**Phase:** 7.4 — Judge Technical Defense & Six-Member Training  

> **How to Use This Guide:** Every question includes a **Short Answer (15–20 seconds)** for rapid live Q&A and a **Detailed Technical/Scientific Follow-Up** if a judge asks to go deeper, plus the designated **HEXARCHY Responder**.

---

## Category A — Scientific Methodology & Mathematical Validity

### Q1. How do you actually calculate the similarity percentage between Mars or the Moon and an Earth site?
- **Responder:** Member 1 (Lead Dev) or Member 2 (Planetary Science Lead)
- **Short Answer:** We compare 12 environmental parameters using deterministic tolerance functions — linear tolerance for bounded variables like temperature and slope, base-10 log tolerance for multi-order variables like precipitation and grain size, and symmetric affinity matrices for categorical geology. We then compute the mission-weighted average over available parameters, provided coverage is at least 40%.
- **Detailed Follow-Up:** Specifically, for each parameter $i \in \{1..12\}$ with mission weight $w_i$, we compute a normalized similarity $s_i \in [0,1]$. If the weighted coverage ratio $C = \sum_{i \in V} w_i \ge 0.40$, the composite score is $\text{round}\left(100 \times \frac{\sum_{i \in V} w_i s_i}{\sum_{i \in V} w_i}, 1\right)$. Every weight vector sums to $1.00$ in `comparison-config.ts`.

### Q2. Why did you choose 40% (`0.40`) as the minimum evidence coverage threshold?
- **Responder:** Member 2 (Planetary Science Lead)
- **Short Answer:** In live regional scans, satellite APIs like Open-Meteo and NASA POWER reliably supply topography and climate (~35%–45% of weights), while sub-meter field traits like boulder abundance or grain size are unavailable. A 40% gate allows rover-topography screening (`45%` coverage) while blocking geological or astrobiological rankings (`15%` coverage) when bedrock mineralogy is unknown.
- **Detailed Follow-Up:** Without the 40% gate, a grid cell that only matched air temperature (`w = 0.05`) could display a misleading `95%` overall match! Setting `MIN_RELIABLE_COVERAGE_RATIO = 0.40` prevents single-feature noise from producing false discoveries.

### Q3. Why did your live scan of Lake Salda return `Insufficient data to rank reliably (15% coverage)` under `Geological Research` when Lake Salda is a famous Mars analog?
- **Responder:** Member 3 (Geospatial & Live Data Lead)
- **Short Answer:** That is our favorite demonstration of scientific honesty! In the curated Atlas, Lake Salda has peer-reviewed hydromagnesite/evaporite mineralogy and scores `86.4%`. In a *blind live API scan* of Turkey, Macrostrat only returns `"Pliocene undifferentiated"`, which we map to `null`. Since lithology (`30%`) and mineralogy (`25%`) are missing, coverage is `15%`, so TerraTwin refuses to guess!
- **Detailed Follow-Up:** If we switch that exact same live Lake Salda bounding box to `rover-testing`, Open-Meteo Copernicus DEM slope (`25%`) and elevation (`10%`) plus NASA POWER temperature (`10%`) yield `45%` coverage (`>= 40%`), producing a valid `65.0%` exploratory score (`isVerified: false`).

### Q4. Why use logarithmic normalization for precipitation and grain size instead of linear normalization?
- **Responder:** Member 1 (Lead Dev)
- **Short Answer:** Because annual precipitation and regolith grain size span multiple orders of magnitude — from $0\text{ mm}$ on Mars to $2\text{ mm/yr}$ in the Atacama to $1,000\text{ mm/yr}$ in temperate basins. A linear scale would crush all hyper-arid differences into 99.9%. Base-10 logarithmic tolerance ($\log_{10}(\max(x, \epsilon))$) captures order-of-magnitude physical regimes accurately.
- **Detailed Follow-Up:** In `similarity-engine.ts`, `annualPrecipMm` uses $\epsilon = 0.1\text{ mm}$ and $\tau_{\log} = 4.0$ (4 orders of magnitude), and `grainSizeMm` uses $\epsilon = 0.001\text{ mm}$ and $\tau_{\log} = 3.0$.

### Q5. No place on Earth has 0.16g lunar gravity, 0.38g Martian gravity, or a hard vacuum. How can any Earth site score 85% or 92%?
- **Responder:** Member 2 (Planetary Science Lead)
- **Short Answer:** A TerraTwin similarity score measures **mission-specific terrestrial surface affinity** across the 12 environmental parameters that vary across Earth's surface — not atmospheric pressure or gravity. We explicitly document on `/methodology` and in every exported report that vacuum ($3\times 10^{-15}\text{ bar}$), reduced gravity, and unshielded galactic cosmic rays require laboratory vacuum chambers or parabolic flights.
- **Detailed Follow-Up:** Notice that against **Shackleton Crater Rim** (`-183°C`, lunar vacuum radiation), even our #1 Earth site (**McMurdo Dry Valleys**) only scores **`66.5%`** under `lunar-base-construction` because Earth's temperature and surface radiation regime diverge sharply from the Lunar South Pole.

### Q6. How do you compute the Multi-Site Analog Portfolio score? Is it just the average of two sites?
- **Responder:** Member 2 (Planetary Science Lead)
- **Short Answer:** No — averaging two sites would penalize specialization! Instead, a two-site field campaign tests each subsystem at the site best suited for that parameter. For each parameter $i$, the portfolio takes $\max(s_{A,i}, s_{B,i})$ and computes the mission-weighted sum.
- **Detailed Follow-Up:** For **Gale Crater (`rover-testing`)**, **Atacama Desert** (`80.6%`) excels in hyper-arid climate and grain size, while **Haughton Impact Structure** (`79.5%`) excels in impact-breccia rock abundance and slope. Together, **Atacama + Haughton = `90.3%`** (`+9.7%` synergy gain over Atacama alone).

---

## Category B — Live Regional Discovery & Data Sources

### Q7. Which datasets in TerraTwin are fetched live from external APIs versus stored locally?
- **Responder:** Member 3 (Geospatial & Live Data Lead)
- **Short Answer:** Our 5 planetary targets, 8 canonical benchmarks, and 31-site Global Atlas are stored as curated, deterministic TypeScript baselines with literature citations. When a user runs a bounded scan on `/discover`, `/api/discover` makes **live HTTP calls** to **Open-Meteo Copernicus DEM**, **NASA POWER Climatology**, and **Macrostrat Geology**.
- **Detailed Follow-Up:** Every parameter in the UI displays an explicit provenance badge showing whether it came from a curated reference (`isVerified: true`) or a live API grid cell (`isVerified: false`).

### Q8. How do you compute topographic slope from an elevation API that only returns point elevations?
- **Responder:** Member 3 (Geospatial & Live Data Lead)
- **Short Answer:** For every grid cell center `(lat, lon)`, `open-meteo.ts` queries 5 points simultaneously in a single batched request: the center point plus North, South, East, and West offsets at $\pm 0.01^\circ$ (~$1.11\text{ km}$ baseline). We then apply a central finite-difference stencil corrected for latitude ($\cos(\text{lat})$) to compute the gradient vector and slope angle in degrees.
- **Detailed Follow-Up:** Specifically, $\Delta y = 2 \times 0.01^\circ \times 111,320\text{ m}$ and $\Delta x = \Delta y \cdot \cos(\text{lat})$. Then $\text{slope}_{\text{deg}} = \arctan\left(\sqrt{(\Delta z_{\text{NS}}/\Delta y)^2 + (\Delta z_{\text{EW}}/\Delta x)^2}\right) \cdot \frac{180}{\pi}$.

### Q9. What happens if NASA POWER, Open-Meteo, or Macrostrat is slow or goes offline during a live demo?
- **Responder:** Member 1 (Lead Dev)
- **Short Answer:** Every external API call has a strict `4,500 ms` `AbortController` timeout and concurrency limit (`3` cells at a time). If a provider fails or times out, TerraTwin does not crash or invent data — it sets that provider's fields to `null`, appends a human-readable warning banner in the UI, and lets the 40% coverage gate decide whether enough evidence remains. Furthermore, repeated scans of the same region are served in `<50 ms` from our 24-hour Upstash Redis cache.

### Q10. Why do you limit live regional scans to 16 cells and a 6° × 6° bounding box?
- **Responder:** Member 3 (Geospatial & Live Data Lead)
- **Short Answer:** Each grid cell queries 3 external scientific APIs (including 5 elevation points per cell). Limiting scans to `16` cells (`4×4` grid), `<= 6° × 6°`, and `>= 0.25°` spacing ensures scans finish within a few seconds and respects fair-use rate limits on public NASA POWER, Open-Meteo, and Macrostrat servers.

### Q11. Did TerraTwin automatically discover the 31 sites in the Global Discovery Atlas using the live scanner?
- **Responder:** Member 4 (Global Atlas & Provenance Lead)
- **Short Answer:** No — and we state that distinction explicitly in the UI and documentation! The 31 sites in the Global Discovery Atlas (`8` canonical benchmarks + `23` under-explored candidates across `18` countries and `9` categories) are **literature-curated sites** compiled from peer-reviewed planetary analog studies. The Live Regional Scanner is used to screen bounded regions *around* those sites or in new user-defined coordinates.

### Q12. Why did you include 23 "under-explored candidates" alongside the 8 famous benchmarks?
- **Responder:** Member 4 (Global Atlas & Provenance Lead)
- **Short Answer:** Most mission teams default to the same handful of famous sites (Atacama, McMurdo, Devon Island), which can be logistically expensive or geopolitically restricted. By curating 23 additional sites across 18 countries — such as the **Qaidam Basin** and **Tibetan Plateau** in China, **Lonar Crater** in India, **Samail Ophiolite** in Oman, and **Laguna Negra** in Argentina — researchers can discover accessible regional alternatives.

---

## Category C — Software Architecture, Security & Cloud Persistence

### Q13. How does your Research Workspace persist data, and how do you protect user privacy?
- **Responder:** Member 1 (Lead Dev) or Member 6 (Research Workflow & QA Lead)
- **Short Answer:** We use a dual-layer persistence architecture: browser `localStorage` for instant zero-login offline usage, plus **Supabase Auth and PostgreSQL 17** for authenticated cloud synchronization. Every database table enforces strict **Row-Level Security (`(select auth.uid()) = user_id`)** on `SELECT`, `INSERT`, `UPDATE`, and `DELETE`, so User A can never read or modify User B's research records.

### Q14. What makes your research assessment revisions "immutable"?
- **Responder:** Member 6 (Research Workflow & QA Lead)
- **Short Answer:** When a researcher saves or re-captures an assessment, we compute a deterministic FNV-1a integrity digest (`fnv1a-xxxxxxxx`) over the snapshot payload (`schemaVersion: "1.0.0"`) and append a new revision row to `research_assessment_revisions`. In PostgreSQL 17, a `BEFORE UPDATE OR DELETE` trigger (`prevent_revision_mutation_trigger`) blocks any modification or deletion of historical revisions at the database level.

### Q15. How do you prevent API abuse on `/api/discover` and `/api/compare` in serverless deployments?
- **Responder:** Member 1 (Lead Dev)
- **Short Answer:** We implemented a distributed sliding-window rate limiter and 24-hour scan cache backed by **Upstash Redis REST API** (`12 req/min` per IP on `/api/discover`, `60 req/min` on `/api/compare`), with automatic fallback to an in-memory rate limiter and cache if Redis is unreachable.

### Q16. Are any secret API keys exposed to the browser?
- **Responder:** Member 1 (Lead Dev)
- **Short Answer:** Zero secret keys are exposed to the client. `UPSTASH_REDIS_REST_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are strictly server-only environment variables (`import "server-only"`). The browser only receives `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which is designed by Supabase to work safely alongside PostgreSQL Row-Level Security.

### Q17. What happens if a judge's laptop does not support WebGL for the 3D Moon/Mars globe?
- **Responder:** Member 5 (UI/UX & Visualization Lead)
- **Short Answer:** `PlanetaryGlobe` automatically detects WebGL availability and includes a manual **3D Globe / 2D Map** toggle. If WebGL is unavailable or disabled, it seamlessly renders our interactive **2D Equirectangular Planetary Telemetry Grid** with clickable target reticles and full keyboard accessibility.

---

## Category D — Exports, Reproducibility & Real-World Impact

### Q18. What is inside the exported PDF, CSV, and JSON files, and how do you prevent CSV injection?
- **Responder:** Member 6 (Research Workflow & QA Lead)
- **Short Answer:** The **PDF** is a multi-section vector dossier (`jsPDF`) with executive summary, integrity digest, 12-parameter table, and field validation checklist. The **CSV** is an RFC 4180 table with UTF-8 BOM where any string starting with `=`, `+`, `-`, or `@` is prefixed with a single quote (`'`) to prevent spreadsheet formula injection. The **JSON** is a complete schema-versioned (`1.0.0`) reproducible research package.

### Q19. Does TerraTwin use LLMs or generative AI to generate similarity scores or scientific explanations at runtime?
- **Responder:** Member 1 (Lead Dev)
- **Short Answer:** **No.** Every similarity score, coverage ratio, primary driver, limiting mismatch, and field validation recommendation is 100% deterministic TypeScript logic (`similarity-engine.ts` and `candidate-intelligence.ts`). Running the same target, site, and mission profile will produce the exact same number to the tenth of a percent every time.

### Q20. If you had 6 more months with NASA mentors, what would you add next?
- **Responder:** All Members (Lead: Member 2)
- **Short Answer:** Three priorities:
  1. Integrate global orbital spectroscopy (such as **EMIT** hyperspectral mineralogy and **ASTER** thermal inertia) into `/api/discover` so live regional scans outside North America can achieve `>= 40%` geological coverage without relying solely on Macrostrat.
  2. Add seasonal/monthly time-series filtering in NASA POWER so field teams can pick the best month of the year to deploy.
  3. Allow field researchers to upload in-situ rover/drone measurements (grain size, rock abundance) as verified revisions in the Cloud Research Workspace.
