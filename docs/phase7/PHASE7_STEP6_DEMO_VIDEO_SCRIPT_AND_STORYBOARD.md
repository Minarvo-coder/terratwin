# PHASE 7.6 — DEMO VIDEO SCRIPT, SUBTITLES & STORYBOARD (30s GLOBAL, 2m STANDARD, 240s LOCAL, & 7-SLIDE DECK)

**Project:** TerraTwin — Planetary & Terrestrial Analog Intelligence Engine  
**Team:** HEXARCHY (Six Members)  
**Phase:** 7.6 — Final Submission & Hackathon Readiness  

> **Official Space Apps Rule Note:** Global Judging enforces a strict **30-second video cap (with mandatory English subtitles)** or a **7-slide presentation deck**, while many Local Events evaluate a **2-minute (`120s`)** or **240-second (`4m`)** video demo. All four formats are provided below ready to record.

---

## 1. Official 30-Second Global Submission Video Script & Storyboard (With SRT Subtitles)

| Timecode | Screen Capture Action (`1920×1080` or `1440×900`) | Voiceover & Mandatory English Subtitle Text |
|---|---|---|
| `00:00–00:06` | Show `/` Landing Hero (`Earth Analogs for Lunar & Martian Environments` + `Lake Salda 86.4% Geo / 81.1% Rover`). | `"Before rovers land on Mars or crews build a Moon base, NASA tests hardware on Earth. We built TerraTwin."` |
| `00:06–00:14` | Show `/explore`: toggle 3D Mars Globe → select `Gale Crater` → open `Analog Portfolio` tab (`Atacama + Haughton = 90.3%`, `+9.7%` gain). | `"TerraTwin scores 12 environmental parameters across 4 mission profiles—and combines Atacama plus Haughton for a 90.3% two-site portfolio match."` |
| `00:14–00:23` | Show `/discover`: click `DEMO A1` (`Lake Salda 15% coverage — Score Withheld`) then `DEMO A2` (`45% coverage — 65.0% Exploratory`). | `"Our live regional scanner queries NASA POWER, Copernicus DEM, and Macrostrat—withholding scores below 40% coverage instead of guessing."` |
| `00:23–00:30` | Show `/discover` `Global Atlas` (`31` sites, `18` countries, `Tibetan Plateau 92.3%`) and click `Export PDF / CSV / JSON`. | `"With a 31-site Global Atlas across 18 countries and reproducible PDF, CSV, and JSON dossiers, TerraTwin turns analog discovery into rigorous science."` |

### Ready-to-Save `terratwin-30s-subtitles.srt` File
```srt
1
00:00:00,000 --> 00:00:06,000
Before rovers land on Mars or crews build a Moon base, NASA tests hardware on Earth. We built TerraTwin.

2
00:00:06,000 --> 00:00:14,000
TerraTwin scores 12 environmental parameters across 4 mission profiles—and combines Atacama plus Haughton for a 90.3% two-site portfolio match.

3
00:00:14,000 --> 00:00:23,000
Our live regional scanner queries NASA POWER, Copernicus DEM, and Macrostrat—withholding scores below 40% coverage instead of guessing.

4
00:00:23,000 --> 00:00:30,000
With a 31-site Global Atlas across 18 countries and reproducible PDF, CSV, and JSON dossiers, TerraTwin turns analog discovery into rigorous science.
```

---

## 2. Two-Minute (`120s`) Standard Demo Video Script & Storyboard

