import { NextResponse, type NextRequest } from "next/server"
import { AnalogQueryError, findAnalogs } from "@/lib/terratwin/analog-service"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  if (process.env.NODE_ENV !== "production" && params.get("simulate") === "error") {
    return NextResponse.json({ error: "Simulated data service failure (development only)." }, { status: 503 })
  }

  try {
    const result = await findAnalogs({
      targetId: params.get("target") ?? "",
      purposeId: params.get("purpose") ?? "",
      minScore: Number(params.get("minScore") ?? 0),
      mode: (params.get("mode") as "verified" | "sample" | "all") ?? "all",
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AnalogQueryError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Unexpected error while ranking candidates." }, { status: 500 })
  }
}
