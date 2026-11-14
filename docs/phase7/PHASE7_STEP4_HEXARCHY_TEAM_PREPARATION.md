# PHASE 7.4 — HEXARCHY SIX-MEMBER TEAM PREPARATION & ROLE PLAYBOOK

**Project:** TerraTwin  
**Team:** HEXARCHY (Six Members)  
**Phase:** 7.4 — Judge Technical Defense & Six-Member Training  

---

## 1. Six-Member Role Assignment Matrix

Every member of Team HEXARCHY owns a clear, distinct part of the narrative, demo, and Q&A defense so all 6 members look coordinated and confident in front of judges.

| Member | Role Title | Speaking Segment | Primary UI Surface Owned | Q&A Domain Ownership |
|---|---|---|---|---|
| **Member 1** | **Team Lead & Lead Developer** | Opening Hook, System Architecture, & Closing Summary | `/` Landing Hero & Codebase / API Architecture | Similarity math (`similarity-engine.ts`), Upstash Redis rate limiting, Supabase PostgreSQL 17 RLS |
| **Member 2** | **Planetary Science & Mission Lead** | Planetary Targets, 4 Mission Profiles, & Portfolio Synergy | `/explore` Target Selector, Mission Profiles, & `Analog Portfolio` Tab | Mars/Moon target physics, mission weight vectors, 2-site portfolio synergy (`Atacama + Haughton = 90.3%`) |
| **Member 3** | **Geospatial & Live Data Lead** | Demo A: Live Regional Scanner & The 40% Evidence Gate | `/discover` Live Regional Config, Leaflet Bounding Box, & Provider Warnings | Open-Meteo 5-point DEM slope, NASA POWER climatology, Macrostrat geology, Lake Salda `15%` vs `45%` gate |
| **Member 4** | **Global Atlas & Provenance Lead** | Demo C: 31-Site Global Discovery Atlas & Under-Explored Sites | `/discover` `Global Atlas` Tab (31 sites, 18 countries, 9 categories) & `/sources` | Curated vs. live discovery distinction, 23 under-explored candidates (`Tibetan Plateau 92.3%`, `Qaidam Basin`) |
| **Member 5** | **UI/UX & Visualization Lead** | 3D/2D Planetary Globe, Dark-Canvas Map, & Radar Profiles | `/explore` 3D Globe / 2D Telemetry Grid & Recharts Radar Chart | Three.js WebGL fallback, responsive desktop/tablet/mobile workstation UX, visual hierarchy |
| **Member 6** | **Research Workflow & QA Lead** | Candidate Intelligence, Cloud Research Workspace, & Exports | `/discover` Detail Drawer, Research Workspace Panel, & PDF/CSV/JSON Exports | Primary drivers/mismatches, FNV-1a immutable snapshots, PDF/CSV/JSON exporters, Chrome CDP E2E tests |

---

## 2. Individual Study & Cheat-Sheet Cards (10-Minute Prep per Member)

### Member 1 — Lead Developer Cheat Card
- **Key Numbers to Memorize:** `12` parameters (`8` numeric + `4` categorical), `4` mission profiles, `MIN_RELIABLE_COVERAGE_RATIO = 0.40` (`40%`), `16` max live scan cells, `12 req/min` discovery rate limit, `4` Supabase RLS tables + `15` RLS policies.
- **Golden Sentence:** *"TerraTwin is 100% deterministic TypeScript — we never use generative AI to guess a similarity score or invent a missing measurement."*

### Member 2 — Planetary Science Lead Cheat Card
- **Key Numbers to Memorize:**
  - **Jezero Crater Delta (`mars-jezero-delta`):** Under `rover-testing`, Haughton = `81.4%`, Lake Salda = `81.1%`. Under `geological-research`, Atacama = `92.6%`, Haughton = `90.1%`, Lake Salda = `86.4%`.
  - **Gale Crater (`mars-gale-crater`):** Single-site #1 under `rover-testing` is Lake Salda (`82.1%`), Atacama (`80.6%`), Haughton (`79.5%`). **2-Site Portfolio: Atacama + Haughton = `90.3%` (`+9.7%` synergy gain)**.
  - **Shackleton Crater Rim (`moon-shackleton-rim`):** Under `lunar-base-construction`, McMurdo Dry Valleys = `66.5%` (`100%` coverage).
