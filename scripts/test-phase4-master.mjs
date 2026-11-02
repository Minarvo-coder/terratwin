/**
 * TerraTwin Phase 4 Master Scientific Visualization Verification Suite
 *
 * Orchestrates and executes end-to-end regression and verification across:
 * - Milestone A: Scientific Visualization Feasibility Audit
 * - Milestone B: NASA Satellite Imagery Integration (GIBS & Esri WMTS, date picker, seasonal presets)
 * - Milestone C: Interactive Topographic Elevation Profile Engine (MOLA, LOLA, Copernicus DEM 90m, relative relief)
 * - Milestone D: Advanced Terrain & Parameter Comparison Workspace (Radar, morphology, categorized matrix, synthesis)
 * - Milestone E: Scientific Evidence Explorer & 5-Stage Telemetry Lineage Pipeline
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const PHASE4_SUITES = [
  {
    name: 'Milestone A: Scientific Visualization Feasibility Audit',
    file: 'scripts/audit-visualization-feasibility.mjs',
    useNodeDirect: true,
  },
  {
    name: 'Milestone B: NASA GIBS Satellite Imagery Layers & Map',
    file: 'scripts/test-milestone-b-satellite-layers.mjs',
    useNodeDirect: true,
  },
  {
    name: 'Milestone C: Topographic Elevation Profiles (MOLA/LOLA/Copernicus)',
    file: 'scripts/test-milestone-c-elevation.mjs',
    useNodeDirect: true,
  },
  {
    name: 'Milestone D: Advanced Terrain Comparison Workspace & Radar',
    file: 'scripts/test-milestone-d-terrain.mjs',
    useNodeDirect: true,
  },
  {
    name: 'Milestone E: Scientific Evidence Explorer & 5-Stage Lineage',
    file: 'scripts/test-milestone-e-lineage.mjs',
    useNodeDirect: true,
  },
]

console.log('=====================================================================')
console.log('       TERRATWIN PHASE 4: ADVANCED SCIENTIFIC VISUALIZATION SUITE    ')
console.log('=====================================================================\n')

let totalSuites = PHASE4_SUITES.length
let passedSuites = 0
let failedSuites = 0
const startTime = Date.now()

for (const suite of PHASE4_SUITES) {
  process.stdout.write(`⏳ Running ${suite.name}... `)
  const suiteStart = Date.now()

  try {
    const fullPath = path.join(ROOT_DIR, suite.file)
    const cmd = suite.useNodeDirect ? `node "${fullPath}"` : `node --test "${fullPath}"`
    execSync(cmd, {
      cwd: ROOT_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    })
    const duration = ((Date.now() - suiteStart) / 1000).toFixed(2)
    console.log(`✅ PASSED (${duration}s)`)
    passedSuites++
  } catch (err) {
    const duration = ((Date.now() - suiteStart) / 1000).toFixed(2)
    console.log(`❌ FAILED (${duration}s)`)
    failedSuites++
    if (err.stdout) console.error(err.stdout.toString())
    if (err.stderr) console.error(err.stderr.toString())
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)

console.log('\n=====================================================================')
console.log('                    PHASE 4 VERIFICATION REPORT                      ')
console.log('=====================================================================')
console.log(`Test Suites Evaluated: ${totalSuites}`)
console.log(`Suites Passed:         ${passedSuites}/${totalSuites}`)
console.log(`Suites Failed:         ${failedSuites}/${totalSuites}`)
console.log(`Total Execution Time:  ${totalDuration}s\n`)

if (failedSuites === 0) {
  console.log('🎉 ALL 5 PHASE 4 SCIENTIFIC VISUALIZATION SUITES PASSED!\n')
  process.exit(0)
} else {
  console.error(`💥 ${failedSuites} SUITE(S) FAILED. REVIEW LOGS ABOVE.\n`)
  process.exit(1)
}
