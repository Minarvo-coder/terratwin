/**
 * TerraTwin — Distributed Upstash Redis Rate Limiter & Cache Verification Suite
 *
 * Covers Requirements 3, 4, 6, 7, 8, and 9:
 *  1. Config & security validation (missing, partial, http:// blocked in prod, alias fallback, zero secret leakage).
 *  2. Safe local dev fallback (20 req/60s active in memory).
 *  3. Production Redis unavailability safety (degraded-memory tight ceiling 10 req/60s, fail-closed 503, timeout interception).
 *  4. Deterministic SHA-256 cache keys, bounded payload limits, incomplete-provider rejection, corrupt entry rejection.
 *  5. Batch MGET + L1/L2 Upstash caching across connectors & discovery responses.
 *  6. Real separate OS process sharing (Node worker A & worker B sharing HTTP Upstash REST test server for both rate limit and response/connector cache).
 *  7. Real separate Next.js `next start` HTTP server processes (if `.next` build exists) sharing HTTP 429 limit on POST /api/discover.
 */

import test from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

import {
  resetRedisClientForTesting,
  resolveSharedRedis,
  setTestRedisClientOverride,
} from "../src/lib/terratwin/utils/redis-client.ts"
import {
  checkDiscoverRateLimit,
  EMERGENCY_FALLBACK_MAX_REQUESTS,
  extractClientIdentifier,
  resetRateLimitersForTesting,
} from "../src/lib/terratwin/utils/rate-limiter.ts"
import {
  computeDeterministicRedisKey,
  DiscoveryCache,
  discoveryResponseCache,
  elevationCache,
  isValidDiscoveryResponseCacheRecord,
  macrostratCache,
  nasaPowerCache,
  RESPONSE_SHARED_CACHE_MAX_PAYLOAD_BYTES,
} from "../src/lib/terratwin/utils/discovery-cache.ts"
import { SAMPLE_TARGETS } from "../src/lib/terratwin/sample-dataset.ts"
import { GEOLOGICAL_RESEARCH_PROFILE } from "../src/lib/terratwin/config/comparison-config.ts"

const TEST_ENV_KEYS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "TERRATWIN_REDIS_FAIL_MODE",
  "TERRATWIN_REQUIRE_REDIS",
  "TERRATWIN_ALLOW_HTTP_REDIS_FOR_TEST",
]

function saveAndClearRedisEnv() {
  const prev = {}
  for (const k of [...TEST_ENV_KEYS, "NODE_ENV", "VERCEL"]) {
    prev[k] = process.env[k]
  }
  for (const k of TEST_ENV_KEYS) {
    delete process.env[k]
  }
  return prev
}

