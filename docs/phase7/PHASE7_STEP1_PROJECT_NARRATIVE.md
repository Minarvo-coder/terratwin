# TERRATWIN — PHASE 7.1: PROJECT NARRATIVE & PITCH HIERARCHY
**Project:** TerraTwin — Planetary Analog Discovery & Research Platform  
**Team:** HEXARCHY (Six Members)  
**Official Challenge:** *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars."*  
**Core Thesis:** **TerraTwin connects planetary mission objectives to Earth analog discovery, scientific evidence, and reproducible research workflows while clearly identifying uncertainties.**

---

## 1. Narrative Hierarchy (One-Sentence to Five-Minute Explanations)

### 1.1 One-Sentence Project Description
**TerraTwin** is a deterministic scientific web platform that connects Moon and Mars mission objectives to terrestrial analog discovery, multi-site portfolio optimization, and reproducible validation reports while explicitly separating similarity scores from evidence coverage and field verification.

---

### 1.2 15-Second Elevator Pitch (~35 Words)
Before hardware or crews travel to the Moon or Mars, they must be tested on Earth—yet no single Earth site replicates an extraterrestrial world. **TerraTwin** helps researchers discover, compare, and combine Earth analog environments using NASA, ESA, and geospatial datasets while honestly surfacing missing data and physical limitations.

---

### 1.3 30-Second Pitch (~75 Words)
When mission teams prepare for Mars or a permanent lunar base, choosing terrestrial test sites is hampered by fragmented datasets and a basic physical truth: **no single location on Earth is a complete twin of the Moon or Mars**. **TerraTwin** solves this by uniting a **31-site Global Discovery Atlas**, a **Live Regional Discovery Scanner**, and a **Combinatorial Multi-Site Portfolio Optimizer** across four mission profiles. Every comparison is deterministic, enforces a strict **40% evidence-coverage gate**, never replaces missing data with zero, and exports reproducible PDF, CSV, and JSON research reports.

---

### 1.4 60-Second Pitch (~150 Words)
Testing rovers, drills, and habitats for the Moon or Mars requires terrestrial field analogs, but planetary and Earth observation datasets live in separate silos with incompatible units and vertical datums. Worse, no single Earth environment matches all extraterrestrial conditions simultaneously: Iceland’s Askja lava field matches lunar basaltic terrain (`85.1%` geological similarity to Mare Tranquillitatis), whereas Antarctica’s McMurdo Dry Valleys match extreme polar cold (`66.5%` lunar-base similarity to Shackleton Crater Rim).

**TerraTwin**, built by **Team HEXARCHY**, connects planetary mission objectives directly to Earth analog discovery and reproducible research:
1. **Four Mission Profiles:** Dynamically weights 12 environmental features for *Rover Testing*, *Geological Research*, *Lunar Base Construction & ISRU*, and *Astrobiology & Habitability*.
2. **Two-Tier Discovery:** Combines a curated **31-site Global Discovery Atlas** (8 canonical benchmarks + 23 under-explored sites across 18 countries and 9 analog categories) with a **Live Regional Discovery Engine** (`/discover`) powered by Open-Meteo Copernicus DEM, NASA POWER climatology, and Macrostrat geology.
3. **Scientific Honesty & Reproducibility:** Enforces a **40% coverage threshold**, keeps unvisited grid cells marked `isVerified: false`, diagnoses parameter mismatches in **Scientific Intelligence**, and exports cryptographic-digest **PDF, CSV, and JSON research snapshots**.

---

### 1.5 Two-Minute Scientific Explanation (~280 Words)
Planetary analog selection is fundamentally a **multi-objective, uncertainty-aware inverse problem**. Earth has a $1\text{ g}$ gravity field, a $\sim 101\text{ kPa}$ nitrogen-oxygen atmosphere, and an active hydrologic cycle; Mars has a $0.38\text{ g}$ gravity field and a $\sim 610\text{ Pa}$ $\text{CO}_2$ atmosphere; the Moon is a $0.166\text{ g}$ hard vacuum ($\sim 3 \times 10^{-10}\text{ Pa}$) with a 29.5-Earth-day synodic illumination cycle.

