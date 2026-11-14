import {
  COMPARISON_FEATURE_MAP,
  COMPARISON_FEATURES,
  type ConfigurableMissionProfile,
} from "../config/comparison-config.ts"
import { FEATURE_MAP, LITHOLOGY_LABELS } from "../features.ts"
import { formatFeatureValue } from "../format.ts"
import {
  computeAnalogSimilarity,
  evaluateFeatureComparison,
  MIN_RELIABLE_COVERAGE,
  rankCandidateLocations,
} from "../similarity-engine.ts"
import type {
  CandidateFeatureExplanation,
  CandidateScientificIntelligence,
  CandidateValidationStatus,
  EvidenceQualitySummary,
  EvidenceQualityTag,
  FeatureContributionCategory,
  FollowUpRecommendation,
  IntelligenceSourceReference,
  ResearchPriorityAssessment,
  ScientificMismatchItem,
  SensitivityAnalysisResult,
  SensitivityScenarioResult,
  ValidationChecklistItem,
} from "../types/candidate-intelligence.ts"
import type { DiscoveryCandidateResult } from "../types/discovery.ts"
import type {
  DiscoveryAtlasEntry,
  EarthCandidate,
  EvidenceClassification,
  FeatureKey,
  FeatureProvenance,
  FeatureScore,
  Lithology,
  MissionPurpose,
  MissionPurposeDefinition,
  PlanetaryTarget,
  ProvenanceDataOrigin,
  ProvenanceVerificationState,
} from "../types.ts"

/**
 * Explicitly documented TerraTwin UI presentation thresholds for classifying
 * individual comparable feature similarities. These bands are explanatory aids
 * and are NOT independently validated planetary-science boundaries.
 */
export const EXPLORATORY_STRONG_MATCH_MIN_SIMILARITY = 0.75
export const EXPLORATORY_PARTIAL_MATCH_MIN_SIMILARITY = 0.45

/**
 * Bounded ±25% single-factor weight perturbation applied only in secondary
 * weight-sensitivity exploration on eligible live candidates.
 */
export const DEFAULT_SENSITIVITY_PERTURBATION_FRACTION = 0.25
export const MAX_SENSITIVITY_SCENARIOS = 5

export const TERRATWIN_SCREENING_DISCLAIMER =
  "TerraTwin provides exploratory analog screening based on available scientific datasets. Results require independent validation before field or mission use."

export const PRESENTATION_THRESHOLD_DISCLOSURE =
  `Feature match labels use documented TerraTwin presentation thresholds (Strong >= ${Math.round(
    EXPLORATORY_STRONG_MATCH_MIN_SIMILARITY * 100
  )}%, Partial ${Math.round(
    EXPLORATORY_PARTIAL_MATCH_MIN_SIMILARITY * 100
  )}–${Math.round(
    EXPLORATORY_STRONG_MATCH_MIN_SIMILARITY * 100 - 1
  )}%, Mismatch < ${Math.round(
    EXPLORATORY_PARTIAL_MATCH_MIN_SIMILARITY * 100
  )}%). These are interpretive presentation helpers, not validated planetary boundaries or changes to backend similarity scores.`

const VALIDATION_STATUS_LABELS: Record<CandidateValidationStatus, string> = {
  "exploratory-screening-lead": "Exploratory screening lead",
  "evidence-review-needed": "Evidence review needed",
  "suitable-for-targeted-follow-up": "Suitable for targeted follow-up research",
  "independently-validated": "Independently validated",
}

function getMissionWeight(
  profile: ConfigurableMissionProfile | MissionPurposeDefinition,
  key: FeatureKey
): number {
  const weights = profile.weights as Partial<Record<FeatureKey, number>>
  const raw = weights[key]
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0
}

function resolveEvidenceClassification(
  prov?: FeatureProvenance,
  fallbackStatus?: string,
  candidateEvidence?: EvidenceClassification
): EvidenceClassification {
  if (prov?.evidenceClassification) return prov.evidenceClassification
  if (prov?.status === "no-data" || fallbackStatus === "missing_data") {
    return "missing_data"
  }
  if (prov?.dataOrigin === "computed-derivative") return "derived"
  if (prov?.status === "unverified") return "proxy"
  if (prov?.status === "verified") return candidateEvidence ?? "measured"
  if (prov?.status === "illustrative") return "illustrative"
  if (candidateEvidence && fallbackStatus === "comparable") {
    return candidateEvidence
  }
  return "missing_data"
}

function resolveDataOrigin(
  prov?: FeatureProvenance,
  isLiveCell = true,
  isMissing = false
): ProvenanceDataOrigin {
  if (prov?.dataOrigin) return prov.dataOrigin
  if (isMissing || prov?.status === "no-data") return "missing"
  return isLiveCell ? "live-api-estimate" : "static-curated"
}

function resolveVerificationState(
  prov?: FeatureProvenance,
  isVerifiedRecord = false,
  isMissing = false
): ProvenanceVerificationState {
  if (prov?.verificationState) return prov.verificationState
  if (isMissing || prov?.status === "no-data") return "no-data"
  if (prov?.status === "verified") return "verified"
  if (prov?.status === "unverified") return "unverified"
  if (prov?.status === "illustrative") return "illustrative"
  return isVerifiedRecord ? "verified" : "unverified"
}

function classifyContribution(fs: FeatureScore): FeatureContributionCategory {
  if (
    fs.status === "incompatible_quantities" ||
    fs.status === "incompatible_units"
  ) {
    return "not-comparable"
  }
  if (fs.status === "missing_data" || fs.similarity === null) {
    return "missing-evidence"
  }
  if (fs.similarity >= EXPLORATORY_STRONG_MATCH_MIN_SIMILARITY) {
    return "strong-supporting-match"
  }
  if (fs.similarity >= EXPLORATORY_PARTIAL_MATCH_MIN_SIMILARITY) {
    return "partial-match"
  }
  return "significant-mismatch"
}

