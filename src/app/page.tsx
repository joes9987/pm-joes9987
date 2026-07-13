import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage () {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) redirect('/dashboard')
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16">
      {!isSupabaseConfigured() && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Backend pending: add Supabase env vars in Vercel and run `supabase/schema.sql`.
        </p>
      )}
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Hult Cohort · Project 1</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900">
        Cohort PM
      </h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-600">
        A lightweight project management platform for 30+ cohort members — projects, tasks, assignments, and status workflows in one place.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/signup" className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
          Get started
        </Link>
        <Link href="/login" className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-white">
          Sign in
        </Link>
      </div>
      <ul className="mt-10 grid gap-3 text-sm text-zinc-600 md:grid-cols-2">
        <li>✓ Email/password auth for 30+ accounts</li>
        <li>✓ Projects with archive support</li>
        <li>✓ Tasks with todo / in progress / done</li>
        <li>✓ Filter by project, status, assignee</li>
      </ul>
    </main>
  )
}