Because no terrestrial site reproduces all of these regimes at once, **TerraTwin** introduces four scientific safeguards:
1. **4-Tier Scientific Comparability Framework:** We classify 12 environmental dimensions into *Directly Comparable* (mean temperature, solar irradiance, rock abundance, albedo, grain size, vegetation baseline), *Comparable After Transformation* (diurnal thermal swing, topographic slope), *Proxy-Based* (petrological lithology taxonomy), and *Physically Non-Comparable* (`surfacePressurePa` and `annualPrecipitationMm`, which are assigned weight `0.00` so Earth’s air pressure and rainfall never corrupt planetary similarity math; `elevationM` is excluded in `geological-research`, `lunar-base-construction`, and `astrobiology-habitability` because planetary reference datums are physically distinct equipotentials).
2. **Mission-Dependent Similarity:** A site that is strong for *Geological Research* (where `lithology` carries `30%` weight) may differ from the best site for *Rover Testing* (where `meanSlopeDeg` carries `25%` and `rockAbundancePct` carries `20%`) or *Lunar Base Construction & ISRU* (where `meanSlopeDeg` is `25%`, `rockAbundancePct` is `20%`, and `surfaceSolarIrradianceWm2` is `15%`).
3. **Strict Missing-Data & Coverage Discipline:** Missing measurements remain `null` (`missing_data`) and are never coerced to `0`. Weighted coverage is computed separately from similarity: if available comparable features represent less than **40% of active mission weight** (`MIN_RELIABLE_COVERAGE = 0.40`), TerraTwin refuses to output a numerical similarity score (`score: null`, `"Insufficient data to rank reliably"`).
4. **Portfolio Synergy & Validation Workflows:** On `/explore`, our combinatorial optimizer evaluates $\binom{n}{k}$ site pairs and trios (e.g., pairing **Atacama Desert + Haughton Impact Structure** for Gale Crater rover testing achieves **`90.3%`** composite fidelity, a **`+8.2` percentage-point gain** over the top single site Lake Salda at `82.1%`). On `/discover`, researchers inspect feature-level **Scientific Intelligence**, run bounded $\pm 25\%$ weight sensitivity checks, log follow-up field tasks without falsely upgrading verification status, and export immutable **PDF, CSV, and JSON research assessments**.

---

### 1.6 Five-Minute Technical Explanation (~650 Words)

#### 1. The Scientific & Engineering Problem
Planetary scientists and mission engineers preparing for lunar South Pole operations (e.g., *Shackleton Crater Rim*) or Martian basin exploration (*Jezero Crater Delta*, *Gale Crater*, *Meridiani Planum*) must select terrestrial field environments for rover trafficability trials, instrument calibration, ISRU regolith processing, and astrobiological sampling. Existing workflows suffer from three gaps:
- **Siloed Data & Incompatible Datums:** Planetary laser altimetry (MGS MOLA, LRO LOLA) and rover weather stations (Curiosity REMS, Perseverance MEDA) are rarely integrated with terrestrial climatology (NASA POWER), digital elevation models (Copernicus GLO-90 / SRTM), and geological maps (Macrostrat) under explicit physical comparability rules.
- **Over-Reliance on a Handful of Famous Sites:** Field campaigns repeatedly revisit a small set of canonical sites while overlooking high-potential analogs across global evaporitic, periglacial, volcanic, and serpentinizing environments.
- **Conflation of Screening Leads with Verified Analogs:** Automated tools often fabricate missing values or treat coarse remote-sensing proxies as field-certified measurements.

#### 2. How TerraTwin Solves It (System Architecture)
TerraTwin is built on **Next.js 16.4.3 (App Router)**, **React 19.3**, **TypeScript 5**, **Tailwind CSS 4**, **Three.js**, **Leaflet / React-Leaflet**, **Recharts**, **Supabase PostgreSQL 17 (with Row Level Security)**, and **Upstash Redis**.

- **Dual Flight Deck & Multi-Site Portfolio Optimizer (`/explore`):**
  - Renders an interactive 3D WebGL globe of Mars and the Moon (`planetary-globe.tsx`) with spherical camera slerp and a custom GLSL Rayleigh limb shader on Mars (and zero atmospheric glow on the Moon).
  - Synchronizes with a 2D Leaflet Earth GIS map streaming 6 **NASA GIBS WMTS** layers (MODIS True Color, NDVI, Day LST, SWIR Bands 7-2-1, ASTER GDEM, Dark Canvas).
  - Includes a **5-Axis Terrain Comparison Workspace**, a **Geodesic Slerp Elevation Profile Engine** (`/api/elevation`) sampling local binary MOLA/LOLA rasters (`raw-data/dem/*.bin`) with Horn (1981) $3\times 3$ slope gradients, a **5-Stage Evidence Lineage Explorer**, and the **Mission Suite Portfolio Optimizer** (`/api/portfolio`).
- **Global Discovery Atlas & Live Regional Discovery Scanner (`/discover`):**
  - **Tier 1 — Curated Global Discovery Atlas (`discovery-atlas.ts`):** Catalogs **31 curated Earth candidate sites** (`8` canonical benchmarks + `23` under-explored analogs across `18` countries/territories and all `9` analog categories: `salt-flats-evaporites`, `polar-permafrost`, `volcanic-fields`, `impact-craters`, `high-altitude-plateaus`, `glacial-outwash`, `lava-tubes-caves`, `dry-river-deltas`, and `serpentinizing-acidic-mineral-systems`).
  - **Tier 2 — Live Regional Discovery Engine (`POST /api/discover`):** Tessellates a user-selected bounding box ($\le 10^\circ \times 10^\circ$, up to 100 cells) using integer grid stepping (`grid-generator.ts`) and concurrently queries:
    1. **Open-Meteo / Copernicus DEM GLO-90 (`elevation-connector.ts`):** Computes terrain slope via a 5-point cardinal central-difference stencil ($\Delta = 0.002^\circ \approx 445\text{ m}$ span) with zonal $\cos(\text{lat})$ scaling and a polar singularity guard ($|\text{lat}| \ge 89.5^\circ \rightarrow \text{null}$).
    2. **NASA POWER 25-Year Climatology (`nasa-power-connector.ts`):** Extracts `T2M` (`meanSurfaceTempC`), `TS_RANGE` (`diurnalTempRangeC`), `ALLSKY_SFC_SW_DWN` (converted from $\text{kW-hr/m}^2\text{/day}$ to $\text{W/m}^2$ via $\times 1000/24$), and `PRECTOTCORR` (`\times 365\text{ mm/yr}` context), honoring dynamic `header.fill_value` filtering.
    3. **Macrostrat Geologic Map API v2 (`macrostrat-connector.ts`):** Maps regional bedrock polygons into TerraTwin’s lithology taxonomy while excluding ultramafic rocks (`peridotite`, `serpentinite`) from `felsic-crystalline` and returning `null` for ambiguous mixed units (`"Pliocene undifferentiated"`).
  - Protected by a shared **Upstash Redis** sliding-window rate limiter (`20 req / 60s`) and deterministic SHA-256 response cache (`15 min` TTL, skipping any incomplete provider run).
