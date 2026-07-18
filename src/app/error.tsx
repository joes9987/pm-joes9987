'use client'

import { useEffect } from 'react'
import { AuthSprig } from '@/components/brand/illustrations'
import { ui } from '@/lib/ui'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage ({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className={`${ui.meshBg} px-4 py-16`}>
      <div className="mx-auto max-w-3xl">
        <AuthSprig className="mb-4 h-12 w-12" />
        <h1 className={ui.pageTitle}>Something went wrong</h1>
        <p className={`mt-2 ${ui.pageSubtitle}`}>
          Try again. If this keeps happening, refresh the page.
        </p>
        <button type="button" onClick={reset} className={`${ui.btnPrimary} mt-6`}>
          Retry
        </button>
      </div>
    </main>
  )
}
