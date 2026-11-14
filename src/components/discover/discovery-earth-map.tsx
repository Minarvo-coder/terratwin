"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import type { DiscoveryAtlasEntry, GeographicBoundingBox } from "@/lib/terratwin/types"
import type { DiscoveryCandidateResult } from "@/lib/terratwin/types/discovery"
import type { SatelliteImageryLayerId } from "@/lib/terratwin/config/satellite-layers"
import type { MapActionCommand } from "./discovery-earth-map-canvas"
import { DiscoveryMapLegend } from "./discovery-map-legend"
import {
  Crosshair,
  Compass,
  Focus,
  Layers,
  Maximize2,
  PenSquare,
  Radio,
  RotateCcw,
  Scan,
} from "lucide-react"
import { cn } from "@/lib/utils"

const DiscoveryEarthMapCanvas = dynamic(() => import("./discovery-earth-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[380px] lg:min-h-[540px] w-full items-center justify-center bg-slate-950 font-mono text-xs text-cyan-400">
      <span className="flex items-center gap-2">
        <Radio className="size-4 animate-spin" aria-hidden="true" />
        INITIALIZING INTERACTIVE EARTH DISCOVERY MAP…
      </span>
    </div>
  ),
})

interface DiscoveryEarthMapProps {
  boundingBox: GeographicBoundingBox | null
  candidates: DiscoveryCandidateResult[]
  atlasEntries: DiscoveryAtlasEntry[]
  selectedCandidateId: string | null
  selectedAtlasId: string | null
  isDrawMode: boolean
  mapCommand: MapActionCommand | null
  onSelectCandidate: (candidateId: string) => void
  onSelectAtlasSite: (atlasId: string) => void
  onRegionDrawn: (bbox: GeographicBoundingBox | null, validationError: string | null) => void
  onDrawModeChange: (active: boolean) => void
  onFitRegion: () => void
  onFitResults: () => void
  onCaptureViewport: () => void
  onResetMapView: () => void
}

const SCANNER_IMAGERY_OPTIONS: Array<{ id: SatelliteImageryLayerId; label: string }> = [
  { id: "dark-base", label: "Tactical Dark" },
  { id: "modis-true-color", label: "NASA MODIS True Color" },
  { id: "aster-gdem-relief", label: "NASA SRTM/ASTER Relief" },
]

