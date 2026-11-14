import { createHash } from "node:crypto"
import type { Lithology } from "../types.ts"
import type { RegionalDiscoveryResponse } from "../types/discovery.ts"
import {
  logRedisWarningOnce,
  resolveSharedRedis,
  withRedisTimeout,
} from "./redis-client.ts"

/**
 * Two-Tier L1 (In-Memory Bounded LRU) + L2 (Shared Upstash Redis) Discovery Cache.
 *
 * - L1 keeps existing synchronous `.get()` / `.set()` behavior 100% intact for unit tests
 *   and single-process hot hits.
 * - L2 shares deterministic scientific cache entries across Vercel serverless functions
 *   and multi-process Node workers via `@upstash/redis` when configured.
 * - Payload sizes and TTLs are strictly bounded; incomplete provider responses or
 *   corrupt cached values are never stored or returned as valid hits.
 * - If Upstash Redis is unavailable, operations degrade safely to L1 without crashing.
 */

export const DEFAULT_SHARED_CACHE_MAX_PAYLOAD_BYTES = 16_384
export const RESPONSE_SHARED_CACHE_MAX_PAYLOAD_BYTES = 512_000

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface SharedCacheOptions<T> {
  /** Key namespace prefix stored in Redis (e.g. "terratwin:v1:cache:discover-resp"). */
  namespace: string
  /** Shared Redis TTL in seconds. */
  ttlSeconds: number
  /** Maximum JSON payload size in UTF-8 bytes allowed into Redis. */
  maxPayloadBytes: number
  /** Whether to hash logical keys with SHA-256 to guarantee compact deterministic Redis keys. */
  hashKeys?: boolean
  /** Guards against caching or serving incomplete/corrupt records. */
  validateEntry?: (value: T) => boolean
}

export interface SharedCacheCallOptions {
  /** Set false when running unit tests with synthetic mock fetch implementations. */
  useSharedRedis?: boolean
}

export function computeDeterministicRedisKey(
  namespace: string,
  logicalKey: string,
  hashKeys: boolean = false
): string {
  if (hashKeys || logicalKey.length > 128) {
    const digest = createHash("sha256").update(logicalKey).digest("hex")
    return `${namespace}:${digest}`
  }
  const safeKey = logicalKey.replace(/[^a-zA-Z0-9:._-]/g, "_")
  return `${namespace}:${safeKey}`
}

