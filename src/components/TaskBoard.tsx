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
  type QuickFilter
} from '@/lib/task-deadlines'
import { formatStatus, TASK_STATUSES, type Profile, type Project, type Task, type TaskStatus } from '@/lib/types'

const fieldClass = 'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100'
const selectClass = fieldClass

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
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [completionMessage, setCompletionMessage] = useState<string | null>(null)
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
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
          {completionMessage}
        </div>
      )}

      {activeProjects.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-medium">No projects yet</p>
          <p className="mt-1 text-amber-900 dark:text-amber-200">
            Create a project before adding tasks.{' '}
            <Link href="/projects" className="font-semibold underline">
              Go to Projects →
            </Link>
          </p>
        </div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create task</h2>
        <form onSubmit={createTask} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 md:col-span-2">
            Title
            <input
              required
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={activeProjects.length === 0 || loading}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 md:col-span-2">
            Description
            <textarea
              className={fieldClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={activeProjects.length === 0 || loading}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 md:col-span-2">
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
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? 'Adding…' : 'Add task'}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex flex-wrap items-end gap-4">
          <h2 className="mr-auto text-lg font-semibold text-zinc-900 dark:text-zinc-50">Tasks ({filteredTasks.length})</h2>
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
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  quickFilter === value
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Project
            <select
              className="ml-2 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Status
            <select
              className="ml-2 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>{formatStatus(status)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            Assignee
            <select
              className="ml-2 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
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

        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-700">
          {filteredTasks.length === 0 && (
            <li className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No tasks match these filters.</li>
          )}
          {filteredTasks.map((task) => {
            const deadlineStatus = getDeadlineStatus(task.due_date, task.status)
            const isHighlighted = highlightTaskId === task.id

            return (
              <li
                key={task.id}
                ref={isHighlighted ? highlightRef : null}
                className={`flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between ${
                  isHighlighted ? 'rounded-lg bg-amber-50 px-3 dark:bg-amber-950/40' : ''
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{task.title}</p>
                    {deadlineStatus !== 'none' && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${deadlineBadgeClass(deadlineStatus)}`}>
                        {deadlineBadgeLabel(deadlineStatus)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{task.description || 'No description'}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {projectName(task.project_id)} · {memberName(task.assignee_id)}
                    {task.due_date && ` · Due ${formatDueDate(task.due_date)}`}
                  </p>
                </div>
                <select
                  className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>{formatStatus(status)}</option>
                  ))}
                </select>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
