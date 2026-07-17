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
          <p className={`${ui.alertWarning} mb-6 animate-fade-up`} role="alert">
            Backend pending: add Supabase env vars in Vercel and run `supabase/schema.sql`.
          </p>
        )}

        <div className="animate-fade-up">
          <span className="brand-mark mb-5">EP</span>
          <h1 className="font-display mt-2 text-5xl font-extrabold tracking-tight sm:text-6xl">
            <span className="text-gradient">EudaPM</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--muted-foreground)]">
            Plan work. Earn momentum.
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

        <ul className="mt-12 flex flex-col gap-2 text-sm text-[var(--muted-foreground)] animate-fade-up animate-fade-up-delay-2 sm:flex-row sm:flex-wrap sm:gap-x-8">
          {[
            'Deadlines & live notifications',
            'Difficulty points & leaderboard',
            'Search, comments, soft-delete'
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
