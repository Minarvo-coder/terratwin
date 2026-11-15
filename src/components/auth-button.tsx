import Link from "next/link"
import { ArrowUpRight, LogOut, ShieldCheck } from "lucide-react"
import { getAuthenticatedWorkspaceUser } from "@/utils/supabase/workspace-auth"
import { signout } from "@/app/login/actions"

export default async function AuthButton() {
  const { user } = await getAuthenticatedWorkspaceUser()

  if (user) {
    return (
      <div className="flex items-center gap-2.5 text-xs">
        <div className="hidden sm:flex items-center gap-1.5 rounded-[var(--tt-radius-pill)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] px-2.5 py-1 font-mono text-[11px] text-[var(--tt-light-ink)]">
          <ShieldCheck className="size-3.5 text-[var(--tt-accent)]" aria-hidden="true" />
          <span className="max-w-[130px] truncate">{user.email}</span>
        </div>
        <form action={signout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-[var(--tt-radius-pill)] border border-[var(--tt-light-border-strong)] bg-[var(--tt-light-surface)] px-3 py-1 text-xs font-medium text-[var(--tt-light-ink)] transition-colors hover:border-[var(--tt-accent)] hover:text-[var(--tt-accent)] cursor-pointer"
          >
            <LogOut className="size-3" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </form>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--tt-light-ink)] transition-colors hover:text-[var(--tt-accent)] whitespace-nowrap"
    >
      <span>Sign in</span>
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}
