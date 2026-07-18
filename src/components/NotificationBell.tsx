'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { EmptyNotifications } from '@/components/brand/illustrations'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/notifications'
import { ui } from '@/lib/ui'
import type { Notification } from '@/lib/types'

type NotificationBellProps = {
  userId: string
  initialNotifications: Notification[]
}

export function NotificationBell ({ userId, initialNotifications }: NotificationBellProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((item) => !item.read_at).length

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-${userId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as Notification
            setNotifications((prev) => (prev.some((item) => item.id === row.id) ? prev : [row, ...prev]))
            return
          }
          if (payload.eventType === 'UPDATE') {
            const row = payload.new as Notification
            setNotifications((prev) => {
              const exists = prev.some((item) => item.id === row.id)
              if (!exists) return [row, ...prev]
              return prev.map((item) => (item.id === row.id ? row : item))
            })
            return
          }
          if (payload.eventType === 'DELETE') {
            const row = payload.old as Notification
            setNotifications((prev) => prev.filter((item) => item.id !== row.id))
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    function handleClickOutside (event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function markRead (notificationId: string) {
    const readAt = new Date().toISOString()
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) return

    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read_at: readAt } : item))
    )
  }

  async function markAllRead () {
    const readAt = new Date().toISOString()
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) return

    setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at ?? readAt })))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative ${ui.btnGhost}`}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-xs font-bold text-[var(--primary-fg)] shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="surface-elevated absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-[var(--primary)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-[var(--muted)]">
                <EmptyNotifications />
                <span>No notifications yet.</span>
              </li>
            )}
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`border-b border-[var(--border)] px-4 py-3 last:border-b-0 ${
                  notification.read_at ? 'opacity-60' : 'bg-[var(--nav-active)]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--foreground)]">{notification.message}</p>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                    {notification.task_id && (
                      <Link
                        href={`/dashboard?taskId=${notification.task_id}`}
                        onClick={() => {
                          if (!notification.read_at) void markRead(notification.id)
                          setOpen(false)
                        }}
                        className={`mt-2 inline-block text-xs ${ui.linkAccent}`}
                      >
                        View task
                      </Link>
                    )}
                  </div>
                  {!notification.read_at && (
                    <button
                      type="button"
                      onClick={() => void markRead(notification.id)}
                      className="shrink-0 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
