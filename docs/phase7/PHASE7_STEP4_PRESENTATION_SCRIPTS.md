# PHASE 7.4 — MULTI-LENGTH PRESENTATION SCRIPTS (90s, 3m, 5m, 7m)

**Project:** TerraTwin  
**Team:** HEXARCHY (Six Members)  
**Phase:** 7.4 — Judge Technical Defense & Six-Member Training  

---

## Script 1 — 90-Second Rapid Pitch (Lightning Round / Table Walk-By)

- **[0:00–0:20 | Member 1 — Screen: `/` Landing Hero]**  
  "Before NASA sends a rover to Jezero Crater or builds an Artemis habitat at the Lunar South Pole, engineers must test hardware in Earth analog environments. But no place on Earth replicates all of Mars or the Moon, and existing analog selection relies on scattered papers or black-box scores that hide missing data. We built **TerraTwin**."
- **[0:20–0:45 | Member 2 — Screen: `/explore` Flight Deck → `Gale Crater` + `Analog Portfolio`]**  
  "TerraTwin evaluates terrestrial sites against **5 verified Lunar and Martian targets** across **12 environmental parameters** and **4 mission profiles**. Switching Jezero Crater from `Rover Testing` to `Geological Research` shifts #1 from **Haughton Impact Structure (`81.4%`)** to the **Atacama Desert (`92.6%`)**. And for Gale Crater rover testing, our **Portfolio Optimizer** shows that combining **Atacama (`80.6%`) + Haughton (`79.5%`)** achieves **`90.3%` mission coverage (`+9.7%` synergy gain)**."
- **[0:45–1:10 | Member 3 — Screen: `/discover` → Click `DEMO A1` then `DEMO A2`]**  
  "On `/discover`, we screen bounded WGS84 regions live using **Open-Meteo Copernicus DEM**, **NASA POWER**, and **Macrostrat** — enforced by a strict **40% reliable coverage gate**. Scanning Lake Salda, Turkey under `Geological Research` returns **`15%` coverage** because Macrostrat lacks detailed mineralogy outside the U.S., so TerraTwin **withholds the score (`score: null`)** instead of guessing. Switching to `Rover Testing` raises coverage to **`45%`** via DEM slope and computes a **`65.0%` exploratory score**."
- **[1:10–1:30 | Member 4 & Member 6 — Screen: `/discover` → Click `DEMO C` → Export PDF/CSV/JSON]**  
  "Alongside live scanning, our **31-site Global Discovery Atlas** spans **18 countries** and **23 under-explored candidates** — like **Tibetan Plateau — Qinghai at `92.3%`**. Researchers can save immutable, cloud-synced snapshots protected by Supabase Row-Level Security and export **PDF, CSV, and JSON** field-readiness dossiers in one click."

---

## Script 2 — 3-Minute Standard Hackathon Pitch (Six-Member Coordinated)

- **[0:00–0:30 | Member 1 (Lead Dev) — Screen: `/` Landing Hero]**  
  "Hello judges, we are Team **HEXARCHY**, and this is **TerraTwin** — a deterministic planetary analog discovery and research platform built for the challenge *'Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars.'* Every planetary mission tests hardware on Earth, yet analog selection today suffers from three gaps: mission weights are rarely explicit, single sites leave testing blind spots, and missing satellite data is often disguised by fabricated averages."
- **[0:30–1:05 | Member 2 (Planetary Science) & Member 5 (UI/UX) — Screen: `/explore`]**  
  "**[Member 5]:** In the `/explore` Flight Deck, we pair an interactive 3D Moon/Mars globe — with an automatic 2D telemetry grid fallback — with a dark-canvas Earth analog map and 12-axis comparison radar.  
  **[Member 2]:** Watch what happens when we evaluate **Jezero Crater Delta** across our **4 mission profiles**. Under `Rover Testing` — where slope (`25%`), rock abundance (`20%`), and grain size (`15%`) dominate — **Haughton Impact Structure (`81.4%`)** and **Lake Salda (`81.1%`)** rank highest. Switch to `Geological Research` — where lithology (`30%`) and mineralogy (`25%`) dominate — and **Atacama (`92.6%`)** takes #1. And in the **Analog Portfolio** tab for **Gale Crater**, combining **Atacama (`80.6%`) + Haughton (`79.5%`)** produces a **`90.3%` two-site portfolio (`+9.7%` gain)**."
- **[1:05–1:50 | Member 3 (Geospatial & Live Data) — Screen: `/discover` → Click `DEMO A1` & `DEMO A2`]**  
  "Now let's move to `/discover` for bounded live regional screening. When we click **Demo A1** to scan a `2×2` grid over **Lake Salda, Turkey** (`[37.1, 29.2, 37.9, 30.1]`) against **Jezero Crater Delta** under `Geological Research`, `/api/discover` queries **Open-Meteo Copernicus DEM**, **NASA POWER**, and **Macrostrat** live. Because Macrostrat returns `'Pliocene undifferentiated'` in Turkey, `lithology` (`30%`) and `mineralogy` (`25%`) are set to `null`. Weighted coverage is **`15%`** — below our **`40%` reliable coverage gate** — so TerraTwin **withholds the similarity score** rather than inventing data! Now click **Demo A2** (`Rover Testing`) on the exact same region: DEM 5-point slope (`25%`), elevation (`10%`), and NASA POWER temperature (`10%`) bring coverage to **`45%` (`>= 40%`)**, computing a **`65.0%` exploratory score (`isVerified: false`)**."
