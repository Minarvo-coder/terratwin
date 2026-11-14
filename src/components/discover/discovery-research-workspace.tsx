"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { ConfigurableMissionProfile } from "@/lib/terratwin/config/comparison-config"
import type { UseCloudResearchWorkspaceReturn } from "@/hooks/use-cloud-research-workspace"
import { FEATURES } from "@/lib/terratwin/features"
import { formatCoverage } from "@/lib/terratwin/format"
import {
  buildAtlasCandidateIntelligence,
  buildLiveCandidateIntelligence,
} from "@/lib/terratwin/services/candidate-intelligence-service"
import {
  addUserResearchNote,
  appendAssessmentRevision,
  buildResearchContextKey,
  createResearchAssessmentRecord,
  mergeMissingProposedTasks,
  serializeResearchRecordJson,
  updateResearchTaskStatus,
  validateAndImportResearchRecord,
} from "@/lib/terratwin/services/research-snapshot-service"
import {
  generateCandidateSummaryCsv,
  generateProvenanceManifestCsv,
  generateResearchTasksCsv,
  generateScientificFeaturesCsv,
  sanitizeExportFilename,
} from "@/lib/terratwin/utils/csv-export"
import { generateScientificAssessmentPdf } from "@/lib/terratwin/utils/pdf-report-generator"
import type { DiscoveryCandidateResult, RegionalDiscoveryResponse } from "@/lib/terratwin/types/discovery"
import {
  RESEARCH_CLOUD_STORAGE_DISCLOSURE,
  RESEARCH_STORAGE_DISCLOSURE,
  RESEARCH_TASK_STATUS_LABELS,
  RESEARCH_TASK_STATUS_ORDER,
  RESEARCH_WORKFLOW_DISCLAIMER,
  type ResearchAssessmentRecord,
  type ResearchExportFormat,
  type ResearchTaskStatus,
} from "@/lib/terratwin/types/research-workflow"
import type {
  DiscoveryAtlasEntry,
  FeatureKey,
  MissionPurposeDefinition,
  PlanetaryTarget,
} from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  History,
  NotebookPen,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"

interface DiscoveryResearchWorkspaceProps {
  selectedCandidate: DiscoveryCandidateResult | null
  selectedAtlasSite: DiscoveryAtlasEntry | null
  allEvaluatedCandidates?: DiscoveryCandidateResult[]
  liveResponse: RegionalDiscoveryResponse | null
  liveTarget: PlanetaryTarget | null
  liveMissionProfile?: ConfigurableMissionProfile | MissionPurposeDefinition | null
  activeTarget: PlanetaryTarget | null
  activeMissionProfile: ConfigurableMissionProfile
  isStaleContext?: boolean
  researchRecords: Record<string, ResearchAssessmentRecord>
  cloudWorkspace?: UseCloudResearchWorkspaceReturn
  onUpsertResearchRecord: (record: ResearchAssessmentRecord) => void
  onDeleteResearchRecord: (contextKey: string) => void
}

type WorkspaceTabId = "assessment-exports" | "tasks" | "notes" | "sources-history"

function triggerBrowserBlobDownload(filename: string, data: Uint8Array | string, mimeType: string) {
  let blob: Blob
  if (typeof data === "string") {
    blob = new Blob([data], { type: mimeType })
  } else {
    const ab = new ArrayBuffer(data.byteLength)
    new Uint8Array(ab).set(data)
    blob = new Blob([ab], { type: mimeType })
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1500)
}

