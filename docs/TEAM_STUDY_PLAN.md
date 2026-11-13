# TerraTwin — Team HEXARCHY Study & Judging Preparation Plan

**Team Name:** HEXARCHY (6 Members)  
**Target Event:** NASA Space Apps Challenge Judging & Defense  
**Companion Documents:**
- `TerraTwin_Team_Leader_Technical_Masterclass.pdf` (Deep-dive for Team Leader)
- `TerraTwin_NASA_Space_Apps_Judges_QA.pdf` (Question Bank for all 6 members)
- `docs/JUDGING_PRESENTATION_GUIDE.md` (Pitch scripts & live demo choreography)
- `docs/SCIENTIFIC_METHODOLOGY.md` & `docs/TECHNICAL_ARCHITECTURE.md`

---

## 1. Individual Domain Ownership for All 6 HEXARCHY Members

So that no beginner on the team feels overwhelmed by having to memorize the entire codebase at once, divide study responsibilities across these 6 specialized roles:

| Member | Role Title | Primary Files & Docs to Master | Judge Q&A Categories to Memorize |
| :---: | :--- | :--- | :--- |
| **Member 1** | **Team Leader & Lead Architect** (`[MEMBER 1 NAME]`) | `TerraTwin_Team_Leader_Technical_Masterclass.pdf`, `README.md`, `src/components/explorer/explorer-dashboard.tsx` | Categories A, B, K, L, M (Role 1), N, O |
| **Member 2** | **Planetary Science & Dataset Lead** (`[MEMBER 2 NAME]`) | `docs/SCIENTIFIC_METHODOLOGY.md`, `src/lib/terratwin/db/planetary-repository.ts`, `/sources` page | Categories C, D, M (Role 2), O |
| **Member 3** | **Algorithm & Mathematical Modeling Lead** (`[MEMBER 3 NAME]`) | `src/lib/terratwin/similarity-engine.ts`, `src/lib/terratwin/portfolio-optimizer.ts`, `src/lib/terratwin/config/comparison-config.ts` | Categories E, F, M (Role 3), O |
| **Member 4** | **3D WebGL & GIS Visualization Lead** (`[MEMBER 4 NAME]`) | `src/components/explorer/planetary-globe.tsx`, `src/components/explorer/analog-map-inner.tsx`, `src/lib/terratwin/satellite-layers.ts` | Categories G, H, M (Role 4), O |
| **Member 5** | **Topography & Geomorphology Lead** (`[MEMBER 5 NAME]`) | `src/lib/terratwin/services/elevation-service.ts`, `src/lib/terratwin/terrain-comparison.ts`, `ELEVATION_PROFILE_METHODOLOGY.md` | Categories E (Slope/Slerp), H, M (Role 5), O |
| **Member 6** | **Full-Stack Database, QA & Security Lead** (`[MEMBER 6 NAME]`) | `supabase/migrations/*.sql`, `src/app/api/*`, `src/lib/terratwin/evidence-lineage.ts`, `scripts/test-phase4-master.mjs` | Categories I, J, K, M (Role 6), O |

---

## 2. Option A: 3-Day Crash Preparation Plan (High-Urgency Schedule)

Use this plan if judging is **72 hours away or less**.

### Day 1: Core Concept Alignment, Science & Live App Mastery (3 Hours)
- **Hour 1 (All Members Together):**
  - Launch `npm run dev` and explore `http://localhost:3000` together.
  - Read `README.md` Sections 1, 2, 4, 6, and 7 aloud as a team.
  - Ensure all 6 members can state in one sentence:
    1. What TerraTwin does.
    2. Why no single Earth site is a complete twin of Mars or the Moon.
    3. Why **Atmospheric Pressure** and **Annual Precipitation** are excluded from similarity scoring.
- **Hour 2 (Role-Specific Reading):**
  - Each member reads their assigned section in `TerraTwin_NASA_Space_Apps_Judges_QA.pdf` (Category M Role 1–6 + their 2 core categories).
  - Team Leader reads Sections 1–10 of `TerraTwin_Team_Leader_Technical_Masterclass.pdf`.
- **Hour 3 (Math & Data Verification Check):**
  - Member 2 & Member 3 walk the whole team through the **Worked Numerical Example** (Gale Crater vs. Lake Salda = `82.0%` / `82.1%`, and Atacama + Haughton Portfolio = `90.3%`).

### Day 2: Pitch Memorization & Live Demo Choreography (3 Hours)
- **Hour 1 (Pitch Script Rehearsal):**
  - Assign `[MEMBER 1–6 NAMES]` in `docs/JUDGING_PRESENTATION_GUIDE.md`.
  - Practice the **3-Minute Lightning Script** 3 times with a stopwatch and the **5-Minute Comprehensive Script** 3 times.
