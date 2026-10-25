"use client"

import "leaflet/dist/leaflet.css"
import { useEffect } from "react"
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet"
import type { RankedCandidate } from "@/lib/terratwin/types"

const MARKER_FILL = "#38bdf8"
const MARKER_SELECTED_FILL = "#00f0ff"
const MARKER_SELECTED_STROKE = "#ffffff"
const MARKER_STROKE = "#0284c7"

export interface AnalogMapCanvasProps {
  results: RankedCandidate[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function KeepSelectionInView({ selected }: { selected: RankedCandidate | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (!selected) return
    const point: [number, number] = [selected.candidate.latitude, selected.candidate.longitude]
    if (!map.getBounds().contains(point)) map.panTo(point, { animate: true, duration: 0.8 })
  }, [map, selected])
  return null
}

function FitToResults({ results }: { results: RankedCandidate[] }) {
  const map = useMap()
  const boundsKey = results.map((result) => result.candidate.id).join(",")
  useEffect(() => {
    if (results.length === 0) return
    const points = results.map((result): [number, number] => [result.candidate.latitude, result.candidate.longitude])
    map.fitBounds(points, { padding: [32, 32], maxZoom: 6, animate: false })
  }, [map, boundsKey, results])
  return null
}

export default function AnalogMapCanvas({ results, selectedId, onSelect }: AnalogMapCanvasProps) {
  const selected = results.find((result) => result.candidate.id === selectedId)
  const ordered = [...results].sort((a, b) => Number(a.candidate.id === selectedId) - Number(b.candidate.id === selectedId))

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      worldCopyJump
      scrollWheelZoom={false}
      className="size-full"
      aria-label="Map of Earth analog candidate locations"
    >
      <TileLayer
        attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />
      <FitToResults results={results} />
      <KeepSelectionInView selected={selected} />
      {ordered.map((result) => {
        const isSelected = result.candidate.id === selectedId
        const scoreVal = result.score ?? 0
        const radius = isSelected ? 12 : 5 + (scoreVal / 100) * 6

        return (
          <CircleMarker
            key={result.candidate.id}
            center={[result.candidate.latitude, result.candidate.longitude]}
            radius={radius}
            pathOptions={{
              color: isSelected ? MARKER_SELECTED_STROKE : !result.isReliable ? "#f43f5e" : MARKER_STROKE,
              weight: isSelected ? 3 : 1.5,
              fillColor: isSelected ? MARKER_SELECTED_FILL : !result.isReliable ? "#e11d48" : MARKER_FILL,
              fillOpacity: isSelected ? 0.95 : !result.isReliable ? 0.4 : 0.45 + (scoreVal / 100) * 0.45,
              dashArray: !result.isReliable || result.confidence === "low" ? "3 3" : undefined,
            }}
            eventHandlers={{ click: () => onSelect(result.candidate.id) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div className="font-mono text-xs">
                <span className="font-bold text-cyan-300">
                  #{result.rank} {result.candidate.name}
                </span>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  Match Score:{" "}
                  <strong className={result.score === null ? "text-rose-400" : "text-white"}>
                    {result.scoreDisplay}
                  </strong>
                </div>
                <div className="text-[9px] text-slate-400">
                  {result.candidate.country} · {result.candidate.isVerified ? "NASA DB" : "Demo"}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