- **Scientific Intelligence & Reproducible Research Workspace:**
  - **Candidate Intelligence (`candidate-intelligence-service.ts`):** Generates deterministic feature-level explanations, mismatch diagnostics, evidence-quality grades, and bounded $\pm 25\%$ single-feature weight sensitivity analysis.
  - **Research Workspace (`research-snapshot-service.ts` + `cloud-research-workspace-service.ts`):** Captures immutable assessment revisions with FNV-1a 64-bit integrity digests (`fnv64-...`), tracks follow-up field tasks (`observationStatus: "recommended-not-completed"`), stores user-authored notes separately from measured telemetry, synchronizes per-user records to **Supabase PostgreSQL 17 with Row Level Security**, and exports **11-section PDF reports**, **4 formula-hardened CSV files**, and **JSON snapshots**.

---

## 2. Core Questions Answered Honesty & Directly

| Judge Question | Verified TerraTwin Answer |
| :--- | :--- |
| **What is the problem?** | Selecting Earth analog sites for Moon and Mars missions is hindered by fragmented datasets, incompatible physical datums, over-reliance on a few well-known sites, and the physical reality that no single Earth site replicates all planetary conditions simultaneously. |
| **Why does it matter?** | Every rover wheel, drill, habitat foundation, and astrobiology instrument must be tested on Earth before launch. Choosing an inappropriate analog or ignoring a key environmental mismatch risks hardware failure or miscalibrated instruments. |
| **How does TerraTwin solve it?** | By combining mission-weighted similarity scoring (4 profiles), multi-site portfolio optimization ($\binom{n}{k}$), a 31-site Global Discovery Atlas across 9 analog categories, live regional geospatial screening (`/discover`), feature-level Scientific Intelligence, and reproducible PDF/CSV/JSON research reports. |
| **What data does it use?** | 10 cataloged NASA/ESA/USGS archives in the core repository (MGS MOLA, LRO LOLA, MSL REMS, Mars 2020 MEDA, LRO Diviner, MER Opportunity Athena, Apollo CCGE/LRO LAMP, NASA POWER, SRTM/Copernicus DEM, MODIS Terra) plus live Open-Meteo Copernicus DEM GLO-90, NASA POWER Climatology API v2.10.1, Macrostrat API v2, and NASA GIBS WMTS imagery. |
| **What makes its approach useful & innovative?** | (1) Explicit separation of similarity score, evidence coverage ($\ge 40\%$ gate), evidence quality, and verification status (`isVerified: false` on live cells); (2) Combinatorial multi-site portfolio optimization; (3) Bounded $\pm 25\%$ sensitivity analysis; and (4) Cryptographic-digest research snapshots exportable to PDF, 4 CSVs, and JSON with Supabase RLS cloud sync. |
| **What scientific limitations remain?** | Earth analogs cannot replicate reduced gravity ($0.166\text{ g} / 0.38\text{ g}$), hard lunar vacuum, galactic cosmic radiation, or 29.5-day lunar synodic illumination; live regional scans lack meter-scale boulder abundance, grain size ($D_{50}$), and broadband albedo; Macrostrat map polygons ($1:250\text{k}–1:5\text{M}$) do not establish local outcrop mineralogy. |
| **How can researchers use the output?** | Researchers can screen regions or curated sites, identify specific missing measurements requiring field or high-resolution orbital follow-up (e.g., HiRISE/LROC NAC boulder counts or XRD mineralogy), record structured validation tasks and notes, and export multi-page PDF briefings and RFC 4180 CSV/JSON datasets for field campaign planning. |

---

## 3. Mandatory Scientific & Attribution Disclaimers

- **No Claim of "First Platform of Its Kind":** TerraTwin builds upon established planetary analog literature and open geospatial standards; we do not claim to be the first analog comparison tool ever created.
- **No Claim of Official NASA Endorsement:** TerraTwin is an independent hackathon research prototype developed by **Team HEXARCHY** for the NASA International Space Apps Challenge using publicly available NASA, ESA, USGS, Copernicus, and Macrostrat datasets. It is **not** an official NASA product or site-certification system.
