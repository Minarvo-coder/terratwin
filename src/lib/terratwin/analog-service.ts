import { getMissionPurpose } from "./features"
import { SAMPLE_CANDIDATES, SAMPLE_DATASET_META, SAMPLE_TARGETS } from "./sample-dataset"
import { rankCandidates } from "./similarity"
import type { AnalogQueryResult, PlanetaryTarget } from "./types"

export class AnalogQueryError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export interface AnalogQuery {
  targetId: string
  purposeId: string
  minScore: number
}

/** Data-access boundary: swap the sample imports here for a real data source. */
export function listTargets(): PlanetaryTarget[] {
  return SAMPLE_TARGETS
}

export function findAnalogs({ targetId, purposeId, minScore }: AnalogQuery): AnalogQueryResult {
  const target = SAMPLE_TARGETS.find((item) => item.id === targetId)
  if (!target) throw new AnalogQueryError(`Unknown target "${targetId}".`, 404)

  const purpose = getMissionPurpose(purposeId)
  if (!purpose) throw new AnalogQueryError(`Unknown mission purpose "${purposeId}".`, 400)

  if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
    throw new AnalogQueryError("Minimum score must be a number between 0 and 100.", 400)
  }

  const ranked = rankCandidates(target, SAMPLE_CANDIDATES, purpose)

  return {
    dataset: SAMPLE_DATASET_META,
    target,
    purpose,
    minScore,
    totalCandidates: ranked.length,
    results: ranked.filter((result) => result.score >= minScore),
  }
}
