"use client"

import useSWR from "swr"
import type { ElevationComparisonResponse } from "@/lib/terratwin/types"

const fetcher = async (url: string): Promise<ElevationComparisonResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error?.message || `Elevation API failed with status ${res.status}`)
  }
  return res.json()
}

export interface UseElevationOptions {
  targetId?: string
  candidateId?: string
  points?: number
  enabled?: boolean
}

export function useElevation({
  targetId,
  candidateId,
  points = 35,
  enabled = true,
}: UseElevationOptions) {
  const shouldFetch = enabled && !!targetId && !!candidateId

  const key = shouldFetch
    ? `/api/elevation?targetId=${encodeURIComponent(targetId)}&candidateId=${encodeURIComponent(candidateId)}&points=${points}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<ElevationComparisonResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading: shouldFetch ? isLoading : false,
    isValidating,
    mutate,
  }
}
