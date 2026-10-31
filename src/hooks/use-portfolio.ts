import useSWR from "swr"
import type { ApiErrorResponse } from "@/lib/terratwin/types/api"
import type {
  PortfolioApiRequest,
  PortfolioApiResponse,
  PortfolioOptimizationResult,
} from "@/lib/terratwin/types/portfolio"

export class PortfolioFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = "PortfolioFetchError"
  }
}

async function postPortfolio(requestPayload: PortfolioApiRequest): Promise<PortfolioOptimizationResult> {
  const response = await fetch("/api/portfolio", {
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
      `Portfolio optimization request failed with status ${response.status}.`

    const errorCode =
      errorBody && "error" in errorBody && typeof errorBody.error === "object"
        ? errorBody.error.code
        : "FETCH_ERROR"

    const details =
      errorBody && "error" in errorBody && typeof errorBody.error === "object"
        ? errorBody.error.details
        : undefined

    throw new PortfolioFetchError(errorMessage, response.status, errorCode, details)
  }

  const data = (await response.json()) as PortfolioApiResponse
  return data.result
}

export interface UsePortfolioParams {
  targetId: string
  purposeId: string
  portfolioSize: number
  limit?: number
  enabled?: boolean
}

/**
 * Client hook for querying the POST /api/portfolio endpoint with strict validation.
 * Supports on-demand and automatic synchronization.
 */
export function usePortfolio({
  targetId,
  purposeId,
  portfolioSize,
  limit = 5,
  enabled = true,
}: UsePortfolioParams) {
  const isValidTargetSelected = typeof targetId === "string" && targetId.trim().length > 0
  const swrKey = enabled && isValidTargetSelected
    ? ["/api/portfolio", targetId.trim(), purposeId, portfolioSize, limit]
    : null

  const swr = useSWR<PortfolioOptimizationResult, PortfolioFetchError>(
    swrKey,
    () =>
      postPortfolio({
        targetId: targetId.trim(),
        missionProfile: purposeId,
        portfolioSize,
        limit,
      }),
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

