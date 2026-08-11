/** Recurrence engine — pure functions, no React, no DB.
 *  Dates are local 'YYYY-MM-DD' strings to avoid timezone drift. */

export type Rule =
  | { kind: 'daily' }
  | { kind: 'weekdays' }
  | { kind: 'custom'; days: string[] } // ISO weekday codes: MO TU WE TH FR SA SU

/** Parse the stored recurrence_rule string into a structured Rule. */
export function parseRule(raw: string | null | undefined): Rule | null {
  if (!raw) return null
  if (raw === 'daily') return { kind: 'daily' }
  if (raw === 'weekdays') return { kind: 'weekdays' }
  if (raw.startsWith('custom:')) {
    const days = raw.slice('custom:'.length).split(',').filter(Boolean)
    return days.length ? { kind: 'custom', days } : null
  }
  return null
}

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d!))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

function dayCode(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d!))
  return DAY_CODES[dt.getUTCDay()]!
}

const WEEKDAY_SET = new Set(['MO', 'TU', 'WE', 'TH', 'FR'])

/** Next recurrence date strictly after `from`, or null if rule is null. */
export function nextOccurrence(rule: Rule | null, from: string): string | null {
  if (!rule) return null

  if (rule.kind === 'daily') return addDays(from, 1)

  if (rule.kind === 'weekdays') {
    let next = addDays(from, 1)
    while (!WEEKDAY_SET.has(dayCode(next))) next = addDays(next, 1)
    return next
  }

  // custom: find the next date whose day-code is in the allowed set
  const allowed = new Set(rule.days)
  for (let i = 1; i <= 8; i++) {
    const candidate = addDays(from, i)
    if (allowed.has(dayCode(candidate))) return candidate
  }
  return null
}
