import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionHeading } from "@/components/shared/section-heading"
import { DATA_SOURCES } from "@/lib/terratwin/data-sources"
import { FEATURES, MISSION_PURPOSES } from "@/lib/terratwin/features"
import { HIGH_CONFIDENCE_COVERAGE, MODERATE_CONFIDENCE_COVERAGE } from "@/lib/terratwin/similarity"

const KIND_LABELS = { linear: "Linear", logarithmic: "Log₁₀", categorical: "Categorical" } as const

export function ScoringSection() {
  return (
    <section id="scoring" className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="01 · Scoring"
        title="Weighted feature similarity"
        description="Each Earth candidate is compared with the selected target feature by feature. Per-feature similarities are combined using weights that depend on the mission purpose."
      />
      <ol className="grid gap-3 md:grid-cols-3">
        <Step index="A" title="Per-feature similarity">
          Numeric features score 1 − |target − candidate| ÷ tolerance, clamped to 0–1. Grain size uses base-10 logarithm values.
          Lithology scores 1 for an exact match, 0.5 for the same rock family, otherwise 0.
        </Step>
        <Step index="B" title="Mission weighting">
          Similarities are multiplied by mission-purpose weights and averaged over features with data on both sides,
          then scaled to 0–100.
        </Step>
        <Step index="C" title="Data coverage">
          Coverage is the share of total weight with data. ≥ {Math.round(HIGH_CONFIDENCE_COVERAGE * 100)}% is high,
          ≥ {Math.round(MODERATE_CONFIDENCE_COVERAGE * 100)}% partial, otherwise low. Missing features are never
          imputed.
        </Step>
      </ol>
    </section>
  )
}

function Step({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <span className="font-mono text-xs text-primary">{index}</span>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </li>
  )
}

export function FeatureWeightsSection() {
  return (
    <section id="features" className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="02 · Features"
        title="Environmental features and weights"
        description="Tolerances and weights below are prototype assumptions, not calibrated values."
      />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <caption className="sr-only">Environmental features, comparison method, tolerance and mission weights</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Tolerance</TableHead>
              {MISSION_PURPOSES.map((purpose) => (
                <TableHead key={purpose.id} className="text-right">
                  {purpose.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {FEATURES.map((feature) => (
              <TableRow key={feature.key}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{feature.label}</span>
                    <span className="text-xs text-muted-foreground">{feature.description}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{KIND_LABELS[feature.kind]}</TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums">
                  {feature.tolerance !== undefined ? `${feature.tolerance} ${feature.kind === "logarithmic" ? "dex" : feature.unit}` : "—"}
                </TableCell>
                {MISSION_PURPOSES.map((purpose) => (
                  <TableCell key={purpose.id} className="text-right font-mono text-xs tabular-nums">
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
        eyebrow="03 · Data sources"
        title="Mission telemetry & candidate archives"
        description={`${integratedCount} primary NASA and ESA datasets are actively ingested in Supabase powering the similarity engine. ${candidateCount} high-resolution raster and polygon archives are queued for automated GIS pipeline ingestion.`}
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {DATA_SOURCES.map((source) => {
          const isIntegrated = source.status === "integrated"
          return (
            <li
              key={source.name}
              className={`flex flex-col justify-between gap-3 rounded-lg border p-4 transition-colors ${
                isIntegrated
                  ? "border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50"
                  : "border-border/80 bg-card/60 hover:border-border"
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {source.sourceUrl ? (
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:text-cyan-400 hover:underline transition-colors"
                      >
                        {source.name}
                        <ExternalLink className="size-3 shrink-0 opacity-60" />
                      </a>
                    ) : (
                      source.name
                    )}
                  </h3>
                  {isIntegrated ? (
                    <Badge variant="outline" className="shrink-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase tracking-wider">
                      Integrated · Live
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 border-border bg-muted/40 text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
                      Candidate · Pipeline
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">{source.provider}</span> · {source.scope}
                  {source.resolution && ` · ${source.resolution}`}
                </p>
                <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                  <span className="text-muted-foreground font-medium">Informs: </span>
                  {source.informs}
                </p>
                {source.integrationNotes && (
                  <p className="text-[11px] font-mono text-muted-foreground/90 mt-1 leading-snug rounded bg-muted/30 p-2 border border-border/40">
                    {source.integrationNotes}
                  </p>
                )}
              </div>
              {source.version && (
                <div className="text-[10px] font-mono text-muted-foreground/70 truncate">
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
      <SectionHeading eyebrow="04 · Limitations" title="What the score does not tell you" />
      <ul className="flex flex-col gap-2">
        {limitations.map((item) => (
          <li key={item} className="flex gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
