import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { ProfileSettings } from '@/components/ProfileSettings'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { ui } from '@/lib/ui'

export default async function SettingsPage () {
  if (!isSupabaseConfigured()) {
    return (
      <main className={`${ui.meshBg} mx-auto max-w-3xl px-4 py-16`}>
        <h1 className={ui.pageTitle}>Settings unavailable</h1>
      </main>
    )
  }

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  return (
    <AppShell>
      <main className={ui.pageMainNarrow}>
        <div className="mb-6 animate-fade-up">
          <p className={ui.eyebrow}>Account</p>
          <h1 className={`${ui.pageTitle} mt-1`}>Settings</h1>
          <p className={`${ui.pageSubtitle} mt-1`}>Update how you appear to the cohort.</p>
        </div>
        <ProfileSettings
          userId={user.id}
          initialDisplayName={profile?.display_name ?? ''}
          email={profile?.email ?? user.email ?? ''}
        />
      </main>
    </AppShell>
  )
}
