'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EmptyProjects } from '@/components/brand/illustrations'
import { GitHubActivity, GitHubRepoChip } from '@/components/GitHubActivity'
import { normalizeGithubRepo } from '@/lib/github'
import { createClient } from '@/lib/supabase/client'
import { formatProjectCountdown, fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/task-deadlines'
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
  const [githubRepo, setGithubRepo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTargetDate, setEditTargetDate] = useState('')
  const [editGithubRepo, setEditGithubRepo] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [activityProjectId, setActivityProjectId] = useState<string | null>(null)

  function resolveRepoInput (input: string): { repo: string | null; invalid: boolean } {
    if (!input.trim()) return { repo: null, invalid: false }
    const repo = normalizeGithubRepo(input)
    return { repo, invalid: repo === null }
  }

  async function createProject (event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const { repo, invalid } = resolveRepoInput(githubRepo)
    if (invalid) {
      setError('GitHub repository must be "owner/repo" or a github.com URL.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        owner_id: userId,
        target_date: fromDatetimeLocalValue(targetDate),
        github_repo: repo
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
    setGithubRepo('')
    setSuccess(`Project "${(data as Project).name}" created. You can now add tasks on the dashboard.`)
    router.refresh()
  }

  function startEditing (project: Project) {
    setEditingProjectId(project.id)
    setEditName(project.name)
    setEditDescription(project.description)
    setEditTargetDate(toDatetimeLocalValue(project.target_date))
    setEditGithubRepo(project.github_repo ?? '')
    setError(null)
    setSuccess(null)
  }

  function cancelEditing () {
    setEditingProjectId(null)
    setEditName('')
    setEditDescription('')
    setEditTargetDate('')
    setEditGithubRepo('')
  }

  async function saveProject (projectId: string) {
    setError(null)
    setSuccess(null)

    const { repo, invalid } = resolveRepoInput(editGithubRepo)
    if (invalid) {
      setError('GitHub repository must be "owner/repo" or a github.com URL.')
      return
    }

    setEditLoading(true)

    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from('projects')
      .update({
        name: editName,
        description: editDescription,
        target_date: fromDatetimeLocalValue(editTargetDate),
        github_repo: repo,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select('*')
      .single()

    setEditLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setProjects((prev) => prev.map((item) => (item.id === projectId ? (data as Project) : item)))
    setSuccess(`Project "${(data as Project).name}" updated.`)
    cancelEditing()
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
            GitHub repository (optional)
            <input
              className={ui.field}
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="owner/repo or https://github.com/owner/repo"
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
            <li className="flex flex-col items-center gap-3 py-10 text-sm text-[var(--muted)]">
              <EmptyProjects />
              <span>No projects yet. Plant the first one above.</span>
            </li>
          )}
          {projects.map((project) => {
            const countdown = formatProjectCountdown(project.target_date)
            const isOwner = project.owner_id === userId
            const isEditing = editingProjectId === project.id

            return (
              <li key={project.id} className="py-4">
                {isEditing ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      void saveProject(project.id)
                    }}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <label className={ui.label}>
                      Name
                      <input
                        required
                        className={ui.field}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={editLoading}
                      />
                    </label>
                    <label className={ui.label}>
                      Target deadline (optional)
                      <input
                        type="datetime-local"
                        className={ui.field}
                        value={editTargetDate}
                        onChange={(e) => setEditTargetDate(e.target.value)}
                        disabled={editLoading}
                      />
                    </label>
                    <label className={`${ui.label} md:col-span-2`}>
                      GitHub repository (optional)
                      <input
                        className={ui.field}
                        value={editGithubRepo}
                        onChange={(e) => setEditGithubRepo(e.target.value)}
                        placeholder="owner/repo or https://github.com/owner/repo"
                        disabled={editLoading}
                      />
                    </label>
                    <label className={`${ui.label} md:col-span-2`}>
                      Description
                      <textarea
                        className={ui.field}
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        disabled={editLoading}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <button type="submit" disabled={editLoading} className={ui.btnPrimary}>
                        {editLoading ? 'Saving…' : 'Save changes'}
                      </button>
                      <button type="button" onClick={cancelEditing} disabled={editLoading} className={ui.btnSecondary}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
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
                        {project.github_repo && (
                          <div className="mt-2">
                            <GitHubRepoChip repo={project.github_repo} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.github_repo && (
                          <button
                            type="button"
                            onClick={() => setActivityProjectId((prev) => (prev === project.id ? null : project.id))}
                            className={ui.btnGhost}
                            aria-expanded={activityProjectId === project.id}
                          >
                            {activityProjectId === project.id ? 'Hide activity' : 'Activity'}
                          </button>
                        )}
                        {isOwner && (
                          <button type="button" onClick={() => startEditing(project)} className={ui.btnGhost}>
                            Edit
                          </button>
                        )}
                        {isOwner && (
                          <button type="button" onClick={() => toggleArchive(project)} className={ui.btnGhost}>
                            {project.archived ? 'Restore' : 'Archive'}
                          </button>
                        )}
                      </div>
                    </div>
                    {activityProjectId === project.id && project.github_repo && (
                      <div className="mt-4">
                        <GitHubActivity repo={project.github_repo} />
                      </div>
                    )}
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
