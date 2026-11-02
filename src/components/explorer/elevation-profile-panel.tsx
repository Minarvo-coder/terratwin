"use client"

import { useState, useMemo } from "react"
import { PanelCard } from "@/components/shared/panel-card"
import { useElevation } from "@/hooks/use-elevation"
import type { EarthCandidate, ElevationTransectProfile, PlanetaryTarget } from "@/lib/terratwin/types"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ElevationProfilePanelProps {
  target: PlanetaryTarget
  candidate: EarthCandidate
  allCandidates?: EarthCandidate[]
  onSelectCandidate?: (candidateId: string) => void
  isUpdating?: boolean
}

type ElevationViewMode = "relative-relief" | "dual-axis" | "split"

export function ElevationProfilePanel({
  target,
  candidate,
  allCandidates = [],
  onSelectCandidate,
  isUpdating,
}: ElevationProfilePanelProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidate.id)
  const [pointCount, setPointCount] = useState<number>(35)
  const [viewMode, setViewMode] = useState<ElevationViewMode>("relative-relief")

  // Ensure selected candidate stays in sync if parent changes candidate
  const activeCandidateId =
    allCandidates.some((c) => c.id === selectedCandidateId) ? selectedCandidateId : candidate.id
  const activeCandidate = allCandidates.find((c) => c.id === activeCandidateId) ?? candidate

  const { data, error, isLoading, isValidating, mutate } = useElevation({
    targetId: target.id,
    candidateId: activeCandidateId,
    points: pointCount,
    enabled: true,
  })

  const targetProfile = data?.target
  const candidateProfile = data?.candidate

  // Interleaved / Aligned Chart Data for Recharts
  const chartData = useMemo(() => {
    if (!targetProfile || !candidateProfile) return []

    const tSamples = targetProfile.samples
    const cSamples = candidateProfile.samples
    const count = Math.max(tSamples.length, cSamples.length)

    const aligned = []
    for (let i = 0; i < count; i++) {
      const t = tSamples[Math.min(i, tSamples.length - 1)]
      const c = cSamples[Math.min(i, cSamples.length - 1)]
      const progressPct = Math.round((i / (count - 1)) * 1000) / 10

      aligned.push({
        step: i,
        progressPct,
        progressLabel: `${progressPct}%`,
        // Target points
        targetDistKm: t?.distanceKm ?? 0,
        targetElevationM: t?.elevationM ?? 0,
        targetRelativeM: t?.relativeElevationM ?? 0,
        targetSlopeDeg: t?.localSlopeDeg ?? 0,
        targetLat: t?.latitude ?? 0,
        targetLon: t?.longitude ?? 0,
        // Candidate points
        candidateDistKm: c?.distanceKm ?? 0,
        candidateElevationM: c?.elevationM ?? 0,
        candidateRelativeM: c?.relativeElevationM ?? 0,
        candidateSlopeDeg: c?.localSlopeDeg ?? 0,
        candidateLat: c?.latitude ?? 0,
        candidateLon: c?.longitude ?? 0,
      })
    }
    return aligned
  }, [targetProfile, candidateProfile])

  function handleCandidateSwitch(nextId: string) {
    setSelectedCandidateId(nextId)
    onSelectCandidate?.(nextId)
  }

  return (
    <PanelCard
      title="Topographic Relief & Elevation Profile Engine"
      description={`Cross-body spatial elevation transect comparison: ${target.name} (${target.body.toUpperCase()}) vs. ${activeCandidate.name} (EARTH).`}
      isUpdating={isUpdating || isValidating}
      actions={
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <ShieldCheck className="size-3 text-emerald-400" />
            <span>MOLA / LOLA / COP-DEM</span>
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* 1. Controller Toolbar: View Mode, Candidate Switcher, Sampling Points & Scale */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 font-mono text-xs backdrop-blur-md">
          {/* View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="size-3 text-cyan-400" />
              <span>VIEW MODE:</span>
            </span>

            <button
              type="button"
              onClick={() => setViewMode("relative-relief")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border",
                viewMode === "relative-relief"
                  ? "border-cyan-500/60 bg-cyan-950/80 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              )}
              title="Compare relative topographic relief (delta z) normalized to traverse start point on a shared vertical scale"
            >
              <span>Relative Relief (Δz)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("dual-axis")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border",
                viewMode === "dual-axis"
                  ? "border-purple-500/60 bg-purple-950/80 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              )}
              title="Display absolute elevations relative to official datums with dual vertical Y-axes"
            >
              <span>Datum-Isolated (Dual Y)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border",
                viewMode === "split"
                  ? "border-emerald-500/60 bg-emerald-950/80 text-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.2)]"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              )}
              title="Show side-by-side synchronized twin charts for target and candidate"
            >
              <span>Split Twin Charts</span>
            </button>
          </div>

          {/* Candidate Switcher & Point Density Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {allCandidates.length > 1 && (
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-400">COMPARE:</span>
                <select
                  value={activeCandidateId}
                  onChange={(e) => handleCandidateSwitch(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  {allCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.country})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Point Density Selector */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">POINTS:</span>
              {[20, 35, 50].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPointCount(count)}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] transition cursor-pointer border",
                    pointCount === count
                      ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-200 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => mutate()}
              disabled={isLoading || isValidating}
              className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-slate-300 hover:text-white hover:border-cyan-500/40 transition cursor-pointer disabled:opacity-50"
              title="Re-sample elevation transects"
            >
              <RefreshCw className={cn("size-2.5", (isLoading || isValidating) && "animate-spin")} />
              <span>Re-sample</span>
            </button>
          </div>
        </div>

        {/* 2. Scientific Datum Disparity Warning Banner */}
        <div className="rounded-xl border border-cyan-500/30 bg-slate-900/50 p-3.5 font-mono text-[11px] leading-relaxed">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">
                Scientific Elevation Reference System Disparity:
              </span>
              <p className="text-slate-300 text-xs font-sans leading-relaxed">
                {targetProfile?.datum} cannot be subtracted directly from the {candidateProfile?.datum}.
                {viewMode === "relative-relief" ? (
                  <span>
                    {" "}In <strong>Relative Relief Mode</strong>, both profiles are normalized to start at Δz = 0 m, allowing authentic comparison of crater rim drops, canyon depths, and topographic slopes.
                  </span>
                ) : (
                  <span>
                    {" "}In <strong>Datum-Isolated Mode</strong>, independent vertical scales are maintained to preserve absolute elevation above each body&apos;s reference surface.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Interactive Chart Viewport */}
        {isLoading && !data ? (
          <div className="h-72 w-full rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse flex items-center justify-center font-mono text-xs text-slate-400">
            Sampling planetary DEM rasters along geodesic transect...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-6 font-mono text-xs text-rose-300">
            <p className="font-bold uppercase tracking-wider">Elevation Sampling Error</p>
            <p className="mt-1 text-slate-400">{error.message}</p>
          </div>
        ) : !targetProfile || !candidateProfile ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center font-mono text-xs text-slate-400">
            No elevation profile data available.
          </div>
        ) : viewMode === "split" ? (
          /* Split View Mode: Synchronized Twin Charts */
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Target Profile Chart */}
            <div className="rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-xs text-cyan-300 font-bold border-b border-slate-800 pb-2">
                <span>{targetProfile.locationName} ({targetProfile.planetaryBody.toUpperCase()})</span>
                <span className="text-[10px] text-slate-400">{targetProfile.totalDistanceKm} km Traverse</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="progressPct"
                      unit="%"
                      stroke="#64748b"
                      tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      stroke="#64748b"
                      unit="m"
                      tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<CustomElevationTooltip targetProfile={targetProfile} candidateProfile={candidateProfile} viewMode="split-target" />} />
                    <Area
                      type="monotone"
                      dataKey="targetElevationM"
                      name={`${targetProfile.locationName} Elevation`}
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#targetGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[9px] font-mono text-slate-500 truncate">
                Datum: {targetProfile.datum} · Res: {targetProfile.spatialResolution}
              </div>
            </div>

            {/* Candidate Profile Chart */}
            <div className="rounded-xl border border-purple-500/30 bg-slate-950/70 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-xs text-purple-300 font-bold border-b border-slate-800 pb-2">
                <span>{candidateProfile.locationName} (EARTH)</span>
                <span className="text-[10px] text-slate-400">{candidateProfile.totalDistanceKm} km Traverse</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="candGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="progressPct"
                      unit="%"
                      stroke="#64748b"
                      tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      stroke="#64748b"
                      unit="m"
                      tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<CustomElevationTooltip targetProfile={targetProfile} candidateProfile={candidateProfile} viewMode="split-candidate" />} />
                    <Area
                      type="monotone"
                      dataKey="candidateElevationM"
                      name={`${candidateProfile.locationName} Elevation`}
                      stroke="#c084fc"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#candGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[9px] font-mono text-slate-500 truncate">
                Datum: {candidateProfile.datum} · Res: {candidateProfile.spatialResolution}
              </div>
            </div>
          </div>
        ) : viewMode === "relative-relief" ? (
          /* Relative Relief Mode: Shared Vertical Delta Z Axis */
          <div className="rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between font-mono text-xs text-slate-400 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <span className="size-2 rounded-full bg-cyan-400" />
                  <span>{targetProfile.locationName} (Δz)</span>
                </span>
                <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                  <span className="size-2 rounded-full bg-purple-400" />
                  <span>{candidateProfile.locationName} (Δz)</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Shared Vertical Axis: Relative Relief from Traverse Start (Δz = z - z₀)
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="relTargetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="relCandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="progressPct"
                    unit="%"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <YAxis
                    unit="m"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomElevationTooltip targetProfile={targetProfile} candidateProfile={candidateProfile} viewMode="relative-relief" />} />
                  <Area
                    type="monotone"
                    dataKey="targetRelativeM"
                    name={`${targetProfile.locationName} (Δz)`}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#relTargetGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="candidateRelativeM"
                    name={`${candidateProfile.locationName} (Δz)`}
                    stroke="#c084fc"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#relCandGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* Datum-Isolated Dual Axes Mode */
          <div className="rounded-xl border border-purple-500/30 bg-slate-950/70 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between font-mono text-xs border-b border-slate-800 pb-2">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-cyan-400" />
                <span>Left Y-Axis: {targetProfile.locationName} [{targetProfile.datum.split(" (")[0]}]</span>
              </span>
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-purple-400" />
                <span>Right Y-Axis: {candidateProfile.locationName} [{candidateProfile.datum.split(" (")[0]}]</span>
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="progressPct"
                    unit="%"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#38bdf8"
                    unit="m"
                    tick={{ fill: "#38bdf8", fontSize: 10, fontFamily: "monospace" }}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#c084fc"
                    unit="m"
                    tick={{ fill: "#c084fc", fontSize: 10, fontFamily: "monospace" }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomElevationTooltip targetProfile={targetProfile} candidateProfile={candidateProfile} viewMode="dual-axis" />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="targetElevationM"
                    name={targetProfile.locationName}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="candidateElevationM"
                    name={candidateProfile.locationName}
                    stroke="#c084fc"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 4. Topographic Statistics Summary Cards */}
        {targetProfile && candidateProfile && (
          <div className="grid gap-3 sm:grid-cols-2 font-mono text-xs">
            {/* Target Topography Dossier */}
            <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                  <span>{targetProfile.locationName} ({targetProfile.planetaryBody.toUpperCase()})</span>
                  <a
                    href={targetProfile.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-cyan-400 hover:underline"
                  >
                    <span>PDS</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <div className="text-[11px] text-slate-300 font-semibold mt-1">
                  {targetProfile.transectName}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  {targetProfile.geologicalRationale}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-2.5 text-[10px]">
                <div>
                  <span className="text-slate-500 uppercase text-[8px]">Relief (Δz)</span>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">{targetProfile.reliefM} m</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[8px]">Elevation Span</span>
                  <div className="text-[11px] font-semibold text-slate-200 mt-0.5">
                    {targetProfile.minElevationM}m to {targetProfile.maxElevationM}m
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[8px]">Mean Slope</span>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">{targetProfile.meanSlopeDeg}°</div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 border-t border-slate-800/60 pt-1">
                Length: {targetProfile.totalDistanceKm} km · Res: {targetProfile.spatialResolution}
              </div>
            </div>

            {/* Candidate Topography Dossier */}
            <div className="rounded-xl border border-purple-500/30 bg-slate-900/60 p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                  <span>{candidateProfile.locationName} (EARTH)</span>
                  <a
                    href={candidateProfile.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-purple-300 hover:underline"
                  >
                    <span>Archive</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <div className="text-[11px] text-slate-300 font-semibold mt-1">
                  {candidateProfile.transectName}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  {candidateProfile.geologicalRationale}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-2.5 text-[10px]">
                <div>
                  <span className="text-slate-500 uppercase text-[8px]">Relief (Δz)</span>
                  <div className="text-sm font-bold text-purple-300 mt-0.5">{candidateProfile.reliefM} m</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[8px]">Elevation Span</span>
                  <div className="text-[11px] font-semibold text-slate-200 mt-0.5">
                    {candidateProfile.minElevationM}m to {candidateProfile.maxElevationM}m
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[8px]">Mean Slope</span>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">{candidateProfile.meanSlopeDeg}°</div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 border-t border-slate-800/60 pt-1">
                Length: {candidateProfile.totalDistanceKm} km · Res: {candidateProfile.spatialResolution}
              </div>
            </div>
          </div>
        )}
      </div>
    </PanelCard>
  )
}

