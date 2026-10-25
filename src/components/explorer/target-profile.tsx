import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import { FEATURES } from "@/lib/terratwin/features"
import { formatFeatureValue } from "@/lib/terratwin/format"
import type { PlanetaryTarget } from "@/lib/terratwin/types"
import { Cpu, Thermometer, Mountain, Radio } from "lucide-react"

export function TargetProfile({ target }: { target: PlanetaryTarget }) {
  return (
    <section aria-labelledby="target-profile-heading" className="flex flex-col gap-3 font-mono">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
          <Cpu className="size-3 text-cyan-400" />
          <h2 id="target-profile-heading">TARGET SENSOR SUITE</h2>
        </div>
        <IllustrativeBadge />
      </div>

      <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
        <div className="text-[10px] text-slate-500 uppercase">ACTIVE TARGET BRIEF</div>
        <div className="text-xs font-semibold text-slate-200 mt-0.5">{target.name}</div>
        <p className="text-[11px] font-sans leading-relaxed text-slate-400 mt-1">{target.summary}</p>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 flex items-center justify-between">
        <span>ENVIRONMENTAL TELEMETRY</span>
        <span className="text-cyan-400 font-bold">8 CHANNELS</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        {FEATURES.map((feature) => {
          const val = target.environment[feature.key]
          const isLithology = feature.key === "lithology"
          return (
            <div
              key={feature.key}
              className="flex flex-col rounded border border-slate-800/90 bg-slate-900/60 p-2 transition hover:border-slate-700"
            >
              <dt className="text-[10px] text-slate-400 truncate uppercase tracking-wider">
                {feature.shortLabel}
              </dt>
              <dd className="font-mono text-[11px] font-semibold text-cyan-300 mt-0.5 truncate">
                {isLithology ? (
                  <span className="capitalize text-emerald-400">{String(val || "N/A")}</span>
                ) : (
                  formatFeatureValue(feature.key, val)
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
