import test, { after, before } from "node:test"
import assert from "node:assert"
import { resolve } from "node:path"
import { ChromeCdpBrowser, type ChromeCdpPage } from "./chrome-cdp.ts"
import { GEOLOGICAL_RESEARCH_PROFILE } from "../../src/lib/terratwin/config/comparison-config.ts"

const BASE_URL = process.env.TERRATWIN_E2E_URL ?? "http://localhost:3000"
const SHOT_DIR = resolve(process.cwd(), "artifacts", "phase6-step4-1")

let browser: ChromeCdpBrowser
let browserVersion: Record<string, unknown> = {}

// Reusable valid minimal mocked RegionalDiscoveryResponse for deterministic error/integrity tests
function buildMockDiscoveryResponse(overrides: Partial<Record<string, unknown>> = {}) {
  const base = {
    success: true,
    searchMetadata: {
      boundingBox: [37.1, 29.2, 38.0, 30.2],
      targetId: "mars-jezero-delta",
      missionProfile: "geological-research",
      gridSpacingDeg: 0.5,
      cellsGenerated: 2,
      cellsEvaluated: 2,
      maxCellsAllowed: 16,
      responseCacheHit: false,
    },
    target: {
      id: "mars-jezero-delta",
      body: "mars",
      name: "Jezero Crater Delta",
      subtitle: "Ancient lacustrine fan-delta",
      region: "Isidis Planitia Rim",
      coordinates: "18.38° N, 77.58° E",
      latitude: 18.38,
      longitude: 77.58,
      summary: "Target benchmark",
      description: "Target benchmark",
      missionRelevance: "High",
      isVerified: true,
      environment: {
        meanSlopeDeg: 4.5,
        rockAbundancePct: 12,
        medianGrainSizeMm: 0.1,
        elevationM: -2500,
        vegetationCoverPct: 0,
        meanSurfaceTempC: -63,
        diurnalTempRangeC: 80,
        surfaceSolarIrradianceWm2: 590,
        lithology: "carbonate-clay-evaporite",
        albedo: 0.25,
        annualPrecipitationMm: 0,
        surfacePressurePa: 650,
      },
    },
    missionProfile: {
      id: "geological-research",
      label: "Geological field research",
      summary: "Test profile",
      statusNotice: "Test notice",
      weights: GEOLOGICAL_RESEARCH_PROFILE.weights,
    },
    providerStatuses: [
      {
        provider: "Open-Meteo Elevation",
        dataset: "Copernicus DEM GLO-90",
        status: "success",
        recordsFetched: 2,
        latencyMs: 18,
        spatialResolution: "90 m",
        attributionNotice: "Open-Meteo Copernicus DEM",
      },
      {
        provider: "NASA POWER Climatology",
        dataset: "POWER Climatology v2.10.1",
        status: "partial",
        recordsFetched: 1,
        latencyMs: 24,
        spatialResolution: "0.5° × 0.625°",
        temporalCoverage: "2001–2025",
        attributionNotice: "NASA POWER",
      },
      {
        provider: "Macrostrat Geology",
        dataset: "Macrostrat API v2",
        status: "failed",
        recordsFetched: 0,
        latencyMs: 12,
        spatialResolution: "Regional polygon",
        attributionNotice: "Macrostrat",
        error: "Simulated upstream timeout",
      },
    ],
    totalCellsEvaluated: 2,
    computableCandidatesCount: 1,
    insufficientDataCandidatesCount: 1,
    warnings: [
      "NASA POWER 50km climatology is a regional proxy, not site-level telemetry.",
    ],
    executionTimeMs: 42,
    candidates: [
      {
        rank: 1,
        candidate: {
          id: "cell_+37.3500_+29.4500",
          name: "Exploratory Grid Cell #1",
          country: "Regional Screen",
          region: "Eurasia",
          setting: "Computed Regional Terrain",
          description: "Live API regional cell",
          latitude: 37.35,
          longitude: 29.45,
          boundingBox: [37.1, 29.2, 37.6, 29.7],
          category: "paleolake-carbonate-evaporite",
          noveltyTier: "live-grid-discovery",
          isVerified: false,
          evidenceClassification: "derived",
          primarySources: ["Open-Meteo Elevation", "NASA POWER Climatology"],
          limitations: ["Missing Macrostrat lithology"],
          environment: {
            meanSlopeDeg: 4.1,
            elevationM: 1180,
            meanSurfaceTempC: 11.5,
            diurnalTempRangeC: 14.2,
            surfaceSolarIrradianceWm2: 205,
            lithology: null,
            medianGrainSizeMm: null,
            rockAbundancePct: null,
          },
          provenanceMap: {
            meanSlopeDeg: {
              status: "unverified",
              dataOrigin: "computed-derivative",
              evidenceClassification: "derived",
              verificationState: "unverified",
              sourceTitle: "Open-Meteo 5-Point Central-Difference Gradient",
              sourceUrl: "https://api.open-meteo.com/v1/elevation",
              spatialResolution: "~445 m baseline",
              qualityNotes: "Copernicus GLO-90 central-difference slope",
              isComparable: true,
            },
            meanSurfaceTempC: {
              status: "unverified",
              dataOrigin: "live-api-estimate",
              evidenceClassification: "proxy",
              verificationState: "unverified",
              sourceTitle: "NASA POWER T2M 2m Air Temp Proxy",
              sourceUrl: "https://power.larc.nasa.gov/",
              spatialResolution: "0.5° × 0.625°",
              measurementPeriod: "2001–2025",
              originalSourceValue: 11.5,
              originalSourceUnit: "°C",
              isComparable: true,
            },
            lithology: {
              status: "no-data",
              dataOrigin: "missing",
              evidenceClassification: "missing_data",
              verificationState: "no-data",
              sourceTitle: "Macrostrat API v2",
              qualityNotes: "Provider timeout simulated",
              isComparable: false,
              incomparabilityReason: "Provider failure",
            },
          },
        },
        score: 76.4,
        scoreDisplay: "76.4%",
        coverage: 0.62,
        confidence: "moderate",
        isReliable: true,
        weightedDistance: 0.236,
        missingFeatures: ["lithology", "medianGrainSizeMm"],
        incompatibleFeatures: [],
        featureScores: [
          {
            key: "meanSlopeDeg",
            targetValue: 4.5,
            candidateValue: 4.1,
            weight: 0.1,
            similarity: 0.98,
            status: "comparable",
            targetProvenance: { status: "verified", unit: "deg", isComparable: true },
            candidateProvenance: { status: "unverified", unit: "deg", isComparable: true },
          },
          {
            key: "meanSurfaceTempC",
            targetValue: -63,
            candidateValue: 11.5,
            weight: 0.05,
            similarity: 0.55,
            status: "comparable",
            targetProvenance: { status: "verified", unit: "°C", isComparable: true },
            candidateProvenance: { status: "unverified", unit: "°C", isComparable: true },
          },
        ],
        explanation: "Ranked lead with partial climate and DEM evidence.",
        warnings: ["Macrostrat provider timed out; lithology remains unmeasured (null)."],
      },
      {
        rank: 2,
        candidate: {
          id: "cell_+37.3500_+29.9500",
          name: "Exploratory Grid Cell #2",
          country: "Regional Screen",
          region: "Eurasia",
          setting: "Computed Regional Terrain",
          description: "Insufficient coverage cell",
          latitude: 37.35,
          longitude: 29.95,
          boundingBox: [37.1, 29.7, 37.6, 30.2],
          category: "paleolake-carbonate-evaporite",
          noveltyTier: "live-grid-discovery",
          isVerified: false,
          evidenceClassification: "missing_data",
          primarySources: ["Open-Meteo Elevation"],
          limitations: ["Coverage < 40%"],
          environment: {
            meanSlopeDeg: 8.2,
            elevationM: 1410,
            meanSurfaceTempC: null,
            lithology: null,
          },
          provenanceMap: {
            meanSurfaceTempC: {
              status: "no-data",
              dataOrigin: "missing",
              evidenceClassification: "missing_data",
              verificationState: "no-data",
              sourceTitle: "NASA POWER",
              isComparable: false,
              incomparabilityReason: "Partial climate outage",
            },
          },
        },
        score: null,
        scoreDisplay: "Insufficient data to rank reliably",
        coverage: 0.25,
        confidence: "low",
        isReliable: false,
        weightedDistance: null,
        missingFeatures: ["meanSurfaceTempC", "lithology"],
        incompatibleFeatures: [],
        featureScores: [],
        explanation: "Coverage 25% is below 40% threshold.",
        warnings: ["Evidence coverage < 40%; score withheld as null."],
      },
    ],
    ...overrides,
  }
  return base
}

