"use client"

import { OptionCardGroup } from "@/components/shared/option-card-group"
import type { PlanetaryBody, PlanetaryTarget } from "@/lib/terratwin/types"

interface TargetSelectorProps {
  targets: PlanetaryTarget[]
  body: PlanetaryBody
  targetId: string
  onBodyChange: (body: PlanetaryBody) => void
  onTargetChange: (targetId: string) => void
}

const BODY_OPTIONS = [
  { value: "mars" as const, label: "Mars", description: "Jezero Crater & Gale Crater targets" },
  { value: "moon" as const, label: "Moon", description: "South Pole & Mare Tranquillitatis" },
]

export function TargetSelector({ targets, body, targetId, onBodyChange, onTargetChange }: TargetSelectorProps) {
  const bodyTargets = targets.filter((target) => target.body === body)

  return (
    <div className="flex flex-col gap-4">
      <OptionCardGroup
        name="body"
        legend="Planetary body"
        options={BODY_OPTIONS}
        value={body}
        onChange={onBodyChange}
        columns={2}
      />
      <OptionCardGroup
        name="target"
        legend="Target region"
        value={targetId}
        onChange={onTargetChange}
        options={bodyTargets.map((target) => ({
          value: target.id,
          label: target.name,
          description: target.region,
          meta: target.isVerified ? "VERIFIED PDS" : "DEMO",
        }))}
      />
    </div>
  )
}
