import type { SupabaseClient } from '@supabase/supabase-js'
import { getDeadlineStatus } from '@/lib/task-deadlines'
import type { Notification, Task } from '@/lib/types'

type DeadlineNotification = {
  user_id: string
  type: 'due_soon' | 'overdue'
  task_id: string
  message: string
}

function buildDeadlineNotifications (tasks: Task[], now: Date = new Date()): DeadlineNotification[] {
  const notifications: DeadlineNotification[] = []

  for (const task of tasks) {
    if (!task.assignee_id || !task.due_date || task.status === 'done' || task.deleted_at) continue

    const status = getDeadlineStatus(task.due_date, task.status, now)
    if (status === 'overdue') {
      notifications.push({
        user_id: task.assignee_id,
        type: 'overdue',
        task_id: task.id,
        message: `Overdue: ${task.title}`
      })
    } else if (status === 'due_today' || status === 'due_soon') {
      notifications.push({
        user_id: task.assignee_id,
        type: 'due_soon',
        task_id: task.id,
        message: status === 'due_today'
          ? `Due today: ${task.title}`
          : `Due soon: ${task.title}`
      })
    }
  }

  return notifications
}

/** Inserts missing deadline notifications only — never resets read_at. */
export async function syncDeadlineNotifications (
  supabase: SupabaseClient,
  userId: string,
  tasks: Task[]
): Promise<void> {
  const myOpenTasks = tasks.filter(
    (task) => task.assignee_id === userId && task.status !== 'done' && task.due_date && !task.deleted_at
  )
  const pending = buildDeadlineNotifications(myOpenTasks)

  if (pending.length === 0) return

  await supabase.from('notifications').upsert(
    pending.map((item) => ({
      user_id: item.user_id,
      type: item.type,
      task_id: item.task_id,
      message: item.message
    })),
    { onConflict: 'user_id,task_id,type', ignoreDuplicates: true }
  )
}

export async function fetchUserNotifications (
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as Notification[]
}

export function formatRelativeTime (isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
