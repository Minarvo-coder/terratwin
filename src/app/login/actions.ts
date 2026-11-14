'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  registerOrVerifyLocalCrewIdentity,
  sanitizeNextRedirectPath,
  signCrewSessionToken,
  VERIFIED_CREW_SESSION_COOKIE,
} from '@/utils/supabase/workspace-auth'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const nextPath = sanitizeNextRedirectPath(formData.get('next'))

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Email and password are required')}&next=${encodeURIComponent(nextPath)}`)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (!error && data.user) {
    const cookieStore = await cookies()
    cookieStore.delete(VERIFIED_CREW_SESSION_COOKIE)
    revalidatePath('/', 'layout')
    redirect(nextPath)
  }

  if (process.env.VERCEL !== '1') {
    const localVerify = registerOrVerifyLocalCrewIdentity({
      email,
      password,
      mode: 'login',
    })
    if (localVerify.ok && localVerify.user) {
      const cookieStore = await cookies()
      cookieStore.set(VERIFIED_CREW_SESSION_COOKIE, signCrewSessionToken(localVerify.user), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      revalidatePath('/', 'layout')
      redirect(nextPath)
    }
  }

  redirect(
    `/login?error=${encodeURIComponent(error?.message ?? 'Invalid login credentials')}&next=${encodeURIComponent(nextPath)}`
  )
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const nextPath = sanitizeNextRedirectPath(formData.get('next'))

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Email and password are required')}&next=${encodeURIComponent(nextPath)}`)
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (process.env.VERCEL !== '1') {
    const localReg = registerOrVerifyLocalCrewIdentity({
      email,
      password,
      preferredUserId: data?.user?.id,
      mode: 'signup',
    })
    if (!localReg.ok) {
      redirect(`/login?error=${encodeURIComponent(localReg.error ?? 'Registration failed')}&next=${encodeURIComponent(nextPath)}`)
    }
    if (data?.session) {
      revalidatePath('/', 'layout')
      redirect(nextPath)
    }
    if (localReg.user) {
      const cookieStore = await cookies()
      cookieStore.set(VERIFIED_CREW_SESSION_COOKIE, signCrewSessionToken(localReg.user), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      revalidatePath('/', 'layout')
      redirect(nextPath)
    }
  }

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(nextPath)}`)
  }

  if (data?.session) {
    revalidatePath('/', 'layout')
    redirect(nextPath)
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account and sign in.')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete(VERIFIED_CREW_SESSION_COOKIE)
  revalidatePath('/', 'layout')
  redirect('/login')
}
