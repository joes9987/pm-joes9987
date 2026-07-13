'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatStatus, TASK_STATUSES, type Profile, type Project, type Task, type TaskStatus } from '@/lib/types'

type TaskBoardProps = {
  initialTasks: Task[]
  projects: Project[]
  members: Profile[]
  currentUserId: string
}

export function TaskBoard ({ initialTasks, projects, members, currentUserId }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (projectFilter !== 'all' && task.project_id !== projectFilter) return false
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (assigneeFilter !== 'all' && task.assignee_id !== assigneeFilter) return false
      return true
    })
  }, [tasks, projectFilter, statusFilter, assigneeFilter])

  async function createTask (event: React.FormEvent) {
    event.preventDefault()
    if (!projectId) {
      setError('Create a project first.')
      return
    }

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        title,
        description,
        status: 'todo',
        assignee_id: assigneeId || null,
        created_by: currentUserId
      })
      .select('*')
      .single()

    if (insertError) {
      setError(insertError.message)
      return
    }

    setTasks((prev) => [data as Task, ...prev])
    setTitle('')
    setDescription('')
    setAssigneeId('')
    setError(null)
  }

  async function updateTaskStatus (taskId: string, status: TaskStatus) {
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

    setTasks((prev) => prev.map((task) => (task.id === taskId ? (data as Task) : task)))
  }

  const memberName = (id: string | null) =>
    members.find((member) => member.id === id)?.display_name ?? 'Unassigned'

  const projectName = (id: string) =>
    projects.find((project) => project.id === id)?.name ?? 'Unknown project'

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Create task</h2>
        <form onSubmit={createTask} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700 md:col-span-2">
            Title
            <input
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 md:col-span-2">
            Description
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Project
            <select
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Assignee
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.display_name}</option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              Add task
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <h2 className="mr-auto text-lg font-semibold text-zinc-900">Tasks ({filteredTasks.length})</h2>
          <label className="text-sm text-zinc-600">
            Project
            <select className="ml-2 rounded border border-zinc-300 px-2 py-1" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="all">All</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-600">
            Status
            <select className="ml-2 rounded border border-zinc-300 px-2 py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>{formatStatus(status)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-600">
            Assignee
            <select className="ml-2 rounded border border-zinc-300 px-2 py-1" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
              <option value="all">All</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.display_name}</option>
              ))}
            </select>
          </label>
        </div>

        <ul className="mt-4 divide-y divide-zinc-100">
          {filteredTasks.length === 0 && (
            <li className="py-8 text-center text-sm text-zinc-500">No tasks match these filters.</li>
          )}
          {filteredTasks.map((task) => (
            <li key={task.id} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-zinc-900">{task.title}</p>
                <p className="text-sm text-zinc-600">{task.description || 'No description'}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {projectName(task.project_id)} · {memberName(task.assignee_id)}
                </p>
              </div>
              <select
                className="rounded border border-zinc-300 px-2 py-1 text-sm"
                value={task.status}
                onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>{formatStatus(status)}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
