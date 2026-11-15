"use client"

import { useState } from "react"
import { ArrowDown, Compass, Pause, Play } from "lucide-react"
import { DsButton, DsEyebrow, DsStatStrip } from "@/components/ds/primitives"
import { DsHeroGlassCard } from "@/components/ds/explorer-widgets"
import { cn } from "@/lib/utils"

export function LandingHero() {
  const [world, setWorld] = useState<"mars" | "moon">("mars")
  const [motionPaused, setMotionPaused] = useState(false)

  const target =
    world === "mars"
      ? {
          name: "Jezero crater delta",
          coords: "18.38° N / 77.58° E",
          href: "/explore?body=mars",
        }
      : {
          name: "Mare Tranquillitatis",
          coords: "0.67° N / 23.47° E",
          href: "/explore?body=moon",
        }

  return (
    <section className="tt-surface-light overflow-hidden pt-12 pb-16 md:pt-20 md:pb-20">
      <div className="tt-container space-y-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Copy Column */}
          <div className="space-y-7 lg:col-span-6">
            <DsEyebrow label="AN EARTHBOUND START TO OTHER WORLDS" />

            <h1 className="tt-display-xl text-[var(--tt-light-ink)]">
              <span className="block">Other worlds.</span>
              <span className="block">Closer than</span>
              <span className="inline-flex items-baseline gap-2">
                <span>you think.</span>
                <span className="text-[var(--tt-accent)]" aria-hidden="true">
                  *
                </span>
              </span>
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-[var(--tt-light-ink-secondary)] md:text-lg">
              The next giant leap starts here. Discover the places on Earth that help us understand, test, and explore
              the Moon and Mars.
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <DsButton variant="primary" size="lg" href="/explore">
                Explore the analogs
              </DsButton>
              <DsButton variant="secondary" size="lg" href="/methodology">
                Behind the science
              </DsButton>
            </div>

            <div className="flex items-center gap-2 pt-3 text-xs text-[var(--tt-light-ink-muted)]">
              <Compass className="h-3.5 w-3.5 text-[var(--tt-light-ink-secondary)]" aria-hidden="true" />
              <span>Three worlds. One shared ground.</span>
            </div>
          </div>

          {/* Right Orbital Composition */}
          <div className="relative min-h-[420px] sm:min-h-[460px] lg:col-span-6">
            <div className="flex items-center justify-between text-[11px] text-[var(--tt-light-ink-muted)]">
              <button
                type="button"
                onClick={() => setMotionPaused((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-[var(--tt-radius-pill)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] px-3 py-1 text-[11px] font-medium text-[var(--tt-light-ink-secondary)] transition-colors hover:text-[var(--tt-light-ink)] cursor-pointer"
              >
                {motionPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span>{motionPaused ? "Resume motion" : "Pause motion"}</span>
              </button>
              <span className="tt-mono-label">SOLAR NEIGHBORHOOD / 01–03</span>
            </div>

            {/* Elliptical Orbit SVG */}
            <svg
              viewBox="0 0 560 400"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-75"
            >
              <ellipse
                cx="285"
                cy="210"
                rx="240"
                ry="120"
                transform="rotate(-14 285 210)"
                fill="none"
                stroke="rgba(17,19,24,0.08)"
                strokeWidth="1"
              />
              <ellipse
                cx="285"
                cy="210"
                rx="165"
                ry="85"
                transform="rotate(-14 285 210)"
                fill="none"
                stroke="rgba(17,19,24,0.07)"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
            </svg>

            {/* Earth */}
            <div
              className={cn(
                "relative mt-6 ml-4 sm:ml-14 w-fit transition-transform duration-700",
                !motionPaused && "hover:-translate-y-1",
              )}
            >
              <div className="h-44 w-44 sm:h-48 sm:w-48 overflow-hidden rounded-full shadow-[var(--tt-shadow-float)] ring-1 ring-black/10">
                <img
                  src="/images/earth-marble.jpg"
                  alt="Earth orbital view"
                  className="h-full w-full scale-[1.32] object-cover"
                />
              </div>
            </div>

            {/* Earth caption */}
            <div className="mt-4 ml-2 sm:ml-6">
              <span className="tt-mono-label block text-[var(--tt-light-ink-muted)]">01 / EARTH</span>
              <span className="mt-0.5 block text-xs text-[var(--tt-light-ink-secondary)]">Our proving ground</span>
            </div>

            {/* Moon */}
            <div className="absolute top-14 right-6 sm:right-12 flex flex-col items-end">
              <div className="h-14 w-14 overflow-hidden rounded-full shadow-[var(--tt-shadow-soft)] ring-1 ring-black/10">
                <img src="/textures/planets/moon.jpg" alt="Moon surface" className="h-full w-full object-cover" />
              </div>
            </div>

            {/* Mars */}
            <div className="absolute right-4 bottom-14 sm:right-10">
              <div className="h-32 w-32 sm:h-36 sm:w-36 overflow-hidden rounded-full shadow-[var(--tt-shadow-float)] ring-1 ring-black/10">
                <img src="/textures/planets/mars.jpg" alt="Mars surface" className="h-full w-full object-cover" />
              </div>
            </div>

            {/* Floating Selector Card */}
            <div className="relative z-10 mt-6 sm:mt-0 sm:absolute sm:bottom-2 sm:left-16">
              <DsHeroGlassCard
                world={world}
                onWorldChange={setWorld}
                targetName={target.name}
                coordinates={target.coords}
                href={target.href}
              />
            </div>

            <p className="mt-3 text-right text-[10px] text-[var(--tt-light-ink-muted)] sm:absolute sm:right-2 sm:bottom-0">
              Planetary imagery &middot; illustrative composition
            </p>
          </div>
        </div>

        <DsStatStrip
          lead={
            <span className="inline-flex items-center gap-1.5">
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>A little perspective</span>
            </span>
          }
          items={[
            { value: "03", labelTop: "Worlds", labelBottom: "connected" },
            { value: "08", labelTop: "Core scoring", labelBottom: "dimensions" },
            { value: "01", labelTop: "Transparent", labelBottom: "methodology" },
          ]}
          tailTitle="BUILT FOR THE"
          tailValue="NASA Space Apps Challenge"
        />
      </div>
    </section>
  )
}
