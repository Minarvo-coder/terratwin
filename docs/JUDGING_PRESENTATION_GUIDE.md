# TerraTwin — NASA Space Apps Challenge Judging Presentation & Live Demo Guide

**Team Name:** HEXARCHY  
**Project Name:** TerraTwin — Planetary Analog Portfolio Optimizer & Mission Control Suite  
**Team Size:** 6 Members (Beginner-Friendly Role Division)

---

## 1. Division of Speaking Roles Across Team HEXARCHY (6 Members)

To impress NASA Space Apps judges, every member of **HEXARCHY** should speak clearly, own a distinct domain, and hand off smoothly to the next speaker. Replace `[MEMBER NAME]` with your team members' actual names before the presentation:

| Speaker # | Role Title | Placeholder Name | Slides Owned | Primary Responsibility During Pitch & Q&A |
| :---: | :--- | :--- | :---: | :--- |
| **Member 1** | **Team Leader & Lead Architect** | `[MEMBER 1 NAME]` | Slides 1, 2, 14, 15 | Opens the pitch, frames the NASA planetary exploration problem, introduces the Dual Flight Deck & Mission Suite concept, and closes the presentation. |
| **Member 2** | **Planetary Science & Dataset Lead** | `[MEMBER 2 NAME]` | Slides 3, 4, 5 | Explains the 5 Mars/Moon targets, 8 verified Earth analogs, 8 NASA/ESA datasets (MOLA, LOLA, REMS, MEDA, Diviner, POWER, SRTM, MODIS), and the 4-tier harmonization rules. |
| **Member 3** | **Algorithm & Mathematical Modeling Lead** | `[MEMBER 3 NAME]` | Slides 6, 7 | Explains the Linear, Logarithmic ($\log_{10}$), and Categorical similarity equations, the $40\%$ coverage safety gate, and the $C(n,k)$ Multi-Site Portfolio Optimizer. |
| **Member 4** | **3D WebGL & GIS Visualization Lead** | `[MEMBER 4 NAME]` | Slides 8, 9 (Live Demo Part 1) | Drives the live demo of the 3D Mars/Moon Globe (Three.js), 2D Earth GIS Map (Leaflet), and live NASA GIBS satellite layers (MODIS True Color, NDVI, Thermal LST). |
| **Member 5** | **Topography & Geomorphology Lead** | `[MEMBER 5 NAME]` | Slides 10, 11 (Live Demo Part 2) | Demonstrates the 5-Axis Terrain Comparison Workspace, Horn (1981) $3\times 3$ slope derivation, and Geodesic Slerp Elevation Profile cross-sections. |
| **Member 6** | **Full-Stack Database, QA & Verification Lead** | `[MEMBER 6 NAME]` | Slides 12, 13 | Explains the Next.js 16 + Supabase PostgreSQL architecture, Row Level Security (RLS), the 5-Stage Evidence Lineage Explorer, 17 automated test suites, and scientific limitations. |

---

## 2. Slide-by-Slide Content & Speaker Notes (15 Slides)

This structure matches `TerraTwin_Judging_Presentation.pptx` in the repository root.

### Slide 1: Title & Vision (`[MEMBER 1 NAME]`)
- **On-Screen Visual:** Title banner + Screenshot `docs/screenshots/01-landing-page.png`.
- **Headline:** **TerraTwin: Planetary Analog Portfolio Optimizer & Mission Control Suite**
- **Sub-headline:** *Because no single place on Earth is a complete twin of Mars or the Moon.*
- **Speaker Notes:** Greet the judges, introduce Team HEXARCHY, and state our one-sentence mission: TerraTwin is a deterministic scientific web platform that helps mission planners rank individual Earth analog test sites and optimize multi-site testing portfolios for lunar and Martian exploration using verified NASA and ESA telemetry.

