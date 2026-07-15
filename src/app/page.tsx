import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { ui } from '@/lib/ui'

export default async function HomePage () {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) redirect('/dashboard')
    }
  }

  return (
    <main className={`${ui.meshBg} relative flex min-h-screen flex-col justify-center px-4 py-16`}>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-3xl">
        {!isSupabaseConfigured() && (
          <p className={`${ui.alertWarning} mb-6 animate-fade-up`}>
            Backend pending: add Supabase env vars in Vercel and run `supabase/schema.sql`.
          </p>
        )}

        <div className="animate-fade-up">
          <span className="brand-mark mb-4">PM</span>
          <p className={ui.eyebrow}>Hult Cohort · Project 1</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            <span className="text-gradient">Cohort PM</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted-foreground)]">
            A lightweight project management platform for 30+ cohort members — projects, tasks, deadlines, and progress in one place.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 animate-fade-up animate-fade-up-delay-1">
          <Link href="/signup" className={ui.btnPrimaryLg}>
            Get started
          </Link>
          <Link href="/login" className={ui.btnSecondary}>
            Sign in
          </Link>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 animate-fade-up animate-fade-up-delay-2">
          {[
            'Email/password auth for 30+ accounts',
            'Projects with archive support',
            'Due dates and in-app notifications',
            'Progress metrics across projects'
          ].map((item) => (
            <div key={item} className={`${ui.cardSm} flex items-start gap-3`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-foreground)]">
                ✓
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
