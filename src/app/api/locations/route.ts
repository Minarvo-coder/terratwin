import { NextResponse, type NextRequest } from "next/server"
import { DatabaseError, fetchLocations } from "@/lib/terratwin/db/planetary-repository"
import type { ApiErrorResponse, LocationsApiResponse } from "@/lib/terratwin/types/api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const roleParam = searchParams.get("role")?.toLowerCase()
    const bodyParam = searchParams.get("body")

    let role: "target" | "candidate" | undefined = undefined
    if (roleParam === "target" || roleParam === "candidate") {
      role = roleParam
    } else if (roleParam) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: "INVALID_PARAM",
          message: `Invalid role parameter '${roleParam}'. Expected 'target' or 'candidate'.`,
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    let body: "Earth" | "Moon" | "Mars" | undefined = undefined
    if (bodyParam) {
      const normalizedBody = bodyParam.charAt(0).toUpperCase() + bodyParam.slice(1).toLowerCase()
      if (normalizedBody === "Earth" || normalizedBody === "Moon" || normalizedBody === "Mars") {
        body = normalizedBody as "Earth" | "Moon" | "Mars"
      } else {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: "INVALID_PARAM",
            message: `Invalid body parameter '${bodyParam}'. Expected 'Earth', 'Moon', or 'Mars'.`,
          },
        }
        return NextResponse.json(errorResponse, { status: 400 })
      }
    }

    const locations = await fetchLocations({ role, body })

    const targets = locations.filter((l) => l.locationRole === "target")
    const candidates = locations.filter((l) => l.locationRole === "candidate")

    const response: LocationsApiResponse = {
      success: true,
      totalCount: locations.length,
      targetsCount: targets.length,
      candidatesCount: candidates.length,
      targets,
      candidates,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    if (error instanceof DatabaseError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Unable to query planetary locations from Supabase database. Real scientific data cannot be served at this time.",
        },
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    const genericError: ApiErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while fetching locations.",
      },
    }
    return NextResponse.json(genericError, { status: 500 })
  }
}
