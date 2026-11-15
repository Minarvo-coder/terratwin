"use client"

import { useMemo, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { DsButton, DsSectionHeader, DsSegmentedControl } from "@/components/ds/primitives"
import { DsPlanetCard } from "@/components/ds/editorial-cards"
import { DsRankedListCard } from "@/components/ds/explorer-widgets"
import { getMissionPurpose } from "@/lib/terratwin/features"
import { SAMPLE_CANDIDATES, SAMPLE_TARGETS } from "@/lib/terratwin/sample-dataset"
import { rankCandidates } from "@/lib/terratwin/similarity"

export function ProblemSection() {
  const [destination, setDestination] = useState<"mars" | "moon">("mars")
  const [missionFocus, setMissionFocus] = useState<"rover-testing" | "geological-research">("rover-testing")

  const rankedPreview = useMemo(() => {
    const target =
      SAMPLE_TARGETS.find((t) => t.body === destination && t.id.includes("jezero")) ??
      SAMPLE_TARGETS.find((t) => t.body === destination) ??
      SAMPLE_TARGETS[0]
    const purpose = getMissionPurpose(missionFocus) ?? getMissionPurpose("rover-testing")!
    const ranked = rankCandidates(target, SAMPLE_CANDIDATES, purpose).slice(0, 3)

    const top = ranked[0]
    return {
      target,
      featuredTitle: top?.candidate.name ?? "Hanksville badlands",
      featuredLocation: top?.candidate.country ?? "United States",
      items: ranked.map((entry, idx) => ({
        rank: String(idx + 1).padStart(2, "0"),
        name: entry.candidate.name,
        subtitle: `${entry.candidate.country} · ${Math.round(entry.coverage * 100)}% comparable coverage`,
        score: `${(entry.score ?? 0).toFixed(1)}%`,
      })),
    }
  }, [destination, missionFocus])

  return (
    <>
      {/* Section 01: Planetary Perspective */}
      <section className="tt-surface-light py-20 md:py-28">
        <div className="tt-container space-y-12">
          <DsSectionHeader
            index="01"
            marker="A PLANETARY PERSPECTIVE"
            rightCaption="Different worlds. Comparable questions."
            line1="A world of difference."
            line2="A terrain of similarities."
            rightSlot="Compare the big picture, then look closer. We match specific environmental dimensions, because no place on Earth is a perfect planetary twin."
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <DsPlanetCard
              planet="earth"
              eyebrow="01 / THE PROVING GROUND"
              title="Earth"
              tagline="Home."
              description="Familiar ground. Extraordinary possibilities. Deserts, volcanic plains, and polar valleys become our field laboratories."
              imageSrc="/images/earth-marble.jpg"
              imageAlt="Earth planetary view"
              specs={[
                { label: "Diameter", value: "12,742 km" },
                { label: "Surface gravity", value: "9.81 m/s²" },
                { label: "Solar day", value: "24 hours" },
                { label: "Atmosphere", value: "Nitrogen & oxygen" },
              ]}
              ctaLabel="Discover Earth analogs"
              ctaHref="/discover"
            />
            <DsPlanetCard
              planet="mars"
              eyebrow="02 / THE NEXT FRONTIER"
              title="Mars"
              tagline="Possibility."
              description="Ancient deltas and an arid surface. Find terrestrial terrain to put rover mobility and geological research to the test."
              imageSrc="/textures/planets/mars.jpg"
              imageAlt="Mars planetary view"
              specs={[
                { label: "Diameter", value: "6,779 km" },
                { label: "Surface gravity", value: "3.71 m/s²" },
                { label: "Solar day", value: "24.6 hours" },
                { label: "Atmosphere", value: "Thin, mostly CO2" },
              ]}
              ctaLabel="Explore Mars targets"
              ctaHref="/explore?body=mars"
            />
            <DsPlanetCard
              planet="moon"
              eyebrow="03 / OUR NEAREST NEIGHBOR"
              title="Moon"
              tagline="Discovery."
              description="Basaltic plains and cratered highlands. Explore Earth analogs for regolith, surface morphology, and lunar fieldwork."
              imageSrc="/textures/planets/moon.jpg"
              imageAlt="Moon planetary view"
              specs={[
                { label: "Diameter", value: "3,475 km" },
                { label: "Surface gravity", value: "1.62 m/s²" },
                { label: "Solar day", value: "29.5 Earth days*" },
                { label: "Atmosphere", value: "Trace exosphere" },
              ]}
              ctaLabel="Explore Moon targets"
              ctaHref="/explore?body=moon"
            />
          </div>

          <p className="text-[11px] leading-relaxed text-[var(--tt-light-ink-muted)]">
            Rounded body-level reference values, separate from analog scores. *The Moon&apos;s solar day is its
            day-night cycle. Earth sites cannot reproduce extraterrestrial gravity or atmosphere.{" "}
            <a
              href="https://science.nasa.gov/solar-system/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-4 hover:text-[var(--tt-light-ink)]"
            >
              <span>Reference: NASA Solar System</span>
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        </div>
      </section>

      {/* Section 02: Dark Showcase */}
      <section className="tt-surface-showcase py-20 md:py-28">
        <div className="tt-container space-y-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--tt-dark-border)] pb-4">
            <span className="tt-mono-label text-[var(--tt-dark-ink-muted)]">02 / MEET YOUR EARTH ANALOG</span>
            <span className="text-xs text-[var(--tt-dark-ink-muted)]">Interactive sample · illustrative values</span>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-5">
              <h2 className="tt-display-l">
                <span className="block text-[var(--tt-dark-ink)]">Far-out terrain.</span>
                <span className="block text-[var(--tt-dark-periwinkle)]">Right here on Earth.</span>
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-[var(--tt-dark-ink-secondary)]">
                Change the destination. Change the mission. See how the same transparent engine finds a different kind
                of common ground.
              </p>

              <div className="space-y-5 pt-2">
                <div className="space-y-2">
                  <span className="tt-mono-label block text-[var(--tt-dark-ink-muted)]">DESTINATION</span>
                  <DsSegmentedControl
                    tone="dark"
                    value={destination}
                    onChange={setDestination}
                    ariaLabel="Select showcase destination"
                    options={[
                      { value: "mars", label: "Mars" },
                      { value: "moon", label: "Moon" },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <span className="tt-mono-label block text-[var(--tt-dark-ink-muted)]">MISSION FOCUS</span>
                  <DsSegmentedControl
                    tone="dark"
                    value={missionFocus}
                    onChange={setMissionFocus}
                    ariaLabel="Select showcase mission focus"
                    options={[
                      { value: "rover-testing", label: "Rover testing" },
                      { value: "geological-research", label: "Geological research" },
                    ]}
                  />
                </div>
              </div>

              <div className="pt-2">
                <DsButton
                  variant="secondary"
                  href={`/explore?body=${destination}&purpose=${missionFocus}`}
                  className="text-[var(--tt-dark-ink)]"
                >
                  Go deeper in the explorer
                </DsButton>
              </div>
            </div>

            <div className="lg:col-span-7">
              <DsRankedListCard
                imageSrc="/images/analog-terrain.png"
                imageAlt={`${rankedPreview.featuredTitle} analog terrain`}
                routeLabel={`${rankedPreview.target.name} → EARTH`}
                featuredTitle={rankedPreview.featuredTitle}
                featuredLocation={rankedPreview.featuredLocation}
                items={rankedPreview.items}
                footerLabel="Inspect feature-by-feature comparison"
                footerHref={`/explore?body=${destination}&purpose=${missionFocus}`}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
