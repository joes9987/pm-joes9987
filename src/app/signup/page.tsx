import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export default function SignupPage () {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-zinc-50 px-4 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Create account</h1>
        <p className="mt-2 text-sm text-zinc-600">Open registration for cohort reviewers and staff smoke tests.</p>
        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>
      </div>
    </main>
  )
}