### Slide 2: The Problem in Planetary Mission Planning (`[MEMBER 1 NAME]`)
- **On-Screen Visual:** Problem comparison diagram (Mars/Moon extremes vs. Earth field sites).
- **Key Points:**
  1. Before NASA sends a rover like *Perseverance* to Jezero Crater or astronauts to the Lunar South Pole, hardware must be field-tested on Earth.
  2. **The Fundamental Bottleneck:** No single Earth site replicates all planetary dimensions simultaneously. A volcanic lava field in Idaho matches lunar basaltic roughness ($42\%$ rock cover) but is too warm ($+6.2^\circ\text{C}$), whereas Antarctica's McMurdo Dry Valleys match Martian cold ($-20^\circ\text{C}$) but lack carbonate delta geology.
  3. Existing analog selection relies on static literature tables or unverified black-box AI summaries.

### Slide 3: Our Solution — Dual Flight Deck & Mission Suite (`[MEMBER 2 NAME]`)
- **On-Screen Visual:** Screenshot `docs/screenshots/02-mission-control-dashboard.png`.
- **Key Points:**
  - **13 Verified Planetary & Terrestrial Sites:** 5 planetary targets (Gale Crater, Jezero Crater Delta, Meridiani Planum on Mars; Shackleton Rim, Mare Tranquillitatis on the Moon) and 8 fully verified Earth analogs (Lake Salda, Atacama Yungay, Haughton Crater, McMurdo Dry Valleys, Askja/Holuhraun, Craters of the Moon, Río Tinto, Mauna Kea).
  - **Two Exploration Strategies:** 1-to-1 Single-Site Matching and Combinatorial Multi-Site Portfolio Optimization (`Mission Suite`).

### Slide 4: Authoritative NASA, ESA & USGS Data Foundation (`[MEMBER 2 NAME]`)
- **On-Screen Visual:** Screenshot `docs/screenshots/08-sources-coverage-matrix.png`.
- **Key Points:**
  - **8 Official Scientific Archives (156 Verified Telemetry Records):**
    1. **Mars:** MGS MOLA DEM ($463\text{ m}$), MSL Curiosity REMS, Mars 2020 Perseverance MEDA, MER Opportunity Athena.
    2. **Moon:** LRO LOLA DEM ($118\text{ m}$), LRO Diviner Lunar Radiometer, Apollo CCGE / LAMP Exosphere.
    3. **Earth:** NASA POWER 25-Year Climatology (2001–2025), NASA SRTMGL1 / Copernicus GLO-30 ($30\text{ m}$), MODIS Terra Collection 6.1 (LST, Albedo, NDVI).

### Slide 5: Scientific Integrity & The 4-Tier Harmonization Framework (`[MEMBER 2 NAME]`)
- **On-Screen Visual:** 4-Tier Compatibility Matrix table.
- **Key Points:**
  - **Tier 1 (Directly Comparable):** Slope, Rock Abundance, Grain Size, Mean Temp, Diurnal Temp Swing, Solar Flux, Lithology, Albedo.
  - **Tier 2 (Datum-Harmonized):** Elevation (`elevationM`) — compared via Relative Relief ($\Delta z = z - z_0$) so Mars MOLA Areoid isn't falsely subtracted from Earth Sea Level.
  - **Tier 3 (Terrestrial Context Filter):** Vegetation Cover ($0\%$ target baseline).
  - **Tier 4 (Physically Excluded):** Atmospheric Pressure ($3\times 10^{-10}\text{ Pa}$ Lunar vacuum vs. $101,325\text{ Pa}$ Earth) and Annual Precipitation ($0\text{ mm/yr}$ extraterrestrial). Strictly excluded ($w_i = 0$) from similarity scoring.

