"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { PanelCard } from "@/components/shared/panel-card"
import type { PlanetaryBody, PlanetaryTarget } from "@/lib/terratwin/types"
import { PLANETARY_SPECS, resolveTargetCoordinates } from "@/lib/terratwin/planet-math"
import {
  Globe2,
  Crosshair,
  Sun,
  RotateCw,
  Compass,
  Radio,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PlanetaryGlobeCanvas = dynamic(() => import("./planetary-globe-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full min-h-80 items-center justify-center bg-slate-950 font-mono text-xs text-cyan-400">
      <span className="flex items-center gap-2">
        <Radio className="size-4 animate-spin text-cyan-400" />
        INITIALIZING 3D ORBITAL SENSOR FEED...
      </span>
    </div>
  ),
})

export interface PlanetaryGlobeProps {
  body: PlanetaryBody
  selectedTarget?: PlanetaryTarget
  allTargets: PlanetaryTarget[]
  onSelectTarget?: (targetId: string) => void
  isUpdating?: boolean
}

export function PlanetaryGlobe({
  body,
  selectedTarget,
  allTargets,
  onSelectTarget,
  isUpdating,
}: PlanetaryGlobeProps) {
  const [autoRotate, setAutoRotate] = useState(false)
  const [solarTerminator, setSolarTerminator] = useState(true)
  const [resetCount, setResetCount] = useState(0)

  const specs = PLANETARY_SPECS[body]
  const targetCoords = selectedTarget ? resolveTargetCoordinates(selectedTarget) : null

  return (
    <PanelCard
      title={`${specs.displayName} Reconnaissance`}
      description={`Interactive 3D orthographic visualization with NASA surface albedo and active targeting reticle.`}
      isUpdating={isUpdating}
      bodyClassName="flex flex-col p-0 relative overflow-hidden"
    >
      {/* Top HUD Telemetry Ribbon */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 bg-slate-950/85 px-4 py-2 font-mono text-[11px] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Globe2 className="size-3.5 text-cyan-400 animate-pulse" />
            <span className="uppercase">{body} ORBITAL OBSERVATORY</span>
          </div>
          {selectedTarget?.isVerified && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300">
              <ShieldCheck className="size-2.5 text-emerald-400" />
              <span>PDS</span>
            </span>
          )}
        </div>

        {/* HUD Controls */}
        <div className="flex items-center gap-1">
          {/* Re-center Camera */}
          <button
            type="button"
            onClick={() => {
              setAutoRotate(false)
              setResetCount((c) => c + 1)
            }}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition cursor-pointer border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-cyan-500/40"
            title="Re-center camera and reticle directly on active target"
          >
            <Crosshair className="size-3 text-cyan-400" />
            <span className="hidden sm:inline">Center</span>
          </button>

          {/* Solar Terminator Toggle */}
          <button
            type="button"
            onClick={() => setSolarTerminator(!solarTerminator)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition cursor-pointer border",
              solarTerminator
                ? "border-amber-500/40 bg-amber-950/40 text-amber-300"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white",
            )}
            title="Toggle between authentic solar terminator shadows and full optical albedo illumination"
          >
            <Sun className="size-3 text-amber-400" />
            <span className="hidden sm:inline">Terminator</span>
          </button>

          {/* Auto-Rotate Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition cursor-pointer border",
              autoRotate
                ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white",
            )}
            title="Toggle continuous planetary rotation"
          >
            <RotateCw className={cn("size-3", autoRotate && "animate-spin text-cyan-400")} />
            <span className="hidden sm:inline">{autoRotate ? "Rotating" : "Locked"}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative z-0 min-h-80 flex-1 overflow-hidden sm:min-h-96 bg-radial from-slate-900 via-slate-950 to-black">
        {/* Subtle Starfield & Radar Grid Backdrop */}
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(56,189,248,0.15)_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* 3D WebGL Canvas */}
        <div className="absolute inset-0">
          <PlanetaryGlobeCanvas
            body={body}
            selectedTarget={selectedTarget}
            allTargets={allTargets}
            onSelectTarget={onSelectTarget}
            autoRotate={autoRotate}
            solarTerminator={solarTerminator}
            resetTrigger={resetCount}
          />
        </div>

        {/* Floating Reticle Telemetry Card (Top-Left of Canvas) */}
        {selectedTarget && targetCoords && (
          <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1 rounded-lg border border-slate-800/90 bg-slate-950/80 p-2.5 font-mono text-[10px] backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider">
              <Crosshair className="size-3 text-cyan-400 animate-pulse" />
              <span>SENSOR RETICLE LOCK</span>
            </div>
            <div className="font-semibold text-slate-200 text-xs truncate max-w-48">
              {selectedTarget.name}
            </div>
            <div className="text-slate-400 text-[10px] flex items-center gap-2">
              <span>
                LAT: <strong className="text-white">{targetCoords.latitude >= 0 ? `+${targetCoords.latitude.toFixed(2)}°` : `${targetCoords.latitude.toFixed(2)}°`}</strong>
              </span>
              <span>
                LON: <strong className="text-white">{targetCoords.longitude >= 0 ? `+${targetCoords.longitude.toFixed(2)}°` : `${targetCoords.longitude.toFixed(2)}°`}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Interaction Hint (Bottom-Right of Canvas) */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden sm:flex items-center gap-1.5 rounded bg-slate-950/70 border border-slate-800/70 px-2 py-1 font-mono text-[9px] text-slate-400 backdrop-blur-sm">
          <Compass className="size-2.5 text-cyan-400" />
          <span>DRAG TO ROTATE // SCROLL TO ZOOM</span>
        </div>
      </div>

      {/* Bottom Physical Telemetry Strip */}
      <div className="z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-800 bg-slate-950/90 p-2.5 font-mono text-[10px] backdrop-blur-md">
        <div className="flex flex-col rounded bg-slate-900/60 p-1.5 border border-slate-800/80">
          <span className="text-slate-500 uppercase tracking-wider text-[9px]">Mean Radius</span>
          <span className="font-semibold text-white mt-0.5">{specs.radiusKm.toLocaleString()} km</span>
        </div>
        <div className="flex flex-col rounded bg-slate-900/60 p-1.5 border border-slate-800/80">
          <span className="text-slate-500 uppercase tracking-wider text-[9px]">Gravity</span>
          <span className="font-semibold text-cyan-300 mt-0.5">{specs.surfaceGravity}</span>
        </div>
        <div className="flex flex-col rounded bg-slate-900/60 p-1.5 border border-slate-800/80">
          <span className="text-slate-500 uppercase tracking-wider text-[9px]">Surface Pressure</span>
          <span className="font-semibold text-slate-300 mt-0.5 truncate">{specs.atmosphericPressure}</span>
        </div>
        <div className="flex flex-col rounded bg-slate-900/60 p-1.5 border border-slate-800/80">
          <span className="text-slate-500 uppercase tracking-wider text-[9px]">Axial Tilt</span>
          <span className="font-semibold text-amber-300 mt-0.5">{specs.axialTiltDeg}°</span>
        </div>
      </div>
    </PanelCard>
  )
}