function restoreEnv(prev) {
  for (const [k, v] of Object.entries(prev)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  resetRedisClientForTesting()
  resetRateLimitersForTesting()
}

function makeHealthyDiscoveryResponse(score = 78.4) {
  const target = SAMPLE_TARGETS.find((t) => t.id === "mars-jezero-delta") ?? SAMPLE_TARGETS[0]
  return {
    success: true,
    searchMetadata: {
      boundingBox: [37.1, 29.2, 37.6, 29.7],
      targetId: "mars-jezero-delta",
      missionProfile: "Geological field research",
      gridSpacingDeg: 0.5,
      cellsGenerated: 1,
      cellsEvaluated: 1,
      maxCellsAllowed: 4,
      responseCacheHit: false,
    },
    target,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    providerStatuses: [
      {
        provider: "Open-Meteo Elevation",
        dataset: "Copernicus DEM GLO-90",
        status: "success",
        recordsFetched: 1,
        latencyMs: 50,
        spatialResolution: "90 m",
        attributionNotice: "Copernicus",
      },
      {
        provider: "NASA POWER Climatology",
        dataset: "POWER v2.10.1",
        status: "success",
        recordsFetched: 1,
        latencyMs: 60,
        spatialResolution: "0.5 deg",
        attributionNotice: "NASA POWER",
      },
      {
        provider: "Macrostrat Geology",
        dataset: "Macrostrat v2",
        status: "success",
        recordsFetched: 1,
        latencyMs: 40,
        spatialResolution: "1:250k",
        attributionNotice: "Macrostrat",
      },
    ],
    totalCellsEvaluated: 1,
    computableCandidatesCount: 1,
    insufficientDataCandidatesCount: 0,
    candidates: [
      {
        rank: 1,
        candidate: {
          id: "cell_37_29",
          name: "Test Cell",
          country: "Regional Scan",
          latitude: 37.35,
          longitude: 29.45,
          setting: "Carbonate margin",
          summary: "Test",
          environment: {
            meanSurfaceTempC: 11,
            diurnalTempRangeC: 14,
            annualPrecipitationMm: 450,
            meanSlopeDeg: 4.5,
            rockAbundancePct: null,
            medianGrainSizeMm: null,
            albedo: null,
            vegetationCoverPct: null,
            lithology: "clay-sedimentary",
            elevationM: 1150,
            surfacePressurePa: null,
            surfaceSolarIrradianceWm2: 190,
          },
          isVerified: false,
          noveltyTier: "live-grid-discovery",
        },
        score,
        scoreDisplay: `${score.toFixed(1)}% (Exploratory)`,
        coverage: 0.45,
        confidence: "moderate",
        isReliable: true,
        weightedDistance: 0.216,
        missingFeatures: ["rockAbundancePct"],
        incompatibleFeatures: ["surfacePressurePa"],
        featureScores: [],
        explanation: "Test",
        warnings: [],
      },
    ],
    warnings: [],
    executionTimeMs: 120,
  }
}

/**
 * Lightweight Upstash REST HTTP server for local automated multi-process verification.
 * Supports GET, MGET, SET (with EX), DEL, and @upstash/ratelimit EVALSHA/EVAL sliding-window.
 */
function startLocalUpstashRestServer(expectedToken = "test-secret-token") {
  const kv = new Map()
  const rlCounts = new Map()

  const readVal = (key) => {
    const rec = kv.get(key)
    if (!rec) return null
    if (rec.expiresAt !== null && Date.now() > rec.expiresAt) {
      kv.delete(key)
      return null
    }
    return rec.value
  }

  const handleCmd = (cmdArr) => {
    if (!Array.isArray(cmdArr) || cmdArr.length === 0) return null
    const op = String(cmdArr[0]).toLowerCase()
    if (op === "get") {
      return readVal(String(cmdArr[1]))
    }
    if (op === "mget") {
      return cmdArr.slice(1).map((k) => readVal(String(k)))
    }
    if (op === "set") {
      const key = String(cmdArr[1])
      const value = typeof cmdArr[2] === "string" ? cmdArr[2] : JSON.stringify(cmdArr[2])
      let expiresAt = null
      for (let i = 3; i < cmdArr.length; i++) {
        if (String(cmdArr[i]).toUpperCase() === "EX" && cmdArr[i + 1] !== undefined) {
          expiresAt = Date.now() + Number(cmdArr[i + 1]) * 1000
        }
      }
      kv.set(key, { value, expiresAt })
      return "OK"
    }
    if (op === "del") {
      let n = 0
      for (const k of cmdArr.slice(1)) {
        if (kv.delete(String(k))) n++
      }
      return n
    }
    if (op === "evalsha" || op === "eval") {
      // @upstash/ratelimit slidingWindow args:
      // [op, sha/script, numKeys(2), currentKey, prevKey, maxTokens, nowMs, windowMs, increment]
      const currentKey = String(cmdArr[3])
      const prevKey = String(cmdArr[4])
      const maxTokens = Number(cmdArr[5])
      const nowMs = Number(cmdArr[6])
      const windowMs = Number(cmdArr[7])
      const increment = Number(cmdArr[8] ?? 1)

      const curCount = Number(rlCounts.get(currentKey) ?? 0)
      const prevCount = Number(rlCounts.get(prevKey) ?? 0)
      const elapsedInWindow = nowMs % windowMs
      const prevWeight = Math.max(0, (windowMs - elapsedInWindow) / windowMs)
      const estimatedBefore = Math.floor(prevCount * prevWeight) + curCount
      const remainingBefore = maxTokens - estimatedBefore

      if (remainingBefore <= 0) {
        return [-1, maxTokens]
      }
      const nextCount = curCount + increment
      rlCounts.set(currentKey, nextCount)
      return [maxTokens - (Math.floor(prevCount * prevWeight) + nextCount), maxTokens]
    }
    return null
  }

  const server = http.createServer((req, res) => {
    const auth = req.headers.authorization || ""
    if (auth !== `Bearer ${expectedToken}`) {
      res.statusCode = 401
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ error: "Unauthorized" }))
      return
    }
    let body = ""
    req.on("data", (c) => {
      body += c
    })
    req.on("end", () => {
      res.setHeader("content-type", "application/json")
      try {
        const parsed = body ? JSON.parse(body) : []
        if (req.url?.includes("/pipeline")) {
          const results = parsed.map((cmd) => ({ result: handleCmd(cmd) }))
          res.end(JSON.stringify(results))
        } else {
          res.end(JSON.stringify({ result: handleCmd(parsed) }))
        }
      } catch (e) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: e.message }))
      }
    })
  })

  return {
    kv,
    rlCounts,
    start: () =>
      new Promise((resolveStart) => {
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address()
          resolveStart(`http://127.0.0.1:${addr.port}`)
        })
      }),
    close: () => new Promise((resolveClose) => server.close(() => resolveClose())),
  }
}

