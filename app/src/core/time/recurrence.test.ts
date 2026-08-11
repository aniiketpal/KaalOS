import { describe, it, expect } from 'vitest'
import { nextOccurrence, parseRule } from './recurrence'

// Local-date helpers (YYYY-MM-DD, no TZ math)
const d = (s: string) => s

describe('parseRule', () => {
  it('parses daily / weekdays / custom strings', () => {
    expect(parseRule('daily')).toEqual({ kind: 'daily' })
    expect(parseRule('weekdays')).toEqual({ kind: 'weekdays' })
    expect(parseRule('custom:MO,WE,FR')).toEqual({ kind: 'custom', days: ['MO', 'WE', 'FR'] })
  })
  it('returns null for null or empty', () => {
    expect(parseRule(null)).toBeNull()
    expect(parseRule('')).toBeNull()
    expect(parseRule(undefined)).toBeNull()
  })
})

describe('nextOccurrence', () => {
  it('daily from Wed → Thu', () => {
    expect(nextOccurrence({ kind: 'daily' }, d('2026-08-05'))).toBe(d('2026-08-06'))
  })
  it('weekdays from Fri → Mon', () => {
    expect(nextOccurrence({ kind: 'weekdays' }, d('2026-08-07'))).toBe(d('2026-08-10'))
  })
  it('weekdays from Sun → Mon', () => {
    expect(nextOccurrence({ kind: 'weekdays' }, d('2026-08-09'))).toBe(d('2026-08-10'))
  })
  it('custom [MO,WE,FR] from Tue → Wed', () => {
    expect(nextOccurrence({ kind: 'custom', days: ['MO', 'WE', 'FR'] }, d('2026-08-04'))).toBe(d('2026-08-05'))
  })
  it('custom [MO,WE,FR] from Fri → Mon (next week)', () => {
    expect(nextOccurrence({ kind: 'custom', days: ['MO', 'WE', 'FR'] }, d('2026-08-07'))).toBe(d('2026-08-10'))
  })
  it('rule = null → null', () => {
    expect(nextOccurrence(null, d('2026-08-05'))).toBeNull()
  })
})
