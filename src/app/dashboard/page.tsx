import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { TaskBoard } from '@/components/TaskBoard'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Project, Task } from '@/lib/types'

export default async function DashboardPage () {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600">Configure Supabase environment variables to enable auth and data.</p>
      </main>
    )
  }

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: projects }, { data: tasks }, { data: members }] = await Promise.all([
    supabase.from('projects').select('*').eq('archived', false).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('display_name')
  ])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <AppHeader email={user.email ?? 'unknown'} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Manage tasks across cohort projects.</p>
        </div>
        <TaskBoard
          initialTasks={(tasks ?? []) as Task[]}
          projects={(projects ?? []) as Project[]}
          members={(members ?? []) as Profile[]}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