function buildFeatureInterpretation(
  fs: FeatureScore,
  category: FeatureContributionCategory,
  evidenceCls: EvidenceClassification,
  missionId: string,
  isLiveCell: boolean
): { interpretation: string; limitations: string[] } {
  const def = FEATURE_MAP[fs.key]
  const label = def?.label ?? fs.key
  const limitations: string[] = []

  if (category === "not-comparable") {
    return {
      interpretation:
        fs.statusReason ??
        `${label} is excluded from similarity scoring because Earth and planetary target conditions differ fundamentally.`,
      limitations: [
        fs.statusReason ?? "Excluded physically by cross-body comparability rule.",
      ],
    }
  }

  if (category === "missing-evidence") {
    return {
      interpretation:
        fs.weight > 0
          ? `${label} (mission weight ${Math.round(
              fs.weight * 100
            )}%) lacks usable telemetry on Earth or planetary target and is omitted from the coverage denominator rather than scored as zero.`
          : `${label} is unmeasured and carries 0% weight under this mission profile.`,
      limitations: ["Measurement absent; missing data must not be inferred as match or failure."],
    }
  }

  const pct = typeof fs.similarity === "number" ? Math.round(fs.similarity * 100) : null
  const earthTxt = formatFeatureValue(fs.key, fs.candidateValue)
  const targetTxt = formatFeatureValue(fs.key, fs.targetValue)

  if (evidenceCls === "proxy") {
    limitations.push("Atmospheric, coarse-grid, or broad map-unit proxy rather than direct in-situ sample.")
  } else if (evidenceCls === "derived") {
    limitations.push("Computed derivative subject to spatial-stencil or model averaging smoothing.")
  }

  if (fs.key === "meanSlopeDeg" && isLiveCell) {
    limitations.push("Copernicus 90 m DEM 5-point gradient (~445 m baseline) smooths boulders and meter-scale scarps.")
    if (missionId === "rover-testing" || missionId === "lunar-base-construction") {
      limitations.push("Macro-slope agreement alone cannot verify rover trafficability or civil foundation safety.")
    }
  } else if (fs.key === "lithology" && isLiveCell) {
    limitations.push("Macrostrat 1:250k–1:5M map unit polygon does not prove fine-scale mineralogical or XRD composition.")
  } else if (fs.key === "surfaceSolarIrradianceWm2") {
    limitations.push("24-hour climatological mean shortwave irradiance does not reproduce lunar synodic night or polar illumination.")
  } else if (fs.key === "meanSurfaceTempC" && isLiveCell) {
    limitations.push("NASA POWER 2-meter air temperature proxy on ~50 km grid rather than micro-scale ground skin sensor.")
  }

  if (fs.key === "lithology") {
    const candLith = LITHOLOGY_LABELS[fs.candidateValue as Lithology] ?? String(fs.candidateValue)
    const targLith = LITHOLOGY_LABELS[fs.targetValue as Lithology] ?? String(fs.targetValue)
    const note =
      fs.similarity === 1
        ? `Both records map to ${candLith}, matching rock class cleanly${
            isLiveCell ? " at broad regional map scale (requires mineralogy verification)." : "."
          }`
        : fs.similarity === 0.5
        ? `Shares broad petrological family (${candLith} vs. target ${targLith}), but distinct rock units remain.`
        : `Divergent rock family (${candLith} vs. target ${targLith}); lithological processes differ from the target site.`
    return { interpretation: note, limitations }
  }

  const bandNote =
    category === "strong-supporting-match"
      ? "closely aligns within TerraTwin's tolerance band"
      : category === "partial-match"
      ? "shows moderate proximity with notable physical offset"
      : "diverges substantially beyond tolerance"

  return {
    interpretation: `${label} (${earthTxt} vs. target ${targetTxt}, ${
      pct !== null ? `${pct}% normalized match` : "scored"
    }) ${bandNote}.`,
    limitations,
  }
}

function buildMissionSpecificInterpretation(
  missionId: string,
  missionLabel: string,
  target: PlanetaryTarget,
  explanations: CandidateFeatureExplanation[],
  coverage: number | null,
  isLiveCell: boolean
): string {
  const byKey = new Map(explanations.map((e) => [e.key, e]))
  const covText = coverage !== null ? `${Math.round(coverage * 100)}%` : "unscored archive"

  if (missionId === "rover-testing") {
    const slope = byKey.get("meanSlopeDeg")
    const rock = byKey.get("rockAbundancePct")
    const grain = byKey.get("medianGrainSizeMm")
    const slopeText =
      slope?.similarity != null
        ? `regional slope shows ${Math.round(slope.similarity * 100)}% proximity (${formatFeatureValue("meanSlopeDeg", slope.earthValue)} vs. ${formatFeatureValue("meanSlopeDeg", slope.targetValue)})`
        : "terrain slope is unavailable"
    const missingMobility = [
      rock?.comparisonStatus === "missing_data" ? "rock/boulder abundance" : null,
      grain?.comparisonStatus === "missing_data" ? "regolith grain size" : null,
    ]
      .filter(Boolean)
      .join(" and ")

    return `Under ${missionLabel} against ${target.name} (coverage ${covText}), ${slopeText}. ${
      missingMobility
        ? `Direct wheel-hazard and sinkage drivers (${missingMobility}) remain missing; `
        : ""
    }${
      isLiveCell
        ? "coarse DEM slope alone never certifies rover mobility or field traverse safety."
        : "field traverse accessibility still requires local geotechnical and hazard inspection."
    }`
  }

  if (missionId === "geological-research") {
    const lith = byKey.get("lithology")
    const albedo = byKey.get("albedo")
    const lithText =
      lith?.comparisonStatus === "comparable"
        ? `lithological classification maps as ${formatFeatureValue("lithology", lith.earthValue)} (${Math.round((lith.similarity ?? 0) * 100)}% category proximity)`
        : "resolvable lithology is missing"
    return `Under ${missionLabel} against ${target.name} (coverage ${covText}), ${lithText}${
      albedo?.comparisonStatus === "missing_data" ? " and surface albedo is unmeasured" : ""
    }. Generalized regional geologic polygons indicate formation context only and never establish petrological or mineralogical identity without sample spectrometry.`
  }

  if (missionId === "lunar-base-construction") {
    const slope = byKey.get("meanSlopeDeg")
    const solar = byKey.get("surfaceSolarIrradianceWm2")
    const slopeOk =
      slope?.similarity != null
        ? `macro-slope alignment is ${Math.round(slope.similarity * 100)}%`
        : "grading slope is missing"
    const solarNote =
      solar?.similarity != null
        ? `and 24h mean solar irradiance provides atmospheric radiative context (${formatFeatureValue("surfaceSolarIrradianceWm2", solar.earthValue)})`
        : "and solar flux telemetry is missing"
    return `Under ${missionLabel} for ${target.name} (coverage ${covText}), ${slopeOk} ${solarNote}. Earth elevation, atmospheric solar attenuation, and missing geotechnical/boulder parameters cannot validate lunar civil construction, vacuum thermal stress, or 29.5-day/polar illumination hardware readiness.`
  }

  if (missionId === "astrobiology-habitability") {
    const lith = byKey.get("lithology")
    const temp = byKey.get("meanSurfaceTempC")
    const diurnal = byKey.get("diurnalTempRangeC")
    const climateSummary =
      temp?.earthValue != null || diurnal?.earthValue != null
        ? `climatological temperature proxies are present (mean ${formatFeatureValue("meanSurfaceTempC", temp?.earthValue ?? null)}, diurnal swing ${formatFeatureValue("diurnalTempRangeC", diurnal?.earthValue ?? null)})`
        : "temperature extreme proxies are missing"
    return `Under ${missionLabel} for ${target.name} (coverage ${covText}), ${climateSummary} and lithology is ${
      lith?.earthValue ? formatFeatureValue("lithology", lith.earthValue) : "unmeasured"
    } (vascular vegetation excluded at 0% weight). Earth temperature proxies cannot infer extraterrestrial habitability or biosignatures without in-situ aqueous chemistry, salinity/pH, oxidant, and microbial assays.`
  }

  return `Interpreted under custom/repository profile "${missionLabel}" against ${target.name} (${covText} coverage). Screening reflects observed comparable variables only and requires field verification.`
}

