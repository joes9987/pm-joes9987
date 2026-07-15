'use client'

import Link from 'next/link'
import { computePersonalMetrics } from '@/lib/task-deadlines'
import { ui } from '@/lib/ui'
import type { Task } from '@/lib/types'

type MotivationPanelProps = {
  tasks: Task[]
  currentUserId: string
}

function MetricCard ({
  title,
  children,
  accent = 'primary',
  className = ''
}: {
  title: string
  children: React.ReactNode
  accent?: 'primary' | 'accent'
  className?: string
}) {
  const accentColor = accent === 'accent' ? 'var(--accent)' : 'var(--primary)'

  return (
    <article
      className={`${ui.cardSm} relative overflow-hidden ${className}`}
      style={{ borderTopWidth: '3px', borderTopColor: accentColor }}
    >
      <h2 className={ui.metricLabel}>{title}</h2>
      {children}
    </article>
  )
}

export function MotivationPanel ({ tasks, currentUserId }: MotivationPanelProps) {
  const metrics = computePersonalMetrics(tasks, currentUserId)

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Focus today" accent="accent" className="md:col-span-2 xl:col-span-2">
        {metrics.focusToday.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No overdue or due-today tasks assigned to you. You are caught up.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {metrics.focusToday.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/dashboard?taskId=${task.id}`}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2.5 text-sm transition hover:border-[var(--primary)] hover:shadow-sm"
                >
                  <span className="font-medium text-[var(--foreground)]">{task.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </MetricCard>

      <MetricCard title="This week">
        <p className={ui.metricValue}>{metrics.dueThisWeekCount}</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          open task{metrics.dueThisWeekCount === 1 ? '' : 's'} due in the next 7 days
        </p>
      </MetricCard>

      <MetricCard title="Completion rate" accent="accent">
        <p className={ui.metricValue}>{metrics.completionRate}%</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          of your assigned tasks are done
        </p>
      </MetricCard>

      <MetricCard title="On-time rate" className="md:col-span-2 xl:col-span-2">
        <p className={ui.metricValue}>{metrics.onTimeRate === null ? '—' : `${metrics.onTimeRate}%`}</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {metrics.onTimeRate === null
            ? 'Complete tasks with due dates to track on-time delivery.'
            : 'of completed tasks with due dates finished on time'}
        </p>
      </MetricCard>
    </section>
  )
}
