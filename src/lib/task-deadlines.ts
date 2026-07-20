import type { Task, TaskStatus } from '@/lib/types'

export type DeadlineStatus = 'none' | 'overdue' | 'due_today' | 'due_soon' | 'on_track'

export type QuickFilter = 'all' | 'mine' | 'overdue' | 'due_this_week'

const URGENCY_ORDER: Record<DeadlineStatus, number> = {
  overdue: 0,
  due_today: 1,
  due_soon: 2,
  on_track: 3,
  none: 4
}

function startOfDay (date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay (date: Date): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export function getDeadlineStatus (
  dueDate: string | null,
  status: TaskStatus,
  now: Date = new Date()
): DeadlineStatus {
  if (!dueDate || status === 'done') return 'none'

  const due = new Date(dueDate)
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const soonThreshold = new Date(todayEnd)
  soonThreshold.setDate(soonThreshold.getDate() + 3)

  if (due < todayStart) return 'overdue'
  if (due >= todayStart && due <= todayEnd) return 'due_today'
  if (due <= soonThreshold) return 'due_soon'
  return 'on_track'
}

export function isOverdue (
  dueDate: string | null,
  status: TaskStatus,
  now: Date = new Date()
): boolean {
  return getDeadlineStatus(dueDate, status, now) === 'overdue'
}

export function isDueThisWeek (
  dueDate: string | null,
  status: TaskStatus,
  now: Date = new Date()
): boolean {
  if (!dueDate || status === 'done') return false

  const due = new Date(dueDate)
  const weekEnd = new Date(startOfDay(now))
  weekEnd.setDate(weekEnd.getDate() + 7)
  weekEnd.setHours(23, 59, 59, 999)

  return due <= weekEnd
}

export function isFocusToday (
  dueDate: string | null,
  status: TaskStatus,
  now: Date = new Date()
): boolean {
  const deadlineStatus = getDeadlineStatus(dueDate, status, now)
  return deadlineStatus === 'overdue' || deadlineStatus === 'due_today'
}

export function sortByUrgency (tasks: Task[], now: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => {
    const urgencyDiff =
      URGENCY_ORDER[getDeadlineStatus(a.due_date, a.status, now)] -
      URGENCY_ORDER[getDeadlineStatus(b.due_date, b.status, now)]

    if (urgencyDiff !== 0) return urgencyDiff

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (a.due_date) return -1
    if (b.due_date) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function isOnTimeCompletion (task: Task): boolean {
  if (task.status !== 'done') return false
  if (!task.due_date) return true
  const finishedAt = task.completed_at ?? task.updated_at
  return new Date(finishedAt) <= new Date(task.due_date)
}

export function formatDueDate (dueDate: string): string {
  return new Date(dueDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function toDatetimeLocalValue (isoDate: string | null): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function fromDatetimeLocalValue (value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

export function deadlineBadgeLabel (status: DeadlineStatus): string {
  switch (status) {
    case 'overdue': return 'Overdue'
    case 'due_today': return 'Due today'
    case 'due_soon': return 'Due soon'
    case 'on_track': return 'On track'
    default: return ''
  }
}

export function deadlineBadgeClass (status: DeadlineStatus): string {
  switch (status) {
    case 'overdue':
      return 'bg-[var(--danger-bg)] text-[var(--danger-fg)]'
    case 'due_today':
      return 'bg-[var(--warning-bg)] text-[var(--warning-fg)]'
    case 'due_soon':
      return 'bg-[var(--accent-soft)] text-[var(--accent-foreground)]'
    case 'on_track':
      return 'bg-[var(--success-bg)] text-[var(--success-fg)]'
    default:
      return ''
  }
}

export function formatProjectCountdown (targetDate: string | null, now: Date = new Date()): string | null {
  if (!targetDate) return null

  const target = startOfDay(new Date(targetDate))
  const today = startOfDay(now)
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} past deadline`
  if (diffDays === 0) return 'Deadline is today'
  return `${diffDays} day${diffDays === 1 ? '' : 's'} to project deadline`
}

export function computePersonalMetrics (tasks: Task[], userId: string, now: Date = new Date()) {
  const myTasks = tasks.filter((task) => task.assignee_id === userId)
  const myOpen = myTasks.filter((task) => task.status !== 'done')
  const myDone = myTasks.filter((task) => task.status === 'done')
  const focusToday = myOpen.filter((task) => isFocusToday(task.due_date, task.status, now))
  const dueThisWeek = myOpen.filter((task) => isDueThisWeek(task.due_date, task.status, now))
  const withDueDate = myDone.filter((task) => task.due_date)
  const onTime = withDueDate.filter(isOnTimeCompletion)

  return {
    focusToday: sortByUrgency(focusToday, now).slice(0, 5),
    dueThisWeekCount: dueThisWeek.length,
    completionRate: myTasks.length === 0 ? 0 : Math.round((myDone.length / myTasks.length) * 100),
    onTimeRate: withDueDate.length === 0 ? null : Math.round((onTime.length / withDueDate.length) * 100)
  }
}

export function computeProjectMetrics (projectId: string, tasks: Task[], now: Date = new Date()) {
  const projectTasks = tasks.filter((task) => task.project_id === projectId)
  const open = projectTasks.filter((task) => task.status !== 'done')
  const done = projectTasks.filter((task) => task.status === 'done')
  const overdue = open.filter((task) => isOverdue(task.due_date, task.status, now))

  return {
    total: projectTasks.length,
    todo: projectTasks.filter((task) => task.status === 'todo').length,
    inProgress: projectTasks.filter((task) => task.status === 'in_progress').length,
    done: done.length,
    overdue: overdue.length,
    completionRate: projectTasks.length === 0 ? 0 : Math.round((done.length / projectTasks.length) * 100)
  }
}
