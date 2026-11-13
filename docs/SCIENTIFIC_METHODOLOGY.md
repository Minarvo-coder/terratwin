# TerraTwin — Scientific Methodology & Mathematical Formulation

**Project:** TerraTwin: Planetary Analog Portfolio Optimizer & Mission Control Suite  
**Team:** HEXARCHY (NASA Space Apps Challenge)  
**Primary Codebase Modules:**
- [`src/lib/terratwin/similarity-engine.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/similarity-engine.ts)
- [`src/lib/terratwin/portfolio-optimizer.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/portfolio-optimizer.ts)
- [`src/lib/terratwin/config/comparison-config.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/config/comparison-config.ts)
- [`src/lib/terratwin/services/elevation-service.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/services/elevation-service.ts)
- [`src/lib/terratwin/terrain-comparison.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/terrain-comparison.ts)
- [`src/lib/terratwin/evidence-lineage.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/evidence-lineage.ts)

---

## 1. Scientific Background of Planetary Analog Research

Before sending a multibillion-dollar rover, drill, or human crew to the Moon or Mars, mission engineers and planetary scientists must test their hardware and operational procedures on Earth. Locations on Earth that share specific physical, geological, topographic, or thermal characteristics with an extraterrestrial destination are called **Terrestrial Planetary Analogs** (Farr et al., 2002; Léveillé, 2009).

However, **no single location on Earth is an identical twin of Mars or the Moon**:
- Earth has a dense nitrogen-oxygen atmosphere (~$101,325\text{ Pa}$ at sea level), an active liquid water cycle, and a global biosphere.
- Mars has a thin $\text{CO}_2$ atmosphere (~$610\text{–}840\text{ Pa}$), extreme cold ($-48^\circ\text{C}$ to $-60^\circ\text{C}$), and $0.38g$ gravity.
- The Moon has an ultra-high vacuum exosphere ($\sim 3 \times 10^{-10}\text{ Pa}$), $260^\circ\text{C}$ diurnal temperature swings, and $0.166g$ gravity.

Consequently, planetary analog selection is fundamentally a **mission-specific, multi-parameter trade-off problem**:
- A **Rover Mobility Engineer** needs matching terrain slope ($\theta$), boulder hazard density, and regolith grain size ($D_{50}$) to test wheel sinkage and autonomous hazard avoidance.
- A **Planetary Geologist / Astrobiologist** needs matching bedrock mineralogy (e.g., basaltic lava, clay-bearing deltaic mudstones, or acidic jarosite evaporites) and zero vegetative cover to calibrate spectrometers and coring drills.

---

## 2. Core Research Question

> **How can mission planners transparently evaluate, rank, and combine terrestrial analog field sites against lunar and Martian landing targets using heterogeneous NASA and ESA remote-sensing datasets—without fabricating missing measurements or equating physically incompatible quantities?**

TerraTwin addresses this question through two linked mathematical frameworks:
1. **Single-Site Multi-Attribute Proximity Scoring (`computeAnalogSimilarity`)**: Evaluates individual Earth analog sites against a target under configurable mission weight profiles while enforcing strict physical compatibility and data-coverage guardrails.
2. **Combinatorial Multi-Site Portfolio Optimization (`optimizeAnalogPortfolios`)**: Evaluates combinations of $k \in \{2, 3\}$ Earth sites so complementary locations (e.g., a volcanic lava field for trafficability paired with a polar desert for thermal stress) form an integrated **Mission Testing Suite**.

---

## 3. Verified Planetary Target Locations (5 Sites)

TerraTwin models **5 extraterrestrial landing targets** (3 on Mars, 2 on the Moon) backed by orbital laser altimetry and surface rover/radiometer telemetry:

| Target ID | Planetary Body | Coordinates | Reference Datum Elevation | Dominant Lithology | Scientific & Mission Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gale Crater (Aeolis Mons)** | Mars | $5.36^\circ\text{S}, 137.86^\circ\text{E}$ | $-893\text{ m}$ (MOLA Areoid) | `clay-sedimentary` | NASA Mars Science Laboratory (*Curiosity*) landing site; layered clay and sulfate strata recording ancient aqueous transition. |
| **Jezero Crater Delta** | Mars | $18.38^\circ\text{N}, 77.58^\circ\text{E}$ | $-2,651\text{ m}$ (MOLA Areoid) | `clay-sedimentary` | NASA Mars 2020 (*Perseverance*) landing site; ancient fluvio-deltaic fan with carbonate and phyllosilicate sediments. |
| **Meridiani Planum** | Mars | $1.94^\circ\text{S}, 5.53^\circ\text{W}$ | $-1,420\text{ m}$ (MOLA Areoid) | `sulfate-evaporite` | NASA MER-B (*Opportunity*) landing site; flat plains of acidic sulfate-rich sandstones and hematite concretions ("blueberries"). |
| **Shackleton Crater Rim (South Pole)** | Moon | $89.90^\circ\text{S}, 0.00^\circ\text{E}$ | $+102.5\text{ m}$ (LOLA Sphere) | `anorthositic` | Artemis III candidate region; rugged lunar highland terrain with steep crater walls, low sun angles, and cryogenic cold traps. |
| **Mare Tranquillitatis** | Moon | $0.67^\circ\text{N}, 23.47^\circ\text{E}$ | $-1,883\text{ m}$ (LOLA Sphere) | `basaltic` | Historic Apollo 11 landing region; low-relief equatorial flood basalt plains with mature, fine-grained regolith. |

---

## 4. Candidate Earth Analog Locations (8 Verified + 8 Sample Sites)

### 4.1 Primary Verified Catalog (100% Telemetry Coverage across 12 Parameters)

| Candidate Site | Country | Coordinates | Elevation (MSL) | Lithology Class | Primary Analog Domain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Atacama Desert (Yungay Plateau)** | Chile | $24.08^\circ\text{S}, 69.93^\circ\text{W}$ | $+3,409\text{ m}$ | `sulfate-evaporite` | Hyper-arid soil chemistry, zero vegetation ($0\%$), high solar flux ($295\text{ W/m}^2$). |
| **McMurdo Dry Valleys** | Antarctica | $77.50^\circ\text{S}, 162.00^\circ\text{E}$ | $+1,139\text{ m}$ | `basaltic` (Dolerite) | Extreme cold ($-20^\circ\text{C}$), hyper-arid polar permafrost, zero vegetation ($0\%$). |
| **Haughton Impact Structure (Devon Island)** | Canada | $75.38^\circ\text{N}, 89.68^\circ\text{W}$ | $+173\text{ m}$ | `impact-breccia` | Polar impact crater morphology, cold climate ($-16^\circ\text{C}$), NASA HMP testing site. |
| **Mauna Kea Volcanic Saddle** | USA (Hawaii) | $19.76^\circ\text{N}, 155.46^\circ\text{W}$ | $+636\text{ m}$ | `volcanic-tephra` | Basaltic tephra slopes ($10^\circ$), ISRU oxygen extraction & lunar rover trials. |
| **Lake Salda** | Turkey | $37.55^\circ\text{N}, 29.68^\circ\text{E}$ | $+1,193\text{ m}$ | `clay-sedimentary` | Hydromagnesite microbialites & deltaic carbonates; official NASA Jezero Crater analog. |
| **Craters of the Moon** | USA (Idaho) | $43.46^\circ\text{N}, 113.56^\circ\text{W}$ | $+1,805\text{ m}$ | `basaltic` | Unweathered basaltic lava flows, high rock abundance ($42\%$), Apollo training site. |
| **Askja Caldera & Holuhraun** | Iceland | $64.90^\circ\text{N}, 16.83^\circ\text{W}$ | $+1,100\text{ m}$ | `basaltic` | Fresh flood basalt & volcanic sand, $0\%$ vegetation, low albedo ($0.08$). |
| **Río Tinto Acidic Basin** | Spain | $37.70^\circ\text{N}, 6.55^\circ\text{W}$ | $+310\text{ m}$ | `sulfate-evaporite` | Hyper-acidic iron/jarosite precipitates; premier Meridiani Planum mineralogical analog. |

