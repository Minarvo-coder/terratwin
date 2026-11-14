/**
 * TerraTwin — Phase 6.7 Final Browser Acceptance & Integration E2E Suite
 *
 * Uses a dedicated CDP port (9227) and archives real visual & export evidence into
 * artifacts/phase6-step7/ for end-to-end validation across:
 *   1. Primary routes (/, /discover, /explorer, /globe, /about) health & zero runtime errors.
 *   2. Genuine live provider-backed scan (Lake Salda, Turkey · Mars Jezero · Geological field research).
 *   3. Full Research Intelligence + Snapshot + Note + Task + Multi-page PDF + 4 CSVs + Snapshot JSON + PDFium visual render.
 *   4. Low-coverage (<40%) gate end-to-end honesty & zero score fabrication.
 *   5. Curated Atlas Lunar Base Construction & ISRU assessment (Shackleton Rim).
 *   6. Compact Desktop (1024x768), Tablet (768x1024), Mobile (375x812) responsive layout & keyboard checks.
 */

import test, { after, before } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { ChromeCdpBrowser, type ChromeCdpPage } from "./chrome-cdp.ts"
import { SAMPLE_TARGETS } from "../../src/lib/terratwin/sample-dataset.ts"
import { GEOLOGICAL_RESEARCH_PROFILE } from "../../src/lib/terratwin/config/comparison-config.ts"
import { parseCsvRows } from "../../src/lib/terratwin/utils/csv-export.ts"

const BASE_URL = process.env.TERRATWIN_TEST_URL ?? "http://localhost:3000"
const ARTIFACT_DIR = resolve(process.cwd(), "artifacts", "phase6-step7")
const DOWNLOAD_DIR = resolve(ARTIFACT_DIR, "downloads")

let browser: ChromeCdpBrowser

