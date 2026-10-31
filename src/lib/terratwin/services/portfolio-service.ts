import { loadVerifiedLocationsAndFeatures } from "../db/planetary-repository"
import { optimizeAnalogPortfolios } from "../portfolio-optimizer"
import {
  SAMPLE_CANDIDATES,
  SAMPLE_TARGETS,
} from "../sample-dataset"
import type { EarthCandidate, PlanetaryTarget } from "../types"
import type { PortfolioApiRequest, PortfolioApiResponse } from "../types/portfolio"
import {
  NotFoundError,
  resolveMissionProfile,
  TARGET_ID_ALIASES,
  ValidationError,
} from "./compare-service"

export async function executePortfolioOptimization(
  request: PortfolioApiRequest
): Promise<PortfolioApiResponse> {
  // 1. Input validation
  if (!request || typeof request !== "object") {
    throw new ValidationError("Request body must be a valid JSON object.")
  }

  if (!request.targetId || typeof request.targetId !== "string" || request.targetId.trim() === "") {
    throw new ValidationError("Missing or invalid 'targetId'. Must be a non-empty string.")
  }

  if (!request.missionProfile) {
    throw new ValidationError(
      "Missing required field 'missionProfile'. Must be 'rover-testing', 'geological-research', or a custom profile object."
    )
  }

  // Validate portfolio size: allowed 2 or 3 (default 2)
  let portfolioSize = 2
  if (request.portfolioSize !== undefined) {
    if (typeof request.portfolioSize !== "number" || (request.portfolioSize !== 2 && request.portfolioSize !== 3)) {
      throw new ValidationError("Invalid 'portfolioSize'. Supported portfolio sizes are 2 or 3 analog sites.")
    }
    portfolioSize = request.portfolioSize
  }

  // Validate limit: positive integer between 1 and 20 (default 10)
  let limit = 10
  if (request.limit !== undefined) {
    if (typeof request.limit !== "number" || !Number.isInteger(request.limit) || request.limit < 1 || request.limit > 20) {
      throw new ValidationError("Invalid 'limit'. Must be an integer between 1 and 20.")
    }
    limit = request.limit
  }

  const profile = resolveMissionProfile(request.missionProfile)

  // 2. Resolve target & candidates (prioritizing verified Supabase data)
  const resolvedTargetId = TARGET_ID_ALIASES[request.targetId] ?? request.targetId
  const sampleTarget = SAMPLE_TARGETS.find((t) => t.id === request.targetId)

  let target: PlanetaryTarget | undefined
  let candidates: EarthCandidate[] = []

  let verifiedData: {
    targets: PlanetaryTarget[]
    candidates: EarthCandidate[]
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
        id: request.targetId, // preserve requested target ID
        databaseId: foundTarget.databaseId ?? foundTarget.id,
        isVerified: true,
      }
      candidates = verifiedData.candidates
    }
  }

  // Fallback to sample targets if verified target not found
  if (!target && sampleTarget) {
    target = sampleTarget
    candidates = SAMPLE_CANDIDATES
  }

  // If database failed and requested target is not in sample catalog, rethrow DB error
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

  if (candidates.length < portfolioSize) {
    throw new ValidationError(
      `Insufficient candidates available (${candidates.length}) to build portfolios of size ${portfolioSize}.`
    )
  }

  // 3. Execute deterministic portfolio optimization
  const result = optimizeAnalogPortfolios(target, candidates, profile, {
    portfolioSize,
    limit,
  })

  return {
    success: true,
    result,
  }
}

