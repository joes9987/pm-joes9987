import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/** Exchanges the email-link code/token for a session, then forwards to `next`. */
export async function GET (request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  const redirectTo = new URL(next, request.url)
  const errorRedirect = new URL('/login', request.url)

  const supabase = await createClient()
  if (!supabase) return NextResponse.redirect(errorRedirect)

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(redirectTo)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(redirectTo)
  }

  errorRedirect.searchParams.set('error', 'auth_link_invalid')
  return NextResponse.redirect(errorRedirect)
}
