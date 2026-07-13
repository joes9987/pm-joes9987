'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton () {
  const router = useRouter()

  async function signOut () {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
    >
      Sign out
    </button>
  )
}

export function AppHeader ({ email }: { email: string }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <Link href="/dashboard" className="text-lg font-semibold text-zinc-900">
            Cohort PM
          </Link>
          <p className="text-sm text-zinc-500">Signed in as {email}</p>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            Dashboard
          </Link>
          <Link href="/projects" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            Projects
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  )
}
