import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import { FEATURES } from "@/lib/terratwin/features"
import { formatFeatureValue } from "@/lib/terratwin/format"
import type { PlanetaryTarget } from "@/lib/terratwin/types"
import { Cpu, ShieldCheck } from "lucide-react"

export function TargetProfile({ target }: { target: PlanetaryTarget }) {
  return (
    <section aria-labelledby="target-profile-heading" className="flex flex-col gap-3 font-mono">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
          <Cpu className="size-3 text-cyan-400" />
          <h2 id="target-profile-heading">TARGET SENSOR SUITE</h2>
        </div>
        {target.isVerified ? (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
            <ShieldCheck className="size-2.5 text-emerald-400" />
            <span>PDS VERIFIED</span>
          </span>
        ) : (
          <IllustrativeBadge label="Illustrative demo data" />
        )}
      </div>

      <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
        <div className="text-[10px] text-slate-500 uppercase">ACTIVE TARGET BRIEF</div>
        <div className="text-xs font-semibold text-slate-200 mt-0.5">{target.name}</div>
        <p className="text-[11px] font-sans leading-relaxed text-slate-400 mt-1">{target.summary}</p>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 flex items-center justify-between">
        <span>ENVIRONMENTAL TELEMETRY</span>
        <span className="text-cyan-400 font-bold">{FEATURES.length} CHANNELS</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        {FEATURES.map((feature) => {
          const val = target.environment[feature.key]
          const isLithology = feature.key === "lithology"
          const prov = target.provenanceMap?.[feature.key]
          const isVerified = prov?.status === "verified"
          const isMissing = val === null || val === undefined

          return (
            <div
              key={feature.key}
              className="flex flex-col rounded border border-slate-800/90 bg-slate-900/60 p-2 transition hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <dt className="text-[10px] text-slate-400 truncate uppercase tracking-wider">
                  {feature.shortLabel}
                </dt>
                {isVerified && (
                  <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" title="Verified NASA/PDS Record" />
                )}
              </div>
              <dd className="font-mono text-[11px] font-semibold mt-0.5 truncate">
                {isMissing ? (
                  <span className="text-slate-500 text-[10px]">No data</span>
                ) : isLithology ? (
                  <span className="capitalize text-emerald-400">{String(val)}</span>
                ) : (
                  <span className={isVerified ? "text-emerald-300" : "text-cyan-300"}>
                    {formatFeatureValue(feature.key, val)}
                  </span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
