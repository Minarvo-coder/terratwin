import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="tt-surface-light border-t border-[var(--tt-light-border)] py-14 text-sm text-[var(--tt-light-ink-secondary)]">
      <div className="tt-container">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Col 1: Brand & Space Apps */}
          <div className="space-y-3.5 md:col-span-2">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--tt-light-ink)] text-[var(--tt-light-surface)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="4.5" />
                  <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-24 12 12)" />
                  <circle cx="17.5" cy="8.5" r="1.3" fill="var(--tt-accent)" stroke="none" />
                </svg>
              </span>
              <span className="text-base font-semibold tracking-tight">
                <span className="text-[var(--tt-light-ink)]">terra</span>
                <span className="text-[var(--tt-accent)]">twin</span>
              </span>
              <span className="rounded-[var(--tt-radius-pill)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--tt-light-ink-muted)]">
                TEAM HEXARCHY
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[var(--tt-light-ink-secondary)]">
              Developed for the NASA International Space Apps Challenge:{" "}
              <em>&ldquo;Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars.&rdquo;</em>
            </p>
            <p className="text-[11px] text-[var(--tt-light-ink-muted)]">
              Powered by NASA POWER, Copernicus DEM, Macrostrat, and NASA PDS reference baselines.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="tt-mono-label text-[var(--tt-light-ink-muted)]">Workstations</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/explore" className="transition-colors hover:text-[var(--tt-accent)]">
                  Explorer Flight Deck
                </Link>
              </li>
              <li>
                <Link href="/discover" className="transition-colors hover:text-[var(--tt-accent)]">
                  Discovery Scanner &amp; Atlas
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="transition-colors hover:text-[var(--tt-accent)]">
                  Mathematical Framework
                </Link>
              </li>
              <li>
                <Link href="/sources" className="transition-colors hover:text-[var(--tt-accent)]">
                  Data Provenance Registry
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Research & Verification */}
          <div className="space-y-3">
            <h4 className="tt-mono-label text-[var(--tt-light-ink-muted)]">Scientific Standards</h4>
            <ul className="space-y-2 text-xs text-[var(--tt-light-ink-secondary)]">
              <li>&ge;40% Reliable Coverage Gate</li>
              <li>100% Deterministic Scoring</li>
              <li>PostgreSQL 17 RLS Security</li>
              <li>PDF / CSV / JSON Export Engine</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--tt-light-border)] pt-6 text-xs text-[var(--tt-light-ink-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Team HEXARCHY. Open scientific source code under MIT License.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Minarvo-coder/terratwin"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[var(--tt-light-ink)] transition-colors hover:text-[var(--tt-accent)]"
            >
              <span>GitHub</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
            <span>&bull;</span>
            <span>NASA Space Apps Challenge 2026</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