test("1. Configuration safety: missing, partial, insecure http blocked in prod, zero token leakage", async () => {
  const prev = saveAndClearRedisEnv()
  try {
    process.env.NODE_ENV = "development"
    delete process.env.VERCEL
    resetRedisClientForTesting()
    resetRateLimitersForTesting()

    // Unconfigured in dev -> clean local dev fallback (20 req / 60s)
    const missingRes = resolveSharedRedis()
    assert.strictEqual(missingRes.status, "missing")
    assert.strictEqual(missingRes.redis, null)

    const devDec = await checkDiscoverRateLimit("ip:198.51.100.1")
    assert.strictEqual(devDec.allowed, true)
    assert.strictEqual(devDec.mode, "local-dev-memory-fallback")
    assert.strictEqual(devDec.limit, 20)
    assert.strictEqual(devDec.remaining, 19)

    // Partial configuration (URL only, no TOKEN)
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io"
    const partialRes = resolveSharedRedis()
    assert.strictEqual(partialRes.status, "partial-or-invalid")
    assert.strictEqual(partialRes.redis, null)

    // Insecure http:// blocked in strict Vercel/prod
    process.env.UPSTASH_REDIS_REST_URL = "http://insecure.example.com"
    process.env.UPSTASH_REDIS_REST_TOKEN = "super-secret-value-never-exposed"
    process.env.VERCEL = "1"
    const prodInsecure = resolveSharedRedis()
    assert.strictEqual(prodInsecure.status, "partial-or-invalid")
    assert.strictEqual(prodInsecure.redis, null)
    assert.ok(!String(prodInsecure.reason).includes("super-secret-value-never-exposed"))

    // HTTPS valid config resolves cleanly (and KV_REST_API alias works)
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    process.env.KV_REST_API_URL = "https://alias-db.upstash.io"
    process.env.KV_REST_API_TOKEN = "alias-token-123"
    const aliasRes = resolveSharedRedis()
    assert.strictEqual(aliasRes.status, "configured")
    assert.ok(aliasRes.redis !== null)
    assert.strictEqual(aliasRes.origin, "https://alias-db.upstash.io")

    // Client identifier normalization preserves header precedence cleanly
    assert.strictEqual(
      extractClientIdentifier(new Headers({ "x-vercel-forwarded-for": "192.0.2.10, 10.0.0.1" })),
      "ip:192.0.2.10"
    )
  } finally {
    restoreEnv(prev)
  }
})

