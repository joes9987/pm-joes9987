import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { fetchUserNotifications, syncDeadlineNotifications } from '@/lib/notifications'
import type { Notification } from '@/lib/types'

type AppShellProps = {
  children: React.ReactNode
}

export async function AppShell ({ children }: AppShellProps) {
  if (!isSupabaseConfigured()) {
    return <>{children}</>
  }

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myOpenTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assignee_id', user.id)
    .neq('status', 'done')
    .not('due_date', 'is', null)

  await syncDeadlineNotifications(supabase, user.id, myOpenTasks ?? [])

  const notifications = await fetchUserNotifications(supabase, user.id)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <AppHeader
        email={user.email ?? 'unknown'}
        userId={user.id}
        initialNotifications={notifications as Notification[]}
      />
      {children}
    </div>
  )
}
