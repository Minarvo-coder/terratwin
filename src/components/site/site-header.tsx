import Link from "next/link"
import { Suspense } from "react"
import AuthButton from "@/components/auth-button"
import { MissionClock } from "./mission-clock"
import { SiteNav } from "./site-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-[var(--tt-light-border)] bg-[var(--tt-light-bg)]/85 backdrop-blur-md">
      <div className="tt-container flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 lg:h-16 lg:flex-nowrap lg:py-0">
        {/* Brand */}
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tt-light-ink)] text-[var(--tt-light-surface)] transition-transform duration-300 group-hover:scale-105"
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
              <span className="sr-only">NASA SPACE APPS</span>
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--tt-light-ink-muted)]">
              EARTH / MOON / MARS
            </span>
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="order-3 w-full min-w-0 lg:order-none lg:w-auto lg:flex-1 lg:flex lg:justify-center">
          <SiteNav />
        </div>

        {/* Right: UTC Clock & Auth */}
        <div className="flex shrink-0 items-center gap-4">
          <MissionClock />
          <Suspense
            fallback={
              <div className="h-6 w-16 animate-pulse rounded-[var(--tt-radius-pill)] bg-[var(--tt-light-band)]" />
            }
          >
            <AuthButton />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
