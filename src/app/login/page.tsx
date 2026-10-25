import { login, signup } from './actions'
import Link from 'next/link'
import { Suspense } from 'react'

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
      <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
        {error}
      </div>
    )
  }

  if (message) {
    return (
      <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
        {message}
      </div>
    )
  }

  return null
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-tight text-white hover:text-emerald-400 transition-colors"
          >
            TerraTwin
          </Link>
          <p className="mt-2 text-sm text-slate-400">
            Sign in or create an account to access planetary analog research
          </p>
        </div>

        <Suspense fallback={null}>
          <StatusMessages searchParams={searchParams} />
        </Suspense>

        <form className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="astronaut@nasa.gov"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              formAction={login}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-600 cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          NASA Space Apps Challenge · TerraTwin Platform
        </div>
      </div>
    </div>
  )
}
