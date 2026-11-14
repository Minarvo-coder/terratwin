# TERRATWIN — PHASE 7.1: SCIENTIFIC DEMONSTRATION PLAYBOOK
**Project:** TerraTwin — Planetary Analog Discovery & Research Platform  
**Team:** HEXARCHY (Six Members)  
**Purpose:** Step-by-step reproducible playbook for the three core scientific demonstration scenarios (**Demo A**, **Demo B**, and **Demo C**), including exact routes, identifiers, user interactions, expected numerical outputs, and scientifically honest fallback procedures.

---

## 1. Overview of the Three Verified Demonstration Scenarios

| Scenario | Title | Primary Route(s) | Target (`targetId`) | Mission Profile (`missionProfile`) | Key Scientific Point Demonstrated |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Demo A** | **Mars Geological & Rover Discovery (Lake Salda & Jezero Delta)** | `/discover` & `/explore` | **Jezero Crater Delta** (`mars-jezero-delta` / `a0000001-0000-4000-8000-000000000001`) | `geological-research` $\rightarrow$ `rover-testing` | **1.** Live 2×2 scan of Lake Salda under `geological-research` returns **15% coverage** (`score: null` — honestly withheld because Macrostrat returns `"Pliocene undifferentiated"`).<br>**2.** Switching the live scan to `rover-testing` raises coverage to **45%** (`\ge 40\%` gate) and yields an exploratory score of **65.0%** (`isVerified: false`).<br>**3.** Inspecting the curated **Lake Salda** benchmark (`c0000005`, `95%`–`100%` coverage) shows how peer-reviewed field mineralogy supplies the missing carbonate data. |
| **Demo B** | **Lunar South Pole Analog Research (Shackleton Rim & Lunar Base / ISRU)** | `/discover` & `/explore` | **Shackleton Crater Rim** (`moon-shackleton-rim` / `b0000001-0000-4000-8000-000000000001`) | `lunar-base-construction` | Mission-specific evaluation for permanent lunar base siting & ISRU (`meanSlopeDeg: 0.25`, `rockAbundancePct: 0.20`, `surfaceSolarIrradianceWm2: 0.15`, `elevationM: 0.00`), explicit **29.5-Earth-day synodic illumination** & hard-vacuum limitations, comparison of **McMurdo Dry Valleys (`66.5%`)**, **Mauna Kea Summit & Saddle**, and **Hanksville / Qaidam (`63.7%` / `62.8%`)**, plus follow-up validation tasks. |
| **Demo C** | **31-Site Global Discovery Atlas & Multi-Site Portfolio Exploration** | `/discover` & `/explore` | **Jezero Crater Delta** & **Gale Crater** (`mars-gale-crater`) | `geological-research` & `rover-testing` | Exploration of all **31 curated sites** (`8` canonical benchmarks + `23` under-explored candidates across `18` countries and `9` analog categories), surfacing overlooked top geological matches like **Tibetan Plateau — Qinghai (`92.3%`)** and **Svalbard — Spitsbergen (`91.7%`)**, followed by **PDF + 4 CSV + JSON** reproducible research export. |

---

## 2. Demo A — Mars Geological & Rover Discovery (Jezero Delta & Lake Salda, Turkey)

### 2.1 Scientific Context & Honesty Mandate
- **Planetary Target:** `Jezero Crater Delta` (`mars-jezero-delta`, $18.38^\circ\text{ N}, 77.58^\circ\text{ E}$, elevation $-2,651\text{ m}$ MOLA areoid, mean temp $-55^\circ\text{C}$, diurnal range $65^\circ\text{C}$, slope $5.0^\circ$, rock abundance $14\%$, median grain size $0.35\text{ mm}$, albedo $0.19$, lithology `clay-sedimentary`, solar irradiance $152\text{ W/m}^2$).
- **Why Lake Salda (`[37.1, 29.2, 37.9, 30.1]`) is Scientifically Revealing:**
  - In planetary geology literature, Lake Salda (Burdur, Turkey) is famous as a hydromagnesite/carbonate mineralogical analog for Jezero Crater’s marginal carbonates.
  - However, in an **automated live regional grid scan** (`POST /api/discover`), Macrostrat’s global compilation at $37.35^\circ\text{ N}, 29.45^\circ\text{ E}$ reports the broad regional map unit `"Pliocene undifferentiated"`. Because `"Pliocene undifferentiated"` does not specify a rock type, `macrostrat-connector.ts` conservatively assigns `lithology: null` rather than guessing carbonate or clay.
  - Under **Geological field research (`geological-research`)**, `lithology` (`0.30`), `vegetationCoverPct` (`0.15`), `albedo` (`0.15`), `medianGrainSizeMm` (`0.10`), and `rockAbundancePct` (`0.10`) account for **80% of the mission weight**. Without `lithology`, only `meanSlopeDeg` (`0.10`) and `meanSurfaceTempC` (`0.05`) are matched against verified target telemetry—yielding **15% weighted evidence coverage**.
  - Because **15% < 40%** (`MIN_RELIABLE_COVERAGE = 0.40`), TerraTwin **withholds a numerical similarity score (`score: null`, `"Insufficient data to rank reliably"`)** and flags `lithology` as the #1 missing high-weight parameter requiring field/spectral verification!
  - Next, when the researcher switches the **exact same Lake Salda 2×2 scan** to **Rover testing & trafficability (`rover-testing`)**—where `meanSlopeDeg` (`0.25`), `elevationM` (`0.10`), `diurnalTempRangeC` (`0.05`), and `meanSurfaceTempC` (`0.05`) are all populated by Open-Meteo Copernicus DEM and NASA POWER—the weighted coverage rises to **45% (`\ge 40\%`)**, and TerraTwin computes a real live exploratory score (`65.0%` for `cell_+37.3500_+29.4500`, `isVerified: false`).

