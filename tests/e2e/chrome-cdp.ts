import { spawn, type ChildProcess } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"

export interface ConsoleEntry {
  type: string
  text: string
  location?: string
}

export interface NetworkRecord {
  requestId: string
  url: string
  method: string
  postData?: string
  status?: number
  statusText?: string
  failedReason?: string
}

export interface RouteMockRule {
  id: string
  urlPattern: string
  method?: string
  once?: boolean
  handler: (req: {
    url: string
    method: string
    postData?: string
  }) =>
    | Promise<RouteFulfillOptions | "abort" | "continue">
    | RouteFulfillOptions
    | "abort"
    | "continue"
}

export interface RouteFulfillOptions {
  status: number
  headers?: Record<string, string>
  body: string
}

export interface CdpClientOptions {
  chromePath?: string
  port?: number
}

interface PendingCommand {
  resolve: (value: Record<string, unknown>) => void
  reject: (err: Error) => void
}

const DEFAULT_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
]

function resolveChromeExecutable(customPath?: string): string {
  if (customPath) return customPath
  return DEFAULT_CHROME_PATHS[0]
}

export class ChromeCdpBrowser {
  private proc: ChildProcess | null = null
  private userDataDir: string | null = null
  private browserWs: WebSocket | null = null
  private port: number
  private chromePath: string

  constructor(opts: CdpClientOptions = {}) {
    this.port = opts.port ?? 9223
    this.chromePath = resolveChromeExecutable(opts.chromePath)
  }

  async launch(): Promise<{ version: Record<string, unknown> }> {
    this.userDataDir = mkdtempSync(join(tmpdir(), "terratwin-cdp-"))
    this.proc = spawn(
      this.chromePath,
      [
        "--headless=new",
        `--remote-debugging-port=${this.port}`,
        `--user-data-dir=${this.userDataDir}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-extensions",
        "--mute-audio",
        "about:blank",
      ],
      { stdio: "ignore", windowsHide: true }
    )

    const versionUrl = `http://127.0.0.1:${this.port}/json/version`
    let versionJson: Record<string, unknown> | null = null
    const deadline = Date.now() + 15000
    while (Date.now() < deadline) {
      try {
        const res = await fetch(versionUrl)
        if (res.ok) {
          versionJson = (await res.json()) as Record<string, unknown>
          break
        }
      } catch {
        // Wait for DevTools HTTP endpoint
      }
      await new Promise((r) => setTimeout(r, 200))
    }

    if (!versionJson || typeof versionJson.webSocketDebuggerUrl !== "string") {
      await this.close()
      throw new Error(`Timed out waiting for Chrome DevTools on port ${this.port}`)
    }

    return { version: versionJson }
  }

  async newPage(): Promise<ChromeCdpPage> {
    const res = await fetch(`http://127.0.0.1:${this.port}/json/new?about:blank`, {
      method: "PUT",
    })
    if (!res.ok) {
      throw new Error(`Failed to open new Chrome target tab: HTTP ${res.status}`)
    }
    const target = (await res.json()) as { id: string; webSocketDebuggerUrl: string }
    const page = new ChromeCdpPage(this.port, target.id, target.webSocketDebuggerUrl)
    await page.connect()
    return page
  }

  async close(): Promise<void> {
    try {
      this.browserWs?.close()
    } catch {}
    this.browserWs = null

    if (this.proc && !this.proc.killed) {
      try {
        this.proc.kill("SIGKILL")
      } catch {}
      await new Promise((r) => setTimeout(r, 300))
    }
    this.proc = null

    if (this.userDataDir) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          rmSync(this.userDataDir, { recursive: true, force: true })
          break
        } catch {
          await new Promise((r) => setTimeout(r, 250))
        }
      }
      this.userDataDir = null
    }
  }
}

export class ChromeCdpPage {
  private port: number
  private targetId: string
  private wsUrl: string
  private ws: WebSocket | null = null
  private cmdId = 0
  private pending = new Map<number, PendingCommand>()
  private routes: RouteMockRule[] = []
  private fetchEnabled = false

  readonly consoleLogs: ConsoleEntry[] = []
  readonly pageErrors: string[] = []
  readonly networkRequests = new Map<string, NetworkRecord>()

  constructor(port: number, targetId: string, wsUrl: string) {
    this.port = port
    this.targetId = targetId
    this.wsUrl = wsUrl
  }

