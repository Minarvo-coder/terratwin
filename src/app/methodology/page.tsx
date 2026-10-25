import type { Metadata } from "next"
import { SectionHeading } from "@/components/shared/section-heading"
import {
  DataSourcesSection,
  FeatureWeightsSection,
  LimitationsSection,
  ScoringSection,
} from "@/components/methodology/methodology-sections"
import { SAMPLE_DATASET_META } from "@/lib/terratwin/sample-dataset"

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
        <div role="note" className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed">
          <p className="font-medium text-warning">Illustrative prototype</p>
          <p className="mt-1 text-muted-foreground">{SAMPLE_DATASET_META.notice}</p>
        </div>
      </div>
      <ScoringSection />
      <FeatureWeightsSection />
      <DataSourcesSection />
      <LimitationsSection />
    </main>
  )
}