async function openFreshPage(width = 1440, height = 900, mobile = false): Promise<ChromeCdpPage> {
  const page = await browser.newPage()
  await page.setViewport(width, height, mobile)
  return page
}

async function clickButtonByText(page: ChromeCdpPage, substr: string, exact = false): Promise<void> {
  const res = await page.evaluate<{ ok: boolean; x: number; y: number }>(`(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const target = buttons.find((el) => {
      const txt = (el.textContent || '').trim();
      const visible = el.offsetParent !== null || el.getClientRects().length > 0;
      if (!visible) return false;
      return ${exact} ? txt === ${JSON.stringify(substr)} : txt.includes(${JSON.stringify(substr)});
    });
    if (!target) return { ok: false, x: 0, y: 0 };
    target.scrollIntoView({ block: 'center', inline: 'center' });
    const r = target.getBoundingClientRect();
    return { ok: true, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`)
  assert.ok(res.ok, `Expected visible button/link containing ${JSON.stringify(substr)}`)
  await page.clickMouse(res.x, res.y)
  await new Promise((r) => setTimeout(r, 150))
}

before(async () => {
  browser = new ChromeCdpBrowser({ port: 9223 })
  const launched = await browser.launch()
  browserVersion = launched.version
  console.log(`Connected headless Chrome: ${String(browserVersion.Browser)}`)
})

after(async () => {
  await browser.close()
})

test("E2E 1: Primary routes render with HTTP 200 and zero uncaught page errors", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    const routes = ["/", "/discover", "/explore", "/sources", "/methodology"]
    for (const route of routes) {
      page.clearTelemetry()
      await page.goto(`${BASE_URL}${route}`)
      await page.waitForFunction(`document.body && document.body.innerText.trim().length > 80`)
      const docRequests = [...page.networkRequests.values()].filter((r) => r.url === `${BASE_URL}${route}`)
      if (docRequests.length > 0 && docRequests[0].status) {
        assert.strictEqual(docRequests[0].status, 200, `Expected HTTP 200 for ${route}`)
      }
      assert.strictEqual(page.pageErrors.length, 0, `Unexpected pageErrors on ${route}: ${page.pageErrors.join("; ")}`)
    }
  } finally {
    await page.close()
  }
})

