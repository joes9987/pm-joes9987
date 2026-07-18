import { NextResponse } from 'next/server'
import { normalizeGithubRepo, type GitHubEvent } from '@/lib/github'

const GITHUB_API = 'https://api.github.com'
const REVALIDATE_SECONDS = 300

type CommitResponse = {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { name: string; date: string } | null
    committer: { date: string } | null
  }
  author: { login: string } | null
}

type IssueResponse = {
  title: string
  html_url: string
  updated_at: string
  user: { login: string } | null
  pull_request?: unknown
}

function githubHeaders (): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

async function fetchGithub (path: string): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
    next: { revalidate: REVALIDATE_SECONDS }
  })
}

export async function GET (request: Request) {
  const { searchParams } = new URL(request.url)
  const repo = normalizeGithubRepo(searchParams.get('repo') ?? '')

  if (!repo) {
    return NextResponse.json({ error: 'Invalid repo. Expected "owner/repo".' }, { status: 400 })
  }

  const [commitsRes, issuesRes] = await Promise.all([
    fetchGithub(`/repos/${repo}/commits?per_page=10`),
    fetchGithub(`/repos/${repo}/issues?state=all&sort=updated&direction=desc&per_page=10`)
  ])

  if (commitsRes.status === 404) {
    return NextResponse.json({ error: 'Repository not found. Is it public?' }, { status: 404 })
  }
  if (commitsRes.status === 403 || commitsRes.status === 429) {
    return NextResponse.json({ error: 'GitHub rate limit reached. Try again in a few minutes.' }, { status: 429 })
  }
  if (!commitsRes.ok) {
    return NextResponse.json({ error: `GitHub returned ${commitsRes.status}.` }, { status: 502 })
  }

  const commits = (await commitsRes.json()) as CommitResponse[]
  const issues = issuesRes.ok ? ((await issuesRes.json()) as IssueResponse[]) : []

  const events: GitHubEvent[] = [
    ...commits.map((item): GitHubEvent => ({
      type: 'commit',
      title: item.commit.message.split('\n')[0],
      author: item.author?.login ?? item.commit.author?.name ?? 'unknown',
      url: item.html_url,
      timestamp: item.commit.author?.date ?? item.commit.committer?.date ?? ''
    })),
    ...issues.map((item): GitHubEvent => ({
      type: item.pull_request ? 'pull_request' : 'issue',
      title: item.title,
      author: item.user?.login ?? 'unknown',
      url: item.html_url,
      timestamp: item.updated_at
    }))
  ]
    .filter((event) => event.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15)

  return NextResponse.json({ repo, events })
}