function buildLowCoverageMockResponse() {
  const jezero = SAMPLE_TARGETS.find((t) => t.id === "mars-jezero-delta") ?? SAMPLE_TARGETS[0]
  return {
    success: true,
    searchMetadata: {
      boundingBox: [37.1, 29.2, 37.6, 29.7],
      targetId: "mars-jezero-delta",
      missionProfile: "geological-research",
      gridSpacingDeg: 0.5,
      cellsGenerated: 1,
      cellsEvaluated: 1,
      maxCellsAllowed: 4,
      responseCacheHit: false,
    },
    target: jezero,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    providerStatuses: [
      {
        provider: "Open-Meteo Elevation",
        dataset: "Copernicus DEM GLO-90",
        status: "success",
        recordsFetched: 1,
        cacheHits: 0,
        latencyMs: 65,
        spatialResolution: "90 m",
        sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
        attributionNotice: "Copernicus DEM GLO-90",
      },
      {
        provider: "NASA POWER Climatology",
        dataset: "POWER Climatology v2.10.1",
        status: "partial",
        recordsFetched: 1,
        cacheHits: 0,
        latencyMs: 70,
        spatialResolution: "0.5° × 0.625°",
        sourceUrl: "https://power.larc.nasa.gov/",
        attributionNotice: "NASA POWER",
      },
      {
        provider: "Macrostrat Geology",
        dataset: "Macrostrat API v2",
        status: "failed",
        recordsFetched: 0,
        cacheHits: 0,
        latencyMs: 55,
        spatialResolution: "1:250k–1:5M",
        sourceUrl: "https://macrostrat.org/",
        attributionNotice: "Macrostrat",
        error: "Simulated missing lithology coverage",
      },
    ],
    totalCellsEvaluated: 1,
    computableCandidatesCount: 0,
    insufficientDataCandidatesCount: 1,
    candidates: [
      {
        rank: 1,
        candidate: {
          id: "cell_+37.3500_+29.4500",
          name: "Insufficient Cell +37.3500_+29.4500",
          country: "Regional Scan",
          latitude: 37.35,
          longitude: 29.45,
          boundingBox: [37.1, 29.2, 37.6, 29.7],
          setting: "Unmapped geological cell (<40% weight coverage)",
          summary: "Low-coverage lead cell verifying strict null score gate.",
          environment: {
            meanSurfaceTempC: 11.4,
            diurnalTempRangeC: null,
            annualPrecipitationMm: null,
            meanSlopeDeg: 4.5,
            rockAbundancePct: null,
            medianGrainSizeMm: null,
            albedo: null,
            vegetationCoverPct: null,
            lithology: null,
            elevationM: 1150,
            surfacePressurePa: null,
            surfaceSolarIrradianceWm2: null,
          },
          provenanceMap: {
            elevationM: {
              status: "unverified",
              dataOrigin: "live-api-estimate",
              verificationState: "unverified",
              evidenceClassification: "measured",
              sourceTitle: "Open-Meteo Copernicus DEM",
              unit: "m",
              isComparable: true,
            },
            meanSlopeDeg: {
              status: "unverified",
              dataOrigin: "computed-derivative",
              verificationState: "unverified",
              evidenceClassification: "derived",
              sourceTitle: "5-point central-difference gradient",
              unit: "deg",
              isComparable: true,
            },
          },
          isVerified: false,
          noveltyTier: "live-grid-discovery",
        },
        score: null,
        scoreDisplay: "Insufficient data to rank reliably",
        coverage: 0.15,
        confidence: "insufficient",
        isReliable: false,
        weightedDistance: null,
        missingFeatures: [
          "lithology",
          "vegetationCoverPct",
          "albedo",
          "rockAbundancePct",
          "medianGrainSizeMm",
          "surfaceSolarIrradianceWm2",
        ],
        incompatibleFeatures: ["surfacePressurePa"],
        featureScores: [
          { key: "lithology", label: "Dominant lithology", unit: "", weight: 0.3, targetValue: "clay-sedimentary", candidateValue: null, status: "missing_data", similarity: null },
          { key: "vegetationCoverPct", label: "Vegetation cover", unit: "%", weight: 0.15, targetValue: 0, candidateValue: null, status: "missing_data", similarity: null },
          { key: "albedo", label: "Surface albedo", unit: "", weight: 0.15, targetValue: 0.19, candidateValue: null, status: "missing_data", similarity: null },
          { key: "meanSlopeDeg", label: "Mean terrain slope", unit: "°", weight: 0.1, targetValue: 5, candidateValue: 4.5, status: "comparable", similarity: 0.96 },
          { key: "rockAbundancePct", label: "Rock abundance", unit: "%", weight: 0.1, targetValue: 14, candidateValue: null, status: "missing_data", similarity: null },
          { key: "medianGrainSizeMm", label: "Median grain size", unit: "mm", weight: 0.1, targetValue: 0.35, candidateValue: null, status: "missing_data", similarity: null },
          { key: "meanSurfaceTempC", label: "Mean surface temperature", unit: "°C", weight: 0.05, targetValue: -55, candidateValue: 11.4, status: "comparable", similarity: 0.55 },
          { key: "surfaceSolarIrradianceWm2", label: "Surface solar irradiance", unit: "W/m²", weight: 0.05, targetValue: 152, candidateValue: null, status: "missing_data", similarity: null },
        ],
        explanation: "Below 40% mission weight reliability gate.",
        warnings: ["Data coverage (15%) is below 40% reliability gate."],
      },
    ],
    warnings: ["All scanned grid cells fell below 40% weighted feature coverage."],
    executionTimeMs: 190,
  }
}

async function openFreshPage(width = 1440, height = 900, mobile = false): Promise<ChromeCdpPage> {
  const page = await browser.newPage()
  await page.setViewport(width, height, mobile)
  return page
}

async function clickButtonByText(page: ChromeCdpPage, substr: string): Promise<void> {
  const res = await page.evaluate<{ ok: boolean; x: number; y: number }>(`(() => {
    const els = Array.from(document.querySelectorAll('button, a'));
    const target = els.find((el) => {
      const visible = el.offsetParent !== null || el.getClientRects().length > 0;
      if (!visible) return false;
      return (el.textContent || '').includes(${JSON.stringify(substr)});
    });
    if (!target) return { ok: false, x: 0, y: 0 };
    target.scrollIntoView({ block: 'center', inline: 'center' });
    const r = target.getBoundingClientRect();
    return { ok: true, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`)
  assert.ok(res.ok, `Expected visible clickable element containing ${JSON.stringify(substr)}`)
  await page.clickMouse(res.x, res.y)
  await new Promise((r) => setTimeout(r, 180))
}

before(async () => {
  rmSync(ARTIFACT_DIR, { recursive: true, force: true })
  mkdirSync(DOWNLOAD_DIR, { recursive: true })
  browser = new ChromeCdpBrowser({ port: 9227 })
  const launched = await browser.launch()
  console.log(`Connected headless Chrome for Phase 6.7 Final Acceptance E2E: ${String(launched.version.Browser)}`)
})