export function DiscoveryEarthMap({
  boundingBox,
  candidates,
  atlasEntries,
  selectedCandidateId,
  selectedAtlasId,
  isDrawMode,
  mapCommand,
  onSelectCandidate,
  onSelectAtlasSite,
  onRegionDrawn,
  onDrawModeChange,
  onFitRegion,
  onFitResults,
  onCaptureViewport,
  onResetMapView,
}: DiscoveryEarthMapProps) {
  const [showAtlasLayer, setShowAtlasLayer] = useState(true)
  const [imageryLayerId, setImageryLayerId] = useState<SatelliteImageryLayerId>("dark-base")
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null)

  return (
    <section
      aria-label="Interactive Earth Discovery Map"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 font-sans"
    >
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onDrawModeChange(!isDrawMode)}
            aria-pressed={isDrawMode}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition cursor-pointer",
              isDrawMode
                ? "border-sky-500 bg-sky-500/20 text-sky-200"
                : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800"
            )}
          >
            <PenSquare className="size-3.5" aria-hidden="true" />
            <span>{isDrawMode ? "Drag Box on Map (Esc to cancel)" : "Select Region"}</span>
          </button>

          <button
            type="button"
            onClick={onCaptureViewport}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 transition hover:border-slate-600 hover:text-white cursor-pointer"
            title="Capture the visible map bounds as the regional scan area"
          >
            <Scan className="size-3.5 text-sky-400" aria-hidden="true" />
            <span>Use Current Map View</span>
          </button>

          <button
            type="button"
            onClick={onFitRegion}
            disabled={!boundingBox}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Focus className="size-3.5" aria-hidden="true" />
            <span>Fit Region</span>
          </button>

          <button
            type="button"
            onClick={onFitResults}
            disabled={candidates.length === 0}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
            <span>Fit Results</span>
          </button>

          <button
            type="button"
            onClick={onResetMapView}
            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400 transition hover:border-slate-500 hover:text-white cursor-pointer"
            title="Reset map to global view"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Global</span>
          </button>
        </div>

        {/* Right Controls: Atlas toggle + Imagery selector + Cursor readout */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAtlasLayer((prev) => !prev)}
            aria-pressed={showAtlasLayer}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer",
              showAtlasLayer
                ? "border-amber-500/40 bg-amber-950/40 text-amber-200"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
            )}
          >
            <Compass className="size-3.5" aria-hidden="true" />
            <span>Atlas ({atlasEntries.length})</span>
          </button>

          <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300">
            <Layers className="size-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
            <span className="sr-only">Basemap imagery layer</span>
            <select
              aria-label="Basemap imagery layer"
              value={imageryLayerId}
              onChange={(e) => setImageryLayerId(e.target.value as SatelliteImageryLayerId)}
              className="bg-transparent text-[11px] text-slate-200 focus:outline-none cursor-pointer"
            >
              {SCANNER_IMAGERY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-100">
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Draw mode banner */}
      {isDrawMode && (
        <div
          role="status"
          className="flex items-center justify-between border-b border-cyan-500/30 bg-cyan-950/60 px-3 py-1.5 font-mono text-[11px] text-cyan-200"
        >
          <span>
            Pointer draw active: click and drag on the map to outline a rectangular region (max 10° × 10°, single hemisphere across ±180°).
          </span>
          <button
            type="button"
            onClick={() => onDrawModeChange(false)}
            className="ml-3 rounded border border-cyan-400/50 px-2 py-0.5 text-[10px] hover:bg-cyan-900 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative w-full flex-1">
        <DiscoveryEarthMapCanvas
          boundingBox={boundingBox}
          candidates={candidates}
          atlasEntries={atlasEntries}
          showAtlasLayer={showAtlasLayer}
          selectedCandidateId={selectedCandidateId}
          selectedAtlasId={selectedAtlasId}
          isDrawMode={isDrawMode}
          imageryLayerId={imageryLayerId}
          mapCommand={mapCommand}
          onSelectCandidate={onSelectCandidate}
          onSelectAtlasSite={onSelectAtlasSite}
          onRegionDrawn={onRegionDrawn}
          onDrawModeChange={onDrawModeChange}
          onCursorMove={setCursorCoords}
        />

        {/* Floating Coordinate Telemetry Pill */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[450] flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/85 px-2.5 py-1 font-mono text-[11px] text-slate-200 backdrop-blur-md">
          <Crosshair className="size-3 text-cyan-400" aria-hidden="true" />
          {cursorCoords ? (
            <span>
              {cursorCoords.lat >= 0 ? `${cursorCoords.lat.toFixed(3)}°N` : `${Math.abs(cursorCoords.lat).toFixed(3)}°S`},{" "}
              {cursorCoords.lon >= 0 ? `${cursorCoords.lon.toFixed(3)}°E` : `${Math.abs(cursorCoords.lon).toFixed(3)}°W`}
            </span>
          ) : boundingBox ? (
            <span className="text-slate-300">
              Box: [{boundingBox[0].toFixed(2)}, {boundingBox[1].toFixed(2)}] → [{boundingBox[2].toFixed(2)}, {boundingBox[3].toFixed(2)}]
            </span>
          ) : (
            <span className="text-slate-400">WGS84 · No region active</span>
          )}
        </div>
      </div>

      {/* Persistent Compact Accessible Legend */}
      <div className="border-t border-slate-800/90 bg-slate-950/80 p-2.5">
        <DiscoveryMapLegend />
      </div>
    </section>
  )
}
