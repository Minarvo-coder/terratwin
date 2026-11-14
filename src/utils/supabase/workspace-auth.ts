import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import type { AuthenticatedWorkspaceUser } from "@/lib/terratwin/types/research-workflow"
import {
  deterministicUserUuidFromEmail,
  registerOrVerifyLocalCrewIdentity,
  sanitizeNextRedirectPath,
  signCrewSessionToken,
  VERIFIED_CREW_SESSION_COOKIE,
  verifyCrewSessionToken,
} from "@/lib/terratwin/services/cloud-research-workspace-service"

export {
  deterministicUserUuidFromEmail,
  registerOrVerifyLocalCrewIdentity,
  sanitizeNextRedirectPath,
  signCrewSessionToken,
  VERIFIED_CREW_SESSION_COOKIE,
  verifyCrewSessionToken,
}

export async function getAuthenticatedWorkspaceUser(): Promise<{
  user: AuthenticatedWorkspaceUser | null
  supabase: Awaited<ReturnType<typeof createClient>>
}> {
  const supabase = await createClient()
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && user.id && user.email) {
      return {
        user: {
          id: user.id,
          email: user.email,
          authProvider: "supabase-auth",
        },
        supabase,
      }
    }
  } catch {
    // Fall through to signed crew cookie check
  }

  if (process.env.VERCEL !== "1") {
    const cookieStore = await cookies()
    const rawCookie = cookieStore.get(VERIFIED_CREW_SESSION_COOKIE)?.value
    const verified = verifyCrewSessionToken(rawCookie)
    if (verified) {
      return { user: verified, supabase }
    }
  }

  return { user: null, supabase }
}