test("E2E 2: Desktop (1440x900) /discover initial render, Leaflet init, tiles, legend, atlas pins & panel collapse resize", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForText("Discovery Scanner")
    await page.waitForFunction(`Boolean(document.querySelector('.leaflet-container'))`)
    await page.waitForFunction(`document.querySelectorAll('.leaflet-overlay-pane path.leaflet-interactive').length >= 31`)
    await new Promise((r) => setTimeout(r, 900)) // allow initial basemap tiles to load

    const initialAudit = await page.evaluate<{
      leafletContainers: number
      atlasSvgPaths: number
      mapWidth: number
      mapHeight: number
      tileCount: number
      hasAttribution: boolean
      hasLegend: boolean
      overflowX: boolean
    }>(`(() => {
      const container = document.querySelector('.leaflet-container');
      const r = container ? container.getBoundingClientRect() : { width: 0, height: 0 };
      return {
        leafletContainers: document.querySelectorAll('.leaflet-container').length,
        atlasSvgPaths: document.querySelectorAll('.leaflet-overlay-pane path.leaflet-interactive').length,
        mapWidth: Math.round(r.width),
        mapHeight: Math.round(r.height),
        tileCount: document.querySelectorAll('.leaflet-tile').length,
        hasAttribution: Boolean(document.querySelector('.leaflet-control-attribution')),
        hasLegend:
          document.body.innerText.toLowerCase().includes('legend:') &&
          document.body.innerText.includes('Canonical Atlas (8)'),
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
      };
    })()`)

    assert.strictEqual(initialAudit.leafletContainers, 1, "Leaflet should initialize once cleanly")
    assert.ok(initialAudit.atlasSvgPaths >= 31, `Expected >= 31 Atlas markers, got ${initialAudit.atlasSvgPaths}`)
    assert.ok(initialAudit.mapWidth >= 500 && initialAudit.mapHeight >= 450, `Unexpected map size ${initialAudit.mapWidth}x${initialAudit.mapHeight}`)
    assert.ok(initialAudit.tileCount >= 1, "Expected Leaflet base map tiles to render")
    assert.ok(initialAudit.hasAttribution, "Expected visible Leaflet attribution")
    assert.ok(initialAudit.hasLegend, "Expected visible Discovery Map Legend")
    assert.strictEqual(initialAudit.overflowX, false, "Unexpected horizontal overflow on 1440x900 desktop")

    await page.screenshot(`${SHOT_DIR}/desktop-scanner-initial.png`)

    // Test collapsing left & right panels and verifying Leaflet container expands smoothly without broken sizing
    await clickButtonByText(page, "Hide Config")
    await clickButtonByText(page, "Hide Results")
    await new Promise((r) => setTimeout(r, 350))

    const expandedAudit = await page.evaluate<{ width: number; containers: number }>(`(() => {
      const c = document.querySelector('.leaflet-container');
      return {
        width: c ? Math.round(c.getBoundingClientRect().width) : 0,
        containers: document.querySelectorAll('.leaflet-container').length,
      };
    })()`)
    assert.ok(expandedAudit.width > initialAudit.mapWidth + 200, "Map width should expand when sidebars collapse")
    assert.strictEqual(expandedAudit.containers, 1, "Collapsing sidebars must not remount Leaflet")

    await clickButtonByText(page, "Show Config")
    await clickButtonByText(page, "Show Results")
    await new Promise((r) => setTimeout(r, 250))

    assert.strictEqual(page.pageErrors.length, 0)
  } finally {
    await page.close()
  }
})

test("E2E 3: Moon/Mars selector, all 4 mission profiles & repository weights disclosure", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForText("Launch Discovery Scan")

    await clickButtonByText(page, "Martian surface")
    await new Promise((r) => setTimeout(r, 120))
    const marsHasJezero = await page.evaluate<boolean>(`document.body.innerText.includes('Jezero Crater')`)
    assert.ok(marsHasJezero, "Selecting Mars must show Mars targets")

    await clickButtonByText(page, "Lunar base sites")
    await new Promise((r) => setTimeout(r, 120))
    const moonHasShackleton = await page.evaluate<boolean>(`document.body.innerText.includes('Shackleton')`)
    assert.ok(moonHasShackleton, "Selecting Moon must show Moon targets")

    // Check all 4 mission profiles and verify weights match repository comparison-config.ts
    await clickButtonByText(page, "Factors influencing similarity")
    const profiles = [
      "Rover testing & trafficability",
      "Geological field research",
      "Lunar base construction & ISRU",
      "Astrobiology & habitability",
    ]
    for (const label of profiles) {
      await clickButtonByText(page, label)
      await new Promise((r) => setTimeout(r, 80))
    }

    // Return to Lunar Base Construction and check meanSlopeDeg weight (25%) appears
    await clickButtonByText(page, "Lunar base construction & ISRU")
    const hasExpectedWeight = await page.evaluate<boolean>(`document.body.innerText.includes('25%')`)
    assert.ok(hasExpectedWeight, "Expected Lunar Base Construction weights to match comparison-config.ts (25% slope)")
  } finally {
    await page.close()
  }
})

