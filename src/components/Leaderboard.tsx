'use client'

import { useCallback, useEffect, useState } from 'react'
import { aggregateLeaderboard, type LeaderboardRow } from '@/lib/leaderboard'
import { createClient } from '@/lib/supabase/client'
import type { PointEvent, Profile } from '@/lib/types'
import { ui } from '@/lib/ui'

type LeaderboardProps = {
  initialRows: LeaderboardRow[]
  profiles: Profile[]
  currentUserId: string
}

export function Leaderboard ({ initialRows, profiles, currentUserId }: LeaderboardProps) {
  const [rows, setRows] = useState(initialRows)
  const [live, setLive] = useState(false)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('point_events')
      .select('*')

    if (error || !data) return

    setRows(aggregateLeaderboard(data as PointEvent[], profiles))
  }, [profiles])

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`leaderboard-points-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_events' },
        () => {
          void refresh()
        }
      )
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED')
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refresh])

  return (
    <section className={ui.card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className={ui.sectionTitle}>Leaderboard</h2>
          <p className={`mt-1 ${ui.pageSubtitle}`}>
            Points for completed tasks — Low 10 · Mid 25 · High 50
          </p>
        </div>
        <span className="text-xs font-medium text-[var(--muted)]">
          {live ? 'Live' : 'Connecting…'}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No points yet. Complete assigned tasks to climb the board.
        </p>
      ) : (
        <ol className={`mt-4 ${ui.divider}`}>
          {rows.map((row) => {
            const isYou = row.userId === currentUserId
            return (
              <li
                key={row.userId}
                className={`flex items-center justify-between gap-4 py-3 ${
                  isYou ? 'rounded-xl bg-[var(--nav-active)]/40 px-3' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 shrink-0 text-sm font-semibold text-[var(--muted)]">
                    #{row.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--foreground)]">
                      {row.displayName}
                      {isYou && (
                        <span className="ml-2 text-xs font-semibold text-[var(--primary)]">You</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      This week: {row.weekPoints} pts
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-lg font-bold text-[var(--foreground)]">
                  {row.totalPoints}
                  <span className="ml-1 text-xs font-medium text-[var(--muted)]">pts</span>
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