test("2. Production Redis failure/timeout safety: never disables protection (degraded & fail-closed)", async () => {
  const prev = saveAndClearRedisEnv()
  try {
    process.env.NODE_ENV = "production"
    process.env.VERCEL = "1"
    process.env.UPSTASH_REDIS_REST_URL = "https://unreachable.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "prod-token"
    process.env.TERRATWIN_REDIS_FAIL_MODE = "degraded-memory"
    resetRedisClientForTesting()
    resetRateLimitersForTesting()

    // Mock Redis client that ALWAYS throws (simulating outage)
    setTestRedisClientOverride({
      get: async () => {
        throw new Error("ECONNREFUSED")
      },
      mget: async () => {
        throw new Error("ECONNREFUSED")
      },
      set: async () => {
        throw new Error("ECONNREFUSED")
      },
      del: async () => 0,
      evalsha: async () => {
        throw new Error("ECONNREFUSED")
      },
      eval: async () => {
        throw new Error("ECONNREFUSED")
      },
    })

    // First EMERGENCY_FALLBACK_MAX_REQUESTS (10) succeed under degraded mode; 11th BLOCKED
    for (let i = 0; i < EMERGENCY_FALLBACK_MAX_REQUESTS; i++) {
      const d = await checkDiscoverRateLimit("ip:203.0.113.55")
      assert.strictEqual(d.allowed, true)
      assert.strictEqual(d.mode, "production-degraded-memory-fallback")
      assert.strictEqual(d.limit, EMERGENCY_FALLBACK_MAX_REQUESTS)
    }
    const blocked = await checkDiscoverRateLimit("ip:203.0.113.55")
    assert.strictEqual(blocked.allowed, false)
    assert.strictEqual(blocked.mode, "production-degraded-memory-fallback")
    assert.ok(blocked.retryAfterSec >= 1)

    // Now verify explicit fail-closed mode returns serviceUnavailable: true -> HTTP 503
    process.env.TERRATWIN_REDIS_FAIL_MODE = "fail-closed"
    resetRateLimitersForTesting()
    const fc = await checkDiscoverRateLimit("ip:203.0.113.99")
    assert.strictEqual(fc.allowed, false)
    assert.strictEqual(fc.serviceUnavailable, true)
    assert.strictEqual(fc.mode, "fail-closed-redis-unavailable")
  } finally {
    restoreEnv(prev)
  }
})

test("3. Cache integrity: SHA-256 keys, payload size cap, incomplete & corrupt entry rejection", async () => {
  const prev = saveAndClearRedisEnv()
  const mockStore = new Map()
  try {
    process.env.NODE_ENV = "test"
    resetRedisClientForTesting()
    setTestRedisClientOverride({
      get: async (k) => mockStore.get(k) ?? null,
      mget: async (...ks) => ks.map((k) => mockStore.get(k) ?? null),
      set: async (k, v) => {
        mockStore.set(k, v)
        return "OK"
      },
      del: async (...ks) => {
        ks.forEach((k) => mockStore.delete(k))
        return ks.length
      },
      evalsha: async () => [19, 20],
      eval: async () => [19, 20],
    })

    // Deterministic key hashing
    const k1 = computeDeterministicRedisKey("terratwin:v1:cache:discover-resp", "long-scientific-key-A", true)
    const k2 = computeDeterministicRedisKey("terratwin:v1:cache:discover-resp", "long-scientific-key-A", true)
    assert.strictEqual(k1, k2)
    assert.ok(k1.length < 110)

    // Partial provider response MUST be rejected by validateEntry and never cached
    const partialResp = makeHealthyDiscoveryResponse()
    partialResp.providerStatuses[1].status = "partial"
    assert.strictEqual(isValidDiscoveryResponseCacheRecord(partialResp), false)
    discoveryResponseCache.clear()
    const wrotePartial = await discoveryResponseCache.setAsync("partial_key", partialResp)
    assert.strictEqual(wrotePartial, false)
    assert.strictEqual(mockStore.size, 0, "Incomplete provider response must not enter Redis")

    // Corrupt string sitting in Redis must never be served as cache hit
    const corruptRedisKey = computeDeterministicRedisKey("terratwin:v1:cache:discover-resp", "corrupt_key", true)
    mockStore.set(corruptRedisKey, "{invalid-json")
    const corruptRead = await discoveryResponseCache.getAsync("corrupt_key")
    assert.strictEqual(corruptRead.value, undefined)

    // Oversized payload skips Redis cleanly without throwing
    const smallLimitCache = new DiscoveryCache(60_000, 50, {
      namespace: "terratwin:test:small",
      ttlSeconds: 60,
      maxPayloadBytes: 64,
    })
    const wroteBig = await smallLimitCache.setAsync("big", { data: "x".repeat(500) })
    assert.strictEqual(wroteBig, false)

    // Healthy discovery response within 512 KB succeeds
    assert.ok(RESPONSE_SHARED_CACHE_MAX_PAYLOAD_BYTES === 512_000)
    const healthy = makeHealthyDiscoveryResponse(81.5)
    const wroteHealthy = await discoveryResponseCache.setAsync("healthy_key", healthy)
    assert.strictEqual(wroteHealthy, true)
    // Clear L1 only -> must hit L2 mockStore!
    discoveryResponseCache.clear()
    const l2Read = await discoveryResponseCache.getAsync("healthy_key")
    assert.strictEqual(l2Read.cacheBackend, "upstash-redis")
    assert.strictEqual(l2Read.value?.candidates[0].score, 81.5)
  } finally {
    discoveryResponseCache.clear()
    elevationCache.clear()
    nasaPowerCache.clear()
    macrostratCache.clear()
    restoreEnv(prev)
  }
})