export class DiscoveryCache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private inFlight = new Map<
    string,
    Promise<{ value: T; cacheHit: boolean; cacheBackend: "memory" | "upstash-redis" }>
  >()
  private readonly defaultTtlMs: number
  private readonly maxEntries: number
  private readonly sharedOptions?: SharedCacheOptions<T>

  constructor(
    defaultTtlMs: number = 60 * 60 * 1000,
    maxEntries: number = 1000,
    sharedOptions?: SharedCacheOptions<T>
  ) {
    this.defaultTtlMs = Math.max(1, defaultTtlMs)
    this.maxEntries = Math.max(1, maxEntries)
    this.sharedOptions = sharedOptions
  }

  private isEntryValid(value: unknown): value is T {
    if (value === null || value === undefined || typeof value !== "object") {
      return false
    }
    if (this.sharedOptions?.validateEntry) {
      return this.sharedOptions.validateEntry(value as T)
    }
    return true
  }

  private buildRedisKey(logicalKey: string): string | null {
    if (!this.sharedOptions) return null
    return computeDeterministicRedisKey(
      this.sharedOptions.namespace,
      logicalKey,
      Boolean(this.sharedOptions.hashKeys)
    )
  }

  private parseRedisPayload(raw: unknown): T | undefined {
    if (raw === null || raw === undefined) return undefined
    let parsed: unknown = raw
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw)
      } catch {
        return undefined
      }
    }
    if (!this.isEntryValid(parsed)) {
      return undefined
    }
    return parsed
  }

  public get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }

    // Promote hit to most-recently-used position in Map iteration order
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  public set(key: string, value: T, ttlMs?: number): void {
    // Updating an existing key should replace in-place at MRU without premature eviction
    if (this.store.has(key)) {
      this.store.delete(key)
    }

    if (this.store.size >= this.maxEntries) {
      this.pruneExpired()
    }

    while (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey === undefined) break
      this.store.delete(oldestKey)
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs)
    this.store.set(key, { value, expiresAt })
  }

  public async getAsync(
    key: string,
    options: SharedCacheCallOptions = {}
  ): Promise<{ value: T | undefined; cacheBackend?: "memory" | "upstash-redis" }> {
    const localHit = this.get(key)
    if (localHit !== undefined) {
      return { value: localHit, cacheBackend: "memory" }
    }

    if (options.useSharedRedis === false || !this.sharedOptions) {
      return { value: undefined }
    }

    const { redis } = resolveSharedRedis()
    if (!redis) return { value: undefined }

    const redisKey = this.buildRedisKey(key)
    if (!redisKey) return { value: undefined }

    try {
      const raw = await withRedisTimeout(() => redis.get(redisKey))
      const parsed = this.parseRedisPayload(raw)
      if (parsed === undefined) {
        return { value: undefined }
      }
      // Warm L1 locally with bounded TTL so stale memory does not outlive Redis TTL significantly
      const l1WarmTtlMs = Math.min(this.defaultTtlMs, Math.max(5_000, Math.floor((this.sharedOptions.ttlSeconds * 1000) / 3)))
      this.set(key, parsed, l1WarmTtlMs)
      return { value: parsed, cacheBackend: "upstash-redis" }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redis read error"
      logRedisWarningOnce(
        `cache-read-${this.sharedOptions.namespace}`,
        `[TerraTwin Cache] Shared Redis GET failed for ${this.sharedOptions.namespace} (${msg}); continuing with L1/live fetch.`
      )
      return { value: undefined }
    }
  }

  public async mgetAsync(
    keys: string[],
    options: SharedCacheCallOptions = {}
  ): Promise<Map<string, T>> {
    const hits = new Map<string, T>()
    const missingKeys: string[] = []

    for (const key of keys) {
      const local = this.get(key)
      if (local !== undefined) {
        hits.set(key, local)
      } else {
        missingKeys.push(key)
      }
    }

    if (missingKeys.length === 0 || options.useSharedRedis === false || !this.sharedOptions) {
      return hits
    }

    const { redis } = resolveSharedRedis()
    if (!redis) return hits

    const redisKeys = missingKeys.map((k) => this.buildRedisKey(k)!)
    try {
      const rawValues = await withRedisTimeout(() => redis.mget<unknown[]>(...redisKeys))
      const l1WarmTtlMs = Math.min(
        this.defaultTtlMs,
        Math.max(5_000, Math.floor((this.sharedOptions.ttlSeconds * 1000) / 3))
      )
      if (Array.isArray(rawValues)) {
        for (let i = 0; i < missingKeys.length; i++) {
          const parsed = this.parseRedisPayload(rawValues[i])
          if (parsed !== undefined) {
            const logicalKey = missingKeys[i]
            this.set(logicalKey, parsed, l1WarmTtlMs)
            hits.set(logicalKey, parsed)
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redis MGET error"
      logRedisWarningOnce(
        `cache-mget-${this.sharedOptions.namespace}`,
        `[TerraTwin Cache] Shared Redis MGET failed for ${this.sharedOptions.namespace} (${msg}); continuing with live provider fetch.`
      )
    }

    return hits
  }

  public async setAsync(
    key: string,
    value: T,
    ttlMs?: number,
    options: SharedCacheCallOptions = {}
  ): Promise<boolean> {
    if (!this.isEntryValid(value)) {
      return false
    }

    this.set(key, value, ttlMs)

    if (options.useSharedRedis === false || !this.sharedOptions) {
      return false
    }

    const { redis } = resolveSharedRedis()
    if (!redis) return false

    const redisKey = this.buildRedisKey(key)
    if (!redisKey) return false

    let serialized: string
    try {
      serialized = JSON.stringify(value)
    } catch {
      return false
    }

    const payloadBytes = Buffer.byteLength(serialized, "utf8")
    if (payloadBytes > this.sharedOptions.maxPayloadBytes) {
      logRedisWarningOnce(
        `cache-size-${this.sharedOptions.namespace}`,
        `[TerraTwin Cache] Skipped shared Redis write for ${this.sharedOptions.namespace}: payload (${payloadBytes} B) exceeded limit (${this.sharedOptions.maxPayloadBytes} B).`
      )
      return false
    }

    const exSeconds = Math.max(
      1,
      ttlMs ? Math.ceil(ttlMs / 1000) : this.sharedOptions.ttlSeconds
    )

    try {
      await withRedisTimeout(() => redis.set(redisKey, serialized, { ex: exSeconds }))
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redis write error"
      logRedisWarningOnce(
        `cache-write-${this.sharedOptions.namespace}`,
        `[TerraTwin Cache] Shared Redis SET failed for ${this.sharedOptions.namespace} (${msg}); L1 cache remains active.`
      )
      return false
    }
  }

  /**
   * Coalesces concurrent asynchronous loads for the same key and caches the resolved value
   * in L1 + shared Redis only if `shouldCache(value)` returns true.
   */
  public async getOrLoad(
    key: string,
    loader: () => Promise<T>,
    ttlMs?: number,
    shouldCache: (value: T) => boolean = () => true,
    options: SharedCacheCallOptions = {}
  ): Promise<{
    value: T
    cacheHit: boolean
    coalesced: boolean
    cacheBackend?: "memory" | "upstash-redis"
  }> {
    const localHit = this.get(key)
    if (localHit !== undefined) {
      return { value: localHit, cacheHit: true, coalesced: false, cacheBackend: "memory" }
    }

    const existingFlight = this.inFlight.get(key)
    if (existingFlight) {
      const resolved = await existingFlight
      return {
        value: resolved.value,
        cacheHit: resolved.cacheHit,
        coalesced: true,
        cacheBackend: resolved.cacheBackend,
      }
    }

    const promise = (async () => {
      try {
        if (options.useSharedRedis !== false && this.sharedOptions) {
          const remote = await this.getAsync(key, options)
          if (remote.value !== undefined) {
            return {
              value: remote.value,
              cacheHit: true,
              cacheBackend: "upstash-redis" as const,
            }
          }
        }

        const value = await loader()
        if (shouldCache(value)) {
          await this.setAsync(key, value, ttlMs, options)
        }
        return {
          value,
          cacheHit: false,
          cacheBackend: "memory" as const,
        }
      } finally {
        this.inFlight.delete(key)
      }
    })()

    this.inFlight.set(key, promise)
    const resolved = await promise
    return {
      value: resolved.value,
      cacheHit: resolved.cacheHit,
      coalesced: false,
      cacheBackend: resolved.cacheBackend,
    }
  }

  public pruneExpired(): number {
    const now = Date.now()
    let removed = 0
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
        removed += 1
      }
    }
    return removed
  }

  public has(key: string): boolean {
    return this.get(key) !== undefined
  }

  public clear(): void {
    this.store.clear()
    this.inFlight.clear()
  }

  public get size(): number {
    this.pruneExpired()
    return this.store.size
  }
}

