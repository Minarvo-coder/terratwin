"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelCard } from "@/components/shared/panel-card"
import type { AnalogMapCanvasProps } from "./analog-map-canvas"

const AnalogMapCanvas = dynamic(() => import("./analog-map-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
})

export function AnalogMap(props: AnalogMapCanvasProps & { isUpdating?: boolean }) {
  const { isUpdating, ...canvasProps } = props
  return (
    <PanelCard
      title="Earth analog map"
      description="Marker size and opacity scale with illustrative similarity. Dashed outline indicates low data coverage."
      isUpdating={isUpdating}
      bodyClassName="flex flex-col p-0"
    >
      <div className="relative z-0 min-h-80 flex-1 overflow-hidden rounded-b-lg sm:min-h-96">
        <div className="absolute inset-0">
          <AnalogMapCanvas {...canvasProps} />
        </div>
      </div>
    </PanelCard>
  )
}
