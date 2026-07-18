import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { landingHero } from '@/lib/landing-content'
import { ui } from '@/lib/ui'

export function PublicHeader () {
  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="brand-mark shrink-0" aria-hidden>EP</span>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-gradient">{landingHero.title}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href={landingHero.secondaryCta.href} className={`${ui.btnGhost} hidden sm:inline-flex`}>
            {landingHero.secondaryCta.label}
          </Link>
          <Link href={landingHero.primaryCta.href} className={ui.btnPrimary}>
            {landingHero.primaryCta.label}
          </Link>
        </div>
      </div>
    </header>
  )
}
