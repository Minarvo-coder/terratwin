import { Redis } from "@upstash/redis"

/**
 * TerraTwin Shared Upstash Redis Client & Configuration Safety Guard
 *
 * Reads credentials exclusively from environment variables (never hardcoded):
 * - Preferred: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * - Vercel Marketplace KV alias fallback: KV_REST_API_URL + KV_REST_API_TOKEN
 *
 * Security & Reliability Guarantees:
 * - Tokens and credentialed URLs are NEVER logged or serialized into error messages.
 * - Production deployments reject non-HTTPS endpoints unless an explicit local
 *   loopback test flag (`TERRATWIN_ALLOW_HTTP_REDIS_FOR_TEST=1`) is used on localhost.
 * - All Redis network operations run behind bounded timeouts so an upstream Redis
 *   stall cannot hang `/api/discover` workers.
 */

export type RedisConfigStatus = "configured" | "missing" | "partial-or-invalid"
export type RedisFailMode = "degraded-memory" | "fail-closed"

export interface SharedRedisResolution {
  redis: Redis | null
  status: RedisConfigStatus
  origin?: string
  reason?: string
  isStrictProduction: boolean
  failMode: RedisFailMode
}

export interface RedisClientLike {
  get<TData = unknown>(key: string): Promise<TData | null>
  mget<TData = unknown[]>(...keys: string[]): Promise<TData>
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>
  del(...keys: string[]): Promise<number>
  evalsha(sha1: string, keys: string[], args: (string | number)[]): Promise<unknown>
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>
}

export const REDIS_OPERATION_TIMEOUT_MS = 2500

let cachedClientSignature: string | null = null
let cachedClientInstance: Redis | null = null
let lastLoggedWarningSignature: string | null = null
let testRedisClientOverride: RedisClientLike | null = null

function isLoopbackHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  return lower === "127.0.0.1" || lower === "localhost" || lower === "::1" || lower === "[::1]"
}

export function isStrictProductionRuntime(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.TERRATWIN_REQUIRE_REDIS === "1" ||
    process.env.TERRATWIN_REQUIRE_REDIS === "true" ||
    process.env.NODE_ENV === "production"
  )
}

export function getRedisFailMode(): RedisFailMode {
  const raw = (process.env.TERRATWIN_REDIS_FAIL_MODE ?? "").trim().toLowerCase()
  if (raw === "fail-closed") return "fail-closed"
  return "degraded-memory"
}

export function sanitizeRedisOriginOnly(rawUrl: string): string {
  try {
    return new URL(rawUrl).origin
  } catch {
    return "<invalid-url>"
  }
}

export function logRedisWarningOnce(signature: string, message: string): void {
  if (lastLoggedWarningSignature === signature) return
  lastLoggedWarningSignature = signature
  console.warn(message)
}

export function resetRedisClientForTesting(): void {
  cachedClientSignature = null
  cachedClientInstance = null
  lastLoggedWarningSignature = null
  testRedisClientOverride = null
}

export function setTestRedisClientOverride(client: RedisClientLike | null): void {
  testRedisClientOverride = client
}

export function resolveSharedRedis(): SharedRedisResolution {
  const isStrictProduction = isStrictProductionRuntime()
  const failMode = getRedisFailMode()

  if (testRedisClientOverride) {
    return {
      redis: testRedisClientOverride as unknown as Redis,
      status: "configured",
      origin: "test-override",
      isStrictProduction,
      failMode,
    }
  }

  const rawUrl = (
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL ??
    ""
  ).trim()
  const rawToken = (
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    ""
  ).trim()

  if (!rawUrl && !rawToken) {
    return {
      redis: null,
      status: "missing",
      reason: "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured.",
      isStrictProduction,
      failMode,
    }
  }

  if (!rawUrl || !rawToken) {
    const reason =
      "Incomplete Upstash Redis configuration: both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together."
    logRedisWarningOnce("partial-config", `[TerraTwin Redis] ${reason}`)
    return {
      redis: null,
      status: "partial-or-invalid",
      reason,
      isStrictProduction,
      failMode,
    }
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    const reason = "Invalid UPSTASH_REDIS_REST_URL syntax."
    logRedisWarningOnce("invalid-url", `[TerraTwin Redis] ${reason}`)
    return {
      redis: null,
      status: "partial-or-invalid",
      reason,
      isStrictProduction,
      failMode,
    }
  }

  const allowLoopbackHttp =
    process.env.TERRATWIN_ALLOW_HTTP_REDIS_FOR_TEST === "1" &&
    process.env.VERCEL !== "1" &&
    isLoopbackHost(parsedUrl.hostname)

  if (parsedUrl.protocol !== "https:" && !(parsedUrl.protocol === "http:" && allowLoopbackHttp)) {
    const reason =
      "UPSTASH_REDIS_REST_URL must use https:// (http:// is blocked outside local loopback verification)."
    logRedisWarningOnce("insecure-protocol", `[TerraTwin Redis] ${reason}`)
    return {
      redis: null,
      status: "partial-or-invalid",
      origin: sanitizeRedisOriginOnly(rawUrl),
      reason,
      isStrictProduction,
      failMode,
    }
  }

  const signature = `${parsedUrl.origin}::len=${rawToken.length}`
  if (!cachedClientInstance || cachedClientSignature !== signature) {
    cachedClientInstance = new Redis({
      url: rawUrl,
      token: rawToken,
      enableAutoPipelining: false,
      retry: {
        retries: 1,
        backoff: (retryCount) => Math.min(200, (retryCount + 1) * 75),
      },
    })
    cachedClientSignature = signature
  }

  return {
    redis: cachedClientInstance,
    status: "configured",
    origin: parsedUrl.origin,
    isStrictProduction,
    failMode,
  }
}

export async function withRedisTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = REDIS_OPERATION_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race<T>([
      operation(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Upstash Redis operation timed out after ${timeoutMs} ms`))
        }, timeoutMs)
        if (typeof timer.unref === "function") {
          timer.unref()
        }
      }),
    ])
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
  }
}
