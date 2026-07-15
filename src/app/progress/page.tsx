import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { computeProjectMetrics, formatProjectCountdown } from '@/lib/task-deadlines'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import type { Project, Task } from '@/lib/types'

export default async function ProgressPage () {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Progress unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600">Configure Supabase environment variables to enable auth and data.</p>
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Progress</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Track completion and deadlines across cohort projects.
          </p>
        </div>

        {projectList.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            No active projects yet. Create one on the Projects page to see metrics here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projectList.map((project) => {
              const metrics = computeProjectMetrics(project.id, taskList)
              const countdown = formatProjectCountdown(project.target_date)

              return (
                <article
                  key={project.id}
                  className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{project.name}</h2>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    {countdown && (
                      <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                        countdown.includes('past deadline')
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      }`}>
                        {countdown}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
                      <span>Completion</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{metrics.completionRate}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${metrics.completionRate}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Total tasks</dt>
                      <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{metrics.total}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Done</dt>
                      <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{metrics.done}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">In progress</dt>
                      <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{metrics.inProgress}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">Overdue</dt>
                      <dd className={`font-semibold ${metrics.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
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
