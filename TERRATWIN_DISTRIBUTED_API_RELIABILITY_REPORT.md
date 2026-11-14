# TerraTwin — Distributed API Reliability Upgrade Report

## 1. Executive Summary

TerraTwin's Regional Discovery endpoint (`POST /api/discover`) previously relied on process-local Node.js memory for both sliding-window rate limiting and short-lived caching. On a serverless platform such as **Vercel**, separate function instances and cold starts maintain isolated in-memory state, allowing parallel requests to bypass per-IP throttling and causing repeated external environmental API lookups.

This upgrade introduces **Upstash Redis** (`@upstash/redis` and `@upstash/ratelimit`) as a shared distributed backend across all serverless instances while preserving:

- All existing scientific scoring math, mission-profile weights, 40% minimum coverage gates, provenance metadata, and the `100`-cell maximum per discovery request.
- Clear local development fallback behavior when Upstash credentials are not configured.
- Defensive production safeguards that **never silently disable rate-limiting protection** if Redis is misconfigured, unreachable, or timing out.
- Strict cache integrity rules preventing incomplete (`partial` or `failed`) environmental provider responses or oversized payloads from polluting shared Redis caches.

---

## 2. Architecture: Before vs. After

| Capability | Previous Implementation | Upgraded Distributed Implementation |
| --- | --- | --- |
| **Rate Limiting (`POST /api/discover`)** | Process-local `SlidingWindowRateLimiter` (`Map` per Node instance) | Shared `Ratelimit.slidingWindow(20, "60 s")` backed by `@upstash/redis` under prefix `terratwin:v1:rl:discover` |
| **Client IP Identification** | `x-forwarded-for`, `x-real-ip` | Added `x-vercel-forwarded-for` support in `extractClientIdentifier()` alongside existing headers |
| **Discovery Caching** | Process-local `DiscoveryCache` LRU only | Two-tier **L1 (in-memory LRU)** + **L2 (Upstash Redis REST)** cache with deterministic SHA-256 response keys |
| **External Connector Caching** | Process-local `elevationCache`, `nasaPowerCache`, `macrostratCache` | Async batch `mgetAsync()` / `setAsync()` and coalesced `getOrLoad()` shared across instances (`3600 s` TTL) |
| **Full Response Caching** | Process-local `discoveryResponseCache` | L1 + L2 shared cache (`900 s` TTL, `512,000` byte cap), populated **only** when `allProvidersHealthy` is true |
| **Local Dev Without Redis** | Process-local memory | Documented fallback: `20 req / 60s` (`local-memory-fallback`) + L1 cache in non-production |
| **Production Redis Outage / Misconfig** | N/A | Bounded `2500 ms` timeout; defaults to tighter per-instance **degraded-memory protection** (`10 req / 60s`) or **fail-closed HTTP 503** |

---

## 3. Security & Reliability Safeguards Implemented

### 3.1 Redis Configuration & Transport Safety (`src/lib/terratwin/utils/redis-client.ts`)
- Resolves `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (with fallback support for Vercel KV aliases `KV_REST_API_URL` and `KV_REST_API_TOKEN`).
- Requires **both** URL and token to be present together; partial configs are rejected with diagnostic logging.
- Enforces `https://` URLs at runtime (`http://` is rejected everywhere except explicit loopback local verification with `TERRATWIN_ALLOW_HTTP_REDIS_FOR_TEST=1` outside `VERCEL=1`).
- Logs only parsed origin URLs and error types — tokens and secret credentials are never logged.
- Enforces a bounded `REDIS_OPERATION_TIMEOUT_MS = 2500` timeout via `withRedisTimeout()`.

### 3.2 Distributed Rate Limiting (`src/lib/terratwin/utils/rate-limiter.ts` & `src/app/api/discover/route.ts`)
- Retains the **20 requests per 60 seconds** sliding window policy (`DISCOVER_RATE_LIMIT_MAX_REQUESTS = 20`, `DISCOVER_RATE_LIMIT_WINDOW_MS = 60_000`) via `checkDiscoverRateLimit()`.
- Explicitly sets `ephemeralCache: false` and uses `withRedisTimeout()` so hung network calls cannot silently fail open.
- **Zero silent bypass in production**: if Upstash Redis fails or is missing in production:
  - Default `"degraded-memory"` mode enforces a stricter `EMERGENCY_FALLBACK_MAX_REQUESTS = 10` requests per 60 seconds per instance (`X-RateLimit-Mode: production-degraded-memory-fallback`).
  - Setting `TERRATWIN_REDIS_FAIL_MODE="fail-closed"` returns HTTP `503` (`RATE_LIMIT_BACKEND_UNAVAILABLE`) with `Retry-After` (`X-RateLimit-Mode: fail-closed-unavailable`).
- Every `/api/discover` response (including `200`, `400`, `404`, `429`, and `500`) emits:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `X-RateLimit-Mode`
- `200` responses also emit `X-TerraTwin-Cache: HIT | MISS`.

