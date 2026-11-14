import test, { after, before } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { ChromeCdpBrowser, type ChromeCdpPage } from "./chrome-cdp.ts"
import { SAMPLE_TARGETS } from "../../src/lib/terratwin/sample-dataset.ts"
import { GEOLOGICAL_RESEARCH_PROFILE } from "../../src/lib/terratwin/config/comparison-config.ts"
import { parseCsvRows } from "../../src/lib/terratwin/utils/csv-export.ts"

const BASE_URL = process.env.TERRATWIN_TEST_URL ?? "http://localhost:3000"
const SHOT_DIR = resolve("artifacts/phase6-step6")
const DOWNLOAD_DIR = resolve("artifacts/phase6-step6/downloads")

let browser: ChromeCdpBrowser

function buildMockDiscoveryPayload() {
  const jezero = SAMPLE_TARGETS.find((t) => t.id === "mars-jezero-delta") ?? SAMPLE_TARGETS[0]
  return {
    success: true,
    searchMetadata: {
      boundingBox: [37.1, 29.2, 38.0, 30.2],
      targetId: "mars-jezero-delta",
      missionProfile: "Geological field research",
      gridSpacingDeg: 0.5,
      cellsGenerated: 3,
      cellsEvaluated: 3,
      maxCellsAllowed: 16,
      responseCacheHit: false,
      scientificMethodology: {
        slopeMethod: "5-point central-difference gradient",
        slopeStencilDeltaDeg: 0.002,
        polarExclusionLatDeg: 89.5,
        nasaPowerPeriod: "2001-2025 Climatology (v2.10.1)",
        temperatureProxyNote: "NASA POWER T2M is 2m air temperature proxy.",
        lithologyClassifierPolicy: "Ambiguous mixed units remain null.",
      },
    },
    target: jezero,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    providerStatuses: [
      {
        provider: "Open-Meteo Elevation",
        dataset: "Copernicus DEM GLO-90",
        status: "success",
        recordsFetched: 3,
        cacheHits: 0,
        latencyMs: 110,
        spatialResolution: "90 m",
        sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
        attributionNotice: "Copernicus DEM GLO-90",
      },
      {
        provider: "NASA POWER Climatology",
        dataset: "POWER Climatology v2.10.1",
        status: "success",
        recordsFetched: 3,
        cacheHits: 0,
        latencyMs: 140,
        spatialResolution: "0.5° × 0.625°",
        sourceUrl: "https://power.larc.nasa.gov/",
        attributionNotice: "NASA LaRC POWER",
      },
      {
        provider: "Macrostrat Geology",
        dataset: "Macrostrat API v2",
        status: "success",
        recordsFetched: 3,
        cacheHits: 0,
        latencyMs: 95,
        spatialResolution: "1:250k–1:5M",
        sourceUrl: "https://macrostrat.org/",
        attributionNotice: "Macrostrat (CC BY 4.0)",
      },
    ],
    totalCellsEvaluated: 3,
    computableCandidatesCount: 2,
    insufficientDataCandidatesCount: 1,
    candidates: [
      {
        rank: 1,
        candidate: {
          id: "cell_+37.3500_+29.4500",
          name: "Candidate Cell +37.3500_+29.4500",
          country: "Regional Scan",
          latitude: 37.35,
          longitude: 29.45,
          boundingBox: [37.1, 29.2, 37.6, 29.7],
          setting: "Regional geology: Carbonate lacustrine",
          summary: "Exploratory screening cell at Lake Salda margin.",
          environment: {
            meanSurfaceTempC: -55,
            diurnalTempRangeC: 60,
            annualPrecipitationMm: 0,
            meanSlopeDeg: 4.5,
            rockAbundancePct: null,
            medianGrainSizeMm: null,
            albedo: null,
            vegetationCoverPct: null,
            lithology: "clay-sedimentary",
            elevationM: 1150,
            surfacePressurePa: null,
            surfaceSolarIrradianceWm2: 195,
          },
          provenanceMap: {
            elevationM: {
              status: "verified",
              dataOrigin: "live-api-estimate",
              verificationState: "unverified",
              evidenceClassification: "measured",
              sourceTitle: "Copernicus DEM GLO-90 (Open-Meteo)",
              sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
              datasetVersion: "GLO-90",
              unit: "m",
              spatialResolution: "90 m",
              isComparable: true,
            },
            meanSlopeDeg: {
              status: "unverified",
              dataOrigin: "computed-derivative",
              verificationState: "unverified",
              evidenceClassification: "derived",
              sourceTitle: "5-point DEM slope gradient (~445 m)",
              unit: "deg",
              spatialResolution: "~445 m stencil",
              isComparable: true,
            },
            meanSurfaceTempC: {
              status: "unverified",
              dataOrigin: "live-api-estimate",
              verificationState: "unverified",
              evidenceClassification: "proxy",
              sourceTitle: "NASA POWER T2M 2m proxy",
              datasetVersion: "v2.10.1",
              measurementPeriod: "2001-2025",
              unit: "°C",
              spatialResolution: "0.5° × 0.625°",
              isComparable: true,
            },
            lithology: {
              status: "unverified",
              dataOrigin: "live-api-estimate",
              verificationState: "unverified",
              evidenceClassification: "proxy",
              sourceTitle: "Macrostrat map unit polygon",
              unit: "categorical",
              spatialResolution: "1:250k–1:5M",
              isComparable: true,
            },
          },
          isVerified: false,
          noveltyTier: "live-grid-discovery",
        },
        score: 92.4,
        scoreDisplay: "92.4% (Exploratory)",
        coverage: 0.5,
        confidence: "moderate",
        isReliable: true,
        weightedDistance: 0.08,
        missingFeatures: ["albedo", "vegetationCoverPct", "rockAbundancePct", "medianGrainSizeMm"],
        incompatibleFeatures: ["surfacePressurePa"],
        featureScores: [
          { key: "lithology", label: "Dominant lithology", unit: "", weight: 0.3, targetValue: "clay-sedimentary", candidateValue: "clay-sedimentary", status: "comparable", similarity: 1 },
          { key: "vegetationCoverPct", label: "Vegetation cover", unit: "%", weight: 0.15, targetValue: 0, candidateValue: null, status: "missing_data", similarity: null },
          { key: "albedo", label: "Surface albedo", unit: "", weight: 0.15, targetValue: 0.19, candidateValue: null, status: "missing_data", similarity: null },
          { key: "meanSlopeDeg", label: "Mean terrain slope", unit: "°", weight: 0.1, targetValue: 5, candidateValue: 4.5, status: "comparable", similarity: 0.96 },
          { key: "rockAbundancePct", label: "Rock abundance", unit: "%", weight: 0.1, targetValue: 14, candidateValue: null, status: "missing_data", similarity: null },
          { key: "medianGrainSizeMm", label: "Median grain size", unit: "mm", weight: 0.1, targetValue: 0.35, candidateValue: null, status: "missing_data", similarity: null },
          { key: "meanSurfaceTempC", label: "Mean surface temperature", unit: "°C", weight: 0.05, targetValue: -55, candidateValue: -55, status: "comparable", similarity: 1 },
          { key: "surfaceSolarIrradianceWm2", label: "Surface solar irradiance", unit: "W/m²", weight: 0.05, targetValue: 152, candidateValue: 195, status: "comparable", similarity: 0.8 },
          { key: "elevationM", label: "Surface elevation", unit: "m", weight: 0, targetValue: -2651, candidateValue: 1150, status: "comparable", similarity: 0.55 },
          { key: "diurnalTempRangeC", label: "Diurnal temperature range", unit: "°C", weight: 0, targetValue: 80, candidateValue: 60, status: "comparable", similarity: 0.72 },
          { key: "surfacePressurePa", label: "Surface atmospheric pressure", unit: "Pa", weight: 0, targetValue: 750, candidateValue: null, status: "incompatible_units", similarity: null },
        ],
        explanation: "Evaluated 4 weighted comparable features (50% coverage).",
        warnings: [],
      },
      {
        rank: 2,
        candidate: {
          id: "cell_+37.3500_+29.9500",
          name: "Candidate Cell +37.3500_+29.9500",
          country: "Regional Scan",
          latitude: 37.35,
          longitude: 29.95,
          boundingBox: [37.1, 29.7, 37.6, 30.2],
          setting: "Regional basaltic bench",
          summary: "Second reliable cell.",
          environment: {
            meanSurfaceTempC: 11,
            diurnalTempRangeC: 10,
            annualPrecipitationMm: 450,
            meanSlopeDeg: 8.5,
            lithology: "basalt",
            elevationM: 1200,
            surfaceSolarIrradianceWm2: 205,
          },
          isVerified: false,
          noveltyTier: "live-grid-discovery",
        },
        score: 68.2,
        scoreDisplay: "68.2% (Exploratory)",
        coverage: 0.5,
        confidence: "moderate",
        isReliable: true,
        weightedDistance: 0.32,
        missingFeatures: ["albedo", "vegetationCoverPct", "rockAbundancePct", "medianGrainSizeMm"],
        incompatibleFeatures: ["surfacePressurePa"],
        featureScores: [
          { key: "lithology", label: "Dominant lithology", unit: "", weight: 0.3, targetValue: "clay-sedimentary", candidateValue: "basalt", status: "comparable", similarity: 0.58 },
          { key: "meanSlopeDeg", label: "Mean terrain slope", unit: "°", weight: 0.1, targetValue: 5, candidateValue: 8.5, status: "comparable", similarity: 0.85 },
          { key: "meanSurfaceTempC", label: "Mean surface temperature", unit: "°C", weight: 0.05, targetValue: -55, candidateValue: 11, status: "comparable", similarity: 0.5 },
          { key: "surfaceSolarIrradianceWm2", label: "Surface solar irradiance", unit: "W/m²", weight: 0.05, targetValue: 152, candidateValue: 205, status: "comparable", similarity: 0.78 },
        ],
        explanation: "Evaluated 4 comparable features.",
        warnings: [],
      },
      {
        rank: 3,
        candidate: {
          id: "cell_+37.8500_+29.4500",
          name: "Candidate Cell +37.8500_+29.4500",
          country: "Regional Scan",
          latitude: 37.85,
          longitude: 29.45,
          boundingBox: [37.6, 29.2, 38.1, 29.7],
          setting: "Unmapped mountain cell",
          summary: "Insufficient coverage cell.",
          environment: {
            meanSurfaceTempC: 10,
            meanSlopeDeg: 18,
            lithology: null,
            elevationM: 1680,
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
        missingFeatures: ["lithology", "albedo", "vegetationCoverPct", "rockAbundancePct", "medianGrainSizeMm"],
        incompatibleFeatures: ["surfacePressurePa"],
        featureScores: [
          { key: "lithology", label: "Dominant lithology", unit: "", weight: 0.3, targetValue: "clay-sedimentary", candidateValue: null, status: "missing_data", similarity: null },
          { key: "meanSlopeDeg", label: "Mean terrain slope", unit: "°", weight: 0.1, targetValue: 5, candidateValue: 18, status: "comparable", similarity: 0.6 },
          { key: "meanSurfaceTempC", label: "Mean surface temperature", unit: "°C", weight: 0.05, targetValue: -55, candidateValue: 10, status: "comparable", similarity: 0.51 },
        ],
        explanation: "Below 40% coverage gate.",
        warnings: ["Data coverage is below 40% reliability gate."],
      },
    ],
    warnings: [],
    executionTimeMs: 320,
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
  rmSync(DOWNLOAD_DIR, { recursive: true, force: true })
  mkdirSync(DOWNLOAD_DIR, { recursive: true })
  browser = new ChromeCdpBrowser({ port: 9226 })
  const launched = await browser.launch()
  console.log(`Connected headless Chrome for Phase 6.6 E2E: ${String(launched.version.Browser)}`)
})

after(async () => {
  await browser.close()
})

test("Research E2E 1: Full assessment lifecycle, follow-up tasks, notes, real PDF & CSV downloads, PDF render & isolation", async () => {
  const page = await openFreshPage(1440, 900)
  const seenFiles = new Set<string>()
  let pdfPath = ""

  try {
    await page.enableDownloads(DOWNLOAD_DIR)
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({ status: 200, body: JSON.stringify(buildMockDiscoveryPayload()) }),
    })

    await page.goto(`${BASE_URL}/discover`)
    await page.evaluate<void>(`localStorage.clear()`)
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForText("Launch Discovery Scan")
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
    await clickButtonByText(page, "Launch Discovery Scan")

    await page.waitForNetworkResponse("/api/discover", "POST", 15000)
    await page.waitForText("Exploratory Cell #1")

    // Open Intelligence + Research Workspace
    await clickButtonByText(page, "Open Scientific Intelligence")
    await clickButtonByText(page, "Open Research Workspace")
    await clickButtonByText(page, "Create Research Assessment Snapshot")

    await page.waitForText("Snapshot Active")
    const snapText = await page.evaluate<string>(
      `document.querySelector('[data-research-candidate-id]')?.innerText || ''`
    )
    assert.ok(snapText.includes("ttw-snap-"), "Snapshot ID must render")
    assert.ok(snapText.includes("fnv64-"), "Content integrity digest must render")
    assert.ok(snapText.includes("Unverified Screening Lead"), "Live candidate must stay unverified")

    // Manage Follow-Up Tasks (close 1st task without promoting candidate verification)
    await clickButtonByText(page, "Follow-Up Tasks")
    await page.waitForText("Workflow statuses are operational tracking only")
    await page.evaluate<void>(`(() => {
      const firstSelect = document.querySelector('[data-task-id] select');
      if (firstSelect) {
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
        setter.call(firstSelect, 'closed');
        firstSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`)
    await page.typeIntoSelector('[data-task-id] input[placeholder="Owner / investigator"]', "Dr. Salda Team")
    await clickButtonByText(page, "Save Note")
    await new Promise((r) => setTimeout(r, 150))
    await page.screenshot(`${SHOT_DIR}/desktop-research-tasks.png`)

    // Add a User Research Note with valid URL (distinguished from measured telemetry)
    await clickButtonByText(page, "Research Notes")
    await page.typeIntoSelector('input[aria-label="Research note title"]', "Salda Carbonate Field Check")
    await page.typeIntoSelector(
      'textarea[aria-label="Research note body"]',
      "Verify surface magnesium carbonate grain distribution at 37.35°N; mean air proxy -55°C target check."
    )
    await page.typeIntoSelector(
      'input[aria-label="Optional external reference URL"]',
      "https://example.org/salda-carbonate-study"
    )
    await clickButtonByText(page, "Add Research Note")
    await page.waitForText("USER-AUTHORED NOTE (NOT MEASURED TELEMETRY)")

    // Return to Overview & Exports and trigger real PDF + 3 CSV downloads
    await clickButtonByText(page, "Overview & Exports")
    await page.waitForFunction(`Boolean(/1\\/\\d+\\s+Tasks Closed/i.test(document.body.innerText))`)
    await page.screenshot(`${SHOT_DIR}/desktop-research-workspace.png`)

    await clickButtonByText(page, "Download Scientific PDF")
    const pdfDownload = await page.waitForDownloadedFile(DOWNLOAD_DIR, /\.pdf$/i, seenFiles, 15000)
    seenFiles.add(pdfDownload.filename)
    pdfPath = pdfDownload.path
    const pdfRaw = readFileSync(pdfPath, "latin1")
    assert.ok(pdfRaw.startsWith("%PDF-1.4"), "Downloaded PDF must start with %PDF-1.4 header")
    assert.ok(pdfRaw.includes("%%EOF"), "Downloaded PDF must end with %%EOF")
    assert.ok(/\/Count\s+[2-9]/.test(pdfRaw), "Downloaded PDF must contain multiple pages")
    assert.ok(pdfRaw.includes("cell_+37.3500_+29.4500"), "PDF must reference exact selected candidate")
    assert.ok(pdfRaw.includes("Salda Carbonate Field Check"), "PDF must contain user note clearly separated")

    // Export Candidate CSV
    await clickButtonByText(page, "Export Candidate CSV")
    const summaryCsvFile = await page.waitForDownloadedFile(DOWNLOAD_DIR, /_Summary\.csv$/i, seenFiles, 15000)
    seenFiles.add(summaryCsvFile.filename)
    const summaryRows = parseCsvRows(readFileSync(summaryCsvFile.path, "utf8"))
    const sh = summaryRows[0]
    assert.strictEqual(summaryRows.length, 2)
    assert.strictEqual(summaryRows[1][sh.indexOf("candidate_id")], "cell_+37.3500_+29.4500")
    assert.strictEqual(summaryRows[1][sh.indexOf("verification_status")], "unverified")
    assert.strictEqual(summaryRows[1][sh.indexOf("tasks_closed")], "1")

    // Export Feature & Provenance CSV (verify negative -55, zero 0, missing "" for albedo)
    await clickButtonByText(page, "Export Feature & Provenance CSV")
    const featCsvFile = await page.waitForDownloadedFile(DOWNLOAD_DIR, /_Features_Provenance\.csv$/i, seenFiles, 15000)
    seenFiles.add(featCsvFile.filename)
    const featRows = parseCsvRows(readFileSync(featCsvFile.path, "utf8"))
    const fh = featRows[0]
    const tempRow = featRows.find((r) => r[fh.indexOf("feature_key")] === "meanSurfaceTempC")
    const precipRow = featRows.find((r) => r[fh.indexOf("feature_key")] === "annualPrecipitationMm")
    const albedoRow = featRows.find((r) => r[fh.indexOf("feature_key")] === "albedo")
    assert.strictEqual(tempRow?.[fh.indexOf("earth_value")], "-55")
    assert.strictEqual(precipRow?.[fh.indexOf("earth_value")], "0")
    assert.strictEqual(albedoRow?.[fh.indexOf("earth_value")], "")
    assert.strictEqual(albedoRow?.[fh.indexOf("comparability_status")], "missing_data")

    // Export Research Tasks CSV (verify status "closed" + observation_status "recommended-not-completed")
    await clickButtonByText(page, "Export Research Tasks CSV")
    const taskCsvFile = await page.waitForDownloadedFile(DOWNLOAD_DIR, /_Research_Tasks\.csv$/i, seenFiles, 15000)
    seenFiles.add(taskCsvFile.filename)
    const taskRows = parseCsvRows(readFileSync(taskCsvFile.path, "utf8"))
    const th = taskRows[0]
    const closedTaskRow = taskRows.find((r) => r[th.indexOf("workflow_status")] === "closed")
    assert.ok(closedTaskRow, "Tasks CSV must contain updated closed workflow task")
    assert.strictEqual(closedTaskRow[th.indexOf("observation_status")], "recommended-not-completed")
    assert.strictEqual(closedTaskRow[th.indexOf("owner")], "Dr. Salda Team")

    // Switch to insufficient-evidence Cell #3 (<40%) -> confirm zero stale leakage & honest PDF
    await clickButtonByText(page, "Cell #3")
    await page.waitForText("No Snapshot Saved Yet")
    await clickButtonByText(page, "Create Research Assessment Snapshot")
    await page.waitForText("Insufficient data to rank reliably")
    await clickButtonByText(page, "Download Scientific PDF")
    const lowPdfFile = await page.waitForDownloadedFile(DOWNLOAD_DIR, /\.pdf$/i, seenFiles, 15000)
    seenFiles.add(lowPdfFile.filename)
    const lowPdfRaw = readFileSync(lowPdfFile.path, "latin1")
    assert.ok(lowPdfRaw.includes("below the 40% reliability gate"), "Insufficient cell PDF must disclose 40% gate")

    assert.strictEqual(page.pageErrors.length, 0, `Unexpected pageErrors: ${page.pageErrors.join("; ")}`)
  } finally {
    await page.close()
  }

  // Visually open downloaded multi-page PDF inside Chrome PDFium and capture Page 1 screenshot
  if (pdfPath) {
    const pdfViewerPage = await openFreshPage(1440, 900)
    try {
      await pdfViewerPage.goto(pathToFileURL(pdfPath).toString())
      await new Promise((r) => setTimeout(r, 1200))
      await pdfViewerPage.screenshot(`${SHOT_DIR}/pdf-rendered-preview.png`)
    } finally {
      await pdfViewerPage.close()
    }
  }
})

