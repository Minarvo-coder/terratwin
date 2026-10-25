import AuthButton from '@/components/auth-button'
import Link from 'next/link'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
              TT
            </div>
            <div>
              <span className="font-bold tracking-tight text-white">TerraTwin</span>
              <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                NASA Space Apps
              </span>
            </div>
          </div>
          <Suspense fallback={<div className="h-8 w-20 rounded-lg bg-slate-800/60 animate-pulse" />}>
            <AuthButton />
          </Suspense>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs w-fit mb-6">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Supabase SSR App Router Connected
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
          Extraterrestrial Environment <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Earth Analog Explorer
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          TerraTwin maps extreme Earth environments that serve as scientific, mineralogical, and operational analogs for lunar and Martian exploration missions.
        </p>

        {/* Status / Quick Action Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="text-xs uppercase font-semibold text-emerald-400 mb-1">Architecture</div>
            <div className="text-sm font-medium text-white">Next.js App Router</div>
            <div className="text-xs text-slate-400 mt-1">TypeScript · Tailwind CSS</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="text-xs uppercase font-semibold text-emerald-400 mb-1">Auth & Database</div>
            <div className="text-sm font-medium text-white">Supabase SSR Ready</div>
            <div className="text-xs text-slate-400 mt-1">Session Middleware Active</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="text-xs uppercase font-semibold text-emerald-400 mb-1">NASA Space Apps</div>
            <div className="text-sm font-medium text-white">6-Person Team Project</div>
            <div className="text-xs text-slate-400 mt-1">Planetary Analogs Platform</div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 items-center">
          <Link
            href="/login"
            className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            Test Authentication Page →
          </Link>
          <span className="text-xs text-slate-500">
            Configure keys in <code className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded">.env.local</code> to activate live Supabase queries
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        TerraTwin · NASA Space Apps Challenge · Next.js & Supabase Starter
      </footer>
    </div>
  )
}
