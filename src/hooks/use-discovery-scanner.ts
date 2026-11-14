"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  buildDiscoveryRequestPayload,
  submitDiscoveryScan,
  type ParsedDiscoverApiError,
  type ScannerConfigDraft,
} from "@/lib/terratwin/scanner/scanner-utils"
import type { RegionalDiscoveryResponse } from "@/lib/terratwin/types/discovery"

export type DiscoveryScanLifecycle =
  | "idle"
  | "validating"
  | "submitting"
  | "success"
  | "partial-success"
  | "insufficient-data"
  | "rate-limited"
  | "error"
  | "aborted"

export interface UseDiscoveryScannerState {
  lifecycle: DiscoveryScanLifecycle
  statusMessage: string | null
  response: RegionalDiscoveryResponse | null
  error: ParsedDiscoverApiError | null
  resultTargetId: string | null
  resultMissionProfileId: string | null
  isBusy: boolean
}

export function useDiscoveryScanner() {
  const [state, setState] = useState<UseDiscoveryScannerState>({
    lifecycle: "idle",
    statusMessage: null,
    response: null,
    error: null,
    resultTargetId: null,
    resultMissionProfileId: null,
    isBusy: false,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const requestSeqRef = useRef(0)

  // Clean up pending request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const cancelScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lifecycle: prev.isBusy ? prev.lifecycle : "idle",
      statusMessage: null,
      response: null,
      error: null,
      resultTargetId: null,
      resultMissionProfileId: null,
    }))
  }, [])

  const launchScan = useCallback(async (draft: ScannerConfigDraft): Promise<boolean> => {
    // Prevent accidental duplicate simultaneous clicks
    if (abortControllerRef.current) {
      return false
    }

    const reqId = ++requestSeqRef.current
    setState((prev) => ({
      ...prev,
      lifecycle: "validating",
      statusMessage: "Validating region geometry and grid bounds…",
      error: null,
      isBusy: true,
    }))

    const { payload, error: validationError } = buildDiscoveryRequestPayload(draft)
    if (!payload || validationError) {
      setState((prev) => ({
        ...prev,
        lifecycle: "error",
        statusMessage: validationError ?? "Invalid scan parameters.",
        error: {
          status: 400,
          code: "CLIENT_VALIDATION_ERROR",
          message: validationError ?? "Invalid scan parameters.",
          retryAfterSec: null,
          isRateLimited: false,
        },
        isBusy: false,
      }))
      return false
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setState((prev) => ({
      ...prev,
      lifecycle: "submitting",
      statusMessage: "Requesting regional scientific data and evaluating planetary analog evidence…",
      error: null,
      isBusy: true,
    }))

    const result = await submitDiscoveryScan(payload, { signal: controller.signal })

    // Ignore stale response if a newer request superseded it
    if (reqId !== requestSeqRef.current) {
      return false
    }
    abortControllerRef.current = null

    if (result.ok) {
      const statusText =
        result.outcome === "insufficient-data"
          ? "Scan completed, but no candidates met the 40% minimum evidence coverage threshold."
          : result.outcome === "partial-success"
          ? "Scan completed with partial provider availability. Missing measurements remain null."
          : `Evaluated ${result.response.totalCellsEvaluated} regional grid cells.`

      setState({
        lifecycle: result.outcome,
        statusMessage: statusText,
        response: result.response,
        error: null,
        resultTargetId: result.response.target.id,
        resultMissionProfileId: result.response.missionProfile.id,
        isBusy: false,
      })
      return true
    }

    if (result.aborted) {
      setState((prev) => ({
        ...prev,
        lifecycle: "aborted",
        statusMessage: result.error.message,
        error: null,
        isBusy: false,
      }))
      return false
    }

    setState((prev) => ({
      ...prev,
      lifecycle: result.error.isRateLimited ? "rate-limited" : "error",
      statusMessage: result.error.message,
      error: result.error,
      isBusy: false,
    }))
    return false
  }, [])

  return {
    ...state,
    launchScan,
    cancelScan,
    clearResults,
  }
}
