import { ArrowUpRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionHeading } from "@/components/shared/section-heading"
import { DsHonestyBadge } from "@/components/ds/primitives"
import { DATA_SOURCES } from "@/lib/terratwin/data-sources"
import { FEATURES, MISSION_PURPOSES } from "@/lib/terratwin/features"
import { HIGH_CONFIDENCE_COVERAGE, MODERATE_CONFIDENCE_COVERAGE } from "@/lib/terratwin/similarity"

const KIND_LABELS = { linear: "Linear", logarithmic: "Log₁₀", categorical: "Categorical" } as const

export function ScoringSection() {
  return (
    <section id="scoring" className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="01 / SCORING"
        title="Weighted feature similarity"
        description="Each Earth candidate is compared with the selected target feature by feature. Per-feature similarities are combined using weights that depend on the mission purpose."
      />
      <ol className="grid gap-5 md:grid-cols-3">
        <Step index="01" title="Per-feature similarity">
          Numeric features score 1 &minus; |target &minus; candidate| &divide; tolerance, clamped to 0&ndash;1. Grain size
          uses base-10 logarithm values. Lithology scores 1 for an exact match, 0.5 for the same rock family, otherwise
          0.
        </Step>
        <Step index="02" title="Mission weighting">
          Similarities are multiplied by mission-purpose weights and averaged over features with data on both sides,
          then scaled to 0&ndash;100.
        </Step>
        <Step index="03" title="Data coverage">
          Coverage is the share of total weight with data. &ge; {Math.round(HIGH_CONFIDENCE_COVERAGE * 100)}% is high,
          &ge; {Math.round(MODERATE_CONFIDENCE_COVERAGE * 100)}% partial, otherwise low. Missing features are never
          imputed.
        </Step>
      </ol>
    </section>
  )
}

function Step({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2.5 rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-6">
      <span className="tt-mono-label text-[var(--tt-accent)]">{index}</span>
      <h3 className="text-base font-semibold text-[var(--tt-light-ink)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--tt-light-ink-secondary)]">{children}</p>
    </li>
  )
}

export function FeatureWeightsSection() {
  return (
    <section id="features" className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="02 / FEATURES"
        title="Environmental features and weights"
        description="Tolerances and weights below are prototype assumptions, not calibrated values."
      />
      <div className="overflow-x-auto rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)]">
        <Table>
          <caption className="sr-only">Environmental features, comparison method, tolerance and mission weights</caption>
          <TableHeader>
            <TableRow className="border-b border-[var(--tt-light-border)] bg-[var(--tt-light-band)]/60 hover:bg-[var(--tt-light-band)]/60">
              <TableHead className="text-xs font-semibold text-[var(--tt-light-ink)]">Feature</TableHead>
              <TableHead className="text-xs font-semibold text-[var(--tt-light-ink)]">Method</TableHead>
              <TableHead className="text-right text-xs font-semibold text-[var(--tt-light-ink)]">Tolerance</TableHead>
              {MISSION_PURPOSES.map((purpose) => (
                <TableHead key={purpose.id} className="text-right text-xs font-semibold text-[var(--tt-light-ink)]">
                  {purpose.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {FEATURES.map((feature) => (
              <TableRow
                key={feature.key}
                className="border-b border-[var(--tt-light-border)] hover:bg-[var(--tt-light-bg)]/60"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--tt-light-ink)]">{feature.label}</span>
                    <span className="text-xs text-[var(--tt-light-ink-muted)]">{feature.description}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-[var(--tt-light-ink-secondary)]">
                  {KIND_LABELS[feature.kind]}
                </TableCell>
                <TableCell className="tt-mono-data text-right text-xs text-[var(--tt-light-ink)]">
                  {feature.tolerance !== undefined
                    ? `${feature.tolerance} ${feature.kind === "logarithmic" ? "dex" : feature.unit}`
                    : "—"}
                </TableCell>
                {MISSION_PURPOSES.map((purpose) => (
                  <TableCell key={purpose.id} className="tt-mono-data text-right text-xs text-[var(--tt-light-ink)]">
                    {(purpose.weights[feature.key] ?? 0).toFixed(1)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

export function DataSourcesSection() {
  const integratedCount = DATA_SOURCES.filter((s) => s.status === "integrated").length
  const candidateCount = DATA_SOURCES.filter((s) => s.status === "candidate").length

  return (
    <section id="sources" className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="03 / DATA SOURCES"
        title="Mission telemetry & candidate archives"
        description={`${integratedCount} primary NASA and ESA datasets are actively ingested in Supabase powering the similarity engine. ${candidateCount} high-resolution raster and polygon archives are queued for automated GIS pipeline ingestion.`}
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {DATA_SOURCES.map((source) => {
          const isIntegrated = source.status === "integrated"
          return (
            <li
              key={source.name}
              className="flex flex-col justify-between gap-3 rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-5 transition-colors hover:border-[var(--tt-light-border-strong)]"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[var(--tt-light-ink)]">
                    {source.sourceUrl ? (
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:text-[var(--tt-accent)]"
                      >
                        <span>{source.name}</span>
                        <ArrowUpRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
                      </a>
                    ) : (
                      source.name
                    )}
                  </h3>
                  <DsHonestyBadge
                    tone={isIntegrated ? "high" : "neutral"}
                    label={isIntegrated ? "Integrated · Live" : "Candidate · Pipeline"}
                  />
                </div>
                <p className="text-xs text-[var(--tt-light-ink-muted)]">
                  <span className="font-medium text-[var(--tt-light-ink-secondary)]">{source.provider}</span> &middot;{" "}
                  {source.scope}
                  {source.resolution && ` · ${source.resolution}`}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--tt-light-ink-secondary)]">
                  <span className="font-medium text-[var(--tt-light-ink)]">Informs: </span>
                  {source.informs}
                </p>
                {source.integrationNotes && (
                  <p className="mt-1 rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] p-2.5 font-mono text-[11px] leading-snug text-[var(--tt-light-ink-secondary)]">
                    {source.integrationNotes}
                  </p>
                )}
              </div>
              {source.version && (
                <div className="truncate font-mono text-[10px] text-[var(--tt-light-ink-muted)]">
                  Version: {source.version}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function LimitationsSection() {
  const limitations = [
    "All scores, measurements and coordinates in this prototype are illustrative and must not be cited as scientific evidence.",
    "Single summary values cannot represent spatial heterogeneity within a region or site.",
    "Tolerances and weights are expert-style guesses awaiting calibration against field campaign outcomes.",
    "Factors such as gravity, atmosphere, radiation and regolith electrostatics are not modelled and cannot be reproduced on Earth.",
    "Access, permitting, logistics and environmental protection status are outside the scope of the score.",
  ]
  return (
    <section id="limitations" className="flex flex-col gap-6">
      <SectionHeading eyebrow="04 / LIMITATIONS" title="What the score does not tell you" />
      <ul className="flex flex-col gap-2.5">
        {limitations.map((item) => (
          <li
            key={item}
            className="flex gap-3 rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--tt-light-ink-secondary)]"
          >
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--tt-accent)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
