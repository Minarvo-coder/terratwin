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
        <div role="note" className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-4 text-sm leading-relaxed">
          <p className="font-medium text-cyan-400">Integrated Planetary & Terrestrial Telemetry</p>
          <p className="mt-1 text-muted-foreground">
            TerraTwin queries 8 official NASA & ESA dataset sources stored in PostgreSQL via Supabase. Telemetry includes MOLA topography, LOLA laser altimetry, NASA POWER 25-year climatology, MSL Curiosity REMS, Mars 2020 MEDA, LRO Diviner radiometry, and SRTM/MODIS surface observations.
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
