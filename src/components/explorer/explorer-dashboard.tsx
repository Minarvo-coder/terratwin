"use client"

import { useState } from "react"
import {
  Activity,
  Compass,
  Layers,
  ListFilter,
  Mountain,
  ShieldCheck,
  Terminal,
} from "lucide-react"
import { useAnalogs } from "@/hooks/use-analogs"
import { MISSION_PURPOSES } from "@/lib/terratwin/features"
import type { MapParameterLayerId, SatelliteImageryLayerId } from "@/lib/terratwin/config/satellite-layers"
import type { MissionPurpose, PlanetaryBody, PlanetaryTarget } from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"
import { DsSegmentedControl, DsSelect, DsSlider } from "@/components/ds/primitives"
import { DsDisclosureRow, DsFilterBar, DsIconTabBar } from "@/components/ds/explorer-widgets"
import { AnalogMap } from "./analog-map"
import { CandidateList } from "./candidate-list"
import { ComparisonPanel } from "./comparison-panel"
import { ElevationProfilePanel } from "./elevation-profile-panel"
import { ExplorerEmpty, ExplorerError, ExplorerLoading } from "./explorer-states"
import { MissionSuitePanel } from "./mission-suite-panel"
import { PlanetaryGlobe } from "./planetary-globe"
import { ScientificEvidenceExplorer } from "./scientific-evidence-explorer"
import { TargetProfile } from "./target-profile"
import { TerrainComparisonWorkspace } from "./terrain-comparison-workspace"

const DEFAULT_MIN_SCORE = 0

type ExplorerViewTab =
  | "explore"
  | "workspace"
  | "elevation"
  | "evidence"
  | "telemetry"
  | "suite"
  | "all"

interface ExplorerDashboardProps {
  targets: PlanetaryTarget[]
}

