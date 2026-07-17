'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ui } from '@/lib/ui'

export function ForgotPasswordForm () {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit (event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <p className={ui.alertSuccess} role="status">
        If an account exists for {email}, a reset link is on its way. Check your inbox.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={ui.label}>
        Email
        <input
          required
          type="email"
          className={ui.field}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>
      {error && <p className={ui.alertError} role="alert">{error}</p>}
      <button type="submit" disabled={loading} className={`w-full ${ui.btnPrimary}`}>
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
