import { NextResponse, type NextRequest } from "next/server"
import { executeRegionalDiscovery } from "@/lib/terratwin/services/discovery-engine"
import { GridValidationError } from "@/lib/terratwin/services/grid-generator"
import { NotFoundError, ValidationError } from "@/lib/terratwin/services/compare-service"
import {
  checkDiscoverRateLimit,
  extractClientIdentifier,
} from "@/lib/terratwin/utils/rate-limiter"
import type { ApiErrorResponse } from "@/lib/terratwin/types/api"
import type { RegionalDiscoveryRequest } from "@/lib/terratwin/types/discovery"

export async function POST(request: NextRequest) {
  // Distributed Upstash Redis sliding-window rate limiter with safe local/degraded fallback
  const clientKey = extractClientIdentifier(request.headers)
  const rateDecision = await checkDiscoverRateLimit(clientKey)

  if (rateDecision.serviceUnavailable) {
    const unavailableError: ApiErrorResponse = {
      success: false,
      error: {
        code: "RATE_LIMIT_BACKEND_UNAVAILABLE",
        message: "Rate-limiting protection backend is temporarily unavailable. Please retry shortly.",
        details: {
          retryAfterSec: rateDecision.retryAfterSec,
          scope: rateDecision.scope,
          mode: rateDecision.mode,
        },
      },
    }
    return NextResponse.json(unavailableError, {
      status: 503,
      headers: {
        "Retry-After": String(rateDecision.retryAfterSec),
        "X-RateLimit-Mode": rateDecision.mode,
      },
    })
  }

  if (!rateDecision.allowed) {
    const rateError: ApiErrorResponse = {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many discovery requests from this client in the current window. Please retry shortly.",
        details: {
          limit: rateDecision.limit,
          retryAfterSec: rateDecision.retryAfterSec,
          scope: rateDecision.scope,
          mode: rateDecision.mode,
        },
      },
    }
    return NextResponse.json(rateError, {
      status: 429,
      headers: {
        "Retry-After": String(rateDecision.retryAfterSec),
        "X-RateLimit-Limit": String(rateDecision.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(rateDecision.resetAtMs / 1000)),
        "X-RateLimit-Mode": rateDecision.mode,
      },
    })
  }

  const baseRateHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(rateDecision.limit),
    "X-RateLimit-Remaining": String(rateDecision.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rateDecision.resetAtMs / 1000)),
    "X-RateLimit-Mode": rateDecision.mode,
  }

  let body: RegionalDiscoveryRequest

  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      const invalidShape: ApiErrorResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body must be a JSON object matching RegionalDiscoveryRequest.",
        },
      }
      return NextResponse.json(invalidShape, { status: 400, headers: baseRateHeaders })
    }
    body = parsed as RegionalDiscoveryRequest
  } catch (parseErr) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON.",
        details: parseErr instanceof Error ? parseErr.message : String(parseErr),
      },
    }
    return NextResponse.json(errorResponse, { status: 400, headers: baseRateHeaders })
  }

  try {
    const result = await executeRegionalDiscovery(body)
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        ...baseRateHeaders,
        "X-TerraTwin-Cache": result.searchMetadata.responseCacheHit ? "HIT" : "MISS",
      },
    })
  } catch (error) {
    if (error instanceof GridValidationError || error instanceof ValidationError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.details,
        },
      }
      return NextResponse.json(errorResponse, { status: 400, headers: baseRateHeaders })
    }

    if (error instanceof NotFoundError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: "TARGET_NOT_FOUND",
          message: error.message,
        },
      }
      return NextResponse.json(errorResponse, { status: 404, headers: baseRateHeaders })
    }

    // Log internal exception server-side; return sanitized error payload without internal stack details
    console.error("API /api/discover unexpected failure:", error)
    const unexpectedError: ApiErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during regional discovery screening.",
      },
    }
    return NextResponse.json(unexpectedError, { status: 500, headers: baseRateHeaders })
  }
}
