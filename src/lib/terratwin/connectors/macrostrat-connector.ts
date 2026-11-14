import { macrostratCache, type MacrostratCacheRecord } from "../utils/discovery-cache.ts"
import { fetchWithRetry } from "../utils/fetch-retry.ts"
import type { Lithology } from "../types.ts"
import type { ProviderTelemetryStatus } from "../types/discovery.ts"

export type CellMacrostratData = MacrostratCacheRecord

export interface MacrostratBatchResult {
  data: Map<string, CellMacrostratData>
  status: ProviderTelemetryStatus
}

export interface LithologyClassificationDetail {
  lithology: Lithology | null
  confidence: "mapped" | "ambiguous-mixed-unit" | "unmapped-class" | "no-unit"
  matchedCategories: Lithology[]
  unmappedKeywords: string[]
}

const LITHOLOGY_RULES: Array<{ category: Lithology; keywords: string[] }> = [
  {
    category: "basaltic",
    keywords: ["basalt", "gabbro", "diabase", "dolerite", "mafic volcanic"],
  },
  {
    category: "anorthositic",
    keywords: ["anorthosite", "anorthositic"],
  },
  {
    category: "volcanic-tephra",
    keywords: ["tephra", "tuff", "pumice", "scoria", "pyroclastic"],
  },
  {
    category: "sulfate-evaporite",
    keywords: ["gypsum", "anhydrite", "halite", "evaporite", "salt", "borate"],
  },
  {
    category: "impact-breccia",
    keywords: ["suevite", "impact melt", "impact breccia", "shatter cone"],
  },
  {
    category: "clay-sedimentary",
    keywords: [
      "clay",
      "shale",
      "mudstone",
      "siltstone",
      "sandstone",
      "limestone",
      "dolomite",
      "carbonate",
      "sedimentary",
      "chert",
      "conglomerate",
    ],
  },
  {
    // Ultramafics (peridotite, serpentinite, ophiolite) are intentionally EXCLUDED from
    // felsic-crystalline because classifying ultramafic mantle/oceanic rocks as felsic
    // granite is petrologically incorrect. They are tracked below under UNMAPPED_ULTRAMAFICS.
    category: "felsic-crystalline",
    keywords: ["granite", "rhyolite", "granodiorite", "gneiss", "schist", "felsic"],
  },
]

const UNMAPPED_PETROLOGICAL_TERMS = [
  "peridotite",
  "serpentinite",
  "ophiolite",
  "dunite",
  "harzburgite",
  "pyroxenite",
  "kimberlite",
  "komatiite",
]

