import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { TaskBoard } from '@/components/TaskBoard'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Project, Task } from '@/lib/types'

export default async function DashboardPage () {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: projects }, { data: tasks }, { data: members }] = await Promise.all([
    supabase.from('projects').select('*').eq('archived', false).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('display_name')
  ])

  return (
    <>
      <AppHeader email={user.email ?? 'unknown'} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-600">Manage tasks across cohort projects.</p>
        </div>
        <TaskBoard
          initialTasks={(tasks ?? []) as Task[]}
          projects={(projects ?? []) as Project[]}
          members={(members ?? []) as Profile[]}
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
