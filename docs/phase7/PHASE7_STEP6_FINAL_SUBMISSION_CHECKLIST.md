# PHASE 7.6 — FINAL NASA SPACE APPS SUBMISSION CHECKLIST

**Project:** TerraTwin — Planetary & Terrestrial Analog Intelligence Engine  
**Team:** HEXARCHY (Six Members)  
**Challenge:** *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars."*  

---

## 1. Pre-Submission Repository & Code Readiness (100% Complete)

- [x] **1.1 Zero Build, Type, or Lint Errors:**
  - `npx tsc --noEmit` → `0` errors (`TSC_PASSED`)
  - `npm run lint` → `0` errors (`LINT_PASSED`)
  - `npm run build` → `0` errors (`BUILD_PASSED`)
- [x] **1.2 Scientific Integrity & Deterministic Math Verified:**
  - `MIN_RELIABLE_COVERAGE_RATIO = 0.40` (`40%`) enforced across all similarity calculations.
  - Missing measurements remain `null` (`0%` coverage contribution) and are never substituted with `0`.
  - Live regional grid cells (`/api/discover`) are strictly marked `isVerified: false`.
  - Curated 31-site Global Discovery Atlas (`8` canonical benchmarks + `23` under-explored candidates across `18` countries and `9` categories) is explicitly distinguished from live regional scans.
- [x] **1.3 Security & Secrets Hygiene Verified:**
  - `.env.local` is gitignored; zero API tokens (`UPSTASH_REDIS_REST_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`) appear in tracked source files or client bundles.
  - Supabase PostgreSQL 17 database (`ndqycqbrxgaauvmqqpjr`) has all 4 Cloud Research Workspace tables and 15 Row-Level Security (`RLS`) policies active and verified.
- [x] **1.4 Complete Repository Documentation:**
  - Root `README.md` updated with all 22 required sections, Mermaid architecture diagram, data sources, setup commands, and AI disclosure.
  - All Phase 7 deliverables generated in `docs/phase7/` plus root `PHASE7_MASTER_EXECUTION_PLAN.md`, `PHASE7_FINAL_ACCEPTANCE_MATRIX.md`, and `PHASE7_FINAL_COMPLETION_AND_SUBMISSION_READINESS_REPORT.md`.

---

## 2. Final Manual Actions for Team HEXARCHY Before Clicking "Submit"

Perform these final human steps on submission day (none of these are automated without your explicit permission):

- [ ] **Step 1 — Insert Team Member Names (`README.md` Section 20):**
  - Replace `[Insert Lead Developer Name]` through `[Insert Member 6 Name]` in `README.md` with your six registered Space Apps team members' names.
- [ ] **Step 2 — Push to Your Public GitHub Repository:**
  - Commit your final verified tree and push to your public GitHub repository so judges can inspect the code without login barriers.
- [ ] **Step 3 — Optional Public Vercel Deployment (5 Minutes):**
  - Follow `docs/phase7/PHASE7_STEP5_DEPLOYMENT_READINESS_REPORT.md` Section 4 to deploy on Vercel (free hobby tier) and paste the public URL into your Space Apps project page.
- [ ] **Step 4 — Record & Upload the Project Demo Video / Slide Deck:**
  - Use `docs/phase7/PHASE7_STEP6_DEMO_VIDEO_SCRIPT_AND_STORYBOARD.md`:
    - For the **Official Global Judging Submission Form**: Upload the **30-Second Video Demo (with English subtitles enabled)** to YouTube/Vimeo/Google Drive (public access) **OR** upload the **7-Slide Global Presentation Deck**.
    - For **Local Event Judging / Mentorship Rounds**: Use the **2-Minute (`120s`)** or **240-Second (`4m`)** video script and the **90s / 3m / 5m / 7m** live presentation scripts.
- [ ] **Step 5 — Paste Submission Copy into `spaceappschallenge.org`:**
  - Copy and paste the prepared fields from `docs/phase7/PHASE7_STEP3_SUBMISSION_MASTER_DRAFT.md` into your team's project page on `spaceappschallenge.org` and verify that every external link opens in an Incognito browser window.
