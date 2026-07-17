'use client'

import Link from 'next/link'
import { computePersonalMetrics } from '@/lib/task-deadlines'
import { ui } from '@/lib/ui'
import type { Task } from '@/lib/types'

type MotivationPanelProps = {
  tasks: Task[]
  currentUserId: string
}

export function MotivationPanel ({ tasks, currentUserId }: MotivationPanelProps) {
  const metrics = computePersonalMetrics(tasks, currentUserId)
  const focusLabel = metrics.focusToday.length === 0
    ? 'Caught up'
    : metrics.focusToday.slice(0, 2).map((task) => task.title).join(' · ')

  return (
    <section className={`${ui.cardSm} flex flex-wrap items-stretch gap-4 md:gap-6`} aria-label="Personal metrics">
      <div className="min-w-[10rem] flex-1">
        <p className={ui.metricLabel}>Focus today</p>
        {metrics.focusToday.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">No urgent assigned tasks</p>
        ) : (
          <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
            <Link href={`/dashboard?taskId=${metrics.focusToday[0].id}`} className={ui.linkAccent}>
              {focusLabel}
            </Link>
          </p>
        )}
      </div>
      <div className="min-w-[6rem]">
        <p className={ui.metricLabel}>This week</p>
        <p className={`${ui.metricValue} text-2xl`}>{metrics.dueThisWeekCount}</p>
      </div>
      <div className="min-w-[6rem]">
        <p className={ui.metricLabel}>Completion</p>
        <p className={`${ui.metricValue} text-2xl`}>{metrics.completionRate}%</p>
      </div>
      <div className="min-w-[6rem]">
        <p className={ui.metricLabel}>On-time</p>
        <p className={`${ui.metricValue} text-2xl`}>
          {metrics.onTimeRate === null ? '—' : `${metrics.onTimeRate}%`}
        </p>
      </div>
    </section>
  )
}