export function ExplorerDashboard({ targets }: ExplorerDashboardProps) {
  const [activeTab, setActiveTab] = useState<ExplorerViewTab>("explore")
  const [reconLayout, setReconLayout] = useState<"dual" | "planet" | "earth">("dual")
  const [sourceFilter, setSourceFilter] = useState<"all" | "verified" | "sample">("all")
  const [body, setBody] = useState<PlanetaryBody>("mars")
  const [targetId, setTargetId] = useState(() => {
    const defaultTarget = targets.find((t) => t.body === "mars" && t.isVerified) ?? targets[0]
    return defaultTarget?.id ?? ""
  })
  const [purposeId, setPurposeId] = useState<MissionPurpose>("rover-testing")
  const [minScore, setMinScore] = useState(DEFAULT_MIN_SCORE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [imageryLayerId, setImageryLayerId] = useState<SatelliteImageryLayerId>("dark-base")
  const [imageryDate, setImageryDate] = useState<string>("2024-07-15")
  const [imageryOpacity, setImageryOpacity] = useState<number>(1.0)
  const [parameterLayerId, setParameterLayerId] = useState<MapParameterLayerId>("similarity")

  const filteredTargets = targets.filter((t) => {
    if (sourceFilter === "verified") return !!t.isVerified
    if (sourceFilter === "sample") return !t.isVerified
    const hasVerified = targets.some((target) => target.isVerified)
    if (hasVerified) return !!t.isVerified
    return true
  })

  const bodyTargets = filteredTargets.filter((t) => t.body === body)

  const { data, error, isLoading, isValidating, mutate, isTargetValid } = useAnalogs({
    targetId,
    purposeId,
    minScore,
  })

  const selectedTarget =
    targets.find((target) => target.id === targetId || target.databaseId === targetId) ?? data?.target
  const results = data?.results ?? []
  const selectedResult = results.find((result) => result.candidate.id === selectedId) ?? results[0]
  const isUpdating = isValidating && !isLoading

  function handleBodyChange(nextBody: PlanetaryBody) {
    setBody(nextBody)
    const matching = filteredTargets.filter((t) => t.body === nextBody)
    const nextTarget = matching.find((t) => t.isVerified) ?? matching[0]
    if (nextTarget) {
      setTargetId(nextTarget.id)
      setSelectedId(null)
    }
  }

  function handleFilterChange(mode: "all" | "verified" | "sample") {
    setSourceFilter(mode)
    const available = targets.filter((t) => {
      if (mode === "verified") return !!t.isVerified
      if (mode === "sample") return !t.isVerified
      const hasVerified = targets.some((target) => target.isVerified)
      if (hasVerified) return !!t.isVerified
      return true
    })
    const firstMatching = available.find((t) => t.body === body) ?? available[0]
    if (firstMatching) {
      setTargetId(firstMatching.id)
      setSelectedId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <span className="sr-only">TARGET SENSOR SUITE · Flight Deck Reconnaissance · 1-to-1 Analog Site Matching</span>
      {/* 1. Horizontal Control Filter Bar */}
      <DsFilterBar>
        <div className="md:col-span-2 space-y-1.5">
          <span className="block text-xs font-medium text-[var(--tt-dark-ink-secondary)]">Destination</span>
          <DsSegmentedControl
            tone="dark"
            size="sm"
            value={body}
            onChange={handleBodyChange}
            ariaLabel="Destination planetary body"
            options={[
              { value: "mars", label: "Mars" },
              { value: "moon", label: "Moon" },
            ]}
          />
        </div>

        <div className="md:col-span-3">
          <DsSelect
            label="Target region"
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value)
              setSelectedId(null)
            }}
            options={
              bodyTargets.length > 0
                ? bodyTargets.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))
                : [{ value: "", label: "No targets available" }]
            }
          />
        </div>

        <div className="md:col-span-3">
          <DsSelect
            label="Mission purpose"
            value={purposeId}
            onChange={(e) => setPurposeId(e.target.value as MissionPurpose)}
            options={MISSION_PURPOSES.map((p) => ({
              value: p.id,
              label: p.label,
            }))}
          />
        </div>

        <div className="md:col-span-2">
          <DsSelect
            label="Catalog"
            value={sourceFilter}
            onChange={(e) => handleFilterChange(e.target.value as "all" | "verified" | "sample")}
            options={[
              { value: "all", label: "All catalog" },
              { value: "verified", label: "Verified PDS" },
              { value: "sample", label: "Illustrative demo" },
            ]}
          />
        </div>

        <div className="md:col-span-2">
          <DsSlider
            label="Minimum similarity"
            value={minScore}
            min={0}
            max={100}
            step={5}
            onChange={setMinScore}
            suffix=""
          />
        </div>
      </DsFilterBar>

      {/* 2. Icon Tab Bar & View Layout Switcher */}
      <DsIconTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: "explore", label: "Explore", icon: <Compass className="size-3.5" /> },
          { id: "workspace", label: "Terrain Workspace", icon: <Mountain className="size-3.5" /> },
          { id: "elevation", label: "Elevation Transects", icon: <Activity className="size-3.5" /> },
          { id: "evidence", label: "Evidence Explorer", icon: <ShieldCheck className="size-3.5" /> },
          { id: "telemetry", label: "Telemetry Overview", icon: <Terminal className="size-3.5" /> },
          { id: "suite", label: "Multi-site portfolio", icon: <Layers className="size-3.5" /> },
          { id: "all", label: "All Panels", icon: <ListFilter className="size-3.5" /> },
        ]}
        rightSlot={
          activeTab === "explore" ? (
            <DsSegmentedControl
              tone="dark"
              size="sm"
              value={reconLayout}
              onChange={setReconLayout}
              ariaLabel="Flight deck viewport layout"
              options={[
                { value: "dual", label: "Side by side" },
                { value: "planet", label: `${body === "mars" ? "Mars" : "Moon"} 3D` },
                { value: "earth", label: "Earth Map" },
              ]}
            />
          ) : undefined
        }
      />

      {/* 3. Main Content */}
      {!isTargetValid ? (
        <div className="rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] p-8 text-center">
          <p className="tt-mono-label text-[var(--tt-accent)]">No Planetary Target Selected</p>
          <p className="mt-2 text-xs text-[var(--tt-dark-ink-secondary)]">
            Please select a Moon or Mars target region above to rank Earth analog sites.
          </p>
        </div>
      ) : activeTab === "suite" && selectedTarget ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <PlanetaryGlobe
              body={body}
              selectedTarget={selectedTarget}
              allTargets={filteredTargets}
              onSelectTarget={(id) => {
                setTargetId(id)
                setSelectedId(null)
              }}
              isUpdating={isUpdating}
            />
            <div className="rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] p-4">
              <TargetProfile target={selectedTarget} />
            </div>
          </div>
          <MissionSuitePanel
            target={selectedTarget}
            purposeId={purposeId}
            isVerified={data?.dataset.isVerified}
          />
        </div>
      ) : error ? (
        <ExplorerError message={error.message} onRetry={() => mutate()} />
      ) : isLoading || !data ? (
        <ExplorerLoading />
      ) : results.length === 0 ? (
        <ExplorerEmpty minScore={data.minScore} onReset={() => setMinScore(DEFAULT_MIN_SCORE)} />
      ) : (
        <>
          {/* Explore Flight Deck (3D + Map + Ranked List) */}
          {(activeTab === "explore" || activeTab === "all") && (
            <div
              className={cn(
                "grid gap-4",
                reconLayout === "dual"
                  ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]"
                  : "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]",
              )}
            >
              {(reconLayout === "dual" || reconLayout === "planet") && (
                <PlanetaryGlobe
                  body={body}
                  selectedTarget={selectedTarget}
                  allTargets={filteredTargets}
                  onSelectTarget={(id) => {
                    setTargetId(id)
                    setSelectedId(null)
                  }}
                  isUpdating={isUpdating}
                />
              )}

              {(reconLayout === "dual" || reconLayout === "earth") && (
                <AnalogMap
                  results={results}
                  selectedId={selectedResult?.candidate.id ?? null}
                  onSelect={setSelectedId}
                  isUpdating={isUpdating}
                  imageryLayerId={imageryLayerId}
                  imageryDate={imageryDate}
                  imageryOpacity={imageryOpacity}
                  parameterLayerId={parameterLayerId}
                  onImageryLayerChange={setImageryLayerId}
                  onImageryDateChange={setImageryDate}
                  onImageryOpacityChange={setImageryOpacity}
                  onParameterLayerChange={setParameterLayerId}
                />
              )}

              <CandidateList
                results={results}
                totalCandidates={data.totalCandidates}
                selectedId={selectedResult?.candidate.id ?? null}
                onSelect={setSelectedId}
                isUpdating={isUpdating}
              />
            </div>
          )}

          {/* Analysis Panels */}
          {selectedResult && (
            <>
              {(activeTab === "workspace" || activeTab === "all") && (
                <TerrainComparisonWorkspace
                  target={data.target}
                  purpose={data.purpose}
                  result={selectedResult}
                  allCandidates={results}
                  onSelectCandidate={setSelectedId}
                  isUpdating={isUpdating}
                />
              )}

              {(activeTab === "elevation" || activeTab === "all") && (
                <ElevationProfilePanel
                  target={data.target}
                  candidate={selectedResult.candidate}
                  allCandidates={results.map((r) => r.candidate)}
                  onSelectCandidate={setSelectedId}
                  isUpdating={isUpdating}
                />
              )}

              {(activeTab === "evidence" || activeTab === "all") && (
                <ScientificEvidenceExplorer
                  currentTarget={data.target}
                  currentCandidate={selectedResult.candidate}
                  allTargets={filteredTargets}
                  allCandidates={results.map((r) => r.candidate)}
                  isUpdating={isUpdating}
                />
              )}

              {(activeTab === "telemetry" || activeTab === "all") && (
                <ComparisonPanel
                  target={data.target}
                  purpose={data.purpose}
                  result={selectedResult}
                  isUpdating={isUpdating}
                />
              )}
            </>
          )}

          {/* Collapsible Target Profile & Dataset Notice */}
          {selectedTarget && (
            <DsDisclosureRow
              title="Target profile & dataset notice"
              summary={selectedTarget.name}
            >
              <div className="space-y-4">
                <p className="text-xs text-[var(--tt-dark-ink-muted)]">
                  {data.dataset.name} (v{data.dataset.version}) &mdash; {data.dataset.notice}
                </p>
                <div className="rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] p-4">
                  <TargetProfile target={selectedTarget} />
                </div>
              </div>
            </DsDisclosureRow>
          )}
        </>
      )}
    </div>
  )
}
