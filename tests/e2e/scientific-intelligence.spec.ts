import test, { after, before } from "node:test"
import assert from "node:assert"
import { resolve } from "node:path"
import { ChromeCdpBrowser, type ChromeCdpPage } from "./chrome-cdp.ts"
import { GEOLOGICAL_RESEARCH_PROFILE } from "../../src/lib/terratwin/config/comparison-config.ts"
import { computeAnalogSimilarity } from "../../src/lib/terratwin/similarity-engine.ts"
import { SAMPLE_TARGETS } from "../../src/lib/terratwin/sample-dataset.ts"
import type { EarthCandidate, FeatureProvenanceMap } from "../../src/lib/terratwin/types.ts"

const BASE_URL = process.env.TERRATWIN_E2E_URL ?? "http://localhost:3000"
const SHOT_DIR = resolve(process.cwd(), "artifacts", "phase6-step5")

let browser: ChromeCdpBrowser

function buildMockIntelligenceScanResponse() {
  const target =
    SAMPLE_TARGETS.find((t) => t.id === "mars-jezero-delta") ?? SAMPLE_TARGETS[0]
  const profile = GEOLOGICAL_RESEARCH_PROFILE

  const buildCand = (
    id: string,
    lat: number,
    lon: number,
    env: EarthCandidate["environment"]
  ) => {
    const prov: FeatureProvenanceMap = {
      elevationM: {
        status: env.elevationM != null ? "unverified" : "no-data",
        dataOrigin: env.elevationM != null ? "live-api-estimate" : "missing",
        evidenceClassification: env.elevationM != null ? "measured" : "missing_data",
        verificationState: env.elevationM != null ? "unverified" : "no-data",
        sourceTitle: "Copernicus DEM GLO-90 (Open-Meteo)",
        sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
        spatialResolution: "90 m grid cell",
        unit: "m",
        isComparable: true,
      },
      meanSlopeDeg: {
        status: env.meanSlopeDeg != null ? "unverified" : "no-data",
        dataOrigin: env.meanSlopeDeg != null ? "computed-derivative" : "missing",
        evidenceClassification: env.meanSlopeDeg != null ? "derived" : "missing_data",
        verificationState: env.meanSlopeDeg != null ? "unverified" : "no-data",
        sourceTitle: "5-Point Central-Difference Gradient",
        sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
        spatialResolution: "~445 m baseline",
        unit: "°",
        isComparable: true,
      },
      meanSurfaceTempC: {
        status: env.meanSurfaceTempC != null ? "unverified" : "no-data",
        dataOrigin: env.meanSurfaceTempC != null ? "live-api-estimate" : "missing",
        evidenceClassification: env.meanSurfaceTempC != null ? "proxy" : "missing_data",
        verificationState: env.meanSurfaceTempC != null ? "unverified" : "no-data",
        sourceTitle: "NASA POWER T2M 2-meter air temp proxy",
        sourceUrl: "https://power.larc.nasa.gov/",
        spatialResolution: "0.5° × 0.625°",
        measurementPeriod: "2001-2025",
        unit: "°C",
        isComparable: true,
      },
      surfaceSolarIrradianceWm2: {
        status: env.surfaceSolarIrradianceWm2 != null ? "unverified" : "no-data",
        dataOrigin: env.surfaceSolarIrradianceWm2 != null ? "computed-derivative" : "missing",
        evidenceClassification: env.surfaceSolarIrradianceWm2 != null ? "derived" : "missing_data",
        verificationState: env.surfaceSolarIrradianceWm2 != null ? "unverified" : "no-data",
        sourceTitle: "NASA POWER ALLSKY_SFC_SW_DWN",
        spatialResolution: "1.0° × 1.0°",
        measurementPeriod: "2001-2025",
        unit: "W/m²",
        isComparable: true,
      },
      lithology: {
        status: env.lithology != null ? "unverified" : "no-data",
        dataOrigin: env.lithology != null ? "live-api-estimate" : "missing",
        evidenceClassification: env.lithology != null ? "proxy" : "missing_data",
        verificationState: env.lithology != null ? "unverified" : "no-data",
        sourceTitle: "Macrostrat Regional Geology",
        sourceUrl: "https://macrostrat.org/api/v2/mobile/map_query_v2",
        spatialResolution: "1:250k-1:5M",
        unit: "",
        isComparable: true,
      },
      annualPrecipitationMm: {
        status: "unverified",
        dataOrigin: "computed-derivative",
        evidenceClassification: "derived",
        verificationState: "unverified",
        sourceTitle: "NASA POWER PRECTOTCORR",
        unit: "mm/yr",
        isComparable: false,
        incomparabilityReason: "Active rainfall absent on Mars",
      },
    }

    const candidate: EarthCandidate = {
      id,
      name: `Exploratory Cell ${id}`,
      country: "Regional Scan",
      latitude: lat,
      longitude: lon,
      boundingBox: [lat - 0.25, lon - 0.25, lat + 0.25, lon + 0.25],
      setting: env.lithology ? "Regional geology: Lacustrine Sediments" : "Unmapped regional polygon",
      summary: "Deterministic E2E mocked live scan fixture",
      environment: env,
      provenanceMap: prov,
      isVerified: false,
      noveltyTier: "live-grid-discovery",
    }
    return candidate
  }

  const cand1 = buildCand("cell_+37.3500_+29.4500", 37.35, 29.45, {
    elevationM: 1180,
    meanSlopeDeg: 4.1,
    meanSurfaceTempC: 11.5,
    diurnalTempRangeC: 18.2,
    surfaceSolarIrradianceWm2: 205,
    annualPrecipitationMm: 620,
    lithology: "clay-sedimentary",
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    albedo: null,
    vegetationCoverPct: null,
    surfacePressurePa: null,
  })
  const cand2 = buildCand("cell_+37.3500_+29.9500", 37.35, 29.95, {
    elevationM: 1410,
    meanSlopeDeg: 22.0,
    meanSurfaceTempC: -5.0,
    diurnalTempRangeC: 25.0,
    surfaceSolarIrradianceWm2: 195,
    annualPrecipitationMm: 500,
    lithology: "basaltic",
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    albedo: null,
    vegetationCoverPct: null,
    surfacePressurePa: null,
  })
  const candLow = buildCand("cell_+37.8500_+29.4500", 37.85, 29.45, {
    elevationM: 980,
    meanSlopeDeg: null,
    meanSurfaceTempC: 10.0,
    diurnalTempRangeC: null,
    surfaceSolarIrradianceWm2: null,
    annualPrecipitationMm: 450,
    lithology: null,
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    albedo: null,
    vegetationCoverPct: null,
    surfacePressurePa: null,
  })

  const scored = [cand1, cand2, candLow].map((c, idx) => {
    const s = computeAnalogSimilarity(target, c, profile)
    return {
      rank: idx + 1,
      candidate: c,
      score: s.score,
      scoreDisplay: s.scoreDisplay,
      coverage: s.coverage,
      confidence: s.confidence,
      isReliable: s.isReliable,
      weightedDistance: s.weightedDistance,
      missingFeatures: s.missingFeatures,
      incompatibleFeatures: s.incompatibleFeatures,
      featureScores: s.featureScores,
      explanation: `Evaluated ${s.validFeaturesCount} comparable features (Mocked E2E fixture).`,
      warnings: s.isReliable ? [] : ["Coverage below 40% threshold."],
    }
  })

  return {
    success: true,
    searchMetadata: {
      boundingBox: [37.1, 29.2, 38.0, 30.2],
      targetId: target.id,
      missionProfile: profile.id,
      gridSpacingDeg: 0.5,
      cellsGenerated: 3,
      cellsEvaluated: 3,
      maxCellsAllowed: 16,
      responseCacheHit: false,
    },
    target,
    missionProfile: {
      id: profile.id,
      label: profile.label,
      summary: profile.summary,
      statusNotice: profile.statusNotice,
      weights: profile.weights,
    },
    providerStatuses: [
      {
        provider: "Open-Meteo Elevation",
        dataset: "Copernicus DEM GLO-90",
        status: "success",
        recordsFetched: 3,
        latencyMs: 14,
        spatialResolution: "90 m",
        attributionNotice: "Open-Meteo",
      },
      {
        provider: "NASA POWER Climatology",
        dataset: "POWER Climatology v2.10.1",
        status: "success",
        recordsFetched: 3,
        latencyMs: 21,
        spatialResolution: "0.5° × 0.625°",
        temporalCoverage: "2001-2025",
        attributionNotice: "NASA POWER",
      },
      {
        provider: "Macrostrat Geology",
        dataset: "Macrostrat API v2",
        status: "partial",
        recordsFetched: 2,
        latencyMs: 18,
        spatialResolution: "Regional polygon",
        attributionNotice: "Macrostrat",
      },
    ],
    totalCellsEvaluated: 3,
    computableCandidatesCount: 2,
    insufficientDataCandidatesCount: 1,
    warnings: ["Mocked deterministic response for Phase 6.5 Scientific Intelligence E2E verification."],
    executionTimeMs: 32,
    candidates: scored,
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
  browser = new ChromeCdpBrowser({ port: 9225 })
  const launched = await browser.launch()
  console.log(`Connected headless Chrome for Phase 6.5 E2E: ${String(launched.version.Browser)}`)
})

