import {
  GEOLOGICAL_RESEARCH_PROFILE,
  ROVER_TESTING_PROFILE,
  validateMissionWeights,
  type ConfigurableMissionProfile,
} from "../config/comparison-config"
import { loadVerifiedLocationsAndFeatures } from "../db/planetary-repository"
import { rankCandidateLocations } from "../similarity-engine"
import type { CompareApiRequest, CompareApiResponse } from "../types/api"

export class ValidationError extends Error {
  public readonly status: number = 400
  constructor(message: string, public readonly details?: unknown) {
    super(message)
    this.name = "ValidationError"
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

/**
 * Executes scientific analog comparison:
 * 1. Validates inputs.
 * 2. Retrieves verified target & candidates from Supabase (server-side).
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

  // 2. Load verified data from Supabase — never fabricate when DB fails
  const { targets, candidates } = await loadVerifiedLocationsAndFeatures()

  // 3. Find the requested target
  const target = targets.find(
    (t) => t.id === request.targetId || t.databaseId === request.targetId
  )

  if (!target) {
    throw new NotFoundError(
      `Planetary target '${request.targetId}' was not found in the verified database. Available target IDs: ${targets.map((t) => t.id).join(", ")}`
    )
  }

  // 4. Perform scientific distance-based ranking
  let rankedCandidates = rankCandidateLocations(target, candidates, profile)

  // 5. Apply optional minScore filter (unreliable candidates with score: null are retained for transparency)
  if (minScore > 0) {
    rankedCandidates = rankedCandidates.filter(
      (c) => c.score === null || c.score >= minScore
    )
  }

  const reliableCount = rankedCandidates.filter((c) => c.isReliable).length

  // 6. Return typed response
  return {
    success: true,
    target: {
      id: target.id,
      name: target.name,
      body: target.body,
      region: target.region,
      summary: target.summary,
      isVerified: target.isVerified ?? true,
    },
    missionProfile: {
      id: profile.id,
      label: profile.label,
      summary: profile.summary,
    },
    totalCandidatesEvaluated: rankedCandidates.length,
    reliableCandidatesCount: reliableCount,
    rankings: rankedCandidates,
    computedAt: new Date().toISOString(),
  }
}