test("4. Multi-process verification (two separate Node OS processes sharing Upstash REST rate limits & cache)", async () => {
  const restSrv = startLocalUpstashRestServer("multi-proc-token")
  const restUrl = await restSrv.start()

  const runChildSnippet = (code) =>
    new Promise((resolveProc, rejectProc) => {
      const child = spawn(
        process.execPath,
        ["--input-type=module", "-e", code],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            NODE_ENV: "production",
            VERCEL: "0",
            UPSTASH_REDIS_REST_URL: restUrl,
            UPSTASH_REDIS_REST_TOKEN: "multi-proc-token",
            TERRATWIN_ALLOW_HTTP_REDIS_FOR_TEST: "1",
          },
          stdio: ["ignore", "pipe", "pipe"],
        }
      )
      let out = ""
      let err = ""
      child.stdout.on("data", (d) => (out += d))
      child.stderr.on("data", (d) => (err += d))
      child.on("close", (codeExit) => {
        if (codeExit !== 0) {
          rejectProc(new Error(`Child exited ${codeExit}: ${err}\nSTDOUT:${out}`))
        } else {
          resolveProc(JSON.parse(out.trim().split("\n").pop()))
        }
      })
    })

  try {
    // Process A: consume 12 of 20 rate limit tokens + populate shared discovery cache
    const resA = await runChildSnippet(`
      import { checkDiscoverRateLimit } from "./src/lib/terratwin/utils/rate-limiter.ts";
      import { discoveryResponseCache } from "./src/lib/terratwin/utils/discovery-cache.ts";
      const decisions = [];
      for (let i = 0; i < 12; i++) {
        decisions.push(await checkDiscoverRateLimit("ip:198.51.100.77"));
      }
      const mockHealthy = {
        success: true,
        searchMetadata: { boundingBox: [37, 29, 38, 30], targetId: "mars-jezero-delta", missionProfile: "Geo", gridSpacingDeg: 0.5, cellsGenerated: 1, cellsEvaluated: 1, maxCellsAllowed: 4, responseCacheHit: false },
        target: { id: "mars-jezero-delta", body: "mars", name: "Jezero" },
        missionProfile: { id: "geological-research", label: "Geo", summary: "s", statusNotice: "n", weights: {} },
        providerStatuses: [{ provider: "Open-Meteo", status: "success", dataset: "d", recordsFetched: 1, latencyMs: 1, spatialResolution: "90m", attributionNotice: "c" }],
        totalCellsEvaluated: 1, computableCandidatesCount: 1, insufficientDataCandidatesCount: 0,
        candidates: [{ rank: 1, score: 84.2, candidate: { id: "cell_shared", name: "Shared" } }],
        warnings: [], executionTimeMs: 10
      };
      const cacheResA = await discoveryResponseCache.getOrLoad("shared_proc_key_1", async () => mockHealthy);
      console.log(JSON.stringify({ lastDecision: decisions[11], allowedCount: decisions.filter(d => d.allowed).length, cacheResA: { hit: cacheResA.cacheHit, score: cacheResA.value.candidates[0].score } }));
    `)
    assert.strictEqual(resA.allowedCount, 12)
    assert.strictEqual(resA.lastDecision.mode, "upstash-redis")
    assert.strictEqual(resA.lastDecision.remaining, 8)
    assert.strictEqual(resA.cacheResA.hit, false)

    // Process B (completely separate process & memory): consume remaining 8 -> 9th request blocked! AND hit Process A's cache!
    const resB = await runChildSnippet(`
      import { checkDiscoverRateLimit } from "./src/lib/terratwin/utils/rate-limiter.ts";
      import { discoveryResponseCache } from "./src/lib/terratwin/utils/discovery-cache.ts";
      const decisions = [];
      for (let i = 0; i < 9; i++) {
        decisions.push(await checkDiscoverRateLimit("ip:198.51.100.77"));
      }
      let loaderCalled = false;
      const cacheResB = await discoveryResponseCache.getOrLoad("shared_proc_key_1", async () => {
        loaderCalled = true;
        return null;
      });
      const isolatedIp = await checkDiscoverRateLimit("ip:203.0.113.200");
      console.log(JSON.stringify({
        allowedInB: decisions.slice(0, 8).every(d => d.allowed),
        ninthBlocked: decisions[8].allowed === false,
        ninthMode: decisions[8].mode,
        isolatedAllowed: isolatedIp.allowed && isolatedIp.remaining === 19,
        cacheHitInB: cacheResB.cacheHit,
        cacheBackend: cacheResB.cacheBackend,
        scoreInB: cacheResB.value.candidates[0].score,
        loaderCalled
      }));
    `)

    assert.strictEqual(resB.allowedInB, true, "Requests 13-20 from Process B should succeed")
    assert.strictEqual(resB.ninthBlocked, true, "Request 21 across processes A+B must be rate-limited!")
    assert.strictEqual(resB.ninthMode, "upstash-redis")
    assert.strictEqual(resB.isolatedAllowed, true, "Other IPs stay unaffected across processes")
    assert.strictEqual(resB.cacheHitInB, true, "Process B must hit Process A shared Redis cache")
    assert.strictEqual(resB.cacheBackend, "upstash-redis")
    assert.strictEqual(resB.scoreInB, 84.2)
    assert.strictEqual(resB.loaderCalled, false, "Process B must NOT invoke loader on shared cache hit")
  } finally {
    await restSrv.close()
  }
})

