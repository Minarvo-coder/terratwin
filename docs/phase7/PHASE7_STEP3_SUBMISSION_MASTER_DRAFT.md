# PHASE 7.3 — NASA SPACE APPS SUBMISSION MASTER DRAFT

**Project Title:** TerraTwin — Planetary & Terrestrial Analog Intelligence Engine  
**Team Name:** HEXARCHY (Six Members)  
**Challenge:** *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars."*  

> **How to Use This File:** Copy and paste each section directly into the corresponding field on the official NASA Space Apps Challenge Project Submission Dashboard (`spaceappschallenge.org`).

---

## 1. High-Level Project Summary (Short Description / Tagline)

> **Character-Constrained Version (160 chars):**  
> Deterministic Earth-analog discovery & mission-readiness workstation for Moon & Mars targets using live NASA POWER, Copernicus DEM, Macrostrat, & 31 Atlas sites.

> **Paragraph Version (75 words):**  
> **TerraTwin** is a scientific Earth analog discovery and mission-readiness platform for Lunar and Martian exploration. It evaluates terrestrial environments against **5 verified Moon and Mars targets** across **12 environmental parameters** and **4 mission profiles**. TerraTwin combines **8 canonical benchmarks**, a **31-site Global Discovery Atlas** across **18 countries**, and a **Live Regional Discovery Scanner** powered by **NASA POWER**, **Open-Meteo Copernicus DEM**, and **Macrostrat**, enforcing a strict **40% reliable evidence-coverage gate** and exporting reproducible **PDF, CSV, and JSON** research dossiers.

---

## 2. Detailed Project Description — How We Addressed the Challenge

### The Scientific Problem
Every planetary surface mission — from the **Perseverance** rover in **Jezero Crater Delta** to future **Artemis** lunar base habitats on the **Shackleton Crater Rim** — relies on terrestrial analog field sites to test mobility, drilling, in-situ resource utilization (ISRU), and astrobiological instruments. However:
1. **No single place on Earth replicates the Moon or Mars.** An analog site that is ideal for rover slope and regolith mechanics may be completely unsuitable for carbonate astrobiology or polar volatile extraction.
2. **Analog selection is fragmented.** Mission planners must manually cross-reference scattered academic papers, geologic maps, and climate tables without a unified, reproducible scoring framework.
3. **Missing data distorts rankings.** When remote candidate regions lack public bedrock or grain-size measurements, naive scoring tools silently substitute default values or present high similarity scores with low data coverage.

### How TerraTwin Solves It
TerraTwin turns planetary analog selection into a transparent, deterministic, and reproducible scientific workflow across two core workstations:

1. **Mission-Weighted Deterministic Similarity Engine (`/explore` & `/discover`):**
   - Compares **12 environmental parameters** — 8 continuous parameters (`meanTempC`, `diurnalTempRangeC`, `annualPrecipMm`, `elevationM`, `slopeDeg`, `rockAbundancePct`, `grainSizeMm`, `albedo`) normalized via linear or base-10 logarithmic tolerance functions, and 4 categorical parameters (`lithology`, `mineralogy`, `waterIceRegime`, `radiationRegime`) scored via symmetric domain-affinity matrices.
   - Evaluates sites under **4 explicit mission profiles**: `rover-testing`, `geological-research`, `lunar-base-construction`, and `astrobiology-habitability`. Switching the mission profile dynamically re-weights the exact same environmental vectors — for example, against **Jezero Crater Delta**, **Haughton Impact Structure (`81.4%`)** and **Lake Salda (`81.1%`)** lead under `rover-testing`, whereas **Atacama Desert (`92.6%`)** and **Haughton (`90.1%`)** lead under `geological-research`.

2. **Multi-Site Analog Portfolio Optimizer (`/explore`):**
   - Recognizes that no single Earth site covers every engineering and scientific variable. TerraTwin evaluates 2-site terrestrial combinations using parameter-wise best coverage ($\max(s_{A,i}, s_{B,i})$). For **Gale Crater (`rover-testing`)**, combining **Atacama Desert (`80.6%`) + Haughton Impact Structure (`79.5%`)** achieves a **`90.3%` portfolio score (`+9.7%` synergy gain)**.

3. **Live Regional Discovery Scanner & The 40% Evidence Gate (`/discover`):**
   - Users draw or enter any bounded WGS84 region (`<= 16` cells, `<= 6° × 6°`) to screen candidate terrain using live **Open-Meteo Copernicus DEM (90 m)** (computing topographic slope via a 5-point central-difference stencil), **NASA POWER Climatology**, and **Macrostrat Geology**.
   - **Strict Epistemic Honesty:** TerraTwin never fabricates missing measurements. If weighted data coverage falls below **`40%` (`MIN_RELIABLE_COVERAGE_RATIO = 0.40`)**, the engine **withholds the similarity score (`score = null`)**. For example, a live `2×2` scan of Lake Salda, Turkey under `geological-research` returns **`15%` coverage** (because Macrostrat returns `"Pliocene undifferentiated"` outside North America, leaving `lithology` and `mineralogy` `null`) and honestly refuses to rank the cells — whereas switching to `rover-testing` raises coverage to **`45%` (`>= 40%`)** via DEM slope and elevation and computes a **`65.0%` exploratory score (`isVerified: false`)**.