function buildEvidenceQualitySummary(
  explanations: CandidateFeatureExplanation[],
  weightedCoverage: number | null,
  candidate: EarthCandidate,
  isLiveCell: boolean,
  hasPeerReviewedLiterature: boolean
): EvidenceQualitySummary {
  const comparableCount = explanations.filter(
    (e) => e.comparisonStatus === "comparable"
  ).length
  const missingCount = explanations.filter(
    (e) => e.comparisonStatus === "missing_data"
  ).length
  const incompatibleCount = explanations.filter(
    (e) =>
      e.comparisonStatus === "incompatible_quantities" ||
      e.comparisonStatus === "incompatible_units"
  ).length

  let measuredCount = 0
  let derivedCount = 0
  let proxyCount = 0
  let illustrativeCount = 0
  let independentlyVerifiedCount = 0

  for (const e of explanations) {
    if (e.evidenceClassification === "measured") measuredCount++
    else if (e.evidenceClassification === "derived") derivedCount++
    else if (e.evidenceClassification === "proxy") proxyCount++
    else if (e.evidenceClassification === "illustrative") illustrativeCount++

    if (e.verificationState === "verified" && !isLiveCell) {
      independentlyVerifiedCount++
    }
  }

  const tags: EvidenceQualityTag[] = []
  if (
    !isLiveCell &&
    candidate.isVerified === true &&
    hasPeerReviewedLiterature &&
    measuredCount > 0
  ) {
    tags.push("independently-validated")
  }
  if (comparableCount > 0 && explanations.some((e) => Boolean(e.sourceTitle))) {
    tags.push("source-supported")
  }
  if (proxyCount > 0 || derivedCount > 0) {
    tags.push("proxy-limited")
  }
  if (
    isLiveCell ||
    explanations.some(
      (e) =>
        e.spatialResolution?.includes("0.5°") ||
        e.spatialResolution?.includes("1.0°") ||
        e.spatialResolution?.includes("1:250k")
    )
  ) {
    tags.push("spatially-coarse")
  }
  if (
    explanations.some(
      (e) => e.missionWeight >= 0.1 && e.comparisonStatus === "missing_data"
    )
  ) {
    tags.push("missing-critical-measurements")
  }

  const resolutionNotes: string[] = []
  if (isLiveCell) {
    resolutionNotes.push(
      "Elevation/slope (~90 m / ~445 m DEM), NASA POWER climatology (~50–100 km MERRA-2/CERES grid), and Macrostrat polygons (regional geologic maps) span vastly different spatial scales."
    )
    resolutionNotes.push(
      "Temporal climatology spans 2001–2025 annual means and does not capture episodic micro-climate pulses or site traverses."
    )
  } else {
    resolutionNotes.push(
      "Curated record reflects published analog literature and compiled site telemetry; individual cell-level feature provenance maps are not populated uniformly across all archive entries."
    )
  }

  const summary =
    tags.includes("independently-validated")
      ? `Curated documented site with ${measuredCount} measured attributes and cited field literature, though mission gaps (${missingCount} missing) still limit full environmental equivalence.`
      : proxyCount + derivedCount > measuredCount
      ? `Evidence is predominantly proxy/derivative (${proxyCount} proxy, ${derivedCount} derived vs. ${measuredCount} measured) across coarse regional layers, with ${missingCount} unmeasured variables.`
      : `Mixed evidence profile: ${comparableCount} comparable variables alongside ${missingCount} missing features and ${incompatibleCount} cross-body exclusions.`

  return {
    comparableCount,
    missingCount,
    incompatibleCount,
    measuredCount,
    derivedCount,
    proxyCount,
    illustrativeCount,
    independentlyVerifiedCount,
    weightedCoverage,
    qualitativeTags: tags,
    assessmentSummary: summary,
    resolutionNotes,
    distinctionNote:
      "Similarity measures agreement on comparable variables; coverage measures mission-weighted availability; evidence quality assesses provenance, spatial scale, proxy limits, and field verification independently (no fabricated confidence percentage).",
  }
}

function buildMismatchesAndContextualLimits(
  explanations: CandidateFeatureExplanation[],
  target: PlanetaryTarget,
  missionLabel: string
): ScientificMismatchItem[] {
  const items: ScientificMismatchItem[] = []

  // 1. Scored mismatches (actual comparable active features scoring below partial threshold)
  const scoredMismatches = explanations
    .filter(
      (e) =>
        e.missionWeight > 0 &&
        e.comparisonStatus === "comparable" &&
        e.contributionCategory === "significant-mismatch"
    )
    .sort((a, b) => b.missionWeight - a.missionWeight)

  for (const m of scoredMismatches) {
    const pct = m.similarity !== null ? Math.round(m.similarity * 100) : 0
    items.push({
      kind: "scored-mismatch",
      featureKey: m.key,
      title: `${m.label} (${pct}% match · wt ${Math.round(m.missionWeight * 100)}%)`,
      missionWeight: m.missionWeight,
      similarity: m.similarity,
      detail: `Observed ${formatFeatureValue(m.key, m.earthValue)} differs significantly from ${target.name} (${formatFeatureValue(m.key, m.targetValue)}).`,
      missionImpact: m.interpretation,
    })
  }

  // 2. Unknowns (critical mission-weighted variables that cannot yet be evaluated)
  const importantMissing = explanations
    .filter(
      (e) =>
        e.missionWeight >= 0.05 &&
        e.comparisonStatus === "missing_data"
    )
    .sort((a, b) => b.missionWeight - a.missionWeight)

  for (const u of importantMissing) {
    items.push({
      kind: "unknown",
      featureKey: u.key,
      title: `${u.label} unmeasured (wt ${Math.round(u.missionWeight * 100)}%)`,
      missionWeight: u.missionWeight,
      similarity: null,
      detail: `Null observation on candidate/target under ${missionLabel}; excluded from similarity score denominator.`,
      missionImpact:
        "Cannot be evaluated from current datasets. Requires targeted remote sensing, geological mapping, or field measurement.",
    })
  }

  // 3. Known contextual planetary limitations not modeled in the similarity equation
  const bodyLabel = target.body === "moon" ? "Lunar (0.16g, hard vacuum ~0 Pa)" : "Martian (0.38g, ~600–800 Pa CO₂)"
  items.push(
    {
      kind: "known-contextual-limitation",
      title: `Gravity & Atmospheric Disparity (${bodyLabel})`,
      detail: `Terrestrial gravity (9.81 m/s²), 101.3 kPa O₂/N₂ atmosphere, and hydrological weathering cannot reproduce ${bodyLabel} regimes.`,
      missionImpact:
        "Excluded atmospheric pressure and precipitation from numeric ranking; impacts rover slip, dust levitation, thermal convection, and lander acoustics.",
    },
    {
      kind: "known-contextual-limitation",
      title: "Radiation, Illumination & Regolith Cohesion Physics",
      detail:
        target.body === "moon"
          ? "Terrestrial magnetosphere and atmosphere block cosmic/solar particle flux; Earth 24h irradiance differs from 29.5-day synodic cycles and lunar polar grazing angles."
          : "Earth geomagnetic shielding and higher atmospheric column attenuate UV/ionizing radiation far more strongly than Mars.",
      missionImpact:
        "Simulates only selected physical surface indices; does not test radiation hardening, electrostatic dust adhesion, or hyper-sharp regolith abrasion.",
    }
  )

  return items
}

