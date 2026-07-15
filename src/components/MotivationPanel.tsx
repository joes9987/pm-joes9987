'use client'

import Link from 'next/link'
import { computePersonalMetrics } from '@/lib/task-deadlines'
import type { Task } from '@/lib/types'

type MotivationPanelProps = {
  tasks: Task[]
  currentUserId: string
}

export function MotivationPanel ({ tasks, currentUserId }: MotivationPanelProps) {
  const metrics = computePersonalMetrics(tasks, currentUserId)

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 md:col-span-2 xl:col-span-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Focus today
        </h2>
        {metrics.focusToday.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            No overdue or due-today tasks assigned to you. You are caught up.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {metrics.focusToday.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/dashboard?taskId=${task.id}`}
                  className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{task.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          This week
        </h2>
        <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {metrics.dueThisWeekCount}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          open task{metrics.dueThisWeekCount === 1 ? '' : 's'} due in the next 7 days
        </p>
      </article>

      <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Completion rate
        </h2>
        <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {metrics.completionRate}%
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          of your assigned tasks are done
        </p>
      </article>

      <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 md:col-span-2 xl:col-span-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          On-time rate
        </h2>
        <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {metrics.onTimeRate === null ? '—' : `${metrics.onTimeRate}%`}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {metrics.onTimeRate === null
            ? 'Complete tasks with due dates to track on-time delivery.'
            : 'of completed tasks with due dates finished on time'}
        </p>
      </article>
    </section>
  )
}
