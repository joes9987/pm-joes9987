'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/lib/types'

export function ProjectManager ({
  initialProjects,
  userId
}: {
  initialProjects: Project[]
  userId: string
}) {
  const [projects, setProjects] = useState(initialProjects)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function createProject (event: React.FormEvent) {
    event.preventDefault()
    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({ name, description, owner_id: userId })
      .select('*')
      .single()

    if (insertError) {
      setError(insertError.message)
      return
    }

    setProjects((prev) => [data as Project, ...prev])
    setName('')
    setDescription('')
    setError(null)
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
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Create project</h2>
        <form onSubmit={createProject} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700">
            Name
            <input
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          <div className="md:col-span-2">
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              Create project
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Your projects</h2>
        <ul className="mt-4 divide-y divide-zinc-100">
          {projects.length === 0 && (
            <li className="py-6 text-sm text-zinc-500">No projects yet.</li>
          )}
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-zinc-900">
                  {project.name}
                  {project.archived && <span className="ml-2 text-xs text-amber-700">(archived)</span>}
                </p>
                <p className="text-sm text-zinc-600">{project.description || 'No description'}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleArchive(project)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
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
