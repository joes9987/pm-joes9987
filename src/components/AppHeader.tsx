'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ui } from '@/lib/ui'
import type { Notification } from '@/lib/types'

export function SignOutButton () {
  const router = useRouter()

  async function signOut () {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button type="button" onClick={signOut} className={ui.btnGhost}>
      Sign out
    </button>
  )
}

type AppHeaderProps = {
  email: string
  userId: string
  initialNotifications: Notification[]
}

function NavLink ({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href

  return (
    <Link
      href={href}
      className={`${ui.navLink} ${active ? 'bg-[var(--nav-active)] text-[var(--nav-active-fg)]' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  )
}

export function AppHeader ({ email, userId, initialNotifications }: AppHeaderProps) {
  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="brand-mark" aria-hidden>PM</span>
          <div>
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              <span className="text-gradient">Cohort PM</span>
            </Link>
            <p className="text-xs text-[var(--muted)]">{email}</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/projects" label="Projects" />
          <NavLink href="/progress" label="Progress" />
          <NotificationBell userId={userId} initialNotifications={initialNotifications} />
          <ThemeToggle />
          <SignOutButton />
        </nav>
      </div>
    </header>
  )
}
