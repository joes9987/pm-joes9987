'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/notifications'
import { ui } from '@/lib/ui'
import type { Profile, TaskComment } from '@/lib/types'

type TaskCommentsProps = {
  taskId: string
  currentUserId: string
  members: Profile[]
}

export function TaskComments ({ taskId, currentUserId, members }: TaskCommentsProps) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error: loadError } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (loadError) {
      setError(loadError.message)
      return
    }
    setComments((data ?? []) as TaskComment[])
  }, [taskId])

  useEffect(() => {
    if (!open) return
    void load()

    const supabase = createClient()
    const channel = supabase
      .channel(`comments-${taskId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` },
        () => { void load() }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [open, taskId, load])

  async function submit (event: React.FormEvent) {
    event.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('task_comments').insert({
      task_id: taskId,
      author_id: currentUserId,
      body: body.trim()
    })

    setLoading(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setBody('')
    await load()
  }

  const authorName = (id: string) =>
    members.find((member) => member.id === id)?.display_name ?? 'Someone'

  return (
    <div className="mt-2 w-full">
      <button
        type="button"
        className={ui.btnGhost}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? 'Hide comments' : 'Comments'}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3">
          <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {comments.length === 0 && (
              <li className="text-[var(--muted)]">No comments yet.</li>
            )}
            {comments.map((comment) => (
              <li key={comment.id}>
                <p className="font-medium text-[var(--foreground)]">{authorName(comment.author_id)}</p>
                <p className="text-[var(--muted-foreground)]">{comment.body}</p>
                <p className="font-mono text-xs text-[var(--muted)]">{formatRelativeTime(comment.created_at)}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={submit} className="mt-3 space-y-2">
            <label className={ui.label}>
              Add comment
              <textarea
                className={ui.field}
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={loading}
              />
            </label>
            <button type="submit" disabled={loading || !body.trim()} className={ui.btnPrimary}>
              {loading ? 'Posting…' : 'Post'}
            </button>
          </form>
          {error && <p className={`mt-2 ${ui.alertError}`} role="alert">{error}</p>}
        </div>
      )}
    </div>
  )
}
