"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import type {
  DiscoveryAtlasEntry,
  GeographicBoundingBox,
  PlanetaryBody,
  PlanetaryTarget,
} from "@/lib/terratwin/types"
import type { ResearchAssessmentRecord } from "@/lib/terratwin/types/research-workflow"
import { useCloudResearchWorkspace } from "@/hooks/use-cloud-research-workspace"
import {
  CONFIGURABLE_MISSION_PROFILES,
  ROVER_TESTING_PROFILE,
} from "@/lib/terratwin/config/comparison-config"
import {
  computeBboxAroundPoint,
  validateScannerBoundingBox,
  type ScannerConfigDraft,
} from "@/lib/terratwin/scanner/scanner-utils"
import { useDiscoveryScanner } from "@/hooks/use-discovery-scanner"
import { DiscoveryConfigPanel } from "./discovery-config-panel"
import { DiscoveryEarthMap } from "./discovery-earth-map"
import type {
  MapActionCommand,
  MapActionInput,
} from "./discovery-earth-map-canvas"
import { DiscoveryResultsPanel } from "./discovery-results-panel"
import { DiscoveryCandidateDetails } from "./discovery-candidate-details"
import { DiscoveryMethodologyPanel } from "./discovery-methodology-panel"
import {
  Compass,
  Map as MapIcon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Radar,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscoveryScannerWorkspaceProps {
  targets: PlanetaryTarget[]
  atlasEntries: DiscoveryAtlasEntry[]
}

function bboxToManualInputs(bbox: GeographicBoundingBox | null) {
  if (!bbox) {
    return { minLat: "", minLon: "", maxLat: "", maxLon: "" }
  }
  return {
    minLat: bbox[0].toFixed(2),
    minLon: bbox[1].toFixed(2),
    maxLat: bbox[2].toFixed(2),
    maxLon: bbox[3].toFixed(2),
  }
}

export function DiscoveryScannerWorkspace({
  targets,
  atlasEntries,
}: DiscoveryScannerWorkspaceProps) {
  const defaultMarsTarget =
    targets.find((t) => t.body === "mars" && t.isVerified) ??
    targets.find((t) => t.body === "mars") ??
    targets[0]

  const [body, setBody] = useState<PlanetaryBody>(defaultMarsTarget?.body ?? "mars")
  const [draft, setDraft] = useState<ScannerConfigDraft>({
    targetId: defaultMarsTarget?.id ?? "",
    missionProfile: "rover-testing",
    boundingBox: null,
    gridSpacingDeg: 0.5,
    maxCells: 16,
    maxCandidates: 10,
    advisoryCategory: "",
  })

  const [manualInputs, setManualInputs] = useState<{
    minLat: string
    minLon: string
    maxLat: string
    maxLon: string
  }>(bboxToManualInputs(null))
  const [regionValidationError, setRegionValidationError] = useState<string | null>(null)
  const [isDrawMode, setIsDrawMode] = useState(false)

  // Responsive layout & panel collapse controls
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showJudgeBar, setShowJudgeBar] = useState(true)
  const [activeJudgeScenario, setActiveJudgeScenario] = useState<string | null>(null)
  const [mobileSection, setMobileSection] = useState<"config" | "map" | "results">("map")
  const [rightTab, setRightTab] = useState<"live" | "atlas">("live")

  // Synchronized map & list selections
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [selectedAtlasId, setSelectedAtlasId] = useState<string | null>(null)
  const [compareCandidateIds, setCompareCandidateIds] = useState<string[]>([])

  const cloudWorkspace = useCloudResearchWorkspace()
  const { researchRecords } = cloudWorkspace

  const handleUpsertResearchRecord = useCallback(
    (record: ResearchAssessmentRecord) => {
      void cloudWorkspace.upsertResearchRecord(record)
    },
    [cloudWorkspace]
  )

  const handleDeleteResearchRecord = useCallback(
    (contextKey: string) => {
      void cloudWorkspace.deleteResearchRecord(contextKey)
    },
    [cloudWorkspace]
  )

  // Imperative map commands & mobile scroll anchor
  const [mapCommand, setMapCommand] = useState<MapActionCommand | null>(null)
  const cmdSeqRef = useRef(0)
  const workspaceTopRef = useRef<HTMLDivElement>(null)

  const scanner = useDiscoveryScanner()

  const issueMapCommand = useCallback((cmd: MapActionInput) => {
    cmdSeqRef.current += 1
    setMapCommand({ ...cmd, seq: cmdSeqRef.current })
  }, [])

  // Handle body switching cleanly while preserving valid scan geometry
  const handleBodyChange = useCallback(
    (nextBody: PlanetaryBody) => {
      setBody(nextBody)
      const matching = targets.filter((t) => t.body === nextBody)
      const preferred = matching.find((t) => t.isVerified) ?? matching[0]
      if (preferred) {
        setDraft((prev) => ({ ...prev, targetId: preferred.id }))
      }
    },
    [targets]
  )

  const handleTargetChange = useCallback((nextTargetId: string) => {
    setDraft((prev) => ({ ...prev, targetId: nextTargetId }))
  }, [])

  const handleMissionProfileChange = useCallback((nextProfileId: string) => {
    setDraft((prev) => ({ ...prev, missionProfile: nextProfileId }))
  }, [])

  // Manual WGS84 input handler synchronized bidirectionally with map rectangle
  const handleManualCoordChange = useCallback(
    (field: "minLat" | "minLon" | "maxLat" | "maxLon", value: string) => {
      setManualInputs((prev) => {
        const next = { ...prev, [field]: value }
        if (
          next.minLat === "" ||
          next.minLon === "" ||
          next.maxLat === "" ||
          next.maxLon === ""
        ) {
          setDraft((d) => ({ ...d, boundingBox: null }))
          setRegionValidationError(null)
          return next
        }

        const parsed: GeographicBoundingBox = [
          Number(next.minLat),
          Number(next.minLon),
          Number(next.maxLat),
          Number(next.maxLon),
        ]
        const check = validateScannerBoundingBox(parsed)
        if (!check.isValid) {
          setDraft((d) => ({ ...d, boundingBox: null }))
          setRegionValidationError(check.error)
        } else {
          setDraft((d) => ({ ...d, boundingBox: parsed }))
          setRegionValidationError(null)
        }
        return next
      })
    },
    []
  )

  // Map rectangle draw / viewport capture callback (never silently mutates invalid regions)
  const handleRegionDrawn = useCallback(
    (bbox: GeographicBoundingBox | null, validationError: string | null) => {
      if (validationError || !bbox) {
        setRegionValidationError(
          validationError ?? "Invalid map selection. Adjust region bounds and try again."
        )
        return
      }
      setRegionValidationError(null)
      setDraft((prev) => ({ ...prev, boundingBox: bbox }))
      setManualInputs(bboxToManualInputs(bbox))
    },
    []
  )

  const handleClearRegion = useCallback(() => {
    setIsDrawMode(false)
    setRegionValidationError(null)
    setDraft((prev) => ({ ...prev, boundingBox: null }))
    setManualInputs(bboxToManualInputs(null))
  }, [])

  const handleApplyPresetRegion = useCallback(
    (bbox: GeographicBoundingBox, focusZoom = 8) => {
      const check = validateScannerBoundingBox(bbox)
      if (!check.isValid) {
        setRegionValidationError(check.error)
        return
      }
      setRegionValidationError(null)
      setIsDrawMode(false)
      setDraft((prev) => ({ ...prev, boundingBox: bbox }))
      setManualInputs(bboxToManualInputs(bbox))
      const centerLat = (bbox[0] + bbox[2]) / 2
      const centerLon = (bbox[1] + bbox[3]) / 2
      issueMapCommand({ type: "focus-point", lat: centerLat, lon: centerLon, zoom: focusZoom })
    },
    [issueMapCommand]
  )

  const handleLaunchScan = useCallback(async () => {
    setIsDrawMode(false)
    setCompareCandidateIds([])
    const ok = await scanner.launchScan(draft)
    if (ok) {
      setRightTab("live")
      setSelectedAtlasId(null)
      setShowRightPanel(true)
      setMobileSection("results")
      if (typeof window !== "undefined" && window.innerWidth < 1280) {
        requestAnimationFrame(() => {
          workspaceTopRef.current?.scrollIntoView({ block: "start" })
        })
      }
    }
  }, [draft, scanner])

  const liveCandidates = useMemo(
    () => scanner.response?.candidates ?? [],
    [scanner.response]
  )

  const effectiveSelectedCandidateId = useMemo(() => {
    if (selectedCandidateId && liveCandidates.some((c) => c.candidate.id === selectedCandidateId)) {
      return selectedCandidateId
    }
    return liveCandidates[0]?.candidate.id ?? null
  }, [liveCandidates, selectedCandidateId])

  const selectedCandidate = useMemo(
    () =>
      selectedAtlasId
        ? null
        : liveCandidates.find((c) => c.candidate.id === effectiveSelectedCandidateId) ?? null,
    [liveCandidates, effectiveSelectedCandidateId, selectedAtlasId]
  )

  const selectedAtlasSite = useMemo(
    () => atlasEntries.find((a) => a.id === selectedAtlasId) ?? null,
    [atlasEntries, selectedAtlasId]
  )

  const compareCandidates = useMemo(
    () =>
      compareCandidateIds
        .map((id) => liveCandidates.find((c) => c.candidate.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [compareCandidateIds, liveCandidates]
  )

  const handleSelectCandidate = useCallback((candidateId: string) => {
    setSelectedAtlasId(null)
    setSelectedCandidateId(candidateId)
    setRightTab("live")
  }, [])

  const handleSelectAtlasSite = useCallback((atlasId: string) => {
    setSelectedCandidateId(null)
    setSelectedAtlasId(atlasId)
    setRightTab("atlas")
  }, [])

  const handleFocusAtlasOnMap = useCallback(
    (site: DiscoveryAtlasEntry) => {
      handleSelectAtlasSite(site.id)
      issueMapCommand({ type: "focus-point", lat: site.latitude, lon: site.longitude, zoom: 7 })
      setMobileSection("map")
    },
    [handleSelectAtlasSite, issueMapCommand]
  )

  const handleScanAroundAtlasSite = useCallback(
    (site: DiscoveryAtlasEntry) => {
      const seedBox = computeBboxAroundPoint(site.latitude, site.longitude, 1.5)
      handleApplyPresetRegion(seedBox, 8)
      setSelectedAtlasId(site.id)
      setShowLeftPanel(true)
      setMobileSection("config")
    },
    [handleApplyPresetRegion]
  )

  const handleLoadJudgeDemoScenario = useCallback(
    (scenarioId: "demo-a-geo" | "demo-a-rover" | "demo-b-lunar" | "demo-c-atlas") => {
      setActiveJudgeScenario(scenarioId)
      setIsDrawMode(false)
      setRegionValidationError(null)
      setShowLeftPanel(true)
      setShowRightPanel(true)

      const jezeroTarget =
        targets.find((t) => t.name.toLowerCase().includes("jezero")) ??
        targets.find((t) => t.body === "mars" && t.isVerified) ??
        targets[0]
      const shackletonTarget =
        targets.find((t) => t.name.toLowerCase().includes("shackleton")) ??
        targets.find((t) => t.body === "moon" && t.isVerified) ??
        targets.find((t) => t.body === "moon") ??
        targets[0]

      if (scenarioId === "demo-a-geo" || scenarioId === "demo-a-rover") {
        const saldaBbox: GeographicBoundingBox = [37.1, 29.2, 37.9, 30.1]
        const profile = scenarioId === "demo-a-geo" ? "geological-research" : "rover-testing"
        setBody("mars")
        setDraft((prev) => ({
          ...prev,
          targetId: jezeroTarget?.id ?? prev.targetId,
          missionProfile: profile,
          boundingBox: saldaBbox,
          gridSpacingDeg: 0.5,
          maxCells: 4,
          maxCandidates: 10,
          advisoryCategory: "salt-flats-evaporites",
        }))
        setManualInputs(bboxToManualInputs(saldaBbox))
        setSelectedAtlasId(null)
        setRightTab("live")
        setMobileSection("config")
        issueMapCommand({ type: "focus-point", lat: 37.5, lon: 29.65, zoom: 8 })
        return
      }

      if (scenarioId === "demo-b-lunar") {
        setBody("moon")
        setDraft((prev) => ({
          ...prev,
          targetId: shackletonTarget?.id ?? prev.targetId,
          missionProfile: "lunar-base-construction",
        }))
        const mcmurdo =
          atlasEntries.find(
            (a) =>
              a.id.toLowerCase().includes("mcmurdo") ||
              a.name.toLowerCase().includes("mcmurdo")
          ) ?? atlasEntries[0]
        if (mcmurdo) {
          setSelectedCandidateId(null)
          setSelectedAtlasId(mcmurdo.id)
          setRightTab("atlas")
          issueMapCommand({
            type: "focus-point",
            lat: mcmurdo.latitude,
            lon: mcmurdo.longitude,
            zoom: 6,
          })
        }
        setMobileSection("results")
        return
      }

      if (scenarioId === "demo-c-atlas") {
        setBody("mars")
        setDraft((prev) => ({
          ...prev,
          targetId: jezeroTarget?.id ?? prev.targetId,
          missionProfile: "geological-research",
        }))
        const tibetan =
          atlasEntries.find(
            (a) =>
              a.id.toLowerCase().includes("tibetan") ||
              a.name.toLowerCase().includes("tibetan")
          ) ?? atlasEntries[0]
        if (tibetan) {
          setSelectedCandidateId(null)
          setSelectedAtlasId(tibetan.id)
          setRightTab("atlas")
        }
        issueMapCommand({ type: "reset-view" })
        setMobileSection("results")
      }
    },
    [atlasEntries, issueMapCommand, targets]
  )

  const handleToggleCompareCandidate = useCallback((candidateId: string) => {
    setCompareCandidateIds((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId)
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), candidateId]
      }
      return [...prev, candidateId]
    })
  }, [])

  const isStaleTargetOrProfile = Boolean(
    scanner.response &&
      (scanner.resultTargetId !== draft.targetId ||
        scanner.resultMissionProfileId !== draft.missionProfile)
  )

  const detailTarget =
    scanner.response?.target ??
    targets.find((t) => t.id === draft.targetId) ??
    null

  const detailMissionLabel =
    scanner.response?.missionProfile.label ?? draft.missionProfile

  return (
    <div className="flex flex-col gap-5">
      {/* Top Workstation Mode & Panel Toggle Strip */}
      <div
        ref={workspaceTopRef}
        className="scroll-mt-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 font-mono text-xs backdrop-blur-md"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded border border-cyan-500/30 bg-cyan-950/50 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
            <Compass className="size-3" aria-hidden="true" />
            <span>BOUNDED REGIONAL SCREENING + CURATED ATLAS</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Live Open-Meteo DEM · NASA POWER Climatology · Macrostrat Geology
          </span>
        </div>

        {/* Desktop Panel Collapse Controls */}
        <div className="hidden xl:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLeftPanel((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer"
          >
            {showLeftPanel ? (
              <>
                <PanelLeftClose className="size-3.5" aria-hidden="true" />
                <span>Hide Config</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="size-3.5" aria-hidden="true" />
                <span>Show Config</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowRightPanel((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer"
          >
            {showRightPanel ? (
              <>
                <PanelRightClose className="size-3.5" aria-hidden="true" />
                <span>Hide Results</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="size-3.5" aria-hidden="true" />
                <span>Show Results</span>
              </>
            )}
          </button>
        </div>

        {/* Tablet & Mobile Section Switcher */}
        <div
          className="flex xl:hidden w-full sm:w-auto items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1"
          role="tablist"
          aria-label="Mobile workspace view"
        >
          {[
            { id: "config" as const, label: "1. Config", icon: SlidersHorizontal },
            { id: "map" as const, label: "2. Map", icon: MapIcon },
            { id: "results" as const, label: "3. Results", icon: Radar },
          ].map((tab) => {
            const Icon = tab.icon
            const active = mobileSection === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileSection(tab.id)}
                className={cn(
                  "flex-1 sm:flex-initial inline-flex min-h-8 items-center justify-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer",
                  active
                    ? "bg-cyan-950/80 text-cyan-200 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* THREE-REGION DESKTOP WORKSTATION / RESPONSIVE MOBILE-TABLET LAYOUT */}
      <div
        className={cn(
          "grid gap-4 items-start",
          showLeftPanel && showRightPanel
            ? "xl:grid-cols-[340px_minmax(0,1fr)_390px]"
            : showLeftPanel
            ? "xl:grid-cols-[340px_minmax(0,1fr)]"
            : showRightPanel
            ? "xl:grid-cols-[minmax(0,1fr)_390px]"
            : "xl:grid-cols-1"
        )}
      >
        {/* LEFT PANEL — Mission & Scan Configuration */}
        {showLeftPanel && (
          <div className={cn(mobileSection === "config" ? "block" : "hidden xl:block")}>
            <DiscoveryConfigPanel
              targets={targets}
              body={body}
              draft={draft}
              manualInputs={manualInputs}
              regionValidationError={regionValidationError}
              isDrawMode={isDrawMode}
              isBusy={scanner.isBusy}
              lifecycle={scanner.lifecycle}
              statusMessage={scanner.statusMessage}
              errorRetryAfterSec={scanner.error?.retryAfterSec ?? null}
              onBodyChange={handleBodyChange}
              onTargetChange={handleTargetChange}
              onMissionProfileChange={handleMissionProfileChange}
              onManualCoordChange={handleManualCoordChange}
              onToggleDrawMode={() => {
                setIsDrawMode((prev) => !prev)
                setMobileSection("map")
              }}
              onCaptureViewport={() => {
                issueMapCommand({ type: "capture-viewport" })
                setMobileSection("map")
              }}
              onClearRegion={handleClearRegion}
              onApplyPresetRegion={(bbox, zoom) => {
                handleApplyPresetRegion(bbox, zoom)
                setMobileSection("map")
              }}
              onGridSpacingChange={(gridSpacingDeg) =>
                setDraft((prev) => ({ ...prev, gridSpacingDeg }))
              }
              onMaxCellsChange={(maxCells) =>
                setDraft((prev) => ({ ...prev, maxCells }))
              }
              onMaxCandidatesChange={(maxCandidates) =>
                setDraft((prev) => ({ ...prev, maxCandidates }))
              }
              onCategoryChange={(advisoryCategory) =>
                setDraft((prev) => ({ ...prev, advisoryCategory }))
              }
              onLaunchScan={handleLaunchScan}
              onCancelScan={scanner.cancelScan}
            />
          </div>
        )}

        {/* CENTER PANEL — Interactive Earth Map */}
        <div className={cn("min-w-0", mobileSection === "map" ? "block" : "hidden xl:block")}>
          <DiscoveryEarthMap
            boundingBox={draft.boundingBox}
            candidates={liveCandidates}
            atlasEntries={atlasEntries}
            selectedCandidateId={effectiveSelectedCandidateId}
            selectedAtlasId={selectedAtlasId}
            isDrawMode={isDrawMode}
            mapCommand={mapCommand}
            onSelectCandidate={handleSelectCandidate}
            onSelectAtlasSite={handleSelectAtlasSite}
            onRegionDrawn={handleRegionDrawn}
            onDrawModeChange={setIsDrawMode}
            onFitRegion={() => issueMapCommand({ type: "fit-region" })}
            onFitResults={() => issueMapCommand({ type: "fit-results" })}
            onCaptureViewport={() => issueMapCommand({ type: "capture-viewport" })}
            onResetMapView={() => issueMapCommand({ type: "reset-view" })}
          />
        </div>

        {/* RIGHT PANEL — Discovery Intelligence */}
        {showRightPanel && (
          <div className={cn(mobileSection === "results" ? "block" : "hidden xl:block")}>
            <DiscoveryResultsPanel
              activeTab={rightTab}
              onTabChange={setRightTab}
              response={scanner.response}
              activeTargetId={draft.targetId}
              activeMissionProfileId={draft.missionProfile}
              isStaleTargetOrProfile={isStaleTargetOrProfile}
              isBusy={scanner.isBusy}
              selectedCandidateId={effectiveSelectedCandidateId}
              compareCandidateIds={compareCandidateIds}
              onSelectCandidate={handleSelectCandidate}
              onToggleCompareCandidate={handleToggleCompareCandidate}
              atlasEntries={atlasEntries}
              selectedAtlasId={selectedAtlasId}
              onSelectAtlasSite={handleSelectAtlasSite}
              onFocusAtlasOnMap={handleFocusAtlasOnMap}
              onScanAroundAtlasSite={handleScanAroundAtlasSite}
            />
          </div>
        )}
      </div>

      {/* SCIENTIFIC CANDIDATE DETAIL, PROVENANCE MATRIX & COMPARISON STRIP */}
      <DiscoveryCandidateDetails
        selectedCandidate={selectedCandidate}
        selectedAtlasSite={selectedAtlasSite}
        compareCandidates={compareCandidates}
        target={detailTarget}
        missionProfileLabel={detailMissionLabel}
        allEvaluatedCandidates={liveCandidates}
        liveResponse={scanner.response}
        liveMissionProfile={scanner.response?.missionProfile ?? null}
        activeTarget={targets.find((t) => t.id === draft.targetId) ?? null}
        activeMissionProfile={
          CONFIGURABLE_MISSION_PROFILES.find((p) => p.id === draft.missionProfile) ??
          ROVER_TESTING_PROFILE
        }
        isStaleContext={isStaleTargetOrProfile}
        researchRecords={researchRecords}
        cloudWorkspace={cloudWorkspace}
        onUpsertResearchRecord={handleUpsertResearchRecord}
        onDeleteResearchRecord={handleDeleteResearchRecord}
        onRemoveCompareCandidate={(id) =>
          setCompareCandidateIds((prev) => prev.filter((item) => item !== id))
        }
        onFocusOnMap={(lat, lon) => {
          issueMapCommand({ type: "focus-point", lat, lon, zoom: 7 })
          setMobileSection("map")
        }}
        onScanAroundAtlasSite={handleScanAroundAtlasSite}
      />

      {/* Dismissible Judge Demo Scenarios Quick-Load Bar */}
      {showJudgeBar ? (
        <div
          data-testid="judge-demo-quickload-bar"
          className="rounded-xl border border-cyan-500/30 bg-slate-900/75 px-3.5 py-2.5 backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-cyan-400/40 bg-cyan-950/70 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-cyan-200 uppercase">
                <Sparkles className="size-3 text-cyan-400" aria-hidden="true" />
                <span>Judge Demo Scenarios (Quick Load)</span>
              </span>
              <span className="text-[11px] text-slate-300">
                Pre-loads real planetary targets, mission profiles, and bounding boxes — never fabricates data:
              </span>
            </div>
            <button
              type="button"
              data-testid="dismiss-judge-demo-bar"
              onClick={() => setShowJudgeBar(false)}
              className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-400 hover:border-slate-500 hover:text-white cursor-pointer"
              aria-label="Hide Judge Demo Scenarios bar"
            >
              <X className="size-3" aria-hidden="true" />
              <span>Dismiss Bar</span>
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                id: "demo-a-geo" as const,
                testId: "judge-demo-preset-a-geo",
                buttonLabel: "Load Scenario A1",
                title: "Jezero · Lake Salda (Geo Gate)",
                subtitle: "2×2 live scan → 15% coverage (<40% gate withholds score honestly)",
              },
              {
                id: "demo-a-rover" as const,
                testId: "judge-demo-preset-a-rover",
                buttonLabel: "Load Scenario A2",
                title: "Jezero · Lake Salda (Mobility)",
                subtitle: "Same 2×2 bbox → 45% coverage (≥40% gate computes 65.0% exploratory)",
              },
              {
                id: "demo-b-lunar" as const,
                testId: "judge-demo-preset-b",
                buttonLabel: "Load Scenario B",
                title: "Shackleton · South Pole ISRU",
                subtitle: "Selects McMurdo Dry Valleys (66.5% · 100% cov) in 31-Site Atlas",
              },
              {
                id: "demo-c-atlas" as const,
                testId: "judge-demo-preset-c",
                buttonLabel: "Load Scenario C",
                title: "31-Site Curated Benchmark",
                subtitle: "Selects Tibetan Plateau — Qinghai (92.3% vs. Jezero Delta)",
              },
            ].map((item) => {
              const isSelected = activeJudgeScenario === item.id
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col justify-between rounded-lg border px-3 py-2 text-left transition",
                    isSelected
                      ? "border-cyan-400/70 bg-cyan-950/60 text-white shadow-sm"
                      : "border-slate-800 bg-slate-950/80 text-slate-200"
                  )}
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{item.title}</div>
                    <div className="mt-0.5 text-[11px] leading-snug text-slate-400">
                      {item.subtitle}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid={item.testId}
                    onClick={() => handleLoadJudgeDemoScenario(item.id)}
                    className="mt-2 inline-flex w-fit items-center rounded border border-cyan-500/40 bg-cyan-950/80 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-cyan-200 uppercase hover:border-cyan-400 hover:text-white cursor-pointer"
                  >
                    {item.buttonLabel}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            data-testid="restore-judge-demo-bar"
            onClick={() => setShowJudgeBar(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-slate-900/70 px-2.5 py-1 font-mono text-[11px] text-cyan-300 hover:border-cyan-400/60 hover:text-white cursor-pointer"
          >
            <Sparkles className="size-3 text-cyan-400" aria-hidden="true" />
            <span>Restore Demo Bar</span>
          </button>
        </div>
      )}

      {/* COLLAPSIBLE SCIENTIFIC METHODOLOGY DISCLOSURE */}
      <DiscoveryMethodologyPanel />
    </div>
  )
}
