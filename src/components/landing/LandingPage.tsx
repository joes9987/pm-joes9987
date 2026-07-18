import Link from 'next/link'
import { PublicHeader } from '@/components/landing/PublicHeader'
import {
  landingFeatures,
  landingFinalCta,
  landingFooter,
  landingHero,
  landingPurpose,
  landingSteps
} from '@/lib/landing-content'
import { ui } from '@/lib/ui'

type LandingPageProps = {
  showConfigWarning?: boolean
}

function FeatureBullet ({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" aria-hidden />
      {children}
    </li>
  )
}

export function LandingPage ({ showConfigWarning = false }: LandingPageProps) {
  return (
    <div className={ui.meshBg}>
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        {showConfigWarning && (
          <p className={`${ui.alertWarning} mb-8 animate-fade-up`} role="alert">
            Backend pending: add Supabase env vars in Vercel and run `supabase/schema.sql`.
          </p>
        )}

        {/* Hero */}
        <section aria-labelledby="hero-title" className="animate-fade-up pb-16 pt-6 md:pb-20 md:pt-10">
          <p className={ui.eyebrow}>{landingHero.eyebrow}</p>
          <span className="brand-mark mb-5 mt-4 inline-flex">EP</span>
          <h1 id="hero-title" className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            <span className="text-gradient">{landingHero.title}</span>
          </h1>
          <p className="mt-3 text-xl font-medium text-[var(--foreground)]">{landingHero.tagline}</p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)]">
            {landingHero.subhead}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={landingHero.primaryCta.href} className={ui.btnPrimaryLg}>
              {landingHero.primaryCta.label}
            </Link>
            <Link href={landingHero.secondaryCta.href} className={ui.btnSecondary}>
              {landingHero.secondaryCta.label}
            </Link>
          </div>
        </section>

        {/* Purpose */}
        <section aria-labelledby="purpose-title" className="animate-fade-up animate-fade-up-delay-1 pb-16">
          <h2 id="purpose-title" className={`${ui.sectionTitle} text-2xl`}>
            {landingPurpose.title}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--muted-foreground)] leading-relaxed">
            {landingPurpose.body}
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {landingPurpose.stats.map((stat) => (
              <li key={stat.label} className={`${ui.cardSm} text-center`}>
                <p className="font-mono text-2xl font-semibold text-[var(--foreground)]">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-[var(--muted)]">{stat.label}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section aria-labelledby="features-title" className="animate-fade-up animate-fade-up-delay-2 pb-16">
          <h2 id="features-title" className={`${ui.sectionTitle} text-2xl`}>
            Everything your cohort needs
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
            Work, collaboration, and motivation — in one focused workspace.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {landingFeatures.map((group, index) => (
              <li
                key={group.category}
                className={`${ui.card} animate-fade-up`}
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <p className={ui.eyebrow}>{group.category}</p>
                <h3 className={`${ui.sectionTitle} mt-2`}>{group.title}</h3>
                <ul className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <FeatureBullet key={item}>{item}</FeatureBullet>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section aria-labelledby="steps-title" className="animate-fade-up animate-fade-up-delay-3 pb-16">
          <h2 id="steps-title" className={`${ui.sectionTitle} text-2xl`}>
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {landingSteps.map((step) => (
              <li key={step.step} className={ui.cardSm}>
                <p className="font-mono text-sm font-semibold text-[var(--primary)]">Step {step.step}</p>
                <h3 className="mt-2 font-semibold text-[var(--foreground)]">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="cta-title" className="animate-fade-up pb-12">
          <div className={`${ui.cardElevated} text-center`}>
            <h2 id="cta-title" className="font-display text-2xl font-semibold text-[var(--foreground)]">
              {landingFinalCta.title}
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={landingFinalCta.primaryCta.href} className={ui.btnPrimaryLg}>
                {landingFinalCta.primaryCta.label}
              </Link>
              <Link href={landingFinalCta.secondaryCta.href} className={ui.btnSecondary}>
                {landingFinalCta.secondaryCta.label}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-6">
        <p className="mx-auto max-w-6xl text-center text-xs text-[var(--muted)]">
          {landingFooter}
        </p>
      </footer>
    </div>
  )
}
