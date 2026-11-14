"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useRef } from "react"
import type { DiscoveryAtlasEntry, GeographicBoundingBox } from "@/lib/terratwin/types"
import type { DiscoveryCandidateResult } from "@/lib/terratwin/types/discovery"
import {
  getVisualTierStyle,
  leafletBoundsToGeoBbox,
} from "@/lib/terratwin/scanner/scanner-utils"
import {
  SATELLITE_LAYER_MAP,
  resolveSatelliteTileUrl,
  type SatelliteImageryLayerId,
} from "@/lib/terratwin/config/satellite-layers"
import { isValidCoordinate } from "@/lib/terratwin/geo"
import { formatCoverage } from "@/lib/terratwin/format"

export type MapActionInput =
  | { type: "fit-region" }
  | { type: "fit-results" }
  | { type: "focus-point"; lat: number; lon: number; zoom?: number }
  | { type: "capture-viewport" }
  | { type: "reset-view" }

export type MapActionCommand = MapActionInput & { seq: number }

export interface DiscoveryEarthMapCanvasProps {
  boundingBox: GeographicBoundingBox | null
  candidates: DiscoveryCandidateResult[]
  atlasEntries: DiscoveryAtlasEntry[]
  showAtlasLayer: boolean
  selectedCandidateId: string | null
  selectedAtlasId: string | null
  isDrawMode: boolean
  imageryLayerId: SatelliteImageryLayerId
  imageryDate?: string
  mapCommand: MapActionCommand | null
  onSelectCandidate: (candidateId: string) => void
  onSelectAtlasSite: (atlasId: string) => void
  onRegionDrawn: (bbox: GeographicBoundingBox | null, validationError: string | null) => void
  onDrawModeChange: (active: boolean) => void
  onCursorMove?: (coords: { lat: number; lon: number } | null) => void
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export default function DiscoveryEarthMapCanvas({
  boundingBox,
  candidates,
  atlasEntries,
  showAtlasLayer,
  selectedCandidateId,
  selectedAtlasId,
  isDrawMode,
  imageryLayerId,
  imageryDate = "2024-07-15",
  mapCommand,
  onSelectCandidate,
  onSelectAtlasSite,
  onRegionDrawn,
  onDrawModeChange,
  onCursorMove,
}: DiscoveryEarthMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const baseTileRef = useRef<L.TileLayer | null>(null)
  const overlayTileRef = useRef<L.TileLayer | null>(null)
  const selectionLayerRef = useRef<L.LayerGroup | null>(null)
  const gridLayerRef = useRef<L.LayerGroup | null>(null)
  const atlasLayerRef = useRef<L.LayerGroup | null>(null)
  const previewRectRef = useRef<L.Rectangle | null>(null)

  const callbacksRef = useRef({
    onSelectCandidate,
    onSelectAtlasSite,
    onRegionDrawn,
    onDrawModeChange,
    onCursorMove,
  })

  useEffect(() => {
    callbacksRef.current = {
      onSelectCandidate,
      onSelectAtlasSite,
      onRegionDrawn,
      onDrawModeChange,
      onCursorMove,
    }
  }, [onSelectCandidate, onSelectAtlasSite, onRegionDrawn, onDrawModeChange, onCursorMove])

  // 1. Initialize native Leaflet map once (React 19 StrictMode safe)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if ("_leaflet_id" in container) {
      delete (container as unknown as Record<string, unknown>)._leaflet_id
    }

    const map = L.map(container, {
      center: [24, 5],
      zoom: 2,
      minZoom: 2,
      maxZoom: 16,
      worldCopyJump: false,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 0.7,
    })

    mapRef.current = map
    selectionLayerRef.current = L.layerGroup().addTo(map)
    gridLayerRef.current = L.layerGroup().addTo(map)
    atlasLayerRef.current = L.layerGroup().addTo(map)