### 2.2 Step-by-Step Execution Choreography
1. **Open Route:** Navigate to `http://localhost:3000/discover`.
2. **Select Planetary Body & Target:**
   - Click **Martian surface** (`Mars`).
   - Select **Jezero Crater Delta** (`mars-jezero-delta`) in the `Target planetary exploration site` dropdown.
3. **Part A1 — Demonstrate Honest `<40%` Missing-Data Gate (`geological-research`):**
   - Click mission profile **Geological field research** (`geological-research`).
   - Click regional preset **Lake Salda, Turkey** (`[37.1, 29.2, 37.9, 30.1]`, `0.5°` spacing, set max cells to `4` so `2×2` grid cells are generated).
   - Click **Launch Discovery Scan**.
   - **Expected Live Output:**
     - `POST /api/discover` returns `HTTP 200` (`totalCellsEvaluated: 4`, `computableCandidatesCount: 0`, `insufficientDataCandidatesCount: 4`).
     - Candidate cards display **`Insufficient data to rank reliably`** (`SIMILARITY SCORE: N/A`, `15% coverage`, badge: `Insufficient Evidence (<40% Coverage)`).
   - **What to Narrate:** *"Notice what just happened: instead of inventing a score for Lake Salda, TerraTwin shows 15% evidence coverage under Geological Field Research because Macrostrat's global 1:5M map at this coordinate only says 'Pliocene undifferentiated.' Because 15% is below our 40% reliability gate, TerraTwin refuses to fabricate a geological rank and tells the researcher exactly which measurement—lithology (30% weight)—must be verified."*
4. **Part A2 — Demonstrate Live Scored Scan Above 40% Coverage (`rover-testing`):**
   - In the left configuration panel on `/discover`, switch the mission profile to **Rover testing & trafficability** (`rover-testing`) and click **Launch Discovery Scan**.
   - **Expected Live Output:**
     - Because `rover-testing` weights Copernicus DEM slope (`25%`), elevation (`10%`), NASA POWER diurnal range (`5%`), and mean temperature (`5%`), weighted evidence coverage reaches **`45%`** (`\ge 40\%`).
     - All 4 grid cells in the Lake Salda basin become computable exploratory candidates (`computableCandidatesCount: 4`, e.g., `cell_+37.3500_+29.4500` with **`65.0% (Exploratory)`**, `isVerified: false`, `noveltyTier: "live-grid-discovery"`).
5. **Part A3 — Inspect Scientific Intelligence & Capture Research Snapshot:**
   - Click **Open Scientific Intelligence** on the top Lake Salda cell to inspect:
     - **Strongest Matching Features** (`meanSlopeDeg`, `elevationM`)
     - **Missing / Unknown Evidence** (`rockAbundancePct: 20% weight`, `medianGrainSizeMm: 15% weight`, `vegetationCoverPct: 10% weight`, `lithology: 5% weight`)
     - **Bounded $\pm 25\%$ Sensitivity Analysis** (showing whether rank order is stable or sensitive under single-feature weight perturbations).
   - Click **Open Research Workspace** $\rightarrow$ **Create Research Assessment Snapshot** (`ttw-snap-...`, digest `fnv64-...`) $\rightarrow$ click **Download Scientific PDF** and **Export Candidate CSV**.

