import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ui } from '@/lib/ui'

export default function LoginPage () {
  return (
    <main className={`${ui.meshBg} relative flex min-h-screen flex-col justify-center ${ui.pageMainNarrow}`}>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className={`${ui.cardElevated} animate-fade-up`}>
        <Link href="/" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--primary)]">
          ← Back to home
        </Link>
        <p className={`${ui.eyebrow} mt-6`}>Welcome back</p>
        <h1 className={`${ui.pageTitle} mt-2`}>Sign in</h1>
        <p className={`${ui.pageSubtitle} mt-2`}>Access your cohort projects and tasks.</p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
      </div>
    </main>
  )
}