test("E2E 4: Interactive pointer-drag bounding box drawing, redraw replacement & pan resumption", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForFunction(`Boolean(document.querySelector('.leaflet-container'))`)
    await new Promise((r) => setTimeout(r, 500))

    // Ensure manual coordinate inputs are expanded (panel starts expanded by default)
    const coordVisible = await page.evaluate<boolean>(`Boolean(document.querySelector('input[placeholder="35.0"]'))`)
    if (!coordVisible) {
      await clickButtonByText(page, "Manual Coordinates [S, W, N, E]")
    }
    // Zoom in 3 steps so a human-sized pointer drag spans ~2°×2° (within 10°×10° limit & 16-cell cap)
    for (let z = 0; z < 3; z++) {
      await page.clickSelector(".leaflet-control-zoom-in")
      await new Promise((r) => setTimeout(r, 250))
    }

    await clickButtonByText(page, "Select Region")

    const mapBox = await page.evaluate<{ left: number; top: number; width: number; height: number }>(`(() => {
      const r = document.querySelector('.leaflet-container').getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    })()`)

    const cx = mapBox.left + mapBox.width * 0.5
    const cy = mapBox.top + mapBox.height * 0.45
    await page.dragMouse(cx - 25, cy - 20, cx + 25, cy + 20, 6)
    await new Promise((r) => setTimeout(r, 250))

    const drawnCoords = await page.evaluate<{ vals: string[]; errorVisible: boolean }>(`(() => {
      const inputs = ['35.0', '-112.0', '36.0', '-111.0'].map((ph) =>
        document.querySelector('input[placeholder="' + ph + '"]')
      );
      return {
        vals: inputs.map((i) => (i ? i.value : '')),
        errorVisible: Boolean(document.getElementById('scanner-region-error')),
      };
    })()`)

    assert.strictEqual(drawnCoords.errorVisible, false, `Expected zoomed drawn region to be valid, vals=${drawnCoords.vals.join(",")}`)
    assert.ok(drawnCoords.vals.every((v) => v !== "" && Number.isFinite(Number(v))), "Manual coordinate inputs should populate after draw")
    assert.ok(Number(drawnCoords.vals[0]) < Number(drawnCoords.vals[2]), "Min Lat must be < Max Lat")
    assert.ok(Number(drawnCoords.vals[1]) < Number(drawnCoords.vals[3]), "Min Lon must be < Max Lon")

    await page.screenshot(`${SHOT_DIR}/desktop-region-selected.png`)

    // Redraw shifted box and verify old coordinates replace cleanly + pan works when draw mode ends
    await clickButtonByText(page, "Select Region")
    await page.dragMouse(cx - 10, cy - 10, cx + 35, cy + 25, 6)
    await new Promise((r) => setTimeout(r, 250))
    const redrawnCoords = await page.evaluate<string[]>(
      `['35.0', '-112.0', '36.0', '-111.0'].map((ph) => document.querySelector('input[placeholder="' + ph + '"]')?.value ?? '')`
    )
    assert.notDeepStrictEqual(redrawnCoords, drawnCoords.vals, "Second draw must replace previous bounding box")

    // Verify draw mode auto-disabled and normal map panning resumed
    const stillDrawing = await page.evaluate<boolean>(`document.body.innerText.includes('Drag Box on Map')`)
    assert.strictEqual(stillDrawing, false, "Draw mode should deactivate after completing drag box")
    const beforePan = await page.evaluate<string>(`document.querySelector('.leaflet-map-pane').style.transform`)
    await page.dragMouse(cx, cy, cx + 60, cy + 40, 5)
    await new Promise((r) => setTimeout(r, 200))
    const afterPan = await page.evaluate<string>(`document.querySelector('.leaflet-map-pane').style.transform`)
    assert.notStrictEqual(afterPan, beforePan, "Map should pan normally once draw mode exits")
  } finally {
    await page.close()
  }
})

test("E2E 5: Manual coordinate validation (invalid/inverted/zero/oversized/antimeridian) & presets", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForText("Manual Coordinates [S, W, N, E]")
    const coordVisible = await page.evaluate<boolean>(`Boolean(document.querySelector('input[placeholder="35.0"]'))`)
    if (!coordVisible) {
      await clickButtonByText(page, "Manual Coordinates [S, W, N, E]")
    }

    const coordSelectors = [
      'input[placeholder="35.0"]',
      'input[placeholder="-112.0"]',
      'input[placeholder="36.0"]',
      'input[placeholder="-111.0"]',
    ]

    const setCoords = async (vals: [string, string, string, string]) => {
      for (let i = 0; i < 4; i++) {
        await page.typeIntoSelector(coordSelectors[i], vals[i])
      }
      await new Promise((r) => setTimeout(r, 120))
    }

    // Oversized >10 deg
    await setCoords(["20", "10", "35", "25"])
    const oversizedErr = await page.evaluate<string>(`document.getElementById('scanner-region-error')?.innerText || ''`)
    assert.ok(oversizedErr.includes("exceeds"), `Expected oversized error, got: ${oversizedErr}`)

    // Antimeridian crossing (minLon > maxLon)
    await setCoords(["10", "175", "12", "-175"])
    const antiErr = await page.evaluate<string>(`document.getElementById('scanner-region-error')?.innerText || ''`)
    assert.ok(antiErr.includes("antimeridian"), `Expected antimeridian error, got: ${antiErr}`)

    // Inverted latitude (minLat > maxLat)
    await setCoords(["40", "10", "30", "12"])
    const invErr = await page.evaluate<string>(`document.getElementById('scanner-region-error')?.innerText || ''`)
    assert.ok(invErr.includes("cannot exceed"), `Expected inverted lat error, got: ${invErr}`)

    // Zero area
    await setCoords(["35", "-112", "35", "-111"])
    const zeroErr = await page.evaluate<string>(`document.getElementById('scanner-region-error')?.innerText || ''`)
    assert.ok(zeroErr.includes("zero area"), `Expected zero area error, got: ${zeroErr}`)

    // Out-of-bounds latitude (>90)
    await setCoords(["85", "10", "95", "12"])
    const latErr = await page.evaluate<string>(`document.getElementById('scanner-region-error')?.innerText || ''`)
    assert.ok(latErr.includes("-90°"), `Expected latitude bounds error, got: ${latErr}`)

    // Preset regions check all 4
    const presets = [
      "Lake Salda, Turkey",
      "Flagstaff Volcanic Field, US",
      "Atacama Yungay, Chile",
      "Askja Highlands, Iceland",
    ]
    for (const preset of presets) {
      await clickButtonByText(page, preset)
      await new Promise((r) => setTimeout(r, 150))
      const hasErr = await page.evaluate<boolean>(`Boolean(document.getElementById('scanner-region-error'))`)
      assert.strictEqual(hasErr, false, `Preset ${preset} should produce valid coordinates cleanly`)
    }

    // Map Viewport oversized check at Global zoom
    await clickButtonByText(page, "Global")
    await new Promise((r) => setTimeout(r, 350))
    await clickButtonByText(page, "Map Viewport")
    await new Promise((r) => setTimeout(r, 150))
    const viewportErr = await page.evaluate<string>(`document.getElementById('scanner-region-error')?.innerText || ''`)
    assert.ok(viewportErr.includes("exceeds"), `Capturing global map viewport must show oversized error, got: ${viewportErr}`)
  } finally {
    await page.close()
  }
})