- **Hour 2 (Live Demo Driver Training):**
  - Member 4 (Primary Driver) and Member 5 (Backup Driver) practice the **5-Minute Live Demo Choreography** 4 times until every click (3D Mars Globe -> GIBS Thermal LST -> Mission Suite Optimizer -> Terrain Radar -> Elevation Transects -> Evidence Lineage) takes under 2 seconds without hesitation.
- **Hour 3 (Rapid-Fire Q&A Drill):**
  - Team Leader quizzes the team using **Category O (50+ Rapid-Fire Questions)** from `TerraTwin_NASA_Space_Apps_Judges_QA.pdf`.

### Day 3: Adversarial Mock Judging & Final Polish (3 Hours)
- **Hour 1 (Mock Judging Session #1 — Friendly Judges):**
  - Full 5-minute pitch + 10 minutes of standard judge questions (Categories A–K).
- **Hour 2 (Mock Judging Session #2 — Skeptical NASA Scientist & Senior Software Architect):**
  - Drill **Category L (Challenging / Skeptical Judge Questions)**:
    - *"Isn't your similarity score just an arbitrary heuristic?"*
    - *"How can you compare 463 m MOLA elevation on Mars to 30 m SRTM elevation on Earth?"*
    - *"What happens if a site is missing half its data?"*
- **Hour 3 (Final Equipment & Environment Check):**
  - Complete the **Final Readiness Checklist** (Section 7 below) and rest well before judging.

---

## 3. Option B: 7-Day Detailed Preparation Plan (Standard 1-Week Schedule)

| Day | Daily Theme | Study Topics & Readings | Deliverable / Milestone |
| :---: | :--- | :--- | :--- |
| **Day 1** | **Problem Statement & Planetary Analog Science** | Read `README.md` + `docs/SCIENTIFIC_METHODOLOGY.md` (Sections 1–5). Study all 5 planetary targets (Gale, Jezero, Meridiani, Shackleton, Tranquillitatis) and 8 verified Earth candidates. | Every member can name all 5 targets, 8 verified Earth sites, and why each site is scientifically famous. |
| **Day 2** | **NASA Datasets & 4-Tier Harmonization** | Study the 8 NASA/ESA dataset sources (`MOLA`, `LOLA`, `REMS`, `MEDA`, `Diviner`, `POWER`, `SRTM/GLO-30`, `MODIS`, `Athena/CCGE`) and the 4-Tier Harmonization Framework on `/sources`. | Member 2 leads a 15-minute teach-back on how every parameter was measured and why Tier 4 parameters are excluded. |
| **Day 3** | **Similarity Math & Portfolio Optimization** | Study `src/lib/terratwin/similarity-engine.ts` and `src/lib/terratwin/portfolio-optimizer.ts`. Work through Linear, $\log_{10}$, and Categorical equations + $C(n,k)$ combinations by hand on paper. | Member 3 leads a whiteboard walkthrough of Gale Crater vs. Lake Salda (`82.1%`) and Atacama + Haughton (`90.3%`). |
| **Day 4** | **3D Globe, NASA GIBS & Topographic Engines** | Study `planetary-globe.tsx` (`latLonToVector3`), `satellite-layers.ts` (WMTS endpoints), `elevation-service.ts` (Slerp + Horn 1981 $3\times 3$ slope), and `terrain-comparison.ts`. | Members 4 & 5 demonstrate how 3D coordinates, GIBS tiles, and Relative Relief ($\Delta z$) transects work under the hood. |
| **Day 5** | **Full-Stack Architecture, Database & Testing** | Study `docs/TECHNICAL_ARCHITECTURE.md`, Supabase migrations (`locations`, `dataset_sources`, `environmental_features`), RLS policies, and `npm run test:all`. | Member 6 runs `npm run test:all` live and explains how API validation and database fallbacks work. |
| **Day 6** | **Presentation & Live Demo Rehearsal** | Rehearse `TerraTwin_Judging_Presentation.pptx` alongside the 3-minute and 5-minute scripts in `docs/JUDGING_PRESENTATION_GUIDE.md`. Time every transition. | 3 consecutive error-free runs of the pitch and live demo within exact time limits. |
| **Day 7** | **Full Mock Judging Defense** | Conduct 2 full mock judging panels using Categories A–O of `TerraTwin_NASA_Space_Apps_Judges_QA.pdf` and Section 17 of `TerraTwin_Team_Leader_Technical_Masterclass.pdf`. | 100% completion of the Final Readiness Checklist. |

---

## 4. Option C: 14-Day Deep Technical Mastery Plan (2-Week Schedule)

Designed for teams that want every beginner member to gain true software engineering and planetary data science fluency:

- **Days 1–2 (Foundations of Web Architecture & Next.js):** Team Leader and Member 6 teach the team how HTML, React 19 Components, TypeScript interfaces, and Next.js 16 App Router (`src/app/`) work using Sections 1–5 of `TerraTwin_Team_Leader_Technical_Masterclass.pdf`.
- **Days 3–4 (Relational Databases & Supabase Security):** Inspect `supabase/migrations/*.sql`, run `/test-db`, understand primary keys, foreign keys, B-tree indexes, and PostgreSQL Row Level Security (RLS).
- **Days 5–6 (Planetary Geology & Remote Sensing):** Deep dive into Mars and Lunar geology (`basaltic`, `anorthositic`, `clay-sedimentary`, `sulfate-evaporite`, `impact-breccia`, `volcanic-tephra`), Wentworth grain-size scales, and NASA PDS archives.
- **Days 7–8 (Algorithms & Numerical Implementation):** Line-by-line code reading of `similarity-engine.ts`, `portfolio-optimizer.ts`, and `elevation-service.ts`. Run unit tests and trace inputs to outputs.
- **Days 9–10 (3D Computer Graphics & GIS Cartography):** Line-by-line reading of `planetary-globe.tsx` (Three.js scene, camera, lighting, GLSL shader, raycasting) and `analog-map-inner.tsx` (Leaflet layers, NASA GIBS WMTS tiles).
- **Days 11–12 (Slide Deck & Demo Polish):** Full rehearsal of `TerraTwin_Judging_Presentation.pptx`, speaker handoffs, and backup offline demo flows.
- **Days 13–14 (Adversarial Q&A Mastery):** Complete all 150+ questions across `TerraTwin_NASA_Space_Apps_Judges_QA.pdf` and `TerraTwin_Team_Leader_Technical_Masterclass.pdf`.

---

## 5. Group Practice & Mock Judging Protocol

Run at least **three 30-minute Mock Judging Sessions** before the competition:
1. **Session 1 (Open-Book Walkthrough):** Members can hold notes while practicing transitions and pointing at screen elements.
2. **Session 2 (Closed-Book Timed Pitch + Role Q&A):** Strict 3-minute or 5-minute timer. Two team members act as judges and ask 2 questions to each of the other 4 members, then swap roles.
3. **Session 3 (Chaos & Failure Drill):**
   - Pretend Wi-Fi disconnects mid-demo: practice explaining how TerraTwin's local binary DEM rasters (`raw-data/dem/*.bin`) and canonical repository fallback keep the app running offline.
   - Pretend a judge interrupts at slide 4 asking *"Show me the raw source for Jezero Crater slope right now!"*: practice clicking into the **Evidence Explorer** tab in under 5 seconds.

---

## 6. Final Judging Readiness Checklist

### Technical & Demo Readiness
- [ ] `npm run build` and `npm run test:all` pass with 0 errors.
- [ ] Local dev server (`npm run dev` on `http://localhost:3000`) is running and pre-warmed (visit `/`, `/explore`, `/sources`, `/methodology` once before judges arrive so Next.js caches all routes).
- [ ] Browser zoom is set to `100%` on a $1440\text{px}+$ widescreen window.
- [ ] `TerraTwin_Judging_Presentation.pptx` is open and tested in presentation mode.
- [ ] Backup screenshots (`docs/screenshots/01` through `09`) are open in a quick-access folder in case of hardware/projector issues.
- [ ] `.env.local` values are never opened or displayed on screen during screen sharing.

### Team Knowledge Readiness
- [ ] Every member knows the exact difference between a **Planetary Target** (5 Mars/Moon sites) and an **Earth Candidate** (8 verified analog sites).
- [ ] Every member can explain why **Multi-Site Portfolio Optimization (`Mission Suite`)** outperforms single-site matching ($90.3\%$ vs. $82.1\%$ for Gale Crater).
- [ ] Every member can explain the **4-Tier Harmonization Framework** and why **Atmospheric Pressure** and **Annual Precipitation** have weight `0.00`.
- [ ] Every member knows how missing data (`null`) is handled (never replaced with `0`; requires $\ge 40\%$ coverage to rank).
- [ ] Every member can clearly state what the similarity score **is** (an illustrative multi-attribute proximity index) and what it **is not** (not a statistical probability of mission success).

