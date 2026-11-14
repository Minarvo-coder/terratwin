# PHASE 7.5 — DEMO RELIABILITY & CONTINGENCY CHECKLIST

**Project:** TerraTwin  
**Team:** HEXARCHY (Six Members)  
**Phase:** 7.5 — Deployment, Demo Reliability & Production Readiness  

---

## 1. Fifteen-Minute Pre-Demo Checklist (Run Before Judges Arrive)

- [ ] **1. Start Production Server (Faster than Dev Server):**
  ```bash
  npm run build
  npx next start -p 3000 -H 127.0.0.1
  ```
- [ ] **2. Pre-Warm the 4 Browser Tabs at `100%` Zoom (`1440×900` or Fullscreen):**
  - **Tab 1:** `http://localhost:3000/` (Landing Page — verify `Lake Salda, Turkey (86.4% Geo / 81.1% Rover)` is visible).
  - **Tab 2:** `http://localhost:3000/explore` (Explorer Flight Deck — pre-select `Mars` → `Jezero Crater Delta`).
  - **Tab 3:** `http://localhost:3000/discover` (Discovery Scanner — verify the **Judge Demo Scenarios (Quick Load)** bar is visible at the top).
  - **Tab 4:** `http://localhost:3000/methodology` & `http://localhost:3000/sources` (Ready for deep-dive mathematical or data provenance questions).
- [ ] **3. Pre-Warm the Live Regional Scan Cache (Optional 10-Second Step):**
  - On Tab 3 (`/discover`), click **Demo A1 · Live Gate** and click **Launch Regional Scan** once, then click **Demo A2 · Live Scored** and click **Launch Regional Scan** once.
  - Because TerraTwin caches normalized scan responses for **24 hours** in Upstash Redis (and in-memory), repeating those exact scans during your live presentation will return in **`< 50 ms`** even if venue Wi-Fi drops!
- [ ] **4. Verify Downloads Folder is Clean:**
  - Click **Export PDF**, **Export CSV**, and **Export JSON** once before the pitch so the browser doesn't prompt *"Allow multiple downloads?"* for the first time on stage.

---

## 2. Live Contingency Playbook (What If Something Goes Wrong on Stage?)

| Scenario | What Happens in TerraTwin | Exact Action for the Presenter |
|---|---|---|
| **Venue Wi-Fi Drops Completely** | Curated targets (`5`), canonical benchmarks (`8`), Global Discovery Atlas (`31` sites), Portfolio Optimizer, Candidate Intelligence, `localStorage` Research Workspace, and PDF/CSV/JSON exports all run **100% locally** without internet. Pre-warmed Demo A1/A2 scans also resolve from cache! | Continue seamlessly with `/explore`, Demo B, Demo C, and cached Demo A1/A2. Mention: *"TerraTwin caches regional scans and runs its entire 31-site Global Atlas and PDF/CSV/JSON export engine locally."* |
| **An External API (e.g., Macrostrat or NASA POWER) Times Out** | Each provider has a `4,500 ms` `AbortController` timeout. Failed providers return `null` with a clean yellow status badge (`partial` or `failed`) and never crash the page. | Point to the Provider Status strip on `/discover`: *"Notice how TerraTwin's fault-tolerant pipeline isolates upstream provider latency, sets missing fields to `null`, and applies our 40% coverage gate honestly."* |
| **Judge Machine Lacks WebGL / GPU Acceleration** | `PlanetaryGlobe` automatically renders the interactive **2D Equirectangular Planetary Telemetry Grid** (`2D Map` toggle). | Click the `2D Map` button in `/explore` and show how all 5 planetary targets remain clickable and keyboard-accessible. |
| **Presenter Accidentally Clicks the Wrong Filter on `/discover`** | Could change the target or clear the bounding box. | Click the corresponding button in the **Judge Demo Scenarios (Quick Load)** bar (`DEMO A1`, `DEMO A2`, `DEMO B`, or `DEMO C`) to restore the exact target, mission profile, and bounding box in 1 click. |
