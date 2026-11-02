/**
 * Phase 4 — Milestone B: NASA Satellite Imagery & Environmental Telemetry Layers Test Suite
 *
 * Verifies:
 * 1. All 6 NASA GIBS & Esri satellite imagery layer definitions, metadata, disclaimers, and URL resolution.
 * 2. Live HTTP 200 reachability and valid image MIME types for all 6 tile services (including multi-date GIBS queries).
 * 3. All 9 interactive environmental telemetry map layers, color scales, units, and Phase 3 feature alignment.
 * 4. SSR rendering of /explore with the upgraded Global Reconnaissance & Remote-Sensing Explorer.
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  SATELLITE_IMAGERY_LAYERS,
  SATELLITE_LAYER_MAP,
  IMAGERY_DATE_PRESETS,
  ENVIRONMENTAL_MAP_LAYERS,
  ENVIRONMENTAL_MAP_LAYER_MAP,
  resolveSatelliteTileUrl,
} from "../src/lib/terratwin/config/satellite-layers.ts"
import { FEATURE_MAP } from "../src/lib/terratwin/features.ts"

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000"

test("Milestone B.1: All 6 Satellite Imagery Layers have complete scientific provenance & disclaimers", () => {
  assert.equal(SATELLITE_IMAGERY_LAYERS.length, 6, "Must define 6 satellite imagery layers")

  const expectedIds = [
    "dark-base",
    "modis-true-color",
    "modis-ndvi",
    "modis-lst-day",
    "modis-bands721",
    "aster-gdem-relief",
  ]

  for (const id of expectedIds) {
    const layer = SATELLITE_LAYER_MAP[id]
    assert.ok(layer, `Layer ${id} must exist in SATELLITE_LAYER_MAP`)
    assert.ok(layer.name.length > 5, `Layer ${id} must have a descriptive name`)
    assert.ok(layer.provider.length > 3, `Layer ${id} must specify provider`)
    assert.ok(layer.instrument.length > 3, `Layer ${id} must specify instrument`)
    assert.ok(layer.productId.length > 3, `Layer ${id} must specify productId`)
    assert.ok(layer.sourceUrl.startsWith("https://"), `Layer ${id} must have an HTTPS sourceUrl`)
    assert.ok(layer.spatialResolution.length > 2, `Layer ${id} must specify spatialResolution`)
    assert.ok(layer.temporalResolution.length > 2, `Layer ${id} must specify temporalResolution`)
    assert.ok(layer.scientificDescription.length > 20, `Layer ${id} must include scientificDescription`)
    assert.ok(layer.visualizationDisclaimer.length > 20, `Layer ${id} must include visualizationDisclaimer`)
    assert.ok(layer.legendStops.length >= 3, `Layer ${id} must define at least 3 colorbar legend stops`)
  }
})

test("Milestone B.2: Date resolution and seasonal presets generate valid WMTS URLs", () => {
  assert.ok(IMAGERY_DATE_PRESETS.length >= 4, "Must include at least 4 seasonal date presets")

  const trueColorUrl = resolveSatelliteTileUrl("modis-true-color", "2024-07-15")
  assert.ok(
    trueColorUrl.includes("/2024-07-15/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"),
    "True Color URL must substitute date and use Level9 JPG tiles"
  )

  const invalidDateFallback = resolveSatelliteTileUrl("modis-ndvi", "not-a-date")
  assert.ok(
    invalidDateFallback.includes("/2024-07-15/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png"),
    "Invalid date string must safely fall back to defaultDate"
  )
})

test("Milestone B.3: Live NASA GIBS & Esri WMTS tile endpoints return HTTP 200 with image MIME types", async () => {
  for (const layer of SATELLITE_IMAGERY_LAYERS) {
    const template = resolveSatelliteTileUrl(layer.id, "2024-07-15")
    const concreteTileUrl = template
      .replace("{z}", "3")
      .replace("{y}", "3")
      .replace("{x}", "4")

    const res = await fetch(concreteTileUrl, { method: "HEAD" })
    assert.equal(
      res.status,
      200,
      `Tile endpoint for ${layer.id} (${concreteTileUrl}) must return HTTP 200, got ${res.status}`
    )
    const contentType = res.headers.get("content-type") || ""
    assert.ok(
      contentType.startsWith("image/"),
      `Tile endpoint for ${layer.id} must return image/* content-type, got ${contentType}`
    )
  }

  // Also test Austral Summer date preset (2024-01-15) on temporal GIBS layers
  for (const temporalId of ["modis-true-color", "modis-ndvi", "modis-lst-day", "modis-bands721"]) {
    const template = resolveSatelliteTileUrl(temporalId, "2024-01-15")
    const concreteTileUrl = template
      .replace("{z}", "3")
      .replace("{y}", "3")
      .replace("{x}", "4")
    const res = await fetch(concreteTileUrl, { method: "HEAD" })
    assert.equal(res.status, 200, `Temporal tile for ${temporalId} on 2024-01-15 must return HTTP 200`)
  }
})

test("Milestone B.4: All 9 Interactive Environmental Parameter Map Layers map to verified Phase 3 features", () => {
  assert.equal(ENVIRONMENTAL_MAP_LAYERS.length, 9, "Must define 9 interactive parameter layers")

  for (const paramLayer of ENVIRONMENTAL_MAP_LAYERS) {
    assert.ok(paramLayer.label.length > 3, `Layer ${paramLayer.id} must have a label`)
    assert.ok(paramLayer.sourceDataset.length > 5, `Layer ${paramLayer.id} must cite sourceDataset`)
    assert.ok(paramLayer.sourceUrl.startsWith("https://"), `Layer ${paramLayer.id} must have HTTPS sourceUrl`)
    assert.ok(paramLayer.scientificMeaning.length > 20, `Layer ${paramLayer.id} must explain scientificMeaning`)
    assert.ok(paramLayer.legendStops.length >= 3, `Layer ${paramLayer.id} must have >= 3 legend stops`)

    if (paramLayer.featureKey !== null) {
      assert.ok(
        FEATURE_MAP[paramLayer.featureKey],
        `Parameter layer ${paramLayer.id} must reference a valid Phase 3 FeatureKey`
      )
    }

    // Verify color scale handles numeric, categorical, and null values cleanly
    const cNum = paramLayer.getColor(15)
    const cNull = paramLayer.getColor(null)
    assert.ok(cNum.startsWith("#"), `getColor(15) for ${paramLayer.id} must return hex color`)
    assert.ok(cNull.startsWith("#"), `getColor(null) for ${paramLayer.id} must return fallback hex color`)
  }

  // Verify categorical lithology color mapping
  const lithLayer = ENVIRONMENTAL_MAP_LAYER_MAP["lithology"]
  assert.equal(lithLayer.getColor("basaltic"), "#38bdf8")
  assert.equal(lithLayer.getColor("clay-sedimentary"), "#34d399")
  assert.equal(lithLayer.getColor("sulfate-evaporite"), "#f59e0b")
})

test("Milestone B.5: Explorer page (/explore) renders cleanly without regression", async () => {
  const res = await fetch(`${BASE_URL}/explore`)
  assert.equal(res.status, 200, "/explore route must return HTTP 200")
  const html = await res.text()
  assert.ok(html.includes("Planetary Analog Mission Control"), "Must render Mission Control header")
})