- **Golden Sentence:** *"Similarity is not a single static number — it is a function of your mission objective, and combining two complementary sites outperforms any single site on Earth."*

### Member 3 — Geospatial & Live Data Lead Cheat Card
- **Key Numbers to Memorize:**
  - Lake Salda live `2×2` scan bbox: `[37.10, 29.20, 37.90, 30.10]` (`0.5°` spacing, `4` cells).
  - Under `geological-research`: returns **`15%` coverage (`0.15 < 0.40`)** → **`score: null`** (`"Insufficient data to rank reliably"`) because Macrostrat returns `"Pliocene undifferentiated"` outside the U.S.
  - Under `rover-testing`: returns **`45%` coverage (`0.45 >= 0.40`)** (`slope 0.25 + elevation 0.10 + diurnal 0.05 + mean temp 0.05`) → **`65.0%` exploratory score (`isVerified: false`)**.
- **Golden Sentence:** *"When public satellite APIs lack bedrock mineralogy for a remote basin, TerraTwin refuses to guess — our 40% evidence gate withholds the score and tells the field team what to measure next."*

### Member 4 — Global Atlas & Provenance Lead Cheat Card
- **Key Numbers to Memorize:** `31` total curated Atlas sites = `8` canonical benchmarks + `23` under-explored candidates across `18` countries/territories and `9` analog categories.
- **Top Under-Explored Examples:** **Tibetan Plateau — Qinghai (`92.3%`)**, **Svalbard — Spitsbergen (`91.7%`)**, and **Ebro Basin Paleo-Fluvial Deltas (`90.2%`)** vs. Jezero Crater Delta (`geological-research`); **Hanksville Badlands (`63.7%`)** and **Qaidam Basin Playa (`62.8%`)** vs. Shackleton Rim (`lunar-base-construction`).
- **Golden Sentence:** *"We clearly separate our 31 literature-curated Global Atlas sites from unverified live regional grid cells so judges and researchers always know the provenance of every datum."*

### Member 5 — UI/UX & Visualization Lead Cheat Card
- **Key Features to Highlight:** Three.js 3D globe with automatic 2D Equirectangular Telemetry Grid fallback (`PlanetaryGlobe`), synchronized dark-canvas Leaflet map, 12-axis Recharts comparison radar, collapsible 3-column workstation on `/discover`, and 1-click **Judge Demo Scenarios** bar.
- **Golden Sentence:** *"Every visual element encodes both similarity and epistemic confidence — verified benchmarks, partial reference targets, and unverified live grid cells have distinct badges and map markers."*

### Member 6 — Research Workflow & QA Lead Cheat Card
- **Key Features to Highlight:** Candidate Scientific Intelligence (`Primary Drivers`, `Key Mismatches`, `Missing High-Weight Evidence`, `Field Validation Plan`), immutable snapshots (`schemaVersion: "1.0.0"`, `fnv1a` digest), Supabase Cloud RLS sync + offline `localStorage`, and 1-click **PDF**, **CSV** (formula-sanitized), and **JSON** exports.
- **Golden Sentence:** *"Every assessment in TerraTwin can be saved as an immutable, cryptographically digested snapshot and exported as a reproducible PDF, CSV, or JSON dossier."*

---

## 3. Live Handoff Protocol (Zero Dead Air)

1. **One Driver, Six Voices:** **Member 1** or **Member 5** drives the laptop mouse/keyboard for the entire presentation while each member speaks during their designated cue. Never pass the physical laptop or mouse back and forth during a timed pitch.
2. **Use the Judge Demo Quick-Load Bar:** On `/discover`, click `DEMO A1 · LIVE GATE`, `DEMO A2 · LIVE SCORED`, `DEMO B · LUNAR ISRU`, and `DEMO C · GLOBAL ATLAS` instead of typing coordinates manually.
3. **Q&A Triage Rule:** When a judge asks a question, **Member 1** nods, names the domain owner (*"Great question on how we derive topographic slope — Member 3 leads our geospatial pipeline"*), and hands the mic to that member.