test("E2E 6: GENUINE LIVE browser-to-server POST /api/discover scan + map sync + screenshots", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForFunction(`Boolean(document.querySelector('.leaflet-container'))`)

    // Configure Mars Jezero + Geological field research + Lake Salda preset + minimal fast 4-cell grid (spacing 0.5, maxCells 4)
    await clickButtonByText(page, "Martian surface")
    await clickButtonByText(page, "Geological field research")
    await clickButtonByText(page, "Lake Salda, Turkey")
    await new Promise((r) => setTimeout(r, 200))

    // Set maxCells to 4 so live API call is fast and gentle on Open-Meteo / NASA POWER / Macrostrat
    await page.evaluate<void>(`(() => {
      const inputs = Array.from(document.querySelectorAll('aside input[type="number"]'));
      const maxCellsInput = inputs.find((el) => el.getAttribute('max') === '100');
      if (maxCellsInput) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(maxCellsInput, '4');
        maxCellsInput.dispatchEvent(new Event('input', { bubbles: true }));
        maxCellsInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`)

    await page.waitForText("2 / 4 cells")
    page.clearTelemetry()

    await clickButtonByText(page, "Launch Discovery Scan")

    // Observable completion condition (fixes cold-cache header-text race):
    // 1. Wait for actual POST /api/discover network response
    const discoverNet = await page.waitForNetworkResponse("/api/discover", "POST", 35000)
    assert.strictEqual(
      discoverNet.status,
      200,
      `Expected live /api/discover status 200, got ${discoverNet.status} (err=${discoverNet.failedReason ?? "none"})`
    )
    // 2. Wait for scanner busy state to clear AND rendered results summary to mount in DOM
    await page.waitForFunction(
      `document.querySelector('aside[aria-label="Discovery intelligence and candidate results"]')?.getAttribute('data-scan-busy') === 'false' && document.body.innerText.toLowerCase().includes('cells analyzed')`,
      15000
    )

    // Verify genuine POST /api/discover request & JSON schema
    const apiReqs = [...page.networkRequests.values()].filter(
      (r) => r.url.endsWith("/api/discover") && r.method === "POST"
    )
    assert.strictEqual(apiReqs.length, 1, `Expected exactly 1 POST /api/discover request, got ${apiReqs.length}`)
    assert.strictEqual(apiReqs[0].status, 200, `Expected live /api/discover status 200, got ${apiReqs[0].status}`)

    const sentPayload = JSON.parse(apiReqs[0].postData ?? "{}") as Record<string, unknown>
    assert.ok(Array.isArray(sentPayload.boundingBox) && sentPayload.boundingBox.length === 4)
    assert.strictEqual(sentPayload.missionProfile, "geological-research")
    assert.strictEqual(sentPayload.gridSpacingDeg, 0.5)
    assert.strictEqual(sentPayload.maxCells, 4)

    // Verify provider telemetry, results -> map sync ("Cell #2" matches both ranked & unranked labels) and detail inspector
    await clickButtonByText(page, "Cell #2")
    await new Promise((r) => setTimeout(r, 200))

    // Also click the first live candidate rectangle on Leaflet map to verify map -> results sync
    const rectPoint = await page.evaluate<{ ok: boolean; x: number; y: number }>(`(() => {
      const rects = Array.from(document.querySelectorAll('.leaflet-overlay-pane path.leaflet-interactive')).filter(
        (p) => (p.getAttribute('d') || '').includes('L') && !(p.getAttribute('stroke-dasharray') || '').includes('6 5')
      );
      if (rects.length === 0) return { ok: false, x: 0, y: 0 };
      const r = rects[0].getBoundingClientRect();
      return { ok: r.width > 0 && r.height > 0, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`)
    if (rectPoint.ok) {
      await page.clickMouse(rectPoint.x, rectPoint.y)
      await new Promise((r) => setTimeout(r, 200))
    }

    const uiCheck = await page.evaluate<{
      hasProviders: boolean
      hasUnverified: boolean
      hasLimitations: boolean
      hasProvenance: boolean
      hasWhiteSelectedStroke: boolean
    }>(`(() => {
      const txt = document.body.innerText;
      const whitePaths = Array.from(document.querySelectorAll('.leaflet-overlay-pane path')).filter(
        (p) => p.getAttribute('stroke') === '#ffffff' && p.getAttribute('stroke-width') === '3'
      );
      return {
        hasProviders: txt.includes('Open-Meteo DEM') && txt.includes('NASA POWER') && txt.includes('Macrostrat Geo'),
        hasUnverified: txt.includes('Exploratory candidate — not field-verified') || txt.includes('Unverified'),
        hasLimitations: txt.includes('Gravity & Atmosphere') && txt.includes('Regional Proxy Scale'),
        hasProvenance: txt.toLowerCase().includes('environmental measurements & scientific evidence matrix'),
        hasWhiteSelectedStroke: whitePaths.length >= 1,
      };
    })()`)

    assert.ok(uiCheck.hasProviders, "Provider telemetry badges must render")
    assert.ok(uiCheck.hasUnverified, "Live leads must remain honestly unverified")
    assert.ok(uiCheck.hasLimitations, "Scientific planetary limitations must appear")
    assert.ok(uiCheck.hasProvenance, "Parameter & Provenance Matrix must appear for selected cell")
    assert.ok(uiCheck.hasWhiteSelectedStroke, "Clicking result card must highlight corresponding grid cell on Leaflet map")

    await page.screenshot(`${SHOT_DIR}/desktop-scan-results.png`)

    // Scroll to Candidate Details inspector & capture screenshot
    await page.evaluate<void>(
      `document.querySelector('section[aria-label="Selected candidate scientific detail and provenance inspector"]')?.scrollIntoView({ block: 'start' })`
    )
    await new Promise((r) => setTimeout(r, 250))
    await page.screenshot(`${SHOT_DIR}/desktop-candidate-details.png`)

    // Test stale warning when changing mission profile AFTER results load
    await clickButtonByText(page, "Rover testing & trafficability")
    await new Promise((r) => setTimeout(r, 150))
    const hasStaleNotice = await page.evaluate<boolean>(
      `document.body.innerText.includes('Displayed results were scored for')`
    )
    assert.ok(hasStaleNotice, "Switching mission profile after results load must show stale warning banner")
  } finally {
    await page.close()
  }
})

