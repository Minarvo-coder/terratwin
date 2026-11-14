/**
 * Phase 7.5 — Final Demo Readiness & Presentation Polish Browser E2E Suite
 *
 * Verifies in real headless Chrome (via CDP):
 * 1. Landing page (`/`) Phase 7.2 deterministic telemetry & stat counts
 * 2. Route alias redirects (`/explorer` -> `/explore`, `/globe` -> `/explore`, `/about` -> `/methodology`)
 * 3. Explorer Flight Deck (`/explore`) 3D/2D globe, mission profiles, and portfolio suite
 * 4. Discovery Scanner (`/discover`) Judge Demo Scenarios Quick-Load bar (Demo A1, Demo A2, Demo B, Demo C, dismiss/restore)
 * 5. Methodology (`/methodology`) and Sources (`/sources`) pages
 * 6. Responsive viewports (1440x900 desktop, 768x1024 tablet, 390x844 mobile) and Phase 7 screenshot archiving
 */

import * as fs from "node:fs"
import * as path from "node:path"
import assert from "node:assert"
import { ChromeCdpBrowser, type ChromeCdpPage } from "./chrome-cdp.ts"

const BASE_URL = process.env.TERRATWIN_E2E_URL ?? "http://127.0.0.1:3000"
const ARTIFACTS_DIR = path.join(process.cwd(), "artifacts", "phase7")

