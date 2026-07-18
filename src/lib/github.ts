export type GitHubEventType = 'commit' | 'pull_request' | 'issue'

export type GitHubEvent = {
  type: GitHubEventType
  title: string
  author: string
  url: string
  timestamp: string
}

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/

/**
 * Accepts "owner/repo" or any github.com URL form and returns the
 * canonical "owner/repo", or null if the input is not recognizable.
 */
export function normalizeGithubRepo (input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const withoutProtocol = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '')

  const parts = withoutProtocol.split('/')
  if (parts.length < 2) return null

  const candidate = `${parts[0]}/${parts[1]}`
  return REPO_PATTERN.test(candidate) ? candidate : null
}

export function formatRelativeTimestamp (iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
