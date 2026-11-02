"use client"

import "leaflet/dist/leaflet.css"
import { useEffect } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet"
import type { RankedCandidate } from "@/lib/terratwin/types"
import { formatCoordinates, formatFeatureValue } from "@/lib/terratwin/format"
import {
  ENVIRONMENTAL_MAP_LAYER_MAP,
  SATELLITE_LAYER_MAP,
  resolveSatelliteTileUrl,
  type MapParameterLayerId,
  type SatelliteImageryLayerId,
} from "@/lib/terratwin/config/satellite-layers"
import { Compass, ExternalLink, ShieldCheck, AlertTriangle, Layers } from "lucide-react"
import { isValidCoordinate } from "@/lib/terratwin/geo"

const MARKER_SELECTED_STROKE = "#ffffff"
const MARKER_DEFAULT_STROKE = "#0284c7"

export { isValidCoordinate }

export interface AnalogMapCanvasProps {
  results: RankedCandidate[]
  selectedId: string | null
  onSelect: (id: string) => void
  imageryLayerId?: SatelliteImageryLayerId
  imageryDate?: string
  imageryOpacity?: number
  parameterLayerId?: MapParameterLayerId
}

function KeepSelectionInView({ selected }: { selected: RankedCandidate | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (!selected) return
    if (!isValidCoordinate(selected.candidate?.latitude, selected.candidate?.longitude)) return
    const point: [number, number] = [selected.candidate.latitude, selected.candidate.longitude]
    if (!map.getBounds().contains(point)) {
      map.panTo(point, { animate: true, duration: 0.8 })
    }
  }, [map, selected])
  return null
}

function FitToResults({ results }: { results: RankedCandidate[] }) {
  const map = useMap()
  const boundsKey = results
    .filter((r) => isValidCoordinate(r.candidate?.latitude, r.candidate?.longitude))
    .map((r) => `${r.candidate.latitude},${r.candidate.longitude}`)
    .join(";")

  useEffect(() => {
    const validPoints = results
      .filter((result) => isValidCoordinate(result.candidate?.latitude, result.candidate?.longitude))
      .map((result): [number, number] => [result.candidate.latitude, result.candidate.longitude])

    if (validPoints.length === 0) return
    map.fitBounds(validPoints, { padding: [36, 36], maxZoom: 6, animate: false })
  }, [map, boundsKey, results])

  return null
}

