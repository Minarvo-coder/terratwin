import { NextResponse, type NextRequest } from "next/server"
import {
  fetchDatasetSources,
  loadVerifiedLocationsAndFeatures,
} from "@/lib/terratwin/db/planetary-repository"
import { FEATURES } from "@/lib/terratwin/features"
import { FEATURE_COMPATIBILITY_MATRIX } from "@/lib/terratwin/config/compatibility-matrix"

function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format")?.toLowerCase() || "json"

    // Load full verified targets, candidates, and sources
    const data = await loadVerifiedLocationsAndFeatures()
    const allLocations = [...data.targets, ...data.candidates]
    const sources = await fetchDatasetSources().catch(() => data.sources)

    if (format === "csv") {
      const csvHeaders = [
        "Location ID",
        "Name",
        "Planetary Body",
        "Role",
        "Latitude",
        "Longitude",
        "Setting or Geological Context",
        "Mean Surface Temp (°C)",
        "Diurnal Temp Range (°C)",
        "Annual Precipitation (mm)",
        "Mean Slope (°)",
        "Rock Abundance (%)",
        "Median Grain Size (mm)",
        "Surface Albedo",
        "Vegetation Cover (%)",
        "Primary Lithology",
        "Surface Elevation (m)",
        "Surface Pressure (Pa)",
        "Solar Irradiance (W/m²)",
        "Attributed Instruments & Sources",
      ]

      const csvRows: string[] = [csvHeaders.join(",")]

      for (const loc of allLocations) {
        const isTarget = "body" in loc
        const body = isTarget ? (loc.body === "mars" ? "Mars" : "Moon") : "Earth"
        const role = isTarget ? "target" : "candidate"
        const context = isTarget ? loc.summary : `${loc.country} — ${loc.setting}`
        const env = isTarget ? loc.environment : loc.environment
        const prov = isTarget ? loc.provenanceMap || {} : loc.provenanceMap || {}

        // Gather unique sources attributed to this location
        const uniqueSources = Array.from(
          new Set(
            Object.values(prov)
              .map((p) => p.sourceTitle)
              .filter(Boolean)
          )
        ).join("; ")

        const row = [
          escapeCsvField(loc.id),
          escapeCsvField(loc.name),
          escapeCsvField(body),
          escapeCsvField(role),
          loc.latitude !== undefined && loc.latitude !== null ? loc.latitude.toFixed(4) : "",
          loc.longitude !== undefined && loc.longitude !== null ? loc.longitude.toFixed(4) : "",
          escapeCsvField(context),
          escapeCsvField(env.meanSurfaceTempC),
          escapeCsvField(env.diurnalTempRangeC),
          escapeCsvField(env.annualPrecipitationMm),
          escapeCsvField(env.meanSlopeDeg),
          escapeCsvField(env.rockAbundancePct),
          escapeCsvField(env.medianGrainSizeMm),
          escapeCsvField(env.albedo),
          escapeCsvField(env.vegetationCoverPct),
          escapeCsvField(env.lithology),
          escapeCsvField(env.elevationM),
          escapeCsvField(env.surfacePressurePa),
          escapeCsvField(env.surfaceSolarIrradianceWm2),
          escapeCsvField(uniqueSources),
        ]

        csvRows.push(row.join(","))
      }

      const csvString = csvRows.join("\r\n")

      return new NextResponse(csvString, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="terratwin_scientific_telemetry_matrix.csv"',
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      })
    }

    // Default JSON export
    const exportPayload = {
      terratwin_version: "1.0.0",
      export_timestamp: new Date().toISOString(),
      metadata: {
        title: "TerraTwin Scientific Telemetry & Provenance Catalog",
        description:
          "Authoritative, traceable planetary analog environmental data extracted from NASA Planetary Data System (PDS), NASA Langley POWER climatology, and peer-reviewed geological field studies.",
        contact: "NASA Space Apps Challenge — TerraTwin Research Team",
      },
      physical_feature_definitions: FEATURES.map((f) => ({
        key: f.key,
        label: f.label,
        unit: f.unit,
        description: f.description,
        kind: f.kind,
        isCrossBodyComparable: f.isCrossBodyComparable,
        incomparabilityNotice: f.incomparabilityNotice ?? null,
      })),
      feature_compatibility_matrix: FEATURE_COMPATIBILITY_MATRIX,
      official_dataset_sources: sources,
      planetary_targets: data.targets.map((t) => ({
        id: t.id,
        name: t.name,
        planetaryBody: t.body,
        region: t.region,
        coordinates: { latitude: t.latitude, longitude: t.longitude },
        summary: t.summary,
        environmentalTelemetry: t.environment,
        provenance: t.provenanceMap,
      })),
      earth_analog_candidates: data.candidates.map((c) => ({
        id: c.id,
        name: c.name,
        country: c.country,
        coordinates: { latitude: c.latitude, longitude: c.longitude },
        geologicalSetting: c.setting,
        summary: c.summary,
        environmentalTelemetry: c.environment,
        provenance: c.provenanceMap,
      })),
    }

    return NextResponse.json(exportPayload, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="terratwin_scientific_catalog.json"',
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "EXPORT_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate scientific export.",
        },
      },
      { status: 500 }
    )
  }
}
