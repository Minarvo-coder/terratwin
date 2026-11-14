import Link from "next/link"
import { Radar, CheckCircle2, ChevronRight, Sliders, MapPin, Database } from "lucide-react"

const PHASES = [
  {
    phase: "PHASE 01",
    icon: Database,
    title: "Target & Mission Profile Selection",
    body: "Select a lunar or Martian exploration target across 12 environmental parameters and apply one of 4 mission profiles: Rover Testing, Geological Research, Lunar Base & ISRU, or Astrobiology.",
  },
  {
    phase: "PHASE 02",
    icon: Sliders,
    title: "3D/2D Flight Deck & Portfolio Optimizer",
    body: "Inspect 8 canonical terrestrial benchmarks in the /explore workstation, audit normalized tolerance scores, and combine complementary sites in the Multi-Site Analog Portfolio Optimizer.",
  },
  {
    phase: "PHASE 03",
    icon: Radar,
    title: "Live Regional Scanner & 31-Site Atlas",
    body: "Scan bounded WGS84 regions on /discover using live Open-Meteo DEM, NASA POWER climatology, and Macrostrat geology, or screen 31 curated global sites across 18 countries and 9 categories.",
  },
  {
    phase: "PHASE 04",
    icon: MapPin,
    title: "Scientific Intelligence & Research Exports",
    body: "Audit per-parameter provenance and the ≥40% reliable coverage gate, record immutable research snapshots with cloud RLS sync, and export PDF, CSV, and JSON dossiers.",
  },
]

export function WorkflowSection() {
  return (
    <section className="relative py-20 bg-slate-950 border-b border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-800 pb-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-sky-400 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>HOW TERRATWIN WORKS</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From Planetary Telemetry to Calibrated Analog Sites
            </h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white w-fit border border-slate-700/60"
          >
            <span>Launch Explorer</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>

        {/* Phase Timeline Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon
            return (
              <div
                key={phase.title}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xs hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                      {phase.phase}
                    </span>
                    <span className="font-mono text-xs text-slate-400">0{idx + 1}/04</span>
                  </div>

                  <div className="mb-4 inline-flex size-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800 text-sky-400">
                    <Icon className="size-4" />
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {phase.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-400">
                    {phase.body}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800 flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  <span>DETERMINISTIC COMPLIANCE</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Space Apps Hackathon Notice Banner */}
        <div className="mt-12 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300 uppercase">
              STATUS
            </span>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              <strong className="text-white">NASA Space Apps Challenge Architecture:</strong> Combines 8 canonical benchmarks + 31 curated Global Atlas sites with live bounded regional scans (Open-Meteo DEM, NASA POWER, Macrostrat), &ge;40% reliable coverage gating, and cloud-synced research exports.
            </p>
          </div>
          <Link
            href="/discover"
            className="shrink-0 rounded-md bg-sky-400 px-4 py-2 font-sans text-xs font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Open Discovery Scanner &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