### Slide 6: Mathematical Similarity Engine (`[MEMBER 3 NAME]`)
- **On-Screen Visual:** Screenshot `docs/screenshots/09-methodology-page.png` + Equations.
- **Key Points:**
  - **Zero Hallucination, Zero Missing-Value Fabrication:** Missing values (`null`) are never replaced with `0`.
  - **Three Domain-Specific Normalizations ($d_i \in [0, 1]$):**
    - *Linear:* $d_i = \min(1, |T_i - C_i| / \tau_i)$
    - *Logarithmic (Regolith Grain Size $D_{50}$):* $d_i = \min(1, |\log_{10}(T_i) - \log_{10}(C_i)| / 2.0)$
    - *Categorical (Petrological Lithology):* $0.0$ exact rock match, $0.5$ same petrological family, $1.0$ different family.
  - **Weighted Distance & Score:** $D = \frac{\sum w_i d_i}{\sum w_i}$, $S = 100 \times (1 - D)$, gated by $\text{Coverage} \ge 40\%$.

### Slide 7: Combinatorial Multi-Site Portfolio Optimizer (`[MEMBER 3 NAME]`)
- **On-Screen Visual:** Screenshot `docs/screenshots/07-mission-suite-portfolio.png`.
- **Key Points:**
  - Evaluates all $\binom{n}{k} = \frac{n!}{k!(n-k)!}$ combinations of $k=2$ or $k=3$ Earth analog sites.
  - **Envelope Minimization:** For each mission parameter, assigns attribution to the site in the portfolio with the minimum physical distance $d_{P,i} = \min_{c \in P} d_i(T, c)$.
  - **Real Result:** For *Gale Crater* under *Rover Testing*, the best single site is **Lake Salda ($82.1\%$)**, whereas the 2-site portfolio **Atacama Desert + Haughton Impact Structure** achieves **$90.3\%$ composite fidelity** ($+9.7\%$ synergy gain over Atacama alone and $+8.2\%$ over Lake Salda!).

### Slide 8: Interactive 3D Planetary Globe & 2D NASA GIBS Explorer (`[MEMBER 4 NAME]`)
- **On-Screen Visual:** Screenshot `docs/screenshots/03-satellite-imagery-map.png`.
- **Key Points:**
  - **3D WebGL Globe (Three.js):** Real-time Mars and Moon globes with spherical trigonometry (`latLonToVector3`), raycasted landing site pins, solar terminator lighting, and custom GLSL Rayleigh limb glow for Mars (and scientifically honest zero-glow vacuum on the Moon).
  - **NASA GIBS WMTS Integration:** Streams live MODIS True Color, Vegetation Index (NDVI), Day Land Surface Temperature (LST), Surface Reflectance, and ASTER GDEM Relief directly onto the Leaflet map.

### Slide 9: Advanced Terrain & Geomorphology Workspace (`[MEMBER 5 NAME]`)
- **On-Screen Visual:** Screenshot `docs/screenshots/04-terrain-comparison-workspace.png`.
- **Key Points:**
  - **5-Axis Normalized Radar Chart:** Simultaneously compares Slope, Rock Abundance, Grain Size, Mean Temp, and Albedo.
  - **Engineering Regime Classification:** Translates raw numbers into rover engineering classifications (e.g., *Moderate Incline $5^\circ\text{–}15^\circ$*, *Nominal Boulder Field*, Wentworth grain-size scale).

### Slide 10: Geodesic Elevation Profiles & Horn (1981) Slope Engine (`[MEMBER 5 NAME]`)
- **On-Screen Visual:** Screenshot `docs/screenshots/05-elevation-profile-transects.png`.
- **Key Points:**
  - Extracts real spatial elevation transects from local binary `Float32Array` DEM grids (MOLA, LOLA, SRTM/Copernicus) using **Spherical Linear Interpolation (Slerp)** and **bilinear grid interpolation**.
  - Computes local slope at every transect step using **Horn's (1981) $3\times 3$ finite-difference gradient algorithm**.
  - Supports **Relative Relief ($\Delta z$)** mode so crater rim drops on Mars/Moon can be overlaid directly against terrestrial canyon/terrace relief.