### 2.3 Honest Fallback Behavior (If Live Internet / External APIs Time Out)
- **Tier 1 (Cached Redis / Memory):** If Lake Salda was pre-warmed within the last 15 minutes, Upstash Redis (`X-TerraTwin-Cache: HIT`) serves the exact validated provider response in $<50\text{ ms}$.
- **Tier 2 (Saved Cloud / Local Snapshot):** Switch to the **Research Workspace** panel at the bottom of `/discover` (or click **Import Snapshot JSON** using `artifacts/phase6-step7/downloads/TerraTwin_mars_cell__37_3500__29_4500_geological-research_r1_Snapshot.json`), clearly stating: *"We are inspecting a previously captured, cryptographically digested snapshot (`fnv64-...`) from this region."*
- **Tier 3 (Curated Global Atlas Entry):** Switch the top mode toggle on `/discover` from **Live Regional Scan** to **Curated Atlas** and select **Lake Salda Carbonate Delta & Shorelines** (`c0000005-0000-4000-8000-000000000005`).

---

## 3. Demo B — Lunar South Pole Analog Research (Shackleton Crater Rim & Lunar Base / ISRU)

### 3.1 Scientific Context
- **Planetary Target:** `Shackleton Crater Rim` (`moon-shackleton-rim` / `b0000001-0000-4000-8000-000000000001`, $-89.90^\circ\text{ S}, 0.00^\circ\text{ E}$, elevation $+102.5\text{ m}$ LOLA sphere, mean temp $-183^\circ\text{C}$, diurnal/synodic swing $30^\circ\text{C}$, slope $15.2^\circ$, rock abundance $8\%$, median grain size $0.07\text{ mm}$, albedo $0.14$, lithology `anorthositic`, ambient pressure $3 \times 10^{-10}\text{ Pa}$).
- **Mission Profile:** `Lunar base construction & ISRU` (`lunar-base-construction`), weighting:
  - `meanSlopeDeg`: `0.25` (foundation grading, trenching, and lander tipping stability)
  - `rockAbundancePct`: `0.20` (boulder clearing hazard for landing pads and roads)
  - `surfaceSolarIrradianceWm2`: `0.15` (solar power flux context)
  - `diurnalTempRangeC`: `0.10` (structural and seal thermal cycling stress)
  - `lithology`: `0.10` (anorthositic/basaltic regolith ISRU oxygen & sintering feedstock)
  - `medianGrainSizeMm`: `0.10` (regolith bearing capacity and sintering granulometry)
  - `vegetationCoverPct`: `0.05` (bare ground accessibility without root matrices)
  - `meanSurfaceTempC`: `0.05` (baseline thermal management context)
  - `elevationM`: `0.00` (excluded: planetary reference datums are physically distinct)

### 3.2 Step-by-Step Execution Choreography
1. **On `/discover`:**
   - Click **Lunar base sites** (`Moon`).
   - Select **Shackleton Crater Rim** (`moon-shackleton-rim`).
   - Select mission profile **Lunar base construction & ISRU** (`lunar-base-construction`).
   - Click the **Curated Atlas** tab (`31 Curated Global Sites`).
2. **Inspect Top Curated Candidates & Scientific Intelligence:**
   - Point out the top-ranked candidates across canonical and under-explored tiers:
     - **McMurdo Dry Valleys — University Valley (`c0000004`, Canonical Benchmark):** Hyper-cold polar permafrost desert (`-20°C` mean temp, `0%` vegetation) — scores **`66.5%`** on the canonical 8-site `/explore` benchmark and **`60.1%`** in the 31-site Atlas.
     - **Hanksville Badlands & Morrison Paleochannels (`atlas-hanksville-mdrs`, Under-Explored Analog, `63.7%`, `85%` coverage)** and **Qaidam Basin — Dalangtan & Qarhan Playa (`atlas-qaidam-playa`, `62.8%`, `85%` coverage)** or **Meteor Crater (`atlas-meteor-crater`, `62.7%`)**: Match bare-ground slope/boulder/irradiance engineering tolerances.
     - **Mauna Kea Summit & Saddle (`c0000002`, Canonical Benchmark):** High-altitude volcanic tephra used by NASA ISRU field tests (e.g., RESOLVE/dust mitigation).
   - Click **Mauna Kea Summit & Saddle** (or **McMurdo Dry Valleys**) $\rightarrow$ click **Open Scientific Intelligence**.
3. **Highlight Explicit Lunar Scientific Limitations & Follow-Up Checklist:**
   - Point directly to the **Planetary Physics & Illumination Limitation Notice** (`29.5-Earth-day lunar synodic illumination cycle`, polar grazing-angle sunlight, hard vacuum $3 \times 10^{-10}\text{ Pa}$, $0.166\text{ g}$ gravity, and absence of micrometeorite-gardened nanophase iron $\text{npFe}^0$ agglutinates on Earth).
   - Inspect the **Validation Checklist & Follow-Up Recommendations** (e.g., geotechnical cone penetrometer testing, fine-fraction $<70\ \mu\text{m}$ sieving, and vacuum thermal-chamber simulation).
