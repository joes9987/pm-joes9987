'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ui } from '@/lib/ui'
import type { Notification } from '@/lib/types'

function SignOutButton ({ className }: { className?: string }) {
  const router = useRouter()

  async function signOut () {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button type="button" onClick={signOut} className={className ?? ui.btnGhost}>
      Sign out
    </button>
  )
}

type AppHeaderProps = {
  email: string
  displayName: string
  userId: string
  initialNotifications: Notification[]
}

function NavLink ({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`${ui.navLink} ${active ? 'bg-[var(--nav-active)] text-[var(--nav-active-fg)]' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  )
}

export function AppHeader ({ email, displayName, userId, initialNotifications }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const label = displayName || email.split('@')[0]

  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="brand-mark shrink-0" aria-hidden>EP</span>
          <div className="min-w-0">
            <Link href="/dashboard" className="font-display text-lg font-bold tracking-tight">
              <span className="text-gradient">EudaPM</span>
            </Link>
            <p className="truncate text-xs text-[var(--muted)]">{label}</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/projects" label="Projects" />
            <NavLink href="/progress" label="Progress" />
            <NavLink href="/search" label="Search" />
            <NavLink href="/settings" label="Settings" />
          </nav>
          <NotificationBell userId={userId} initialNotifications={initialNotifications} />
          <ThemeToggle />
          <SignOutButton />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <NotificationBell userId={userId} initialNotifications={initialNotifications} />
          <ThemeToggle />
          <button
            type="button"
            className={ui.btnGhost}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="border-t border-[var(--border)] px-4 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            <NavLink href="/dashboard" label="Dashboard" onNavigate={() => setMenuOpen(false)} />
            <NavLink href="/projects" label="Projects" onNavigate={() => setMenuOpen(false)} />
            <NavLink href="/progress" label="Progress" onNavigate={() => setMenuOpen(false)} />
            <NavLink href="/search" label="Search" onNavigate={() => setMenuOpen(false)} />
            <NavLink href="/settings" label="Settings" onNavigate={() => setMenuOpen(false)} />
            <SignOutButton className={`${ui.btnGhost} mt-2 w-full text-left`} />
          </div>
        </nav>
      )}
    </header>
  )
}