after(async () => {
  await browser.close()
})

test("Intel E2E 1: Full desktop Scientific Intelligence workflow, tabs, sensitivity, candidate switch & context invalidation", async () => {
  const page = await openFreshPage(1440, 900)
  const mockResp = buildMockIntelligenceScanResponse()
  try {
    await page.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({ status: 200, body: JSON.stringify(mockResp) }),
    })

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
    await page.waitForText("Exploratory Cell #1")

    // Open Scientific Intelligence drawer
    await clickButtonByText(page, "Open Scientific Intelligence")
    await page.waitForFunction(`document.body.innerText.toLowerCase().includes('evidence quality assessment')`)

    const tab1Audit = await page.evaluate<{
      hasDisclaimer: boolean
      hasMatchBars: boolean
      hasFeatureExplanations: boolean
      hasThresholdDisclosure: boolean
      hasNoConfidencePct: boolean
      hasNoContextBannerYet: boolean
      intelId: string | null
    }>(`(() => {
      const t = document.body.innerText;
      const tl = t.toLowerCase();
      const el = document.querySelector('[data-candidate-intel-id]');
      return {
        hasDisclaimer: tl.includes('results require independent validation before field or mission use'),
        hasMatchBars: tl.includes('dimensionless feature match profile'),
        hasFeatureExplanations: tl.includes('why this candidate matches'),
        hasThresholdDisclosure: tl.includes('interpretive presentation helpers'),
        hasNoConfidencePct: !/confidence\\s+\\d+%/i.test(t),
        hasNoContextBannerYet: !tl.includes('context changed'),
        intelId: el ? el.getAttribute('data-candidate-intel-id') : null,
      };
    })()`)

    assert.ok(tab1Audit.hasDisclaimer, "Disclaimer must be visible")
    assert.ok(tab1Audit.hasMatchBars, "Dimensionless similarity bars must render")
    assert.ok(tab1Audit.hasFeatureExplanations, "Feature-by-feature explanations must render")
    assert.ok(tab1Audit.hasThresholdDisclosure, "Presentation threshold notice must render")
    assert.ok(tab1Audit.hasNoConfidencePct, "Must never fabricate a confidence percentage")
    assert.ok(tab1Audit.hasNoContextBannerYet, "Must not display Context Changed when scan matches selected context")
    assert.strictEqual(tab1Audit.intelId, "cell_+37.3500_+29.4500")
    await page.screenshot(`${SHOT_DIR}/desktop-intel-explainability.png`)

    // Tab 2: Mismatches & Checklist
    await clickButtonByText(page, "Mismatches & Checklist")
    await page.waitForFunction(`document.body.innerText.toLowerCase().includes('candidate validation checklist')`)
    const tab2Audit = await page.evaluate<{
      hasContextualLimit: boolean
      hasUnknownDistinct: boolean
      hasWorkflowNotice: boolean
    }>(`(() => {
      const t = document.body.innerText.toLowerCase();
      return {
        hasContextualLimit: t.includes('known contextual limitation'),
        hasUnknownDistinct: t.includes('unknown') && t.includes('supported'),
        hasWorkflowNotice: t.includes('not nasa certification') || t.includes('not an official nasa endorsement'),
      };
    })()`)
    assert.ok(tab2Audit.hasContextualLimit)
    assert.ok(tab2Audit.hasUnknownDistinct)
    assert.ok(tab2Audit.hasWorkflowNotice)
    await page.screenshot(`${SHOT_DIR}/desktop-intel-checklist.png`)

    // Tab 3: Research Priority & Follow-Up
    await clickButtonByText(page, "Priority & Follow-Up")
    await page.waitForFunction(`document.body.innerText.toLowerCase().includes('research priority assessment')`)
    const tab3Audit = await page.evaluate<boolean>(
      `document.body.innerText.toLowerCase().includes('recommended follow-up measurements') && document.body.innerText.includes('Surface Clast & Boulder Hazard Mapping')`
    )
    assert.ok(tab3Audit, "Follow-up measurement recommendations must render")

    // Tab 4: Sensitivity & Sources
    await clickButtonByText(page, "Sensitivity & Sources")
    await page.waitForFunction(`document.body.innerText.toLowerCase().includes('exploratory weight-sensitivity analysis')`)
    const tab4Audit = await page.evaluate<{
      hasBaseline: boolean
      hasRange: boolean
      hasDisclaimer: boolean
    }>(`(() => {
      const tl = document.body.innerText.toLowerCase();
      return {
        hasBaseline: tl.includes('baseline mission weights'),
        hasRange: tl.includes('tested range'),
        hasDisclaimer: tl.includes('not a statistical confidence interval'),
      };
    })()`)
    assert.ok(tab4Audit.hasBaseline && tab4Audit.hasRange && tab4Audit.hasDisclaimer)
    await page.screenshot(`${SHOT_DIR}/desktop-intel-sensitivity.png`)

    // Switch to Candidate #2 and check intelligence updates without stale candidate IDs
    await clickButtonByText(page, "Exploratory Cell #2")
    await new Promise((r) => setTimeout(r, 200))
    const cand2Id = await page.evaluate<string | null>(
      `document.querySelector('[data-candidate-intel-id]')?.getAttribute('data-candidate-intel-id') ?? null`
    )
    assert.strictEqual(cand2Id, "cell_+37.3500_+29.9500")

    // Switch to insufficient-data Cell #3 (<40%) -> sensitivity must cleanly report disabled
    await clickButtonByText(page, "Cell #3")
    await page.waitForText("below the 40% reliability gate")

    // Change mission profile -> intelligence must display Context Changed alert without overwriting old scan weights
    await clickButtonByText(page, "Rover testing & trafficability")
    await page.waitForText("Context Changed — Prior Scan Assessment Displayed")

    assert.strictEqual(page.pageErrors.length, 0, `Unexpected pageErrors: ${page.pageErrors.join("; ")}`)
  } finally {
    await page.close()
  }
})