### Slide 11: 5-Stage Scientific Evidence Lineage Explorer (`[MEMBER 6 NAME]`)
- **On-Screen Visual:** Screenshot `docs/screenshots/06-scientific-evidence-explorer.png`.
- **Key Points:**
  - Judges and researchers can audit every single number across a 5-stage provenance chain:
    `1. Planetary Body & Location -> 2. Parameter & Dimension -> 3. Calibrated Measurement -> 4. Instrument & Dataset Source -> 5. Official Peer-Reviewed Archive URL`.

### Slide 12: Full-Stack Technical Architecture & Security (`[MEMBER 6 NAME]`)
- **On-Screen Visual:** Architecture & Supabase ER Diagram.
- **Key Points:**
  - Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript 5**, **Tailwind CSS 4**, **Three.js**, **React-Leaflet 5**, **Recharts 3**, and **Supabase PostgreSQL**.
  - **Security by Design:** PostgreSQL Row Level Security (RLS) enforces anonymous read-only access on all tables; `SUPABASE_SERVICE_ROLE_KEY` is isolated strictly to offline CLI ingestion scripts.

### Slide 13: Verification, Automated Testing & Scientific Honesty (`[MEMBER 6 NAME]`)
- **On-Screen Visual:** Verification Matrix (17/17 Test Suites Passing).
- **Key Points:**
  - **17 Automated Verification Suites (`npm run test:all`):** 12 Phase 3 data/math suites + 5 Phase 4 visualization/lineage suites, plus `tsc --noEmit` and `next build` with zero errors.
  - **Honest Limitations:** Scores are illustrative multi-attribute proximity indices, not probabilities of mission success; reduced gravity ($0.38g / 0.166g$) and hard vacuum require laboratory simulation.

### Slide 14: Practical Impact & Future Roadmap (`[MEMBER 1 NAME]`)
- **On-Screen Visual:** Impact cards + Phase 5 Roadmap.
- **Key Points:**
  - **Who Uses TerraTwin:** Rover mobility engineers, planetary geology field teams, ISRU hardware testers, and university space educators.
  - **Future Roadmap:** Cloud-Optimized GeoTIFF (COG) global planetary streaming, seasonal time-series climatology matching, and logistical cost/accessibility optimization.

### Slide 15: Conclusion & Q&A (`[MEMBER 1 NAME]`)
- **On-Screen Visual:** Team HEXARCHY summary slide + Live App URL.
- **Closing Line:** *"Earth cannot give us a single twin of Mars or the Moon—but with TerraTwin, we can scientifically engineer the right portfolio of Earth analogs to prepare humanity for both. Thank you, and Team HEXARCHY welcomes your questions!"*

---

## 3. Word-for-Word 3-Minute Lightning Pitch Script

*(Timed at ~140 words per minute = ~420 words total. Each member speaks for ~30 seconds.)*

**[0:00 – 0:30] Member 1 (Team Leader):**  
"Good morning/afternoon judges! We are **Team HEXARCHY**, and we built **TerraTwin: The Planetary Analog Portfolio Optimizer and Mission Control Suite**. Before NASA sends a rover to Jezero Crater or Artemis astronauts to the Lunar South Pole, every wheel, drill, and sensor must be tested here on Earth. But there is a fundamental scientific problem: **no single location on Earth is a complete twin of Mars or the Moon.** A lava field in Iceland matches lunar basaltic terrain, but Antarctica matches Martian cold. Mission planners shouldn't just search for one compromise site—they need an optimized **portfolio** of complementary sites. I'll pass to `[MEMBER 2 NAME]` to explain our scientific data foundation."

**[0:30 – 1:00] Member 2 (Planetary Science Lead):**  
"Thank you, `[MEMBER 1 NAME]`. Rather than using synthetic or AI-hallucinated numbers, we grounded TerraTwin in **8 official NASA, ESA, and USGS archives** across **5 planetary targets** and **8 verified Earth analog sites**—totalling **156 verified telemetry records**. We ingested Mars MOLA and Lunar LOLA laser altimetry, Curiosity REMS and Perseverance MEDA rover weather telemetry, LRO Diviner radiometry, and 25-year NASA POWER, SRTM, and MODIS Earth observations. Crucially, we built a **4-Tier Scientific Harmonization Framework** that excludes physically incomparable parameters like atmospheric vacuum and liquid rainfall so they never distort analog rankings. Over to `[MEMBER 3 NAME]` for our mathematical engine."

