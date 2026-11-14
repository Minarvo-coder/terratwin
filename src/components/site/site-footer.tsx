import Link from "next/link"
import { Orbit, ExternalLink } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-sm text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Col 1: Brand & Space Apps */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-sky-400">
                <Orbit className="size-4" />
              </div>
              <span className="font-sans text-base font-bold text-white">TerraTwin</span>
              <span className="rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 font-mono text-[9px] text-sky-300">
                TEAM HEXARCHY
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-400">
              Developed for the NASA International Space Apps Challenge: <em>&ldquo;Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars.&rdquo;</em>
            </p>
            <p className="text-[11px] text-slate-400">
              Powered by NASA POWER, Copernicus DEM, Macrostrat, and NASA PDS reference baselines.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wider">Workstations</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/explore" className="hover:text-sky-300 transition-colors">Explorer Flight Deck</Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-sky-300 transition-colors">Discovery Scanner & Atlas</Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-sky-300 transition-colors">Mathematical Framework</Link>
              </li>
              <li>
                <Link href="/sources" className="hover:text-sky-300 transition-colors">Data Provenance Registry</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Research & Verification */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wider">Scientific Standards</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>&ge;40% Reliable Coverage Gate</li>
              <li>100% Deterministic Scoring</li>
              <li>PostgreSQL 17 RLS Security</li>
              <li>PDF / CSV / JSON Export Engine</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400">
          <p>&copy; 2026 Team HEXARCHY. Open scientific source code under MIT License.</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/Minarvo-coder/terratwin" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="size-3" />
            </a>
            <span>&bull;</span>
            <span className="text-slate-400">NASA Space Apps Challenge 2026</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