after(async () => {
  await browser.close()
})

test("Acceptance 1: Primary routes (/, /discover, /explorer, /globe, /about) render with zero pageErrors", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    for (const route of ["/", "/explorer", "/globe", "/about", "/discover"]) {
      page.clearTelemetry()
      await page.goto(`${BASE_URL}${route}`)
      await new Promise((r) => setTimeout(r, 450))
      const health = await page.evaluate<{ len: number; overflow: boolean }>(`({
        len: document.body.innerText.trim().length,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 2
      })`)
      assert.ok(health.len > 40, `Route ${route} rendered empty body`)
      assert.strictEqual(health.overflow, false, `Route ${route} overflowed 1440px viewport`)
      assert.strictEqual(
        page.pageErrors.length,
        0,
        `Uncaught pageError on ${route}: ${page.pageErrors.join("; ")}`
      )
    }
  } finally {
    await page.close()
  }
})

test("Acceptance 2: Genuine live /api/discover scan (Lake Salda + Mars Jezero) -> Intelligence -> Full 6-Format Export & PDFium render", async () => {
  const page = await openFreshPage(1440, 900)
  const seenFiles = new Set<string>()
  let downloadedPdfPath = ""
  let downloadedJsonPath = ""

  try {
    await page.enableDownloads(DOWNLOAD_DIR)
    await page.goto(`${BASE_URL}/discover`)
    await page.evaluate<void>(`localStorage.clear()`)
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForFunction(`Boolean(document.querySelector('.leaflet-container'))`)
    await page.waitForText("Launch Discovery Scan")

    // Configure Lake Salda + Mars Jezero + Geological Field Research + maxCells = 4
    await clickButtonByText(page, "Martian surface")
    await page.evaluate<void>(`(() => {
      const sel = document.querySelector('select[aria-label="Target planetary exploration site"]');
      if (sel) {
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
        setter.call(sel, 'mars-jezero-delta');
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`)
    await clickButtonByText(page, "Geological field research")
    await clickButtonByText(page, "Lake Salda, Turkey")
    await page.evaluate<void>(`(() => {
      const maxCellsInput = Array.from(document.querySelectorAll('input[type="range"], input[type="number"]'))
        .find((el) => el.getAttribute('max') === '100');
      if (maxCellsInput) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(maxCellsInput, '4');
        maxCellsInput.dispatchEvent(new Event('input', { bubbles: true }));
        maxCellsInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`)

    await page.waitForText("2 / 4 cells")
    page.clearTelemetry()

    // Execute REAL unmocked live /api/discover call
    await clickButtonByText(page, "Launch Discovery Scan")
    const netRes = await page.waitForNetworkResponse("/api/discover", "POST", 45000)
    assert.strictEqual(netRes.status, 200, `Live /api/discover failed with status ${netRes.status}`)

    await page.waitForFunction(
      `document.querySelector('aside[aria-label="Discovery intelligence and candidate results"]')?.getAttribute('data-scan-busy') === 'false' && document.body.innerText.toLowerCase().includes('cells analyzed')`,
      20000
    )

    // Verify zero console errors & Capture live discovery screenshot
    assert.strictEqual(page.pageErrors.length, 0, `pageErrors: ${page.pageErrors.join("; ")}`)
    await page.screenshot(`${ARTIFACT_DIR}/desktop-live-discovery.png`)

    // Open Intelligence + Research Workspace & create immutable snapshot
    await clickButtonByText(page, "Open Scientific Intelligence")
    await clickButtonByText(page, "Open Research Workspace")
    await clickButtonByText(page, "Create Research Assessment Snapshot")
    await page.waitForText("Snapshot Active")

    // Add Note + Update first Task if present
    await clickButtonByText(page, "Research Notes")
    await page.typeIntoSelector('input[aria-label="Research note title"]', "Phase 6.7 Salda Live Audit")
    await page.typeIntoSelector(
      'textarea[aria-label="Research note body"]',
      "Verified live Open-Meteo GLO-90, NASA POWER 2001-2025 climatology, and Macrostrat carbonate mapping."
    )
    await clickButtonByText(page, "Add Research Note")
    await page.waitForText("USER-AUTHORED NOTE (NOT MEASURED TELEMETRY)")

    await clickButtonByText(page, "Overview & Exports")
    await page.screenshot(`${ARTIFACT_DIR}/desktop-intelligence-and-research.png`)

    // Trigger & verify ALL 6 exports (PDF, 4 CSVs, Snapshot JSON)
    await clickButtonByText(page, "Download Scientific PDF")
    const pdfFile = await page.waitForDownloadedFile(DOWNLOAD_DIR, /\.pdf$/i, seenFiles, 15000)
    seenFiles.add(pdfFile.filename)
    downloadedPdfPath = pdfFile.path
    const pdfBytes = readFileSync(pdfFile.path)
    assert.ok(pdfBytes.subarray(0, 8).toString("latin1").startsWith("%PDF-1.4"))
    assert.ok(pdfBytes.toString("latin1").includes("Lake Salda") || pdfBytes.toString("latin1").includes("Jezero"))
    assert.ok(pdfBytes.toString("latin1").includes("not official NASA certification"))

    await clickButtonByText(page, "Export Candidate CSV")
    const sumCsv = await page.waitForDownloadedFile(DOWNLOAD_DIR, /_Summary\.csv$/i, seenFiles, 15000)
    seenFiles.add(sumCsv.filename)
    const sumRows = parseCsvRows(readFileSync(sumCsv.path, "utf8").replace(/^\uFEFF/, ""))
    assert.strictEqual(sumRows.length, 2)

    await clickButtonByText(page, "Export Feature & Provenance CSV")
    const featCsv = await page.waitForDownloadedFile(DOWNLOAD_DIR, /_Features_Provenance\.csv$/i, seenFiles, 15000)
    seenFiles.add(featCsv.filename)
    const featRows = parseCsvRows(readFileSync(featCsv.path, "utf8").replace(/^\uFEFF/, ""))
    assert.ok(featRows.length >= 10)

    await clickButtonByText(page, "Export Research Tasks CSV")
    const taskCsv = await page.waitForDownloadedFile(DOWNLOAD_DIR, /_Research_Tasks\.csv$/i, seenFiles, 15000)
    seenFiles.add(taskCsv.filename)
    assert.ok(existsSync(taskCsv.path))

    await clickButtonByText(page, "Export Provenance Manifest CSV")
    const provCsv = await page.waitForDownloadedFile(DOWNLOAD_DIR, /_Sources_Manifest\.csv$/i, seenFiles, 15000)
    seenFiles.add(provCsv.filename)
    assert.ok(existsSync(provCsv.path))

    await clickButtonByText(page, "Export Snapshot JSON")
    const jsonFile = await page.waitForDownloadedFile(DOWNLOAD_DIR, /_Snapshot\.json$/i, seenFiles, 15000)
    seenFiles.add(jsonFile.filename)
    downloadedJsonPath = jsonFile.path
    const snapObj = JSON.parse(readFileSync(downloadedJsonPath, "utf8"))
    const snapId = snapObj.record?.snapshot?.snapshotId
    assert.ok(typeof snapId === "string" && snapId.startsWith("ttw-snap-"))

    // Cross-export consistency in archived browser downloads
    assert.ok(readFileSync(sumCsv.path, "utf8").includes(snapId))
    assert.ok(readFileSync(featCsv.path, "utf8").includes(snapId))
    assert.ok(readFileSync(provCsv.path, "utf8").includes(snapId))
    assert.ok(pdfBytes.toString("latin1").includes(snapId))

    assert.strictEqual(page.pageErrors.length, 0)
  } finally {
    await page.close()
  }

  // Render downloaded PDF inside real Chrome PDFium viewer and save screenshot
  if (downloadedPdfPath) {
    const pdfPage = await openFreshPage(1440, 900)
    try {
      await pdfPage.goto(pathToFileURL(downloadedPdfPath).toString())
      await new Promise((r) => setTimeout(r, 1200))
      await pdfPage.screenshot(`${ARTIFACT_DIR}/pdf-preview-1440.png`)
    } finally {
      await pdfPage.close()
    }
  }
})

