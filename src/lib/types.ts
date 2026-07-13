export type TaskStatus = 'todo' | 'in_progress' | 'done'

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
  created_at: string
}

export type Task = {
  id: string
  project_id: string
  title: string
  description: string
  status: TaskStatus
  assignee_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

export function formatStatus (status: TaskStatus): string {
  return status.replace('_', ' ')
}
