import { IllustrativeBadge } from "@/components/shared/illustrative-badge"
import { FEATURES } from "@/lib/terratwin/features"
import { formatFeatureValue } from "@/lib/terratwin/format"
import type { PlanetaryTarget } from "@/lib/terratwin/types"

export function TargetProfile({ target }: { target: PlanetaryTarget }) {
  return (
    <section aria-labelledby="target-profile-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="target-profile-heading" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Target profile
        </h2>
        <IllustrativeBadge />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{target.summary}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {FEATURES.map((feature) => (
          <div key={feature.key} className="flex flex-col">
            <dt className="text-muted-foreground">{feature.shortLabel}</dt>
            <dd className="font-mono tabular-nums">{formatFeatureValue(feature.key, target.environment[feature.key])}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