### 3.3 Shared Discovery Cache Integrity (`src/lib/terratwin/utils/discovery-cache.ts`)
- **Deterministic Key Hashing**: `computeDeterministicRedisKey()` uses SHA-256 hashing for long or full-response keys (`discoveryResponseCache`).
- **Bounded Payloads**: `RESPONSE_SHARED_CACHE_MAX_PAYLOAD_BYTES = 512_000` bytes (response cache) and `DEFAULT_SHARED_CACHE_MAX_PAYLOAD_BYTES = 16_384` bytes (connector cell caches). Oversized values are skipped safely.
- **No Incomplete Data Cached**:
  - `discoveryResponseCache` only stores responses when `allProvidersHealthy` is `true` and validates records before returning them.
  - `elevationCache`, `nasaPowerCache`, and `macrostratCache` skip or reject `partial`/`failed`/empty entries.
  - Corrupt JSON in Redis is safely ignored as a cache miss without crashing requests.
- **Clean Test Isolation**: Connectors and `discovery-engine.ts` pass `{ useSharedRedis: !options.fetchFn }`, ensuring unit tests injecting mock `fetchFn` handlers never read or pollute external Redis instances.

---

## 4. Beginner Step-by-Step Guide: Setting Up Upstash Redis & Vercel (Zero Secrets Exposed)