export interface ElevationCacheRecord {
  elevationM: number | null
  meanSlopeDeg: number | null
  slopeMethod?: string
  slopeQualityNote?: string
}

export interface NasaPowerCacheRecord {
  meanSurfaceTempC: number | null
  diurnalTempRangeC: number | null
  surfaceSolarIrradianceWm2: number | null
  windSpeedMs: number | null
  annualPrecipitationMm: number | null
  originalSolarKwhM2Day?: number | null
  originalPrecipMmDay?: number | null
  datasetVersion?: string
  temporalCoverage?: string
  sourceVariablesUsed?: string[]
  sourceUrl?: string
}

export interface MacrostratCacheRecord {
  lithology: Lithology | null
  lithologyConfidence?: "mapped" | "ambiguous-mixed-unit" | "unmapped-class" | "no-unit"
  rawLithologyText?: string
  mapUnitName?: string
  geologicAge?: string
  mapScale?: string
  sourceRef?: string
  sourceUrl?: string
}

export function isValidElevationCacheRecord(val: ElevationCacheRecord): boolean {
  return (
    val !== null &&
    typeof val === "object" &&
    (typeof val.elevationM === "number" || typeof val.meanSlopeDeg === "number")
  )
}

export function isValidNasaPowerCacheRecord(val: NasaPowerCacheRecord): boolean {
  if (!val || typeof val !== "object") return false
  return [
    val.meanSurfaceTempC,
    val.diurnalTempRangeC,
    val.surfaceSolarIrradianceWm2,
    val.windSpeedMs,
    val.annualPrecipitationMm,
  ].some((x) => typeof x === "number" && Number.isFinite(x))
}

export function isValidMacrostratCacheRecord(val: MacrostratCacheRecord): boolean {
  return (
    val !== null &&
    typeof val === "object" &&
    typeof val.lithologyConfidence === "string"
  )
}

export function isValidDiscoveryResponseCacheRecord(val: RegionalDiscoveryResponse): boolean {
  return (
    val !== null &&
    typeof val === "object" &&
    val.success === true &&
    Array.isArray(val.candidates) &&
    Array.isArray(val.providerStatuses) &&
    val.providerStatuses.length > 0 &&
    val.providerStatuses.every((s) => s.status === "success" || s.status === "cached")
  )
}

// Global shared cache instances (version-tagged keys, bounded payloads, L1 memory + L2 Upstash Redis)
export const elevationCache = new DiscoveryCache<ElevationCacheRecord>(
  60 * 60 * 1000,
  1000,
  {
    namespace: "terratwin:v1:cache:elev",
    ttlSeconds: 3600,
    maxPayloadBytes: DEFAULT_SHARED_CACHE_MAX_PAYLOAD_BYTES,
    validateEntry: isValidElevationCacheRecord,
  }
)

export const nasaPowerCache = new DiscoveryCache<NasaPowerCacheRecord>(
  60 * 60 * 1000,
  1000,
  {
    namespace: "terratwin:v1:cache:power",
    ttlSeconds: 3600,
    maxPayloadBytes: DEFAULT_SHARED_CACHE_MAX_PAYLOAD_BYTES,
    validateEntry: isValidNasaPowerCacheRecord,
  }
)

export const macrostratCache = new DiscoveryCache<MacrostratCacheRecord>(
  60 * 60 * 1000,
  1000,
  {
    namespace: "terratwin:v1:cache:macro",
    ttlSeconds: 3600,
    maxPayloadBytes: DEFAULT_SHARED_CACHE_MAX_PAYLOAD_BYTES,
    validateEntry: isValidMacrostratCacheRecord,
  }
)

export const discoveryResponseCache = new DiscoveryCache<RegionalDiscoveryResponse>(
  15 * 60 * 1000,
  200,
  {
    namespace: "terratwin:v1:cache:discover-resp",
    ttlSeconds: 900,
    maxPayloadBytes: RESPONSE_SHARED_CACHE_MAX_PAYLOAD_BYTES,
    hashKeys: true,
    validateEntry: isValidDiscoveryResponseCacheRecord,
  }
)