test("E2E 6B: Deterministic slow/cold-cache race guard waits through >1500ms latency cleanly", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForFunction(`Boolean(document.querySelector('.leaflet-container'))`)
    // Confirm pre-existing header string is already mounted before any scan launches
    const headerHasProviderName = await page.evaluate<boolean>(
      `document.body.innerText.includes('Open-Meteo DEM')`
    )
    assert.ok(headerHasProviderName, "Header subtitle already displays Open-Meteo DEM at rest")

    await clickButtonByText(page, "Lake Salda, Turkey")
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: async () => {
        // Deliberately exceed the legacy 800ms window to simulate cold upstream provider latency
        await new Promise((r) => setTimeout(r, 1500))
        return { status: 200, body: JSON.stringify(buildMockDiscoveryResponse()) }
      },
    })

    page.clearTelemetry()
    await clickButtonByText(page, "Launch Discovery Scan")

    // Must observe network response completion + busy-state exit even across 1500ms delay
    const rec = await page.waitForNetworkResponse("/api/discover", "POST", 15000)
    assert.strictEqual(rec.status, 200)
    await page.waitForFunction(
      `document.querySelector('aside[aria-label="Discovery intelligence and candidate results"]')?.getAttribute('data-scan-busy') === 'false' && document.body.innerText.toLowerCase().includes('cells analyzed')`,
      10000
    )
    const visibleScore = await page.evaluate<boolean>(`document.body.innerText.includes('76.4%')`)
    assert.ok(visibleScore, "Results must render cleanly after delayed cold-cache response")
  } finally {
    await page.close()
  }
})

test("E2E 7: Curated 31-site Global Atlas tab, search, filters, imagery switch & scan seed", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForFunction(`Boolean(document.querySelector('.leaflet-container'))`)

    await clickButtonByText(page, "Curated Atlas")
    await page.waitForText("Showing 31 of 31 documented global atlas candidates")

    await page.screenshot(`${SHOT_DIR}/desktop-global-atlas.png`)

    // Filter by novelty tier Canonical Benchmark (8)
    await page.evaluate<void>(`(() => {
      const sel = document.querySelector('select[aria-label="Filter atlas by novelty tier"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'canonical-benchmark');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`)
    await page.waitForText("Showing 8 of 31 documented global atlas candidates")

    // Reset novelty filter to All before searching under-explored site Rio Tinto
    await page.evaluate<void>(`(() => {
      const sel = document.querySelector('select[aria-label="Filter atlas by novelty tier"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'all');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`)
    await page.waitForText("Showing 31 of 31 documented global atlas candidates")

    // Search for Rio Tinto (Río Tinto / Rio Tinto)
    await page.typeIntoSelector('input[aria-label="Filter curated atlas locations"]', "Tinto")
    await new Promise((r) => setTimeout(r, 150))
    const hasRioTinto = await page.evaluate<boolean>(`document.body.innerText.includes('Tinto')`)
    assert.ok(hasRioTinto, "Atlas search should locate Rio Tinto")

    // Use as Regional Scan Seed
    await clickButtonByText(page, "Select Scan Region Here")
    await new Promise((r) => setTimeout(r, 200))
    const hasSeedPreview = await page.evaluate<boolean>(`document.body.innerText.includes('Grid preview:')`)
    assert.ok(hasSeedPreview, "Atlas seed button must populate valid bounded scan region")

    // Verify switching imagery layer never triggers /api/discover
    page.clearTelemetry()
    await page.evaluate<void>(`(() => {
      const sel = document.querySelector('select[aria-label="Basemap imagery layer"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'modis-true-color');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`)
    await new Promise((r) => setTimeout(r, 300))
    const discoverCalls = [...page.networkRequests.values()].filter((r) => r.url.includes("/api/discover"))
    assert.strictEqual(discoverCalls.length, 0, "Changing imagery layer must never invoke /api/discover")
  } finally {
    await page.close()
  }
})

