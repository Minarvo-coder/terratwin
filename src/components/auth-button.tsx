import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/login/actions'
import { ShieldCheck, LogIn, LogOut } from 'lucide-react'

export default async function AuthButton() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return (
      <div className="flex items-center gap-3 font-mono text-xs">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-cyan-300">
          <ShieldCheck className="size-3.5 text-cyan-400" />
          <span className="truncate max-w-[140px]">{user.email}</span>
        </div>
        <form action={signout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-900/50 hover:border-rose-400 cursor-pointer"
          >
            <LogOut className="size-3" />
            <span className="hidden sm:inline">Abort Session</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 font-mono">
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all hover:border-cyan-400 hover:bg-cyan-500/30 hover:text-white hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]"
      >
        <LogIn className="size-3.5" />
        <span>Crew Login</span>
      </Link>
    </div>
  )
}
