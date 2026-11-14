import { ChromeCdpBrowser } from "../tests/e2e/chrome-cdp.ts"
import * as fs from "node:fs"
import * as path from "node:path"

async function audit() {
  const b = new ChromeCdpBrowser({ port: 9235 })
  await b.launch()
  const p = await b.newPage()
  fs.mkdirSync("artifacts/redesign-audit", { recursive: true })

  const routes = [
    { name: "landing", url: "http://127.0.0.1:3000/" },
    { name: "explore", url: "http://127.0.0.1:3000/explore" },
    { name: "discover", url: "http://127.0.0.1:3000/discover" },
    { name: "methodology", url: "http://127.0.0.1:3000/methodology" },
    { name: "sources", url: "http://127.0.0.1:3000/sources" },
    { name: "login", url: "http://127.0.0.1:3000/login" },
  ]

  for (const r of routes) {
    await p.setViewport(1440, 900, false)
    await p.goto(r.url)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await p.screenshot(path.join("artifacts/redesign-audit", `${r.name}-desktop.png`))

    await p.setViewport(390, 844, true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    await p.screenshot(path.join("artifacts/redesign-audit", `${r.name}-mobile.png`))
  }

  await p.close()
  await b.close()
  console.log("AUDIT_SCREENSHOTS_CAPTURED")
}

audit().catch((e) => {
  console.error(e)
  process.exit(1)
})
