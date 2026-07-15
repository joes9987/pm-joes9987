'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/notifications'
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
    setNotifications(initialNotifications)
  }, [initialNotifications])

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
        className="relative rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-700">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No notifications yet.
              </li>
            )}
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-700 ${
                  notification.read_at ? 'opacity-70' : 'bg-zinc-50 dark:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">{notification.message}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                    {notification.task_id && (
                      <Link
                        href={`/dashboard?taskId=${notification.task_id}`}
                        onClick={() => {
                          if (!notification.read_at) markRead(notification.id)
                          setOpen(false)
                        }}
                        className="mt-2 inline-block text-xs font-medium text-zinc-700 underline dark:text-zinc-300"
                      >
                        View task
                      </Link>
                    )}
                  </div>
                  {!notification.read_at && (
                    <button
                      type="button"
                      onClick={() => markRead(notification.id)}
                      className="shrink-0 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
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
