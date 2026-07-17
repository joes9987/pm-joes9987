import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Leaderboard } from '@/components/Leaderboard'
import { aggregateLeaderboard } from '@/lib/leaderboard'
import { computeProjectMetrics, formatProjectCountdown } from '@/lib/task-deadlines'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { ui } from '@/lib/ui'
import type { PointEvent, Profile, Project, Task } from '@/lib/types'

export default async function ProgressPage () {
  if (!isSupabaseConfigured()) {
    return (
      <main className={`${ui.meshBg} mx-auto max-w-3xl px-4 py-16`}>
        <h1 className={ui.pageTitle}>Progress unavailable</h1>
        <p className={`mt-2 ${ui.pageSubtitle}`}>Configure Supabase environment variables to enable auth and data.</p>
      </main>
    )
  }

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: projects }, { data: tasks }, { data: members }, { data: pointEvents }] = await Promise.all([
    supabase.from('projects').select('*').eq('archived', false).order('name'),
    supabase.from('tasks').select('*').is('deleted_at', null),
    supabase.from('profiles').select('id, email, display_name').order('display_name'),
    supabase.from('point_events').select('*')
  ])

  const projectList = (projects ?? []) as Project[]
  const taskList = (tasks ?? []) as Task[]
  const profileList = (members ?? []) as Profile[]
  const leaderboardRows = aggregateLeaderboard((pointEvents ?? []) as PointEvent[], profileList)

  return (
    <AppShell>
      <main className={ui.pageMain}>
        <div className="mb-6 animate-fade-up">
          <p className={ui.eyebrow}>Metrics</p>
          <h1 className={`${ui.pageTitle} mt-1`}>Progress</h1>
          <p className={`${ui.pageSubtitle} mt-1`}>
            Completion across projects and the live cohort leaderboard.
          </p>
        </div>

        <div className="mb-8">
          <Leaderboard
            initialRows={leaderboardRows}
            profiles={profileList}
            currentUserId={user.id}
          />
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
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    {countdown && (
                      <span className={`font-mono shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                      <span className="font-mono font-semibold text-[var(--foreground)]">{metrics.completionRate}%</span>
                    </div>
                    <div
                      className="progress-bar-track mt-2 h-2.5 overflow-hidden rounded-full"
                      role="progressbar"
                      aria-valuenow={metrics.completionRate}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${project.name} completion`}
                    >
                      <div
                        className="progress-bar-fill h-full rounded-full transition-all duration-500"
                        style={{ width: `${metrics.completionRate}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="inline text-[var(--muted)]">Total </dt>
                      <dd className="font-mono inline font-semibold">{metrics.total}</dd>
                    </div>
                    <div>
                      <dt className="inline text-[var(--muted)]">Done </dt>
                      <dd className="font-mono inline font-semibold">{metrics.done}</dd>
                    </div>
                    <div>
                      <dt className="inline text-[var(--muted)]">In progress </dt>
                      <dd className="font-mono inline font-semibold">{metrics.inProgress}</dd>
                    </div>
                    <div>
                      <dt className="inline text-[var(--muted)]">Overdue </dt>
                      <dd className={`font-mono inline font-semibold ${metrics.overdue > 0 ? 'text-[var(--danger-fg)]' : ''}`}>
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
