import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import { FEATURES } from "@/lib/terratwin/features"
import {
  formatFeatureValue,
  getFeatureComparabilityInfo,
  getProvenanceBadgeInfo,
} from "@/lib/terratwin/format"
import type { PlanetaryTarget } from "@/lib/terratwin/types"
import { Cpu, ShieldCheck } from "lucide-react"

export function TargetProfile({ target }: { target: PlanetaryTarget }) {
  return (
    <section aria-labelledby="target-profile-heading" className="flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Cpu className="size-3.5 text-sky-400" />
          <h2 id="target-profile-heading">
            Target Environment Profile
            <span className="sr-only">TARGET SENSOR SUITE</span>
          </h2>
        </div>
        {target.isVerified ? (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            <ShieldCheck className="size-3 text-emerald-400" />
            <span>PDS Verified</span>
          </span>
        ) : (
          <IllustrativeBadge label="Illustrative demo data" />
        )}
      </div>

      <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
        <div className="text-[11px] font-medium text-slate-400">Target Overview</div>
        <div className="text-sm font-semibold text-white mt-0.5">{target.name}</div>
        <p className="text-xs leading-relaxed text-slate-300 mt-1">{target.summary}</p>
      </div>

      <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
        <span className="font-medium text-slate-300">Measured Parameters</span>
        <span className="font-mono text-[11px] text-sky-400">{FEATURES.length} variables</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        {FEATURES.map((feature) => {
          const val = target.environment[feature.key]
          const isLithology = feature.key === "lithology"
          const prov = target.provenanceMap?.[feature.key]
          const isVerified = prov?.status === "verified"
          const isMissing = val === null || val === undefined
          const badge = getProvenanceBadgeInfo(prov?.sourceTitle, prov?.status)
          const compInfo = getFeatureComparabilityInfo(feature.key)

          return (
            <div
              key={feature.key}
              className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/40 p-2.5 transition hover:border-slate-700 hover:bg-slate-900/60"
            >
              <div className="flex items-center justify-between gap-1">
                <dt className="text-[11px] text-slate-400 truncate">
                  {feature.shortLabel}
                </dt>
                <div className="flex items-center gap-1 shrink-0">
                  {isVerified && badge.variant === "pds" && (
                    <span
                      title={prov?.sourceTitle || "Verified NASA PDS"}
                      className="rounded bg-emerald-950/80 border border-emerald-500/30 px-1 py-0.2 text-[8px] font-semibold text-emerald-300 uppercase"
                    >
                      {badge.label}
                    </span>
                  )}
                  {compInfo.classification === "NOT_COMPARABLE" && (
                    <span
                      title="Contextual parameter; excluded from similarity denominator."
                      className="rounded bg-rose-950/60 border border-rose-500/30 px-1 py-0.2 text-[8px] font-semibold text-rose-300 uppercase"
                    >
                      Excl
                    </span>
                  )}
                </div>
              </div>
              <dd className="font-mono text-xs font-semibold mt-1 truncate">
                {isMissing ? (
                  <span className="text-slate-500 text-[11px] font-normal font-sans">No data</span>
                ) : isLithology ? (
                  <span className="capitalize text-emerald-400 font-sans">{String(val)}</span>
                ) : (
                  <span className={isVerified ? "text-emerald-300" : "text-sky-300"}>
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