  async connect(): Promise<void> {
    this.ws = new WebSocket(this.wsUrl)
    await new Promise<void>((resolve, reject) => {
      if (!this.ws) return reject(new Error("WebSocket missing"))
      this.ws.addEventListener("open", () => resolve(), { once: true })
      this.ws.addEventListener("error", (ev) => reject(new Error(`CDP socket error: ${String(ev)}`)), {
        once: true,
      })
    })

    this.ws.addEventListener("message", (ev) => {
      const raw = typeof ev.data === "string" ? ev.data : String(ev.data)
      const msg = JSON.parse(raw) as {
        id?: number
        method?: string
        params?: Record<string, unknown>
        result?: Record<string, unknown>
        error?: { code?: number; message?: string }
      }

      if (typeof msg.id === "number") {
        const waiter = this.pending.get(msg.id)
        if (waiter) {
          this.pending.delete(msg.id)
          if (msg.error) {
            waiter.reject(new Error(`CDP error ${msg.error.code ?? ""}: ${msg.error.message ?? "Unknown"}`))
          } else {
            waiter.resolve(msg.result ?? {})
          }
        }
        return
      }

      this.handleEvent(msg.method ?? "", msg.params ?? {})
    })

    await this.send("Page.enable")
    await this.send("Runtime.enable")
    await this.send("Network.enable")
    await this.send("DOM.enable")
  }

  private handleEvent(method: string, params: Record<string, unknown>) {
    if (method === "Runtime.consoleAPICalled") {
      const type = String(params.type ?? "log")
      const args = Array.isArray(params.args) ? params.args : []
      const text = args
        .map((a) => {
          const item = a as { value?: unknown; description?: string }
          return item.value !== undefined ? String(item.value) : (item.description ?? "")
        })
        .join(" ")
      this.consoleLogs.push({ type, text })
    } else if (method === "Runtime.exceptionThrown") {
      const details = params.exceptionDetails as {
        text?: string
        exception?: { description?: string }
      } | undefined
      const errMsg = details?.exception?.description ?? details?.text ?? "Uncaught page exception"
      this.pageErrors.push(errMsg)
    } else if (method === "Network.requestWillBeSent") {
      const reqId = String(params.requestId ?? "")
      const req = params.request as { url?: string; method?: string; postData?: string } | undefined
      if (reqId && req) {
        this.networkRequests.set(reqId, {
          requestId: reqId,
          url: req.url ?? "",
          method: req.method ?? "GET",
          postData: req.postData,
        })
      }
    } else if (method === "Network.responseReceived") {
      const reqId = String(params.requestId ?? "")
      const res = params.response as { status?: number; statusText?: string } | undefined
      const rec = this.networkRequests.get(reqId)
      if (rec && res) {
        rec.status = res.status
        rec.statusText = res.statusText
      }
    } else if (method === "Network.loadingFailed") {
      const reqId = String(params.requestId ?? "")
      const rec = this.networkRequests.get(reqId)
      if (rec) {
        rec.failedReason = String(params.errorText ?? "failed")
      }
    } else if (method === "Fetch.requestPaused") {
      void this.handlePausedRequest(params)
    }
  }

