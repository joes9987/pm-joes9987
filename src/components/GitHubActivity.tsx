'use client'

import { useEffect, useState } from 'react'
import { formatRelativeTimestamp, type GitHubEvent, type GitHubEventType } from '@/lib/github'
import { ui } from '@/lib/ui'

const EVENT_LABELS: Record<GitHubEventType, string> = {
  commit: 'Commit',
  pull_request: 'PR',
  issue: 'Issue'
}

function GitHubMark ({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

export function GitHubRepoChip ({ repo }: { repo: string }) {
  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--card-solid)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
    >
      <GitHubMark className="h-3.5 w-3.5" />
      {repo}
    </a>
  )
}

type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; events: GitHubEvent[] }

export function GitHubActivity ({ repo, limit = 15 }: { repo: string; limit?: number }) {
  const [state, setState] = useState<FeedState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    async function load () {
      try {
        const res = await fetch(`/api/github/activity?repo=${encodeURIComponent(repo)}`)
        const body = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setState({ status: 'error', message: body.error ?? `GitHub request failed (${res.status}).` })
          return
        }
        setState({ status: 'ready', events: (body.events as GitHubEvent[]).slice(0, limit) })
      } catch {
        if (!cancelled) setState({ status: 'error', message: 'Could not reach GitHub. Check your connection.' })
      }
    }

    void load()
    return () => { cancelled = true }
  }, [repo, limit])

  if (state.status === 'loading') {
    return <p className="py-3 text-sm text-[var(--muted)]">Loading activity from {repo}…</p>
  }

  if (state.status === 'error') {
    return <p className={ui.alertWarning}>{state.message}</p>
  }

  if (state.events.length === 0) {
    return <p className="py-3 text-sm text-[var(--muted)]">No recent activity in {repo}.</p>
  }

  return (
    <ul className={`${ui.divider} rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-4`}>
      {state.events.map((event) => (
        <li key={event.url + event.timestamp} className="flex items-start gap-3 py-2.5">
          <span className="mt-0.5 inline-flex w-14 shrink-0 justify-center rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-foreground)]">
            {EVENT_LABELS[event.type]}
          </span>
          <span className="min-w-0 flex-1">
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
            >
              {event.title}
            </a>
            <span className="text-xs text-[var(--muted)]">
              {event.author} · {formatRelativeTimestamp(event.timestamp)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
