"use client"

import "leaflet/dist/leaflet.css"
import { useEffect } from "react"
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet"
import { formatScore } from "@/lib/terratwin/format"
import type { RankedCandidate } from "@/lib/terratwin/types"

// SVG presentation attributes cannot read CSS variables, so theme colours are mirrored here.
const MARKER_FILL = "#5ba8ee"
const MARKER_SELECTED_STROKE = "#f1f5fb"
const MARKER_STROKE = "#1b2a47"

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
    if (!map.getBounds().contains(point)) map.panTo(point, { animate: false })
  }, [map, selected])
  return null
}

function FitToResults({ results }: { results: RankedCandidate[] }) {
  const map = useMap()
  const boundsKey = results.map((result) => result.candidate.id).join(",")
  useEffect(() => {
    if (results.length === 0) return
    const points = results.map((result): [number, number] => [result.candidate.latitude, result.candidate.longitude])
    map.fitBounds(points, { padding: [24, 24], maxZoom: 5, animate: false })
    // Refit only when the set of visible candidates changes, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, boundsKey])
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
        attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />
      <FitToResults results={results} />
      <KeepSelectionInView selected={selected} />
      {ordered.map((result) => {
        const isSelected = result.candidate.id === selectedId
        return (
          <CircleMarker
            key={result.candidate.id}
            center={[result.candidate.latitude, result.candidate.longitude]}
            radius={isSelected ? 10 : 4 + (result.score / 100) * 5}
            pathOptions={{
              color: isSelected ? MARKER_SELECTED_STROKE : MARKER_STROKE,
              weight: isSelected ? 2.5 : 1,
              fillColor: MARKER_FILL,
              fillOpacity: 0.3 + (result.score / 100) * 0.65,
              dashArray: result.confidence === "low" ? "3 3" : undefined,
            }}
            eventHandlers={{ click: () => onSelect(result.candidate.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="font-medium">
                #{result.rank} {result.candidate.name}
              </span>
              <br />
              Score {formatScore(result.score)} (illustrative)
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
