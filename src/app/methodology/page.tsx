import type { Metadata } from "next"
import { SectionHeading } from "@/components/shared/section-heading"
import {
  DataSourcesSection,
  FeatureWeightsSection,
  LimitationsSection,
  ScoringSection,
} from "@/components/methodology/methodology-sections"

export const metadata: Metadata = {
  title: "Methodology & Data Sources | TerraTwin",
  description: "How TerraTwin computes illustrative Earth analog similarity scores, and which data sources it uses.",
}

export default function MethodologyPage() {
  return (
    <main className="tt-surface-light min-h-screen py-14 md:py-20">
      <div className="tt-container flex flex-col gap-16">
        <div className="flex flex-col gap-6 border-b border-[var(--tt-light-border)] pb-10">
          <SectionHeading
            as="h1"
            eyebrow="METHODOLOGY"
            title="How candidate rankings are produced"
            description="TerraTwin ranks Earth locations by how closely their environmental features resemble a selected Moon or Mars target, weighted for a mission purpose."
          />
          <div
            role="note"
            className="rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-6 text-sm leading-relaxed shadow-[var(--tt-shadow-soft)]"
          >
            <p className="font-semibold text-[var(--tt-light-ink)]">
              Integrated Planetary &amp; Terrestrial Telemetry
            </p>
            <p className="mt-1.5 text-[var(--tt-light-ink-secondary)]">
              TerraTwin normalizes 12 planetary and terrestrial parameters via linear and logarithmic tolerances, and
              evaluates mission-weighted similarity across 4 profiles. Environmental telemetry sources include NASA MOLA,
              LRO LOLA/Diviner, NASA POWER 25-year climatology, Copernicus 90m DEM, and Macrostrat geology.
            </p>
          </div>
        </div>
        <ScoringSection />
        <FeatureWeightsSection />
        <DataSourcesSection />
        <LimitationsSection />
      </div>
    </main>
  )
}