4. **Cross-Verify on `/explore` (3D Lunar South Pole Globe & Elevation Transect):**
   - Switch to `http://localhost:3000/explore`, select **Moon** $\rightarrow$ **Shackleton Crater Rim**, and show the 3D Moon globe oriented to $-89.90^\circ\text{ S}$ (with zero atmospheric glow) alongside the **LRO LOLA 118m laser altimetry elevation profile** (`\Delta z` relative relief).

---

## 4. Demo C — Global Discovery Atlas Exploration (31 Sites, 9 Categories, 18 Countries)

### 4.1 Scientific Context
- The **Global Discovery Atlas** (`src/lib/terratwin/discovery-atlas.ts`) contains **31 curated Earth analog candidates**:
  - **8 Canonical Benchmarks (`canonical-benchmark`):** Atacama Yungay, Mauna Kea Summit & Saddle, Haughton Impact Structure, McMurdo Dry Valleys, Lake Salda, Craters of the Moon, Askja Caldera & Holuhraun, and Río Tinto Acidic Basin.
  - **23 Under-Explored Candidates (`under-explored-analog`)** spanning **18 countries/territories** (`Antarctica`, `Argentina`, `Australia`, `Bolivia`, `Canada`, `Chile`, `China`, `Ethiopia`, `Germany`, `Greenland`, `Iceland`, `India`, `Libya`, `Norway`, `Oman`, `Spain`, `Turkey`, `United States`).
  - **All 9 Analog Environment Categories (`AnalogEnvironmentCategory`):**
    1. `salt-flats-evaporites` (4 sites: Salar de Uyuni, Qaidam Basin Playa, Chott el Djerid / Dallol, Death Valley Badwater)
    2. `polar-permafrost` (3 sites: McMurdo Dry Valleys, Axel Heiberg Lost Hammer Spring, Svalbard Spitsbergen)
    3. `volcanic-fields` (4 sites: Craters of the Moon, Askja & Holuhraun, Waw an Namus, Lunar Crater Volcanic Field)
    4. `impact-craters` (4 sites: Haughton Impact Structure, Lonar Basaltic Crater, Meteor Crater, Ries Crater)
    5. `high-altitude-plateaus` (3 sites: Atacama Yungay, Mauna Kea Summit & Saddle, Puna de Atacama / Tibetan Plateau)
    6. `glacial-outwash` (3 sites: Skeiðarársandur Outwash Plain, Søndre Strømfjord Greenland, Wright Valley Outwash)
    7. `lava-tubes-caves` (3 sites: Lava Beds National Monument, Corona Lava Tube Lanzarote, Kazumura / Undara Lava Tubes)
    8. `dry-river-deltas` (3 sites: Lake Salda Carbonate Delta, Ebro Basin Paleo-Fluvial Deltas, Hanksville / Lake Bonneville Deltas)
    9. `serpentinizing-acidic-mineral-systems` (4 sites: Río Tinto Acidic Basin, Samail Ophiolite Oman, Dallol Hydrothermal Complex, Pilbara / Cedars Serpentinizing System)

### 4.2 Step-by-Step Execution Choreography
1. **On `/discover`:**
   - Select **Martian surface** $\rightarrow$ **Jezero Crater Delta** $\rightarrow$ **Geological field research**.
   - Click the **Curated Atlas** mode button (`31 Curated Global Sites`).
2. **Filter by Category & Novelty Tier:**
   - Use the **Category Filter** dropdown to filter across the 9 categories (e.g., select `Impact Craters & Breccias` to compare **Lonar Basaltic Crater, India** and **Meteor Crater, USA** against **Haughton Impact Structure, Canada**, or select `Dry River Deltas & Alluvial Fans` to inspect **Ebro Basin Paleo-Fluvial Deltas, Spain** at **`90.2%`** alongside **Lake Salda, Turkey**).
   - Use the **Novelty Tier Filter** to toggle between `Under-Explored Analogs (23)` and `Canonical Benchmarks (8)`, showing how under-explored sites like **Tibetan Plateau — Qinghai (`92.3%`)** and **Svalbard — Spitsbergen (`91.7%`)** surface high-similarity cold sedimentary environments alongside classic NASA testbeds.
3. **Inspect Provenance, Create Cloud-Synced Snapshot & Export:**
   - Click any candidate (e.g., **Ebro Basin Paleo-Fluvial Deltas** or **Lonar Basaltic Crater**) $\rightarrow$ inspect its **Feature & Provenance Matrix** (showing measured vs. derived classifications, dataset versions, and source URLs).
   - Click **Open Research Workspace** $\rightarrow$ **Create Research Assessment Snapshot** $\rightarrow$ show the **Cloud Synced** badge (when authenticated) and download the **11-section Scientific PDF Report** and **4 CSV exports**.