test("5. Live two-process Next.js `next start` workers share distributed 20 req/60s HTTP 429 rate limit", async (t) => {
  if (!existsSync(resolve(process.cwd(), ".next", "BUILD_ID"))) {
    t.skip(".next production build not present yet")
    return
  }

  const restSrv = startLocalUpstashRestServer("next-multi-token")
  const restUrl = await restSrv.start()
  const nextCli = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next")

  const startWorker = (port) =>
    new Promise((resolveReady, rejectReady) => {
      const proc = spawn(process.execPath, [nextCli, "start", "-p", String(port), "-H", "127.0.0.1"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "production",
          VERCEL: "0",
          UPSTASH_REDIS_REST_URL: restUrl,
          UPSTASH_REDIS_REST_TOKEN: "next-multi-token",
          TERRATWIN_ALLOW_HTTP_REDIS_FOR_TEST: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      })
      const timer = setTimeout(() => {
        proc.kill()
        rejectReady(new Error(`Next worker ${port} failed to boot in 15s`))
      }, 15000)
      const onOut = (chunk) => {
        if (String(chunk).includes("Ready")) {
          clearTimeout(timer)
          resolveReady(proc)
        }
      }
      proc.stdout.on("data", onOut)
      proc.stderr.on("data", onOut)
    })

  let w1
  let w2
  try {
    w1 = await startWorker(3101)
    w2 = await startWorker(3102)

    const sendDiscover = (port, clientIp) =>
      fetch(`http://127.0.0.1:${port}/api/discover`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify([]), // triggers deterministic fast 400 AFTER rate limiter runs
      })

    // Send 12 requests to Next worker 1 + 8 requests to Next worker 2
    for (let i = 0; i < 12; i++) {
      const r = await sendDiscover(3101, "198.51.100.42")
      assert.strictEqual(r.status, 400)
      assert.strictEqual(r.headers.get("x-ratelimit-mode"), "upstash-redis")
    }
    for (let i = 0; i < 8; i++) {
      const r = await sendDiscover(3102, "198.51.100.42")
      assert.strictEqual(r.status, 400)
      assert.strictEqual(r.headers.get("x-ratelimit-mode"), "upstash-redis")
    }

    // 21st request to Worker 2 must return HTTP 429 from shared Upstash Redis counter
    const blocked = await sendDiscover(3102, "198.51.100.42")
    assert.strictEqual(blocked.status, 429)
    assert.strictEqual(blocked.headers.get("x-ratelimit-mode"), "upstash-redis")
    assert.ok(Number(blocked.headers.get("retry-after")) >= 1)
    const errBody = await blocked.json()
    assert.strictEqual(errBody.error?.code, "RATE_LIMIT_EXCEEDED")
    assert.strictEqual(errBody.error?.details?.scope, "distributed-upstash-redis")
  } finally {
    w1?.kill()
    w2?.kill()
    await restSrv.close()
  }
})