function determineValidationStatusAndChecklist(params: {
  candidate: EarthCandidate
  isLiveCell: boolean
  isReliable: boolean
  coverage: number | null
  explanations: CandidateFeatureExplanation[]
  sourceReferences: IntelligenceSourceReference[]
  hasSevereHighWeightConflict: boolean
  hasPeerReviewedLiterature: boolean
  atlasEntry?: DiscoveryAtlasEntry
}): {
  validationStatus: CandidateValidationStatus
  validationNotice: string
  checklist: ValidationChecklistItem[]
} {
  const {
    candidate,
    isLiveCell,
    isReliable,
    coverage,
    explanations,
    sourceReferences,
    hasSevereHighWeightConflict,
    hasPeerReviewedLiterature,
    atlasEntry,
  } = params

  const coordsValid =
    Number.isFinite(candidate.latitude) &&
    Number.isFinite(candidate.longitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180

  const hasAnyEnvValue = explanations.some(
    (e) => e.earthValue !== null && e.earthValue !== undefined
  )
  const hasUnitMismatch = explanations.some(
    (e) => e.comparisonStatus === "incompatible_units"
  )
  const hasTraceableSources =
    sourceReferences.length > 0 || explanations.some((e) => Boolean(e.sourceTitle))
  const byKey = new Map(explanations.map((e) => [e.key, e]))
  const hasLithology =
    byKey.get("lithology")?.earthValue != null ||
    Boolean(atlasEntry?.geologicalDescription)
  const hasElevation = byKey.get("elevationM")?.earthValue != null
  const hasSlope = byKey.get("meanSlopeDeg")?.earthValue != null
  const hasClimate =
    byKey.get("meanSurfaceTempC")?.earthValue != null ||
    byKey.get("diurnalTempRangeC")?.earthValue != null ||
    byKey.get("surfaceSolarIrradianceWm2")?.earthValue != null

  const topActive = explanations
    .filter((e) => e.missionWeight >= 0.15)
    .sort((a, b) => b.missionWeight - a.missionWeight)
  const topActivePresent =
    topActive.length > 0 &&
    topActive.every((e) => e.comparisonStatus === "comparable")

  const hasMissingCritical = explanations.some(
    (e) => e.missionWeight >= 0.1 && e.comparisonStatus === "missing_data"
  )

  const independentlyVerified =
    !isLiveCell && candidate.isVerified === true && hasPeerReviewedLiterature

  const checklist: ValidationChecklistItem[] = [
    {
      id: "coords-valid",
      label: "Geographic coordinates valid",
      status: coordsValid ? "supported" : "not-supported",
      explanation: coordsValid
        ? `WGS84 position (${candidate.latitude.toFixed(4)}°, ${candidate.longitude.toFixed(4)}°) lies within [-90..90, -180..180].`
        : "Coordinates fall outside valid WGS84 bounds.",
    },
    {
      id: "env-data-retrieved",
      label: "Environmental data retrieved",
      status: hasAnyEnvValue ? "supported" : "not-supported",
      explanation: hasAnyEnvValue
        ? "One or more quantitative or categorical environmental measurements are present."
        : "No environmental values are available for this candidate.",
    },
    {
      id: "units-validated",
      label: "Feature units validated",
      status: hasUnitMismatch ? "not-supported" : "supported",
      explanation: hasUnitMismatch
        ? "Unit discrepancy flagged by similarity engine; mismatched units are blocked from comparison."
        : "Comparable numeric measurements share verified SI/Celsius/degree units.",
    },
    {
      id: "inputs-traceable",
      label: "Similarity inputs traceable",
      status: hasTraceableSources ? "supported" : "unknown",
      explanation: hasTraceableSources
        ? `${sourceReferences.length} dataset or citation reference(s) linked to this evaluation.`
        : "Source references are missing for this candidate.",
    },
    {
      id: "geology-documented",
      label: "Relevant geology documented",
      status: hasLithology ? "supported" : "unknown",
      explanation: hasLithology
        ? isLiveCell
          ? "Macrostrat polygon classification provided as regional lithologic proxy (requires field confirmation)."
          : "Geological setting documented in curated atlas metadata."
        : "Lithology unavailable or kept null due to ambiguous mixed map units; unknown rather than disproven.",
    },
    {
      id: "elevation-available",
      label: "Elevation evidence available",
      status: hasElevation ? "supported" : "unknown",
      explanation: hasElevation
        ? `Datum elevation recorded (${formatFeatureValue("elevationM", byKey.get("elevationM")?.earthValue ?? null)}).`
        : "Elevation value unmeasured in current record.",
    },
    {
      id: "gradient-available",
      label: "Terrain gradient estimate available",
      status: hasSlope ? "supported" : "unknown",
      explanation: hasSlope
        ? `Slope estimate recorded (${formatFeatureValue("meanSlopeDeg", byKey.get("meanSlopeDeg")?.earthValue ?? null)}).`
        : "Terrain slope estimate unavailable (polar exclusion or missing DEM).",
    },
    {
      id: "climate-context-available",
      label: "Climate context available",
      status: hasClimate ? "supported" : "unknown",
      explanation: hasClimate
        ? "Temperature or solar radiative climatology available."
        : "Regional climatology variables unavailable.",
    },
    {
      id: "mission-critical-evidence",
      label: "Primary mission-weighted drivers present",
      status: topActive.length === 0 ? "not-applicable" : topActivePresent ? "supported" : "unknown",
      explanation: topActivePresent
        ? "Highest-weighted mission features are present for evaluation."
        : "One or more primary mission features (>=15% weight) remain unmeasured; status is unknown, not failed.",
    },
    {
      id: "independent-observations",
      label: "Independent field observations confirmed",
      status: independentlyVerified ? "supported" : "unknown",
      explanation: independentlyVerified
        ? "Curated verified benchmark/analog with cited peer-reviewed or institutional field documentation."
        : isLiveCell
        ? "Unconfirmed: live-grid screening cells use remote API telemetry without in-situ field campaign proof."
        : "Curated record does not currently link independent field campaign verification.",
    },
    {
      id: "literature-support",
      label: "Peer-reviewed literature support available",
      status: hasPeerReviewedLiterature ? "supported" : "unknown",
      explanation: hasPeerReviewedLiterature
        ? "Explicit DOI or published geological monograph citation linked in repository metadata."
        : "No peer-reviewed field citation attached; regional screening uses open geospatial datasets.",
    },
    {
      id: "critical-missing-identified",
      label: "Critical missing measurements identified",
      status: "supported",
      explanation: hasMissingCritical
        ? "All missing mission-weighted variables are explicitly preserved as null and enumerated."
        : "No high-weight mission features omitted for available comparisons.",
    },
    {
      id: "key-uncertainty-disclosed",
      label: "Key uncertainty disclosed",
      status: "supported",
      explanation:
        "Spatial resolution disparities, planetary body differences (gravity/atmosphere/radiation), and screening limits are disclosed.",
    },
  ]

  // Never upgrade live-grid candidates or unverified entries to independently-validated
  let validationStatus: CandidateValidationStatus
  if (independentlyVerified && !hasSevereHighWeightConflict) {
    validationStatus = "independently-validated"
  } else if (isLiveCell) {
    if (!isReliable || (coverage ?? 0) < MIN_RELIABLE_COVERAGE) {
      validationStatus = "evidence-review-needed"
    } else if (
      (coverage ?? 0) >= 0.7 &&
      !hasSevereHighWeightConflict &&
      hasTraceableSources
    ) {
      validationStatus = "suitable-for-targeted-follow-up"
    } else {
      validationStatus = "exploratory-screening-lead"
    }
  } else if (hasAnyEnvValue && hasTraceableSources) {
    validationStatus = hasSevereHighWeightConflict
      ? "evidence-review-needed"
      : "suitable-for-targeted-follow-up"
  } else {
    validationStatus = "evidence-review-needed"
  }

  const validationNotice =
    validationStatus === "independently-validated"
      ? "Supported by curated benchmark/analog metadata and cited scientific literature; still requires mission-specific engineering review."
      : isLiveCell
      ? "Live-grid cells remain unverified (`isVerified: false`) regardless of similarity score and are screening leads only."
      : "Workflow review status summarizing documented provenance and missing gaps — NOT an official NASA endorsement or field certification."

  return { validationStatus, validationNotice, checklist }
}

function buildFollowUpRecommendations(
  explanations: CandidateFeatureExplanation[],
  missionId: string,
  isLiveCell: boolean
): FollowUpRecommendation[] {
  const recs: FollowUpRecommendation[] = []
  const byKey = new Map(explanations.map((e) => [e.key, e]))

  const pushRec = (rec: Omit<FollowUpRecommendation, "priorityOrder" | "observationStatus">) => {
    recs.push({
      ...rec,
      priorityOrder: recs.length + 1,
      observationStatus: "recommended-not-completed",
    })
  }

  // Sort missing/proxy drivers by mission importance descending
  const sortedDrivers = [...explanations].sort((a, b) => b.missionWeight - a.missionWeight)

  for (const feat of sortedDrivers) {
    const relevance: "critical" | "high" | "moderate" =
      feat.missionWeight >= 0.15 ? "critical" : feat.missionWeight >= 0.05 ? "high" : "moderate"

    if (feat.key === "rockAbundancePct" && feat.comparisonStatus === "missing_data") {
      pushRec({
        id: "follow-rock-abundance",
        missionRelevance: relevance,
        driverFeature: "rockAbundancePct",
        title: "Surface Clast & Boulder Hazard Mapping",
        action:
          "Obtain higher-resolution imagery or field measurements to assess surface rock abundance (>10 cm clasts) and landing/traverse hazards.",
        rationale: `Rock abundance carries ${Math.round(feat.missionWeight * 100)}% mission weight and is unmeasured at regional tier.`,
      })
    } else if (feat.key === "medianGrainSizeMm" && feat.comparisonStatus === "missing_data") {
      pushRec({
        id: "follow-grain-size",
        missionRelevance: relevance,
        driverFeature: "medianGrainSizeMm",
        title: "Regolith Granulometry & Soil Mechanics",
        action:
          "Collect sedimentological or regolith grain-size measurements and bearing-strength profiles in the field or laboratory.",
        rationale: `Median grain size (wt ${Math.round(feat.missionWeight * 100)}%) requires physical sieving and governs wheel sinkage/ISRU sintering.`,
      })
    } else if (feat.key === "lithology" && (feat.comparisonStatus === "missing_data" || feat.evidenceClassification === "proxy")) {
      pushRec({
        id: "follow-geology",
        missionRelevance: relevance,
        driverFeature: "lithology",
        title:
          feat.comparisonStatus === "missing_data"
            ? "Unmapped Lithology Resolution"
            : "Detailed Mineralogical & Lithological Verification",
        action:
          "Review higher-resolution geological mapping or obtain field/laboratory confirmation of lithology and dominant mineral phases.",
        rationale:
          feat.comparisonStatus === "missing_data"
            ? "Macrostrat polygon data was null or mixed-unit; petrological class remains unknown."
            : "Regional 1:250k–1:5M geologic polygon labels remain coarse proxies requiring XRD/VNIR or thin-section confirmation.",
      })
    } else if (
      (feat.key === "albedo" || feat.key === "vegetationCoverPct") &&
      feat.comparisonStatus === "missing_data" &&
      feat.missionWeight > 0
    ) {
      pushRec({
        id: `follow-${feat.key}`,
        missionRelevance: relevance,
        driverFeature: feat.key,
        title:
          feat.key === "albedo"
            ? "Multi-Spectral Surface Albedo Retrieval"
            : "Fractional Bare-Ground Vegetation Survey",
        action:
          feat.key === "albedo"
            ? "Acquire cloud-free optical/multispectral satellite reflectance (e.g., Landsat/Sentinel-2) to quantify broadband albedo."
            : "Verify absence of vascular/cryptogamic vegetation cover via high-resolution optical imagery or seasonal ground check.",
        rationale: `${feat.label} (wt ${Math.round(feat.missionWeight * 100)}%) was unmeasured in regional screening.`,
      })
    }
  }

  if (isLiveCell && byKey.get("meanSlopeDeg")?.comparisonStatus === "comparable") {
    pushRec({
      id: "follow-terrain-dem",
      missionRelevance:
        missionId === "rover-testing" || missionId === "lunar-base-construction"
          ? "critical"
          : "moderate",
      driverFeature: "meanSlopeDeg",
      title: "Meter-Scale Topographic Survey",
      action:
        "Acquire higher-resolution topographic data (drone photogrammetry, LiDAR, or <2 m stereo DEM) to validate micro-slopes smoothed by 90 m DEM stencils.",
      rationale: "Regional 5-point ~445 m gradient misses decimeter–meter scarps and rover roll obstacles.",
    })
  }

  if (isLiveCell && byKey.get("meanSurfaceTempC")?.evidenceClassification === "proxy") {
    pushRec({
      id: "follow-microclimate",
      missionRelevance: missionId === "astrobiology-habitability" ? "high" : "moderate",
      driverFeature: "meanSurfaceTempC",
      title: "Local Microclimate vs. Reanalysis Calibration",
      action:
        "Compare local meteorological station or surface skin logger observations against NASA POWER 0.5° × 0.625° climatological estimates.",
      rationale: "50 km MERRA-2 2 m air temperatures omit terrain aspect shading, ground thermal inertia, and cold-air drainage.",
    })
  }

  if (missionId === "astrobiology-habitability") {
    pushRec({
      id: "follow-astrobiology-geochem",
      missionRelevance: "critical",
      title: "Geochemical, Oxidant & Biosignature Field Protocol",
      action:
        "Investigate water activity, brine chemistry (sulfates/perchlorates/chlorides), organic carbon, and microbial evidence using validated sterile field and laboratory protocols.",
      rationale: "Temperature and regional lithology proxies cannot establish habitability limits or biosignature preservation.",
    })
  }

  return recs
}

function buildResearchPriority(params: {
  isLiveCell: boolean
  isReliable: boolean
  score: number | null
  coverage: number | null
  explanations: CandidateFeatureExplanation[]
  hasSevereHighWeightConflict: boolean
  followUps: FollowUpRecommendation[]
  sensitivity: SensitivityAnalysisResult
}): ResearchPriorityAssessment {
  const {
    isLiveCell,
    isReliable,
    score,
    coverage,
    explanations,
    hasSevereHighWeightConflict,
    followUps,
    sensitivity,
  } = params

  const documentedRules = [
    "Deterministic rule: candidates < 40% coverage or without valid scores are 'Not presently assessable'.",
    "Rule guarantees low-coverage leads never outrank better-evidenced candidates; neither noveltyTier nor benchmark labels add bonus points.",
    "High-weight (>=15%) missing drivers or heavy reliance on coarse proxies downgrades priority from 'Promising follow-up lead' to 'Additional data required' or 'Limited current evidence'.",
  ]

  const nextAction =
    followUps[0]?.action ??
    "Review available provenance notes and plan independent local verification before citing site suitability."

  if (!isReliable || score === null || coverage === null || coverage < MIN_RELIABLE_COVERAGE) {
    return {
      level: "not-presently-assessable",
      label: "Not presently assessable",
      reasons: [
        isLiveCell
          ? "Weighted evidence coverage is below the 40% reliability gate; aggregate score is withheld."
          : "Curated archive record lacks a live regional comparison score under this service without generating synthetic estimates.",
        "Follow-up triage cannot justify site prioritization until primary mission measurements are available.",
      ],
      nextAction,
      documentedRules,
    }
  }

  const missingHighWeight = explanations.filter(
    (e) => e.missionWeight >= 0.15 && e.comparisonStatus === "missing_data"
  )
  const missingAnyMissionWeight = explanations.filter(
    (e) => e.missionWeight >= 0.05 && e.comparisonStatus === "missing_data"
  )
  const proxyOrDerivedCount = explanations.filter(
    (e) =>
      e.missionWeight > 0 &&
      (e.evidenceClassification === "proxy" || e.evidenceClassification === "derived")
  ).length

  if (coverage < 0.55 || score < 50 || missingHighWeight.length >= 2) {
    return {
      level: "limited-current-evidence",
      label: "Limited current evidence",
      reasons: [
        `Weighted evidence coverage (${Math.round(coverage * 100)}%) or similarity (${score.toFixed(1)}%) reflects substantial missing mission inputs (${missingHighWeight.length} primary missing feature(s)).`,
        "Available screening data relies heavily on coarse regional estimates and cannot yet isolate a strong mission-specific lead.",
      ],
      nextAction,
      documentedRules,
    }
  }

  if (
    coverage < 0.7 ||
    score < 70 ||
    missingAnyMissionWeight.length > 0 ||
    hasSevereHighWeightConflict ||
    proxyOrDerivedCount > 0 ||
    sensitivity.orderChangedWithinEvaluatedSet
  ) {
    const reasons: string[] = []
    if (missingAnyMissionWeight.length > 0) {
      reasons.push(
        `${missingAnyMissionWeight.length} mission-weighted feature(s) remain unmeasured (${missingAnyMissionWeight
          .map((m) => m.shortLabel)
          .slice(0, 3)
          .join(", ")}).`
      )
    }
    if (proxyOrDerivedCount > 0) {
      reasons.push(
        `Includes ${proxyOrDerivedCount} proxy/derived active regional estimate(s) requiring finer local confirmation.`
      )
    }
    if (hasSevereHighWeightConflict) {
      reasons.push(
        "At least one high-weight comparable mission variable shows significant mismatch against the planetary target."
      )
    }
    if (sensitivity.orderChangedWithinEvaluatedSet) {
      reasons.push(
        "Exploratory ±25% weight shifts alter candidate ordering within the evaluated set, indicating rank sensitivity."
      )
    }
    if (reasons.length === 0) {
      reasons.push("Moderate similarity or coverage warrants targeted confirmation before advancing.")
    }

    return {
      level: "additional-data-required",
      label: "Additional data required",
      reasons,
      nextAction,
      documentedRules,
    }
  }

  return {
    level: "promising-follow-up-lead",
    label: "Promising follow-up lead",
    reasons: [
      `High coverage (${Math.round(coverage * 100)}%) with strong comparable alignment (${score.toFixed(1)}%) and zero critical missing weighted inputs.`,
      "No severe high-weight physical conflicts observed among comparable dataset layers.",
    ],
    nextAction,
    documentedRules,
  }
}

function buildNormalizedPerturbedWeights(
  baseWeights: Record<string, number>,
  featureKey: FeatureKey,
  multiplier: number
): Record<string, number> {
  const adjusted: Record<string, number> = {}
  let sum = 0
  for (const [k, w] of Object.entries(baseWeights)) {
    const val = typeof w === "number" && Number.isFinite(w) && w >= 0 ? w : 0
    const next = k === featureKey ? Math.max(0, val * multiplier) : val
    adjusted[k] = next
    sum += next
  }
  if (sum <= 0) return { ...baseWeights }

  const normalized: Record<string, number> = {}
  for (const [k, v] of Object.entries(adjusted)) {
    normalized[k] = v / sum
  }
  return normalized
}

export function runBoundedSensitivityAnalysis(params: {
  candidate: EarthCandidate
  baselineResult: DiscoveryCandidateResult
  target: PlanetaryTarget
  missionProfile: ConfigurableMissionProfile | MissionPurposeDefinition
  allEvaluatedCandidates?: DiscoveryCandidateResult[]
  perturbationFraction?: number
}): SensitivityAnalysisResult {
  const {
    candidate,
    baselineResult,
    target,
    missionProfile,
    allEvaluatedCandidates = [],
    perturbationFraction = DEFAULT_SENSITIVITY_PERTURBATION_FRACTION,
  } = params

  const caveats = [
    `Exploratory weight-sensitivity analysis: tests ±${Math.round(
      perturbationFraction * 100
    )}% re-normalized perturbations of the top active comparable mission weights using computeAnalogSimilarity().`,
    "This is NOT a statistical confidence interval, measurement error distribution, or scientific validation certificate.",
    "Scenarios neither fabricate missing measurements nor alter the 40% evidence coverage gate.",
  ]

  if (!baselineResult.isReliable || baselineResult.score === null || baselineResult.coverage < MIN_RELIABLE_COVERAGE) {
    return {
      status: "insufficient-evidence",
      label: "Exploratory weight-sensitivity analysis",
      baselineScore: baselineResult.score,
      baselineRank: baselineResult.rank,
      evaluatedCandidateSetSize: allEvaluatedCandidates.length || 1,
      perturbationFraction,
      scenarios: [],
      minScore: null,
      maxScore: null,
      scoreSpan: null,
      orderChangedWithinEvaluatedSet: false,
      caveats,
      unavailableReason:
        "Sensitivity analysis is disabled when evidence coverage is below the 40% reliability gate.",
    }
  }

  const topComparableActive = baselineResult.featureScores
    .filter((fs) => fs.weight > 0 && fs.status === "comparable")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)

  if (topComparableActive.length < 2) {
    return {
      status: "unavailable",
      label: "Exploratory weight-sensitivity analysis",
      baselineScore: baselineResult.score,
      baselineRank: baselineResult.rank,
      evaluatedCandidateSetSize: allEvaluatedCandidates.length || 1,
      perturbationFraction,
      scenarios: [],
      minScore: baselineResult.score,
      maxScore: baselineResult.score,
      scoreSpan: 0,
      orderChangedWithinEvaluatedSet: false,
      caveats,
      unavailableReason:
        "Fewer than two comparable active mission features exist; single-feature weighting cannot shift relative balance.",
    }
  }

  const baseWeights = missionProfile.weights as Record<string, number>
  const peerList =
    allEvaluatedCandidates.length > 0 ? allEvaluatedCandidates : [baselineResult]

  const rankUnderWeights = (weights: Record<string, number>): number | null => {
    const ranked = rankCandidateLocations(
      target,
      peerList.map((p) => p.candidate),
      { id: `${missionProfile.id}-sens`, weights }
    )
    const found = ranked.find((r) => r.candidate.id === candidate.id)
    return found ? found.rank : null
  }

  const baselineRecomputedRank = rankUnderWeights(baseWeights) ?? baselineResult.rank

  const scenarios: SensitivityScenarioResult[] = [
    {
      scenarioId: "baseline",
      label: "Baseline mission weights",
      perturbationSummary: "Unmodified repository mission weights",
      perturbedFeatureKey: null,
      score: baselineResult.score,
      rankInEvaluatedSet: baselineResult.rank,
    },
  ]

  for (const driver of topComparableActive) {
    const featLabel = FEATURE_MAP[driver.key]?.shortLabel ?? driver.key
    for (const direction of [1 + perturbationFraction, Math.max(0.05, 1 - perturbationFraction)]) {
      if (scenarios.length >= MAX_SENSITIVITY_SCENARIOS) break
      const isUp = direction > 1
      const perturbedWeights = buildNormalizedPerturbedWeights(baseWeights, driver.key, direction)
      const evalRes = computeAnalogSimilarity(target, candidate, {
        id: `${missionProfile.id}-${driver.key}-${isUp ? "up" : "down"}`,
        weights: perturbedWeights,
      })
      const rank = rankUnderWeights(perturbedWeights)
      scenarios.push({
        scenarioId: `${driver.key}-${isUp ? "plus" : "minus"}`,
        label: `${featLabel} ${isUp ? `+${Math.round(perturbationFraction * 100)}%` : `-${Math.round(perturbationFraction * 100)}%`}`,
        perturbationSummary: `${featLabel} scaled ×${direction.toFixed(2)}, remaining weights re-normalized to 1.0`,
        perturbedFeatureKey: driver.key,
        score: evalRes.score,
        rankInEvaluatedSet: rank,
      })
    }
  }

  const validScores = scenarios
    .map((s) => s.score)
    .filter((s): s is number => typeof s === "number" && Number.isFinite(s))
  const minScore = validScores.length > 0 ? Math.min(...validScores) : null
  const maxScore = validScores.length > 0 ? Math.max(...validScores) : null
  const scoreSpan =
    minScore !== null && maxScore !== null
      ? Math.round((maxScore - minScore) * 10) / 10
      : null

  const orderChangedWithinEvaluatedSet =
    peerList.length > 1 &&
    scenarios.some(
      (s) =>
        s.rankInEvaluatedSet !== null &&
        s.rankInEvaluatedSet !== baselineRecomputedRank &&
        s.scenarioId !== "baseline"
    )

  return {
    status: "completed",
    label: "Exploratory weight-sensitivity analysis",
    baselineScore: baselineResult.score,
    baselineRank: baselineResult.rank,
    evaluatedCandidateSetSize: peerList.length,
    perturbationFraction,
    scenarios,
    minScore,
    maxScore,
    scoreSpan,
    orderChangedWithinEvaluatedSet,
    caveats,
  }
}