*(An additional 8 sites in `src/lib/terratwin/sample-dataset.ts`—Hanksville MDRS, Lanzarote Timanfaya, Pilbara Craton, Meteor Crater, Nördlinger Ries, Teide National Park, Svalbard Bockfjord, and Death Valley Badwater—are available in Demo/Sample Catalog mode and deliberately include missing fields to test the 40% coverage threshold.)*

---

## 5. Authoritative Dataset Sources and Citations (8 Sources)

Every measurement in the verified database (`public.environmental_features`) is linked via foreign key (`source_id`) to one of these 8 official scientific archives:

| # | Dataset Title | Provider | Archive URL | Version | Primary Parameters Supplied |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **NASA POWER Climatology Native Resolution** | NASA Langley Research Center (LaRC) | `https://power.larc.nasa.gov/api/temporal/climatology/point` | API v2.10.1 (2001–2025) | Earth `meanSurfaceTempC`, `diurnalTempRangeC`, `annualPrecipitationMm`, `surfacePressurePa`, `surfaceSolarIrradianceWm2` |
| 2 | **Mars Global Surveyor MOLA MEGDR / DEM** | NASA GSFC / USGS Astrogeology | `https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif` | PDS3 / ISIS3 v2.0 ($463\text{ m/px}$) | Mars `elevationM`, `meanSlopeDeg`, and local binary DEM grids |
| 3 | **Lunar Reconnaissance Orbiter LOLA DEM** | NASA GSFC / USGS Astrogeology | `https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif` | LDEM_118m_Mar2014 ($118\text{ m/px}$) | Lunar `elevationM`, `meanSlopeDeg`, and local binary DEM grids |
| 4 | **MSL Curiosity REMS & Mars 2020 MEDA** | NASA / JPL-Caltech / PDS Atmospheres Node | `https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity.html` | MSL-REMS / M2020-MEDA PDS4 | Gale & Jezero `meanSurfaceTempC`, `diurnalTempRangeC`, `surfacePressurePa`, `surfaceSolarIrradianceWm2`, `rockAbundancePct`, `medianGrainSizeMm`, `lithology` |
| 5 | **LRO Diviner Lunar Radiometer Experiment** | NASA / UCLA / PDS Geosciences Node | `https://pds-geosciences.wustl.edu/missions/lro/diviner.htm` | LRO-L-DLRE-4-RDR-V1.0 | Lunar `meanSurfaceTempC`, `diurnalTempRangeC`, `rockAbundancePct`, `albedo`, `medianGrainSizeMm`, `lithology` |
| 6 | **NASA SRTMGL1 v003 & Copernicus GLO-30 DEM** | NASA LP DAAC / USGS / ESA | `https://lpdaac.usgs.gov/products/srtmgl1v003/` | SRTMGL1 v003 / GLO-30 ($30\text{ m}$) | Earth `elevationM`, `meanSlopeDeg`, and local binary DEM grids |
| 7 | **MODIS/Terra LST, Albedo & NDVI** | NASA LP DAAC | `https://lpdaac.usgs.gov/products/mod11a2v061/` | MOD11A2 / MOD09GA Collection 6.1 | Earth `albedo` ($500\text{ m}$) and `vegetationCoverPct` ($250\text{ m}$) |
| 8 | **MER Opportunity Athena & Apollo CCGE / LAMP** | NASA / JPL / Cornell / GSFC | `https://pds-geosciences.wustl.edu/missions/mer/` | MER2-M-ATHENA-4-GSE-V1.0 | Meridiani Planum surface suite & Lunar ultra-high vacuum pressure ($3 \times 10^{-10}\text{ Pa}$) |

---

## 6. Parameter Selection & 4-Tier Harmonization Framework

Planetary and terrestrial instruments measure the universe at vastly different spatial resolutions ($30\text{ m}$ SRTM vs. $463\text{ m}$ MOLA) and vertical datums (Earth Mean Sea Level vs. Mars gravity areoid). In `src/lib/terratwin/config/comparison-config.ts` and `src/lib/terratwin/evidence-lineage.ts`, every parameter is classified into a **4-Tier Scientific Compatibility Framework**:

| Parameter Key | Label | Unit | Norm. Kind | Tolerance ($\tau_i$) | Harmonization Tier | Rover Weight | Geo Weight |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `meanSlopeDeg` | Mean terrain slope | $^\circ$ | Linear | $25^\circ$ | **Tier 1: Directly Comparable** | `0.25` | `0.10` |
| `rockAbundancePct` | Rock abundance / roughness | $\%$ | Linear | $40\%$ | **Tier 1: Directly Comparable** | `0.20` | `0.10` |
| `medianGrainSizeMm` | Median regolith grain size | $\text{mm}$ | Logarithmic | $2.0\text{ dec}$ | **Tier 1: Directly Comparable** | `0.15` | `0.10` |
| `elevationM` | Elevation relative to datum | $\text{m}$ | Linear | $5,000\text{ m}$ | **Tier 2: Comparable with Datum Caveats** | `0.10` | `0.00` |
| `vegetationCoverPct` | Vegetation cover | $\%$ | Linear | $40\%$ | **Tier 3: Terrestrial Context** ($0\%$ target) | `0.10` | `0.15` |
| `diurnalTempRangeC` | Diurnal temperature range | $^\circ\text{C}$ | Linear | $150^\circ\text{C}$ | **Tier 1: Directly Comparable** | `0.05` | `0.00` |
| `meanSurfaceTempC` | Mean surface temperature | $^\circ\text{C}$ | Linear | $150^\circ\text{C}$ | **Tier 1: Directly Comparable** | `0.05` | `0.05` |
| `surfaceSolarIrradianceWm2` | Surface solar irradiance | $\text{W/m}^2$ | Linear | $300\text{ W/m}^2$ | **Tier 1: Directly Comparable** | `0.05` | `0.05` |
| `lithology` | Dominant lithology | — | Categorical | Rock Family | **Tier 1: Directly Comparable** | `0.05` | `0.30` |
| `albedo` | Surface albedo | — | Linear | $0.35$ | **Tier 1: Directly Comparable** | `0.00` | `0.15` |
| `annualPrecipitationMm` | Annual precipitation | $\text{mm/yr}$ | Excluded | $500\text{ mm/yr}$ | **Tier 4: Physically Excluded** | `0.00` | `0.00` |
| `surfacePressurePa` | Surface atmospheric pressure | $\text{Pa}$ | Excluded | $2.0\text{ dec}$ | **Tier 4: Physically Excluded** | `0.00` | `0.00` |

---

## 7. Data Preprocessing & Topographic Derivation Mathematics

### 7.1 Horn's (1981) $3 \times 3$ Finite-Difference Slope Algorithm
Implemented in [`src/lib/terratwin/services/elevation-service.ts`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/lib/terratwin/services/elevation-service.ts) and [`scripts/fetch-and-ingest-real-data.mjs`](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/scripts/fetch-and-ingest-real-data.mjs). Given a $3 \times 3$ elevation window centered at cell $(r, c)$ with horizontal cell spacing $\Delta x$ and vertical cell spacing $\Delta y$:

$$\begin{bmatrix} z_{00} & z_{01} & z_{02} \\ z_{10} & z_{11} & z_{12} \\ z_{20} & z_{21} & z_{22} \end{bmatrix}$$

The east-west ($\frac{\partial z}{\partial x}$) and north-south ($\frac{\partial z}{\partial y}$) topographic gradients are computed via weighted third-order finite differences (Horn, 1981):

$$\frac{\partial z}{\partial x} = \frac{(z_{02} + 2z_{12} + z_{22}) - (z_{00} + 2z_{10} + z_{20})}{8 \cdot \Delta x}$$

$$\frac{\partial z}{\partial y} = \frac{(z_{00} + 2z_{01} + z_{02}) - (z_{20} + 2z_{21} + z_{22})}{8 \cdot \Delta y}$$

where metric cell dimensions on a planetary sphere of radius $R$ ($R_{\text{Earth}} = 6,371,000\text{ m}$, $R_{\text{Mars}} = 3,389,500\text{ m}$, $R_{\text{Moon}} = 1,737,400\text{ m}$) at latitude $\phi$ are:

$$\Delta y = R \cdot \Delta\phi_{\text{rad}}, \qquad \Delta x = R \cdot \Delta\lambda_{\text{rad}} \cdot \cos(\phi)$$

The local slope angle $\theta$ in degrees is then:

$$\theta = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right) \times \frac{180}{\pi}$$

### 7.2 Spherical Linear Interpolation (Slerp) for Geodesic Elevation Transects
To extract an elevation cross-section between start coordinates $(\phi_1, \lambda_1)$ and end coordinates $(\phi_2, \lambda_2)$ across a planetary surface of radius $R$, TerraTwin converts both endpoints to 3D unit vectors $\mathbf{u}_1, \mathbf{u}_2 \in \mathbb{R}^3$, computes the central angle $\Omega = \arccos(\mathbf{u}_1 \cdot \mathbf{u}_2)$ and total geodesic arc length $L = R \cdot \Omega$, and samples $N$ points ($t \in [0, 1]$) along the great-circle path:

$$\mathbf{u}(t) = \frac{\sin((1 - t)\Omega)}{\sin\Omega}\mathbf{u}_1 + \frac{\sin(t\Omega)}{\sin\Omega}\mathbf{u}_2$$

At each interpolated coordinate, elevation is extracted from the binary `Float32Array` DEM grid via **bilinear interpolation** across the 4 surrounding grid cells.

---

## 8. Similarity Calculation Formulas

Let $T$ be the planetary target and $C$ be an Earth candidate. For each feature $i \in \{1, \dots, 12\}$:

### 8.1 Feature-Level Normalized Distance ($d_i \in [0, 1]$)
1. **Linear Normalization (`calculateLinearDifference`)**:
   $$d_i(T, C) = \min\left(1, \max\left(0, \frac{|T_i - C_i|}{\tau_i}\right)\right)$$
2. **Logarithmic Normalization (`calculateLogarithmicDifference`)** for `medianGrainSizeMm` (with floor $\epsilon = 10^{-4}\text{ mm}$):
   $$d_i(T, C) = \min\left(1, \max\left(0, \frac{\left|\log_{10}(\max(T_i, \epsilon)) - \log_{10}(\max(C_i, \epsilon))\right|}{\tau_i}\right)\right)$$
3. **Categorical Petrological Distance (`calculateLithologyDistance`)**:
   Each lithology belongs to a petrological family in `LITHOLOGY_FAMILIES` (`igneous`: `basaltic`, `anorthositic`, `volcanic-tephra`; `sedimentary`: `clay-sedimentary`, `sulfate-evaporite`; `metamorphic-impact`: `impact-breccia`):
   $$d_i(T, C) = \begin{cases} 0.0 & \text{if } T_i = C_i \\ 0.5 & \text{if } T_i \neq C_i \text{ and } \text{Family}(T_i) = \text{Family}(C_i) \\ 1.0 & \text{if } \text{Family}(T_i) \neq \text{Family}(C_i) \end{cases}$$

Each feature's individual similarity is $s_i = 1 - d_i \in [0, 1]$.

### 8.2 Data Coverage ($\kappa$), Weighted Distance ($D$), and Similarity Score ($S$)
Let $\mathcal{A} = \{i \mid w_i > 0\}$ be the active mission features, and $\mathcal{V} = \{i \in \mathcal{A} \mid \text{status}_i = \text{\texttt{"comparable"}}\}$ be the valid comparable features with non-null telemetry on both bodies.

$$\text{Coverage } (\kappa) = \frac{\sum_{i \in \mathcal{V}} w_i}{\sum_{j \in \mathcal{A}} w_j}$$

If $\kappa \ge 0.40$ (`MIN_RELIABLE_COVERAGE`), the composite weighted distance $D \in [0, 1]$ and illustrative similarity score $S \in [0, 100]$ are:

$$D(T, C) = \frac{\sum_{i \in \mathcal{V}} w_i \cdot d_i(T, C)}{\sum_{i \in \mathcal{V}} w_i}, \qquad S(T, C) = 100 \times \left(1 - D(T, C)\right)$$

If $\kappa < 0.40$, TerraTwin refuses to output a misleading numerical score (`score = null`, `isReliable = false`).