test("E2E 8: Deterministic Error States (400/404/429/500/Partial/Empty/Malformed/Abort) & Concurrency", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForText("Launch Discovery Scan")
    await clickButtonByText(page, "Lake Salda, Turkey")

    // 0. HTTP 400 and HTTP 404 handling
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({
        status: 400,
        body: JSON.stringify({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid bounding box submitted." },
        }),
      }),
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForText("Invalid bounding box submitted")

    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({
        status: 404,
        body: JSON.stringify({
          success: false,
          error: { code: "TARGET_NOT_FOUND", message: "Planetary target was not found." },
        }),
      }),
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForText("Planetary target was not found")

    // 1. HTTP 429 with Retry-After -> confirm no retry storm
    let calls429 = 0
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => {
        calls429 += 1
        return {
          status: 429,
          headers: { "Retry-After": "42" },
          body: JSON.stringify({
            success: false,
            error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many discovery requests." },
          }),
        }
      },
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForText("wait ~42 seconds")
    assert.strictEqual(calls429, 1, "UI must never retry automatically on HTTP 429")

    // 2. HTTP 500 sanitized error
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({
        status: 500,
        body: JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Database stack trace suppressed" } }),
      }),
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForText("The discovery request could not be completed")
    const leaked500 = await page.evaluate<boolean>(`document.body.innerText.includes("stack trace suppressed")`)
    assert.strictEqual(leaked500, false, "HTTP 500 handler must never surface raw internal error messages")

    // 3. Partial provider + Insufficient data (<40%, score: null) + Provenance matrix integrity
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({
        status: 200,
        body: JSON.stringify(buildMockDiscoveryResponse()),
      }),
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForText("76.4%")
    const scientificCheck = await page.evaluate<{
      hasInsufficientSection: boolean
      hasNotMeasuredNull: boolean
      hasPartialWarning: boolean
      hasDerivedOrigin: boolean
    }>(`(() => {
      const t = document.body.innerText.toLowerCase();
      return {
        hasInsufficientSection: t.includes('unranked — insufficient evidence') && t.includes('score: n/a (25% cov)'),
        hasNotMeasuredNull: t.includes('not measured (null)'),
        hasPartialWarning: t.includes('some scientific sources were unavailable or partial'),
        hasDerivedOrigin: t.includes('computed-derivative') && t.includes('unverified'),
      };
    })()`)
    assert.ok(scientificCheck.hasInsufficientSection, "Mocked <40% cell must render Unranked N/A cleanly")
    assert.ok(scientificCheck.hasNotMeasuredNull, "Null measurements must show Not measured (null)")
    assert.ok(scientificCheck.hasPartialWarning, "Partial provider outages must trigger disclosure banner")
    assert.ok(scientificCheck.hasDerivedOrigin, "Provenance dataOrigin & verificationState must appear")

    // 3b. Empty candidates response -> truthful empty state without stale cards
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({
        status: 200,
        body: JSON.stringify(
          buildMockDiscoveryResponse({
            candidates: [],
            computableCandidatesCount: 0,
            insufficientDataCandidatesCount: 0,
            highestValidScore: null,
          })
        ),
      }),
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForText("No candidates met the minimum 40% evidence coverage")

    // 4. Malformed JSON response -> controlled failure without crash
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({
        status: 200,
        body: "{not valid json",
      }),
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForText("Discovery server returned an unexpected response structure")

    // 5. Network failure / abort
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => "abort",
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForText("Network error while contacting /api/discover")

    // 6. Active Cancel + Double-Click Guard
    let delayedCalls = 0
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: async () => {
        delayedCalls += 1
        await new Promise((r) => setTimeout(r, 1500))
        return { status: 200, body: JSON.stringify(buildMockDiscoveryResponse()) }
      },
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await new Promise((r) => setTimeout(r, 100))
    const btnDisabled = await page.evaluate<boolean>(
      `Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Scanning'))?.disabled ?? false`
    )
    assert.strictEqual(btnDisabled, true, "Launch button must lock while scan is in-flight")
    await clickButtonByText(page, "Cancel")
    await page.waitForText("Browser wait was cancelled")
    assert.strictEqual(delayedCalls, 1)
  } finally {
    await page.close()
  }
})

