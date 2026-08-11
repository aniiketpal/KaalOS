import { describe, it, expect } from 'vitest'
import { findCarryOver, type TaskLite } from './carryOver'

const t = (over: Partial<TaskLite>): TaskLite => ({
  id: 'x',
  status: 'pending',
  due_date: '2026-08-05',
  carry_over: 1,
  ...over,
})

describe('findCarryOver', () => {
  const today = '2026-08-06'

  it('task due today → not in result', () => {
    expect(findCarryOver([t({ due_date: today })], today)).toHaveLength(0)
  })
  it('task due yesterday + carry_over → in result', () => {
    expect(findCarryOver([t({ due_date: '2026-08-05', carry_over: 1 })], today)).toHaveLength(1)
  })
  it('task due yesterday + no carry_over → not in result (stays overdue)', () => {
    expect(findCarryOver([t({ due_date: '2026-08-05', carry_over: 0 })], today)).toHaveLength(0)
  })
  it('done/skipped tasks are excluded', () => {
    const done = t({ status: 'done' })
    const skipped = t({ status: 'skipped' })
    expect(findCarryOver([done, skipped], today)).toHaveLength(0)
  })
  it('mixed list returns only qualifying tasks', () => {
    const a = t({ id: 'a', due_date: '2026-08-05', carry_over: 1 })
    const b = t({ id: 'b', due_date: '2026-08-05', carry_over: 0 })
    const c = t({ id: 'c', due_date: '2026-08-06', carry_over: 1 })
    const d = t({ id: 'd', due_date: '2026-08-04', carry_over: 1 })
    const result = findCarryOver([a, b, c, d], today)
    expect(result.map((x) => x.id).sort()).toEqual(['a', 'd'])
  })
  it('recurring task → carry-over still applies', () => {
    expect(findCarryOver([t({ due_date: '2026-08-05', carry_over: 1 })], today)).toHaveLength(1)
  })
})