---

## 9. Multi-Site Portfolio Optimization Formulas

Given a pool of $n$ Earth candidates and a desired portfolio size $k \in \{2, 3\}$:
1. **Combinatorial Search Space**: Generates all $\binom{n}{k} = \frac{n!}{k!(n-k)!}$ unique candidate subsets $P = \{C_1, \dots, C_k\}$.
2. **Parameter Attribution & Envelope Minimization**: For each active feature $i \in \mathcal{A}$, the portfolio utilizes the best-matching site $C^*_i \in P$:
   $$d_{P,i} = \min_{C \in P \text{ comparable}} d_i(T, C), \qquad C^*_i = \arg\min_{C \in P} d_i(T, C)$$
3. **Composite Portfolio Score ($S_P$) and Synergy Gain ($\Delta S$)**:
   $$D_P = \frac{\sum_{i \in \mathcal{V}_P} w_i \cdot d_{P,i}}{\sum_{i \in \mathcal{V}_P} w_i}, \qquad S_P = 100 \times (1 - D_P)$$
   $$\Delta S_{\text{synergy}} = S_P - \max_{C \in P} S(T, C), \qquad \Delta \kappa_{\text{coverage}} = \kappa_P - \kappa(C_{\text{best single}})$$

---

## 10. Worked Numerical Example (Step-by-Step Verification)

Let us trace the exact mathematical calculation for **Target: Gale Crater (`mars-gale-crater`)** vs. **Candidate: Lake Salda (`lake-salda`)** under the **Rover Testing & Trafficability Profile (`ROVER_TESTING_PROFILE`)**:

| Parameter ($i$) | Weight ($w_i$) | Gale Crater ($T_i$) | Lake Salda ($C_i$) | Tolerance ($\tau_i$) | Formula Calculation | Normalized Diff ($d_i$) | Similarity ($s_i$) | Weighted Diff ($w_i \cdot d_i$) |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| `meanSlopeDeg` | `0.25` | $4.5^\circ$ | $6.5^\circ$ | $25^\circ$ | $\|4.5 - 6.5\| / 25 = 2.0 / 25$ | `0.080` | `0.920` (92%) | $0.25 \times 0.080 = 0.02000$ |
| `rockAbundancePct` | `0.20` | $8\%$ | $12\%$ | $40\%$ | $\|8 - 12\| / 40 = 4 / 40$ | `0.100` | `0.900` (90%) | $0.20 \times 0.100 = 0.02000$ |
| `medianGrainSizeMm` | `0.15` | $0.25\text{ mm}$ | $0.45\text{ mm}$ | $2.0\text{ dec}$ | $\|\log_{10}(0.25) - \log_{10}(0.45)\| / 2.0 = 0.25527 / 2$ | `0.128` | `0.872` (87.2%) | $0.15 \times 0.128 = 0.01920$ |
| `elevationM` | `0.10` | $-893\text{ m}$ | $+1,193\text{ m}$ | $5,000\text{ m}$ | $\|-893 - 1193\| / 5000 = 2086 / 5000$ | `0.417` | `0.583` (58.3%) | $0.10 \times 0.417 = 0.04170$ |
| `vegetationCoverPct` | `0.10` | $0\%$ | $10\%$ | $40\%$ | $\|0 - 10\| / 40 = 10 / 40$ | `0.250` | `0.750` (75%) | $0.10 \times 0.250 = 0.02500$ |
| `diurnalTempRangeC` | `0.05` | $85^\circ\text{C}$ | $14^\circ\text{C}$ | $150^\circ\text{C}$ | $\|85 - 14\| / 150 = 71 / 150$ | `0.473` | `0.527` (52.7%) | $0.05 \times 0.473 = 0.02365$ |
| `meanSurfaceTempC` | `0.05` | $-48^\circ\text{C}$ | $+12.5^\circ\text{C}$ | $150^\circ\text{C}$ | $\|-48 - 12.5\| / 150 = 60.5 / 150$ | `0.403` | `0.597` (59.7%) | $0.05 \times 0.403 = 0.02015$ |
| `surfaceSolarIrradianceWm2` | `0.05` | $148\text{ W/m}^2$ | $210\text{ W/m}^2$ | $300\text{ W/m}^2$ | $\|148 - 210\| / 300 = 62 / 300$ | `0.207` | `0.793` (79.3%) | $0.05 \times 0.207 = 0.01035$ |
| `lithology` | `0.05` | `clay-sedimentary` | `clay-sedimentary` | Exact Match | Exact class equality | `0.000` | `1.000` (100%) | $0.05 \times 0.000 = 0.00000$ |

