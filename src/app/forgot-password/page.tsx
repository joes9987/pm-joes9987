import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ui } from '@/lib/ui'

export default function ForgotPasswordPage () {
  return (
    <main className={`${ui.meshBg} relative flex min-h-screen flex-col justify-center px-4 py-16`}>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-md">
        <div className={`${ui.cardElevated} animate-fade-up`}>
          <Link href="/login" className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--primary)]">
            ← Back to sign in
          </Link>
          <p className={`${ui.eyebrow} mt-6`}>Account recovery</p>
          <h1 className={`${ui.pageTitle} mt-2`}>Forgot password</h1>
          <p className={`${ui.pageSubtitle} mt-2`}>
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </main>
  )
}
