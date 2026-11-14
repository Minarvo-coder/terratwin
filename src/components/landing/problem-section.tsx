import { Layers, Route, Rocket, AlertCircle } from "lucide-react"

const PROBLEMS = [
  {
    icon: Rocket,
    code: "PROBLEM 01",
    tag: "TESTING SCARCITY",
    title: "Off-Earth Testing Scarcity",
    body: "Every single hour of rover operation or astronaut EVA on the lunar surface or Mars carries astronomical expenditure. Over 99% of mission validation, mechanical wear tests, and autonomous obstacle navigation protocols must be verified in terrestrial conditions.",
  },
  {
    icon: Route,
    code: "PROBLEM 02",
    tag: "SUBJECTIVE SELECTION",
    title: "Subjective Field Site Selection",
    body: "Analog field expeditions have historically been picked via academic habit, geographical convenience, or anecdotal reputation rather than transparent, multi-spectral parameter comparisons against target planetary bodies.",
  },
  {
    icon: Layers,
    code: "PROBLEM 03",
    tag: "DATA SILOS",
    title: "Siloed Spectral & Terrain Data",
    body: "Surface temperature ranges, aridity indices, grain size distributions, and mineralogical breccias currently reside in disparate planetary archives. Side-by-side dimensional comparison has historically been slow and manual.",
  },
]

export function ProblemSection() {
  return (
    <section className="relative border-b border-slate-800/80 py-20 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs text-sky-400 mb-2">
            <AlertCircle className="size-3.5" />
            <span>OPERATIONAL BOTTLENECK</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Why Terrestrial Analog Selection Must Be Algorithmic
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            No single terrestrial site is a 100% clone of the Moon or Mars. Gravity and atmospheric pressure differ radically. 
            The scientific imperative is isolating <span className="text-sky-300 font-medium">which specific dimensions matter</span> for a given mission objective.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, code, tag, title, body }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xs hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4 font-mono text-xs">
                  <span className="rounded bg-slate-800 border border-slate-700/60 px-2 py-0.5 text-slate-300 font-medium">
                    {code}
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-wider uppercase">{tag}</span>
                </div>
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800 text-sky-400">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {body}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 font-mono text-[11px] text-slate-400 pt-4 border-t border-slate-800">
                <span>TERRATWIN SOLUTION:</span>
                <span className="text-sky-400 font-medium">VECTOR SIMILARITY ENGINE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
