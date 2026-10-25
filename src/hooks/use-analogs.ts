import useSWR from "swr"
import type { AnalogApiError, AnalogQueryResult } from "@/lib/terratwin/types"

export class AnalogFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function fetchAnalogs(url: string): Promise<AnalogQueryResult> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as AnalogApiError | null
    throw new AnalogFetchError(body?.error ?? `Request failed with status ${response.status}.`, response.status)
  }
  return response.json()
}

interface UseAnalogsParams {
  targetId: string
  purposeId: string
  minScore: number
  simulate?: string
}

export function useAnalogs({ targetId, purposeId, minScore, simulate }: UseAnalogsParams) {
  const params = new URLSearchParams({ target: targetId, purpose: purposeId, minScore: String(minScore) })
  if (simulate) params.set("simulate", simulate)

  return useSWR<AnalogQueryResult, AnalogFetchError>(`/api/analogs?${params.toString()}`, fetchAnalogs, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
}
