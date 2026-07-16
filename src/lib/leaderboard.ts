import type { PointEvent, Profile } from '@/lib/types'

export type LeaderboardRow = {
  userId: string
  displayName: string
  totalPoints: number
  weekPoints: number
  rank: number
}

/** UTC Monday 00:00 for the week containing `now`. */
export function startOfUtcWeek (now: Date = new Date()): Date {
  const day = now.getUTCDay() // 0 = Sunday
  const daysFromMonday = (day + 6) % 7
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysFromMonday
  ))
}

/** Previous UTC week [Monday, next Monday). */
export function previousUtcWeek (now: Date = new Date()): { weekStart: Date, weekEnd: Date } {
  const thisMonday = startOfUtcWeek(now)
  const weekEnd = thisMonday
  const weekStart = new Date(thisMonday)
  weekStart.setUTCDate(weekStart.getUTCDate() - 7)
  return { weekStart, weekEnd }
}

export function formatUtcDate (date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function aggregateLeaderboard (
  events: PointEvent[],
  profiles: Profile[],
  now: Date = new Date(),
  limit = 10
): LeaderboardRow[] {
  const weekStart = startOfUtcWeek(now)
  const weekStartMs = weekStart.getTime()

  const totals = new Map<string, { totalPoints: number, weekPoints: number }>()

  for (const event of events) {
    const current = totals.get(event.user_id) ?? { totalPoints: 0, weekPoints: 0 }
    current.totalPoints += event.points
    if (new Date(event.awarded_at).getTime() >= weekStartMs) {
      current.weekPoints += event.points
    }
    totals.set(event.user_id, current)
  }

  const nameById = new Map(profiles.map((profile) => [profile.id, profile.display_name]))

  return [...totals.entries()]
    .map(([userId, scores]) => ({
      userId,
      displayName: nameById.get(userId) ?? 'Unknown',
      totalPoints: scores.totalPoints,
      weekPoints: scores.weekPoints,
      rank: 0
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      if (b.weekPoints !== a.weekPoints) return b.weekPoints - a.weekPoints
      return a.displayName.localeCompare(b.displayName)
    })
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}
