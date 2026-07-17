import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { fetchUserNotifications } from '@/lib/notifications'
import { ui } from '@/lib/ui'
import type { Notification } from '@/lib/types'

type AppShellProps = {
  children: React.ReactNode
}

/** Auth chrome + notifications only. Deadline sync runs on the dashboard (throttled). */
export async function AppShell ({ children }: AppShellProps) {
  if (!isSupabaseConfigured()) {
    return <>{children}</>
  }

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, notifications] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    fetchUserNotifications(supabase, user.id)
  ])

  return (
    <div className={ui.meshBg}>
      <AppHeader
        email={user.email ?? 'unknown'}
        displayName={profile?.display_name ?? ''}
        userId={user.id}
        initialNotifications={notifications as Notification[]}
      />
      {children}
    </div>
  )
}
