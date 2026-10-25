import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/login/actions'

export default async function AuthButton() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-400">
          Signed in as <strong className="text-slate-200">{user.email}</strong>
        </span>
        <form action={signout}>
          <button
            type="submit"
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            Sign Out
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        Sign In / Join
      </Link>
    </div>
  )
}
