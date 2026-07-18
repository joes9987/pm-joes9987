import Link from 'next/link'
import { EudaWordmark } from '@/components/brand/EudaLogo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { landingHero } from '@/lib/landing-content'
import { ui } from '@/lib/ui'

export function PublicHeader () {
  return (
    <header className="app-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center">
          <EudaWordmark title={landingHero.title} />
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
