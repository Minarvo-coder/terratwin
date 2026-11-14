import { Ratelimit } from "@upstash/ratelimit"
import type { Redis } from "@upstash/redis"
import {
  logRedisWarningOnce,
  resolveSharedRedis,
  withRedisTimeout,
  type RedisFailMode,
} from "./redis-client.ts"

/**
 * Distributed Upstash Redis + Safe In-Memory Fallback Rate Limiter for `/api/discover`.
 *
 * Policy:
 * - Standard limit: 20 discovery requests per 60-second sliding window per client IP.
 * - Distributed mode (`upstash-redis`): Uses `@upstash/ratelimit` sliding window backed
 *   by shared Upstash Redis across all serverless Vercel functions / worker processes.
 * - Local development fallback (`local-dev-memory-fallback`): When Upstash env vars are
 *   not set in non-production dev/test environments, enforces the 20 req / 60s window
 *   in local process memory.
 * - Production unavailability safeguard (Requirement 7): Never silently disables rate
 *   limiting (`{ allowed: true }` without counting) if Redis fails or is missing in
 *   production. Depending on `TERRATWIN_REDIS_FAIL_MODE`:
 *   - `"degraded-memory"` (default): Engages an active emergency per-instance limiter
 *     with a tighter `EMERGENCY_FALLBACK_MAX_REQUESTS = 10` per 60s ceiling and emits an
 *     explicit degraded header & warning.
 *   - `"fail-closed"`: Returns `serviceUnavailable: true` (HTTP 503) while Redis is down.
 */

export const DISCOVER_RATE_LIMIT_WINDOW_MS = 60_000
export const DISCOVER_RATE_LIMIT_MAX_REQUESTS = 20
export const EMERGENCY_FALLBACK_MAX_REQUESTS = 10
export const DISCOVER_RATE_LIMIT_PREFIX = "terratwin:v1:rl:discover"

export type RateLimitMode =
  | "upstash-redis"
  | "local-dev-memory-fallback"
  | "production-degraded-memory-fallback"
  | "fail-closed-redis-unavailable"

export interface RateLimitDecision {
  allowed: boolean
  limit: number
  remaining: number
  resetAtMs: number
  retryAfterSec: number
}

export interface DistributedRateLimitDecision extends RateLimitDecision {
  mode: RateLimitMode
  scope: string
  redisAvailable: boolean
  serviceUnavailable?: boolean
  degradedReason?: string
  failModeApplied?: RedisFailMode
}

export class SlidingWindowRateLimiter {
  private buckets = new Map<string, number[]>()
  private readonly windowMs: number
  private readonly maxRequests: number
  private readonly maxKeys: number

  constructor(windowMs: number = 60_000, maxRequests: number = 20, maxKeys: number = 2000) {
    this.windowMs = Math.max(1000, windowMs)
    this.maxRequests = Math.max(1, maxRequests)
    this.maxKeys = Math.max(10, maxKeys)
  }

  public check(key: string, nowMs: number = Date.now()): RateLimitDecision {
    const windowStart = nowMs - this.windowMs
    const existing = this.buckets.get(key) ?? []
    const active = existing.filter((ts) => ts > windowStart)

    if (active.length >= this.maxRequests) {
      this.buckets.set(key, active)
      const oldestInWindow = active[0] ?? nowMs
      const resetAtMs = oldestInWindow + this.windowMs
      const retryAfterSec = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000))
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetAtMs,
        retryAfterSec,
      }
    }

    if (this.buckets.size >= this.maxKeys && !this.buckets.has(key)) {
      const oldestKey = this.buckets.keys().next().value
      if (oldestKey !== undefined) {
        this.buckets.delete(oldestKey)
      }
    }

    active.push(nowMs)
    this.buckets.set(key, active)

    const oldestInWindow = active[0] ?? nowMs
    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - active.length),
      resetAtMs: oldestInWindow + this.windowMs,
      retryAfterSec: 0,
    }
  }

  public clear(): void {
    this.buckets.clear()
  }
}

function sanitizeClientToken(rawIp: string): string {
  const cleaned = rawIp.trim().replace(/[^a-zA-Z0-9.:_-]/g, "").slice(0, 64)
  return cleaned || "local-fallback"
}

export function extractClientIdentifier(headers: Headers): string {
  const vercelXff = headers.get("x-vercel-forwarded-for")
  if (vercelXff) {
    const firstIp = vercelXff.split(",")[0]?.trim()
    if (firstIp) return `ip:${sanitizeClientToken(firstIp)}`
  }
  const xff = headers.get("x-forwarded-for")
  if (xff) {
    const firstIp = xff.split(",")[0]?.trim()
    if (firstIp) return `ip:${sanitizeClientToken(firstIp)}`
  }
  const realIp = headers.get("x-real-ip")?.trim()
  if (realIp) return `ip:${sanitizeClientToken(realIp)}`
  return "ip:local-fallback"
}

// Local development / unit fallback rate limiter (20 req / 60s)
export const discoverRouteRateLimiter = new SlidingWindowRateLimiter(
  DISCOVER_RATE_LIMIT_WINDOW_MS,
  DISCOVER_RATE_LIMIT_MAX_REQUESTS
)