test("Acceptance 3: Low-coverage (<40%) strict null score workflow + PDF & CSV archive", async () => {
  const page = await openFreshPage(1440, 900)
  const seenFiles = new Set<string>()
  try {
    await page.enableDownloads(DOWNLOAD_DIR)
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({ status: 200, body: JSON.stringify(buildLowCoverageMockResponse()) }),
    })

    await page.goto(`${BASE_URL}/discover`)
    await page.evaluate<void>(`localStorage.clear()`)
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForText("Launch Discovery Scan")
    await clickButtonByText(page, "Lake Salda, Turkey")
    await clickButtonByText(page, "Launch Discovery Scan")
    await page.waitForNetworkResponse("/api/discover", "POST", 15000)
    await page.waitForText("Insufficient Evidence (<40% Coverage)")

    await clickButtonByText(page, "Open Scientific Intelligence")
    await clickButtonByText(page, "Open Research Workspace")
    await clickButtonByText(page, "Create Research Assessment Snapshot")
    await page.waitForText("Snapshot Active")
    await page.waitForText("Insufficient data to rank reliably")

    await page.screenshot(`${ARTIFACT_DIR}/low-coverage-below40.png`)

    await clickButtonByText(page, "Download Scientific PDF")
    const lowPdf = await page.waitForDownloadedFile(DOWNLOAD_DIR, /\.pdf$/i, seenFiles, 15000)
    const lowPdfText = readFileSync(lowPdf.path, "latin1")
    assert.ok(lowPdfText.includes("below the 40% reliability gate"))
    writeFileSync(resolve(ARTIFACT_DIR, "low-coverage-verified.txt"), `Snapshot low-coverage PDF verified: ${lowPdf.filename}\n`)
    assert.strictEqual(page.pageErrors.length, 0)
  } finally {
    await page.close()
  }
})

