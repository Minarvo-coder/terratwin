# PHASE 7.6 — FINAL JUDGE PRESENTATION & STAGE EXECUTION GUIDE

**Project:** TerraTwin — Planetary & Terrestrial Analog Intelligence Engine  
**Team:** HEXARCHY (Six Members)  
**Challenge:** *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars."*  

---

## 1. The 5 Core Takeaways Every Judge Must Remember

1. **Mission-Dependent Similarity:** TerraTwin evaluates terrestrial sites against **5 Lunar and Martian targets** across **12 environmental parameters** and **4 mission profiles** (`rover-testing`, `geological-research`, `lunar-base-construction`, `astrobiology-habitability`). Changing the mission profile changes the top-ranked analog site deterministically.
2. **Multi-Site Portfolio Synergy:** Because no single Earth site replicates Mars or the Moon across all 12 parameters, TerraTwin's **Portfolio Optimizer** pairs complementary sites — such as **Atacama Desert (`80.6%`) + Haughton Impact Structure (`79.5%`) = `90.3%` (`+9.7%` synergy gain)** for Gale Crater rover testing.
3. **Live Regional Discovery with the 40% Evidence Gate:** On `/discover`, users scan bounded WGS84 regions (`<= 16` cells) using live **Open-Meteo Copernicus DEM (90 m)**, **NASA POWER Climatology**, and **Macrostrat Geology**. When weighted coverage falls below **`40%`** (as in a live `2×2` Lake Salda scan under `geological-research` at **`15%` coverage**), TerraTwin **withholds the similarity score (`score: null`)** instead of guessing; switching to `rover-testing` raises coverage to **`45%`** via 5-point DEM slope and computes a **`65.0%` exploratory score (`isVerified: false`)**.
4. **31-Site Curated Global Discovery Atlas:** Pairs live scanning with **31 literature-curated terrestrial sites** (`8` canonical benchmarks + `23` under-explored candidates across `18` countries and `9` categories), including **McMurdo Dry Valleys (`66.5%`)** for Lunar South Pole ISRU (`Shackleton Crater Rim`) and **Tibetan Plateau — Qinghai (`92.3%`)** for Martian geology (`Jezero Crater Delta`).
5. **Reproducible Cloud Research Workspace & Exports:** Every assessment generates deterministic scientific intelligence, saves an immutable `fnv1a`-digested snapshot synced to **Supabase PostgreSQL 17 with Row-Level Security (RLS)** (plus offline `localStorage` fallback), and exports reproducible **PDF, CSV, and JSON** dossiers.

---

## 2. Stage Choreography for Team HEXARCHY (Six Members)

| Minute | Speaker | Screen / Tab | Exact Action on Screen |
|---|---|---|---|
| `0:00–0:30` | **Member 1 (Lead Dev)** | Tab 1: `/` | Point to the Landing Hero (`Lake Salda 86.4% Geo / 81.1% Rover` and `12 Parameters · 31 Atlas Sites · ≥40% Gate · 04 Profiles`). State the challenge and problem. |
| `0:30–1:15` | **Member 2 (Planetary Science) & Member 5 (UI/UX)** | Tab 2: `/explore` | Show `Jezero Crater Delta` profile switch (`rover-testing` → `Haughton 81.4%` vs. `geological-research` → `Atacama 92.6%`), then switch to `Gale Crater` → `Analog Portfolio` (`Atacama + Haughton = 90.3%`). |
| `1:15–2:05` | **Member 3 (Geospatial & Live Data)** | Tab 3: `/discover` | Scroll to **Judge Demo Scenarios (Quick Load)**: click **Load Scenario A1** (`Lake Salda 2×2` under `geological-research`) → click **Launch Regional Scan** (`15%` coverage → `score: null`). Then click **Load Scenario A2** (`rover-testing`) → click **Launch Regional Scan** (`45%` coverage → `65.0%` exploratory). |
| `2:05–2:40` | **Member 4 (Global Atlas)** | Tab 3: `/discover` | Click **Load Scenario B** (`Shackleton Rim` → `McMurdo Dry Valleys 66.5%`) and **Load Scenario C** (`Jezero Delta` → `Tibetan Plateau — Qinghai 92.3%`), showing the `31` curated sites across `18` countries. |
| `2:40–3:00` | **Member 6 (Research Workflow & QA)** | Tab 3: `/discover` | Show the Candidate Scientific Intelligence drawer, save a Research Snapshot (`fnv1a` digest, Supabase Cloud RLS), and click **Export PDF**, **Export CSV**, and **Export JSON**. |

---

## 3. Golden Rules During Live Judge Q&A

1. **Lead with Numbers and Honesty:** Never claim a live regional scan is field-verified (`isVerified: false` always applies to live grid cells), and always cite the **40% coverage gate (`0.40`)** as our core scientific safeguard.
2. **Use `/methodology` and `/sources` as Visual Proof:** If a judge asks about equations or datasets, switch to Tab 4 (`/methodology` or `/sources`) while answering so the judge sees the documented math and NASA/Copernicus/Macrostrat citations on screen.
3. **Keep Answers Under 25 Seconds:** Give the crisp 20-second answer from `PHASE7_STEP4_JUDGE_QA_MASTER_GUIDE.md` first, then offer: *"We can also show you the exact TypeScript implementation or exported JSON schema if you'd like to go deeper."*
