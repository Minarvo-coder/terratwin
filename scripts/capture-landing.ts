import { ChromeCdpBrowser } from "../tests/e2e/chrome-cdp.ts"
import * as fs from "node:fs"
import * as path from "node:path"

async function capture() {
  const b = new ChromeCdpBrowser({ port: 9236 })
  await b.launch()
  const p = await b.newPage()
  fs.mkdirSync("artifacts/redesign-phase4", { recursive: true })

  await p.setViewport(1440, 900, false)
  await p.goto("http://127.0.0.1:3000/")
  await new Promise((resolve) => setTimeout(resolve, 1200))
  await p.screenshot(path.join("artifacts/redesign-phase4", "landing-desktop.png"))

  await p.setViewport(390, 844, true)
  await new Promise((resolve) => setTimeout(resolve, 600))
  await p.screenshot(path.join("artifacts/redesign-phase4", "landing-mobile.png"))

  await p.close()
  await b.close()
  console.log("LANDING_REDESIGN_CAPTURED")
}

capture().catch((e) => {
  console.error(e)
  process.exit(1)
})
