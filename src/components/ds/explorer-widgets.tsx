"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, Mountain, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DsSegmentedControl, type DsSegmentedOption } from "./primitives";

/* ==========================================================================
   DsHeaderPreview
   Sticky light frosted header used across all light & dark pages.
   ========================================================================== */
export interface DsNavItem {
  label: string;
  href: string;
  active?: boolean;
}

export function DsHeaderPreview({
  navItems,
  signInHref = "/login",
  signInLabel = "Sign in",
  sticky = true,
  className,
}: {
  navItems: DsNavItem[];
  signInHref?: string;
  signInLabel?: string;
  sticky?: boolean;
  className?: string;
}) {
  const [utcTime, setUtcTime] = useState("--:--:--");

  useEffect(() => {
    const tick = () => setUtcTime(new Date().toISOString().slice(11, 19));
    const init = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(init);
      window.clearInterval(id);
    };
  }, []);

  return (
    <header
      className={cn(
        "z-40 w-full border-b border-[var(--tt-light-border)] bg-[var(--tt-light-bg)]/85 backdrop-blur-md",
        sticky && "sticky top-0",
        className,
      )}
    >
      <div className="tt-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tt-light-ink)] text-[var(--tt-light-surface)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="4.5" />
              <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-24 12 12)" />
              <circle cx="17.5" cy="8.5" r="1.3" fill="var(--tt-accent)" stroke="none" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block text-base font-semibold tracking-tight">
              <span className="text-[var(--tt-light-ink)]">terra</span>
              <span className="text-[var(--tt-accent)]">twin</span>
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--tt-light-ink-muted)]">
              EARTH / MOON / MARS
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-[var(--tt-radius-pill)] px-4 py-1.5 text-xs font-medium transition-colors duration-[var(--tt-duration)]",
                item.active
                  ? "bg-[var(--tt-light-surface)] text-[var(--tt-light-ink)] shadow-[0_2px_10px_rgba(17,19,24,0.06)]"
                  : "text-[var(--tt-light-ink-secondary)] hover:text-[var(--tt-light-ink)]",
              )}
            >
              {item.active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--tt-accent)]" aria-hidden="true" />}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1.5 font-mono text-[11px] text-[var(--tt-light-ink-muted)] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--tt-accent)]" aria-hidden="true" />
            <span className="tt-mono-data">UTC {utcTime}</span>
          </div>
          <Link
            href={signInHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--tt-light-ink)] hover:text-[var(--tt-accent)]"
          >
            <span>{signInLabel}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ==========================================================================
   DsHeroGlassCard
   ========================================================================== */
