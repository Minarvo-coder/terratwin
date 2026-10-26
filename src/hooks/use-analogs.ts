import useSWR from "swr"
import type { ApiErrorResponse, CompareApiRequest, CompareApiResponse } from "@/lib/terratwin/types/api"
import type { MissionPurpose, RankedCandidate } from "@/lib/terratwin/types"

export class AnalogFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = "AnalogFetchError"
  }
}

export type AnalogComparisonData = CompareApiResponse & {
  // Aliases for seamless UI component compatibility
  results: RankedCandidate[]
  purpose: CompareApiResponse["missionProfile"]
  totalCandidates: number
}

async function postCompare(requestPayload: CompareApiRequest): Promise<AnalogComparisonData> {
  const response = await fetch("/api/compare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | { error?: string } | null
    const errorMessage =
      (errorBody && "error" in errorBody && typeof errorBody.error === "object"
        ? errorBody.error.message
        : (errorBody as { error?: string })?.error) ??
      `Scientific comparison request failed with status ${response.status}.`

    const errorCode =
      errorBody && "error" in errorBody && typeof errorBody.error === "object"
        ? errorBody.error.code
        : "FETCH_ERROR"

    const details =
      errorBody && "error" in errorBody && typeof errorBody.error === "object"
        ? errorBody.error.details
        : undefined

    throw new AnalogFetchError(errorMessage, response.status, errorCode, details)
  }

  const data = (await response.json()) as CompareApiResponse

  return {
    ...data,
    results: data.rankings,
    purpose: data.missionProfile,
    totalCandidates: data.totalCandidatesEvaluated,
  }
}

export interface UseAnalogsParams {
  targetId: string
  purposeId: MissionPurpose | string
  minScore: number
}

/**
 * Client hook for querying the POST /api/compare endpoint with strict validation.
 * Never fabricates synthetic scores upon failure.
 */
export function useAnalogs({ targetId, purposeId, minScore }: UseAnalogsParams) {
  // Validation: If no target is selected, do not dispatch the request
  const isValidTargetSelected = typeof targetId === "string" && targetId.trim().length > 0
  const swrKey = isValidTargetSelected
    ? ["/api/compare", targetId.trim(), purposeId, minScore]
    : null

  const swr = useSWR<AnalogComparisonData, AnalogFetchError>(
    swrKey,
    () => postCompare({ targetId: targetId.trim(), missionProfile: purposeId, minScore }),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  return {
    ...swr,
    isTargetValid: isValidTargetSelected,
  }
}