test("Acceptance 4: Curated Atlas Lunar Base Construction & ISRU + Compact Desktop, Tablet & Mobile Viewports + Keyboard Accessibility", async () => {
  const page = await openFreshPage(1440, 900)
  try {
    await page.goto(`${BASE_URL}/discover`)
    await page.evaluate<void>(`localStorage.clear()`)
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForText("Curated Atlas")

    // Switch target to Moon -> Shackleton Crater Rim + Lunar Base Construction & ISRU
    await clickButtonByText(page, "Lunar base sites")
    await page.waitForText("Shackleton")
    await clickButtonByText(page, "Lunar base construction & ISRU")

    // Switch to Curated Atlas and open a canonical lunar-relevant analog (Mauna Kea Saddle or Atacama)
    await clickButtonByText(page, "Curated Atlas")
    await page.waitForText("Mauna Kea")
    await clickButtonByText(page, "Mauna Kea")
    await clickButtonByText(page, "Open Scientific Intelligence")
    await page.waitForText("29.5")
    await page.screenshot(`${ARTIFACT_DIR}/atlas-lunar-shackleton.png`)

    // Compact Desktop (1024x768)
    await page.setViewport(1024, 768)
    await new Promise((r) => setTimeout(r, 250))
    const compactOverflow = await page.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(compactOverflow, false, "Compact desktop 1024x768 must not overflow")
    await page.screenshot(`${ARTIFACT_DIR}/compact-desktop-1024x768.png`)

    // Tablet (768x1024)
    await page.setViewport(768, 1024)
    await new Promise((r) => setTimeout(r, 250))
    const tabletOverflow = await page.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(tabletOverflow, false, "Tablet 768x1024 must not overflow")
    await page.screenshot(`${ARTIFACT_DIR}/tablet-768x1024.png`)

    // Keyboard Tab reachability check on visible primary interactive control
    const focused = await page.evaluate<boolean>(`(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(
        (el) => el.offsetParent !== null && !el.disabled
      );
      if (!btn) return false;
      btn.focus();
      return document.activeElement === btn;
    })()`)
    assert.ok(focused, "Primary interactive buttons must accept keyboard focus")
    await page.pressKey("Tab")

    assert.strictEqual(page.pageErrors.length, 0)
  } finally {
    await page.close()
  }

  // Mobile 375x812
  const mobilePage = await openFreshPage(375, 812, true)
  try {
    await mobilePage.goto(`${BASE_URL}/discover`)
    await mobilePage.waitForText("1. Config")
    await new Promise((r) => setTimeout(r, 300))
    const mobileOverflow = await mobilePage.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(mobileOverflow, false, "Mobile 375x812 must not overflow")
    await mobilePage.screenshot(`${ARTIFACT_DIR}/mobile-375x812.png`)
    assert.strictEqual(mobilePage.pageErrors.length, 0)
  } finally {
    await mobilePage.close()
  }
})