test("E2E 9: Responsive viewports (1024x768, 768x1024, 375x812) & Mobile Config -> Map -> Results flow", async () => {
  // 1024x768 Tablet Landscape / Compact Desktop
  const tabletPage = await openFreshPage(1024, 768)
  try {
    await tabletPage.goto(`${BASE_URL}/discover`)
    await tabletPage.waitForText("1. Config")
    const overflow1024 = await tabletPage.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(overflow1024, false, "Unexpected horizontal overflow at 1024x768")
    await tabletPage.screenshot(`${SHOT_DIR}/tablet-scanner.png`)
  } finally {
    await tabletPage.close()
  }

  // 768x1024 Tablet Portrait
  const portraitPage = await openFreshPage(768, 1024)
  try {
    await portraitPage.goto(`${BASE_URL}/discover`)
    await portraitPage.waitForText("1. Config")
    const overflow768 = await portraitPage.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(overflow768, false, "Unexpected horizontal overflow at 768x1024")
  } finally {
    await portraitPage.close()
  }

  // 375x812 Mobile Workflow
  const mobilePage = await openFreshPage(375, 812, true)
  try {
    await mobilePage.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({
        status: 200,
        body: JSON.stringify(buildMockDiscoveryResponse()),
      }),
    })

    await mobilePage.goto(`${BASE_URL}/discover`)
    await mobilePage.waitForText("1. Config")

    const overflowMobile = await mobilePage.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(overflowMobile, false, "Unexpected horizontal overflow on 375x812 mobile viewport")

    // Switch from default mobile Map view to 1. Config tab first
    await clickButtonByText(mobilePage, "1. Config")
    await new Promise((r) => setTimeout(r, 150))
    await clickButtonByText(mobilePage, "Lake Salda, Turkey")
    // Preset auto-switches mobileSection to "map"; go back briefly for mobile-config screenshot
    await clickButtonByText(mobilePage, "1. Config")
    await new Promise((r) => setTimeout(r, 150))
    await mobilePage.screenshot(`${SHOT_DIR}/mobile-config.png`)

    // Switch to Map tab and check Leaflet container non-zero size & tiles
    await clickButtonByText(mobilePage, "2. Map")
    await new Promise((r) => setTimeout(r, 450))
    const mobileMapRect = await mobilePage.evaluate<{ w: number; h: number }>(`(() => {
      const c = document.querySelector('.leaflet-container');
      const r = c ? c.getBoundingClientRect() : { width: 0, height: 0 };
      return { w: Math.round(r.width), h: Math.round(r.height) };
    })()`)
    assert.ok(mobileMapRect.w >= 300 && mobileMapRect.h >= 340, `Expected mobile map to size cleanly after switching tab, got ${mobileMapRect.w}x${mobileMapRect.h}`)
    await mobilePage.screenshot(`${SHOT_DIR}/mobile-map.png`)

    // Go back to Config and launch mocked mobile scan -> switches to Results tab
    await clickButtonByText(mobilePage, "1. Config")
    await clickButtonByText(mobilePage, "Launch Discovery Scan")
    await mobilePage.waitForText("76.4%")
    await new Promise((r) => setTimeout(r, 250))
    await mobilePage.screenshot(`${SHOT_DIR}/mobile-results.png`)

    await mobilePage.evaluate<void>(
      `document.querySelector('section[aria-label="Selected candidate scientific detail and provenance inspector"]')?.scrollIntoView({ block: 'start' })`
    )
    await new Promise((r) => setTimeout(r, 200))
    await mobilePage.screenshot(`${SHOT_DIR}/mobile-candidate-details.png`)
  } finally {
    await mobilePage.close()
  }
})

test("E2E 10: Keyboard Tab navigation, ARIA accessibility attributes, rapid race/unmount & console error audit", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForFunction(`Boolean(document.querySelector('.leaflet-container'))`)

    // Verify real Tab focus advances across interactive controls
    await page.clickSelector('button[aria-pressed="true"]')
    const activeTags: string[] = []
    for (let i = 0; i < 6; i++) {
      await page.pressKey("Tab", "Tab", 9)
      await new Promise((r) => setTimeout(r, 40))
      const tag = await page.evaluate<string>(`document.activeElement?.tagName || ''`)
      activeTags.push(tag)
    }
    assert.ok(
      activeTags.some((t) => ["BUTTON", "SELECT", "INPUT"].includes(t)),
      `Keyboard Tab must advance focus across interactive controls, got ${activeTags.join(",")}`
    )

    // Verify rapid scan start + navigation away (/explore) leaves zero uncaught React/runtime errors
    await clickButtonByText(page, "Lake Salda, Turkey")
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: async () => {
        await new Promise((r) => setTimeout(r, 1200))
        return { status: 200, body: JSON.stringify(buildMockDiscoveryResponse()) }
      },
    })
    await clickButtonByText(page, "Launch Discovery Scan")
    await new Promise((r) => setTimeout(r, 120))
    await page.goto(`${BASE_URL}/explore`)
    await page.waitForText("Planetary")

    const appConsoleErrors = page.consoleLogs.filter(
      (l) => l.type === "error" && !l.text.includes("ERR_FAILED")
    )
    assert.strictEqual(page.pageErrors.length, 0, `Unexpected pageErrors: ${page.pageErrors.join("; ")}`)
    assert.strictEqual(
      appConsoleErrors.length,
      0,
      `Unexpected console errors: ${appConsoleErrors.map((e) => e.text).join("; ")}`
    )
  } finally {
    await page.close()
  }
})
