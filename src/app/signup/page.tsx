import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function SignupPage () {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Create account</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Open registration for cohort reviewers and staff smoke tests.</p>
        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>
      </div>
    </main>
  )
}
