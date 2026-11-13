"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useRef } from "react"
import type { RankedCandidate } from "@/lib/terratwin/types"
import { formatCoordinates, formatFeatureValue } from "@/lib/terratwin/format"
import {
  ENVIRONMENTAL_MAP_LAYER_MAP,
  SATELLITE_LAYER_MAP,
  resolveSatelliteTileUrl,
  type MapParameterLayerId,
  type SatelliteImageryLayerId,
} from "@/lib/terratwin/config/satellite-layers"
import { AlertTriangle } from "lucide-react"
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
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
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const baseTileRef = useRef<L.TileLayer | null>(null)
  const overlayTileRef = useRef<L.TileLayer | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const prevBoundsKeyRef = useRef<string>("")
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  // Filter out any candidates with invalid or missing coordinates
  const validResults = results.filter((result) =>
    isValidCoordinate(result.candidate?.latitude, result.candidate?.longitude)
  )

  const selected = validResults.find((result) => result.candidate.id === selectedId)

  // Render selected marker last so its SVG circle is on top
  const ordered = [...validResults].sort(
    (a, b) => Number(a.candidate.id === selectedId) - Number(b.candidate.id === selectedId)
  )

  const boundsKey = validResults
    .map((r) => `${r.candidate.latitude},${r.candidate.longitude}`)
    .join(";")

  const activeImagery = SATELLITE_LAYER_MAP[imageryLayerId] ?? SATELLITE_LAYER_MAP["dark-base"]
  const activeParamLayer =
    ENVIRONMENTAL_MAP_LAYER_MAP[parameterLayerId] ?? ENVIRONMENTAL_MAP_LAYER_MAP["similarity"]
  const resolvedTileUrl = resolveSatelliteTileUrl(activeImagery.id, imageryDate)
  const darkBaseLayer = SATELLITE_LAYER_MAP["dark-base"]

  // 1. Initialize Leaflet Map instance directly (avoids react-leaflet React 19 StrictMode pane bugs)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if ("_leaflet_id" in container) {
      delete (container as unknown as Record<string, unknown>)._leaflet_id
    }

    const map = L.map(container, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 16,
      worldCopyJump: true,
      scrollWheelZoom: false,
    })

    mapRef.current = map
    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer

    return () => {
      markersLayerRef.current = null
      baseTileRef.current = null
      overlayTileRef.current = null
      mapRef.current = null
      try {
        map.remove()
      } catch {
        // Ignore unmount errors
      }
      if ("_leaflet_id" in container) {
        delete (container as unknown as Record<string, unknown>)._leaflet_id
      }
    }
  }, [])

  // 2. Synchronize Base & NASA GIBS Satellite Tile Layers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getPane("tilePane")) return

    if (baseTileRef.current) {
      try {
        map.removeLayer(baseTileRef.current)
      } catch {}
      baseTileRef.current = null
    }
    if (overlayTileRef.current) {
      try {
        map.removeLayer(overlayTileRef.current)
      } catch {}
      overlayTileRef.current = null
    }

    const showBase =
      activeImagery.id === "dark-base" ||
      activeImagery.isOverlayOnDarkBase ||
      imageryOpacity < 1

    if (showBase) {
      const baseLayer = L.tileLayer(darkBaseLayer.tileUrlTemplate, {
        attribution: darkBaseLayer.attribution,
        maxNativeZoom: darkBaseLayer.maxNativeZoom,
        maxZoom: darkBaseLayer.maxZoom,
        zIndex: 1,
      })
      baseLayer.addTo(map)
      baseTileRef.current = baseLayer
    }

    if (activeImagery.id !== "dark-base") {
      const overlayLayer = L.tileLayer(resolvedTileUrl, {
        attribution: activeImagery.attribution,
        maxNativeZoom: activeImagery.maxNativeZoom,
        maxZoom: activeImagery.maxZoom,
        opacity: imageryOpacity,
        zIndex: 2,
      })
      overlayLayer.addTo(map)
      overlayTileRef.current = overlayLayer
    }
  }, [activeImagery, darkBaseLayer, resolvedTileUrl, imageryOpacity])

  // 3. Synchronize Candidate Markers, Tooltips, and Telemetry Popups
  useEffect(() => {
    const map = mapRef.current
    const markersLayer = markersLayerRef.current
    if (!map || !markersLayer || !map.getPane("overlayPane")) return

    markersLayer.clearLayers()

    for (const result of ordered) {
      const isSelected = result.candidate.id === selectedId
      const scoreVal = result.score ?? 0

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

      const marker = L.circleMarker(
        [result.candidate.latitude, result.candidate.longitude],
        {
          radius,
          color: isSelected
            ? MARKER_SELECTED_STROKE
            : isMissingParam || !result.isReliable
            ? "#f43f5e"
            : MARKER_DEFAULT_STROKE,
          weight: isSelected ? 3 : 1.75,
          fillColor,
          fillOpacity: isSelected ? 0.95 : isMissingParam ? 0.35 : 0.78,
          dashArray:
            isMissingParam || !result.isReliable || result.confidence === "low"
              ? "3 3"
              : undefined,
        }
      )

      marker.on("click", () => {
        onSelectRef.current(result.candidate.id)
      })

      const safeName = escapeHtml(result.candidate.name)
      const safeCountry = escapeHtml(result.candidate.country)
      const safeShortLabel = escapeHtml(activeParamLayer.shortLabel)
      const safeFormattedVal = escapeHtml(formattedLayerVal)
      const safeScoreDisplay = escapeHtml(result.scoreDisplay)
      const safeCoords = escapeHtml(
        formatCoordinates(result.candidate.latitude, result.candidate.longitude)
      )
      const safeElevation = escapeHtml(
        formatFeatureValue("elevationM", result.candidate.environment.elevationM ?? null)
      )
      const safeSlope = escapeHtml(
        formatFeatureValue("meanSlopeDeg", result.candidate.environment.meanSlopeDeg ?? null)
      )
      const safeTemp = escapeHtml(
        formatFeatureValue("meanSurfaceTempC", result.candidate.environment.meanSurfaceTempC ?? null)
      )
      const safeAlbedo = escapeHtml(
        formatFeatureValue("albedo", result.candidate.environment.albedo ?? null)
      )
      const safeSetting = escapeHtml(result.candidate.setting)

      const tooltipHtml = `
        <div class="font-mono text-xs">
          <span class="font-bold text-cyan-300">#${result.rank} ${safeName}</span>
          <div class="text-[10px] text-slate-200 mt-0.5 flex items-center gap-1.5">
            <span class="text-slate-400">${safeShortLabel}:</span>
            <strong class="text-white">${safeFormattedVal}</strong>
          </div>
          ${
            activeParamLayer.id !== "similarity"
              ? `<div class="text-[10px] text-slate-300">Match Score: <strong class="${
                  result.score === null ? "text-rose-400" : "text-cyan-300"
                }">${safeScoreDisplay}</strong></div>`
              : ""
          }
          <div class="text-[9px] text-slate-400 mt-0.5">${safeCountry} · Click marker for full telemetry</div>
        </div>
      `
      marker.bindTooltip(tooltipHtml, { direction: "top", offset: [0, -8] })

      const badgeHtml = result.candidate.isVerified
        ? `<span class="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 shrink-0">NASA DB</span>`
        : `<span class="rounded border border-amber-500/40 bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 shrink-0">DEMO</span>`

      const popupHtml = `
        <div class="flex min-w-[235px] max-w-[290px] flex-col gap-2 p-1 font-mono text-xs text-slate-200">
          <div class="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-1.5">
            <div>
              <div class="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">RANK #${result.rank} CANDIDATE</div>
              <h4 class="text-xs font-bold text-white mt-0.5 leading-snug">${safeName}</h4>
            </div>
            ${badgeHtml}
          </div>
          <div class="rounded border border-cyan-500/30 bg-slate-900/90 px-2.5 py-1.5 flex items-center justify-between">
            <span class="text-[10px] text-slate-400">${safeShortLabel}</span>
            <span class="text-xs font-bold text-cyan-300">${safeFormattedVal}</span>
          </div>
          <div class="flex flex-col gap-1 text-[11px] text-slate-300">
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-slate-400">COORDINATES</span>
              <span class="text-slate-200 font-semibold">${safeCoords}</span>
            </div>
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-slate-400">SIMILARITY SCORE</span>
              <span class="font-bold ${result.score === null ? "text-rose-400" : "text-cyan-300"}">${safeScoreDisplay}</span>
            </div>
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-slate-400">ELEVATION / SLOPE</span>
              <span class="text-slate-200">${safeElevation} · ${safeSlope}</span>
            </div>
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-slate-400">MEAN TEMP / ALBEDO</span>
              <span class="text-slate-200">${safeTemp} · ${safeAlbedo}</span>
            </div>
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-slate-400">MISSION COVERAGE</span>
              <span class="text-slate-200 font-semibold">${Math.round(result.coverage * 100)}% (${escapeHtml(result.confidence)})</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              <span class="text-slate-500">SETTING: </span>
              <span class="text-slate-300 capitalize">${safeSetting}</span>
            </div>
          </div>
        </div>
      `
      marker.bindPopup(popupHtml)
      marker.addTo(markersLayer)
    }
  }, [ordered, selectedId, activeParamLayer])

  // 4. Fit map bounds when results change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const validPoints = validResults.map(
      (r): [number, number] => [r.candidate.latitude, r.candidate.longitude]
    )
    if (validPoints.length === 0) return

    if (prevBoundsKeyRef.current !== boundsKey) {
      prevBoundsKeyRef.current = boundsKey
      try {
        map.fitBounds(validPoints, { padding: [36, 36], maxZoom: 6, animate: false })
      } catch {}
    }
  }, [boundsKey, validResults])

  // 5. Pan to selected candidate if out of bounds
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selected) return
    if (!isValidCoordinate(selected.candidate?.latitude, selected.candidate?.longitude)) return
    const point: [number, number] = [selected.candidate.latitude, selected.candidate.longitude]

    try {
      if (!map.getBounds().contains(point)) {
        map.panTo(point, { animate: true, duration: 0.8 })
      }
    } catch {}
  }, [selected])

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

      <div
        ref={containerRef}
        className="size-full bg-slate-950"
        aria-label="Interactive NASA satellite and environmental telemetry map of Earth analog candidate locations"
      />
    </div>
  )
}
