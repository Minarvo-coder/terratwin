"use client"

import { useMemo, useState } from "react"
import type { ConfigurableMissionProfile } from "@/lib/terratwin/config/comparison-config"
import { formatCoverage, formatFeatureValue } from "@/lib/terratwin/format"
import {
  buildAtlasCandidateIntelligence,
  buildLiveCandidateIntelligence,
} from "@/lib/terratwin/services/candidate-intelligence-service"
import type {
  CandidateFeatureExplanation,
  CandidateScientificIntelligence,
  CandidateValidationStatus,
  EvidenceQualityTag,
  FeatureContributionCategory,
  ResearchPriorityLevel,
  ValidationChecklistStatus,
} from "@/lib/terratwin/types/candidate-intelligence"
import type { DiscoveryCandidateResult } from "@/lib/terratwin/types/discovery"
import type {
  DiscoveryAtlasEntry,
  MissionPurposeDefinition,
  PlanetaryTarget,
} from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Compass,
  ExternalLink,
  HelpCircle,
  Layers,
  Microscope,
  MinusCircle,
  Scale,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react"

interface DiscoveryScientificIntelligenceProps {
  selectedCandidate: DiscoveryCandidateResult | null
  selectedAtlasSite: DiscoveryAtlasEntry | null
  allEvaluatedCandidates?: DiscoveryCandidateResult[]
  liveTarget: PlanetaryTarget | null
  liveMissionProfile?: ConfigurableMissionProfile | MissionPurposeDefinition | null
  activeTarget: PlanetaryTarget | null
  activeMissionProfile: ConfigurableMissionProfile
  isStaleContext?: boolean
}

type IntelTabId = "explainability" | "mismatches-checklist" | "priority-followup" | "sensitivity-sources"

const CONTRIBUTION_BADGE_MAP: Record<
  FeatureContributionCategory,
  { label: string; badgeClass: string }
> = {
  "strong-supporting-match": {
    label: "Strong match",
    badgeClass: "border-emerald-500/40 bg-emerald-950/50 text-emerald-300",
  },
  "partial-match": {
    label: "Partial match",
    badgeClass: "border-cyan-500/40 bg-cyan-950/50 text-cyan-300",
  },
  "significant-mismatch": {
    label: "Significant mismatch",
    badgeClass: "border-rose-500/40 bg-rose-950/50 text-rose-300",
  },
  "not-comparable": {
    label: "Not comparable",
    badgeClass: "border-amber-500/40 bg-amber-950/50 text-amber-300",
  },
  "missing-evidence": {
    label: "Insufficient evidence",
    badgeClass: "border-slate-700 bg-slate-900 text-slate-400",
  },
}

const EVIDENCE_TAG_LABELS: Record<EvidenceQualityTag, { label: string; cls: string }> = {
  "source-supported": {
    label: "Source-supported",
    cls: "border-emerald-500/40 bg-emerald-950/40 text-emerald-300",
  },
  "proxy-limited": {
    label: "Proxy-limited",
    cls: "border-amber-500/40 bg-amber-950/40 text-amber-200",
  },
  "spatially-coarse": {
    label: "Spatially coarse",
    cls: "border-amber-500/40 bg-amber-950/40 text-amber-300",
  },
  "missing-critical-measurements": {
    label: "Missing critical measurements",
    cls: "border-rose-500/40 bg-rose-950/40 text-rose-200",
  },
  "independently-validated": {
    label: "Independently validated",
    cls: "border-emerald-400/50 bg-emerald-950/60 text-emerald-200",
  },
}

const VALIDATION_BADGE_MAP: Record<CandidateValidationStatus, string> = {
  "exploratory-screening-lead": "border-cyan-500/40 bg-cyan-950/45 text-cyan-200",
  "evidence-review-needed": "border-amber-500/40 bg-amber-950/45 text-amber-200",
  "suitable-for-targeted-follow-up": "border-emerald-500/40 bg-emerald-950/45 text-emerald-200",
  "independently-validated": "border-emerald-400/60 bg-emerald-950/65 text-emerald-100",
}

