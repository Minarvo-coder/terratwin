import { login, signup } from './actions'
import Link from 'next/link'
import { Suspense } from 'react'
import { Orbit, ShieldCheck, Lock, User, Terminal, ArrowLeft } from 'lucide-react'

interface LoginPageProps {
  searchParams: Promise<{ message?: string; error?: string }>
}

async function StatusMessages({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const { message, error } = await searchParams

  if (error) {
    return (
      <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3.5 font-mono text-xs text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
        <span className="font-bold text-rose-400">AUTHENTICATION REJECTED:</span> {error}
      </div>
    )
  }

  if (message) {
    return (
      <div className="mb-6 rounded-lg border border-cyan-500/40 bg-cyan-950/40 p-3.5 font-mono text-xs text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
        <span className="font-bold text-cyan-400">DISPATCH CONFIRMED:</span> {message}
      </div>
    )
  }

  return null
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 text-slate-100">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[600px] rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      {/* Return to Terminal link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center font-mono text-xs">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Planetary Radar</span>
        </Link>
        <span className="text-slate-600">SEC-OP-01</span>
      </div>

      {/* Auth Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-950/85 p-8 shadow-[0_0_35px_rgba(56,189,248,0.15)] backdrop-blur-xl">
        {/* Sci-Fi Corner Accents */}
        <div className="pointer-events-none absolute -top-1 -left-1 size-3 border-t-2 border-l-2 border-cyan-400" />
        <div className="pointer-events-none absolute -top-1 -right-1 size-3 border-t-2 border-r-2 border-cyan-400" />
        <div className="pointer-events-none absolute -bottom-1 -left-1 size-3 border-b-2 border-l-2 border-cyan-400" />
        <div className="pointer-events-none absolute -bottom-1 -right-1 size-3 border-b-2 border-r-2 border-cyan-400" />

        {/* Card Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="relative mb-3 flex size-12 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/50 text-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
            <Orbit className="size-6 animate-pulse" />
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-400 font-semibold tracking-widest uppercase mb-1">
            <Terminal className="size-3" />
            CREW TELEMETRY TERMINAL
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            TerraTwin Access
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
            Verify credentials to access planetary analog datasets and save mission profiles
          </p>
        </div>

        <Suspense fallback={null}>
          <StatusMessages searchParams={searchParams} />
        </Suspense>

        <form className="space-y-4">
          <div>
            <label
              className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
              htmlFor="email"
            >
              Researcher / Crew Identifier (Email)
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="crew.commander@nasa.gov"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          <div>
            <label
              className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
              htmlFor="password"
            >
              Access Passcode
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2.5 font-mono">
            <button
              formAction={login}
              className="w-full rounded-lg border border-cyan-400/50 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:scale-[1.01] cursor-pointer"
            >
              Authorize Sign In
            </button>
            <button
              formAction={signup}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              Register New Crew Identity
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-slate-850 pt-4 text-center font-mono text-[10px] text-slate-500 flex items-center justify-between">
          <span>SEC: SHA-256 RLS</span>
          <span>NASA SPACE APPS 2026</span>
        </div>
      </div>
    </div>
  )
}
