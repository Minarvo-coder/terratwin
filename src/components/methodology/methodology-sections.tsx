import { Badge } from "@/components/ui/badge"
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
                    {purpose.weights[feature.key].toFixed(1)}
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
  return (
    <section id="sources" className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="03 · Data sources"
        title="Current and candidate data sources"
        description="Only the illustrative sample dataset is used today. The remaining sources are candidates for a future evidence-based version and are not yet integrated."
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {DATA_SOURCES.map((source) => (
          <li key={source.name} className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium">{source.name}</h3>
              <Badge variant={source.status === "in-use" ? "default" : "outline"} className="shrink-0">
                {source.status === "in-use" ? "In use (sample)" : "Not integrated"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {source.provider} · {source.scope}
            </p>
            <p className="text-sm text-muted-foreground">{source.informs}</p>
          </li>
        ))}
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
