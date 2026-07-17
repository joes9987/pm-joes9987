'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ui } from '@/lib/ui'

type ProfileSettingsProps = {
  userId: string
  initialDisplayName: string
  email: string
}

export function ProfileSettings ({ userId, initialDisplayName, email }: ProfileSettingsProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit (event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', userId)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess('Display name updated.')
    router.refresh()
  }

  return (
    <section className={`${ui.card} animate-fade-up`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className={ui.label}>
          Email
          <input className={ui.field} value={email} disabled readOnly />
        </label>
        <label className={ui.label}>
          Display name
          <input
            required
            className={ui.field}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
            autoComplete="nickname"
          />
        </label>
        <button type="submit" disabled={loading} className={ui.btnPrimary}>
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>
      {success && <p className={`mt-3 ${ui.alertSuccess}`} role="status">{success}</p>}
      {error && <p className={`mt-3 ${ui.alertError}`} role="alert">{error}</p>}
    </section>
  )
}
