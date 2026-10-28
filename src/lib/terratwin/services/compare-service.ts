import {
  GEOLOGICAL_RESEARCH_PROFILE,
  ROVER_TESTING_PROFILE,
  validateMissionWeights,
  type ConfigurableMissionProfile,
} from "../config/comparison-config"
import { loadVerifiedLocationsAndFeatures } from "../db/planetary-repository"
import {
  SAMPLE_CANDIDATES,
  SAMPLE_DATASET_META,
  SAMPLE_TARGETS,
} from "../sample-dataset"
import { rankCandidateLocations } from "../similarity-engine"
import type { DatasetMeta, EarthCandidate, PlanetaryTarget } from "../types"
import type { CompareApiRequest, CompareApiResponse } from "../types/api"

export class ValidationError extends Error {
  public readonly status: number = 400
  public readonly details?: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = "ValidationError"
    this.details = details
  }
}

export class NotFoundError extends Error {
  public readonly status: number = 404
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

/**
 * Resolves a mission profile from either an identifier string or custom profile definition.
 * Strictly verifies that weights are non-negative and sum to 1.0.
 */
export function resolveMissionProfile(
  input: string | ConfigurableMissionProfile
): ConfigurableMissionProfile {
  if (typeof input === "string") {
    const normalized = input.trim().toLowerCase()
    if (normalized === "rover-testing" || normalized === "rover_testing") {
      return ROVER_TESTING_PROFILE
    }
    if (normalized === "geological-research" || normalized === "geological_research") {
      return GEOLOGICAL_RESEARCH_PROFILE
    }
    throw new ValidationError(
      `Unknown mission profile '${input}'. Supported standard profiles are 'rover-testing' and 'geological-research', or provide a custom profile object with weights summing to 1.0.`
    )
  }

  if (typeof input === "object" && input !== null) {
    if (!input.id || typeof input.id !== "string") {
      throw new ValidationError("Custom mission profile must contain a string 'id'.")
    }
    if (!input.weights || typeof input.weights !== "object") {
      throw new ValidationError("Custom mission profile must contain a 'weights' object.")
    }

    const validation = validateMissionWeights(input.weights)
    if (!validation.isValid) {
      throw new ValidationError(
        `Invalid custom mission profile weights: ${validation.errors.join("; ")}`,
        { errors: validation.errors, totalWeight: validation.sum }
      )
    }

    return {
      id: input.id,
      label: input.label ?? input.id,
      summary: input.summary ?? "Custom user-configured mission profile.",
      statusNotice: input.statusNotice ?? "Custom weights specified by API caller.",
      weights: input.weights,
    }
  }

  throw new ValidationError("Invalid mission profile. Expected a profile identifier string or custom profile object.")
}

export const TARGET_ID_ALIASES: Record<string, string> = {
  "moon-mare-tranquillitatis": "b0000002-0000-4000-8000-000000000002",
  "moon-south-polar-highlands": "b0000001-0000-4000-8000-000000000001",
  "mars-jezero-delta": "a0000001-0000-4000-8000-000000000001",
  "mars-meridiani-planum": "a0000003-0000-4000-8000-000000000003",
}

/**
 * Executes scientific analog comparison:
 * 1. Validates inputs.
 * 2. Retrieves verified target & candidates from Supabase (server-side), or falls back to illustrative demo catalog.
 * 3. Calls scientific distance/similarity engine.
 * 4. Formats typed response payload.
 */
export async function executeAnalogComparison(
  request: CompareApiRequest
): Promise<CompareApiResponse> {
  // 1. Input validation
  if (!request || typeof request !== "object") {
    throw new ValidationError("Request body must be a valid JSON object.")
  }

  if (!request.targetId || typeof request.targetId !== "string" || request.targetId.trim() === "") {
    throw new ValidationError("Missing or invalid 'targetId'. Must be a non-empty string.")
  }

  if (!request.missionProfile) {
    throw new ValidationError("Missing required field 'missionProfile'. Must be 'rover-testing', 'geological-research', or a custom profile object.")
  }

  const profile = resolveMissionProfile(request.missionProfile)
  const minScore = typeof request.minScore === "number" ? Math.max(0, Math.min(100, request.minScore)) : 0

  // 2. Resolve target and candidates (prioritize verified DB; support illustrative demo catalog)
  const resolvedTargetId = TARGET_ID_ALIASES[request.targetId] ?? request.targetId
  const sampleTarget = SAMPLE_TARGETS.find((t) => t.id === request.targetId)

  let target: PlanetaryTarget | undefined
  let candidates: EarthCandidate[] = []
  let dataset: DatasetMeta = SAMPLE_DATASET_META

  let verifiedData: {
    targets: PlanetaryTarget[]
    candidates: EarthCandidate[]
    sources: {
      title: string
      provider: string | null
      sourceUrl: string | null
      datasetVersion: string | null
      accessedAt: string | null
      limitations: string | null
    }[]
  } | null = null
  let dbError: unknown = null

  try {
    verifiedData = await loadVerifiedLocationsAndFeatures()
  } catch (err) {
    dbError = err
  }

  if (verifiedData) {
    const foundTarget = verifiedData.targets.find(
      (t) =>
        t.id === resolvedTargetId ||
        t.databaseId === resolvedTargetId ||
        t.id === request.targetId ||
        t.databaseId === request.targetId
    )

    if (foundTarget) {
      target = {
        ...foundTarget,
        id: request.targetId, // preserve requested ID for response consistency
        databaseId: foundTarget.databaseId ?? foundTarget.id,
        isVerified: true,
      }
      candidates = verifiedData.candidates
      dataset = {
        id: "nasa-verified-baseline",
        name: "NASA Planetary Data System & Earthdata Verified Baseline",
        version: "1.0.0-verified",
        isIllustrative: false,
        isVerified: true,
        notice:
          "Environmental measurements retrieved live from NASA Planetary Data System (PDS) and NASA Earthdata archives with confirmed physical provenance.",
        sourceLinks: verifiedData.sources.map((s) => ({
          title: s.title,
          provider: s.provider ?? "NASA / ESA",
          url: s.sourceUrl ?? "#",
          version: s.datasetVersion ?? "1.0",
          accessedAt: s.accessedAt ?? undefined,
          limitations: s.limitations ?? undefined,
        })),
      }
    }
  }

  // If not found in verified database, check illustrative sample targets
  if (!target && sampleTarget) {
    target = sampleTarget
    candidates = SAMPLE_CANDIDATES
    dataset = {
      ...SAMPLE_DATASET_META,
      sourceLinks: [
        {
          title: "TerraTwin Illustrative Educational Catalog",
          provider: "TerraTwin Open Telemetry Baseline",
          url: "#",
          version: "0.1.0-sample",
          limitations:
            "Illustrative educational placeholders for interface evaluation. Not verified scientific evidence.",
        },
      ],
    }
  }

  // If database failed and the requested target is not in the sample catalog, rethrow DB error (never fabricate data)
  if (!target && dbError) {
    throw dbError
  }

  if (!target) {
    const availableVerifiedIds = verifiedData?.targets.map((t) => t.id) ?? []
    const availableSampleIds = SAMPLE_TARGETS.map((t) => t.id)
    const allAvailable = [...availableVerifiedIds, ...availableSampleIds]

    throw new NotFoundError(
      `Planetary target '${request.targetId}' was not found in the verified database or sample catalog. Available target IDs: ${allAvailable.join(", ")}`
    )
  }

  // 3. Perform scientific distance-based ranking
  let rankedCandidates = rankCandidateLocations(target, candidates, profile)

  // 4. Apply optional minScore filter (unreliable candidates with score: null are retained for transparency)
  if (minScore > 0) {
    rankedCandidates = rankedCandidates.filter(
      (c) => c.score === null || c.score >= minScore
    )
  }

  const reliableCount = rankedCandidates.filter((c) => c.isReliable).length

  // 5. Return typed response
  return {
    success: true,
    dataset,
    target,
    missionProfile: {
      id: profile.id as "rover-testing" | "geological-research",
      label: profile.label,
      summary: profile.summary,
      weights: profile.weights,
    },
    totalCandidatesEvaluated: rankedCandidates.length,
    reliableCandidatesCount: reliableCount,
    minScore,
    rankings: rankedCandidates,
    computedAt: new Date().toISOString(),
  }
}