- **[1:50–2:30 | Member 4 (Global Atlas) — Screen: `/discover` → Click `DEMO B` & `DEMO C`]**  
  "To bridge live grid screening and peer-reviewed field science, we built the **31-site Global Discovery Atlas** across **18 countries** and **9 categories** — combining **8 canonical benchmarks** with **23 under-explored candidates**. Clicking **Demo B** (`Moon — Shackleton Crater Rim`, `Lunar Base & ISRU`) highlights **McMurdo Dry Valleys (`66.5%`, `100%` coverage)** alongside under-explored polar/playa sites like **Hanksville Badlands (`63.7%`)** and **Qaidam Basin (`62.8%`)**. Clicking **Demo C** (`Mars — Jezero Delta`, `Geological Research`) surfaces **Tibetan Plateau — Qinghai at `92.3%`**."
- **[2:30–3:00 | Member 6 (Research Workflow & QA) — Screen: `/discover` Detail Drawer & Exports]**  
  "Finally, every site opens our **Candidate Scientific Intelligence** and **Reproducible Research Workspace**. Researchers inspect primary drivers, limiting mismatches, and high-weight missing measurements, save an immutable `fnv1a`-digested snapshot synced to **Supabase PostgreSQL 17 with Row-Level Security**, and export **PDF, CSV, and JSON** dossiers in one click. Thank you!"

---

## Script 3 — 5-Minute Full Technical & Scientific Demonstration

Follows the 3-minute structure above with expanded deep dives:
- **[0:00–0:45 | Member 1]:** Problem framing, challenge alignment, and landing page deterministic telemetry preview (`Lake Salda 86.4% Geo / 81.1% Rover` for Jezero; `Askja & Holuhraun 85.1% Geo` for Mare Tranquillitatis).
- **[0:45–1:45 | Member 2 & Member 5]:** Full `/explore` walkthrough: 3D Globe → 2D Telemetry Grid toggle, `Jezero Crater Delta` profile switching (`rover-testing` vs. `geological-research`), `Valles Marineris — Coprates Chasma` partial-target handling (`grainSizeMm: null`), and `Gale Crater` 2-site Portfolio Optimizer (`Atacama + Haughton = 90.3%`).
- **[1:45–3:05 | Member 3]:** Full Demo A live walkthrough on `/discover`: explain the 5-point finite-difference DEM slope stencil in `open-meteo.ts`, NASA POWER sentinel filtering (`-999` → `null`), Macrostrat unmapped unit handling, and live contrast between `Demo A1` (`15%` coverage → `score: null`) and `Demo A2` (`45%` coverage → `65.0%` exploratory score).
- **[3:05–4:05 | Member 4]:** Full Demo B & Demo C walkthrough on `/discover`: Lunar South Pole (`Shackleton Crater Rim`) physical realism (`McMurdo Dry Valleys 66.5%` ceiling due to `-183°C` lunar vacuum), 31-site Global Atlas filtering across `18` countries and `9` categories, and *"Scan Region Around Site"* workflow.
- **[4:05–5:00 | Member 6 & Member 1]:** Candidate Scientific Intelligence drawer, Cloud Research Workspace (`research_records`, `research_assessment_revisions` immutability trigger, `15` RLS policies), Upstash Redis distributed rate limiting (`12 req/min`), and live **PDF / CSV / JSON** export inspection.

---

## Script 4 — 7-Minute Deep-Dive Presentation (Extended Finalist Round)

Includes the full 5-minute demonstration above plus a **2-minute Mathematical & Architectural Verification Segment (`[5:00–7:00]`)**:
- **[5:00–5:45 | Member 1 & Member 2 — Screen: `/methodology`]:** Walk judges through the exact normalization equations on `/methodology` (linear tolerance $1 - |x_T - x_A|/\tau$, base-10 log tolerance for `annualPrecipMm` and `grainSizeMm`, symmetric categorical matrices, and the `0.40` coverage gate equation).
- **[5:45–6:30 | Member 3 & Member 4 — Screen: `/sources`]:** Walk judges through the data provenance table on `/sources`, explaining the exact boundaries between curated NASA PDS/LRO/MRO baselines, 31 literature-curated Atlas sites, and live Open-Meteo/NASA POWER/Macrostrat endpoints.
- **[6:30–7:00 | Member 6 — Screen: Exported PDF/CSV/JSON & Summary]:** Show the downloaded JSON research bundle (`schemaVersion: "1.0.0"`, `integrityDigest: "fnv1a-..."`) and CSV formula-sanitization, closing with Team HEXARCHY's key takeaway: *"Scientific credibility requires knowing both what the data supports and where uncertainty remains."*
