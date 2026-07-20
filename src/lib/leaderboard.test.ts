import { describe, expect, it } from 'vitest'
import { aggregateLeaderboard, previousUtcWeek, startOfUtcWeek } from '@/lib/leaderboard'
import type { PointEvent, Profile } from '@/lib/types'

const profiles: Profile[] = [
  { id: 'u1', email: 'a@example.com', display_name: 'Alice' },
  { id: 'u2', email: 'b@example.com', display_name: 'Bob' }
]

describe('startOfUtcWeek', () => {
  it('returns Monday 00:00 UTC for a Wednesday', () => {
    const wed = new Date('2026-07-15T12:00:00.000Z')
    const monday = startOfUtcWeek(wed)
    expect(monday.toISOString()).toBe('2026-07-13T00:00:00.000Z')
  })

  it('returns same day for Monday input', () => {
    const mon = new Date('2026-07-13T18:00:00.000Z')
    expect(startOfUtcWeek(mon).toISOString()).toBe('2026-07-13T00:00:00.000Z')
  })
})

describe('previousUtcWeek', () => {
  it('spans the prior Monday through this Monday', () => {
    const now = new Date('2026-07-22T15:00:00.000Z')
    const { weekStart, weekEnd } = previousUtcWeek(now)
    expect(weekStart.toISOString()).toBe('2026-07-13T00:00:00.000Z')
    expect(weekEnd.toISOString()).toBe('2026-07-20T00:00:00.000Z')
  })
})

describe('aggregateLeaderboard', () => {
  const events: PointEvent[] = [
    {
      id: '1',
      user_id: 'u1',
      task_id: 't1',
      points: 10,
      difficulty: 'low',
      awarded_at: '2026-07-14T10:00:00.000Z'
    },
    {
      id: '2',
      user_id: 'u2',
      task_id: 't2',
      points: 50,
      difficulty: 'high',
      awarded_at: '2026-07-21T10:00:00.000Z'
    },
    {
      id: '3',
      user_id: 'u1',
      task_id: 't3',
      points: 25,
      difficulty: 'mid',
      awarded_at: '2026-07-20T12:00:00.000Z'
    }
  ]

  it('ranks by total points and computes weekly subtotals', () => {
    const now = new Date('2026-07-22T12:00:00.000Z')
    const rows = aggregateLeaderboard(events, profiles, now)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      userId: 'u2',
      displayName: 'Bob',
      totalPoints: 50,
      weekPoints: 50,
      rank: 1
    })
    expect(rows[1]).toMatchObject({
      userId: 'u1',
      displayName: 'Alice',
      totalPoints: 35,
      weekPoints: 25,
      rank: 2
    })
  })

  it('respects limit', () => {
    const now = new Date('2026-07-22T12:00:00.000Z')
    expect(aggregateLeaderboard(events, profiles, now, 1)).toHaveLength(1)
  })
})