**[1:00 – 1:35] Member 3 (Algorithm & Math Lead):**  
"Thanks, `[MEMBER 2 NAME]`. Our similarity engine evaluates 12 environmental features using domain-specific physics: **linear normalization** for slope and temperature, **base-10 logarithmic normalization** for regolith grain size spanning orders of magnitude, and **petrological family distance** for rock lithology. We never replace missing data with zero, and we enforce a strict **40% coverage threshold**. Even better, our **Mission Suite Portfolio Optimizer** evaluates all $C(n,k)$ multi-site combinations. For Gale Crater rover testing, combining the **Atacama Desert** with **Haughton Impact Crater** boosts mission fidelity to **90.3%**—a **+9.7 percentage-point synergy gain** over Atacama alone! Here is `[MEMBER 4 NAME]` to show the Flight Deck."

**[1:35 – 2:05] Member 4 (3D & GIS Visualization Lead):**  
"Thank you, `[MEMBER 3 NAME]`. In our **Dual Flight Deck**, researchers inspect a real-time **Three.js 3D globe** of Mars or the Moon alongside a **2D Leaflet Earth GIS map**. Using spherical trigonometry, clicking a target crater smoothly slews the 3D orbital camera while updating ranked telemetry pins on Earth. Researchers can also overlay live **NASA GIBS satellite imagery tiles**—including MODIS True Color, Vegetation Index, and Thermal Land Surface Temperature—with explicit warnings distinguishing visual imagery from calibrated numerical data. Over to `[MEMBER 5 NAME]`."

**[2:05 – 2:35] Member 5 (Topography & Geomorphology Lead):**  
"Thanks, `[MEMBER 4 NAME]`. Below the Flight Deck, our **Terrain Comparison Workspace** renders a 5-axis normalized radar chart and rover trafficability regime cards. And in our **Topographic Elevation Profile Engine**, we extract geodesic cross-sections from binary MOLA, LOLA, and SRTM elevation rasters using **Spherical Linear Interpolation** and **Horn's 1981 3-by-3 finite-difference slope formula**, normalizing vertical datums into Relative Relief ($\Delta z$) so Martian crater walls can be compared directly against terrestrial valleys. Over to `[MEMBER 6 NAME]`."

**[2:35 – 3:00] Member 6 (Database & QA Lead) & Member 1:**  
"Thank you, `[MEMBER 5 NAME]`. Every measurement in TerraTwin is stored in **Supabase PostgreSQL** with Row Level Security and is 100% auditable through our **5-Stage Scientific Evidence Lineage Explorer** and exportable as CSV or JSON reports. Validated by **17 automated test suites**, TerraTwin transforms planetary analog selection from static guesswork into transparent, multi-site mission engineering. Thank you—Team HEXARCHY is ready for your questions!"

---

## 4. Word-for-Word 5-Minute Comprehensive Pitch Script

*(Timed at ~700 words total. Gives deeper scientific, mathematical, and live-walkthrough context.)*

**[0:00 – 0:50] Member 1 (Team Leader & Architect):**  
"Hello judges! We are **Team HEXARCHY**, presenting **TerraTwin: Planetary Analog Portfolio Optimizer & Mission Control Suite**.  
When NASA prepares a mission like Mars 2020 *Perseverance* at Jezero Crater or Artemis III at the Lunar South Pole, engineers test rovers, drills, and habitats in terrestrial analog environments. Yet mission planners face two major hurdles:  
First, planetary and Earth datasets live in fragmented silos with incompatible units, spatial resolutions, and vertical datums.  
Second, **no single location on Earth replicates an extraterrestrial body**. Lake Salda in Turkey shares Jezero Crater's hydromagnesite delta mineralogy, while the Atacama Desert matches hyper-arid boulder trafficability, and Antarctica's McMurdo Dry Valleys match extreme cold.  
TerraTwin solves both challenges: it unifies authentic NASA and ESA datasets into an interactive 3D/2D Mission Control platform and introduces a combinatorial **Portfolio Optimizer** that engineers complementary multi-site test suites. I'll hand it over to `[MEMBER 2 NAME]` to walk through our scientific data."