function containsWholeKeyword(haystackLower: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(^|[^a-z])${escaped}(s|ic|ite)?([^a-z]|$)`, "i")
  return regex.test(haystackLower)
}

function detectCategoriesInText(text: string): {
  matchedCategories: Lithology[]
  unmappedKeywords: string[]
} {
  const q = text.toLowerCase()
  const matched = new Set<Lithology>()
  const unmapped: string[] = []

  for (const rule of LITHOLOGY_RULES) {
    if (rule.keywords.some((kw) => containsWholeKeyword(q, kw))) {
      matched.add(rule.category)
    }
  }

  for (const term of UNMAPPED_PETROLOGICAL_TERMS) {
    if (containsWholeKeyword(q, term)) {
      unmapped.push(term)
    }
  }

  return {
    matchedCategories: Array.from(matched),
    unmappedKeywords: unmapped,
  }
}

/**
 * Classifies geological text with ambiguity and mixed-unit awareness.
 * - Evaluates all known TerraTwin categories instead of picking by arbitrary keyword order.
 * - If a structured `Major:{...}` clause exists, resolves the Major lithology cleanly when
 *   unambiguous, ignoring Minor accessory rock types.
 * - Rejects ultramafic rocks rather than misclassifying them as felsic-crystalline.
 * - Preserves uncertainty (`lithology: null`) when multiple distinct rock classes co-occur
 *   at equal rank without a clear dominant lithology.
 */
export function classifyMacrostratLithologyDetailed(text: string): LithologyClassificationDetail {
  const trimmed = text.trim()
  if (!trimmed) {
    return {
      lithology: null,
      confidence: "no-unit",
      matchedCategories: [],
      unmappedKeywords: [],
    }
  }

  // Check if Macrostrat encoded Major:{...} dominance clauses (e.g. "Major:{basalt}, Minor:{andesite}")
  const majorMatch = trimmed.match(/major\s*:\s*\{([^}]*)\}/i)
  if (majorMatch && majorMatch[1]) {
    const majorRes = detectCategoriesInText(majorMatch[1])
    if (majorRes.matchedCategories.length === 1 && majorRes.unmappedKeywords.length === 0) {
      return {
        lithology: majorRes.matchedCategories[0],
        confidence: "mapped",
        matchedCategories: majorRes.matchedCategories,
        unmappedKeywords: [],
      }
    }
    if (majorRes.matchedCategories.length > 1 || (majorRes.matchedCategories.length >= 1 && majorRes.unmappedKeywords.length > 0)) {
      return {
        lithology: null,
        confidence: "ambiguous-mixed-unit",
        matchedCategories: majorRes.matchedCategories,
        unmappedKeywords: majorRes.unmappedKeywords,
      }
    }
    if (majorRes.unmappedKeywords.length > 0) {
      return {
        lithology: null,
        confidence: "unmapped-class",
        matchedCategories: [],
        unmappedKeywords: majorRes.unmappedKeywords,
      }
    }
  }

  const flatRes = detectCategoriesInText(trimmed)
  if (flatRes.matchedCategories.length === 1 && flatRes.unmappedKeywords.length === 0) {
    return {
      lithology: flatRes.matchedCategories[0],
      confidence: "mapped",
      matchedCategories: flatRes.matchedCategories,
      unmappedKeywords: [],
    }
  }

  if (flatRes.matchedCategories.length > 1 || (flatRes.matchedCategories.length >= 1 && flatRes.unmappedKeywords.length > 0)) {
    return {
      lithology: null,
      confidence: "ambiguous-mixed-unit",
      matchedCategories: flatRes.matchedCategories,
      unmappedKeywords: flatRes.unmappedKeywords,
    }
  }

  return {
    lithology: null,
    confidence: "unmapped-class",
    matchedCategories: [],
    unmappedKeywords: flatRes.unmappedKeywords,
  }
}

/**
 * Deterministically maps geological text and rock names from Macrostrat to project lithologies.
 * Returns null if mixed/ambiguous or outside TerraTwin's 7-class lithology taxonomy.
 */
export function classifyMacrostratLithology(text: string): Lithology | null {
  return classifyMacrostratLithologyDetailed(text).lithology
}

interface MacrostratTopUnit {
  map_id?: number
  name?: string
  strat_name?: string
  age?: string
  t_int_name?: string
  b_int_name?: string
  lith?: string
  descrip?: string
  liths?: Array<{ lith?: string; lith_class?: string }>
  ref?: {
    ref_title?: string
    name?: string
    url?: string
    scale?: string
  }
}

function classifyMacrostratMapUnit(topUnit: MacrostratTopUnit): {
  lithology: Lithology | null
  confidence: "mapped" | "ambiguous-mixed-unit" | "unmapped-class" | "no-unit"
  rawLithologyText?: string
} {
  // Prefer Major/Minor structured lith string if present (Macrostrat encodes dominance here),
  // otherwise combine structured `liths` array, `lith`, `descrip`, and unit `name` sequentially.
  const structuredLithStr = typeof topUnit.lith === "string" ? topUnit.lith.trim() : ""
  const lithsArrayStr = Array.isArray(topUnit.liths)
    ? topUnit.liths.map((l) => l.lith ?? "").filter(Boolean).join(", ")
    : ""

  if (structuredLithStr && /major\s*:/i.test(structuredLithStr)) {
    const res = classifyMacrostratLithologyDetailed(structuredLithStr)
    if (res.lithology !== null || res.confidence === "ambiguous-mixed-unit") {
      return {
        lithology: res.lithology,
        confidence: res.confidence,
        rawLithologyText: structuredLithStr,
      }
    }
  }

  if (lithsArrayStr) {
    const res = classifyMacrostratLithologyDetailed(lithsArrayStr)
    if (res.lithology !== null || res.confidence === "ambiguous-mixed-unit" || res.unmappedKeywords.length > 0) {
      return {
        lithology: res.lithology,
        confidence: res.confidence,
        rawLithologyText: structuredLithStr || lithsArrayStr,
      }
    }
  }

  for (const candidateText of [structuredLithStr, topUnit.descrip ?? "", topUnit.name ?? ""]) {
    const clean = candidateText.trim()
    if (!clean) continue
    const res = classifyMacrostratLithologyDetailed(clean)
    if (res.lithology !== null || res.confidence === "ambiguous-mixed-unit" || res.unmappedKeywords.length > 0) {
      return {
        lithology: res.lithology,
        confidence: res.confidence,
        rawLithologyText: structuredLithStr || lithsArrayStr || clean,
      }
    }
  }

  const rawText = structuredLithStr || lithsArrayStr || topUnit.descrip?.trim() || topUnit.name?.trim()
  return {
    lithology: null,
    confidence: rawText ? "unmapped-class" : "no-unit",
    rawLithologyText: rawText,
  }
}

/**
 * Retrieves regional geological map unit and lithology from Macrostrat API v2.
 */
export async function fetchBatchMacrostratGeology(
  cells: Array<{ id: string; latitude: number; longitude: number }>,
  options: {
    timeoutMs?: number
    concurrency?: number
    maxRetries?: number
    retryDelayMs?: number
    fetchFn?: typeof fetch
  } = {}
): Promise<MacrostratBatchResult> {
  const startTime = Date.now()
  const timeoutMs = options.timeoutMs ?? 8000
  const concurrency = Math.max(1, options.concurrency ?? 4)
  const maxRetries = options.maxRetries ?? 1
  const retryDelayMs = options.retryDelayMs ?? 150
  const resultMap = new Map<string, CellMacrostratData>()

  const uniqueCellsByKey = new Map<
    string,
    { key: string; latitude: number; longitude: number; cellIds: string[] }
  >()
  let cacheHits = 0

  const useSharedRedis = !options.fetchFn
  const cellKeys = cells.map(
    (cell) => `macro_v2_${cell.latitude.toFixed(4)}_${cell.longitude.toFixed(4)}`
  )
  const preloadedHits = await macrostratCache.mgetAsync(cellKeys, { useSharedRedis })

  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx]
    const key = cellKeys[idx]
    const cached = preloadedHits.get(key)
    if (cached) {
      resultMap.set(cell.id, cached)
      cacheHits++
    } else {
      const existing = uniqueCellsByKey.get(key)
      if (existing) {
        existing.cellIds.push(cell.id)
      } else {
        uniqueCellsByKey.set(key, {
          key,
          latitude: cell.latitude,
          longitude: cell.longitude,
          cellIds: [cell.id],
        })
      }
    }
  }

  const uncachedGroups = Array.from(uniqueCellsByKey.values())

  if (uncachedGroups.length === 0) {
    return {
      data: resultMap,
      status: {
        provider: "Macrostrat Geology",
        dataset: "Macrostrat API v2 (Geologic Map Integration)",
        datasetVersion: "v2 (map_query_v2, zoom=8)",
        status: "cached",
        recordsFetched: cells.length,
        cacheHits,
        latencyMs: Date.now() - startTime,
        spatialResolution: "Regional map unit scale (1:250k–1:5M)",
        sourceUrl: "https://macrostrat.org/api/v2/mobile/map_query_v2",
        attributionNotice: "Macrostrat / BGR / USGS Geologic Map Integration (CC BY 4.0).",
      },
    }
  }

  let successCount = 0
  let failedCount = 0
  let coalescedHits = 0
  let lastError: string | undefined

  async function fetchCellGeology(grp: {
    key: string
    latitude: number
    longitude: number
    cellIds: string[]
  }): Promise<void> {
    const url = `https://macrostrat.org/api/v2/mobile/map_query_v2?lat=${grp.latitude.toFixed(4)}&lng=${grp.longitude.toFixed(4)}&z=8`

    const loadGeology = async (): Promise<MacrostratCacheRecord> => {
      const res = await fetchWithRetry(
        url,
        { headers: { Accept: "application/json" } },
        { timeoutMs, maxRetries, retryDelayMs, fetchFn: options.fetchFn }
      )

      if (!res.ok) {
        throw new Error(`Macrostrat API HTTP ${res.status}`)
      }

      const json = await res.json()
      const mapData: MacrostratTopUnit[] = Array.isArray(json?.success?.data?.mapData)
        ? json.success.data.mapData
        : []

      if (mapData.length === 0) {
        return {
          lithology: null,
          lithologyConfidence: "no-unit",
          sourceUrl: url,
        }
      }

      const topUnit = mapData[0]
      const mapUnitName = topUnit.name || topUnit.strat_name || undefined
      const sourceRef = topUnit.ref?.ref_title || topUnit.ref?.name || undefined
      const mapScale = topUnit.ref?.scale || undefined
      const geologicAge =
        topUnit.age ||
        (topUnit.t_int_name && topUnit.b_int_name
          ? `${topUnit.t_int_name}–${topUnit.b_int_name}`
          : topUnit.t_int_name || topUnit.b_int_name) ||
        undefined
      const sourceUrl = topUnit.ref?.url || url

      const classification = classifyMacrostratMapUnit(topUnit)

      return {
        lithology: classification.lithology,
        lithologyConfidence: classification.confidence,
        rawLithologyText: classification.rawLithologyText,
        mapUnitName,
        geologicAge,
        mapScale,
        sourceRef,
        sourceUrl,
      }
    }

    try {
      const loaded = options.fetchFn
        ? {
            value: await (async () => {
              const val = await loadGeology()
              macrostratCache.set(grp.key, val)
              return val
            })(),
            cacheHit: false,
            coalesced: false,
          }
        : await macrostratCache.getOrLoad(grp.key, loadGeology, undefined, undefined, { useSharedRedis })

      if (loaded.cacheHit || loaded.coalesced) {
        coalescedHits++
      }

      for (const cellId of grp.cellIds) {
        resultMap.set(cellId, loaded.value)
      }
      successCount++
    } catch (err) {
      failedCount++
      lastError = err instanceof Error ? err.message : String(err)
      for (const cellId of grp.cellIds) {
        resultMap.set(cellId, {
          lithology: null,
          lithologyConfidence: "no-unit",
        })
      }
    }
  }

  for (let i = 0; i < uncachedGroups.length; i += concurrency) {
    const chunk = uncachedGroups.slice(i, i + concurrency)
    await Promise.all(chunk.map((g) => fetchCellGeology(g)))
  }

  const overallStatus =
    failedCount === 0 ? "success" : successCount > 0 ? "partial" : "failed"

  return {
    data: resultMap,
    status: {
      provider: "Macrostrat Geology",
      dataset: "Macrostrat API v2 (Geologic Map Integration)",
      datasetVersion: "v2 (map_query_v2, zoom=8)",
      status: overallStatus,
      recordsFetched: successCount,
      cacheHits: cacheHits + coalescedHits,
      latencyMs: Date.now() - startTime,
      spatialResolution: "Regional map unit scale (1:250k–1:5M)",
      sourceUrl: "https://macrostrat.org/api/v2/mobile/map_query_v2",
      attributionNotice: "Macrostrat / BGR / USGS Geologic Map Integration (CC BY 4.0).",
      error: lastError,
    },
  }
}
