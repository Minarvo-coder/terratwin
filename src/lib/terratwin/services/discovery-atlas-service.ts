import {
  GLOBAL_DISCOVERY_ATLAS,
  type DiscoveryAtlasEntry,
  type EvidenceClassification,
} from "../discovery-atlas.ts"
import type {
  AnalogEnvironmentCategory,
  AnalogNoveltyTier,
  FeatureKey,
  MissionPurpose,
} from "../types.ts"

/**
 * ID alias mapping from sample-dataset illustrative IDs to canonical atlas IDs
 * ensuring seamless lookup regardless of whether a caller uses sample IDs or canonical IDs.
 */
export const ATLAS_ID_ALIASES: Record<string, string> = {
  "atacama-yungay": "c0000001-0000-4000-8000-000000000001",
  "mauna-kea": "c0000002-0000-4000-8000-000000000002",
  "haughton-crater": "c0000003-0000-4000-8000-000000000003",
  "mcmurdo-dry-valleys": "c0000004-0000-4000-8000-000000000004",
  "lake-salda": "c0000005-0000-4000-8000-000000000005",
  "craters-of-the-moon": "c0000006-0000-4000-8000-000000000006",
  "holuhraun": "c0000007-0000-4000-8000-000000000007",
  "rio-tinto": "c0000008-0000-4000-8000-000000000008",
  "death-valley-badwater": "atlas-death-valley-badwater",
  "hanksville-mdrs": "atlas-hanksville-mdrs",
  "meteor-crater": "atlas-meteor-crater",
  "ries-crater": "atlas-ries-crater",
  "teide": "atlas-teide-high-plateau",
  "lanzarote-timanfaya": "atlas-lanzarote-timanfaya",
  "pilbara": "atlas-pilbara-north-pole",
}

export interface AtlasFilterOptions {
  category?: AnalogEnvironmentCategory
  noveltyTier?: AnalogNoveltyTier
  missionPurpose?: MissionPurpose
  country?: string
  evidenceClassification?: EvidenceClassification
  hasCompleteFeatures?: boolean
}

export interface AtlasSummaryStatistics {
  totalCandidates: number
  canonicalBenchmarkCount: number
  underExploredCount: number
  liveGridDiscoveryCount: number
  categoryCounts: Record<AnalogEnvironmentCategory, number>
  uniqueCountriesCount: number
  countries: string[]
  evidenceClassCounts: Record<EvidenceClassification, number>
}

/**
 * Returns all documented planetary analog candidates in the Global Analog Discovery Atlas.
 */
export function getAllAtlasCandidates(): DiscoveryAtlasEntry[] {
  return [...GLOBAL_DISCOVERY_ATLAS]
}

/**
 * Retrieves a single atlas candidate by its ID or known alias.
 */
export function getAtlasCandidateById(idOrAlias: string): DiscoveryAtlasEntry | undefined {
  if (!idOrAlias || typeof idOrAlias !== "string") return undefined
  const normalized = idOrAlias.trim()
  const resolvedId = ATLAS_ID_ALIASES[normalized] ?? normalized

  return GLOBAL_DISCOVERY_ATLAS.find(
    (cand) =>
      cand.id === resolvedId ||
      cand.id === normalized ||
      cand.databaseId === resolvedId ||
      cand.databaseId === normalized
  )
}

/**
 * Retrieves all candidates belonging to a specific terrestrial analog environment category.
 */
export function getAtlasCandidatesByCategory(
  category: AnalogEnvironmentCategory
): DiscoveryAtlasEntry[] {
  return GLOBAL_DISCOVERY_ATLAS.filter((cand) => cand.category === category)
}

/**
 * Retrieves all candidates belonging to a specific analog novelty tier.
 */
export function getAtlasCandidatesByNoveltyTier(
  tier: AnalogNoveltyTier
): DiscoveryAtlasEntry[] {
  return GLOBAL_DISCOVERY_ATLAS.filter((cand) => cand.noveltyTier === tier)
}

/**
 * Retrieves all candidates scientifically relevant to a specific planetary mission purpose.
 */
export function getAtlasCandidatesByMissionPurpose(
  purpose: MissionPurpose
): DiscoveryAtlasEntry[] {
  return GLOBAL_DISCOVERY_ATLAS.filter((cand) =>
    cand.relevantMissionProfiles.includes(purpose)
  )
}

/**
 * Retrieves all candidates located in a specific country or geographic region (case-insensitive substring match).
 */
export function getAtlasCandidatesByCountry(
  countryOrRegionQuery: string
): DiscoveryAtlasEntry[] {
  const query = countryOrRegionQuery.trim().toLowerCase()
  if (!query) return []

  return GLOBAL_DISCOVERY_ATLAS.filter(
    (cand) =>
      cand.country.toLowerCase().includes(query) ||
      cand.setting.toLowerCase().includes(query) ||
      cand.name.toLowerCase().includes(query)
  )
}

/**
 * Retrieves all candidates with verified primary scientific source citations.
 */