### Step 1 — Create a Free Upstash Redis Database
1. Go to [https://console.upstash.com/](https://console.upstash.com/) and create a free account (or sign in).
2. Click **Create Database**.
3. Give it a name such as `terratwin-prod` (or `terratwin-dev` if separating dev/prod).
4. Choose **Type**: **Regional** (or Global) — pick the region closest to your Vercel Serverless Function region (for example, `us-east-1` / Washington, D.C., which matches Vercel's default `iad1`).
5. Click **Create**.

### Step 2 — Copy Only the REST Credentials (Never Commit Them)
1. Open your newly created database in the Upstash Console.
2. Scroll to the **REST API** section (next to Redis CLI / SDK tabs).
3. Copy these two values:
   - `UPSTASH_REDIS_REST_URL` (starts with `https://...upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (secret bearer token — treat this like a password)

### Step 3 — Configure Your Local Machine (`.env.local`)
1. Open `.env.local` in the root of your TerraTwin project (create it if it does not exist; `.gitignore` already excludes `.env.local` from Git).
2. Check `.env.example` for reference variable names, then add your values to `.env.local`:

```env
UPSTASH_REDIS_REST_URL="https://YOUR-DATABASE-ENDPOINT.upstash.io"
UPSTASH_REDIS_REST_TOKEN="YOUR-SECRET-REST-TOKEN"
# Optional: "degraded-memory" (default, enforces 10 req/60s on Redis failure) or "fail-closed" (HTTP 503)
TERRATWIN_REDIS_FAIL_MODE="degraded-memory"
```

> **Never commit `.env.local` or paste real tokens into source files, markdown docs, Git commits, or screenshots.**
> If you omit these two variables locally while running `npm run dev`, TerraTwin automatically uses its documented local fallback (`20 req/60s` in-memory limiter + L1 cache).

### Step 4 — Configure Environment Variables in Vercel
1. Open your TerraTwin project in the [Vercel Dashboard](https://vercel.com/dashboard).
2. Go to **Settings** → **Environment Variables**.
3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (select **Production** and **Preview**, and optionally **Development**).
4. Recommended: add `TERRATWIN_REDIS_FAIL_MODE` set to `degraded-memory` (or `fail-closed` if you prefer strict outage rejection).
5. Save and trigger a **Redeploy** so your running serverless functions pick up the new environment variables.

> **Alternative Vercel Marketplace Shortcut**: If you install the official **Upstash Redis** integration from the Vercel Marketplace and link it to your project, Vercel populates `KV_REST_API_URL` / `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. TerraTwin's `redis-client.ts` recognizes both naming conventions automatically.

### Step 5 — How to Verify It Is Working After Deployment
1. Open your deployed `/discover` page or send a `POST /api/discover` request (you can also inspect network response headers in Browser DevTools → **Network** tab → click the `discover` request → **Headers**).
2. Confirm these response headers appear:
   - `X-RateLimit-Mode: upstash-redis`
   - `X-RateLimit-Limit: 20`
   - `X-RateLimit-Remaining: <19 down to 0>`
   - `X-TerraTwin-Cache: MISS` on the first identical scan, followed by `X-TerraTwin-Cache: HIT` on a second identical scan within 15 minutes (`900 s`).

---

## 5. Modified & Added Files Inventory

| File | Role |
| --- | --- |
| `package.json` / `package-lock.json` | Added `@upstash/redis@^1.41.0` and `@upstash/ratelimit@^2.2.1` |
| `.env.example` | Added non-secret Upstash REST configuration template |
| `src/lib/terratwin/utils/redis-client.ts` | New shared Upstash Redis client resolver, HTTPS/completeness validation, bounded `2500 ms` timeout, and fail-mode handling |
| `src/lib/terratwin/utils/rate-limiter.ts` | Upgraded to shared Upstash sliding-window rate limiter (`checkDiscoverRateLimit`) with emergency `10 req/60s` production degraded fallback & `503` fail-closed mode |
| `src/lib/terratwin/utils/discovery-cache.ts` | Upgraded `DiscoveryCache` to L1 LRU + L2 Upstash Redis with SHA-256 key hashing, `512,000` / `16,384` byte payload limits, batch `mgetAsync`/`setAsync`, and incomplete-response rejection |
| `src/lib/terratwin/connectors/elevation-connector.ts` | Connected to shared `elevationCache` (`mgetAsync` / `setAsync`, bypassed when mock `fetchFn` is injected) |
| `src/lib/terratwin/connectors/nasa-power-connector.ts` | Connected to shared `nasaPowerCache` (`mgetAsync` / `getOrLoad`, bypassed when mock `fetchFn` is injected) |
| `src/lib/terratwin/connectors/macrostrat-connector.ts` | Connected to shared `macrostratCache` (`mgetAsync` / `getOrLoad`, bypassed when mock `fetchFn` is injected) |
| `src/lib/terratwin/services/discovery-engine.ts` | Integrated async shared `discoveryResponseCache.getOrLoad()` while preserving `allProvidersHealthy` check and mock test isolation |
| `src/app/api/discover/route.ts` | Wired `await checkDiscoverRateLimit()`, HTTP `503` fail-closed handling, `429` handling, and `X-RateLimit-*` / `X-TerraTwin-Cache` response headers |
| `src/components/discover/discovery-config-panel.tsx` | Updated client rate-limit notice text for shared Upstash Redis + bounded local fallback |
| `scripts/test-phase6-step3-1-hardening.mjs` | Updated rate-limiter route contract assertion for `checkDiscoverRateLimit` |
| `scripts/test-distributed-redis-reliability.mjs` | New 5-part distributed reliability verification suite including two-process Node & live `next start` multi-worker tests |

---

## 6. Post-Edit Verification Results

All checks below ran cleanly after the final code edit and fresh production build:

1. **TypeScript Typecheck (`npx tsc --noEmit`)**: Passed (exit code `0`).
2. **ESLint (`npm run lint`)**: Passed with `0` errors (`46` pre-existing unused-variable warnings in untouched/script files).
3. **Production Build (`npm run build`)**: Passed (exit code `0`, Next.js `16.4.3` Turbopack).
4. **Distributed Upstash Reliability Suite (`node --test scripts/test-distributed-redis-reliability.mjs`)**: **`5/5` passed, `0` failed, `0` skipped**:
   - Check 1: Configuration safety (missing config fallback, incomplete config rejection, HTTPS enforcement in prod, zero token leakage in logs).
   - Check 2: Production Redis failure/timeout safety (`degraded-memory` 10-req cap and `fail-closed` 503 unavailability).
   - Check 3: Cache integrity (SHA-256 deterministic response keys, payload byte caps, incomplete `partial`/`failed` rejection, corrupt JSON tolerance).
   - Check 4: Multi-process Node verification (two independent Node OS child processes sharing Upstash REST rate limits across `12 + 8 + 1` requests and sharing `discoveryResponseCache` hits without double-calling loader).
   - Check 5: Live two-process Next.js `next start` workers (`127.0.0.1:3101` and `127.0.0.1:3102`) sharing the `20 req/60s` sliding window and returning HTTP `429 RATE_LIMIT_EXCEEDED` with `x-ratelimit-mode: upstash-redis` on request #21.
5. **Phase 6 Scientific & Hardening Regression Suites (`128/128` checks passed, `0` failed, `0` skipped)**:
   - `scripts/test-phase6-step1-types-and-profiles.mjs`: `10/10` passed
   - `scripts/test-phase6-step2-discovery-atlas.mjs`: `17/17` passed
   - `scripts/test-phase6-step3-1-hardening.mjs`: `25/25` passed
   - `scripts/test-phase6-step3-live-discovery.mjs`: `21/21` passed
   - `scripts/test-phase6-step4-scanner-ui.mjs`: `36/36` passed
   - `scripts/test-phase6-step5-scientific-intelligence.mjs`: `7/7` passed
   - `scripts/test-phase6-step6-reports-and-workflow.mjs`: `6/6` passed
   - `scripts/test-phase6-step7-final-integration.mjs`: `6/6` passed
6. **Phase 3 & Phase 4 Master Suites (live `next start` on `127.0.0.1:3000`)**:
   - `scripts/test-phase3-master.mjs`: `12/12` passed
   - `scripts/test-phase4-master.mjs`: `5/5` passed
7. **Live Server Production Fallback Smoke Check (`127.0.0.1:3000` without Upstash env vars)**:
   - `GET /discover` returned HTTP `200`.
   - `POST /api/discover` returned `X-RateLimit-Mode: production-degraded-memory-fallback` and `X-RateLimit-Limit: 10`, confirming non-bypassable fallback throttling in production builds when Redis is unconfigured.
