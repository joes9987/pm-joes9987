import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'
import { AuthSprig } from '@/components/brand/illustrations'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ui } from '@/lib/ui'

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage ({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const linkInvalid = params.error === 'auth_link_invalid'

  return (
    <main className={`${ui.meshBg} relative flex min-h-screen flex-col justify-center px-4 py-16`}>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-md">
        <div className={`${ui.cardElevated} animate-fade-up`}>
          <div className="flex items-start justify-between gap-4">
            <Link href="/" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--primary)]">
              ← Back to home
            </Link>
            <AuthSprig className="h-11 w-11 shrink-0" />
          </div>
          <p className={`${ui.eyebrow} mt-6`}>Welcome back</p>
          <h1 className={`${ui.pageTitle} mt-2`}>Sign in</h1>
          <p className={`${ui.pageSubtitle} mt-2`}>Access your cohort projects and tasks.</p>
          {linkInvalid && (
            <p className={`${ui.alertError} mt-4`} role="alert">
              That link is invalid or expired. Sign in or request a new reset link.
            </p>
          )}
          <div className="mt-6">
            <AuthForm mode="login" />
          </div>
        </div>
      </div>
    </main>
  )
}