export function getAtlasCandidatesWithEvidence(): DiscoveryAtlasEntry[] {
  return GLOBAL_DISCOVERY_ATLAS.filter(
    (cand) => cand.primarySources && cand.primarySources.length > 0
  )
}

/**
 * Standard physical feature keys evaluated across environmental comparisons.
 */
export const CORE_ENVIRONMENTAL_FEATURE_KEYS: FeatureKey[] = [
  "meanSurfaceTempC",
  "diurnalTempRangeC",
  "meanSlopeDeg",
  "rockAbundancePct",
  "medianGrainSizeMm",
  "albedo",
  "vegetationCoverPct",
  "lithology",
  "surfaceSolarIrradianceWm2",
]

/**
 * Identifies missing feature keys for a candidate.
 */
export function getCandidateMissingFeatures(candidate: DiscoveryAtlasEntry): FeatureKey[] {
  const missing: FeatureKey[] = []
  for (const key of CORE_ENVIRONMENTAL_FEATURE_KEYS) {
    const val = candidate.environment[key as keyof typeof candidate.environment]
    if (val === null || val === undefined) {
      missing.push(key)
    }
  }
  return missing
}

/**
 * Retrieves candidates with incomplete or missing measurements in their core physical feature profiles.
 * Preserves scientific integrity by highlighting parameter gaps without fabricating data.
 */
export function getAtlasCandidatesWithIncompleteData(): DiscoveryAtlasEntry[] {
  return GLOBAL_DISCOVERY_ATLAS.filter((cand) => getCandidateMissingFeatures(cand).length > 0)
}

/**
 * Retrieves candidates with complete measurements across all core physical features.
 */
export function getAtlasCandidatesWithCompleteData(): DiscoveryAtlasEntry[] {
  return GLOBAL_DISCOVERY_ATLAS.filter((cand) => getCandidateMissingFeatures(cand).length === 0)
}

/**
 * Multi-criteria filter for the discovery atlas.
 */
export function filterAtlasCandidates(options: AtlasFilterOptions): DiscoveryAtlasEntry[] {
  return GLOBAL_DISCOVERY_ATLAS.filter((cand) => {
    if (options.category && cand.category !== options.category) {
      return false
    }
    if (options.noveltyTier && cand.noveltyTier !== options.noveltyTier) {
      return false
    }
    if (
      options.missionPurpose &&
      !cand.relevantMissionProfiles.includes(options.missionPurpose)
    ) {
      return false
    }
    if (options.country) {
      const q = options.country.trim().toLowerCase()
      const match =
        cand.country.toLowerCase().includes(q) ||
        cand.setting.toLowerCase().includes(q)
      if (!match) return false
    }
    if (
      options.evidenceClassification &&
      cand.evidenceClassification !== options.evidenceClassification
    ) {
      return false
    }
    if (options.hasCompleteFeatures !== undefined) {
      const isComplete = getCandidateMissingFeatures(cand).length === 0
      if (options.hasCompleteFeatures !== isComplete) {
        return false
      }
    }
    return true
  })
}

/**
 * Computes comprehensive statistical distribution metrics across the discovery atlas.
 */
export function getAtlasSummaryStatistics(): AtlasSummaryStatistics {
  const categoryCounts: Record<AnalogEnvironmentCategory, number> = {
    "salt-flats-evaporites": 0,
    "polar-permafrost": 0,
    "volcanic-fields": 0,
    "impact-craters": 0,
    "high-altitude-plateaus": 0,
    "glacial-outwash": 0,
    "lava-tubes-caves": 0,
    "dry-river-deltas": 0,
    "serpentinizing-acidic-mineral-systems": 0,
  }

  const evidenceClassCounts: Record<EvidenceClassification, number> = {
    measured: 0,
    derived: 0,
    proxy: 0,
    illustrative: 0,
    missing_data: 0,
  }

  const countrySet = new Set<string>()
  let canonicalBenchmarkCount = 0
  let underExploredCount = 0
  let liveGridDiscoveryCount = 0

  for (const cand of GLOBAL_DISCOVERY_ATLAS) {
    categoryCounts[cand.category] = (categoryCounts[cand.category] ?? 0) + 1
    evidenceClassCounts[cand.evidenceClassification] =
      (evidenceClassCounts[cand.evidenceClassification] ?? 0) + 1

    if (cand.noveltyTier === "canonical-benchmark") canonicalBenchmarkCount++
    if (cand.noveltyTier === "under-explored-analog") underExploredCount++
    if (cand.noveltyTier === "live-grid-discovery") liveGridDiscoveryCount++

    // Parse country names (splitting compound country strings like "Chile / Argentina")
    cand.country
      .split("/")
      .map((c) => c.replace(/\(.*\)/, "").trim())
      .filter(Boolean)
      .forEach((c) => countrySet.add(c))
  }

  const countries = Array.from(countrySet).sort((a, b) => a.localeCompare(b))

  return {
    totalCandidates: GLOBAL_DISCOVERY_ATLAS.length,
    canonicalBenchmarkCount,
    underExploredCount,
    liveGridDiscoveryCount,
    categoryCounts,
    uniqueCountriesCount: countries.length,
    countries,
    evidenceClassCounts,
  }
}