4. **31-Site Global Discovery Atlas (`/discover`):**
   - Pairs live regional scanning with a curated Global Atlas of **31 terrestrial sites** (**8 canonical benchmarks + 23 under-explored candidates**) across **18 countries/territories** and **9 analog categories** (including **Tibetan Plateau — Qinghai at `92.3%`** and **Svalbard — Spitsbergen at `91.7%`** for Jezero Crater Delta geological research).

5. **Candidate Scientific Intelligence & Reproducible Cloud Research Workspace:**
   - Generates deterministic primary drivers, key mismatches, missing high-weight evidence alerts (`weight >= 0.05`), and field validation priorities (`critical` vs. `recommended`).
   - Saves immutable, FNV-1a integrity-digested research snapshots (`schemaVersion: "1.0.0"`), syncs across authenticated user sessions via **Supabase PostgreSQL 17 Row-Level Security (RLS)** (with seamless offline `localStorage` fallback), and exports structured **PDF**, **CSV**, and **JSON** dossiers.

---

## 3. How We Used NASA & Partner Space Agency Data

1. **NASA Langley Research Center POWER API (`power.larc.nasa.gov/api/temporal/climatology/point`):**
   - Live retrieval of long-term terrestrial climatology (`T2M` mean temperature, `T2M_RANGE` diurnal temperature range, `PRECTOTCORR` annual precipitation, `ALLSKY_SFC_SW_DWN` solar irradiance, `ALLSKY_SFC_UV_INDEX`, and `SRF_ALB` surface albedo).
2. **NASA Planetary Data System (PDS) — Mars Reconnaissance Orbiter (MRO / CRISM / HiRISE), Mars Global Surveyor (MOLA), Perseverance (Mars 2020), and Curiosity (MSL):**
   - Reference target baselines for **Jezero Crater Delta**, **Gale Crater**, and **Valles Marineris — Coprates Chasma**.
3. **NASA Lunar Reconnaissance Orbiter (LRO — LOLA Laser Altimeter & Diviner Lunar Radiometer) and Apollo Sample Reference Data:**
   - Reference target baselines for **Shackleton Crater Rim** (Lunar South Pole) and **Mare Tranquillitatis**.
4. **ESA Copernicus DEM (GLO-90) via Open-Meteo Elevation API (`api.open-meteo.com/v1/elevation`):**
   - Live 90-meter digital elevation model sampling (`5` points per grid cell: center + `±0.01°` N/S/E/W offsets) to derive both `elevationM` and local topographic `slopeDeg`.
5. **Macrostrat Geologic Map API (`macrostrat.org/api/v2/geologic_units/map`):**
   - Live geologic unit, lithology, and stratigraphic age queries for bounded regional scans.

---

## 4. Tools, Languages, and Technologies Used

- **Frontend & Framework:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Geospatial & 3D Visualization:** Three.js / `@react-three/fiber` / `@react-three/drei` (3D Moon/Mars Globe with 2D Telemetry Grid fallback), React-Leaflet / Leaflet (Dark-Canvas Earth Analog & Regional Grid Maps), Recharts (Multi-Parameter Radar Profiles)
- **Backend & Distributed Reliability:** Next.js Serverless API Routes, Upstash Redis REST API (sliding-window rate limiting & 24h normalized scan cache with in-memory fallback)
- **Cloud Database & Security:** Supabase Auth + PostgreSQL 17 with strict `auth.uid() = user_id` Row-Level Security (RLS) and immutable revision triggers (`prevent_revision_mutation_trigger`)
- **Reporting & QA:** `jsPDF` (vector PDF dossiers), RFC 4180 CSV exporter, Schema-Versioned JSON packages, Headless Chrome DevTools Protocol (CDP) end-to-end browser verification

---

## 5. AI-Assisted Development Disclosure (Space Apps Transparency Statement)

Generative AI coding assistants were used during development to assist with TypeScript scaffolding, UI layout structuring, automated browser test authoring, and documentation formatting. All mathematical similarity equations, tolerance thresholds, mission profile weight vectors, 40% evidence-coverage gating logic, and live API integrations (`NASA POWER`, `Open-Meteo Copernicus DEM`, `Macrostrat`) are 100% deterministic TypeScript functions verified against real scientific datasets and automated regression suites. No scientific observations or similarity scores are generated by AI models.

---

## 6. Project Links (Placeholders for Final Submission Form)

- **GitHub Repository URL:** `[Insert Public GitHub Repository URL]`
- **Live Deployed Demo URL:** `[Insert Public Vercel URL or Local Demo Link]`
- **30-Second Global Submission Video Demo URL (with English Subtitles):** `[Insert Public YouTube / Vimeo / Google Drive Link]`
- **7-Slide Global Presentation Deck URL (Alternative / Backup):** `[Insert Public Slide Deck Link]`
