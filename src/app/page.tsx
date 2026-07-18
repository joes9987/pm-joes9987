import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage () {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) redirect('/dashboard')
    }
  }

  return <LandingPage showConfigWarning={!isSupabaseConfigured()} />
}
