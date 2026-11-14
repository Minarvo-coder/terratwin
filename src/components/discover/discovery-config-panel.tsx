"use client"

import { useState } from "react"
import type {
  AnalogEnvironmentCategory,
  GeographicBoundingBox,
  PlanetaryBody,
  PlanetaryTarget,
} from "@/lib/terratwin/types"
import {
  ANALOG_ENVIRONMENT_CATEGORIES,
  FEATURE_MAP,
} from "@/lib/terratwin/features"
import {
  CONFIGURABLE_MISSION_PROFILES,
} from "@/lib/terratwin/config/comparison-config"
import {
  estimateScannerGrid,
  SCANNER_HARD_MAX_CANDIDATES,
  SCANNER_HARD_MAX_CELLS,
  SCANNER_MAX_SPACING_DEG,
  SCANNER_MIN_CANDIDATES,
  SCANNER_MIN_CELLS,
  SCANNER_MIN_SPACING_DEG,
  type ScannerConfigDraft,
} from "@/lib/terratwin/scanner/scanner-utils"
import type { DiscoveryScanLifecycle } from "@/hooks/use-discovery-scanner"
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Info,
  Loader2,
  MapPin,
  PenSquare,
  Play,
  RotateCcw,
  Scan,
  ShieldAlert,
  SlidersHorizontal,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscoveryConfigPanelProps {
  targets: PlanetaryTarget[]
  body: PlanetaryBody
  draft: ScannerConfigDraft
  manualInputs: { minLat: string; minLon: string; maxLat: string; maxLon: string }
  regionValidationError: string | null
  isDrawMode: boolean
  isBusy: boolean
  lifecycle: DiscoveryScanLifecycle
  statusMessage: string | null
  errorRetryAfterSec: number | null
  onBodyChange: (body: PlanetaryBody) => void
  onTargetChange: (targetId: string) => void
  onMissionProfileChange: (profileId: string) => void
  onManualCoordChange: (field: "minLat" | "minLon" | "maxLat" | "maxLon", value: string) => void
  onToggleDrawMode: () => void
  onCaptureViewport: () => void
  onClearRegion: () => void
  onApplyPresetRegion: (bbox: GeographicBoundingBox, focusZoom?: number) => void
  onGridSpacingChange: (spacing: number) => void
  onMaxCellsChange: (maxCells: number) => void
  onMaxCandidatesChange: (maxCandidates: number) => void
  onCategoryChange: (category: AnalogEnvironmentCategory | "") => void
  onLaunchScan: () => void
  onCancelScan: () => void
}

const EXAMPLE_REGIONS: Array<{ label: string; bbox: GeographicBoundingBox }> = [
  { label: "Lake Salda, Turkey", bbox: [37.1, 29.2, 38.0, 30.2] },
  { label: "Flagstaff Volcanic Field, US", bbox: [35.0, -112.0, 36.0, -111.0] },
  { label: "Atacama Yungay, Chile", bbox: [-24.6, -70.4, -23.6, -69.4] },
  { label: "Askja Highlands, Iceland", bbox: [64.7, -17.2, 65.5, -16.1] },
]

