import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { MotivationPanel } from '@/components/MotivationPanel'
import { TaskBoard } from '@/components/TaskBoard'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import type { QuickFilter } from '@/lib/task-deadlines'
import type { Profile, Project, Task } from '@/lib/types'

type DashboardPageProps = {
  searchParams: Promise<{
    filter?: string
    taskId?: string
  }>
}

function parseQuickFilter (value: string | undefined): QuickFilter {
  if (value === 'mine' || value === 'overdue' || value === 'due_this_week') return value
  return 'all'
}

export default async function DashboardPage ({ searchParams }: DashboardPageProps) {
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

  const params = await searchParams
  const quickFilter = parseQuickFilter(params.filter)
  const highlightTaskId = params.taskId

  const [{ data: projects }, { data: tasks }, { data: members }] = await Promise.all([
    supabase.from('projects').select('*').eq('archived', false).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('display_name')
  ])

  const taskList = (tasks ?? []) as Task[]

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Manage tasks across cohort projects.</p>
        </div>
        <div className="mb-6">
          <MotivationPanel tasks={taskList} currentUserId={user.id} />
        </div>
        <TaskBoard
          initialTasks={taskList}
          projects={(projects ?? []) as Project[]}
          members={(members ?? []) as Profile[]}
          currentUserId={user.id}
          initialQuickFilter={quickFilter}
          highlightTaskId={highlightTaskId}
        />
      </main>
    </AppShell>
  )
}