// Tighter per-instance emergency safeguard engaged during production Redis outages (10 req / 60s)
export const emergencyFallbackRateLimiter = new SlidingWindowRateLimiter(
  DISCOVER_RATE_LIMIT_WINDOW_MS,
  EMERGENCY_FALLBACK_MAX_REQUESTS
)

let cachedRatelimitClientRef: Redis | null = null
let cachedUpstashRatelimiter: Ratelimit | null = null

function getOrCreateUpstashRatelimiter(redis: Redis): Ratelimit {
  if (cachedUpstashRatelimiter && cachedRatelimitClientRef === redis) {
    return cachedUpstashRatelimiter
  }
  cachedRatelimitClientRef = redis
  cachedUpstashRatelimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(DISCOVER_RATE_LIMIT_MAX_REQUESTS, "60 s"),
    prefix: DISCOVER_RATE_LIMIT_PREFIX,
    ephemeralCache: false,
    analytics: false,
    enableTelemetry: false,
  })
  return cachedUpstashRatelimiter
}

export function resetRateLimitersForTesting(): void {
  discoverRouteRateLimiter.clear()
  emergencyFallbackRateLimiter.clear()
  cachedRatelimitClientRef = null
  cachedUpstashRatelimiter = null
}

function buildFallbackDecision(
  clientKey: string,
  opts: {
    isStrictProduction: boolean
    failMode: RedisFailMode
    reason: string
    isRuntimeOutage: boolean
  }
): DistributedRateLimitDecision {
  // In explicit production outage with fail-closed configured, deny cleanly with 503
  if (opts.isStrictProduction && opts.failMode === "fail-closed") {
    const nowMs = Date.now()
    return {
      allowed: false,
      limit: DISCOVER_RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      resetAtMs: nowMs + DISCOVER_RATE_LIMIT_WINDOW_MS,
      retryAfterSec: 60,
      mode: "fail-closed-redis-unavailable",
      scope: "fail-closed-redis-unavailable",
      redisAvailable: false,
      serviceUnavailable: true,
      degradedReason: opts.reason,
      failModeApplied: "fail-closed",
    }
  }

  // Production degraded fallback enforces tighter emergency limit (10 req / 60s per instance)
  if (opts.isStrictProduction || opts.isRuntimeOutage) {
    const decision = emergencyFallbackRateLimiter.check(clientKey)
    return {
      ...decision,
      mode: "production-degraded-memory-fallback",
      scope: "production-degraded-in-memory",
      redisAvailable: false,
      degradedReason: opts.reason,
      failModeApplied: "degraded-memory",
    }
  }

  // Local development fallback keeps standard 20 req / 60s policy in process memory
  const decision = discoverRouteRateLimiter.check(clientKey)
  return {
    ...decision,
    mode: "local-dev-memory-fallback",
    scope: "local-dev-in-memory",
    redisAvailable: false,
    degradedReason: opts.reason,
  }
}

/**
 * Evaluates `/api/discover` rate limiting across shared Upstash Redis when configured,
 * falling back cleanly in local development and safely degrading (never disabling
 * protection) if Redis is missing or unavailable in production.
 */
export async function checkDiscoverRateLimit(
  clientKey: string
): Promise<DistributedRateLimitDecision> {
  const resolution = resolveSharedRedis()

  if (!resolution.redis) {
    const reason =
      resolution.reason ?? "Upstash Redis credentials are not configured; using in-memory fallback."
    if (resolution.isStrictProduction) {
      logRedisWarningOnce(
        "ratelimit-prod-missing",
        `[TerraTwin RateLimit] ${reason} Engaging safe protection (${resolution.failMode}).`
      )
    } else {
      logRedisWarningOnce(
        "ratelimit-dev-fallback",
        "[TerraTwin RateLimit] Using local in-memory rate limiter (20 req/60s). Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for shared Vercel throttling."
      )
    }
    return buildFallbackDecision(clientKey, {
      isStrictProduction: resolution.isStrictProduction,
      failMode: resolution.failMode,
      reason,
      isRuntimeOutage: false,
    })
  }

  try {
    const limiter = getOrCreateUpstashRatelimiter(resolution.redis)
    const result = await withRedisTimeout(() => limiter.limit(clientKey))

    if (result.reason === "timeout") {
      throw new Error("Upstash Ratelimit reported internal timeout reason")
    }

    const nowMs = Date.now()
    const resetAtMs =
      typeof result.reset === "number" && Number.isFinite(result.reset) && result.reset > nowMs
        ? result.reset
        : nowMs + DISCOVER_RATE_LIMIT_WINDOW_MS
    const retryAfterSec = result.success
      ? 0
      : Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000))

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: Math.max(0, result.remaining),
      resetAtMs,
      retryAfterSec,
      mode: "upstash-redis",
      scope: "distributed-upstash-redis",
      redisAvailable: true,
    }
  } catch (err) {
    const safeMsg = err instanceof Error ? err.message : "Unknown Redis failure"
    console.error(
      `[TerraTwin RateLimit] Distributed Upstash check failed (${safeMsg}). Engaging safe ${resolution.failMode} protection.`
    )
    return buildFallbackDecision(clientKey, {
      isStrictProduction: resolution.isStrictProduction || process.env.VERCEL === "1",
      failMode: resolution.failMode,
      reason: `Upstash Redis error: ${safeMsg}`,
      isRuntimeOutage: true,
    })
  }
}
