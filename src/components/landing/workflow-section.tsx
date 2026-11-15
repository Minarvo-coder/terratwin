import { Activity, Database, Layers, MapPin, Rocket, SlidersHorizontal } from "lucide-react"
import { DsButton } from "@/components/ds/primitives"
import { DsFeatureTrioCard, DsStepColumn } from "@/components/ds/editorial-cards"

export function WorkflowSection() {
  return (
    <>
      {/* Section 03: Soft Gray Feature Trio */}
      <section className="tt-surface-band py-16 md:py-24">
        <div className="tt-container">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <DsFeatureTrioCard
              index="01"
              icon={<Rocket className="h-5 w-5" />}
              title="Test here. Go further."
              description="Rovers and field procedures need rigorous testing before they leave Earth. Relevant terrain gives teams a practical place to learn."
            />
            <DsFeatureTrioCard
              index="02"
              icon={<SlidersHorizontal className="h-5 w-5" />}
              title="Find the right ground."
              description="Choose a field site for its physical relevance to your mission, with explicit weights for rover mobility or geological research."
            />
            <DsFeatureTrioCard
              index="03"
              icon={<Layers className="h-5 w-5" />}
              title="Bring the evidence together."
              description="Compare terrain, temperature, rock cover, grain size, and lithology in one workspace, with sources and data gaps in view."
            />
          </div>
        </div>
      </section>

      {/* Section 04: Four Grounded Steps */}
      <section className="tt-surface-light py-20 md:py-28">
        <div className="tt-container space-y-14">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--tt-line)] pb-4">
              <span className="tt-mono-label text-[var(--tt-ink-muted)]">04 / FROM ORBIT TO OUTDOORS</span>
              <span className="text-xs text-[var(--tt-ink-muted)]">An open methodology</span>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 className="tt-display-l">
                <span className="block text-[var(--tt-ink)]">A giant leap.</span>
                <span className="block text-[var(--tt-ink-muted)]">Four grounded steps.</span>
              </h2>
              <DsButton variant="primary" size="lg" href="/explore">
                Open the explorer
              </DsButton>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <DsStepColumn
              step="01"
              icon={<Database className="h-4 w-4" />}
              title="Choose your world"
              description="Start with a lunar or Martian target and inspect its environmental profile."
            />
            <DsStepColumn
              step="02"
              icon={<SlidersHorizontal className="h-4 w-4" />}
              title="Define the mission"
              description="Prioritize rover testing or geological field research with explicit feature weights."
            />
            <DsStepColumn
              step="03"
              icon={<Activity className="h-4 w-4" />}
              title="Compare the evidence"
              description="Inspect normalized similarity, coverage, missing data, and feature-level differences."
            />
            <DsStepColumn
              step="04"
              icon={<MapPin className="h-4 w-4" />}
              title="Find your field site"
              description="Explore the map, terrain and elevation, or build a complementary multi-site portfolio."
            />
          </div>

          {/* Subtle Editorial Closing CTA */}
          <div className="flex flex-col justify-between gap-6 rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-8 md:flex-row md:items-center">
            <div className="space-y-2">
              <span className="tt-mono-label text-[var(--tt-light-ink-muted)]">READY TO INSPECT</span>
              <h3 className="text-xl font-semibold tracking-tight text-[var(--tt-light-ink)]">
                Launch the live Explorer or scan new global coordinates.
              </h3>
              <p className="max-w-xl text-sm text-[var(--tt-light-ink-secondary)]">
                Every score is deterministic, normalized across 8 environmental dimensions, and backed by transparent
                provenance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <DsButton variant="primary" href="/explore">
                Open Explorer
              </DsButton>
              <DsButton variant="secondary" href="/discover">
                Discovery Scanner
              </DsButton>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
