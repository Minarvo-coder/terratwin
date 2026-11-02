# Terrain Comparison & Environmental Parameter Methodology
## Multi-Axis Radar Normalization, Wentworth Regolith Scaling & Terramechanics Synthesis

This document details the scientific and mathematical methodology underpinning the Advanced Terrain Comparison Workspace in TerraTwin.

---

## 1. Mathematical Similarity & Discrepancy Formulations

To compare environmental measurements across extraterrestrial targets and terrestrial analogs without introducing arbitrary thresholds, TerraTwin uses deterministic, normalized discrepancy functions bounded in $[0, 1]$.

### A. Linear Discrepancy Function
Applied to continuous linear physical parameters (e.g. slope, temperature, albedo, rock abundance):

$$d_{\text{linear}} = \min\left(1, \max\left(0, \frac{|x_{\text{target}} - x_{\text{candidate}}|}{\tau}\right)\right)$$

Where $\tau$ is the physically calibrated scientific tolerance:
- **Mean Slope**: $\tau = 25^\circ$
- **Rock Abundance**: $\tau = 40\%$
- **Mean Surface Temperature**: $\tau = 150^\circ\text{C}$
- **Diurnal Temperature Range**: $\tau = 150^\circ\text{C}$
- **Surface Albedo**: $\tau = 0.35$
- **Solar Irradiance**: $\tau = 300\text{ W/m}^2$
- **Vegetation Cover**: $\tau = 40\%$

### B. Logarithmic Discrepancy Function
Applied to physical parameters spanning multiple orders of magnitude (e.g. regolith median grain size):

$$d_{\text{log}} = \min\left(1, \max\left(0, \frac{|\log_{10}(\max(x_{\text{target}}, 10^{-4})) - \log_{10}(\max(x_{\text{candidate}}, 10^{-4}))|}{\tau_{\text{log}}}\right)\right)$$

Where $\tau_{\text{log}} = 2.0$ (representing two orders of magnitude or a factor of 100 variation).

### C. Categorical Petrological Lithology Distance
Rock composition is compared under standard petrological classifications using a hierarchical rock family mapping:

$$d_{\text{lithology}} = \begin{cases} 
0.0 & \text{if } x_{\text{target}} = x_{\text{candidate}} \quad (\text{Exact Lithological Match}) \\ 
0.5 & \text{if } \text{Family}(x_{\text{target}}) = \text{Family}(x_{\text{candidate}}) \quad (\text{Shared Petrological Family}) \\ 
1.0 & \text{otherwise} \quad (\text{Divergent Rock Family})
\end{cases}$$

#### Rock Family Classifications
- **Igneous**: `basaltic`, `anorthositic`, `volcanic-tephra`
- **Sedimentary**: `clay-sedimentary`, `sulfate-evaporite`
- **Impact**: `impact-breccia`
- **Crystalline**: `felsic-crystalline`

### D. Mission-Weighted Aggregate Score
The overall match fidelity score $S$ is computed deterministically:

$$D = \frac{\sum_{i \in \text{valid}} w_i \cdot d_i}{\sum_{i \in \text{valid}} w_i}$$
$$S = 100 \cdot (1 - D)$$

Where:
- $w_i$ is the weight assigned to feature $i$ under the active mission purpose (`Rover testing & trafficability` vs `Geological field research`).
- Non-comparable quantities (atmospheric pressure, precipitation) and unmeasured parameters are strictly excluded from the denominator sum.

---

## 2. Multi-Axis Radar (Spider) Chart Normalization

To project disparate physical units onto a unified $0\text{–}100\%$ radar polygon without distorting scientific meaning:

| Radar Axis | Feature Key | Minimum Bound | Maximum Bound | Scale Type |
| :--- | :--- | :--- | :--- | :--- |
| **Terrain Slope** | `meanSlopeDeg` | $0^\circ$ | $30^\circ$ | Linear |
| **Rock Abundance** | `rockAbundancePct` | $0\%$ | $35\%$ | Linear |
| **Median Grain Size** | `medianGrainSizeMm` | $0.01\text{ mm}$ | $5.0\text{ mm}$ | Logarithmic |
| **Surface Albedo** | `albedo` | $0.05$ | $0.40$ | Linear |
| **Mean Temperature**| `meanSurfaceTempC` | $-150^\circ\text{C}$ | $+35^\circ\text{C}$ | Linear |
| **Solar Irradiance** | `surfaceSolarIrradianceWm2` | $50\text{ W/m}^2$ | $350\text{ W/m}^2$ | Linear |