export default function AnalogMapCanvas({
  results,
  selectedId,
  onSelect,
  imageryLayerId = "dark-base",
  imageryDate = "2024-07-15",
  imageryOpacity = 0.9,
  parameterLayerId = "similarity",
}: AnalogMapCanvasProps) {
  // Filter out any candidates with invalid or missing coordinates
  const validResults = results.filter((result) =>
    isValidCoordinate(result.candidate?.latitude, result.candidate?.longitude)
  )

  const selected = validResults.find((result) => result.candidate.id === selectedId)

  // Render selected marker last so its SVG circle is on top
  const ordered = [...validResults].sort(
    (a, b) => Number(a.candidate.id === selectedId) - Number(b.candidate.id === selectedId)
  )

  const activeImagery = SATELLITE_LAYER_MAP[imageryLayerId] ?? SATELLITE_LAYER_MAP["dark-base"]
  const activeParamLayer =
    ENVIRONMENTAL_MAP_LAYER_MAP[parameterLayerId] ?? ENVIRONMENTAL_MAP_LAYER_MAP["similarity"]
  const resolvedTileUrl = resolveSatelliteTileUrl(activeImagery.id, imageryDate)
  const darkBaseLayer = SATELLITE_LAYER_MAP["dark-base"]

  return (
    <div className="relative size-full">
      {validResults.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 p-6 text-center font-mono backdrop-blur-sm">
          <AlertTriangle className="size-8 text-amber-400 mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            No Geospatial Coordinates Available
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            None of the returned candidate records contain valid WGS84 latitude and longitude coordinates to plot on the globe.
          </p>
        </div>
      )}

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={1}
        maxZoom={16}
        worldCopyJump
        scrollWheelZoom={false}
        className="size-full bg-slate-950"
        aria-label="Interactive NASA satellite and environmental telemetry map of Earth analog candidate locations"
      >
        {/* Base Cartographic Layer (always rendered underneath when an overlay or dark-base is active) */}
        {(activeImagery.id === "dark-base" || activeImagery.isOverlayOnDarkBase || imageryOpacity < 1) && (
          <TileLayer
            key="base-dark-gray"
            attribution={darkBaseLayer.attribution}
            url={darkBaseLayer.tileUrlTemplate}
            maxNativeZoom={darkBaseLayer.maxNativeZoom}
            maxZoom={darkBaseLayer.maxZoom}
          />
        )}

        {/* Active NASA GIBS / Remote-Sensing Imagery Tile Layer */}
        {activeImagery.id !== "dark-base" && (
          <TileLayer
            key={`${activeImagery.id}-${activeImagery.supportsDate ? imageryDate : "static"}`}
            attribution={activeImagery.attribution}
            url={resolvedTileUrl}
            maxNativeZoom={activeImagery.maxNativeZoom}
            maxZoom={activeImagery.maxZoom}
            opacity={imageryOpacity}
          />
        )}

        <FitToResults results={validResults} />
        <KeepSelectionInView selected={selected} />

        {ordered.map((result) => {
          const isSelected = result.candidate.id === selectedId
          const scoreVal = result.score ?? 0

          // Extract value for active environmental parameter layer
          const rawFeatureVal =
            activeParamLayer.featureKey !== null
              ? (result.candidate.environment[activeParamLayer.featureKey] ?? null)
              : result.score

          const formattedLayerVal =
            activeParamLayer.featureKey !== null
              ? formatFeatureValue(activeParamLayer.featureKey, rawFeatureVal)
              : result.scoreDisplay

          const fillColor = activeParamLayer.getColor(rawFeatureVal)
          const radius = isSelected ? 13 : 7 + (scoreVal / 100) * 5
          const isMissingParam = rawFeatureVal === null || rawFeatureVal === undefined

          return (
            <CircleMarker
              key={`${result.candidate.id}-${activeParamLayer.id}`}
              center={[result.candidate.latitude, result.candidate.longitude]}
              radius={radius}
              pathOptions={{
                color: isSelected
                  ? MARKER_SELECTED_STROKE
                  : isMissingParam || !result.isReliable
                  ? "#f43f5e"
                  : MARKER_DEFAULT_STROKE,
                weight: isSelected ? 3 : 1.75,
                fillColor,
                fillOpacity: isSelected ? 0.95 : isMissingParam ? 0.35 : 0.78,
                dashArray:
                  isMissingParam || !result.isReliable || result.confidence === "low" ? "3 3" : undefined,
              }}
              eventHandlers={{
                click: () => onSelect(result.candidate.id),
              }}
            >
              {/* Hover Tooltip for quick telemetry preview */}
              <Tooltip direction="top" offset={[0, -8]}>
                <div className="font-mono text-xs">
                  <span className="font-bold text-cyan-300">
                    #{result.rank} {result.candidate.name}
                  </span>
                  <div className="text-[10px] text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <span className="text-slate-400">{activeParamLayer.shortLabel}:</span>
                    <strong className="text-white">{formattedLayerVal}</strong>
                  </div>
                  {activeParamLayer.id !== "similarity" && (
                    <div className="text-[10px] text-slate-300">
                      Match Score:{" "}
                      <strong className={result.score === null ? "text-rose-400" : "text-cyan-300"}>
                        {result.scoreDisplay}
                      </strong>
                    </div>
                  )}
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {result.candidate.country} · Click marker for full telemetry
                  </div>
                </div>
              </Tooltip>

              {/* Interactive Click Popup with full telemetry brief and focus action */}
              <Popup>
                <div className="flex min-w-[235px] max-w-[290px] flex-col gap-2 p-1 font-mono text-xs text-slate-200">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-1.5">
                    <div>
                      <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                        RANK #{result.rank} CANDIDATE
                      </div>
                      <h4 className="text-xs font-bold text-white mt-0.5 leading-snug">
                        {result.candidate.name}
                      </h4>
                    </div>
                    {result.candidate.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 shrink-0">
                        <ShieldCheck className="size-2.5 text-emerald-400" />
                        <span>NASA DB</span>
                      </span>
                    ) : (
                      <span className="rounded border border-amber-500/40 bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 shrink-0">
                        DEMO
                      </span>
                    )}
                  </div>

                  {/* Active Parameter Highlight Box */}
                  <div className="rounded border border-cyan-500/30 bg-slate-900/90 px-2.5 py-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Layers className="size-2.5 text-cyan-400" />
                      {activeParamLayer.shortLabel}
                    </span>
                    <span className="text-xs font-bold text-cyan-300">{formattedLayerVal}</span>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Compass className="size-2.5 text-cyan-400" />
                        COORDINATES
                      </span>
                      <span className="text-slate-200 font-semibold">
                        {formatCoordinates(result.candidate.latitude, result.candidate.longitude)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">SIMILARITY SCORE</span>
                      <span className={`font-bold ${result.score === null ? "text-rose-400" : "text-cyan-300"}`}>
                        {result.scoreDisplay}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">ELEVATION / SLOPE</span>
                      <span className="text-slate-200">
                        {formatFeatureValue("elevationM", result.candidate.environment.elevationM ?? null)} ·{" "}
                        {formatFeatureValue("meanSlopeDeg", result.candidate.environment.meanSlopeDeg ?? null)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">MEAN TEMP / ALBEDO</span>
                      <span className="text-slate-200">
                        {formatFeatureValue("meanSurfaceTempC", result.candidate.environment.meanSurfaceTempC ?? null)} ·{" "}
                        {formatFeatureValue("albedo", result.candidate.environment.albedo ?? null)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">MISSION COVERAGE</span>
                      <span className="text-slate-200 font-semibold">
                        {Math.round(result.coverage * 100)}% ({result.confidence})
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                      <span className="text-slate-500">SETTING: </span>
                      <span className="text-slate-300 capitalize">{result.candidate.setting}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelect(result.candidate.id)}
                    className="mt-1 flex items-center justify-center gap-1.5 w-full rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 py-1.5 text-center text-[10px] font-bold text-cyan-300 transition cursor-pointer"
                  >
                    <span>VIEW FULL TELEMETRY</span>
                    <ExternalLink className="size-2.5" />
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
