import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export default function LoginPage () {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <Link href="/" className="mb-6 text-sm text-zinc-500 hover:text-zinc-800">← Back</Link>
      <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">Access your cohort projects and tasks.</p>
      <div className="mt-6">
        <AuthForm mode="login" />
      </div>
    </main>
  )
}
