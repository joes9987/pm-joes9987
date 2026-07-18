import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { GitHubActivity, GitHubRepoChip } from '@/components/GitHubActivity'
import { MotivationPanel } from '@/components/MotivationPanel'
import { TaskBoard } from '@/components/TaskBoard'
import { syncDeadlineNotifications } from '@/lib/notifications'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import type { QuickFilter } from '@/lib/task-deadlines'
import type { Profile, Project, Task } from '@/lib/types'
import { ui } from '@/lib/ui'

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
      <main className={`${ui.meshBg} mx-auto max-w-3xl px-4 py-16`}>
        <h1 className={ui.pageTitle}>Dashboard unavailable</h1>
        <p className={`mt-2 ${ui.pageSubtitle}`}>Configure Supabase environment variables to enable auth and data.</p>
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
    supabase.from('tasks').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, email, display_name').order('display_name')
  ])

  const taskList = (tasks ?? []) as Task[]
  const profileList = (members ?? []) as Profile[]
  const projectList = (projects ?? []) as Project[]
  const linkedProjects = projectList.filter((project) => project.github_repo)

  // Throttle: sync deadline notifications on dashboard visits only (not every AppShell nav).
  await syncDeadlineNotifications(
    supabase,
    user.id,
    taskList.filter((task) => task.assignee_id === user.id)
  )

  return (
    <AppShell>
      <main className={ui.pageMain}>
        <div className="mb-4 animate-fade-up">
          <p className={ui.eyebrow}>Workspace</p>
          <h1 className={`${ui.pageTitle} mt-1`}>Dashboard</h1>
        </div>
        <div className="mb-4">
          <MotivationPanel tasks={taskList} currentUserId={user.id} />
        </div>
        {linkedProjects.length > 0 && (
          <section className={`${ui.card} mb-4 animate-fade-up`}>
            <h2 className={ui.sectionTitle}>Repo activity</h2>
            <p className={`${ui.pageSubtitle} mt-1`}>Latest commits, PRs, and issues from linked GitHub repositories.</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {linkedProjects.slice(0, 4).map((project) => (
                <div key={project.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{project.name}</p>
                    <GitHubRepoChip repo={project.github_repo as string} />
                  </div>
                  <div className="mt-2">
                    <GitHubActivity repo={project.github_repo as string} limit={5} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <TaskBoard
          initialTasks={taskList}
          projects={projectList}
          members={profileList}
          currentUserId={user.id}
          initialQuickFilter={quickFilter}
          highlightTaskId={highlightTaskId}
        />
      </main>
    </AppShell>
  )
}
