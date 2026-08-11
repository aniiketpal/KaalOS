/** Streak maths — pure functions operating on daily totals. */

export type DailyLog = Map<string, number> // 'YYYY-MM-DD' → minutes (or units)

function subDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d!))
  dt.setUTCDate(dt.getUTCDate() - n)
  return dt.toISOString().slice(0, 10)
}

/** Days in a row ending today (or yesterday) that met the target. */
export function currentStreak(logs: DailyLog, today: string, target: number): number {
  let cursor = today
  // If today is missing entirely, don't break the streak — start from yesterday.
  if (!logs.has(cursor)) cursor = subDays(cursor, 1)

  let count = 0
  while ((logs.get(cursor) ?? 0) >= target) {
    count++
    cursor = subDays(cursor, 1)
  }
  return count
}

/** Longest run of consecutive days meeting target anywhere in the past. */
export function longestStreak(logs: DailyLog, _today: string, target: number): number {
  const dates = Array.from(logs.keys()).sort().reverse()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of dates) {
    const met = (logs.get(d) ?? 0) >= target
    if (met) {
      if (prev !== null && subDays(prev, 1) === d) {
        run++
      } else {
        run = 1
      }
      best = Math.max(best, run)
      prev = d
    } else {
      run = 0
      prev = null
    }
  }
  return best
}