**[0:50 – 1:45] Member 2 (Planetary Science & Dataset Lead):**  
"Thank you, `[MEMBER 1 NAME]`. Scientific honesty is the backbone of TerraTwin. We cataloged **5 planetary landing targets**—Gale Crater, Jezero Crater Delta, and Meridiani Planum on Mars, plus Shackleton South Polar Rim and Mare Tranquillitatis on the Moon—alongside **8 fully verified Earth analogs** and **8 demo test sites**.  
Every verified parameter is backed by **8 official NASA, ESA, and USGS archives**:
- For Mars and the Moon, we ingested **MGS MOLA** ($463\text{ m}$) and **LRO LOLA** ($118\text{ m}$) laser altimetry DEMs, **MSL Curiosity REMS**, **Mars 2020 MEDA**, **MER Opportunity Athena**, and **LRO Diviner** radiometer datasets.
- For Earth, we queried **NASA POWER 25-year climatology (2001–2025)**, **NASA SRTMGL1 / Copernicus GLO-30** ($30\text{ m}$) topography, and **MODIS Terra Collection 6.1** albedo and NDVI vegetation cover.  
We also engineered a **4-Tier Compatibility Framework**. Rather than blindly comparing every column, Tier 4 explicitly excludes **Atmospheric Pressure** and **Annual Precipitation** from cross-body scoring because Earth's $101\text{ kPa}$ atmosphere cannot match lunar vacuum in open air. Now to `[MEMBER 3 NAME]` for the math."

**[1:45 – 2:40] Member 3 (Algorithm & Mathematical Modeling Lead):**  
"Thanks, `[MEMBER 2 NAME]`. In `similarity-engine.ts`, we evaluate each feature using physically grounded distance metrics $d_i \in [0, 1]$:
- Continuous variables like slope ($\tau = 25^\circ$) and rock cover ($\tau = 40\%$) use clamped linear normalization: $d_i = \min(1, |T_i - C_i|/\tau_i)$.
- Regolith grain size ($D_{50}$) spans multiple orders of magnitude from $0.07\text{ mm}$ lunar dust to $5\text{ mm}$ gravel, so we use **base-10 logarithmic normalization** over a 2-decade tolerance: $|\log_{10}(T_i) - \log_{10}(C_i)| / 2.0$.
- Dominant lithology uses **petrological family taxonomy**: $0.0$ for an exact class match, $0.5$ if both belong to the same igneous or sedimentary family, and $1.0$ otherwise.  
Missing values are never replaced with zero, and any candidate with under **40% mission weight coverage** is refused a numerical rank.  
Then, in `portfolio-optimizer.ts`, we generate all $\binom{n}{k}$ combinations of 2 or 3 Earth sites. By assigning each mission parameter to the strongest site in the combination, pairing **Atacama Desert + Haughton Impact Structure** for Gale Crater achieves **90.3% composite fidelity**, beating the single best site in that pair by **+9.7 percentage points**! Passing to `[MEMBER 4 NAME]`."