    map.on("mousemove", (ev: L.LeafletMouseEvent) => {
      callbacksRef.current.onCursorMove?.({
        lat: Math.round(ev.latlng.lat * 1000) / 1000,
        lon: Math.round(ev.latlng.lng * 1000) / 1000,
      })
    })
    map.on("mouseout", () => {
      callbacksRef.current.onCursorMove?.(null)
    })

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              requestAnimationFrame(() => {
                if (mapRef.current) {
                  mapRef.current.invalidateSize({ pan: false })
                }
              })
            }
          })
        : null
    resizeObserver?.observe(container)

    return () => {
      resizeObserver?.disconnect()
      selectionLayerRef.current = null
      gridLayerRef.current = null
      atlasLayerRef.current = null
      baseTileRef.current = null
      overlayTileRef.current = null
      previewRectRef.current = null
      mapRef.current = null
      try {
        map.remove()
      } catch {
        // Ignore teardown errors
      }
      if ("_leaflet_id" in container) {
        delete (container as unknown as Record<string, unknown>)._leaflet_id
      }
    }
  }, [])

  // 2. Synchronize Dark Base & Satellite Imagery Layers
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

    const activeImagery = SATELLITE_LAYER_MAP[imageryLayerId] ?? SATELLITE_LAYER_MAP["dark-base"]
    const darkBase = SATELLITE_LAYER_MAP["dark-base"]
    const resolvedUrl = resolveSatelliteTileUrl(activeImagery.id, imageryDate)

    if (activeImagery.id === "dark-base" || activeImagery.isOverlayOnDarkBase) {
      baseTileRef.current = L.tileLayer(darkBase.tileUrlTemplate, {
        attribution: darkBase.attribution,
        maxNativeZoom: darkBase.maxNativeZoom,
        maxZoom: darkBase.maxZoom,
        noWrap: true,
      }).addTo(map)
    }

    if (activeImagery.id !== "dark-base") {
      overlayTileRef.current = L.tileLayer(resolvedUrl, {
        attribution: activeImagery.attribution,
        maxNativeZoom: activeImagery.maxNativeZoom,
        maxZoom: activeImagery.maxZoom,
        opacity: 0.85,
        noWrap: true,
      }).addTo(map)
    }
  }, [imageryLayerId, imageryDate])

  // 3. Interactive Pointer/Touch Bounding Box Drawing Mode
  useEffect(() => {
    const map = mapRef.current
    const container = containerRef.current
    const selectionLayer = selectionLayerRef.current
    if (!map || !container || !selectionLayer) return

    if (!isDrawMode) {
      map.dragging.enable()
      map.doubleClickZoom.enable()
      container.style.cursor = ""
      container.style.touchAction = ""
      if (previewRectRef.current) {
        selectionLayer.removeLayer(previewRectRef.current)
        previewRectRef.current = null
      }
      return
    }

    map.dragging.disable()
    map.doubleClickZoom.disable()
    container.style.cursor = "crosshair"
    container.style.touchAction = "none"

    let startLatLng: L.LatLng | null = null
    let activePointerId: number | null = null

    const getLatLngFromPointer = (ev: PointerEvent): L.LatLng => {
      const rect = container.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      return map.containerPointToLatLng(L.point(x, y))
    }

    const cleanupDrag = () => {
      startLatLng = null
      activePointerId = null
      if (previewRectRef.current) {
        selectionLayer.removeLayer(previewRectRef.current)
        previewRectRef.current = null
      }
    }

    const onPointerDown = (ev: PointerEvent) => {
      if (ev.button !== 0 && ev.pointerType === "mouse") return
      // Ignore clicks directly on Leaflet control buttons inside the map container
      const target = ev.target as HTMLElement | null
      if (target?.closest(".leaflet-control-container")) return

      ev.preventDefault()
      ev.stopPropagation()
      activePointerId = ev.pointerId
      try {
        container.setPointerCapture(ev.pointerId)
      } catch {}

      startLatLng = getLatLngFromPointer(ev)
      if (previewRectRef.current) {
        selectionLayer.removeLayer(previewRectRef.current)
      }
      previewRectRef.current = L.rectangle(
        [
          [startLatLng.lat, startLatLng.lng],
          [startLatLng.lat, startLatLng.lng],
        ],
        {
          color: "#22d3ee",
          weight: 2,
          dashArray: "6 4",
          fillColor: "#06b6d4",
          fillOpacity: 0.2,
          interactive: false,
        }
      ).addTo(selectionLayer)
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (!startLatLng || activePointerId !== ev.pointerId || !previewRectRef.current) return
      ev.preventDefault()
      const current = getLatLngFromPointer(ev)
      previewRectRef.current.setBounds([
        [startLatLng.lat, startLatLng.lng],
        [current.lat, current.lng],
      ])
    }

    const onPointerUp = (ev: PointerEvent) => {
      if (!startLatLng || activePointerId !== ev.pointerId) return
      ev.preventDefault()
      const endLatLng = getLatLngFromPointer(ev)
      try {
        container.releasePointerCapture(ev.pointerId)
      } catch {}

      const south = Math.min(startLatLng.lat, endLatLng.lat)
      const north = Math.max(startLatLng.lat, endLatLng.lat)
      const west = startLatLng.lng <= endLatLng.lng ? startLatLng.lng : endLatLng.lng
      const east = startLatLng.lng <= endLatLng.lng ? endLatLng.lng : startLatLng.lng

      cleanupDrag()

      const converted = leafletBoundsToGeoBbox({ south, west, north, east })
      callbacksRef.current.onRegionDrawn(converted.bbox, converted.error)
      callbacksRef.current.onDrawModeChange(false)
    }

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        cleanupDrag()
        callbacksRef.current.onDrawModeChange(false)
      }
    }

    container.addEventListener("pointerdown", onPointerDown, true)
    container.addEventListener("pointermove", onPointerMove, true)
    container.addEventListener("pointerup", onPointerUp, true)
    container.addEventListener("pointercancel", cleanupDrag, true)
    window.addEventListener("keydown", onKeyDown)

    return () => {
      container.removeEventListener("pointerdown", onPointerDown, true)
      container.removeEventListener("pointermove", onPointerMove, true)
      container.removeEventListener("pointerup", onPointerUp, true)
      container.removeEventListener("pointercancel", cleanupDrag, true)
      window.removeEventListener("keydown", onKeyDown)
      cleanupDrag()
      map.dragging.enable()
      map.doubleClickZoom.enable()
      container.style.cursor = ""
      container.style.touchAction = ""
    }
  }, [isDrawMode])

  // 4. Render Active Bounding Box Rectangle
  useEffect(() => {
    const layer = selectionLayerRef.current
    if (!layer) return
    layer.clearLayers()

    if (
      boundingBox &&
      isValidCoordinate(boundingBox[0], boundingBox[1]) &&
      isValidCoordinate(boundingBox[2], boundingBox[3])
    ) {
      L.rectangle(
        [
          [boundingBox[0], boundingBox[1]],
          [boundingBox[2], boundingBox[3]],
        ],
        {
          color: "#22d3ee",
          weight: 2,
          dashArray: "6 5",
          fillColor: "#06b6d4",
          fillOpacity: 0.08,
          interactive: false,
        }
      ).addTo(layer)
    }
  }, [boundingBox])

  // 5. Render Scanned Live Grid Cell Rectangles (replaces old grid cleanly on every scan)
  useEffect(() => {
    const layer = gridLayerRef.current
    if (!layer) return
    layer.clearLayers()

    // Draw non-selected cells first, selected cell last on top
    const ordered = [...candidates].sort(
      (a, b) =>
        Number(a.candidate.id === selectedCandidateId) -
        Number(b.candidate.id === selectedCandidateId)
    )

    for (const item of ordered) {
      const cand = item.candidate
      const box = cand.boundingBox
      if (
        !box ||
        !isValidCoordinate(box[0], box[1]) ||
        !isValidCoordinate(box[2], box[3])
      ) {
        continue
      }

      const style = getVisualTierStyle(item)
      const isSelected = cand.id === selectedCandidateId

      const rect = L.rectangle(
        [
          [box[0], box[1]],
          [box[2], box[3]],
        ],
        {
          color: isSelected ? "#ffffff" : style.strokeColor,
          weight: isSelected ? 3 : 1.5,
          dashArray: isSelected ? undefined : style.dashArray,
          fillColor: style.fillColor,
          fillOpacity: isSelected ? Math.min(0.68, style.fillOpacity + 0.2) : style.fillOpacity,
        }
      )

      const scoreText =
        item.score !== null && item.isReliable
          ? `${item.score.toFixed(1)}% Similarity`
          : "Insufficient evidence (<40% cov)"

      const tooltipHtml = `
        <div style="font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.4;">
          <div style="font-weight: 700; color: #f8fafc;">#${item.rank} · Exploratory Cell</div>
          <div style="color: ${style.strokeColor};">${escapeHtml(scoreText)}</div>
          <div style="color: #94a3b8;">Coverage: ${escapeHtml(formatCoverage(item.coverage))} · Unverified</div>
          <div style="color: #64748b;">${cand.latitude.toFixed(3)}°, ${cand.longitude.toFixed(3)}°</div>
        </div>
      `
      rect.bindTooltip(tooltipHtml, {
        direction: "top",
        opacity: 0.96,
      })

      rect.on("click", () => {
        callbacksRef.current.onSelectCandidate(cand.id)
      })

      rect.addTo(layer)
    }
  }, [candidates, selectedCandidateId])

  // 6. Render Curated 31-Site Global Atlas Markers (visually distinct circleMarkers)
  useEffect(() => {
    const layer = atlasLayerRef.current
    if (!layer) return
    layer.clearLayers()

    if (!showAtlasLayer) return

    for (const site of atlasEntries) {
      if (!isValidCoordinate(site.latitude, site.longitude)) continue
      const isBenchmark = site.noveltyTier === "canonical-benchmark"
      const isSelected = site.id === selectedAtlasId

      const marker = L.circleMarker([site.latitude, site.longitude], {
        radius: isSelected ? 8 : isBenchmark ? 6 : 5,
        color: isSelected ? "#ffffff" : isBenchmark ? "#fde68a" : "#e9d5ff",
        weight: isSelected ? 3 : 1.8,
        fillColor: isBenchmark ? "#f59e0b" : "#a855f7",
        fillOpacity: 0.9,
      })

      const tierLabel = isBenchmark ? "Canonical Atlas Benchmark" : "Under-Explored Atlas Site"
      marker.bindTooltip(
        `<div style="font-family: ui-monospace, monospace; font-size: 11px;">
          <div style="font-weight: 700; color: #f8fafc;">${escapeHtml(site.name)}</div>
          <div style="color: ${isBenchmark ? "#fcd34d" : "#d8b4fe"};">${tierLabel}</div>
          <div style="color: #94a3b8;">${escapeHtml(site.country)} · ${escapeHtml(site.category)}</div>
        </div>`,
        { direction: "top", opacity: 0.96 }
      )

      marker.on("click", () => {
        callbacksRef.current.onSelectAtlasSite(site.id)
      })

      marker.addTo(layer)
    }
  }, [atlasEntries, showAtlasLayer, selectedAtlasId])

  // 7. Handle imperative Map Commands (fit region, fit results, focus atlas, capture viewport)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapCommand) return

    if (mapCommand.type === "fit-region" && boundingBox) {
      map.fitBounds(
        [
          [boundingBox[0], boundingBox[1]],
          [boundingBox[2], boundingBox[3]],
        ],
        { padding: [36, 36], maxZoom: 10, animate: true }
      )
    } else if (mapCommand.type === "fit-results" && candidates.length > 0) {
      const validBoxes = candidates
        .map((c) => c.candidate.boundingBox)
        .filter((b): b is GeographicBoundingBox => Boolean(b))
      if (validBoxes.length > 0) {
        const bounds = L.latLngBounds(
          validBoxes.flatMap((b) => [
            [b[0], b[1]] as [number, number],
            [b[2], b[3]] as [number, number],
          ])
        )
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11, animate: true })
      }
    } else if (mapCommand.type === "focus-point") {
      if (isValidCoordinate(mapCommand.lat, mapCommand.lon)) {
        map.setView([mapCommand.lat, mapCommand.lon], mapCommand.zoom ?? 7, { animate: true })
      }
    } else if (mapCommand.type === "reset-view") {
      map.setView([24, 5], 2, { animate: true })
    } else if (mapCommand.type === "capture-viewport") {
      const b = map.getBounds()
      const converted = leafletBoundsToGeoBbox({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      })
      callbacksRef.current.onRegionDrawn(converted.bbox, converted.error)
    }
  }, [mapCommand, boundingBox, candidates])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full min-h-[380px] lg:min-h-[540px] bg-slate-950 select-none"
      aria-label="Interactive Earth analog discovery map"
    />
  )
}
