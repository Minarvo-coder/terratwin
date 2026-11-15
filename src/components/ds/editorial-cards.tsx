import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   DsPlanetCard
   ========================================================================== */
export interface DsPlanetSpecRow {
  label: string;
  value: string;
}

export interface DsPlanetCardProps {
  planet: "earth" | "mars" | "moon";
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  specs: DsPlanetSpecRow[];
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}

const PLANET_SURFACE: Record<DsPlanetCardProps["planet"], string> = {
  earth: "bg-[var(--tt-planet-earth)]",
  mars: "bg-[var(--tt-planet-mars)]",
  moon: "bg-[var(--tt-planet-moon)]",
};

export function DsPlanetCard({
  planet,
  eyebrow,
  title,
  tagline,
  description,
  imageSrc,
  imageAlt,
  specs,
  ctaLabel,
  ctaHref,
  className,
}: DsPlanetCardProps) {
  return (
    <Link
      href={ctaHref}
      className={cn(
        "group flex flex-col justify-between rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] p-7 text-[var(--tt-light-ink)] transition-transform duration-[var(--tt-duration)] ease-[var(--tt-ease)] hover:-translate-y-0.5",
        PLANET_SURFACE[planet],
        className,
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="tt-mono-label text-[var(--tt-light-ink-muted)]">{eyebrow}</span>
          <ArrowUpRight className="h-4 w-4 text-[var(--tt-light-ink-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--tt-light-ink)]" />
        </div>

        <div className="my-8 flex items-center justify-center">
          <div className="h-32 w-32 overflow-hidden rounded-full shadow-[var(--tt-shadow-soft)] ring-1 ring-black/10">
            <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-2xl font-semibold tracking-tight text-[var(--tt-light-ink)]">{title}</h3>
          <span className="text-xs text-[var(--tt-light-ink-muted)]">{tagline}</span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[var(--tt-light-ink-secondary)]">{description}</p>
      </div>

      <div className="mt-7">
        <dl className="divide-y divide-[var(--tt-light-border)] border-t border-b border-[var(--tt-light-border)]">
          {specs.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 text-xs">
              <dt className="text-[var(--tt-light-ink-muted)]">{row.label}</dt>
              <dd className="tt-mono-data font-medium text-[var(--tt-light-ink)]">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex items-center justify-between text-xs font-medium text-[var(--tt-light-ink)]">
          <span>{ctaLabel}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--tt-light-ink-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}

/* ==========================================================================
   DsStepColumn
   ========================================================================== */
export function DsStepColumn({
  step,
  icon,
  title,
  description,
  className,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-[var(--tt-line)] pt-5", className)}>
      <div className="flex items-center justify-between text-[var(--tt-ink-muted)]">
        <span className="tt-mono-label">{step}</span>
        <span className="text-[var(--tt-ink-secondary)]">{icon}</span>
      </div>
      <h3 className="mt-6 text-base font-semibold tracking-tight text-[var(--tt-ink)]">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-[var(--tt-ink-secondary)]">{description}</p>
    </div>
  );
}

/* ==========================================================================
   DsFeatureTrioCard
   ========================================================================== */
export function DsFeatureTrioCard({
  index,
  icon,
  title,
  description,
  className,
}: {
  index: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[var(--tt-ink-secondary)]">{icon}</span>
        <span className="tt-mono-label text-[var(--tt-ink-muted)]">{index}</span>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-[var(--tt-ink)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--tt-ink-secondary)]">{description}</p>
    </div>
  );
}