const PRIORITY_BADGE_MAP: Record<ResearchPriorityLevel, string> = {
  "promising-follow-up-lead": "border-emerald-500/40 bg-emerald-950/50 text-emerald-200",
  "additional-data-required": "border-amber-500/40 bg-amber-950/50 text-amber-200",
  "limited-current-evidence": "border-orange-500/40 bg-orange-950/50 text-orange-200",
  "not-presently-assessable": "border-slate-700 bg-slate-900 text-slate-300",
}

function ChecklistStatusBadge({ status }: { status: ValidationChecklistStatus }) {
  if (status === "supported") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-300">
        <CheckCircle2 className="size-3" aria-hidden="true" />
        Supported
      </span>
    )
  }
  if (status === "not-supported") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-950/50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-rose-300">
        <XCircle className="size-3" aria-hidden="true" />
        Not supported
      </span>
    )
  }
  if (status === "unknown") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-950/45 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-200">
        <HelpCircle className="size-3" aria-hidden="true" />
        Unknown
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-slate-400">
      <MinusCircle className="size-3" aria-hidden="true" />
      Not applicable
    </span>
  )
}

function ComparableSimilarityBars({
  explanations,
}: {
  explanations: CandidateFeatureExplanation[]
}) {
  const comparable = explanations.filter(
    (e) => e.comparisonStatus === "comparable" && typeof e.similarity === "number"
  )
  if (comparable.length === 0) return null

  return (
    <figure
      aria-label="Normalized dimensionless feature similarity bars"
      className="rounded-lg border border-slate-800 bg-slate-950/75 p-3 space-y-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-cyan-300">
          <BarChart3 className="size-3.5" aria-hidden="true" />
          <span>Dimensionless Feature Match Profile (0–100% Scale)</span>
        </figcaption>
        <span className="font-mono text-[10px] text-slate-400">
          Normalized unitless proximity only (raw physical units kept separate)
        </span>
      </div>
      <div className="space-y-1.5">
        {comparable.map((item) => {
          const pct = Math.round((item.similarity ?? 0) * 100)
          const badge = CONTRIBUTION_BADGE_MAP[item.contributionCategory]
          return (
            <div key={item.key} className="grid grid-cols-[120px_minmax(0,1fr)_88px] items-center gap-2 text-[11px] font-mono">
              <span className="truncate text-slate-300" title={item.label}>
                {item.shortLabel} ({Math.round(item.missionWeight * 100)}%)
              </span>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.label} normalized similarity`}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all motion-reduce:transition-none",
                    pct >= 75
                      ? "bg-emerald-400"
                      : pct >= 45
                      ? "bg-cyan-400"
                      : "bg-rose-400"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={cn("text-right text-[10px] font-bold", badge.badgeClass, "border-0 bg-transparent px-0 py-0")}>
                {pct}% · {badge.label.split(" ")[0]}
              </span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

export function DiscoveryScientificIntelligence({
  selectedCandidate,
  selectedAtlasSite,
  allEvaluatedCandidates = [],
  liveTarget,
  liveMissionProfile,
  activeTarget,
  activeMissionProfile,
  isStaleContext = false,
}: DiscoveryScientificIntelligenceProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<IntelTabId>("explainability")

  const intelligence: CandidateScientificIntelligence | null = useMemo(() => {
    if (selectedCandidate && liveTarget) {
      const profileToUse = liveMissionProfile ?? activeMissionProfile
      return buildLiveCandidateIntelligence({
        candidateResult: selectedCandidate,
        target: liveTarget,
        missionProfile: profileToUse,
        allEvaluatedCandidates,
      })
    }

    if (selectedAtlasSite && !selectedCandidate && activeTarget) {
      return buildAtlasCandidateIntelligence({
        atlasSite: selectedAtlasSite,
        target: activeTarget,
        missionProfile: activeMissionProfile,
      })
    }

    return null
  }, [
    selectedCandidate,
    selectedAtlasSite,
    liveTarget,
    liveMissionProfile,
    activeTarget,
    activeMissionProfile,
    allEvaluatedCandidates,
  ])

  if (!intelligence) {
    return null
  }

  const tabs: Array<{ id: IntelTabId; label: string }> = [
    { id: "explainability", label: "Why It Matches & Quality" },
    { id: "mismatches-checklist", label: "Mismatches & Checklist" },
    { id: "priority-followup", label: "Priority & Follow-Up" },
    { id: "sensitivity-sources", label: "Sensitivity & Sources" },
  ]

  return (
    <div
      className="rounded-xl border border-cyan-500/25 bg-slate-950/75 overflow-hidden"
      data-candidate-intel-id={intelligence.candidateId}
    >
      {/* Collapsible Header Bar */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={`scientific-intel-body-${intelligence.candidateId}`}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-900/70 focus-visible:outline-2 focus-visible:outline-cyan-400 cursor-pointer"
      >
        <div className="flex items-start gap-2.5">
          <Microscope className="size-4 text-cyan-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                Scientific Intelligence
              </span>
              <span
                className={cn(
                  "rounded border px-2 py-0.5 font-mono text-[10px] font-semibold",
                  VALIDATION_BADGE_MAP[intelligence.validationStatus]
                )}
              >
                {intelligence.validationStatusLabel}
              </span>
              <span
                className={cn(
                  "rounded border px-2 py-0.5 font-mono text-[10px] font-semibold",
                  PRIORITY_BADGE_MAP[intelligence.researchPriority.level]
                )}
              >
                Priority: {intelligence.researchPriority.label}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {intelligence.targetName} · {intelligence.missionProfileLabel} ·{" "}
              {intelligence.evidenceQuality.comparableCount} comparable /{" "}
              {intelligence.evidenceQuality.missingCount} missing features
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-200 shrink-0">
          <span>{expanded ? "Hide Analysis" : "Open Scientific Intelligence"}</span>
          {expanded ? (
            <ChevronUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          )}
        </span>
      </button>

      {expanded && (
        <div
          id={`scientific-intel-body-${intelligence.candidateId}`}
          className="border-t border-slate-800 p-4 space-y-4"
        >
          {/* Context Invalidation Warning if UI target/mission changed after live scan */}
          {isStaleContext && intelligence.candidateSourceKind === "live-grid-cell" && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-950/40 p-3 text-xs text-amber-200"
            >
              <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
              <div>
                <strong>Context Changed — Prior Scan Assessment Displayed:</strong>{" "}
                Your workspace target or mission profile changed to{" "}
                <span className="font-mono text-white">
                  {activeTarget?.name ?? "new target"} ({activeMissionProfile.label})
                </span>
                . Below remains locked strictly to the scored scan context (
                <span className="font-mono">
                  {intelligence.targetName} · {intelligence.missionProfileLabel}
                </span>
                ). Re-run the regional scan to generate intelligence for the newly selected context.
              </div>
            </div>
          )}

          {/* Scientific Screening Disclaimer */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5 text-[11px] text-slate-300 flex items-start gap-2">
            <ShieldAlert className="size-4 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{intelligence.disclaimer}</span>
          </div>

          {/* Mission-Specific Context Synthesis */}
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/15 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-cyan-300 mb-1">
              <Compass className="size-3.5" aria-hidden="true" />
              <span>Mission Interpretation ({intelligence.missionProfileLabel})</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-200">
              {intelligence.missionInterpretation}
            </p>
          </div>

          {/* Accessible Progressive Disclosure Sub-Tabs */}
          <div
            role="tablist"
            aria-label="Scientific intelligence analysis sections"
            className="flex flex-wrap gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 p-1"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 min-w-[160px] rounded px-3 py-1.5 font-mono text-[11px] font-semibold transition cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400",
                    selected
                      ? "bg-cyan-950/85 text-cyan-200 border border-cyan-500/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* TAB 1: Why This Candidate Matches + Evidence Quality */}
          {activeTab === "explainability" && (
            <div role="tabpanel" aria-label="Why This Candidate Matches and Evidence Quality" className="space-y-4">
              {/* Evidence Quality Summary Cards (kept separate from Similarity Score & Coverage) */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-white">
                    <Layers className="size-4 text-cyan-400" aria-hidden="true" />
                    <span>Evidence Quality Assessment (Distinct from Similarity &amp; Coverage)</span>
                  </h5>
                  {intelligence.coverage !== null ? (
                    <span className="font-mono text-[11px] text-slate-300">
                      Weighted coverage: <strong className="text-white">{formatCoverage(intelligence.coverage)}</strong>
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-amber-300">
                      Curated archive (no fabricated live score)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                  <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                    <span className="block text-[9px] text-slate-400 uppercase">Comparable</span>
                    <span className="text-sm font-bold text-cyan-300">{intelligence.evidenceQuality.comparableCount}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                    <span className="block text-[9px] text-slate-400 uppercase">Missing</span>
                    <span className="text-sm font-bold text-slate-200">{intelligence.evidenceQuality.missingCount}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                    <span className="block text-[9px] text-slate-400 uppercase">Measured</span>
                    <span className="text-sm font-bold text-emerald-300">{intelligence.evidenceQuality.measuredCount}</span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                    <span className="block text-[9px] text-slate-400 uppercase">Proxy / Derived</span>
                    <span className="text-sm font-bold text-amber-300">
                      {intelligence.evidenceQuality.proxyCount + intelligence.evidenceQuality.derivedCount}
                    </span>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                    <span className="block text-[9px] text-slate-400 uppercase">Indep. Verified</span>
                    <span className="text-sm font-bold text-slate-200">
                      {intelligence.evidenceQuality.independentlyVerifiedCount}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {intelligence.evidenceQuality.qualitativeTags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded border px-2 py-0.5 font-mono text-[10px]",
                        EVIDENCE_TAG_LABELS[tag].cls
                      )}
                    >
                      {EVIDENCE_TAG_LABELS[tag].label}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {intelligence.evidenceQuality.assessmentSummary}
                </p>
                <p className="text-[11px] text-slate-400">
                  {intelligence.evidenceQuality.distinctionNote}
                </p>
              </div>

              {/* Dimensionless Similarity Bar Visualization */}
              <ComparableSimilarityBars explanations={intelligence.featureExplanations} />

              {/* Detailed Feature Contributions */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="font-mono text-xs font-bold uppercase text-white">
                    Why This Candidate Matches — Feature-by-Feature Explanation
                  </h5>
                  <span className="font-mono text-[10px] text-slate-400">
                    Exact engine featureScores &amp; weights (sorted by mission weight)
                  </span>
                </div>

                <div className="space-y-2">
                  {intelligence.featureExplanations.map((feat) => {
                    const contrib = CONTRIBUTION_BADGE_MAP[feat.contributionCategory]
                    return (
                      <div
                        key={feat.key}
                        className="rounded-lg border border-slate-800 bg-slate-900/45 p-3 text-xs space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 font-mono">
                            <span className="font-bold text-white">{feat.label}</span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                              wt {Math.round(feat.missionWeight * 100)}%
                            </span>
                            <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", contrib.badgeClass)}>
                              {contrib.label}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-300">
                            Earth:{" "}
                            <strong className="text-white">
                              {feat.earthValue === null ? "Not measured" : formatFeatureValue(feat.key, feat.earthValue)}
                            </strong>{" "}
                            · Target:{" "}
                            <strong className="text-cyan-300">
                              {feat.targetValue === null ? "Not measured" : formatFeatureValue(feat.key, feat.targetValue)}
                            </strong>
                            {typeof feat.similarity === "number" && feat.comparisonStatus === "comparable" && (
                              <span className="ml-2 text-cyan-300 font-bold">
                                ({Math.round(feat.similarity * 100)}%)
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-300 leading-relaxed">{feat.interpretation}</p>

                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-400">
                          <span>Evidence: {feat.evidenceClassification.replace("_", " ")}</span>
                          <span>· Origin: {feat.dataOrigin}</span>
                          <span>· Verification: {feat.verificationState}</span>
                          {feat.sourceTitle && <span>· Source: {feat.sourceTitle}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="font-mono text-[10px] text-slate-400">
                  {intelligence.presentationThresholdDisclosure}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Important Mismatches & Validation Checklist */}
          {activeTab === "mismatches-checklist" && (
            <div role="tabpanel" aria-label="Important Mismatches and Validation Checklist" className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-2.5">
                <h5 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-amber-300">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  <span>Scientific Mismatches, Unknowns &amp; Contextual Limits</span>
                </h5>
                <div className="space-y-2 text-xs">
                  {intelligence.mismatches.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-slate-800 bg-slate-950/70 p-2.5 space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                        <span className="font-bold text-white">{m.title}</span>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 uppercase font-semibold",
                            m.kind === "scored-mismatch"
                              ? "border-rose-500/40 bg-rose-950/50 text-rose-300"
                              : m.kind === "unknown"
                              ? "border-slate-700 bg-slate-900 text-slate-300"
                              : "border-amber-500/40 bg-amber-950/50 text-amber-200"
                          )}
                        >
                          {m.kind === "scored-mismatch"
                            ? "Scored mismatch"
                            : m.kind === "unknown"
                            ? "Unknown"
                            : "Known contextual limitation"}
                        </span>
                      </div>
                      <p className="text-slate-300">{m.detail}</p>
                      <p className="text-[11px] text-slate-400">{m.missionImpact}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-cyan-300">
                    <ClipboardCheck className="size-4" aria-hidden="true" />
                    <span>Candidate Validation Checklist</span>
                  </h5>
                  <span className="font-mono text-[10px] text-slate-400">
                    Workflow review (not NASA certification)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{intelligence.validationNotice}</p>
                <ul className="space-y-1.5 text-xs">
                  {intelligence.checklist.map((item) => (
                    <li
                      key={item.id}
                      className="rounded border border-slate-800/80 bg-slate-950/60 p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-200">{item.label}</span>
                        <ChecklistStatusBadge status={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-400">{item.explanation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: Research Priority & Recommended Next Measurements */}
          {activeTab === "priority-followup" && (
            <div role="tabpanel" aria-label="Research Priority and Follow-Up Recommendations" className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-white">
                    <Sparkles className="size-4 text-cyan-400" aria-hidden="true" />
                    <span>Research Priority Assessment</span>
                  </h5>
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 font-mono text-[10px] font-bold",
                      PRIORITY_BADGE_MAP[intelligence.researchPriority.level]
                    )}
                  >
                    {intelligence.researchPriority.label}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-slate-400">Reasons:</span>
                  <ul className="mt-1 list-disc pl-4 space-y-1 text-xs text-slate-300">
                    {intelligence.researchPriority.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-xs">
                  <span className="font-mono text-[10px] font-bold uppercase text-cyan-300 block mb-0.5">
                    Primary Next Action
                  </span>
                  <span className="text-slate-100">{intelligence.researchPriority.nextAction}</span>
                </div>

                <div className="border-t border-slate-800 pt-2">
                  <span className="font-mono text-[10px] uppercase text-slate-500 block mb-1">
                    Documented TerraTwin Assessment Rules:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-400">
                    {intelligence.researchPriority.documentedRules.map((rule, i) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-2.5">
                <h5 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-emerald-300">
                  <Activity className="size-4" aria-hidden="true" />
                  <span>Recommended Follow-Up Measurements</span>
                </h5>
                <p className="text-[11px] text-slate-400">
                  Suggested next scientific observations driven by missing or proxy-limited mission variables (not completed observations):
                </p>
                {intelligence.followUpRecommendations.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No missing or proxy-limited drivers flagged; confirm site feasibility independently before planning field work.
                  </p>
                ) : (
                  <ol className="space-y-2 text-xs">
                    {intelligence.followUpRecommendations.map((rec) => (
                      <li
                        key={rec.id}
                        className="rounded border border-slate-800 bg-slate-950/70 p-2.5 space-y-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                          <span className="font-bold text-white">
                            {rec.priorityOrder}. {rec.title}
                          </span>
                          <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 uppercase text-cyan-300">
                            {rec.missionRelevance} relevance
                          </span>
                        </div>
                        <p className="text-slate-200">{rec.action}</p>
                        <p className="text-[11px] text-slate-400">{rec.rationale}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Sensitivity Analysis & Traceable Sources */}
          {activeTab === "sensitivity-sources" && (
            <div role="tabpanel" aria-label="Weight Sensitivity Analysis and Source Attribution" className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-cyan-300">
                    <Scale className="size-4" aria-hidden="true" />
                    <span>{intelligence.sensitivityAnalysis.label}</span>
                  </h5>
                  <span className="font-mono text-[10px] text-slate-400">
                    Secondary analysis (baseline score &amp; rank preserved)
                  </span>
                </div>

                {intelligence.sensitivityAnalysis.status !== "completed" ? (
                  <div className="rounded border border-amber-500/35 bg-amber-950/25 p-3 text-xs text-amber-200">
                    {intelligence.sensitivityAnalysis.unavailableReason}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                      <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                        <span className="block text-[9px] text-slate-400 uppercase">Baseline Score</span>
                        <span className="text-sm font-bold text-white">
                          {intelligence.sensitivityAnalysis.baselineScore?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                        <span className="block text-[9px] text-slate-400 uppercase">Tested Range</span>
                        <span className="text-sm font-bold text-cyan-300">
                          {intelligence.sensitivityAnalysis.minScore?.toFixed(1)}% –{" "}
                          {intelligence.sensitivityAnalysis.maxScore?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                        <span className="block text-[9px] text-slate-400 uppercase">Scenarios Tested</span>
                        <span className="text-sm font-bold text-white">
                          {intelligence.sensitivityAnalysis.scenarios.length}
                        </span>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                        <span className="block text-[9px] text-slate-400 uppercase">Rank Order Shift</span>
                        <span
                          className={cn(
                            "text-sm font-bold",
                            intelligence.sensitivityAnalysis.orderChangedWithinEvaluatedSet
                              ? "text-amber-300"
                              : "text-emerald-300"
                          )}
                        >
                          {intelligence.sensitivityAnalysis.orderChangedWithinEvaluatedSet
                            ? "Shifted in set"
                            : "Unchanged in set"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">
                      Under the tested ±25% mission-weight variations using the existing similarity formula, this candidate&apos;s score changed within the displayed range ({intelligence.sensitivityAnalysis.minScore?.toFixed(1)}% to {intelligence.sensitivityAnalysis.maxScore?.toFixed(1)}%).
                    </p>

                    <div className="overflow-x-auto rounded border border-slate-800 bg-slate-950/70">
                      <table className="w-full text-left font-mono text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/70 text-[10px] uppercase text-slate-400">
                            <th className="py-1.5 px-3">Scenario</th>
                            <th className="py-1.5 px-3">Perturbation</th>
                            <th className="py-1.5 px-3">Scenario Score</th>
                            <th className="py-1.5 px-3">Set Rank</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {intelligence.sensitivityAnalysis.scenarios.map((sc) => (
                            <tr key={sc.scenarioId}>
                              <td className="py-1.5 px-3 font-semibold text-slate-200">{sc.label}</td>
                              <td className="py-1.5 px-3 text-slate-400">{sc.perturbationSummary}</td>
                              <td className="py-1.5 px-3 font-bold text-cyan-300">
                                {sc.score !== null ? `${sc.score.toFixed(1)}%` : "Insufficient"}
                              </td>
                              <td className="py-1.5 px-3 text-slate-300">
                                {sc.rankInEvaluatedSet !== null ? `#${sc.rankInEvaluatedSet}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-400">
                  {intelligence.sensitivityAnalysis.caveats.map((cav, i) => (
                    <li key={i}>{cav}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-2.5">
                <h5 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-white">
                  <BookOpen className="size-4 text-cyan-400" aria-hidden="true" />
                  <span>Traceable Scientific Sources &amp; Caveats</span>
                </h5>
                <ul className="space-y-1.5 font-mono text-[11px]">
                  {intelligence.sourceReferences.map((src, i) => (
                    <li
                      key={i}
                      className="rounded border border-slate-800 bg-slate-950/65 p-2 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{src.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {[src.providerOrOrg, src.identifierOrVersion, src.resolution, src.temporalCoverage]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                        >
                          <span>Source</span>
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
                {intelligence.scientificCaveats.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-200/90 pt-1">
                    {intelligence.scientificCaveats.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