export function DiscoveryResearchWorkspace({
  selectedCandidate,
  selectedAtlasSite,
  allEvaluatedCandidates = [],
  liveResponse,
  liveTarget,
  liveMissionProfile,
  activeTarget,
  activeMissionProfile,
  isStaleContext = false,
  researchRecords,
  cloudWorkspace,
  onUpsertResearchRecord,
  onDeleteResearchRecord,
}: DiscoveryResearchWorkspaceProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("assessment-exports")
  const [selectedRevisionNumber, setSelectedRevisionNumber] = useState<number | null>(null)

  const [exportStatusMsg, setExportStatusMsg] = useState<string | null>(null)
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null)
  const [activeExportKind, setActiveExportKind] = useState<ResearchExportFormat | null>(null)

  // User Note Form State
  const [noteTitle, setNoteTitle] = useState("")
  const [noteBody, setNoteBody] = useState("")
  const [noteFeature, setNoteFeature] = useState<FeatureKey | "general">("general")
  const [noteUrl, setNoteUrl] = useState("")
  const [noteError, setNoteError] = useState<string | null>(null)

  // Task inline edit draft state
  const [taskOwnerDrafts, setTaskOwnerDrafts] = useState<Record<string, string>>({})
  const [taskNoteDrafts, setTaskNoteDrafts] = useState<Record<string, string>>({})

  const importInputRef = useRef<HTMLInputElement | null>(null)

  const intelligence = useMemo(() => {
    if (selectedCandidate && liveTarget) {
      const scoredMission = liveMissionProfile ?? activeMissionProfile
      return buildLiveCandidateIntelligence({
        candidateResult: selectedCandidate,
        target: liveTarget,
        missionProfile: scoredMission,
        allEvaluatedCandidates,
      })
    }
    if (selectedAtlasSite && activeTarget) {
      return buildAtlasCandidateIntelligence({
        atlasSite: selectedAtlasSite,
        target: activeTarget,
        missionProfile: activeMissionProfile,
      })
    }
    return null
  }, [
    selectedCandidate,
    liveTarget,
    liveMissionProfile,
    allEvaluatedCandidates,
    selectedAtlasSite,
    activeTarget,
    activeMissionProfile,
  ])

  const evaluationTarget = selectedCandidate ? liveTarget : activeTarget
  const evaluationMission = selectedCandidate
    ? (liveMissionProfile ?? activeMissionProfile)
    : activeMissionProfile

  const currentContextKey = useMemo(() => {
    if (!intelligence || !evaluationTarget) return null
    return buildResearchContextKey(
      intelligence.candidateId,
      evaluationTarget.id,
      evaluationMission.id
    )
  }, [intelligence, evaluationTarget, evaluationMission])

  const activeRecord = currentContextKey ? researchRecords[currentContextKey] ?? null : null

  const displayedRecordForExport = useMemo((): ResearchAssessmentRecord | null => {
    if (!activeRecord) return null
    if (
      selectedRevisionNumber !== null &&
      selectedRevisionNumber !== activeRecord.snapshot.revisionNumber
    ) {
      const rev = activeRecord.revisionHistory.find(
        (r) => r.revisionNumber === selectedRevisionNumber
      )
      if (rev) {
        return {
          ...activeRecord,
          snapshot: rev.snapshot,
        }
      }
    }
    return activeRecord
  }, [activeRecord, selectedRevisionNumber])

  if (!intelligence || !evaluationTarget || !currentContextKey) {
    return null
  }

  const handleCreateSnapshot = () => {
    setExportErrorMsg(null)
    setExportStatusMsg(null)
    if (!activeRecord) {
      const created = createResearchAssessmentRecord({
        candidateResult: selectedCandidate,
        atlasSite: selectedAtlasSite,
        target: evaluationTarget,
        missionProfile: evaluationMission,
        intelligence,
        providerTelemetry: selectedCandidate ? (liveResponse?.providerStatuses ?? []) : [],
        searchMetadata: selectedCandidate ? liveResponse?.searchMetadata : undefined,
      })
      onUpsertResearchRecord(created)
      setSelectedRevisionNumber(null)
      setExportStatusMsg(
        `Created reproducible snapshot ${created.snapshot.snapshotId} with ${created.tasks.length} follow-up tasks.`
      )
      return
    }

    const updated = appendAssessmentRevision({
      record: activeRecord,
      candidateResult: selectedCandidate,
      atlasSite: selectedAtlasSite,
      target: evaluationTarget,
      missionProfile: evaluationMission,
      intelligence,
      providerTelemetry: selectedCandidate ? (liveResponse?.providerStatuses ?? []) : [],
      searchMetadata: selectedCandidate ? liveResponse?.searchMetadata : undefined,
    })
    onUpsertResearchRecord(updated)
    setSelectedRevisionNumber(null)
    setExportStatusMsg(
      `Recorded new immutable revision ${updated.snapshot.revisionLabel} (${updated.snapshot.snapshotId}); earlier evidence preserved.`
    )
  }

  const handleSyncFollowUpTasks = () => {
    if (!activeRecord) return
    const updated = mergeMissingProposedTasks(activeRecord, intelligence)
    onUpsertResearchRecord(updated)
    setExportStatusMsg("Synchronized follow-up tasks from Phase 6.5 intelligence recommendations.")
  }

  const handleTaskStatusChange = (taskId: string, nextStatus: ResearchTaskStatus) => {
    if (!activeRecord) return
    const updated = updateResearchTaskStatus(activeRecord, taskId, nextStatus, {
      owner: taskOwnerDrafts[taskId],
      notes: taskNoteDrafts[taskId],
    })
    onUpsertResearchRecord(updated)
  }

  const handleSaveTaskMeta = (taskId: string, currentStatus: ResearchTaskStatus) => {
    if (!activeRecord) return
    const updated = updateResearchTaskStatus(activeRecord, taskId, currentStatus, {
      owner: taskOwnerDrafts[taskId],
      notes: taskNoteDrafts[taskId],
    })
    onUpsertResearchRecord(updated)
    setExportStatusMsg("Updated workflow task owner/notes locally.")
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeRecord) return
    setNoteError(null)
    try {
      const updated = addUserResearchNote(activeRecord, {
        title: noteTitle,
        body: noteBody,
        relatedFeature: noteFeature,
        userSuppliedSourceUrl: noteUrl,
      })
      onUpsertResearchRecord(updated)
      setNoteTitle("")
      setNoteBody("")
      setNoteUrl("")
      setNoteFeature("general")
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to add research note.")
    }
  }

  const handleExport = (format: ResearchExportFormat) => {
    if (activeExportKind) return
    const rec = displayedRecordForExport
    if (!rec) {
      setExportErrorMsg("Create an assessment snapshot before exporting reports.")
      return
    }
    setExportErrorMsg(null)
    setExportStatusMsg(`Generating ${format.toUpperCase()} export...`)
    setActiveExportKind(format)

    try {
      const s = rec.snapshot
      const base = `TerraTwin_${s.target.body}_${s.candidateId}_${s.missionProfileId}_r${s.revisionNumber}`
      let filename = ""

      if (format === "pdf") {
        filename = sanitizeExportFilename(`${base}_Assessment`, "pdf")
        const pdfBytes = generateScientificAssessmentPdf(rec)
        triggerBrowserBlobDownload(filename, pdfBytes, "application/pdf")
      } else if (format === "summary-csv") {
        filename = sanitizeExportFilename(`${base}_Summary`, "csv")
        const csv = generateCandidateSummaryCsv(rec)
        triggerBrowserBlobDownload(filename, csv, "text/csv;charset=utf-8")
      } else if (format === "features-csv") {
        filename = sanitizeExportFilename(`${base}_Features_Provenance`, "csv")
        const csv = generateScientificFeaturesCsv(rec)
        triggerBrowserBlobDownload(filename, csv, "text/csv;charset=utf-8")
      } else if (format === "tasks-csv") {
        filename = sanitizeExportFilename(`${base}_Research_Tasks`, "csv")
        const csv = generateResearchTasksCsv(rec)
        triggerBrowserBlobDownload(filename, csv, "text/csv;charset=utf-8")
      } else if (format === "provenance-csv") {
        filename = sanitizeExportFilename(`${base}_Sources_Manifest`, "csv")
        const csv = generateProvenanceManifestCsv(rec)
        triggerBrowserBlobDownload(filename, csv, "text/csv;charset=utf-8")
      } else {
        filename = sanitizeExportFilename(`${base}_Snapshot`, "json")
        const json = serializeResearchRecordJson(rec)
        triggerBrowserBlobDownload(filename, json, "application/json;charset=utf-8")
      }

      setExportStatusMsg(`Download started: ${filename} (snapshot ${s.snapshotId})`)
    } catch (err) {
      setExportErrorMsg(
        err instanceof Error ? err.message : "Failed to generate export file cleanly."
      )
      setExportStatusMsg(null)
    } finally {
      setActiveExportKind(null)
    }
  }

  const handleImportSnapshotFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setExportErrorMsg(null)
    try {
      const text = await file.text()
      const imported = validateAndImportResearchRecord(text)
      onUpsertResearchRecord(imported)
      setSelectedRevisionNumber(null)
      setExportStatusMsg(
        `Imported snapshot ${imported.snapshot.snapshotId} for ${imported.candidateId} (browser-local workspace).`
      )
    } catch (err) {
      setExportErrorMsg(err instanceof Error ? err.message : "Snapshot JSON import failed.")
    }
  }

  const closedTasksCount = activeRecord
    ? activeRecord.tasks.filter((t) => t.status === "closed").length
    : 0
  const displaySnap = displayedRecordForExport?.snapshot ?? null

  return (
    <section
      aria-label="Research workflow and reproducible report workspace"
      data-research-candidate-id={intelligence.candidateId}
      className="mt-4 rounded-xl border border-indigo-500/30 bg-slate-950/90 shadow-lg"
    >
      {/* Collapsible Header */}
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-slate-900/60 cursor-pointer rounded-xl"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardList className="size-4 text-indigo-300 shrink-0" aria-hidden="true" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-200">
              Research Workspace
            </span>
            {activeRecord ? (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                Snapshot Active · {closedTasksCount}/{activeRecord.tasks.length} Tasks Closed ·{" "}
                {activeRecord.notes.length} Notes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                No Snapshot Saved Yet
              </span>
            )}
            {cloudWorkspace?.authUser ? (
              <span
                data-cloud-sync-state={cloudWorkspace.syncState}
                className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-950/50 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-200"
              >
                {cloudWorkspace.syncState === "offline-queued"
                  ? `Offline Queue (${cloudWorkspace.pendingQueueCount})`
                  : cloudWorkspace.syncState === "syncing"
                  ? "Syncing Cloud..."
                  : `Cloud Synced · ${cloudWorkspace.authUser.email}`}
              </span>
            ) : (
              <span
                data-cloud-sync-state="unauthenticated-local"
                className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-950/30 px-2 py-0.5 font-mono text-[10px] text-amber-200"
              >
                Browser-Local Mode
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-slate-400">
            Reproducible assessment snapshots · Follow-up validation tasks · Scientific PDF &amp; CSV exports
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/50 px-2.5 py-1 font-mono text-[11px] font-semibold text-indigo-200">
          <span>{isExpanded ? "Hide Research Workspace" : "Open Research Workspace"}</span>
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t border-slate-800/90 p-4">
          {/* Mandatory Disclaimers & Persistence Scope */}
          <div className="grid gap-2 lg:grid-cols-2">
            <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 font-mono text-[11px] text-slate-300">
              <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
              <span>{RESEARCH_WORKFLOW_DISCLAIMER}</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 font-mono text-[11px] text-slate-400">
              <FolderArchive className="size-4 shrink-0 text-indigo-300 mt-0.5" aria-hidden="true" />
              <span>
                {cloudWorkspace?.authUser
                  ? RESEARCH_CLOUD_STORAGE_DISCLOSURE
                  : RESEARCH_STORAGE_DISCLOSURE}
              </span>
            </div>
          </div>

          {/* Cloud Synchronization, LocalStorage Import & Offline Queue Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/30 bg-slate-900/80 px-3 py-2 font-mono text-[11px]">
            {cloudWorkspace?.authUser ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-slate-200">
                  <CheckCircle2 className="size-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>
                    Authenticated Crew Cloud Workspace:{" "}
                    <strong className="text-cyan-300">{cloudWorkspace.authUser.email}</strong>
                  </span>
                  <span className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {cloudWorkspace.backendMode === "supabase-postgres-rls"
                      ? "Supabase PostgreSQL RLS"
                      : "Server RLS Store (SQL Migration Ready)"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {cloudWorkspace.unsyncedLocalRecordsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void cloudWorkspace.importLocalRecordsToCloud()}
                      className="inline-flex items-center gap-1.5 rounded border border-amber-400/50 bg-amber-950/60 px-2.5 py-1 text-[10px] font-semibold text-amber-200 hover:border-amber-300 cursor-pointer"
                    >
                      <Upload className="size-3" aria-hidden="true" />
                      <span>
                        Import Local Browser Records to Cloud ({cloudWorkspace.unsyncedLocalRecordsCount})
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void cloudWorkspace.retryCloudSync()}
                    className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-950/50 px-2.5 py-1 text-[10px] text-cyan-200 hover:border-cyan-400 cursor-pointer"
                  >
                    <RefreshCw className="size-3" aria-hidden="true" />
                    <span>
                      {cloudWorkspace.pendingQueueCount > 0
                        ? `Retry Cloud Sync (${cloudWorkspace.pendingQueueCount} queued)`
                        : "Sync Cloud Workspace"}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-slate-300">
                  <span>
                    Currently in <strong>Browser-Local Mode</strong>. Sign in to sync snapshots, immutable revisions, tasks, and notes across sessions under strict Row Level Security.
                  </span>
                </div>
                <Link
                  href="/login?next=/discover"
                  className="inline-flex items-center gap-1.5 rounded border border-cyan-400/50 bg-cyan-950/60 px-2.5 py-1 text-[10px] font-semibold text-cyan-200 hover:border-cyan-300"
                >
                  <span>Sign In to Sync Cloud Workspace</span>
                </Link>
              </>
            )}
          </div>

          {cloudWorkspace?.lastSyncMessage && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 font-mono text-[11px] text-cyan-200"
            >
              <CheckCircle2 className="size-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
              <span>{cloudWorkspace.lastSyncMessage}</span>
            </div>
          )}
          {cloudWorkspace?.lastSyncError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 font-mono text-[11px] text-rose-200"
            >
              <AlertTriangle className="size-3.5 shrink-0 text-rose-400" aria-hidden="true" />
              <span>{cloudWorkspace.lastSyncError}</span>
            </div>
          )}

          {/* Stale Context Alert */}
          {selectedCandidate && isStaleContext && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-950/40 px-3 py-2.5 text-xs text-amber-100"
            >
              <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Context Changed — Prior Scan Assessment Preserved:</strong> Snapshots below belong to{" "}
                <span className="font-mono">
                  {intelligence.targetName} · {intelligence.missionProfileLabel}
                </span>
                . Historical evidence is never silently overwritten for{" "}
                <span className="font-mono">
                  {activeTarget?.name ?? "new target"} ({activeMissionProfile.label})
                </span>
                ; re-run the scan to assess the newly selected context.
              </span>
            </div>
          )}

          {/* Create / Snapshot Header Action Strip */}
          {!activeRecord ? (
            <div className="rounded-xl border border-dashed border-indigo-500/40 bg-indigo-950/20 p-4 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="font-mono font-bold text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="size-4 text-indigo-400" aria-hidden="true" />
                  <span>Initialize Traceable Research Assessment for {intelligence.candidateName}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Captures an immutable evidence snapshot ({intelligence.scoreDisplay}; coverage{" "}
                  {intelligence.coverage !== null ? formatCoverage(intelligence.coverage) : "curated archive"}),
                  auto-seeds {intelligence.followUpRecommendations.length} follow-up task(s) from Phase 6.5 intelligence,
                  and unlocks reproducible PDF, CSV, and JSON exports.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/50 bg-indigo-600/30 px-3.5 py-2 font-mono text-xs font-semibold text-white hover:bg-indigo-600/50 cursor-pointer"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Create Research Assessment Snapshot</span>
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200 hover:border-cyan-500/40 cursor-pointer"
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  <span>Import Snapshot JSON</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Workspace Sub-Navigation Tabs */}
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 p-1"
                role="tablist"
                aria-label="Research workspace sections"
              >
                {[
                  { id: "assessment-exports" as const, label: "Overview & Exports", icon: FileText },
                  {
                    id: "tasks" as const,
                    label: `Follow-Up Tasks (${activeRecord.tasks.length})`,
                    icon: ClipboardList,
                  },
                  {
                    id: "notes" as const,
                    label: `Research Notes (${activeRecord.notes.length})`,
                    icon: NotebookPen,
                  },
                  {
                    id: "sources-history" as const,
                    label: `Sources & History (${activeRecord.revisionHistory.length})`,
                    icon: History,
                  },
                ].map((tab) => {
                  const Icon = tab.icon
                  const selected = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-semibold transition cursor-pointer",
                        selected
                          ? "bg-indigo-950/90 text-indigo-200 border border-indigo-500/40"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Feedback Banners */}
              {exportStatusMsg && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 font-mono text-[11px] text-emerald-200"
                >
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>{exportStatusMsg}</span>
                </div>
              )}
              {exportErrorMsg && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 font-mono text-[11px] text-rose-200"
                >
                  <AlertTriangle className="size-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                  <span>{exportErrorMsg}</span>
                </div>
              )}

              {/* TAB 1: OVERVIEW & REPRODUCIBLE EXPORTS */}
              {activeTab === "assessment-exports" && displaySnap && (
                <div role="tabpanel" aria-label="Assessment overview and reproducible exports" className="space-y-4">
                  {/* Frozen Snapshot Telemetry Cards */}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 font-mono text-[11px]">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                      <span className="text-[9px] uppercase text-slate-400 block">Snapshot ID &amp; Rev</span>
                      <span className="font-bold text-indigo-200 break-all">{displaySnap.snapshotId}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{displaySnap.revisionLabel}</span>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                      <span className="text-[9px] uppercase text-slate-400 block">Frozen Score &amp; Coverage</span>
                      <span className="font-bold text-cyan-300 block">{displaySnap.scoreDisplay}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Coverage:{" "}
                        {displaySnap.coverage !== null ? formatCoverage(displaySnap.coverage) : "Curated Archive"}
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                      <span className="text-[9px] uppercase text-slate-400 block">Integrity Digest (Not Verification)</span>
                      <span className="font-bold text-slate-200 break-all">{displaySnap.contentDigest}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Schema v{displaySnap.schemaVersion}
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
                      <span className="text-[9px] uppercase text-slate-400 block">Verification State</span>
                      <span className="font-bold text-amber-200 block">
                        {displaySnap.isVerified ? "Catalog Verified Reference" : "Unverified Screening Lead"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Created {displaySnap.createdAt.slice(0, 19)}Z
                      </span>
                    </div>
                  </div>

                  {/* Snapshot Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCreateSnapshot}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/60 px-3 py-1.5 font-mono text-[11px] font-semibold text-indigo-200 hover:border-indigo-400 cursor-pointer"
                      >
                        <RefreshCw className="size-3.5" aria-hidden="true" />
                        <span>Capture New Revision Snapshot</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => importInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-[11px] text-slate-200 hover:border-cyan-500/40 cursor-pointer"
                      >
                        <Upload className="size-3.5" aria-hidden="true" />
                        <span>Import Snapshot JSON</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteResearchRecord(currentContextKey)
                        setSelectedRevisionNumber(null)
                        setExportStatusMsg(
                          cloudWorkspace?.authUser
                            ? "Deleted research record from your cloud workspace and local cache."
                            : "Cleared browser-local research record for this context."
                        )
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/30 px-2.5 py-1.5 font-mono text-[11px] text-rose-200 hover:border-rose-400 cursor-pointer"
                    >
                      <Trash2 className="size-3" aria-hidden="true" />
                      <span>{cloudWorkspace?.authUser ? "Delete Record" : "Clear Local Record"}</span>
                    </button>
                  </div>

                  {/* Export Center */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        Reproducible Report &amp; Data Exports (From Frozen Snapshot {displaySnap.snapshotId})
                      </h5>
                      <span className="font-mono text-[10px] text-slate-400">
                        Client-generated binary/UTF-8 files · Formula-injection hardened CSV
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <button
                        type="button"
                        disabled={activeExportKind !== null}
                        onClick={() => handleExport("pdf")}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-cyan-400/50 bg-cyan-600/25 px-3 py-2 font-mono text-xs font-semibold text-white hover:bg-cyan-600/40 disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="size-3.5 text-cyan-300" aria-hidden="true" />
                        <span>Download Scientific PDF</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeExportKind !== null}
                        onClick={() => handleExport("summary-csv")}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs font-semibold text-slate-200 hover:border-cyan-500/40 disabled:opacity-50 cursor-pointer"
                      >
                        <FileSpreadsheet className="size-3.5 text-emerald-300" aria-hidden="true" />
                        <span>Export Candidate CSV</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeExportKind !== null}
                        onClick={() => handleExport("features-csv")}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs font-semibold text-slate-200 hover:border-cyan-500/40 disabled:opacity-50 cursor-pointer"
                      >
                        <FileSpreadsheet className="size-3.5 text-cyan-300" aria-hidden="true" />
                        <span>Export Feature &amp; Provenance CSV</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeExportKind !== null}
                        onClick={() => handleExport("tasks-csv")}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs font-semibold text-slate-200 hover:border-cyan-500/40 disabled:opacity-50 cursor-pointer"
                      >
                        <FileSpreadsheet className="size-3.5 text-indigo-300" aria-hidden="true" />
                        <span>Export Research Tasks CSV</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeExportKind !== null}
                        onClick={() => handleExport("provenance-csv")}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs font-semibold text-slate-200 hover:border-cyan-500/40 disabled:opacity-50 cursor-pointer"
                      >
                        <BookOpen className="size-3.5 text-amber-300" aria-hidden="true" />
                        <span>Export Provenance Manifest CSV</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeExportKind !== null}
                        onClick={() => handleExport("snapshot-json")}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs font-semibold text-slate-200 hover:border-indigo-400 disabled:opacity-50 cursor-pointer"
                      >
                        <FolderArchive className="size-3.5 text-indigo-300" aria-hidden="true" />
                        <span>Export Snapshot JSON</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FOLLOW-UP RESEARCH TASKS */}
              {activeTab === "tasks" && (
                <div role="tabpanel" aria-label="Research follow-up tasks" className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                    <span className="font-mono text-[11px] text-slate-300">
                      Workflow statuses are operational tracking only — completing all tasks never upgrades{" "}
                      <span className="text-amber-300 font-semibold">isVerified</span>.
                    </span>
                    <button
                      type="button"
                      onClick={handleSyncFollowUpTasks}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/50 px-2.5 py-1 font-mono text-[11px] text-indigo-200 hover:border-indigo-400 cursor-pointer"
                    >
                      <RefreshCw className="size-3" aria-hidden="true" />
                      <span>Sync Proposed Tasks</span>
                    </button>
                  </div>

                  {activeRecord.tasks.length === 0 ? (
                    <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs text-slate-400">
                      No follow-up tasks present on this record.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeRecord.tasks.map((task) => {
                        const ownerVal = taskOwnerDrafts[task.id] ?? task.owner ?? ""
                        const noteVal = taskNoteDrafts[task.id] ?? task.notes ?? ""
                        return (
                          <div
                            key={task.id}
                            data-task-id={task.id}
                            className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-2 text-xs"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-white">{task.title}</div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  Gap: {task.relatedGap} · Priority:{" "}
                                  <span className="uppercase text-amber-300">{task.priority}</span> ·{" "}
                                  <span className="text-slate-300">
                                    Observation: recommended-not-completed
                                  </span>
                                </div>
                              </div>

                              <label className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className="sr-only">Task workflow status for {task.title}</span>
                                <select
                                  aria-label={`Workflow status for ${task.title}`}
                                  value={task.status}
                                  onChange={(e) =>
                                    handleTaskStatusChange(task.id, e.target.value as ResearchTaskStatus)
                                  }
                                  className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:border-cyan-400 focus:outline-none"
                                >
                                  {RESEARCH_TASK_STATUS_ORDER.map((st) => (
                                    <option key={st} value={st}>
                                      {RESEARCH_TASK_STATUS_LABELS[st]}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <p className="text-[11px] text-slate-300">{task.scientificRationale}</p>
                            <p className="font-mono text-[10px] text-cyan-300/90">
                              Method: {task.suggestedObservationMethod}
                            </p>

                            <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto] items-center pt-1">
                              <input
                                type="text"
                                aria-label={`Owner for ${task.title}`}
                                placeholder="Owner / investigator"
                                value={ownerVal}
                                onChange={(e) =>
                                  setTaskOwnerDrafts((p) => ({ ...p, [task.id]: e.target.value }))
                                }
                                className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] text-slate-100 placeholder:text-slate-500"
                              />
                              <input
                                type="text"
                                aria-label={`Task note for ${task.title}`}
                                placeholder="Operational task note (not telemetry)"
                                value={noteVal}
                                onChange={(e) =>
                                  setTaskNoteDrafts((p) => ({ ...p, [task.id]: e.target.value }))
                                }
                                className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] text-slate-100 placeholder:text-slate-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveTaskMeta(task.id, task.status)}
                                className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2.5 py-1 font-mono text-[11px] text-slate-200 hover:border-cyan-400 cursor-pointer"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: USER RESEARCH NOTES */}
              {activeTab === "notes" && (
                <div role="tabpanel" aria-label="User-authored research notes" className="space-y-3">
                  <form
                    onSubmit={handleAddNote}
                    className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2.5"
                  >
                    <div className="font-mono text-[11px] font-bold uppercase text-amber-300">
                      Add User-Authored Research Note (Saved separately from measured telemetry)
                    </div>
                    {noteError && (
                      <div role="alert" className="font-mono text-[11px] text-rose-300">
                        {noteError}
                      </div>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        aria-label="Research note title"
                        placeholder="Note title (e.g., Field imagery check needed)"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="min-h-9 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-100 placeholder:text-slate-500"
                      />
                      <select
                        aria-label="Related scientific feature"
                        value={noteFeature}
                        onChange={(e) => setNoteFeature(e.target.value as FeatureKey | "general")}
                        className="min-h-9 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-100"
                      >
                        <option value="general">General / Mission Context</option>
                        {FEATURES.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      required
                      rows={3}
                      aria-label="Research note body"
                      placeholder="Document scientific observations to verify or field hypotheses..."
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="url"
                        aria-label="Optional external reference URL"
                        placeholder="Optional http(s):// external reference URL (unverified)"
                        value={noteUrl}
                        onChange={(e) => setNoteUrl(e.target.value)}
                        className="min-h-9 flex-1 min-w-[200px] rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-100 placeholder:text-slate-500"
                      />
                      <button
                        type="submit"
                        className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-3.5 py-1.5 font-mono text-xs font-semibold text-cyan-200 hover:border-cyan-400 cursor-pointer"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        <span>Add Research Note</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {activeRecord.notes.length === 0 ? (
                      <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 font-mono text-[11px] text-slate-400">
                        No research notes added yet.
                      </p>
                    ) : (
                      activeRecord.notes.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-lg border border-amber-500/30 bg-slate-900/80 p-3 space-y-1 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-white">{n.title}</span>
                            <span className="rounded border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-200">
                              USER-AUTHORED NOTE (NOT MEASURED TELEMETRY)
                            </span>
                          </div>
                          <p className="text-slate-200 whitespace-pre-wrap">{n.body}</p>
                          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-400 pt-1">
                            <span>Scope: {n.relatedFeature ?? "general"}</span>
                            <span>Added: {n.createdAt}</span>
                            {n.userSuppliedSourceUrl && (
                              <a
                                href={n.userSuppliedSourceUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 text-cyan-300 hover:underline"
                              >
                                <span>User link (unverified)</span>
                                <ExternalLink className="size-3" aria-hidden="true" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SOURCES & SNAPSHOT HISTORY */}
              {activeTab === "sources-history" && displaySnap && (
                <div role="tabpanel" aria-label="Snapshot sources and revision history" className="space-y-4">
                  {/* Revision History Selector */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                    <h5 className="font-mono text-[11px] font-bold uppercase text-indigo-300">
                      Assessment Snapshot History (Immutable Historical Revisions)
                    </h5>
                    <div className="space-y-1.5">
                      {activeRecord.revisionHistory.map((rev) => {
                        const isSelected = displaySnap.snapshotId === rev.snapshotId
                        return (
                          <div
                            key={rev.snapshotId}
                            className={cn(
                              "flex flex-wrap items-center justify-between gap-2 rounded border px-2.5 py-2 font-mono text-[11px]",
                              isSelected
                                ? "border-indigo-400/60 bg-indigo-950/40 text-white"
                                : "border-slate-800 bg-slate-950/70 text-slate-300"
                            )}
                          >
                            <div>
                              <span className="font-bold">{rev.label}</span>
                              <span className="block text-[10px] text-slate-400">
                                {rev.snapshotId} · Created {rev.createdAt} · Score {rev.snapshot.scoreDisplay}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedRevisionNumber(rev.revisionNumber)}
                              className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] hover:border-cyan-400 cursor-pointer"
                            >
                              {isSelected ? "Active Snapshot" : "Inspect & Export"}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Source Traceability Separation */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                    <h5 className="font-mono text-[11px] font-bold uppercase text-cyan-300">
                      Authoritative Snapshot Sources ({displaySnap.sourceReferences.length})
                    </h5>
                    <ul className="space-y-1.5 font-mono text-[10px] text-slate-300">
                      {displaySnap.sourceReferences.map((src, i) => (
                        <li key={i} className="rounded border border-slate-800 bg-slate-950/60 p-2">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-bold text-white">{src.title}</span>
                            <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] text-cyan-300">
                              {src.originKind}
                            </span>
                          </div>
                          <div className="text-slate-400 mt-0.5">
                            {src.providerOrOrg}
                            {src.identifierOrVersion ? ` · ${src.identifierOrVersion}` : ""}
                            {src.resolution ? ` · ${src.resolution}` : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportSnapshotFile}
            className="hidden"
            aria-label="Upload research snapshot JSON file"
          />
        </div>
      )}
    </section>
  )
}