  private async handlePausedRequest(params: Record<string, unknown>) {
    const requestId = String(params.requestId ?? "")
    const req = (params.request as { url?: string; method?: string; postData?: string }) ?? {}
    const url = req.url ?? ""
    const method = req.method ?? "GET"

    const matchedRule = this.routes.find((r) => {
      const urlOk = url.includes(r.urlPattern)
      const methodOk = !r.method || r.method.toUpperCase() === method.toUpperCase()
      return urlOk && methodOk
    })

    if (!matchedRule) {
      await this.send("Fetch.continueRequest", { requestId }).catch(() => {})
      return
    }

    if (matchedRule.once) {
      this.routes = this.routes.filter((r) => r.id !== matchedRule.id)
    }

    try {
      const decision = await matchedRule.handler({
        url,
        method,
        postData: req.postData,
      })

      if (decision === "continue") {
        await this.send("Fetch.continueRequest", { requestId })
      } else if (decision === "abort") {
        await this.send("Fetch.failRequest", { requestId, errorReason: "Failed" })
      } else {
        const headers = Object.entries({
          "content-type": "application/json",
          ...(decision.headers ?? {}),
        }).map(([name, value]) => ({ name, value }))
        const body = Buffer.from(decision.body, "utf8").toString("base64")
        await this.send("Fetch.fulfillRequest", {
          requestId,
          responseCode: decision.status,
          responseHeaders: headers,
          body,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes("Invalid InterceptionId") && !msg.includes("CDP socket not open")) {
        console.error("[ChromeCdpPage] route handler error:", err)
        await this.send("Fetch.continueRequest", { requestId }).catch(() => {})
      }
    }
  }

  async send(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`CDP socket not open for command ${method}`)
    }
    const id = ++this.cmdId
    const payload = JSON.stringify({ id, method, params })
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP command timed out: ${method}`))
      }, 20000)
      this.pending.set(id, {
        resolve: (val) => {
          clearTimeout(timer)
          resolve(val)
        },
        reject: (err) => {
          clearTimeout(timer)
          reject(err)
        },
      })
      this.ws!.send(payload)
    })
  }

  async setViewport(width: number, height: number, isMobile = false): Promise<void> {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile,
    })
    await this.send("Emulation.setTouchEmulationEnabled", { enabled: isMobile })
  }

  async addRoute(rule: Omit<RouteMockRule, "id">): Promise<string> {
    const id = `route_${Math.random().toString(36).slice(2)}`
    this.routes.push({ ...rule, id })
    if (!this.fetchEnabled) {
      await this.send("Fetch.enable", {
        patterns: [{ urlPattern: "*localhost*", requestStage: "Request" }],
      })
      this.fetchEnabled = true
    }
    return id
  }

  async clearRoutes(): Promise<void> {
    this.routes = []
    if (this.fetchEnabled) {
      await this.send("Fetch.disable").catch(() => {})
      this.fetchEnabled = false
    }
  }

  clearTelemetry(): void {
    this.consoleLogs.length = 0
    this.pageErrors.length = 0
    this.networkRequests.clear()
  }

  async goto(url: string): Promise<void> {
    const loadPromise = new Promise<void>((resolve) => {
      const listener = (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(String(ev.data)) as { method?: string }
          if (msg.method === "Page.loadEventFired") {
            this.ws?.removeEventListener("message", listener)
            resolve()
          }
        } catch {}
      }
      this.ws?.addEventListener("message", listener)
      setTimeout(() => {
        this.ws?.removeEventListener("message", listener)
        resolve()
      }, 15000)
    })

    await this.send("Page.navigate", { url })
    await loadPromise
    await new Promise((r) => setTimeout(r, 400))
  }

  async evaluate<T>(expression: string): Promise<T> {
    const res = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    const exc = res.exceptionDetails as { text?: string; exception?: { description?: string } } | undefined
    if (exc) {
      throw new Error(`Evaluation failed: ${exc.exception?.description ?? exc.text ?? "Unknown"}`)
    }
    const result = res.result as { value?: T } | undefined
    return result?.value as T
  }

  async waitForFunction(fnBody: string, timeoutMs = 15000): Promise<void> {
    const wrapped = fnBody.trimStart().startsWith("return ")
      ? `(() => { ${fnBody} })()`
      : `(() => (${fnBody}))()`
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const ok = await this.evaluate<boolean>(`Boolean(${wrapped})`)
      if (ok) return
      await new Promise((r) => setTimeout(r, 150))
    }
    throw new Error(`waitForFunction timed out after ${timeoutMs}ms: ${fnBody}`)
  }

  async waitForText(substring: string, timeoutMs = 15000): Promise<void> {
    const escaped = JSON.stringify(substring.toLowerCase())
    await this.waitForFunction(
      `return document.body && document.body.innerText.toLowerCase().includes(${escaped});`,
      timeoutMs
    )
  }

  /**
   * Waits until at least one tracked network request matching urlSubstring & optional HTTP method
   * has resolved (received an HTTP response status or a terminal failure reason).
   */
  async waitForNetworkResponse(
    urlSubstring: string,
    method?: string,
    timeoutMs = 30000
  ): Promise<NetworkRecord> {
    const upperMethod = method?.toUpperCase()
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const matches = [...this.networkRequests.values()].filter((r) => {
        const urlOk = r.url.includes(urlSubstring)
        const methodOk = !upperMethod || r.method.toUpperCase() === upperMethod
        return urlOk && methodOk && (r.status !== undefined || r.failedReason !== undefined)
      })
      if (matches.length > 0) {
        return matches[matches.length - 1]
      }
      await new Promise((r) => setTimeout(r, 100))
    }
    const seen = [...this.networkRequests.values()]
      .filter((r) => r.url.includes(urlSubstring))
      .map((r) => `${r.method} ${r.url} (status=${String(r.status)}, err=${String(r.failedReason)})`)
    throw new Error(
      `Timed out after ${timeoutMs}ms waiting for ${upperMethod ?? "ANY"} ${urlSubstring} response. Tracked matching requests: [${seen.join("; ") || "none"}]`
    )
  }

  async enableDownloads(downloadDir: string): Promise<void> {
    mkdirSync(downloadDir, { recursive: true })
    await this.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadDir,
      eventsEnabled: false,
    })
  }

  async waitForDownloadedFile(
    downloadDir: string,
    filenameRegex: RegExp,
    existingFiles: Set<string> = new Set(),
    timeoutMs = 15000
  ): Promise<{ filename: string; path: string; sizeBytes: number }> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const entries = readdirSync(downloadDir)
      for (const name of entries) {
        if (existingFiles.has(name)) continue
        if (name.endsWith(".crdownload") || name.endsWith(".tmp")) continue
        if (!filenameRegex.test(name)) continue
        const fullPath = join(downloadDir, name)
        const st = statSync(fullPath)
        if (st.size > 0) {
          return { filename: name, path: fullPath, sizeBytes: st.size }
        }
      }
      await new Promise((r) => setTimeout(r, 120))
    }
    throw new Error(
      `Timed out after ${timeoutMs}ms waiting for download matching ${String(filenameRegex)} in ${downloadDir}`
    )
  }

  async clickMouse(x: number, y: number): Promise<void> {
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y,
      button: "none",
      buttons: 0,
    })
    await this.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      buttons: 1,
      clickCount: 1,
    })
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      buttons: 0,
      clickCount: 1,
    })
  }

  async dragMouse(startX: number, startY: number, endX: number, endY: number, steps = 8): Promise<void> {
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: startX,
      y: startY,
      button: "none",
      buttons: 0,
    })
    await this.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: startX,
      y: startY,
      button: "left",
      buttons: 1,
      clickCount: 1,
    })
    for (let i = 1; i <= steps; i++) {
      const x = startX + ((endX - startX) * i) / steps
      const y = startY + ((endY - startY) * i) / steps
      await this.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x,
        y,
        button: "left",
        buttons: 1,
      })
      await new Promise((r) => setTimeout(r, 25))
    }
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: endX,
      y: endY,
      button: "left",
      buttons: 0,
      clickCount: 1,
    })
  }

  async pressKey(key: string, code = key, windowsVirtualKeyCode = 0, modifiers = 0): Promise<void> {
    await this.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key,
      code,
      windowsVirtualKeyCode,
      modifiers,
    })
    await this.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key,
      code,
      windowsVirtualKeyCode,
      modifiers,
    })
  }

  async clickSelector(selector: string): Promise<void> {
    const rect = await this.evaluate<{ x: number; y: number; ok: boolean }>(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return { x: 0, y: 0, ok: false };
      el.scrollIntoView({ block: "center", inline: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, ok: r.width > 0 && r.height > 0 };
    })()`)
    if (!rect.ok) {
      throw new Error(`Element not visible/found for click: ${selector}`)
    }
    await this.clickMouse(rect.x, rect.y)
    await new Promise((r) => setTimeout(r, 80))
  }

  async typeIntoSelector(selector: string, text: string): Promise<void> {
    await this.clickSelector(selector)
    await this.evaluate<void>(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.focus();
        el.select();
      }
    })()`)
    await this.pressKey("Backspace", "Backspace", 8)
    if (text.length > 0) {
      await this.send("Input.insertText", { text })
    }
    await new Promise((r) => setTimeout(r, 80))
  }

  async screenshot(outPath: string, fullPage = false): Promise<void> {
    mkdirSync(dirname(outPath), { recursive: true })
    if (fullPage) {
      const metrics = await this.evaluate<{ width: number; height: number }>(
        `({ width: Math.ceil(document.documentElement.scrollWidth), height: Math.ceil(document.documentElement.scrollHeight) })`
      )
      const shot = await this.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: metrics.width, height: metrics.height, scale: 1 },
      })
      writeFileSync(outPath, Buffer.from(String(shot.data), "base64"))
      return
    }
    const shot = await this.send("Page.captureScreenshot", { format: "png" })
    writeFileSync(outPath, Buffer.from(String(shot.data), "base64"))
  }

  async close(): Promise<void> {
    await this.clearRoutes()
    try {
      this.ws?.close()
    } catch {}
    await fetch(`http://127.0.0.1:${this.port}/json/close/${this.targetId}`).catch(() => {})
  }
}
