import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { ui } from '@/lib/ui'

export default async function ResetPasswordPage () {
  if (!isSupabaseConfigured()) redirect('/login')

  const supabase = await createClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/forgot-password')

  return (
    <main className={`${ui.meshBg} relative flex min-h-screen flex-col justify-center px-4 py-16`}>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-md">
        <div className={`${ui.cardElevated} animate-fade-up`}>
          <p className={ui.eyebrow}>Account recovery</p>
          <h1 className={`${ui.pageTitle} mt-2`}>Set a new password</h1>
          <p className={`${ui.pageSubtitle} mt-2`}>
            Choose a new password for {user.email}.
          </p>
          <div className="mt-6">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </main>
  )
}