export function DsHeroGlassCard({
  world,
  onWorldChange,
  targetName,
  coordinates,
  href,
  className,
}: {
  world: "mars" | "moon";
  onWorldChange: (world: "mars" | "moon") => void;
  targetName: string;
  coordinates: string;
  href: string;
  className?: string;
}) {
  const options: DsSegmentedOption<"mars" | "moon">[] = [
    { value: "mars", label: "Mars" },
    { value: "moon", label: "Moon" },
  ];

  return (
    <div
      className={cn(
        "w-full max-w-[272px] rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)]/85 p-4 text-[var(--tt-light-ink)] shadow-[var(--tt-shadow-float)] backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="tt-mono-label text-[var(--tt-light-ink-muted)]">A world to explore</span>
        <Link href={href} aria-label="Open target in explorer" className="text-[var(--tt-light-ink-muted)] hover:text-[var(--tt-light-ink)]">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-3">
        <DsSegmentedControl
          options={options}
          value={world}
          onChange={onWorldChange}
          tone="light"
          size="sm"
          ariaLabel="Choose planetary body"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--tt-light-ink)]">{targetName}</p>
          <p className="tt-mono-data mt-0.5 text-[11px] text-[var(--tt-light-ink-muted)]">{coordinates}</p>
        </div>
        <Link
          href={href}
          aria-label={`Explore ${targetName}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--tt-light-border)] bg-[var(--tt-light-bg)] text-[var(--tt-light-ink)] transition-colors hover:border-[var(--tt-accent)] hover:text-[var(--tt-accent)]"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ==========================================================================
   DsRankedListCard
   ========================================================================== */
export interface DsRankedAnalogItem {
  rank: string;
  name: string;
  subtitle: string;
  score: string;
}

export function DsRankedListCard({
  imageSrc,
  imageAlt,
  imageCaption = "Earth analog terrain - illustrative image",
  routeLabel,
  featuredTitle,
  featuredLocation,
  items,
  footerLabel,
  footerHref,
  className,
}: {
  imageSrc: string;
  imageAlt: string;
  imageCaption?: string;
  routeLabel: string;
  featuredTitle: string;
  featuredLocation: string;
  items: DsRankedAnalogItem[];
  footerLabel: string;
  footerHref: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] text-[var(--tt-dark-ink)] shadow-[var(--tt-shadow-dark)]",
        className,
      )}
    >
      <div className="relative h-56 w-full overflow-hidden">
        <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--tt-dark-panel)] via-[var(--tt-dark-panel)]/35 to-transparent" />
        <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-[var(--tt-radius-pill)] border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] text-[var(--tt-dark-ink)] backdrop-blur-sm">
          <Mountain className="h-3 w-3 text-[var(--tt-dark-ink-secondary)]" />
          <span>{imageCaption}</span>
        </div>
        <div className="absolute bottom-4 left-5 right-5">
          <p className="tt-mono-data text-[11px] text-[var(--tt-dark-ink-secondary)]">{routeLabel}</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white">{featuredTitle}</h3>
          <p className="text-xs text-[var(--tt-dark-ink-secondary)]">{featuredLocation}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between border-b border-[var(--tt-dark-border)] pb-3 text-[11px] text-[var(--tt-dark-ink-muted)]">
          <span>Ranked by mission similarity</span>
          <span>Sample scores</span>
        </div>

        <ul className="divide-y divide-[var(--tt-dark-border)]">
          {items.map((item) => (
            <li key={item.rank} className="flex items-center justify-between gap-4 py-3.5">
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="tt-mono-data text-[11px] text-[var(--tt-dark-ink-muted)]">{item.rank}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--tt-dark-ink)]">{item.name}</p>
                  <p className="truncate text-[11px] text-[var(--tt-dark-ink-muted)]">{item.subtitle}</p>
                </div>
              </div>
              <span className="tt-mono-data shrink-0 text-sm font-semibold text-[var(--tt-accent)]">{item.score}</span>
            </li>
          ))}
        </ul>

        <Link
          href={footerHref}
          className="mt-2 flex items-center justify-between border-t border-[var(--tt-dark-border)] pt-4 text-xs text-[var(--tt-dark-ink-secondary)] transition-colors hover:text-[var(--tt-dark-ink)]"
        >
          <span>{footerLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ==========================================================================
   DsFilterBar & DsIconTabBar
   ========================================================================== */
export function DsFilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] p-4 text-[var(--tt-dark-ink)]",
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">{children}</div>
    </div>
  );
}

export interface DsIconTabItem<T extends string> {
  id: T;
  label: string;
  icon: React.ReactNode;
}

export function DsIconTabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  rightSlot,
  className,
}: {
  tabs: DsIconTabItem<T>[];
  activeTab: T;
  onTabChange: (id: T) => void;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div role="tablist" aria-label="Explorer analysis views" className="flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-[var(--tt-radius-control)] border px-3 py-2 text-xs font-medium transition-colors duration-[var(--tt-duration)] cursor-pointer",
                active
                  ? "border-[var(--tt-dark-border-strong)] bg-[var(--tt-dark-elevated)] text-[var(--tt-dark-ink)]"
                  : "border-transparent bg-transparent text-[var(--tt-dark-ink-secondary)] hover:bg-[var(--tt-dark-panel)] hover:text-[var(--tt-dark-ink)]",
              )}
            >
              <span className={cn(active ? "text-[var(--tt-dark-ink)]" : "text-[var(--tt-dark-ink-muted)]")}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}

/* ==========================================================================
   DsGlobeHudCard & DsMapPanelShell
   ========================================================================== */
export interface DsHudStat {
  label: string;
  value: string;
  accent?: boolean;
}

export function DsGlobeHudCard({
  title,
  toolbar,
  selectedTargetLabel = "SELECTED TARGET",
  targetName,
  targetCoords,
  stats,
  children,
  className,
}: {
  title: string;
  toolbar?: React.ReactNode;
  selectedTargetLabel?: string;
  targetName: string;
  targetCoords: string;
  stats: DsHudStat[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] text-[var(--tt-dark-ink)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--tt-dark-border)] px-4 py-3">
        <span className="text-xs font-medium text-[var(--tt-dark-ink)]">{title}</span>
        {toolbar && <div className="flex items-center gap-1.5">{toolbar}</div>}
      </div>

      <div className="relative flex-1 min-h-[280px] bg-[var(--tt-dark-bg)]">
        {children}
        <div className="pointer-events-none absolute top-4 left-4 rounded-[var(--tt-radius-control)] border border-[var(--tt-dark-border-strong)] bg-[var(--tt-dark-panel)]/90 px-3.5 py-2.5 backdrop-blur-md">
          <span className="tt-mono-label block text-[10px] text-[var(--tt-dark-periwinkle)]">
            {selectedTargetLabel}
          </span>
          <span className="mt-1 block text-xs font-semibold text-[var(--tt-dark-ink)]">{targetName}</span>
          <span className="tt-mono-data mt-0.5 block text-[10px] text-[var(--tt-dark-ink-muted)]">{targetCoords}</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-t border-[var(--tt-dark-border)] px-4 py-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--tt-dark-ink-muted)]">
              {stat.label}
            </dt>
            <dd
              className={cn(
                "tt-mono-data mt-0.5 text-xs font-medium",
                stat.accent ? "text-[var(--tt-accent)]" : "text-[var(--tt-dark-ink)]",
              )}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DsMapPanelShell({
  title,
  controls,
  footerLeft,
  footerRight,
  children,
  className,
}: {
  title: string;
  controls?: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--tt-radius-card)] border border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)] text-[var(--tt-dark-ink)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--tt-dark-border)] px-4 py-3">
        <span className="text-xs font-medium text-[var(--tt-dark-ink)]">{title}</span>
        <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--tt-dark-ink-muted)]" />
      </div>

      {controls && (
        <div className="grid grid-cols-1 gap-3 border-b border-[var(--tt-dark-border)] p-3 sm:grid-cols-2">
          {controls}
        </div>
      )}

      <div className="relative flex-1 min-h-[240px] bg-[var(--tt-dark-bg)]">{children}</div>

      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between border-t border-[var(--tt-dark-border)] px-4 py-2.5 tt-mono-data text-[11px] text-[var(--tt-dark-ink-muted)]">
          <span>{footerLeft}</span>
          <span className="text-[var(--tt-dark-ink)]">{footerRight}</span>
        </div>
      )}
    </section>
  );
}

/* ==========================================================================
   DsDisclosureRow
   ========================================================================== */
export function DsDisclosureRow({
  title,
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  title: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("border-t border-[var(--tt-line)] pt-3", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-xs text-[var(--tt-ink-secondary)] hover:text-[var(--tt-ink)] cursor-pointer"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-90")} />
        <span className="font-medium">{title}</span>
        {summary && <span className="ml-2 text-[var(--tt-ink-muted)]">{summary}</span>}
      </button>
      {open && <div className="mt-3 pl-5 text-xs leading-relaxed text-[var(--tt-ink-secondary)]">{children}</div>}
    </div>
  );
}
