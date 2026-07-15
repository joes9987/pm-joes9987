export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type NotificationType = 'assigned' | 'due_soon' | 'overdue' | 'completed'

export type Profile = {
  id: string
  email: string
  display_name: string
}

export type Project = {
  id: string
  name: string
  description: string
  owner_id: string
  archived: boolean
  target_date: string | null
  created_at: string
  updated_at?: string
}

export type Task = {
  id: string
  project_id: string
  title: string
  description: string
  status: TaskStatus
  assignee_id: string | null
  created_by: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  task_id: string | null
  message: string
  read_at: string | null
  created_at: string
}

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

export function formatStatus (status: TaskStatus): string {
  return status.replace('_', ' ')
}
