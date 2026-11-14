import type { Metadata } from "next"
import { SectionHeading } from "@/components/shared/section-heading"
import {
  DataSourcesSection,
  FeatureWeightsSection,
  LimitationsSection,
  ScoringSection,
} from "@/components/methodology/methodology-sections"

export const metadata: Metadata = {
  title: "Methodology & Data Sources",
  description: "How TerraTwin computes illustrative Earth analog similarity scores, and which data sources it uses.",
}

export default function MethodologyPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-6">
        <SectionHeading
          as="h1"
          eyebrow="Methodology"
          title="How candidate rankings are produced"
          description="TerraTwin ranks Earth locations by how closely their environmental features resemble a selected Moon or Mars target, weighted for a mission purpose."
        />
        <div role="note" className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm leading-relaxed">
          <p className="font-semibold text-white">Integrated Planetary &amp; Terrestrial Telemetry</p>
          <p className="mt-1 text-slate-400">
            TerraTwin normalizes 12 planetary and terrestrial parameters via linear and logarithmic tolerances, and evaluates mission-weighted similarity across 4 profiles. Environmental telemetry sources include NASA MOLA, LRO LOLA/Diviner, NASA POWER 25-year climatology, Copernicus 90m DEM, and Macrostrat geology.
          </p>
        </div>
      </div>
      <ScoringSection />
      <FeatureWeightsSection />
      <DataSourcesSection />
      <LimitationsSection />
    </main>
  )
}
