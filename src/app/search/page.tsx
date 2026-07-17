import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { ui } from '@/lib/ui'

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage ({ searchParams }: SearchPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <main className={`${ui.meshBg} mx-auto max-w-3xl px-4 py-16`}>
        <h1 className={ui.pageTitle}>Search unavailable</h1>
      </main>
    )
  }

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const q = (params.q ?? '').trim()
  const pattern = `%${q}%`

  let tasks: Array<{ id: string, title: string, description: string }> = []
  let projects: Array<{ id: string, name: string, description: string }> = []

  if (q.length >= 2) {
    const [byTitle, byDesc, projectByName, projectByDesc] = await Promise.all([
      supabase.from('tasks').select('id, title, description').is('deleted_at', null).ilike('title', pattern).limit(25),
      supabase.from('tasks').select('id, title, description').is('deleted_at', null).ilike('description', pattern).limit(25),
      supabase.from('projects').select('id, name, description').ilike('name', pattern).limit(15),
      supabase.from('projects').select('id, name, description').ilike('description', pattern).limit(15)
    ])

    const taskMap = new Map<string, { id: string, title: string, description: string }>()
    for (const row of [...(byTitle.data ?? []), ...(byDesc.data ?? [])]) {
      taskMap.set(row.id, row)
    }
    tasks = [...taskMap.values()].slice(0, 25)

    const projectMap = new Map<string, { id: string, name: string, description: string }>()
    for (const row of [...(projectByName.data ?? []), ...(projectByDesc.data ?? [])]) {
      projectMap.set(row.id, row)
    }
    projects = [...projectMap.values()].slice(0, 15)
  }

  return (
    <AppShell>
      <main className={ui.pageMain}>
        <div className="mb-6 animate-fade-up">
          <p className={ui.eyebrow}>Find work</p>
          <h1 className={`${ui.pageTitle} mt-1`}>Search</h1>
        </div>

        <form className={`${ui.card} mb-6`} action="/search" method="get">
          <label className={ui.label}>
            Query
            <input
              name="q"
              defaultValue={q}
              className={ui.field}
              placeholder="Task or project name…"
              autoComplete="off"
            />
          </label>
          <button type="submit" className={`${ui.btnPrimary} mt-4`}>
            Search
          </button>
        </form>

        {q.length > 0 && q.length < 2 && (
          <p className={ui.pageSubtitle}>Enter at least 2 characters.</p>
        )}

        {q.length >= 2 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={ui.card}>
              <h2 className={ui.sectionTitle}>Tasks ({tasks.length})</h2>
              <ul className={`mt-4 ${ui.divider}`}>
                {tasks.length === 0 && (
                  <li className="py-4 text-sm text-[var(--muted)]">No matching tasks.</li>
                )}
                {tasks.map((task) => (
                  <li key={task.id} className="py-3">
                    <Link href={`/dashboard?taskId=${task.id}`} className={ui.linkAccent}>
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{task.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <section className={ui.card}>
              <h2 className={ui.sectionTitle}>Projects ({projects.length})</h2>
              <ul className={`mt-4 ${ui.divider}`}>
                {projects.length === 0 && (
                  <li className="py-4 text-sm text-[var(--muted)]">No matching projects.</li>
                )}
                {projects.map((project) => (
                  <li key={project.id} className="py-3">
                    <Link href="/projects" className={ui.linkAccent}>
                      {project.name}
                    </Link>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{project.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  )
}