**[2:40 – 3:30] Member 4 (3D WebGL & GIS Visualization Lead):**  
"Thank you, `[MEMBER 3 NAME]`. On the frontend, our **Dual Flight Deck** synchronizes a custom **Three.js 3D Planetary Globe** with a **Leaflet 2D Earth Map**.  
When a user selectsMars or the Moon, our 3D globe maps equirectangular NASA albedo textures onto a sphere, places 3D target pins via spherical trigonometry (`latLonToVector3`), and renders a custom GLSL Rayleigh atmospheric limb shader on Mars—while rendering zero atmospheric glow on the Moon to remain scientifically accurate for a vacuum body.  
On the 2D Earth map, users can switch between 6 remote-sensing layers powered by **NASA GIBS WMTS**—including MODIS Terra True Color, NDVI Vegetation Index, Day Land Surface Temperature, and ASTER Terrain Relief—complete with date selection, opacity controls, and provenance notices explaining that GIBS tiles are visual context while rankings use calibrated numerical datasets. Over to `[MEMBER 5 NAME]`."

**[3:30 – 4:20] Member 5 (Topography & Geomorphology Lead):**  
"Thanks, `[MEMBER 4 NAME]`. Our **Scientific Analysis View** gives researchers deep analytical workspaces:
First, the **Terrain Comparison Workspace** plots a 5-axis normalized radar chart and classifies slope, boulder hazard, Wentworth grain size, and petrology into operational rover trafficability regimes, generating a deterministic engineering synthesis.  
Second, our **Topographic Elevation Profile Engine** samples real binary elevation grids (`raw-data/dem/*.bin`) along great-circle geodesics using **Spherical Linear Interpolation (Slerp)** and **bilinear interpolation**, calculating local slope at every step via **Horn's (1981) 3-by-3 finite-difference method**. Because Mars MOLA uses a gravity areoid datum and Earth uses Mean Sea Level, we default to **Relative Relief ($\Delta z = z - z_0$)** so researchers can authentically compare crater rim climbs against terrestrial slopes. Over to `[MEMBER 6 NAME]`."

**[4:20 – 5:00] Member 6 (Database & QA Lead) & Member 1:**  
"Thank you, `[MEMBER 5 NAME]`. Under the hood, TerraTwin runs on **Next.js 16**, **React 19**, **TypeScript 5**, and **Supabase PostgreSQL** with Row Level Security and 5 B-tree indexes.  
To guarantee total scientific transparency, our **5-Stage Evidence Lineage Explorer** lets judges click any parameter to trace its exact sensor, version, resolution, mathematical formula, and peer-reviewed URL—and export full mission reports in **CSV or JSON**.  
Backed by **17 passing automated test suites**, TerraTwin empowers scientists and engineers to design smarter, multi-site planetary testing campaigns. Thank you, judges—we welcome your questions!"

---

## 5. 5-Minute Live Demo Script (Click-by-Click Choreography)

**Driver:** `[MEMBER 4 NAME]` at the laptop keyboard; `[MEMBER 5 NAME]` and `[MEMBER 1 NAME]` narrating.  
**Pre-Demo Check:** Have `http://localhost:3000/explore` (or the deployed URL) open in Chrome at $100\%$ zoom, plus `/sources` open in a second browser tab.