test("Research E2E 2: Curated Atlas revisions, tablet (768x1024), mobile (375x812) & keyboard navigation", async () => {
  // Desktop Curated Atlas + revision history + keyboard navigation
  const atlasPage = await openFreshPage(1440, 900)
  try {
    await atlasPage.goto(`${BASE_URL}/discover`)
    await atlasPage.evaluate<void>(`localStorage.clear()`)
    await atlasPage.goto(`${BASE_URL}/discover`)
    await atlasPage.waitForText("Curated Atlas")
    await clickButtonByText(atlasPage, "Curated Atlas")
    await atlasPage.waitForText("Atacama Desert — Yungay Basin")
    await clickButtonByText(atlasPage, "Atacama Desert — Yungay Basin")

    await clickButtonByText(atlasPage, "Open Research Workspace")
    await clickButtonByText(atlasPage, "Create Research Assessment Snapshot")
    await atlasPage.waitForText("Assessment A")
    await clickButtonByText(atlasPage, "Capture New Revision Snapshot")
    await atlasPage.waitForText("Assessment B")
    await clickButtonByText(atlasPage, "Sources & History")
    await atlasPage.waitForText("Assessment Snapshot History")
    await atlasPage.screenshot(`${SHOT_DIR}/desktop-research-atlas.png`)

    // Keyboard Tab navigation across research tabs
    const focusedTab = await atlasPage.evaluate<boolean>(`(() => {
      const btn = Array.from(document.querySelectorAll('[aria-label="Research workspace sections"] [role="tab"]'))[0];
      if (!btn) return false;
      btn.focus();
      return document.activeElement === btn;
    })()`)
    assert.ok(focusedTab, "Research workspace tabs must support keyboard focus")
    await atlasPage.pressKey("Tab")

    // Tablet 768x1024 zero overflow check
    await atlasPage.setViewport(768, 1024)
    await new Promise((r) => setTimeout(r, 250))
    const tabletOverflow = await atlasPage.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(tabletOverflow, false, "Tablet 768x1024 must not overflow horizontally")
    assert.strictEqual(atlasPage.pageErrors.length, 0)
  } finally {
    await atlasPage.close()
  }

  // Mobile 375x812 Research Workspace workflow
  const mobilePage = await openFreshPage(375, 812, true)
  try {
    await mobilePage.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({ status: 200, body: JSON.stringify(buildMockDiscoveryPayload()) }),
    })
    await mobilePage.goto(`${BASE_URL}/discover`)
    await mobilePage.evaluate<void>(`localStorage.clear()`)
    await mobilePage.goto(`${BASE_URL}/discover`)
    await mobilePage.waitForText("1. Config")
    await clickButtonByText(mobilePage, "1. Config")
    await clickButtonByText(mobilePage, "Martian surface")
    await clickButtonByText(mobilePage, "Lake Salda, Turkey")
    await clickButtonByText(mobilePage, "1. Config")
    await clickButtonByText(mobilePage, "Launch Discovery Scan")

    await mobilePage.waitForNetworkResponse("/api/discover", "POST", 15000)
    await mobilePage.waitForText("Exploratory Cell #1")
    // Allow mobile smooth scroll-to-top to settle before interacting with bottom Research Workspace toggle
    await new Promise((r) => setTimeout(r, 550))
    await clickButtonByText(mobilePage, "Open Research Workspace")
    await mobilePage.waitForText("Initialize Traceable Research Assessment")
    await clickButtonByText(mobilePage, "Create Research Assessment Snapshot")
    await mobilePage.waitForText("Download Scientific PDF")

    const mobileOverflow = await mobilePage.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(mobileOverflow, false, "Mobile 375x812 Research Workspace must not overflow horizontally")
    await mobilePage.screenshot(`${SHOT_DIR}/mobile-research-workspace.png`)
    assert.strictEqual(mobilePage.pageErrors.length, 0)
  } finally {
    await mobilePage.close()
  }
})
