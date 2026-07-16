'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  deadlineBadgeClass,
  deadlineBadgeLabel,
  formatDueDate,
  fromDatetimeLocalValue,
  getDeadlineStatus,
  isDueThisWeek,
  isOnTimeCompletion,
  isOverdue,
  sortByUrgency,
  toDatetimeLocalValue,
  type QuickFilter
} from '@/lib/task-deadlines'
import { ui } from '@/lib/ui'
import {
  DIFFICULTY_POINTS,
  formatDifficulty,
  formatStatus,
  TASK_DIFFICULTIES,
  TASK_STATUSES,
  type Profile,
  type Project,
  type Task,
  type TaskDifficulty,
  type TaskStatus
} from '@/lib/types'

const fieldClass = ui.field
const selectClass = ui.field

type TaskBoardProps = {
  initialTasks: Task[]
  projects: Project[]
  members: Profile[]
  currentUserId: string
  initialQuickFilter?: QuickFilter
  highlightTaskId?: string
}

export function TaskBoard ({
  initialTasks,
  projects: initialProjects,
  members,
  currentUserId,
  initialQuickFilter = 'all',
  highlightTaskId
}: TaskBoardProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [tasks, setTasks] = useState(initialTasks)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(initialQuickFilter)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('low')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [completionMessage, setCompletionMessage] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editProjectId, setEditProjectId] = useState('')
  const [editAssigneeId, setEditAssigneeId] = useState('')
  const [editDifficulty, setEditDifficulty] = useState<TaskDifficulty>('low')
  const [editDueDate, setEditDueDate] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const highlightRef = useRef<HTMLLIElement | null>(null)

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects]
  )

  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])

  useEffect(() => {
    setQuickFilter(initialQuickFilter)
  }, [initialQuickFilter])

  useEffect(() => {
    if (activeProjects.length === 0) {
      setProjectId('')
      return
    }
    if (!projectId || !activeProjects.some((project) => project.id === projectId)) {
      setProjectId(activeProjects[0].id)
    }
  }, [activeProjects, projectId])

  useEffect(() => {
    if (highlightTaskId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightTaskId, tasks])

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (projectFilter !== 'all' && task.project_id !== projectFilter) return false
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (assigneeFilter !== 'all' && task.assignee_id !== assigneeFilter) return false
      if (quickFilter === 'mine' && task.assignee_id !== currentUserId) return false
      if (quickFilter === 'overdue' && !isOverdue(task.due_date, task.status)) return false
      if (quickFilter === 'due_this_week' && !isDueThisWeek(task.due_date, task.status)) return false
      return true
    })

    if (quickFilter === 'mine' || quickFilter === 'overdue') {
      return sortByUrgency(filtered)
    }

    return filtered
  }, [tasks, projectFilter, statusFilter, assigneeFilter, quickFilter, currentUserId])

  async function createTask (event: React.FormEvent) {
    event.preventDefault()
    if (!projectId) {
      setError('Create a project first on the Projects page.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        title,
        description,
        status: 'todo',
        difficulty,
        assignee_id: assigneeId || null,
        created_by: currentUserId,
        due_date: fromDatetimeLocalValue(dueDate)
      })
      .select('*')
      .single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setTasks((prev) => [data as Task, ...prev])
    setTitle('')
    setDescription('')
    setAssigneeId('')
    setDifficulty('low')
    setDueDate('')
  }

  async function updateTaskStatus (taskId: string, status: TaskStatus) {
    const previousTask = tasks.find((task) => task.id === taskId)
    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select('*')
      .single()

    if (updateError) {
      setError(updateError.message)
      return
    }

    const updatedTask = data as Task
    setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)))

    if (status === 'done' && previousTask?.status !== 'done') {
      if (isOnTimeCompletion(updatedTask)) {
        setCompletionMessage('Nice — task completed on time.')
      } else if (updatedTask.due_date && getDeadlineStatus(updatedTask.due_date, 'todo') === 'overdue') {
        setCompletionMessage('Completed (was overdue).')
      } else {
        setCompletionMessage('Task marked done.')
      }
    }
  }

  function canEditTask (task: Task): boolean {
    if (task.created_by === currentUserId || task.assignee_id === currentUserId) return true
    const project = projects.find((item) => item.id === task.project_id)
    return project?.owner_id === currentUserId
  }

  function startEditingTask (task: Task) {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditProjectId(task.project_id)
    setEditAssigneeId(task.assignee_id ?? '')
    setEditDifficulty(task.difficulty ?? 'low')
    setEditDueDate(toDatetimeLocalValue(task.due_date))
    setError(null)
  }

  function cancelEditingTask () {
    setEditingTaskId(null)
    setEditTitle('')
    setEditDescription('')
    setEditProjectId('')
    setEditAssigneeId('')
    setEditDifficulty('low')
    setEditDueDate('')
  }

  async function saveTask (taskId: string) {
    if (!editProjectId) {
      setError('Select a project for this task.')
      return
    }

    setEditLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({
        title: editTitle,
        description: editDescription,
        project_id: editProjectId,
        assignee_id: editAssigneeId || null,
        difficulty: editDifficulty,
        due_date: fromDatetimeLocalValue(editDueDate),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select('*')
      .single()

    setEditLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setTasks((prev) => prev.map((task) => (task.id === taskId ? (data as Task) : task)))
    cancelEditingTask()
  }

  const memberName = (id: string | null) =>
    members.find((member) => member.id === id)?.display_name ?? 'Unassigned'

  const projectName = (id: string) =>
    projects.find((project) => project.id === id)?.name ?? 'Unknown project'

  function applyQuickFilter (filter: QuickFilter) {
    setQuickFilter(filter)
    if (filter === 'mine') {
      setAssigneeFilter(currentUserId)
    } else if (assigneeFilter === currentUserId) {
      setAssigneeFilter('all')
    }
  }

  return (
    <div className="space-y-6">
      {completionMessage && (
        <div className={ui.alertSuccess}>{completionMessage}</div>
      )}

      {activeProjects.length === 0 && (
        <div className={ui.alertWarning}>
          <p className="font-medium">No projects yet</p>
          <p className="mt-1">
            Create a project before adding tasks.{' '}
            <Link href="/projects" className={ui.linkAccent}>
              Go to Projects →
            </Link>
          </p>
        </div>
      )}

      <section className={ui.card}>
        <h2 className={ui.sectionTitle}>Create task</h2>
        <form onSubmit={createTask} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={`${ui.label} md:col-span-2`}>
            Title
            <input
              required
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={activeProjects.length === 0 || loading}
            />
          </label>
          <label className={`${ui.label} md:col-span-2`}>
            Description
            <textarea
              className={fieldClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={activeProjects.length === 0 || loading}
            />
          </label>
          <label className={ui.label}>
            Project
            <select
              required
              className={selectClass}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={activeProjects.length === 0 || loading}
            >
              {activeProjects.length === 0 ? (
                <option value="">No projects — create one first</option>
              ) : (
                activeProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))
              )}
            </select>
          </label>
          <label className={ui.label}>
            Assignee
            <select
              className={selectClass}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={activeProjects.length === 0 || loading}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.display_name}</option>
              ))}
            </select>
          </label>
          <label className={ui.label}>
            Difficulty
            <select
              className={selectClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
              disabled={activeProjects.length === 0 || loading}
            >
              {TASK_DIFFICULTIES.map((level) => (
                <option key={level} value={level}>
                  {formatDifficulty(level)} ({DIFFICULTY_POINTS[level]} pts)
                </option>
              ))}
            </select>
          </label>
          <label className={ui.label}>
            Due date (optional)
            <input
              type="datetime-local"
              className={fieldClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={activeProjects.length === 0 || loading}
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={activeProjects.length === 0 || loading}
              className={`${ui.btnPrimary} disabled:cursor-not-allowed`}
            >
              {loading ? 'Adding…' : 'Add task'}
            </button>
          </div>
        </form>
        {error && <p className={`mt-3 ${ui.alertError}`}>{error}</p>}
      </section>

      <section className={ui.card}>
        <div className="flex flex-wrap items-end gap-4">
          <h2 className={`mr-auto ${ui.sectionTitle}`}>Tasks ({filteredTasks.length})</h2>
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'All'],
              ['mine', 'My tasks'],
              ['overdue', 'Overdue'],
              ['due_this_week', 'Due this week']
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => applyQuickFilter(value)}
                className={quickFilter === value ? ui.btnFilterActive : ui.btnFilterIdle}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="text-sm text-[var(--muted-foreground)]">
            Project
            <select
              className={`ml-2 ${ui.select}`}
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[var(--muted-foreground)]">
            Status
            <select
              className={`ml-2 ${ui.select}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>{formatStatus(status)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[var(--muted-foreground)]">
            Assignee
            <select
              className={`ml-2 ${ui.select}`}
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value)
                if (e.target.value !== currentUserId && quickFilter === 'mine') {
                  setQuickFilter('all')
                }
              }}
            >
              <option value="all">All</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.display_name}</option>
              ))}
            </select>
          </label>
        </div>

        <ul className={`mt-4 ${ui.divider}`}>
          {filteredTasks.length === 0 && (
            <li className="py-8 text-center text-sm text-[var(--muted)]">No tasks match these filters.</li>
          )}
          {filteredTasks.map((task) => {
            const deadlineStatus = getDeadlineStatus(task.due_date, task.status)
            const isHighlighted = highlightTaskId === task.id
            const isEditing = editingTaskId === task.id
            const editable = canEditTask(task)

            return (
              <li
                key={task.id}
                ref={isHighlighted ? highlightRef : null}
                className={`flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between ${
                  isHighlighted ? 'rounded-xl border border-[var(--primary)]/30 bg-[var(--nav-active)]/50 px-3' : ''
                }`}
              >
                {isEditing ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      void saveTask(task.id)
                    }}
                    className="grid w-full gap-4 md:grid-cols-2"
                  >
                    <label className={`${ui.label} md:col-span-2`}>
                      Title
                      <input
                        required
                        className={fieldClass}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        disabled={editLoading}
                      />
                    </label>
                    <label className={`${ui.label} md:col-span-2`}>
                      Description
                      <textarea
                        className={fieldClass}
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        disabled={editLoading}
                      />
                    </label>
                    <label className={ui.label}>
                      Project
                      <select
                        required
                        className={selectClass}
                        value={editProjectId}
                        onChange={(e) => setEditProjectId(e.target.value)}
                        disabled={editLoading}
                      >
                        {activeProjects.map((project) => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className={ui.label}>
                      Assignee
                      <select
                        className={selectClass}
                        value={editAssigneeId}
                        onChange={(e) => setEditAssigneeId(e.target.value)}
                        disabled={editLoading}
                      >
                        <option value="">Unassigned</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>{member.display_name}</option>
                        ))}
                      </select>
                    </label>
                    <label className={ui.label}>
                      Difficulty
                      <select
                        className={selectClass}
                        value={editDifficulty}
                        onChange={(e) => setEditDifficulty(e.target.value as TaskDifficulty)}
                        disabled={editLoading}
                      >
                        {TASK_DIFFICULTIES.map((level) => (
                          <option key={level} value={level}>
                            {formatDifficulty(level)} ({DIFFICULTY_POINTS[level]} pts)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={ui.label}>
                      Due date (optional)
                      <input
                        type="datetime-local"
                        className={fieldClass}
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        disabled={editLoading}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <button type="submit" disabled={editLoading} className={ui.btnPrimary}>
                        {editLoading ? 'Saving…' : 'Save changes'}
                      </button>
                      <button type="button" onClick={cancelEditingTask} disabled={editLoading} className={ui.btnSecondary}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[var(--foreground)]">{task.title}</p>
                        {deadlineStatus !== 'none' && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${deadlineBadgeClass(deadlineStatus)}`}>
                            {deadlineBadgeLabel(deadlineStatus)}
                          </span>
                        )}
                        <span className="rounded-full bg-[var(--nav-active)] px-2 py-0.5 text-xs font-medium text-[var(--nav-active-fg)]">
                          {formatDifficulty(task.difficulty ?? 'low')} · {DIFFICULTY_POINTS[task.difficulty ?? 'low']} pts
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">{task.description || 'No description'}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {projectName(task.project_id)} · {memberName(task.assignee_id)}
                        {task.due_date && ` · Due ${formatDueDate(task.due_date)}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {editable && (
                        <button type="button" onClick={() => startEditingTask(task)} className={ui.btnGhost}>
                          Edit
                        </button>
                      )}
                      <select
                        className={ui.select}
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      >
                        {TASK_STATUSES.map((status) => (
                          <option key={status} value={status}>{formatStatus(status)}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