Linear normalization:
$$N_{\text{linear}} = \text{round}\left(\min\left(1, \max\left(0, \frac{x - \min}{\max - \min}\right)\right) \cdot 100\right)$$

Logarithmic normalization:
$$N_{\text{log}} = \text{round}\left(\min\left(1, \max\left(0, \frac{\log_{10}(x) - \log_{10}(\min)}{\log_{10}(\max) - \log_{10}(\min)}\right)\right) \cdot 100\right)$$

---

## 3. Wentworth Sediment Grain Size Scale

Regolith grain sizes are mapped to the internationally standardized **Wentworth Sediment Grade Scale (1922)** for geotechnical soil analysis:

| Grain Size Range ($d$) | Wentworth Classification | Geotechnical Terramechanics Implications |
| :--- | :--- | :--- |
| $d < 0.004\text{ mm}$ | **Clay** | Extreme cohesion when hydrated; electrostatically adhesive under vacuum. |
| $0.004\text{ mm} \le d < 0.063\text{ mm}$ | **Silt** | Fine airborne dust fraction; high wheel slip risk; seals bearing assemblies. |
| $0.063\text{ mm} \le d < 0.125\text{ mm}$ | **Very Fine Sand** | Typical mature lunar regolith ($d_{50} \sim 0.07\text{ mm}$); moderate sinkage. |
| $0.125\text{ mm} \le d < 0.25\text{ mm}$ | **Fine Sand** | Martian ripple dune sand; high wheel sinkage if uncompacted. |
| $0.25\text{ mm} \le d < 0.5\text{ mm}$ | **Medium Sand** | Jezero Crater delta sediments; moderate internal friction angle ($\phi \sim 32^\circ$). |
| $0.5\text{ mm} \le d < 1.0\text{ mm}$ | **Coarse Sand** | Cohesive granular substrate; high wheel traction for grousers. |
| $1.0\text{ mm} \le d < 2.0\text{ mm}$ | **Very Coarse Sand** | Meridiani Planum hematite spherule lag deposits; low wheel sinkage. |
| $2.0\text{ mm} \le d < 64.0\text{ mm}$ | **Gravel / Granule** | Impact ejecta fragments; increases grouser wear. |
| $d \ge 64.0\text{ mm}$ | **Cobble / Boulder** | Critical obstacle clearance hazard; requires path deviation. |

---

## 4. Rover Mobility Hazard Classifiers

### A. Terrain Slope Incline Classification
- **Low Slope ($<5^\circ$)**: Gentle plains, nominal cruise speed, minimal tilt hazard.
- **Moderate Incline ($5^\circ\text{–}15^\circ$)**: Standard climb envelope; nominal drive motor torque scaling.
- **Steep Incline ($15^\circ\text{–}25^\circ$)**: High wheel slip zone; requires active torque management and slip-ratio compensation.
- **Critical Incline ($>25^\circ$)**: Near or exceeding rover static stability rollover limit ($\sim 30^\circ$ for Curiosity/Perseverance).

### B. Surface Boulder Hazard Classification
- **Low Rock Density ($<7\%$)**: Unobstructed navigation; automated hazard avoidance rarely triggers deviations.
- **Nominal Boulder Field ($7\%\text{–}16\%$)**: Representative planetary landing site; standard path planner obstacle avoidance.
- **Severe Obstacle Hazard ($>16\%$)**: High risk of belly-pan stranding and wheel entrapment; requires slow autonomous hazard detection.

---

## 5. Automated Data-Driven Scientific Synthesis

The scientific interpretation panel generates real findings strictly from calculated values:
1. **Mobility & Trafficability**: Computes $|\theta_{\text{target}} - \theta_{\text{cand}}|$ and evaluates drive kinematics, obstacle clearance, and regolith wheel traction.
2. **Thermal & Radiative Extremes**: Evaluates temperature deltas, diurnal swings, and notes the physical constraint that radiative cooling in vacuum cannot be duplicated under Earth's convective atmosphere.
3. **Geological & Astrobiological Fidelity**: Assesses mineralogical and spectral equivalence (e.g. Lake Salda hydromagnesite stromatolites for Jezero crater delta astrobiology).
4. **Mission Suitability Verdict**: Dynamically outlines primary testing strengths and critical testing limitations grounded in actual telemetry.
