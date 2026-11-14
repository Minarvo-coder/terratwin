import { ChromeCdpBrowser } from "../tests/e2e/chrome-cdp.ts"
import * as fs from "node:fs"
import * as path from "node:path"

async function captureAllPages() {
  const b = new ChromeCdpBrowser({ port: 9237 })
  await b.launch()
  const p = await b.newPage()
  fs.mkdirSync("artifacts/redesign-phase4", { recursive: true })

  const routes = [
    { name: "explore", url: "http://127.0.0.1:3000/explore" },
    { name: "discover", url: "http://127.0.0.1:3000/discover" },
    { name: "methodology", url: "http://127.0.0.1:3000/methodology" },
    { name: "sources", url: "http://127.0.0.1:3000/sources" },
  ]

  for (const r of routes) {
    await p.setViewport(1440, 900, false)
    await p.goto(r.url)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await p.screenshot(path.join("artifacts/redesign-phase4", `${r.name}-desktop.png`))

    await p.setViewport(390, 844, true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    await p.screenshot(path.join("artifacts/redesign-phase4", `${r.name}-mobile.png`))
  }

  await p.close()
  await b.close()
  console.log("ALL_REDESIGN_PAGES_CAPTURED")
}

captureAllPages().catch((e) => {
  console.error(e)
  process.exit(1)
})
