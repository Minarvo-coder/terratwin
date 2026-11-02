import { NextResponse, type NextRequest } from "next/server"
import {
  resolveTargetTransectId,
  samplePlanetaryTargetProfile,
  resolveCandidateTransectId,
  getEarthCandidateProfile,
  compareElevationProfiles,
} from "@/lib/terratwin/elevation"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetQuery = searchParams.get("targetId") || "a0000001-0000-4000-8000-000000000001"
    const candidateQuery = searchParams.get("candidateId") || "c0000005-0000-4000-8000-000000000005"
    const pointsParam = Number.parseInt(searchParams.get("points") || "35", 10)
    const points = Math.min(100, Math.max(15, Number.isNaN(pointsParam) ? 35 : pointsParam))

    const targetSpec = resolveTargetTransectId(targetQuery)
    const targetProfile = samplePlanetaryTargetProfile(
      targetSpec.id,
      targetSpec.name,
      targetSpec.body,
      points
    )

    const candidateId = resolveCandidateTransectId(candidateQuery)
    const candidateProfile = getEarthCandidateProfile(candidateId)

    const comparison = compareElevationProfiles(targetProfile, candidateProfile)
    return NextResponse.json(comparison, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ELEVATION_SAMPLING_ERROR",
          message: error instanceof Error ? error.message : "Elevation sampling failed",
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const targetQuery = body.targetId || "a0000001-0000-4000-8000-000000000001"
    const candidateQuery = body.candidateId || "c0000005-0000-4000-8000-000000000005"
    const pointsParam = Number.parseInt(String(body.points || 35), 10)
    const points = Math.min(100, Math.max(15, Number.isNaN(pointsParam) ? 35 : pointsParam))

    const targetSpec = resolveTargetTransectId(targetQuery)
    const targetProfile = samplePlanetaryTargetProfile(
      targetSpec.id,
      targetSpec.name,
      targetSpec.body,
      points
    )

    const candidateId = resolveCandidateTransectId(candidateQuery)
    const candidateProfile = getEarthCandidateProfile(candidateId)

    const comparison = compareElevationProfiles(targetProfile, candidateProfile)
    return NextResponse.json(comparison, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ELEVATION_SAMPLING_ERROR",
          message: error instanceof Error ? error.message : "Elevation sampling failed",
        },
      },
      { status: 500 }
    )
  }
}

