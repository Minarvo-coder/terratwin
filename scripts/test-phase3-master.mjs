/**
 * TerraTwin Phase 3 Master Scientific Verification Suite
 * 
 * Orchestrates and executes end-to-end regression and verification across:
 * - Milestone A: NASA Scientific Data Catalog & Architecture
 * - Milestone B: Planetary Target Telemetry & Opportunity Attribution Fix
 * - Milestone C: Earth Analog Candidates (Lake Salda, Craters of the Moon, Askja, Río Tinto)
 * - Milestone D: Reproducible Ingestion Pipelines & Horn Slope DEM Sampling
 * - Milestone E: Scientific Engine Integration, Provenance Badges & Portfolio Optimizer
 * - Milestone F: Scientific Sources Explorer, Coverage Matrix & Export Engine
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const TEST_SUITES = [
  { name: 'Milestone B: Planetary Target Telemetry & MER Attribution', file: 'scripts/test-planetary-expansion.mjs' },
  { name: 'Milestone C: Earth Analog Candidates Expansion (8 Sites)', file: 'scripts/test-earth-analog-expansion.mjs' },
  { name: 'Milestone D: Reproducible Ingestion & Raster Topography', file: 'scripts/test-ingestion-pipelines.mjs' },
  { name: 'Milestone E: Provenance Badges, Comparability & Portfolio', file: 'scripts/test-milestone-e-integration.mjs' },
  { name: 'Milestone F: Sources Explorer, Coverage Matrix & Export Engine', file: 'scripts/test-milestone-f-explorer.mjs' },
  { name: 'Core Engine: Mathematical Similarity Engine & Safeguards', file: 'scripts/test-similarity-engine.mjs' },
  { name: 'Core Engine: Combinatorial Multi-Site Portfolio Optimizer', file: 'scripts/test-portfolio-optimizer.mjs' },
  { name: 'API Endpoints: Compare, Portfolio, Sources & Locations', file: 'scripts/test-api-endpoints.mjs' },
  { name: 'API Endpoints: Portfolio Multi-Site Optimization API', file: 'scripts/test-portfolio-api.mjs' },
  { name: 'Mission Control: 3D Planetary Flight Deck & Spherical Math', file: 'scripts/test-globe-integration.mjs' },
  { name: 'Mission Control: Earth Analog GIS Map Integration', file: 'scripts/test-map-integration.mjs' },
  { name: 'Mission Suite: End-to-End Mission Reconnaissance Flows', file: 'scripts/test-e2e-suite.mjs' },
]

console.log('=====================================================================')
console.log('       TERRATWIN PHASE 3: MASTER SCIENTIFIC VERIFICATION SUITE       ')
console.log('=====================================================================\n')

let totalSuites = TEST_SUITES.length
let passedSuites = 0
let failedSuites = 0
const startTime = Date.now()

for (const suite of TEST_SUITES) {
  process.stdout.write(`⏳ Running ${suite.name}... `)
  const suiteStart = Date.now()

  try {
    const fullPath = path.join(ROOT_DIR, suite.file)
    execSync(`node --test "${fullPath}"`, {
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
    console.error(err.stderr ? err.stderr.toString() : err.message)
    failedSuites++
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)

console.log('\n=====================================================================')
console.log('                      MASTER VERIFICATION REPORT                     ')
console.log('=====================================================================')
console.log(`Test Suites Evaluated: ${totalSuites}`)
console.log(`Suites Passed:         ${passedSuites}/${totalSuites}`)
console.log(`Suites Failed:         ${failedSuites}/${totalSuites}`)
console.log(`Total Execution Time:  ${totalDuration}s`)

if (failedSuites === 0) {
  console.log('\n🎉 ALL 12 TEST SUITES PASSED! PHASE 3 SCIENTIFIC VALIDATION COMPLETE.\n')
  process.exit(0)
} else {
  console.error(`\n❌ ${failedSuites} test suite(s) failed. Review outputs above.\n`)
  process.exit(1)
}
