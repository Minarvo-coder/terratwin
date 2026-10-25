"use client"

import { useState } from "react"
import { useAnalogs } from "@/hooks/use-analogs"
import type { MissionPurpose, PlanetaryBody, PlanetaryTarget } from "@/lib/terratwin/types"
import { AnalogMap } from "./analog-map"
import { CandidateList } from "./candidate-list"
import { ComparisonPanel } from "./comparison-panel"
import { ExplorerEmpty, ExplorerError, ExplorerLoading } from "./explorer-states"
import { PurposeSelector } from "./purpose-selector"
import { ScoreThresholdControl } from "./score-threshold-control"
import { TargetProfile } from "./target-profile"
import { TargetSelector } from "./target-selector"

const DEFAULT_MIN_SCORE = 0

interface ExplorerDashboardProps {
  targets: PlanetaryTarget[]
  simulate?: string
}

export function ExplorerDashboard({ targets, simulate }: ExplorerDashboardProps) {
  const [body, setBody] = useState<PlanetaryBody>(targets[0]?.body ?? "moon")
  const [targetId, setTargetId] = useState(targets[0]?.id ?? "")
  const [purposeId, setPurposeId] = useState<MissionPurpose>("rover-testing")
  const [minScore, setMinScore] = useState(DEFAULT_MIN_SCORE)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, error, isLoading, isValidating, mutate } = useAnalogs({ targetId, purposeId, minScore, simulate })

  const selectedTarget = targets.find((target) => target.id === targetId)
  const results = data?.results ?? []
  const selectedResult = results.find((result) => result.candidate.id === selectedId) ?? results[0]
  const isUpdating = isValidating && !isLoading

  function handleBodyChange(nextBody: PlanetaryBody) {
    setBody(nextBody)
    const firstTarget = targets.find((target) => target.body === nextBody)
    if (firstTarget) setTargetId(firstTarget.id)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside aria-label="Exploration controls" className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-4">
          <TargetSelector
            targets={targets}
            body={body}
            targetId={targetId}
            onBodyChange={handleBodyChange}
            onTargetChange={setTargetId}
          />
          <PurposeSelector value={purposeId} onChange={setPurposeId} />
          <ScoreThresholdControl value={minScore} onCommit={setMinScore} />
        </div>
        {selectedTarget && (
          <div className="rounded-lg border border-border bg-card p-4">
            <TargetProfile target={selectedTarget} />
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        {error ? (
          <ExplorerError message={error.message} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <ExplorerLoading />
        ) : results.length === 0 ? (
          <ExplorerEmpty minScore={data.minScore} onReset={() => setMinScore(DEFAULT_MIN_SCORE)} />
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <AnalogMap
                results={results}
                selectedId={selectedResult?.candidate.id ?? null}
                onSelect={setSelectedId}
                isUpdating={isUpdating}
              />
              <CandidateList
                results={results}
                totalCandidates={data.totalCandidates}
                selectedId={selectedResult?.candidate.id ?? null}
                onSelect={setSelectedId}
                isUpdating={isUpdating}
              />
            </div>
            {selectedResult && (
              <ComparisonPanel
                target={data.target}
                purpose={data.purpose}
                result={selectedResult}
                isUpdating={isUpdating}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
