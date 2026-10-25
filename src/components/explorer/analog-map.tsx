"use client"

import dynamic from "next/dynamic"
import { PanelCard } from "@/components/shared/panel-card"
import type { AnalogMapCanvasProps } from "./analog-map-canvas"
import { Crosshair, Satellite, Radio } from "lucide-react"

const AnalogMapCanvas = dynamic(() => import("./analog-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-slate-950 font-mono text-xs text-cyan-400">
      <span className="flex items-center gap-2">
        <Radio className="size-4 animate-spin text-cyan-400" />
        INITIALIZING GEOSPATIAL TELEMETRY FEED...
      </span>
    </div>
  ),
})

export function AnalogMap(props: AnalogMapCanvasProps & { isUpdating?: boolean }) {
  const { isUpdating, ...canvasProps } = props
  const selectedSite = props.results.find((r) => r.candidate.id === props.selectedId)

  return (
    <PanelCard
      title="Global Reconnaissance Map"
      description="Interactive WGS84 coordinate matrix of Earth analog candidates scaled by environmental similarity."
      isUpdating={isUpdating}
      bodyClassName="flex flex-col p-0 relative overflow-hidden"
    >
      {/* Top HUD Telemetry Ribbon Over Map */}
      <div className="z-10 flex items-center justify-between border-b border-cyan-500/20 bg-slate-950/85 px-4 py-2 font-mono text-[11px] backdrop-blur-md">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <Satellite className="size-3.5" />
          <span>ORBITAL RECON TILE FEED</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>
            TARGET LOCK:{" "}
            <strong className="text-white">
              {selectedSite ? selectedSite.candidate.name : "GLOBAL OVERVIEW"}
            </strong>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-cyan-400">
            {canvasProps.results.length} BASINS ACTIVE
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative z-0 min-h-80 flex-1 overflow-hidden sm:min-h-96">
        <div className="absolute inset-0">
          <AnalogMapCanvas {...canvasProps} />
        </div>
      </div>

      {/* Bottom HUD Coordinate Footer */}
      {selectedSite && (
        <div className="z-10 flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-4 py-1.5 font-mono text-[10px] text-slate-400 backdrop-blur-md">
          <span className="flex items-center gap-1.5">
            <Crosshair className="size-3 text-cyan-400" />
            <span>LAT: {selectedSite.candidate.latitude.toFixed(2)}° · LON: {selectedSite.candidate.longitude.toFixed(2)}°</span>
          </span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            SCORE: {selectedSite.score !== null ? `${selectedSite.score.toFixed(1)}%` : "INSUFFICIENT DATA"} · RANK #{selectedSite.rank}
          </span>
        </div>
      )}
    </PanelCard>
  )
}
