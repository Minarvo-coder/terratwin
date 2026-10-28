import { NextResponse, type NextRequest } from "next/server"
import { DatabaseError } from "@/lib/terratwin/db/planetary-repository"
import {
  executeAnalogComparison,
  NotFoundError,
  ValidationError,
} from "@/lib/terratwin/services/compare-service"
import type { ApiErrorResponse, CompareApiRequest } from "@/lib/terratwin/types/api"

export async function POST(request: NextRequest) {
  let body: CompareApiRequest

  try {
    body = await request.json()
  } catch (parseErr) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON.",
        details: parseErr instanceof Error ? parseErr.message : String(parseErr),
      },
    }
    return NextResponse.json(errorResponse, { status: 400 })
  }

  try {
    const result = await executeAnalogComparison(body)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ValidationError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.details,
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    if (error instanceof NotFoundError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: "TARGET_NOT_FOUND",
          message: error.message,
        },
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    if (error instanceof DatabaseError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Database connection failed while retrieving scientific telemetry records. Scientific calculations cannot be performed without verified data.",
        },
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    console.error("API /api/compare error:", error)
    const unexpectedError: ApiErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during analog comparison.",
        details: error instanceof Error ? error.stack : String(error),
      },
    }
    return NextResponse.json(unexpectedError, { status: 500 })
  }
}
