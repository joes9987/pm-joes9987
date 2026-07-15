'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatProjectCountdown, fromDatetimeLocalValue } from '@/lib/task-deadlines'
import { ui } from '@/lib/ui'
import type { Project } from '@/lib/types'

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
  const [targetDate, setTargetDate] = useState('')
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
      .insert({
        name,
        description,
        owner_id: userId,
        target_date: fromDatetimeLocalValue(targetDate)
      })
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
    setTargetDate('')
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
      <section className={ui.card}>
        <h2 className={ui.sectionTitle}>Create project</h2>
        <form onSubmit={createProject} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={ui.label}>
            Name
            <input
              required
              className={ui.field}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className={ui.label}>
            Target deadline (optional)
            <input
              type="datetime-local"
              className={ui.field}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className={`${ui.label} md:col-span-2`}>
            Description
            <textarea
              className={ui.field}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className={ui.btnPrimary}>
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
        {success && (
          <p className={`mt-3 ${ui.alertSuccess}`}>
            {success}{' '}
            <Link href="/dashboard" className={ui.linkAccent}>Go to Dashboard →</Link>
          </p>
        )}
        {error && <p className={`mt-3 ${ui.alertError}`}>{error}</p>}
      </section>

      <section className={ui.card}>
        <h2 className={ui.sectionTitle}>Your projects</h2>
        <ul className={`mt-4 ${ui.divider}`}>
          {projects.length === 0 && (
            <li className="py-6 text-sm text-[var(--muted)]">No projects yet.</li>
          )}
          {projects.map((project) => {
            const countdown = formatProjectCountdown(project.target_date)

            return (
              <li key={project.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {project.name}
                    {project.archived && (
                      <span className="ml-2 rounded-full bg-[var(--warning-bg)] px-2 py-0.5 text-xs font-medium text-[var(--warning-fg)]">
                        archived
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">{project.description || 'No description'}</p>
                  {countdown && (
                    <p className={`mt-1 text-xs font-medium ${
                      countdown.includes('past deadline') ? 'text-[var(--danger-fg)]' : 'text-[var(--accent-foreground)]'
                    }`}>
                      {countdown}
                    </p>
                  )}
                </div>
                <button type="button" onClick={() => toggleArchive(project)} className={ui.btnGhost}>
                  {project.archived ? 'Restore' : 'Archive'}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
