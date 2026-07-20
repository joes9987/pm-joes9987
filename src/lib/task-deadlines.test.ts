import { describe, expect, it } from 'vitest'
import {
  getDeadlineStatus,
  isDueThisWeek,
  isFocusToday,
  isOnTimeCompletion,
  isOverdue
} from '@/lib/task-deadlines'
import type { Task } from '@/lib/types'

const baseTask: Task = {
  id: 't1',
  project_id: 'p1',
  title: 'Test',
  description: '',
  status: 'todo',
  difficulty: 'low',
  assignee_id: null,
  created_by: 'u1',
  due_date: null,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z'
}

describe('getDeadlineStatus', () => {
  const now = new Date('2026-07-20T12:00:00.000Z')

  it('returns none when no due date or task is done', () => {
    expect(getDeadlineStatus(null, 'todo', now)).toBe('none')
    expect(getDeadlineStatus('2026-07-19T00:00:00.000Z', 'done', now)).toBe('none')
  })

  it('classifies overdue, due today, due soon, and on track', () => {
    expect(getDeadlineStatus('2026-07-19T23:00:00.000Z', 'todo', now)).toBe('overdue')
    expect(getDeadlineStatus('2026-07-20T18:00:00.000Z', 'in_progress', now)).toBe('due_today')
    expect(getDeadlineStatus('2026-07-22T18:00:00.000Z', 'todo', now)).toBe('due_soon')
    expect(getDeadlineStatus('2026-07-30T18:00:00.000Z', 'todo', now)).toBe('on_track')
  })
})

describe('isOverdue / isDueThisWeek / isFocusToday', () => {
  const now = new Date('2026-07-20T12:00:00.000Z')

  it('flags overdue open tasks', () => {
    expect(isOverdue('2026-07-19T00:00:00.000Z', 'todo', now)).toBe(true)
    expect(isOverdue('2026-07-25T00:00:00.000Z', 'todo', now)).toBe(false)
  })

  it('includes tasks due within seven days', () => {
    expect(isDueThisWeek('2026-07-25T00:00:00.000Z', 'todo', now)).toBe(true)
    expect(isDueThisWeek('2026-08-01T00:00:00.000Z', 'todo', now)).toBe(false)
  })

  it('focuses on overdue and due today', () => {
    expect(isFocusToday('2026-07-19T00:00:00.000Z', 'todo', now)).toBe(true)
    expect(isFocusToday('2026-07-20T20:00:00.000Z', 'todo', now)).toBe(true)
    expect(isFocusToday('2026-07-22T00:00:00.000Z', 'todo', now)).toBe(false)
  })
})

describe('isOnTimeCompletion', () => {
  it('uses completed_at instead of updated_at', () => {
    const onTime: Task = {
      ...baseTask,
      status: 'done',
      due_date: '2026-07-20T18:00:00.000Z',
      completed_at: '2026-07-20T10:00:00.000Z',
      updated_at: '2026-07-21T10:00:00.000Z'
    }
    expect(isOnTimeCompletion(onTime)).toBe(true)
  })

  it('marks late when completed_at is after due date', () => {
    const late: Task = {
      ...baseTask,
      status: 'done',
      due_date: '2026-07-20T10:00:00.000Z',
      completed_at: '2026-07-20T12:00:00.000Z',
      updated_at: '2026-07-20T12:00:00.000Z'
    }
    expect(isOnTimeCompletion(late)).toBe(false)
  })

  it('counts no due date as on time', () => {
    expect(isOnTimeCompletion({ ...baseTask, status: 'done' })).toBe(true)
  })
})
