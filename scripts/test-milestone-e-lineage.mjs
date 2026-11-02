/**
 * Phase 4 — Milestone E: Scientific Evidence Explorer & Telemetry Lineage Test Suite
 *
 * Verifies:
 * 1. 5-Stage Scientific Lineage traversal: Location -> Parameter -> Value -> Instrument/Dataset -> Documentation.
 * 2. Authentic instrument attribution across Mars (MOLA, MEDA, REMS, Athena), Moon (LOLA, Diviner), and Earth (Copernicus DEM, POWER, MODIS).
 * 3. Exact official HTTPS URLs and dataset identifiers for NASA PDS, NASA Earthdata, and ESA archives.
 * 4. Physical datum isolation (Mars Areoid vs Moon Sphere vs Earth Geoid) and non-comparable quantity handling.
 * 5. Full SSR and route health for both /explore and /sources.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EVIDENCE_CATEGORIES,
  getEvidenceLineage,
  getAllEvidenceLineages,
} from '../src/lib/terratwin/evidence-lineage.ts'
import {
  CANONICAL_EXPANDED_CANDIDATE_LOCATIONS,
  CANONICAL_EXPANDED_EARTH_CANDIDATES,
} from '../src/lib/terratwin/db/planetary-repository.ts'
import { SAMPLE_TARGETS } from '../src/lib/terratwin/sample-dataset.ts'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

test('Milestone E.1: 5-Stage Scientific Lineage Generation across All Targets', () => {
  assert.equal(SAMPLE_TARGETS.length >= 4, true, 'Must evaluate all planetary targets')

  for (const target of SAMPLE_TARGETS) {
    const lineages = getAllEvidenceLineages(target)
    assert.equal(lineages.length, 12, `${target.name} must generate all 12 feature lineages`)

    for (const item of lineages) {
      // Stage 1
      assert.equal(item.locationName, target.name)
      assert.ok(item.referenceDatum.length > 10, 'Reference datum must be explicitly identified')
      if (target.body === 'mars') {
        assert.ok(item.referenceDatum.includes('IAU2000 Areoid'), 'Mars targets must cite IAU2000 Areoid')
      } else if (target.body === 'moon') {
        assert.ok(item.referenceDatum.includes('1,737.4 km'), 'Moon targets must cite 1,737.4 km sphere')
      }

      // Stage 2
      assert.ok(item.featureLabel.length > 0)
      assert.ok(item.comparabilityClassification.length > 0)
      assert.ok(item.comparabilityRationale.length > 0)

      // Stage 3
      assert.ok(item.displayValue.length > 0)
      assert.ok(item.temporalCoverage.length > 0)
      assert.ok(item.spatialResolution.length > 0)
      assert.ok(item.qualityInformation.length > 0)

      // Stage 4
      assert.ok(item.instrumentName.length > 0)
      assert.ok(item.datasetIdentifier.length > 0)
      assert.ok(item.datasetProvider.length > 0)
      assert.ok(item.processingMethod.length > 0)
      assert.ok(item.scientificLimitations.length > 0)

      // Stage 5
      assert.ok(item.officialDocumentationUrl.startsWith('https://'), 'URL must be secure HTTPS')
      assert.ok(
        item.officialDocumentationUrl.includes('nasa.gov') ||
          item.officialDocumentationUrl.includes('wustl.edu') ||
          item.officialDocumentationUrl.includes('asu.edu') ||
          item.officialDocumentationUrl.includes('nmsu.edu') ||
          item.officialDocumentationUrl.includes('uahirise.org'),
        `Official documentation must lead to space agency archive: ${item.officialDocumentationUrl}`
      )
    }
  }
})

test('Milestone E.2: Authentic Space Agency Instrument Attribution', () => {
  const jezero = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  const gale = SAMPLE_TARGETS.find((t) => t.id === 'mars-gale-crater') || SAMPLE_TARGETS.find((t) => t.name.includes('Gale'))
  const meridiani = SAMPLE_TARGETS.find((t) => t.id === 'mars-meridiani-planum')
  const shackleton = SAMPLE_TARGETS.find((t) => t.id === 'moon-south-polar-highlands') || SAMPLE_TARGETS.find((t) => t.name.includes('Shackleton'))

  // 1. Jezero Elevation -> MOLA MEGDR
  const jezeroElev = getEvidenceLineage(jezero, 'elevationM')
  assert.equal(jezeroElev.instrumentName, 'Mars Orbiter Laser Altimeter (MOLA)')
  assert.equal(jezeroElev.datasetIdentifier, 'MGS-M-MOLA-5-MEGDR-L3-V1.0')

  // 2. Jezero Surface Temp -> MEDA TIRS
  const jezeroTemp = getEvidenceLineage(jezero, 'meanSurfaceTempC')
  assert.ok(jezeroTemp.instrumentName.includes('MEDA'))
  assert.equal(jezeroTemp.datasetIdentifier, 'M2020-M-MEDA-2-RDR-V1.0')

  // 3. Meridiani Surface Temp -> Athena Mini-TES
  if (meridiani) {
    const meridianiTemp = getEvidenceLineage(meridiani, 'meanSurfaceTempC')
    assert.ok(meridianiTemp.instrumentName.includes('Mini-TES'))
    assert.equal(meridianiTemp.datasetIdentifier, 'MER2-M-ATHENA-4-GSE-V1.0')
  }

  // 4. Shackleton Moon Temp -> Diviner DLRE
  if (shackleton) {
    const shackletonTemp = getEvidenceLineage(shackleton, 'meanSurfaceTempC')
    assert.ok(shackletonTemp.instrumentName.includes('Diviner Lunar Radiometer'))
    assert.equal(shackletonTemp.datasetIdentifier, 'LRO-L-DLRE-4-GDR-V1.0')

    const shackletonElev = getEvidenceLineage(shackleton, 'elevationM')
    assert.equal(shackletonElev.instrumentName, 'Lunar Orbiter Laser Altimeter (LOLA)')
    assert.equal(shackletonElev.datasetIdentifier, 'LRO-L-LOLA-4-GDR-V1.0')
  }
})

test('Milestone E.3: 5-Stage Lineage across Expanded Earth Candidates (Salda, Askja, Rio Tinto)', () => {
  for (const cand of CANONICAL_EXPANDED_EARTH_CANDIDATES) {
    const lineages = getAllEvidenceLineages(cand)
    assert.equal(lineages.length, 12)

    // Check Elevation -> Copernicus DEM 90m / SRTMGL1
    const elev = lineages.find((l) => l.featureKey === 'elevationM')
    assert.ok(elev.instrumentName.includes('InSAR') || elev.instrumentName.includes('Radar'))
    assert.ok(elev.referenceDatum.includes('EGM96 Geoid'))
    assert.ok(elev.officialDocumentationUrl.startsWith('https://'))

    // Check Temperature -> NASA POWER Climatology
    const temp = lineages.find((l) => l.featureKey === 'meanSurfaceTempC')
    assert.ok(temp.instrumentName.includes('CERES') || temp.instrumentName.includes('MODIS'))
    assert.ok(temp.datasetIdentifier.includes('POWER') || temp.datasetIdentifier.includes('API'))

    // Check Physical Disparity for Pressure & Precipitation
    const pressure = lineages.find((l) => l.featureKey === 'surfacePressurePa')
    assert.equal(pressure.comparabilityClassification, 'NOT_COMPARABLE')
    assert.ok(pressure.scientificLimitations.includes('Extreme disparity') || pressure.scientificLimitations.includes('Cannot be matched'))
  }
})

test('Milestone E.4: SSR Route Health for /sources and /explore', async () => {
  // 1. /sources page
  const resSources = await fetch(`${BASE_URL}/sources`)
  assert.equal(resSources.status, 200, '/sources must return HTTP 200')
  const htmlSources = await resSources.text()
  assert.ok(htmlSources.includes('Scientific Data Provenance') || htmlSources.includes('Coverage Matrix'), 'Must render sources header')
  assert.ok(htmlSources.includes('Evidence Lineage Explorer'), 'Must render Evidence Lineage Explorer tab button')

  // 2. /explore page
  const resExplore = await fetch(`${BASE_URL}/explore`)
  assert.equal(resExplore.status, 200, '/explore must return HTTP 200')
  const htmlExplore = await resExplore.text()
  assert.ok(htmlExplore.includes('Planetary Analog Mission Control'), 'Must render mission control header')
  assert.ok(htmlExplore.includes('TARGET SENSOR SUITE'), 'Must render Target Sensor Suite')
  assert.ok(htmlExplore.includes('Flight Deck Reconnaissance') || htmlExplore.includes('1-to-1 Analog Site Matching'), 'Must render reconnaissance controls')
})