export function DiscoveryConfigPanel({
  targets,
  body,
  draft,
  manualInputs,
  regionValidationError,
  isDrawMode,
  isBusy,
  lifecycle,
  statusMessage,
  errorRetryAfterSec,
  onBodyChange,
  onTargetChange,
  onMissionProfileChange,
  onManualCoordChange,
  onToggleDrawMode,
  onCaptureViewport,
  onClearRegion,
  onApplyPresetRegion,
  onGridSpacingChange,
  onMaxCellsChange,
  onMaxCandidatesChange,
  onCategoryChange,
  onLaunchScan,
  onCancelScan,
}: DiscoveryConfigPanelProps) {
  const [showManualCoords, setShowManualCoords] = useState(true)
  const [showWeights, setShowWeights] = useState(false)

  const bodyTargets = targets.filter((t) => t.body === body)
  const activeTarget = bodyTargets.find((t) => t.id === draft.targetId) ?? targets.find((t) => t.id === draft.targetId)
  const activeProfile =
    CONFIGURABLE_MISSION_PROFILES.find((p) => p.id === draft.missionProfile) ??
    CONFIGURABLE_MISSION_PROFILES[0]

  const gridEstimate = estimateScannerGrid(
    draft.boundingBox,
    draft.gridSpacingDeg,
    draft.maxCells
  )

  const combinedValidationError = regionValidationError ?? (!draft.boundingBox ? null : gridEstimate.error)
  const canLaunch =
    !isBusy &&
    Boolean(draft.targetId) &&
    Boolean(draft.missionProfile) &&
    Boolean(draft.boundingBox) &&
    !combinedValidationError

  const activeWeightEntries = Object.entries(activeProfile.weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <aside
      aria-label="Mission and scan configuration"
      className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-sans"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[11px] font-medium text-sky-400">
            Mission Configuration
          </span>
          <h2 className="text-sm font-semibold text-white">Planetary Analog Scan Setup</h2>
        </div>
        <SlidersHorizontal className="size-4 text-sky-400" aria-hidden="true" />
      </div>

      {/* Section 1: Planetary Target */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold text-slate-200">
          Planetary Target
        </legend>

        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Celestial body selection">
          {(["mars", "moon"] as const).map((b) => {
            const active = body === b
            return (
              <button
                key={b}
                type="button"
                disabled={isBusy}
                aria-pressed={active}
                onClick={() => onBodyChange(b)}
                className={cn(
                  "min-h-9 rounded-lg border px-2.5 py-1.5 text-left text-xs transition cursor-pointer disabled:opacity-50",
                  active
                    ? "border-sky-500 bg-slate-800 text-white font-medium"
                    : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                )}
              >
                <span className="block font-semibold">
                  {b === "mars" ? "Mars" : "Moon"}
                </span>
                <span className="block text-[11px] text-slate-400">
                  {b === "mars" ? "Martian surface" : "Lunar base sites"}
                </span>
              </button>
            )
          })}
        </div>

        <label className="flex flex-col gap-1">
          <span className="sr-only">Select specific planetary exploration site</span>
          <select
            aria-label="Target planetary exploration site"
            disabled={isBusy}
            value={draft.targetId}
            onChange={(e) => onTargetChange(e.target.value)}
            className="min-h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
          >
            {bodyTargets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.isVerified ? "PDS Verified" : "Reference"})
              </option>
            ))}
          </select>
        </label>

        {activeTarget && (
          <p className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-2.5 py-2 text-[11px] leading-relaxed text-slate-300">
            <span className="font-mono text-[10px] text-cyan-400 block mb-0.5">
              {activeTarget.region}
            </span>
            {activeTarget.summary}
          </p>
        )}
      </fieldset>

      {/* Section 2: Mission Profile */}
      <fieldset className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
        <legend className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          Mission Profile
        </legend>

        <div className="flex flex-col gap-1.5">
          {CONFIGURABLE_MISSION_PROFILES.map((prof) => {
            const selected = draft.missionProfile === prof.id
            return (
              <button
                key={prof.id}
                type="button"
                disabled={isBusy}
                aria-pressed={selected}
                onClick={() => onMissionProfileChange(prof.id)}
                className={cn(
                  "rounded-lg border p-2.5 text-left transition cursor-pointer disabled:opacity-50",
                  selected
                    ? "border-cyan-400 bg-cyan-950/50 text-white"
                    : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{prof.label}</span>
                  {selected && (
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">
                  {prof.summary}
                </p>
              </button>
            )
          })}
        </div>

        {/* Expandable Mission Weight Disclosure */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/50">
          <button
            type="button"
            onClick={() => setShowWeights((prev) => !prev)}
            aria-expanded={showWeights}
            className="flex w-full items-center justify-between px-2.5 py-2 font-mono text-[11px] text-slate-300 hover:text-white cursor-pointer"
          >
            <span>Factors influencing similarity ({activeWeightEntries.length})</span>
            {showWeights ? (
              <ChevronUp className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            )}
          </button>
          {showWeights && (
            <div className="border-t border-slate-800 px-2.5 py-2 space-y-1.5">
              <p className="text-[10px] leading-relaxed text-slate-400">
                {activeProfile.statusNotice}
              </p>
              <ul className="space-y-1 font-mono text-[10px]">
                {activeWeightEntries.map(([key, weight]) => {
                  const def = FEATURE_MAP[key as keyof typeof FEATURE_MAP]
                  return (
                    <li key={key} className="flex items-center justify-between text-slate-300">
                      <span>{def?.shortLabel ?? key}</span>
                      <span className="text-cyan-300 font-semibold">
                        {Math.round(weight * 100)}%
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </fieldset>

      {/* Section 3: Geographic Region Selection */}
      <fieldset className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
        <div className="flex items-center justify-between">
          <legend className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Earth Region (WGS84, Max 10° × 10°)
          </legend>
          {draft.boundingBox && (
            <button
              type="button"
              disabled={isBusy}
              onClick={onClearRegion}
              className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-white cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={isBusy}
            onClick={onToggleDrawMode}
            aria-pressed={isDrawMode}
            className={cn(
              "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 font-mono text-[11px] font-semibold transition cursor-pointer disabled:opacity-40",
              isDrawMode
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                : "border-slate-700 bg-slate-950 text-cyan-300 hover:border-cyan-400"
            )}
          >
            <PenSquare className="size-3.5" aria-hidden="true" />
            <span>{isDrawMode ? "Drawing…" : "Draw on Map"}</span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={onCaptureViewport}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-[11px] text-slate-200 transition hover:border-cyan-400 cursor-pointer disabled:opacity-40"
          >
            <Scan className="size-3.5 text-cyan-400" aria-hidden="true" />
            <span>Map Viewport</span>
          </button>
        </div>

        {/* Example starter regions for quick exploration */}
        <div className="flex flex-wrap gap-1">
          {EXAMPLE_REGIONS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={isBusy}
              onClick={() => onApplyPresetRegion(preset.bbox, 8)}
              className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 cursor-pointer disabled:opacity-40"
            >
              <MapPin className="size-2.5 text-cyan-400" aria-hidden="true" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Manual Coordinates Accordion (Accessible Alternative to Map) */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/50">
          <button
            type="button"
            onClick={() => setShowManualCoords((prev) => !prev)}
            aria-expanded={showManualCoords}
            className="flex w-full items-center justify-between px-2.5 py-2 font-mono text-[11px] text-slate-300 hover:text-white cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Crosshair className="size-3.5 text-cyan-400" aria-hidden="true" />
              <span>Manual Coordinates [S, W, N, E]</span>
            </span>
            {showManualCoords ? (
              <ChevronUp className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            )}
          </button>

          {showManualCoords && (
            <div className="grid grid-cols-2 gap-2 border-t border-slate-800 p-2.5 font-mono text-[11px]">
              {(
                [
                  { id: "minLat", label: "Min Lat (°)", placeholder: "35.0" },
                  { id: "minLon", label: "Min Lon (°)", placeholder: "-112.0" },
                  { id: "maxLat", label: "Max Lat (°)", placeholder: "36.0" },
                  { id: "maxLon", label: "Max Lon (°)", placeholder: "-111.0" },
                ] as const
              ).map((field) => (
                <label key={field.id} className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">{field.label}</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isBusy}
                    value={manualInputs[field.id]}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(combinedValidationError)}
                    aria-describedby={combinedValidationError ? "scanner-region-error" : undefined}
                    onChange={(e) => onManualCoordChange(field.id, e.target.value)}
                    className="min-h-8 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Region validation or geometry readout */}
        {combinedValidationError ? (
          <div
            id="scanner-region-error"
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 p-2.5 text-[11px] text-rose-200"
          >
            <AlertTriangle className="size-4 shrink-0 text-rose-400 mt-0.5" aria-hidden="true" />
            <span>{combinedValidationError}</span>
          </div>
        ) : !draft.boundingBox ? (
          <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] text-slate-300">
            <Compass className="size-4 shrink-0 text-cyan-400 mt-0.5" aria-hidden="true" />
            <span>Select an Earth region to begin a scientific analog scan.</span>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/25 px-2.5 py-2 font-mono text-[11px] text-emerald-200">
            <span>Grid preview: {gridEstimate.rows} × {gridEstimate.cols}</span>
            <span className="font-bold">{gridEstimate.totalCells} / {draft.maxCells} cells</span>
          </div>
        )}
      </fieldset>

      {/* Section 4: Scan Settings */}
      <fieldset className="flex flex-col gap-2.5 border-t border-slate-800/80 pt-3">
        <legend className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          Scan Parameters
        </legend>

        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">
              Grid spacing (° deg)
            </span>
            <input
              type="number"
              min={SCANNER_MIN_SPACING_DEG}
              max={SCANNER_MAX_SPACING_DEG}
              step={0.1}
              disabled={isBusy}
              value={draft.gridSpacingDeg}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isFinite(v)) onGridSpacingChange(v)
              }}
              className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">
              Max cells (1–{SCANNER_HARD_MAX_CELLS})
            </span>
            <input
              type="number"
              min={SCANNER_MIN_CELLS}
              max={SCANNER_HARD_MAX_CELLS}
              step={1}
              disabled={isBusy}
              value={draft.maxCells}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isFinite(v)) onMaxCellsChange(Math.round(v))
              }}
              className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 font-mono text-[11px]">
          <span className="text-[10px] text-slate-400">
            Max returned candidates (1–{SCANNER_HARD_MAX_CANDIDATES})
          </span>
          <input
            type="number"
            min={SCANNER_MIN_CANDIDATES}
            max={SCANNER_HARD_MAX_CANDIDATES}
            step={1}
            disabled={isBusy}
            value={draft.maxCandidates}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (Number.isFinite(v)) onMaxCandidatesChange(Math.round(v))
            }}
            className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
          />
        </label>

        {/* Honest Advisory Research Focus (explicitly marked advisory-only per Phase 6.3.1 contract) */}
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] text-slate-400">
            Research focus — advisory context only (no live cell filter)
          </span>
          <select
            aria-label="Research focus (advisory only)"
            disabled={isBusy}
            value={draft.advisoryCategory ?? ""}
            onChange={(e) =>
              onCategoryChange((e.target.value || "") as AnalogEnvironmentCategory | "")
            }
            className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] text-slate-200 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
          >
            <option value="">None specified (general regional screen)</option>
            {ANALOG_ENVIRONMENT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.shortLabel} (advisory)
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      {/* Launch Action & Status */}
      <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canLaunch}
            aria-busy={isBusy}
            onClick={onLaunchScan}
            className={cn(
              "flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 font-medium text-xs transition cursor-pointer",
              canLaunch
                ? "border-sky-400 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
                : "border-slate-800 bg-slate-800/80 text-slate-400 cursor-not-allowed"
            )}
          >
            {isBusy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Scanning…</span>
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden="true" />
                <span>Launch Discovery Scan</span>
              </>
            )}
          </button>

          {isBusy && (
            <button
              type="button"
              onClick={onCancelScan}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-600 bg-slate-900 px-3 font-mono text-xs text-slate-200 hover:border-rose-400 hover:text-rose-200 cursor-pointer"
              title="Stop waiting for the browser request"
            >
              <XCircle className="size-4" aria-hidden="true" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* Accessible Request Status Announcement */}
        {statusMessage && (
          <div
            role={lifecycle === "error" || lifecycle === "rate-limited" ? "alert" : "status"}
            aria-live="polite"
            className={cn(
              "rounded-lg border p-2.5 text-[11px] leading-relaxed",
              lifecycle === "error" || lifecycle === "rate-limited"
                ? "border-rose-500/40 bg-rose-950/40 text-rose-200"
                : lifecycle === "partial-success" || lifecycle === "insufficient-data"
                  ? "border-amber-500/40 bg-amber-950/35 text-amber-200"
                  : lifecycle === "submitting" || lifecycle === "validating"
                    ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-200"
                    : "border-slate-800 bg-slate-950/70 text-slate-300"
            )}
          >
            <div className="flex items-start gap-2">
              {lifecycle === "rate-limited" || lifecycle === "error" ? (
                <ShieldAlert className="size-4 shrink-0 text-rose-400 mt-0.5" aria-hidden="true" />
              ) : (
                <Info className="size-4 shrink-0 text-cyan-400 mt-0.5" aria-hidden="true" />
              )}
              <div>
                <p>{statusMessage}</p>
                {lifecycle === "rate-limited" && errorRetryAfterSec && (
                  <p className="mt-1 font-mono text-[10px] text-rose-300">
                    Retry-After guidance: wait ~{errorRetryAfterSec} seconds before launching another scan.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-slate-500">
          Protected by a 20 scans/min sliding-window rate limit and 15-min discovery cache (shared across instances via Upstash Redis when configured, with bounded local fallback offline).
        </p>
      </div>
    </aside>
  )
}
