"use client"

import { OptionCardGroup } from "@/components/shared/option-card-group"
import { MISSION_PURPOSES } from "@/lib/terratwin/features"
import type { MissionPurpose } from "@/lib/terratwin/types"

interface PurposeSelectorProps {
  value: MissionPurpose
  onChange: (value: MissionPurpose) => void
}

export function PurposeSelector({ value, onChange }: PurposeSelectorProps) {
  return (
    <OptionCardGroup
      name="purpose"
      legend="Mission purpose"
      value={value}
      onChange={onChange}
      options={MISSION_PURPOSES.map((purpose) => ({
        value: purpose.id,
        label: purpose.label,
        description: purpose.summary,
      }))}
    />
  )
}
