import { NextResponse } from "next/server"
import { DatabaseError, fetchDatasetSources } from "@/lib/terratwin/db/planetary-repository"
import type { ApiErrorResponse, SourcesApiResponse } from "@/lib/terratwin/types/api"

export async function GET() {
  try {
    const sources = await fetchDatasetSources()

    const response: SourcesApiResponse = {
      success: true,
      totalCount: sources.length,
      sources,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    })
  } catch (error) {
    if (error instanceof DatabaseError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Unable to query verified dataset sources from Supabase database.",
        },
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    const genericError: ApiErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while fetching dataset sources.",
      },
    }
    return NextResponse.json(genericError, { status: 500 })
  }
}
