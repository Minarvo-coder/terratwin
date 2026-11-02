"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { PanelCard } from "@/components/shared/panel-card"
import type { AnalogMapCanvasProps } from "./analog-map-canvas"
import {
  ENVIRONMENTAL_MAP_LAYERS,
  ENVIRONMENTAL_MAP_LAYER_MAP,
  IMAGERY_DATE_PRESETS,
  SATELLITE_IMAGERY_LAYERS,
  SATELLITE_LAYER_MAP,
  type MapParameterLayerId,
  type SatelliteImageryLayerId,
} from "@/lib/terratwin/config/satellite-layers"
import { formatFeatureValue } from "@/lib/terratwin/format"
import {
  Crosshair,
  Satellite,
  Radio,
  Info,
  Layers,
  Calendar,
  ExternalLink,
  Eye,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const AnalogMapCanvas = dynamic(() => import("./analog-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full min-h-80 items-center justify-center bg-slate-950 font-mono text-xs text-cyan-400">
      <span className="flex items-center gap-2">
        <Radio className="size-4 animate-spin text-cyan-400" />
        INITIALIZING GEOSPATIAL TELEMETRY FEED...
      </span>
    </div>
  ),
})

export interface AnalogMapExtendedProps extends AnalogMapCanvasProps {
  isUpdating?: boolean
  onImageryLayerChange?: (id: SatelliteImageryLayerId) => void
  onImageryDateChange?: (date: string) => void
  onImageryOpacityChange?: (opacity: number) => void
  onParameterLayerChange?: (id: MapParameterLayerId) => void
}

