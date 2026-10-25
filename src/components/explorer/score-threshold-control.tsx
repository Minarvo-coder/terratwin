"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"

interface ScoreThresholdControlProps {
  value: number
  onCommit: (value: number) => void
}

function firstValue(value: number | readonly number[]): number {
  return Array.isArray(value) ? value[0] : (value as number)
}

export function ScoreThresholdControl({ value, onCommit }: ScoreThresholdControlProps) {
  const [draft, setDraft] = useState(value)
  const [lastCommitted, setLastCommitted] = useState(value)

  if (value !== lastCommitted) {
    setLastCommitted(value)
    setDraft(value)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span id="min-score-label" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Minimum similarity
        </span>
        <span className="font-mono text-sm tabular-nums">{draft}</span>
      </div>
      <Slider
        aria-labelledby="min-score-label"
        min={0}
        max={100}
        step={5}
        value={[draft]}
        onValueChange={(next) => setDraft(firstValue(next))}
        onValueCommitted={(next) => onCommit(firstValue(next))}
      />
      <p className="text-xs text-muted-foreground">Hide candidates scoring below this illustrative threshold.</p>
    </div>
  )
}
