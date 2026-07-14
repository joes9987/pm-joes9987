'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/lib/types'

const fieldClass = 'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100'

export function ProjectManager ({
  initialProjects,
  userId
}: {
  initialProjects: Project[]
  userId: string
}) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function createProject (event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({ name, description, owner_id: userId })
      .select('*')
      .single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setProjects((prev) => [data as Project, ...prev])
    setName('')
    setDescription('')
    setSuccess(`Project "${(data as Project).name}" created. You can now add tasks on the dashboard.`)
    router.refresh()
  }

  async function toggleArchive (project: Project) {
    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from('projects')
      .update({ archived: !project.archived, updated_at: new Date().toISOString() })
      .eq('id', project.id)
      .select('*')
      .single()

    if (updateError) {
      setError(updateError.message)
      return
    }

    setProjects((prev) => prev.map((item) => (item.id === project.id ? (data as Project) : item)))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create project</h2>
        <form onSubmit={createProject} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Name
            <input
              required
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 md:col-span-2">
            Description
            <textarea
              className={fieldClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
        {success && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            {success}{' '}
            <Link href="/dashboard" className="font-semibold underline">Go to Dashboard →</Link>
          </p>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Your projects</h2>
        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-700">
          {projects.length === 0 && (
            <li className="py-6 text-sm text-zinc-500 dark:text-zinc-400">No projects yet.</li>
          )}
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {project.name}
                  {project.archived && <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">(archived)</span>}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{project.description || 'No description'}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleArchive(project)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                {project.archived ? 'Restore' : 'Archive'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