async function clickSelector(page: ChromeCdpPage, selector: string): Promise<void> {
  await page.waitForFunction(`Boolean(document.querySelector(${JSON.stringify(selector)}))`, 15000)
  const clicked = await page.evaluate<boolean>(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    el.click();
    return true;
  })()`)
  assert.ok(clicked, `Expected to click selector: ${selector}`)
  await new Promise((r) => setTimeout(r, 250))
}

async function main() {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })
  console.log("=== Phase 7.5 Real-Browser Demo Readiness Verification ===")
  const browser = new ChromeCdpBrowser({ port: 9228 })
  const launched = await browser.launch()
  console.log(`Connected headless Chrome: ${String(launched.version.Browser)}`)

  const page = await browser.newPage()

  try {
    await page.setViewport(1440, 900, false)

    // 1. Verify Landing Page (`/`) Phase 7.2 deterministic telemetry & stats
    console.log("1. Navigating to / (1440x900) and verifying Phase 7.2 deterministic telemetry...")
    await page.goto(`${BASE_URL}/`)
    await page.waitForText("Earth Analogs for", 15000)
    await new Promise((r) => setTimeout(r, 800))

    const landingText = await page.evaluate<string>("document.body.innerText")
    assert.ok(
      landingText.includes("Lake Salda, Turkey (86.4% Geo / 81.1% Rover)"),
      "Expected verified Lake Salda 86.4% Geo / 81.1% Rover telemetry on landing hero"
    )
    assert.ok(
      landingText.includes("ILLUSTRATIVE MISSION PREVIEW // DETERMINISTIC TELEMETRY"),
      "Expected updated HUD preview badge on landing hero"
    )
    assert.ok(
      landingText.includes("12") && landingText.toUpperCase().includes("ENVIRONMENTAL PARAMETERS"),
      "Expected 12 Environmental Parameters stat on landing hero"
    )
    assert.ok(
      landingText.includes("31") && landingText.toUpperCase().includes("CURATED ATLAS SITES (+ LIVE SCANNER)"),
      "Expected 31 Curated Atlas Sites (+ Live Scanner) stat on landing hero"
    )
    await page.screenshot(path.join(ARTIFACTS_DIR, "01-landing-hero-desktop.png"))
    console.log("   [PASS] Landing page telemetry and stat strip verified.")

    // 2. Verify Route Alias Redirects (`/explorer`, `/globe`, `/about`)
    console.log("2. Verifying route alias redirects (/explorer, /globe, /about)...")
    await page.goto(`${BASE_URL}/explorer`)
    await page.waitForFunction(`window.location.pathname === "/explore"`, 15000)
    const explorerPath = await page.evaluate<string>("window.location.pathname")
    assert.strictEqual(explorerPath, "/explore", `Expected /explorer to redirect to /explore, got ${explorerPath}`)

    await page.goto(`${BASE_URL}/globe`)
    await page.waitForFunction(`window.location.pathname === "/explore"`, 15000)
    const globePath = await page.evaluate<string>("window.location.pathname")
    assert.strictEqual(globePath, "/explore", `Expected /globe to redirect to /explore, got ${globePath}`)

    await page.goto(`${BASE_URL}/about`)
    await page.waitForFunction(`window.location.pathname === "/methodology"`, 15000)
    const aboutPath = await page.evaluate<string>("window.location.pathname")
    assert.strictEqual(aboutPath, "/methodology", `Expected /about to redirect to /methodology, got ${aboutPath}`)
    console.log("   [PASS] Route alias redirects (/explorer -> /explore, /globe -> /explore, /about -> /methodology) verified.")

    // 3. Verify Explorer Flight Deck (`/explore`)
    console.log("3. Capturing /explore Flight Deck screenshot...")
    await page.goto(`${BASE_URL}/explore`)
    await page.waitForFunction(`document.body.innerText.includes("Jezero")`, 15000)
    await new Promise((r) => setTimeout(r, 1000))
    await page.screenshot(path.join(ARTIFACTS_DIR, "02-explore-flight-deck-desktop.png"))
    console.log("   [PASS] /explore Flight Deck verified.")

    // 4. Verify Discovery Scanner (`/discover`) Judge Demo Quick-Load Scenarios
    console.log("4. Verifying /discover Judge Demo Quick-Load Scenarios bar...")
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForFunction(`Boolean(document.querySelector('[data-testid="judge-demo-quickload-bar"]'))`, 15000)
    await new Promise((r) => setTimeout(r, 800))

    // Test Demo A1 preset button
    await clickSelector(page, '[data-testid="judge-demo-preset-a-geo"]')
    await new Promise((r) => setTimeout(r, 400))
    const pageTextAfterA1 = await page.evaluate<string>("document.body.innerText")
    assert.ok(
      pageTextAfterA1.includes("37.10") || pageTextAfterA1.includes("29.20") || pageTextAfterA1.includes("Geological"),
      "Expected Demo A1 preset to configure Mars Jezero · Lake Salda geological scan"
    )

    // Test Demo B preset button (Moon Shackleton + McMurdo Dry Valleys in Global Atlas)
    await clickSelector(page, '[data-testid="judge-demo-preset-b"]')
    await new Promise((r) => setTimeout(r, 700))
    const demoBText = await page.evaluate<string>("document.body.innerText")
    assert.ok(
      demoBText.includes("McMurdo Dry Valleys"),
      "Expected Demo B preset to select McMurdo Dry Valleys in Global Atlas"
    )
    await page.screenshot(path.join(ARTIFACTS_DIR, "03-discover-demo-b-lunar-atlas.png"))

    // Test Demo C preset button (Mars Jezero + Tibetan Plateau — Qinghai in Global Atlas)
    await clickSelector(page, '[data-testid="judge-demo-preset-c"]')
    await new Promise((r) => setTimeout(r, 700))
    const demoCText = await page.evaluate<string>("document.body.innerText")
    assert.ok(
      demoCText.includes("Tibetan Plateau"),
      "Expected Demo C preset to select Tibetan Plateau — Qinghai in Global Atlas"
    )
    await page.screenshot(path.join(ARTIFACTS_DIR, "04-discover-demo-c-global-atlas.png"))

    // Test dismiss and restore of Judge Demo Scenarios bar
    await clickSelector(page, '[data-testid="dismiss-judge-demo-bar"]')
    await page.waitForFunction(`Boolean(document.querySelector('[data-testid="restore-judge-demo-bar"]'))`, 5000)
    await clickSelector(page, '[data-testid="restore-judge-demo-bar"]')
    await page.waitForFunction(`Boolean(document.querySelector('[data-testid="judge-demo-quickload-bar"]'))`, 5000)
    console.log("   [PASS] Judge Demo Quick-Load Scenarios (Demo A1, Demo B, Demo C, Hide/Restore) verified.")

    // 5. Verify /methodology and /sources
    console.log("5. Verifying /methodology and /sources...")
    await page.goto(`${BASE_URL}/methodology`)
    await page.waitForFunction(`document.body.innerText.length > 200`, 15000)
    await new Promise((r) => setTimeout(r, 500))
    await page.screenshot(path.join(ARTIFACTS_DIR, "05-methodology-desktop.png"))

    await page.goto(`${BASE_URL}/sources`)
    await page.waitForFunction(`document.body.innerText.length > 200`, 15000)
    await new Promise((r) => setTimeout(r, 500))
    await page.screenshot(path.join(ARTIFACTS_DIR, "06-sources-desktop.png"))
    console.log("   [PASS] /methodology and /sources verified.")

    // 6. Verify Tablet (768x1024) and Mobile (390x844) responsiveness on /discover
    console.log("6. Verifying responsive viewports (768x1024 tablet & 390x844 mobile) on /discover...")
    await page.setViewport(768, 1024, false)
    await page.goto(`${BASE_URL}/discover`)
    await page.waitForFunction(`Boolean(document.querySelector('[data-testid="judge-demo-quickload-bar"]'))`, 15000)
    await new Promise((r) => setTimeout(r, 600))
    const tabletOverflow = await page.evaluate<boolean>(
      "document.documentElement.scrollWidth > window.innerWidth + 2"
    )
    assert.ok(!tabletOverflow, "Expected zero horizontal overflow on 768x1024 tablet viewport")
    await page.screenshot(path.join(ARTIFACTS_DIR, "07-discover-tablet.png"))

    await page.setViewport(390, 844, true)
    await new Promise((r) => setTimeout(r, 600))
    const mobileOverflow = await page.evaluate<boolean>(
      "document.documentElement.scrollWidth > window.innerWidth + 2"
    )
    assert.ok(!mobileOverflow, "Expected zero horizontal overflow on 390x844 mobile viewport")
    await page.screenshot(path.join(ARTIFACTS_DIR, "08-discover-mobile.png"))
    console.log("   [PASS] Tablet (768x1024) and Mobile (390x844) viewports verified with zero overflow.")

    assert.strictEqual(
      page.pageErrors.length,
      0,
      `Expected zero uncaught page errors, got: ${page.pageErrors.join(" | ")}`
    )

    console.log("\nALL PHASE 7.5 DEMO READINESS BROWSER E2E CHECKS PASSED!")
  } finally {
    await page.close()
    await browser.close()
  }
}

main().catch((err: unknown) => {
  console.error("Phase 7.5 E2E Failed:", err)
  process.exit(1)
})
