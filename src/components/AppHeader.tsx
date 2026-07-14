'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'

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
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      Sign out
    </button>
  )
}

export function AppHeader ({ email }: { email: string }) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <Link href="/dashboard" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Cohort PM
          </Link>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Signed in as {email}</p>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
            Dashboard
          </Link>
          <Link href="/projects" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
            Projects
          </Link>
          <ThemeToggle />
          <SignOutButton />
        </nav>
      </div>
    </header>
  )
}
