import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { ProjectManager } from '@/components/ProjectManager'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types'
import { ui } from '@/lib/ui'

export default async function ProjectsPage () {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Projects unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600">Configure Supabase environment variables to enable auth and data.</p>
      </main>
    )
  }

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <main className={ui.pageMain}>
        <div className="mb-6 animate-fade-up">
          <p className={ui.eyebrow}>Workspaces</p>
          <h1 className={`${ui.pageTitle} mt-1`}>Projects</h1>
          <p className={`${ui.pageSubtitle} mt-1`}>Create and archive cohort projects.</p>
        </div>
        <ProjectManager
          initialProjects={(projects ?? []) as Project[]}
          userId={user.id}
        />
      </main>
    </AppShell>
  )
}