interface ElevationTooltipPayloadItem {
  payload?: {
    progressLabel?: string
    step?: number
    targetElevationM?: number
    targetRelativeM?: number
    targetDistKm?: number
    targetSlopeDeg?: number
    candidateElevationM?: number
    candidateRelativeM?: number
    candidateDistKm?: number
    candidateSlopeDeg?: number
  }
}

/**
 * Custom High-Precision Scientific Tooltip for Recharts
 */
function CustomElevationTooltip({
  active,
  payload,
  targetProfile,
  candidateProfile,
  viewMode,
}: {
  active?: boolean
  payload?: readonly ElevationTooltipPayloadItem[]
  targetProfile?: ElevationTransectProfile
  candidateProfile?: ElevationTransectProfile
  viewMode?: string
}) {
  if (!active || !payload || !payload.length) return null

  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-950/95 p-3 font-mono text-xs text-slate-200 shadow-2xl backdrop-blur-md max-w-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px] text-slate-400 font-bold">
        <span>TRANSECT PROGRESS: {row.progressLabel}</span>
        <span>STEP #{row.step + 1}</span>
      </div>

      {/* Target Point Telemetry */}
      {viewMode !== "split-candidate" && targetProfile && (
        <div className="flex flex-col gap-0.5 rounded border border-cyan-500/30 bg-cyan-950/20 p-2 text-[10px]">
          <div className="font-bold text-cyan-300 truncate">
            {targetProfile.locationName} ({targetProfile.planetaryBody.toUpperCase()})
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Elevation (Datum):</span>
            <strong className="text-white">{row.targetElevationM} m</strong>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Relative Relief (Δz):</span>
            <strong className="text-cyan-200">{row.targetRelativeM > 0 ? `+${row.targetRelativeM}` : row.targetRelativeM} m</strong>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Distance / Slope:</span>
            <span>{row.targetDistKm} km · {row.targetSlopeDeg}°</span>
          </div>
        </div>
      )}

      {/* Candidate Point Telemetry */}
      {viewMode !== "split-target" && candidateProfile && (
        <div className="flex flex-col gap-0.5 rounded border border-purple-500/30 bg-purple-950/20 p-2 text-[10px]">
          <div className="font-bold text-purple-300 truncate">
            {candidateProfile.locationName} (EARTH)
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Elevation (Geoid):</span>
            <strong className="text-white">{row.candidateElevationM} m</strong>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Relative Relief (Δz):</span>
            <strong className="text-purple-200">{row.candidateRelativeM > 0 ? `+${row.candidateRelativeM}` : row.candidateRelativeM} m</strong>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Distance / Slope:</span>
            <span>{row.candidateDistKm} km · {row.candidateSlopeDeg}°</span>
          </div>
        </div>
      )}
    </div>
  )
}