function collectSourceReferences(
  explanations: CandidateFeatureExplanation[],
  atlasSite?: DiscoveryAtlasEntry
): IntelligenceSourceReference[] {
  const seen = new Set<string>()
  const refs: IntelligenceSourceReference[] = []

  if (atlasSite?.primarySources) {
    for (const src of atlasSite.primarySources) {
      const key = `${src.datasetOrPublication}|${src.doiOrIdentifier ?? ""}`
      if (seen.has(key)) continue
      seen.add(key)
      refs.push({
        title: src.datasetOrPublication,
        providerOrOrg: src.organization,
        url: src.sourceUrl,
        identifierOrVersion: src.doiOrIdentifier ?? src.publicationDate,
        resolution: src.spatialResolution,
        variables: src.relevantVariables?.join(", "),
      })
    }
  }

  for (const exp of explanations) {
    if (!exp.sourceTitle) continue
    const key = `${exp.sourceTitle}|${exp.sourceUrl ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    refs.push({
      title: exp.sourceTitle,
      providerOrOrg: exp.dataOrigin === "live-api-estimate" || exp.dataOrigin === "computed-derivative"
        ? "External Open Geospatial API"
        : "TerraTwin Provenance Record",
      url: exp.sourceUrl,
      resolution: exp.spatialResolution,
      temporalCoverage: exp.temporalCoverage,
    })
  }

  return refs
}

/**
 * Generates deterministic, scientifically transparent candidate intelligence
 * directly on top of a real live regional DiscoveryCandidateResult without
 * modifying any score, weight, coverage value, or verification flag.
 */
export function buildLiveCandidateIntelligence(params: {
  candidateResult: DiscoveryCandidateResult
  target: PlanetaryTarget
  missionProfile: ConfigurableMissionProfile | MissionPurposeDefinition
  allEvaluatedCandidates?: DiscoveryCandidateResult[]
  perturbationFraction?: number
}): CandidateScientificIntelligence {
  const {
    candidateResult,
    target,
    missionProfile,
    allEvaluatedCandidates = [],
    perturbationFraction,
  } = params

  const candidate = candidateResult.candidate
  const fsMap = new Map<FeatureKey, FeatureScore>(
    candidateResult.featureScores.map((fs) => [fs.key, fs])
  )

  const featureExplanations: CandidateFeatureExplanation[] = COMPARISON_FEATURES.map((def) => {
    const existing = fsMap.get(def.key)
    const weight = existing?.weight ?? getMissionWeight(missionProfile, def.key)
    const earthVal = existing?.candidateValue ?? candidate.environment[def.key] ?? null
    const targetVal = existing?.targetValue ?? target.environment[def.key] ?? null

    const fs: FeatureScore =
      existing ??
      evaluateFeatureComparison(
        def,
        weight,
        targetVal,
        earthVal,
        target.provenanceMap?.[def.key],
        candidate.provenanceMap?.[def.key]
      )

    const candProv = candidate.provenanceMap?.[def.key] ?? fs.candidateProvenance
    const category = classifyContribution(fs)
    const evidenceClassification = resolveEvidenceClassification(candProv, fs.status)
    const dataOrigin = resolveDataOrigin(
      candProv,
      true,
      fs.status === "missing_data"
    )
    const verificationState = resolveVerificationState(
      candProv,
      false,
      fs.status === "missing_data"
    )
    const { interpretation, limitations } = buildFeatureInterpretation(
      fs,
      category,
      evidenceClassification,
      missionProfile.id,
      true
    )

    return {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      unit: def.unit,
      missionWeight: fs.weight,
      earthValue: fs.candidateValue,
      targetValue: fs.targetValue,
      comparisonStatus: fs.status,
      similarity: fs.similarity,
      contributionCategory: category,
      evidenceClassification,
      dataOrigin,
      verificationState,
      sourceTitle: candProv?.sourceTitle,
      sourceUrl: candProv?.sourceUrl,
      spatialResolution: candProv?.spatialResolution,
      temporalCoverage: candProv?.measurementPeriod,
      qualityNotes: candProv?.qualityNotes,
      interpretation,
      limitations,
    }
  }).sort((a, b) => b.missionWeight - a.missionWeight)

  const sourceReferences = collectSourceReferences(featureExplanations)
  const hasSevereHighWeightConflict = featureExplanations.some(
    (e) =>
      e.missionWeight >= 0.15 &&
      e.contributionCategory === "significant-mismatch"
  )

  const evidenceQuality = buildEvidenceQualitySummary(
    featureExplanations,
    candidateResult.coverage,
    candidate,
    true,
    false
  )

  const mismatches = buildMismatchesAndContextualLimits(
    featureExplanations,
    target,
    missionProfile.label
  )

  const { validationStatus, validationNotice, checklist } =
    determineValidationStatusAndChecklist({
      candidate,
      isLiveCell: true,
      isReliable: candidateResult.isReliable,
      coverage: candidateResult.coverage,
      explanations: featureExplanations,
      sourceReferences,
      hasSevereHighWeightConflict,
      hasPeerReviewedLiterature: false,
    })

  const sensitivityAnalysis = runBoundedSensitivityAnalysis({
    candidate,
    baselineResult: candidateResult,
    target,
    missionProfile,
    allEvaluatedCandidates,
    perturbationFraction,
  })

  const followUpRecommendations = buildFollowUpRecommendations(
    featureExplanations,
    missionProfile.id,
    true
  )

  const researchPriority = buildResearchPriority({
    isLiveCell: true,
    isReliable: candidateResult.isReliable,
    score: candidateResult.score,
    coverage: candidateResult.coverage,
    explanations: featureExplanations,
    hasSevereHighWeightConflict,
    followUps: followUpRecommendations,
    sensitivity: sensitivityAnalysis,
  })

  const missionInterpretation = buildMissionSpecificInterpretation(
    missionProfile.id,
    missionProfile.label,
    target,
    featureExplanations,
    candidateResult.coverage,
    true
  )

  const scientificCaveats = [
    ...candidateResult.warnings,
    "Similarity score and research priority are separate exploratory screening aids, not NASA endorsements or mission-readiness certificates.",
    "Regional DEM (~445 m central-difference), NASA POWER (~50 km MERRA-2), and Macrostrat geologic polygons cannot resolve local outcrop or rover traverse safety.",
  ]

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    candidateSourceKind: "live-grid-cell",
    noveltyTier: candidate.noveltyTier ?? "live-grid-discovery",
    targetId: target.id,
    targetName: target.name,
    targetBody: target.body,
    missionProfileId: missionProfile.id,
    missionProfileLabel: missionProfile.label,
    score: candidateResult.score,
    scoreDisplay: candidateResult.scoreDisplay,
    coverage: candidateResult.coverage,
    isReliable: candidateResult.isReliable,
    baselineWeightedDistance: candidateResult.weightedDistance,
    validationStatus,
    validationStatusLabel: VALIDATION_STATUS_LABELS[validationStatus],
    validationNotice,
    checklist,
    featureExplanations,
    evidenceQuality,
    mismatches,
    missionInterpretation,
    researchPriority,
    sensitivityAnalysis,
    followUpRecommendations,
    sourceReferences: Array.from(
      new Map(sourceReferences.map((s) => [`${s.title}|${s.url ?? ""}`, s])).values()
    ),
    scientificCaveats: Array.from(new Set(scientificCaveats)),
    presentationThresholdDisclosure: PRESENTATION_THRESHOLD_DISCLOSURE,
    disclaimer: TERRATWIN_SCREENING_DISCLAIMER,
  }
}

/**
 * Generates partial/context-aware scientific intelligence for a curated Phase 6.2
 * Global Discovery Atlas entry without fabricating live similarity scores or missing data.
 */
export function buildAtlasCandidateIntelligence(params: {
  atlasSite: DiscoveryAtlasEntry
  target: PlanetaryTarget
  missionProfile: ConfigurableMissionProfile | MissionPurposeDefinition
}): CandidateScientificIntelligence {
  const { atlasSite, target, missionProfile } = params

  const featureExplanations: CandidateFeatureExplanation[] = COMPARISON_FEATURES.map((def) => {
    const defCompat = COMPARISON_FEATURE_MAP[def.key] ?? def
    const weight = getMissionWeight(missionProfile, def.key)
    const earthVal = atlasSite.environment[def.key] ?? null
    const targetVal = target.environment[def.key] ?? null
    const candProv = atlasSite.provenanceMap?.[def.key]
    const fs = evaluateFeatureComparison(
      defCompat,
      weight,
      targetVal,
      earthVal,
      target.provenanceMap?.[def.key],
      candProv
    )

    const category = classifyContribution(fs)
    const evidenceClassification = resolveEvidenceClassification(
      candProv,
      fs.status,
      atlasSite.evidenceClassification
    )
    const dataOrigin = resolveDataOrigin(
      candProv,
      false,
      fs.status === "missing_data"
    )
    const verificationState = resolveVerificationState(
      candProv,
      atlasSite.isVerified === true,
      fs.status === "missing_data"
    )
    const { interpretation, limitations } = buildFeatureInterpretation(
      fs,
      category,
      evidenceClassification,
      missionProfile.id,
      false
    )

    return {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      unit: def.unit,
      missionWeight: weight,
      earthValue: fs.candidateValue,
      targetValue: fs.targetValue,
      comparisonStatus: fs.status,
      similarity: fs.similarity,
      contributionCategory: category,
      evidenceClassification,
      dataOrigin,
      verificationState,
      sourceTitle: candProv?.sourceTitle ?? atlasSite.primarySources[0]?.datasetOrPublication,
      sourceUrl: candProv?.sourceUrl ?? atlasSite.primarySources[0]?.sourceUrl,
      spatialResolution: candProv?.spatialResolution ?? atlasSite.primarySources[0]?.spatialResolution,
      temporalCoverage: candProv?.measurementPeriod,
      qualityNotes: candProv?.qualityNotes,
      interpretation,
      limitations,
    }
  }).sort((a, b) => b.missionWeight - a.missionWeight)

  const hasPeerReviewedLiterature = atlasSite.primarySources.some(
    (s) => Boolean(s.doiOrIdentifier) && !s.doiOrIdentifier?.startsWith("POWER-")
  )
  const sourceReferences = collectSourceReferences(featureExplanations, atlasSite)
  const hasSevereHighWeightConflict = featureExplanations.some(
    (e) =>
      e.missionWeight >= 0.15 &&
      e.contributionCategory === "significant-mismatch"
  )

  const evidenceQuality = buildEvidenceQualitySummary(
    featureExplanations,
    null,
    atlasSite,
    false,
    hasPeerReviewedLiterature
  )

  const mismatches = buildMismatchesAndContextualLimits(
    featureExplanations,
    target,
    missionProfile.label
  )

  const { validationStatus, validationNotice, checklist } =
    determineValidationStatusAndChecklist({
      candidate: atlasSite,
      isLiveCell: false,
      isReliable: false,
      coverage: null,
      explanations: featureExplanations,
      sourceReferences,
      hasSevereHighWeightConflict,
      hasPeerReviewedLiterature,
      atlasEntry: atlasSite,
    })

  const sensitivityAnalysis: SensitivityAnalysisResult = {
    status: "unavailable",
    label: "Exploratory weight-sensitivity analysis",
    baselineScore: null,
    baselineRank: null,
    evaluatedCandidateSetSize: 1,
    perturbationFraction: DEFAULT_SENSITIVITY_PERTURBATION_FRACTION,
    scenarios: [],
    minScore: null,
    maxScore: null,
    scoreSpan: null,
    orderChangedWithinEvaluatedSet: false,
    caveats: [
      "Curated Global Atlas locations preserve archival provenance and do not receive fabricated live regional scanner scores.",
    ],
    unavailableReason:
      "Sensitivity analysis applies only to scored live discovery candidates; curated Atlas records retain their Phase 6.2 provenance without invented aggregate scores.",
  }

  const followUpRecommendations = buildFollowUpRecommendations(
    featureExplanations,
    missionProfile.id,
    false
  )

  const isTargetMissionAligned = atlasSite.relevantMissionProfiles.includes(
    missionProfile.id as MissionPurpose
  )

  const researchPriority: ResearchPriorityAssessment = {
    level: hasPeerReviewedLiterature
      ? isTargetMissionAligned
        ? "additional-data-required"
        : "limited-current-evidence"
      : "not-presently-assessable",
    label: hasPeerReviewedLiterature
      ? isTargetMissionAligned
        ? "Additional data required"
        : "Limited current evidence"
      : "Not presently assessable",
    reasons: [
      `Curated Global Atlas record (${atlasSite.noveltyTier}) preserved without inventing a live regional similarity percentage.`,
      isTargetMissionAligned
        ? `Explicitly catalogued as relevant to ${missionProfile.label}; local mission constraints still require regional or field confirmation.`
        : `Curated metadata focuses primarily on other mission profiles; evaluate missing environmental parameters carefully for ${missionProfile.label}.`,
    ],
    nextAction:
      followUpRecommendations[0]?.action ??
      "Use 'Use as Regional Scan Seed' in the Atlas panel to run a bounded live screening pass around this site.",
    documentedRules: [
      "Curated Atlas novelty tiers (`canonical-benchmark`, `under-explored-analog`) never receive artificial scoring bonuses.",
      "Aggregate similarity percentages are intentionally withheld for curated archive views rather than fabricated from partial records.",
    ],
  }

  return {
    candidateId: atlasSite.id,
    candidateName: atlasSite.name,
    candidateSourceKind: "curated-atlas-site",
    noveltyTier: atlasSite.noveltyTier,
    targetId: target.id,
    targetName: target.name,
    targetBody: target.body,
    missionProfileId: missionProfile.id,
    missionProfileLabel: missionProfile.label,
    score: null,
    scoreDisplay: "Unscored curated archive (Phase 6.2)",
    coverage: null,
    isReliable: false,
    baselineWeightedDistance: null,
    validationStatus,
    validationStatusLabel: VALIDATION_STATUS_LABELS[validationStatus],
    validationNotice,
    checklist,
    featureExplanations,
    evidenceQuality,
    mismatches,
    missionInterpretation: buildMissionSpecificInterpretation(
      missionProfile.id,
      missionProfile.label,
      target,
      featureExplanations,
      null,
      false
    ),
    researchPriority,
    sensitivityAnalysis,
    followUpRecommendations,
    sourceReferences,
    scientificCaveats: [
      ...atlasSite.scientificLimitations,
      "Curated atlas records remain scientifically distinct from live `/api/discover` telemetry grid cells.",
    ],
    presentationThresholdDisclosure: PRESENTATION_THRESHOLD_DISCLOSURE,
    disclaimer: TERRATWIN_SCREENING_DISCLAIMER,
  }
}
