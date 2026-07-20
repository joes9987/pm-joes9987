export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type TaskDifficulty = 'low' | 'mid' | 'high'

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
  github_repo: string | null
  created_at: string
  updated_at?: string
}

export type Task = {
  id: string
  project_id: string
  title: string
  description: string
  status: TaskStatus
  difficulty: TaskDifficulty
  assignee_id: string | null
  created_by: string
  due_date: string | null
  completed_at?: string | null
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export type PointEvent = {
  id: string
  user_id: string
  task_id: string
  points: number
  difficulty: TaskDifficulty
  awarded_at: string
}

export type TaskComment = {
  id: string
  task_id: string
  author_id: string
  body: string
  created_at: string
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

export const TASK_DIFFICULTIES: TaskDifficulty[] = ['low', 'mid', 'high']

export const DIFFICULTY_POINTS: Record<TaskDifficulty, number> = {
  low: 10,
  mid: 25,
  high: 50
}

export function formatStatus (status: TaskStatus): string {
  return status.replace('_', ' ')
}

export function formatDifficulty (difficulty: TaskDifficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}