export function AnalogMap(props: AnalogMapExtendedProps) {
  const {
    isUpdating,
    onImageryLayerChange,
    onImageryDateChange,
    onImageryOpacityChange,
    onParameterLayerChange,
    ...canvasProps
  } = props
  const [internalImageryId, setInternalImageryId] = useState<SatelliteImageryLayerId>(
    props.imageryLayerId ?? "dark-base"
  )
  const [internalDate, setInternalDate] = useState<string>(props.imageryDate ?? "2024-07-15")
  const [internalOpacity, setInternalOpacity] = useState<number>(props.imageryOpacity ?? 0.9)
  const [internalParamId, setInternalParamId] = useState<MapParameterLayerId>(
    props.parameterLayerId ?? "similarity"
  )
  const [showLayerDetails, setShowLayerDetails] = useState<boolean>(false)

  const imageryLayerId = props.imageryLayerId ?? internalImageryId
  const imageryDate = props.imageryDate ?? internalDate
  const imageryOpacity = props.imageryOpacity ?? internalOpacity
  const parameterLayerId = props.parameterLayerId ?? internalParamId

  const selectedSite = props.results.find((r) => r.candidate.id === props.selectedId)
  const activeImagery = SATELLITE_LAYER_MAP[imageryLayerId] ?? SATELLITE_LAYER_MAP["dark-base"]
  const activeParam =
    ENVIRONMENTAL_MAP_LAYER_MAP[parameterLayerId] ?? ENVIRONMENTAL_MAP_LAYER_MAP["similarity"]

  function handleImageryChange(nextId: SatelliteImageryLayerId) {
    setInternalImageryId(nextId)
    onImageryLayerChange?.(nextId)
    const nextDef = SATELLITE_LAYER_MAP[nextId]
    if (nextDef) {
      setInternalOpacity(nextDef.defaultOpacity)
      onImageryOpacityChange?.(nextDef.defaultOpacity)
    }
  }

  function handleDateChange(nextDate: string) {
    setInternalDate(nextDate)
    onImageryDateChange?.(nextDate)
  }

  function handleOpacityChange(nextOpacity: number) {
    setInternalOpacity(nextOpacity)
    onImageryOpacityChange?.(nextOpacity)
  }

  function handleParamChange(nextParam: MapParameterLayerId) {
    setInternalParamId(nextParam)
    onParameterLayerChange?.(nextParam)
  }

  return (
    <PanelCard
      title="Global Reconnaissance & Remote-Sensing Explorer"
      description="Interactive WGS84 satellite imagery & environmental telemetry explorer powered by NASA EOSDIS GIBS and Phase 3 datasets."
      isUpdating={isUpdating}
      bodyClassName="flex flex-col p-0 relative overflow-hidden"
    >
      {/* 1. Top HUD Telemetry Ribbon & Satellite Imagery Layer Switcher */}
      <div className="z-10 flex flex-col gap-2 border-b border-cyan-500/20 bg-slate-950/90 px-3.5 py-2.5 font-mono text-[11px] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Satellite className="size-3.5 text-cyan-400" />
            <span>NASA GIBS // ORBITAL IMAGERY LAYER</span>
            {activeImagery.id !== "dark-base" && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300">
                <ShieldCheck className="size-2.5 text-emerald-400" />
                <span>EOSDIS WMTS</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <span>
              LOCK:{" "}
              <strong className="text-white">
                {selectedSite ? selectedSite.candidate.name : "GLOBAL"}
              </strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-cyan-400 font-semibold">
              {canvasProps.results.length} ANALOGS
            </span>
          </div>
        </div>

        {/* Satellite Layer Selector Pills */}
        <div
          role="group"
          aria-label="Satellite imagery layer selector"
          className="flex flex-wrap items-center gap-1"
        >
          {SATELLITE_IMAGERY_LAYERS.map((layer) => {
            const isActive = layer.id === imageryLayerId
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => handleImageryChange(layer.id)}
                title={`${layer.name} (${layer.provider})`}
                className={cn(
                  "rounded px-2 py-1 text-[10px] font-semibold transition cursor-pointer border",
                  isActive
                    ? "border-cyan-500/60 bg-cyan-950/80 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white hover:border-slate-700"
                )}
              >
                {layer.shortName}
              </button>
            )
          })}
        </div>

        {/* Date Selector & Seasonal Presets (shown when active GIBS layer supports dates) */}
        {activeImagery.supportsDate && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/90 bg-slate-900/70 px-2.5 py-1.5 text-[10px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                <Calendar className="size-3 text-cyan-400" />
                <span>OBSERVATION DATE:</span>
              </span>
              <input
                type="date"
                aria-label="Satellite imagery observation date"
                value={imageryDate}
                min={activeImagery.minDate ?? "2000-03-01"}
                max={activeImagery.maxDate ?? "2025-12-31"}
                onChange={(e) => {
                  if (e.target.value) handleDateChange(e.target.value)
                }}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-white focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-1">
                {IMAGERY_DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.date}
                    type="button"
                    onClick={() => handleDateChange(preset.date)}
                    title={preset.description}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] transition cursor-pointer border",
                      imageryDate === preset.date
                        ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-200 font-bold"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                    )}
                  >
                    {preset.label.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Control */}
            <div className="flex items-center gap-1.5">
              <Eye className="size-3 text-slate-400" />
              <span className="text-slate-400 text-[9px]">OPACITY:</span>
              {[0.65, 0.85, 1.0].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => handleOpacityChange(op)}
                  className={cn(
                    "rounded px-1.5 py-0.2 text-[9px] transition cursor-pointer border",
                    Math.abs(imageryOpacity - op) < 0.05
                      ? "border-purple-500/50 bg-purple-950/60 text-purple-200 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                  )}
                >
                  {Math.round(op * 100)}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Interactive Scientific Data Layer (Marker Telemetry Overlay) Selector */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-800/80 pt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-semibold">
            <Layers className="size-3 text-purple-400" />
            <span>TELEMETRY LAYER:</span>
          </div>
          <div
            role="group"
            aria-label="Environmental telemetry parameter layer selector"
            className="flex flex-wrap items-center gap-1"
          >
            {ENVIRONMENTAL_MAP_LAYERS.map((param) => {
              const isActive = param.id === parameterLayerId
              return (
                <button
                  key={param.id}
                  type="button"
                  onClick={() => handleParamChange(param.id)}
                  title={`${param.label} (${param.sourceDataset})`}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-semibold transition cursor-pointer border",
                    isActive
                      ? "border-purple-500/60 bg-purple-950/80 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
                  )}
                >
                  {param.shortLabel}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. Map Canvas with Floating Legend Overlay */}
      <div className="relative z-0 min-h-80 flex-1 overflow-hidden sm:min-h-96">
        <div className="absolute inset-0">
          <AnalogMapCanvas
            {...canvasProps}
            imageryLayerId={imageryLayerId}
            imageryDate={imageryDate}
            imageryOpacity={imageryOpacity}
            parameterLayerId={parameterLayerId}
          />
        </div>

        {/* Floating Active Layer Badge (Top-Right of Map Canvas) */}
        <div className="pointer-events-none absolute top-2.5 right-2.5 z-[400] flex flex-col items-end gap-1 font-mono text-[9px]">
          <div className="rounded border border-slate-700/80 bg-slate-950/85 px-2.5 py-1 text-slate-200 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <span>TILE: {activeImagery.shortName}</span>
              {activeImagery.supportsDate && (
                <span className="rounded bg-cyan-950 px-1 py-0.2 text-[8px] text-cyan-200 border border-cyan-500/30">
                  {imageryDate}
                </span>
              )}
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">
              {activeImagery.instrument} · {activeImagery.spatialResolution}
            </div>
          </div>
        </div>

        {/* Floating Quantitative Legend (Bottom-Left of Map Canvas) */}
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-[400] flex flex-col gap-1.5 rounded-lg border border-slate-800/90 bg-slate-950/90 p-2.5 font-mono text-[9px] backdrop-blur-md shadow-xl max-w-[300px]">
          {/* Marker Parameter Legend */}
          <div>
            <div className="font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between gap-2">
              <span>MARKERS: {activeParam.label}</span>
              {activeParam.unit && (
                <span className="text-slate-400">[{activeParam.unit}]</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {activeParam.legendStops.map((stop) => (
                <span key={stop.label} className="inline-flex items-center gap-1 text-[8px] text-slate-200">
                  <span
                    className="size-2 rounded-full border border-white/30 shrink-0"
                    style={{ backgroundColor: stop.color }}
                  />
                  <span>{stop.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Satellite Tile Colorbar Legend (if not dark-base) */}
          {activeImagery.id !== "dark-base" && (
            <div className="border-t border-slate-800 pt-1">
              <div className="font-bold text-cyan-300 uppercase tracking-wider text-[8px]">
                IMAGERY SCALE: {activeImagery.legendUnit}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                {activeImagery.legendStops.map((stop) => (
                  <span key={stop.label} className="inline-flex items-center gap-1 text-[8px] text-slate-300">
                    <span
                      className="size-2 rounded-xs border border-white/20 shrink-0"
                      style={{ backgroundColor: stop.color }}
                    />
                    <span>{stop.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Selected Site Coordinate & Active Parameter Footer */}
      {selectedSite && (
        <div className="z-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/90 px-4 py-1.5 font-mono text-[10px] text-slate-400 backdrop-blur-md">
          <span className="flex items-center gap-1.5">
            <Crosshair className="size-3 text-cyan-400" />
            <span>
              LAT: {selectedSite.candidate.latitude.toFixed(2)}° · LON: {selectedSite.candidate.longitude.toFixed(2)}°
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-purple-300 font-semibold">
              {activeParam.shortLabel}:{" "}
              {activeParam.featureKey !== null
                ? formatFeatureValue(
                    activeParam.featureKey,
                    selectedSite.candidate.environment[activeParam.featureKey] ?? null
                  )
                : selectedSite.scoreDisplay}
            </span>
          </span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            SCORE: {selectedSite.score !== null ? `${selectedSite.score.toFixed(1)}%` : "INSUFFICIENT DATA"} · RANK #{selectedSite.rank}
          </span>
        </div>
      )}

      {/* 4. Expandable Scientific Provenance, Resolution & GIBS Disclaimer Drawer */}
      <div className="z-10 flex flex-col border-t border-slate-800/80 bg-slate-950/95 px-3.5 py-2 font-mono text-[10px] text-slate-400 leading-tight">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[9px] text-slate-300">
            <Info className="size-3 text-cyan-400 shrink-0" />
            <span>
              <strong>GIBS Notice:</strong> Satellite imagery tiles are visualization products, not raw pixel measurements. Analog ranking uses calibrated Phase 3 datasets.
            </span>
          </span>

          <button
            type="button"
            onClick={() => setShowLayerDetails((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[9px] font-semibold text-cyan-300 hover:border-cyan-500/40 hover:text-white transition cursor-pointer shrink-0"
          >
            <span>{showLayerDetails ? "Hide Layer Provenance" : "Inspect Layer Provenance"}</span>
            {showLayerDetails ? <ChevronUp className="size-2.5" /> : <ChevronDown className="size-2.5" />}
          </button>
        </div>

        {showLayerDetails && (
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 border-t border-slate-800/80 pt-2.5 text-[10px] leading-relaxed">
            {/* Imagery Layer Provenance Card */}
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/70 p-2.5 flex flex-col justify-between gap-1.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-cyan-300 uppercase">
                    IMAGERY: {activeImagery.name}
                  </span>
                  <a
                    href={activeImagery.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[9px] text-cyan-400 hover:underline shrink-0"
                  >
                    <span>NASA Doc</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <div className="text-[9px] text-slate-300 mt-1">
                  <strong>Product ID:</strong> <code className="text-cyan-200">{activeImagery.productId}</code>
                </div>
                <div className="text-[9px] text-slate-300">
                  <strong>Provider / Sensor:</strong> {activeImagery.provider} · {activeImagery.instrument}
                </div>
                <div className="text-[9px] text-slate-300">
                  <strong>Resolution:</strong> {activeImagery.spatialResolution} ({activeImagery.temporalResolution})
                </div>
                <p className="text-[9px] text-slate-400 mt-1">{activeImagery.scientificDescription}</p>
              </div>
              <div className="rounded bg-amber-950/30 border border-amber-500/30 px-2 py-1 text-[8px] text-amber-200/90">
                {activeImagery.visualizationDisclaimer}
              </div>
            </div>

            {/* Environmental Parameter Layer Provenance Card */}
            <div className="rounded-lg border border-purple-500/30 bg-slate-900/70 p-2.5 flex flex-col justify-between gap-1.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-purple-300 uppercase">
                    PARAMETER: {activeParam.label}
                  </span>
                  <a
                    href={activeParam.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[9px] text-purple-300 hover:underline shrink-0"
                  >
                    <span>Archive</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <div className="text-[9px] text-slate-300 mt-1">
                  <strong>Source Dataset:</strong> {activeParam.sourceDataset}
                </div>
                <div className="text-[9px] text-slate-300">
                  <strong>Measurement Unit:</strong> {activeParam.unit || "Categorical Class"}
                </div>
                <div className="text-[9px] text-slate-300">
                  <strong>Resolution:</strong> {activeParam.spatialResolution} ({activeParam.temporalResolution})
                </div>
                <p className="text-[9px] text-slate-400 mt-1">{activeParam.scientificMeaning}</p>
              </div>
              <div className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-[8px] text-slate-300">
                <strong>Planetary Availability:</strong> {activeParam.planetaryAvailabilityNote}
              </div>
            </div>
          </div>
        )}
      </div>
    </PanelCard>
  )
}
