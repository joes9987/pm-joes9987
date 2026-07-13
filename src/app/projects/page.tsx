import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import { ProjectManager } from '@/components/ProjectManager'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types'

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
    <>
      <AppHeader email={user.email ?? 'unknown'} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Projects</h1>
          <p className="text-sm text-zinc-600">Create and archive cohort projects.</p>
        </div>
        <ProjectManager
          initialProjects={(projects ?? []) as Project[]}
          userId={user.id}
        />
      </main>
    </>
  )
}
