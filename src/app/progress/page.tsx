import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { computeProjectMetrics, formatProjectCountdown } from '@/lib/task-deadlines'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { ui } from '@/lib/ui'
import type { Project, Task } from '@/lib/types'

export default async function ProgressPage () {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Progress unavailable</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Configure Supabase environment variables to enable auth and data.</p>
      </main>
    )
  }

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from('projects').select('*').eq('archived', false).order('name'),
    supabase.from('tasks').select('*')
  ])

  const projectList = (projects ?? []) as Project[]
  const taskList = (tasks ?? []) as Task[]

  return (
    <AppShell>
      <main className={ui.pageMain}>
        <div className="mb-6 animate-fade-up">
          <p className={ui.eyebrow}>Metrics</p>
          <h1 className={`${ui.pageTitle} mt-1`}>Progress</h1>
          <p className={`${ui.pageSubtitle} mt-1`}>
            Track completion and deadlines across cohort projects.
          </p>
        </div>

        {projectList.length === 0 ? (
          <div className={`${ui.card} text-sm text-[var(--muted-foreground)]`}>
            No active projects yet. Create one on the Projects page to see metrics here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projectList.map((project, index) => {
              const metrics = computeProjectMetrics(project.id, taskList)
              const countdown = formatProjectCountdown(project.target_date)

              return (
                <article
                  key={project.id}
                  className={`${ui.card} animate-fade-up`}
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className={ui.sectionTitle}>{project.name}</h2>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    {countdown && (
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        countdown.includes('past deadline')
                          ? 'bg-[var(--danger-bg)] text-[var(--danger-fg)]'
                          : 'bg-[var(--accent-soft)] text-[var(--accent-foreground)]'
                      }`}>
                        {countdown}
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                      <span>Completion</span>
                      <span className="font-semibold text-[var(--foreground)]">{metrics.completionRate}%</span>
                    </div>
                    <div className="progress-bar-track mt-2 h-2.5 overflow-hidden rounded-full">
                      <div
                        className="progress-bar-fill h-full rounded-full transition-all duration-500"
                        style={{ width: `${metrics.completionRate}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-[var(--card-solid)] p-3">
                      <dt className="text-[var(--muted)]">Total tasks</dt>
                      <dd className="mt-1 text-lg font-bold text-[var(--foreground)]">{metrics.total}</dd>
                    </div>
                    <div className="rounded-xl bg-[var(--card-solid)] p-3">
                      <dt className="text-[var(--muted)]">Done</dt>
                      <dd className="mt-1 text-lg font-bold text-[var(--foreground)]">{metrics.done}</dd>
                    </div>
                    <div className="rounded-xl bg-[var(--card-solid)] p-3">
                      <dt className="text-[var(--muted)]">In progress</dt>
                      <dd className="mt-1 text-lg font-bold text-[var(--foreground)]">{metrics.inProgress}</dd>
                    </div>
                    <div className="rounded-xl bg-[var(--card-solid)] p-3">
                      <dt className="text-[var(--muted)]">Overdue</dt>
                      <dd className={`mt-1 text-lg font-bold ${metrics.overdue > 0 ? 'text-[var(--danger-fg)]' : 'text-[var(--foreground)]'}`}>
                        {metrics.overdue}
                      </dd>
                    </div>
                  </dl>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </AppShell>
  )
}
