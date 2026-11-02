/**
 * Phase 4 — Milestone A: Scientific Visualization Feasibility & Data Audit Script
 *
 * Verifies that all required binary rasters, NASA POWER climatology caches,
 * environmental feature definitions, comparability rules, and provenance records
 * are intact and scientifically ready before building Phase 4 visualizations.
 */

import fs from "node:fs"
import path from "node:path"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { FEATURES } from "../src/lib/terratwin/features.ts"
import { FEATURE_COMPATIBILITY_MATRIX } from "../src/lib/terratwin/config/compatibility-matrix.ts"
import { DATA_SOURCES } from "../src/lib/terratwin/data-sources.ts"
import { sampleTopography, KNOWN_PLANETARY_TARGETS } from "./sample-topography.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")

console.log("=====================================================================")
console.log("   TERRATWIN PHASE 4 — MILESTONE A: VISUALIZATION FEASIBILITY AUDIT  ")
console.log("=====================================================================\n")

let passed = 0

// 1. Verify Binary Planetary DEM Rasters for Elevation Profile Tool
console.log("1. Auditing Planetary Binary DEM Rasters (Mars MOLA & Moon LOLA)...")
const molaImgPath = path.join(ROOT_DIR, "raw-data", "mars", "megt90n000cb.img")
const molaLblPath = path.join(ROOT_DIR, "raw-data", "mars", "megt90n000cb.lbl")
const lolaImgPath = path.join(ROOT_DIR, "raw-data", "moon", "ldem_4.img")
const lolaLblPath = path.join(ROOT_DIR, "raw-data", "moon", "ldem_4.lbl")

assert.ok(fs.existsSync(molaImgPath), "Mars MOLA MEGDR binary raster must exist")
assert.ok(fs.existsSync(molaLblPath), "Mars MOLA PDS3 detached label must exist")
assert.ok(fs.existsSync(lolaImgPath), "Moon LOLA LDEM_4 binary raster must exist")
assert.ok(fs.existsSync(lolaLblPath), "Moon LOLA PDS3 detached label must exist")

const molaSize = fs.statSync(molaImgPath).size
const lolaSize = fs.statSync(lolaImgPath).size
assert.equal(molaSize, 720 * 1440 * 2, "MOLA raster must be exact 720x1440 16-bit grid (2,073,600 bytes)")
assert.equal(lolaSize, 720 * 1440 * 2, "LOLA raster must be exact 720x1440 16-bit grid (2,073,600 bytes)")

// Verify multi-point transect sampling capability across all 5 planetary targets
for (const target of KNOWN_PLANETARY_TARGETS) {
  const sample = sampleTopography(target.body, target.latitude, target.longitude)
  assert.ok(typeof sample.elevationDatumM === "number" && !Number.isNaN(sample.elevationDatumM), `Valid elevation for ${target.name}`)
  assert.ok(typeof sample.slopeDeg === "number" && sample.slopeDeg >= 0, `Valid Horn slope for ${target.name}`)
  assert.ok(typeof sample.localReliefM === "number" && sample.localReliefM >= 0, `Valid 3x3 local relief for ${target.name}`)
}
console.log("   ✅ Mars MOLA & Moon LOLA global DEM rasters verified (2,073,600 bytes each; transect sampling ready).")
passed++

// 2. Verify Cached NASA POWER Climatology Archives for all 8 Earth Candidates
console.log("\n2. Auditing Earth Analog NASA POWER Climatology Archives...")
const expectedEarthFiles = [
  "nasa_power_atacama_raw.json",
  "nasa_power_mcmurdo_raw.json",
  "nasa_power_haughton_crater_raw.json",
  "nasa_power_mauna_kea_raw.json",
  "nasa_power_salda_raw.json",
  "nasa_power_craters_of_the_moon_raw.json",
  "nasa_power_askja_raw.json",
  "nasa_power_rio_tinto_raw.json",
]

for (const file of expectedEarthFiles) {
  const fullPath = path.join(ROOT_DIR, "raw-data", "earth", file)
  assert.ok(fs.existsSync(fullPath), `Missing NASA POWER archive: ${file}`)
  const payload = JSON.parse(fs.readFileSync(fullPath, "utf8"))
  const params = payload?.properties?.parameter
  assert.ok(params?.T2M && typeof params.T2M.ANN === "number", `${file} must contain T2M annual & monthly climatology`)
  assert.ok(params?.T2M_MAX && typeof params.T2M_MAX.ANN === "number", `${file} must contain T2M_MAX`)
  assert.ok(params?.T2M_MIN && typeof params.T2M_MIN.ANN === "number", `${file} must contain T2M_MIN`)
  assert.ok(params?.ALLSKY_SFC_SW_DWN && typeof params.ALLSKY_SFC_SW_DWN.ANN === "number", `${file} must contain ALLSKY_SFC_SW_DWN`)
  assert.ok(params?.PS && typeof params.PS.ANN === "number", `${file} must contain PS`)
}
console.log("   ✅ All 8 Earth analog NASA POWER climatology JSON archives verified.")
passed++

// 3. Verify 12 Environmental Features & 4-Tier Comparability Matrix Alignment
console.log("\n3. Auditing Environmental Feature Schema & Comparability Matrix...")
assert.equal(FEATURES.length, 12, "Must define 12 core environmental features")
assert.equal(FEATURE_COMPATIBILITY_MATRIX.length, 12, "Compatibility matrix must cover all 12 features")

for (const feat of FEATURES) {
  const matrixEntry = FEATURE_COMPATIBILITY_MATRIX.find((m) => m.key === feat.key)
  assert.ok(matrixEntry, `Feature ${feat.key} must have a corresponding entry in FEATURE_COMPATIBILITY_MATRIX`)
}
console.log("   ✅ All 12 environmental features and 4-tier comparability rules aligned.")
passed++

// 4. Verify Authoritative Dataset Sources Catalog
console.log("\n4. Auditing Authoritative Dataset Sources Catalog...")
const integratedSources = DATA_SOURCES.filter((ds) => ds.status === "integrated")
assert.ok(integratedSources.length >= 10, `Expected at least 10 integrated sources, found ${integratedSources.length}`)
for (const src of DATA_SOURCES) {
  assert.ok(src.sourceUrl && src.sourceUrl.startsWith("https://"), `Source ${src.name} must have a valid HTTPS archive URL`)
}
console.log(`   ✅ ${DATA_SOURCES.length} dataset sources (${integratedSources.length} active live, ${DATA_SOURCES.length - integratedSources.length} pipeline queue) verified with official URLs.`)
passed++

// 5. Verify Audit Document Existence
console.log("\n5. Auditing PHASE4_VISUALIZATION_AUDIT.md Documentation...")
const auditDocPath = path.join(ROOT_DIR, "PHASE4_VISUALIZATION_AUDIT.md")
assert.ok(fs.existsSync(auditDocPath), "PHASE4_VISUALIZATION_AUDIT.md must exist")
const auditContent = fs.readFileSync(auditDocPath, "utf8")
assert.ok(auditContent.includes("Phase 4 Visualization Availability Matrix"), "Audit doc must include the Visualization Availability Matrix")
console.log("   ✅ PHASE4_VISUALIZATION_AUDIT.md verified.")
passed++

console.log(`\n🎉 MILESTONE A AUDIT COMPLETE: ${passed}/${passed} verification checks passed.\n`)