test("Intel E2E 2: Curated Global Atlas intelligence, mobile (375x812) workflow & keyboard accessibility", async () => {
  // Desktop Curated Atlas Intelligence check
  const atlasPage = await openFreshPage(1440, 900)
  try {
    await atlasPage.goto(`${BASE_URL}/discover`)
    await atlasPage.waitForText("Curated Atlas")
    await clickButtonByText(atlasPage, "Curated Atlas")
    await atlasPage.waitForText("Atacama Desert — Yungay Basin")
    await clickButtonByText(atlasPage, "Atacama Desert — Yungay Basin")
    await clickButtonByText(atlasPage, "Open Scientific Intelligence")
    await atlasPage.waitForText("Curated archive (no fabricated live score)")
    await clickButtonByText(atlasPage, "Sensitivity & Sources")
    await atlasPage.waitForText("Sensitivity analysis applies only to scored live discovery candidates")

    // Keyboard accessibility check: Tab across intelligence sub-tabs
    const tabFocusedRole = await atlasPage.evaluate<boolean>(`(() => {
      const btn = Array.from(document.querySelectorAll('[role="tab"]')).find((el) =>
        (el.textContent || '').includes('Why It Matches')
      );
      if (!btn) return false;
      btn.focus();
      return document.activeElement === btn;
    })()`)
    assert.ok(tabFocusedRole, "Intelligence sub-tabs must receive keyboard focus")
    await atlasPage.pressKey("Tab")
    const nextFocusedIsTab = await atlasPage.evaluate<string>(
      `document.activeElement?.getAttribute('role') ?? ''`
    )
    assert.strictEqual(nextFocusedIsTab, "tab", "Tab key must move cleanly to next intelligence sub-tab")

    await atlasPage.screenshot(`${SHOT_DIR}/desktop-intel-atlas.png`)
    assert.strictEqual(atlasPage.pageErrors.length, 0)
  } finally {
    await atlasPage.close()
  }

  // Mobile 375x812 workflow
  const mobilePage = await openFreshPage(375, 812, true)
  const mockResp = buildMockIntelligenceScanResponse()
  try {
    await mobilePage.addRoute({
      urlPattern: "/api/discover",
      method: "POST",
      once: true,
      handler: () => ({ status: 200, body: JSON.stringify(mockResp) }),
    })

    await mobilePage.goto(`${BASE_URL}/discover`)
    await mobilePage.waitForText("1. Config")
    await clickButtonByText(mobilePage, "1. Config")
    await clickButtonByText(mobilePage, "Lake Salda, Turkey")
    await clickButtonByText(mobilePage, "1. Config")
    await clickButtonByText(mobilePage, "Launch Discovery Scan")
    await mobilePage.waitForText("Exploratory Cell #1")
    await clickButtonByText(mobilePage, "Open Scientific Intelligence")
    await mobilePage.waitForText("Evidence Quality Assessment")

    const overflowMobile = await mobilePage.evaluate<boolean>(
      `document.documentElement.scrollWidth > window.innerWidth + 2`
    )
    assert.strictEqual(overflowMobile, false, "Unexpected horizontal overflow on 375x812 mobile with Scientific Intelligence open")

    await mobilePage.evaluate<void>(
      `document.querySelector('[data-candidate-intel-id]')?.scrollIntoView({ block: 'start' })`
    )
    await new Promise((r) => setTimeout(r, 200))
    await mobilePage.screenshot(`${SHOT_DIR}/mobile-intel.png`)
    assert.strictEqual(mobilePage.pageErrors.length, 0)
  } finally {
    await mobilePage.close()
  }
})