- **Sum of Active Mission Weights ($\sum w_i$)**: $0.25 + 0.20 + 0.15 + 0.10 + 0.10 + 0.05 + 0.05 + 0.05 + 0.05 = 1.00$
- **Coverage ($\kappa$)**: $1.00 / 1.00 = 1.00$ ($100\%$ verified coverage $\rightarrow$ `confidence: "high"`, `isReliable: true`)
- **Weighted Distance ($D$)**:
  $$D = \frac{0.02000 + 0.02000 + 0.01920 + 0.04170 + 0.02500 + 0.02365 + 0.02015 + 0.01035 + 0.00000}{1.00} = 0.18005 \approx 0.180$$
- **Final Similarity Score ($S$)**:
  $$S = 100 \times (1 - 0.18005) = 81.995 \approx \mathbf{82.0\%}$$

Now consider adding **Atacama Desert (`atacama-yungay`)** to form a **2-Site Portfolio (`Lake Salda + Atacama Desert`)**:
- Atacama has $0\%$ vegetation ($d_{\text{veg}} = 0.000$ vs. Lake Salda's $0.250$), $4.0^\circ$ slope ($d_{\text{slope}} = 0.020$ vs. $0.080$), $10\%$ rock cover ($d_{\text{rock}} = 0.050$ vs. $0.100$), and $25^\circ\text{C}$ diurnal swing ($d_{\text{diurnal}} = 0.400$ vs. $0.473$).
- Taking the parameter-by-parameter minimum distance across the pair drops $D_P$ from $0.180$ down to $0.126$, boosting the composite **Portfolio Score ($S_P$) to $87.4\%$**—a **Synergy Gain of $+5.4$ percentage points** over the best single site!

---

## 11. Uncertainty, Confidence Tiers, and Missing Data Handling

| Data Coverage ($\kappa$) | Confidence Tier (`DataConfidence`) | System Behavior |
| :--- | :--- | :--- |
| $\kappa \ge 0.90$ ($90\%+$) | `high` | Ranked normally with green `High Confidence` badge. |
| $0.70 \le \kappa < 0.90$ | `moderate` | Ranked normally with cyan `Moderate Confidence` badge; missing features listed. |
| $0.40 \le \kappa < 0.70$ | `low` | Ranked with amber `Low Confidence` warning badge; user alerted to partial coverage. |
| $\kappa < 0.40$ ($<40\%$) | `insufficient` | **Refuses to produce a numerical score** (`score = null`, `isReliable = false`); sorted to bottom of table to prevent sparse-data bias. |

---

## 12. Scientific Limitations & Appropriate Interpretation

1. **Multi-Attribute Proximity Index, Not Statistical Probability**: An $82.0\%$ score does **not** mean an $82\%$ probability of mission success or physical equivalence. It means the weighted normalized environmental distance is $D = 0.180$ relative to the configured engineering tolerances.
2. **Spatial Resolution Scale Disparity**: Orbital DEMs (MOLA at $463\text{ m/px}$, LOLA at $118\text{ m/px}$, SRTM at $30\text{ m/px}$) smooth out meter-scale hazards such as small craters and sharp ledges. TerraTwin supplements orbital slope with rover/lander ground-truth rock abundance (`rockAbundancePct`) and grain size (`medianGrainSizeMm`), and explicitly displays spatial resolution metadata on every chart.
3. **Unreproducible Extraterrestrial Physics**: Reduced gravity ($0.38g$ on Mars, $0.166g$ on Moon), hard vacuum, and galactic cosmic radiation cannot be replicated in open-air Earth field sites and require dedicated indoor vacuum chambers or parabolic flights.

