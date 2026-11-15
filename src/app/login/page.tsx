import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { login, signup } from "./actions"

interface LoginPageProps {
  searchParams: Promise<{ message?: string; error?: string; next?: string }>
}

async function NextRedirectInput({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; next?: string }>
}) {
  const { next } = await searchParams
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/"
  return <input type="hidden" name="next" value={safeNext} />
}

async function StatusMessages({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const { message, error } = await searchParams

  if (error) {
    return (
      <div
        role="alert"
        className="mb-6 rounded-[var(--tt-radius-control)] border border-[var(--tt-error)]/30 bg-[var(--tt-error)]/10 p-3.5 text-xs text-[var(--tt-light-ink)]"
      >
        <span className="tt-mono-label block text-[var(--tt-error)]">AUTHENTICATION ERROR</span>
        <span className="mt-1 block text-[var(--tt-light-ink-secondary)]">{error}</span>
      </div>
    )
  }

  if (message) {
    return (
      <div className="mb-6 rounded-[var(--tt-radius-control)] border border-[var(--tt-success)]/30 bg-[var(--tt-success)]/10 p-3.5 text-xs text-[var(--tt-light-ink)]">
        <span className="tt-mono-label block text-[var(--tt-success)]">STATUS</span>
        <span className="mt-1 block text-[var(--tt-light-ink-secondary)]">{message}</span>
      </div>
    )
  }

  return null
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="tt-surface-light flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-14">
      <div className="mb-4 flex w-full max-w-md items-center justify-between text-xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[var(--tt-light-ink-secondary)] transition-colors hover:text-[var(--tt-light-ink)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Back to Overview</span>
        </Link>
        <span className="tt-mono-label text-[var(--tt-light-ink-muted)]">WORKSPACE ACCESS</span>
      </div>

      <div className="w-full max-w-md rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-8 shadow-[var(--tt-shadow-soft)]">
        <div className="mb-7 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--tt-accent)]" aria-hidden="true" />
            <span className="tt-mono-label text-[var(--tt-light-ink-muted)]">TERRATWIN RESEARCH WORKSPACE</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--tt-light-ink)]">
            Sign in to save profiles
          </h1>
          <p className="text-xs leading-relaxed text-[var(--tt-light-ink-secondary)]">
            Access your cloud research workspace, saved analog rankings, and field portfolio configurations.
          </p>
        </div>

        <Suspense fallback={null}>
          <StatusMessages searchParams={searchParams} />
        </Suspense>

        <form className="space-y-4">
          <Suspense fallback={<input type="hidden" name="next" value="/" />}>
            <NextRedirectInput searchParams={searchParams} />
          </Suspense>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--tt-light-ink-secondary)]" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="researcher@example.org"
              className="h-11 w-full rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border-strong)] bg-[var(--tt-light-bg)] px-3.5 text-sm text-[var(--tt-light-ink)] placeholder:text-[var(--tt-light-ink-muted)] focus:border-[var(--tt-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--tt-accent-soft)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--tt-light-ink-secondary)]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••••••"
              className="h-11 w-full rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border-strong)] bg-[var(--tt-light-bg)] px-3.5 text-sm text-[var(--tt-light-ink)] placeholder:text-[var(--tt-light-ink-muted)] focus:border-[var(--tt-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--tt-accent-soft)]"
            />
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              formAction={login}
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--tt-radius-control)] bg-[var(--tt-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--tt-accent-hover)] cursor-pointer"
            >
              <span>Sign in</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
            <button
              formAction={signup}
              className="inline-flex h-11 w-full items-center justify-center rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border-strong)] bg-[var(--tt-light-surface)] px-5 text-sm font-medium text-[var(--tt-light-ink)] transition-colors hover:bg-[var(--tt-light-band)] cursor-pointer"
            >
              Create account
            </button>
          </div>
        </form>

        <div className="mt-7 flex items-center justify-between border-t border-[var(--tt-light-border)] pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--tt-light-ink-muted)]">
          <span>Supabase RLS Protected</span>
          <span>NASA Space Apps 2026</span>
        </div>
      </div>
    </main>
  )
}