| Time | Action on Screen (What to Click) | What to Say to Judges |
| :---: | :--- | :--- |
| **0:00 – 0:45** | Start on `/explore` (**Planetary Analog Mission Control**). Click **Mars** $\rightarrow$ click **Jezero Crater Delta** in the left sidebar. Watch the 3D Mars globe smoothly rotate and lock onto $18.38^\circ\text{N}, 77.58^\circ\text{E}$. | *"Here is our live Mission Control dashboard. When I select **Jezero Crater Delta** on Mars, our Three.js 3D globe uses spherical slerp to lock onto Perseverance's landing coordinates, and our Target Sensor Suite displays verified MOLA and MEDA telemetry ($-60^\circ\text{C}$, $5^\circ$ slope, clay-sedimentary delta deposits)."* |
| **0:45 – 1:30** | In the right pane (**Global Reconnaissance & Remote-Sensing Explorer**), click **Surface Temp (LST)** and then **Vegetation (NDVI)** in the NASA GIBS toolbar. Click the top-ranked cyan pin on the map (**Lake Salda, Turkey**). | *"On the right, our Leaflet GIS map updates in real time. We can stream live **NASA GIBS WMTS satellite imagery**—like MODIS Land Surface Temperature and NDVI Vegetation—while inspecting our #1 ranked analog for Jezero: **Lake Salda in Turkey** at **83.6% similarity**."* |
| **1:30 – 2:15** | Toggle **Mission Purpose** on the left from *Rover testing & trafficability* to **Geological field research**. Point out how the rankings and scores dynamically recalculate. | *"Watch what happens when we switch our mission purpose from **Rover Testing** (which weights slope at 25% and rock cover at 20%) to **Geological Field Research** (which weights lithology at 30%). The engine dynamically re-ranks all Earth sites based on mineralogical and albedo fidelity."* |
| **2:15 – 3:00** | Click the purple **Mission Suite // Multi-Site Optimizer** button at the top. Click **Trio (3 Sites)** or **Pair (2 Sites)** and click **rank #1 card**. Scroll slightly to show the **Flight Director Brief** and **Parameter Attribution Matrix**. | *"Because no single Earth site replicates all of Mars, we switch to **Mission Suite Mode**. Our combinatorial optimizer evaluates all $C(8,2) = 28$ site pairs and finds that combining **Atacama Desert + Haughton Impact Structure** boosts composite match fidelity to **90.3%**—a **+9.7% synergy gain** over the best individual site in that pair, with full parameter-by-parameter winner attribution."* |
| **3:00 – 3:45** | Switch back to **1-to-1 Analog Site Matching**, scroll down to **Scientific Analysis View**, and click **Terrain Workspace**. Hover over the **5-Axis Radar Chart** and point to the 4 morphology regime cards. | *"In the **Terrain Comparison Workspace**, we compare target and analog geomorphology across a 5-axis normalized radar chart, Wentworth grain-size classifications, and deterministic rover engineering regime syntheses."* |
| **3:45 – 4:30** | Click the **Elevation Transects** tab. Toggle between **Relative Relief ($\Delta z$)** and **Datum-Isolated (Dual Y)**, and click **50 points**. | *"Next, our **Topographic Elevation Profile Engine** extracts great-circle geodesic cross-sections from real MOLA, LOLA, and Copernicus DEM rasters, computing local slope via Horn's 1981 3-by-3 algorithm and normalizing datums to Relative Relief ($\Delta z = 0\text{ m}$ start)."* |
| **4:30 – 5:00** | Click the **Evidence Explorer** tab (or switch to `/sources` tab showing the **13×12 Coverage Matrix**), then click **EXPORT CSV** at the top of `/explore`. | *"Finally, in our **5-Stage Evidence Lineage Explorer** and **13×12 Coverage Matrix**, judges can audit every measurement back to its NASA PDS archive URL, and click **Export CSV / JSON** to download a complete mission analysis package."* |

---

## 6. Advice for Handling Judge Interruptions & Difficult Questions

1. **Never Get Defensive About Prototype Assumptions:** If a judge asks, *"Who decided that slope tolerance is $25^\circ$ or rover slope weight is $0.25$?"*, answer: *"Those are physically motivated baseline engineering assumptions—$25^\circ$ is the typical wheel-slip and tip stability limit for six-wheeled planetary rovers—and we explicitly labeled them in `comparison-config.ts` as configurable prototype assumptions that users can customize via sliders or API payloads."*
2. **Be Proud of What TerraTwin Excludes:** Judges love scientific discipline. Emphasize that we intentionally excluded **Atmospheric Pressure** and **Annual Precipitation** from cross-body similarity math rather than forcing a meaningless numeric comparison between lunar vacuum and Earth air.
3. **If Live Internet Stutters During Demo:** Point out that TerraTwin has local binary DEM rasters (`raw-data/dem/*.bin`) and canonical repository fallbacks built in, so elevation profiling, 3D globe rendering, and portfolio math work even offline.