| Timecode | Visual / UI Action | Narration Script |
|---|---|---|
| `0:00–0:15` | **Scene 1 — Problem & Hook (`/`):** Pan across the Landing Hero and deterministic telemetry preview. | `"Every Lunar and Martian surface mission relies on Earth analog field sites. Yet no single place on Earth duplicates Mars or the Moon, and existing analog selection suffers from static rankings and hidden missing data. Team HEXARCHY built TerraTwin to solve this."` |
| `0:15–0:42` | **Scene 2 — Mission-Dependent Similarity & Portfolio Synergy (`/explore`):** Select `Mars → Jezero Crater Delta`, toggle `Rover Testing` (`Haughton 81.4%`, `Lake Salda 81.1%`) vs. `Geological Research` (`Atacama 92.6%`). Then switch to `Gale Crater` → `Analog Portfolio` tab (`Atacama + Haughton = 90.3%`). | `"In the Explorer Flight Deck, TerraTwin evaluates 5 verified Moon and Mars targets across 12 environmental parameters and 4 mission profiles. Switching Jezero Crater from Rover Testing to Geological Research shifts the top match from Haughton Impact Structure (81.4%) to the Atacama Desert (92.6%). And for Gale Crater rover testing, our Portfolio Optimizer combines Atacama (80.6%) and Haughton (79.5%) for a 90.3% two-site synergy score."` |
| `0:42–1:18` | **Scene 3 — Live Regional Discovery & The 40% Evidence Gate (`/discover`):** Click `DEMO A1 · LIVE GATE` (`Lake Salda 2×2` under `geological-research`) → show `15%` coverage and `Insufficient data to rank reliably`. Then click `DEMO A2 · LIVE SCORED` (`rover-testing`) → show `45%` coverage and `65.0%` exploratory score. | `"On /discover, users scan bounded WGS84 regions using live Open-Meteo Copernicus DEM, NASA POWER climatology, and Macrostrat geology—governed by a strict 40% reliable coverage gate. When we scan Lake Salda, Turkey under Geological Research, Macrostrat returns 'Pliocene undifferentiated', leaving lithology and mineralogy null. Because coverage is only 15%, TerraTwin honestly withholds the score! Switching to Rover Testing raises coverage to 45% via 5-point DEM slope and computes a 65.0% exploratory score."` |
| `1:18–1:42` | **Scene 4 — 31-Site Global Discovery Atlas (`/discover`):** Click `DEMO B · LUNAR ISRU` (`Shackleton Rim` → `McMurdo Dry Valleys 66.5%`) and `DEMO C · GLOBAL ATLAS` (`Tibetan Plateau — Qinghai 92.3%`). | `"To pair live screening with peer-reviewed field science, our 31-site Global Discovery Atlas spans 18 countries and 9 categories—combining 8 canonical benchmarks with 23 under-explored candidates, including McMurdo Dry Valleys (66.5%) for Lunar South Pole ISRU and Tibetan Plateau — Qinghai (92.3%) for Mars geology."` |
| `1:42–2:00` | **Scene 5 — Scientific Intelligence & Reproducible Exports (`/discover`):** Open the Candidate Detail Drawer, save a Research Snapshot (`fnv1a` digest, Supabase Cloud RLS badge), and click `Export PDF`, `Export CSV`, and `Export JSON`. | `"Every assessment generates deterministic scientific intelligence, saves an immutable snapshot synced via Supabase PostgreSQL 17 Row-Level Security, and exports reproducible PDF, CSV, and JSON dossiers in one click."` |

---

## 3. Four-Minute (`240s` "240 Seconds of Glory") Local Event Video Storyboard

Expands the 2-minute script with 2 additional technical verification scenes:
- **`0:00–2:00`:** Follow Scenes 1–5 above at a measured, conversational pace with all 6 HEXARCHY members introducing their modules.
- **`2:00–3:10` (Scene 6 — Mathematical & Data Provenance Deep Dive on `/methodology` & `/sources`):** Show the linear, base-10 logarithmic (`annualPrecipMm`, `grainSizeMm`), and symmetric categorical tolerance equations on `/methodology`, followed by the NASA PDS / LRO / MRO / NASA POWER / Copernicus DEM / Macrostrat provenance table on `/sources`.
- **`3:10–4:00` (Scene 7 — Distributed Reliability, Cloud RLS & Export Verification):** Show the downloaded multi-page vector PDF, formula-sanitized CSV, and schema-versioned JSON (`schemaVersion: "1.0.0"`), plus a brief highlight of Upstash Redis rate limiting (`12 req/min`) and PostgreSQL 17 RLS isolation.

---

## 4. Alternative 7-Slide Global Submission Deck Outline

If submitting the **7-Slide Deck** option on `spaceappschallenge.org`:
1. **Slide 1 — Title & Mission:** *TerraTwin: Planetary & Terrestrial Analog Intelligence Engine* (Team HEXARCHY · Challenge Statement · Screenshot of `/` Hero).
2. **Slide 2 — The Problem:** Why single-site lookup and unverified black-box scoring fail Lunar & Martian mission planning.
3. **Slide 3 — Deterministic Similarity & 4 Mission Profiles:** The 12 parameters, linear/log/categorical math, and how rankings shift between `rover-testing` and `geological-research` (`artifacts/phase7/02-explore-flight-deck-desktop.png`).
4. **Slide 4 — Multi-Site Portfolio Synergy:** How **Atacama (`80.6%`) + Haughton (`79.5%`) = `90.3%` (`+9.7%` gain)** for Gale Crater rover testing.
5. **Slide 5 — Live Regional Discovery & The 40% Evidence Gate:** Open-Meteo 5-point DEM slope + NASA POWER + Macrostrat, demonstrating Lake Salda `15%` coverage (score withheld) vs. `45%` coverage (`65.0%` exploratory).
6. **Slide 6 — 31-Site Global Discovery Atlas:** `8` canonical benchmarks + `23` under-explored candidates across `18` countries and `9` categories (`artifacts/phase7/03-discover-demo-b-lunar-atlas.png` & `04-discover-demo-c-global-atlas.png`).
7. **Slide 7 — Reproducible Cloud Research Workspace & Impact:** Candidate Intelligence, Supabase PostgreSQL 17 RLS immutability, and 1-click PDF/CSV/JSON dossiers.
