import type { Db } from '../types'

export interface MonthlyHoursRow {
  activity_id: string
  activity_name: string
  total_minutes: number
}

/**
 * Total focus minutes per activity for a calendar month.
 * `focus_sessions` arrives in M3 — returns zeros until then (query works today).
 */
export async function monthlyHoursByActivity(
  db: Db,
  monthStart: string, // 'YYYY-MM-DD'
  nextMonthStart: string, // 'YYYY-MM-DD' (exclusive)
): Promise<MonthlyHoursRow[]> {
  const tableExists = await db.get<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='focus_sessions'`,
  )
  if (!tableExists) {
    const acts = await db.all<{ id: string; name: string }>(
      `SELECT id, name FROM activities WHERE archived_at IS NULL`,
    )
    return acts.map((a) => ({ activity_id: a.id, activity_name: a.name, total_minutes: 0 }))
  }
  return db.all<MonthlyHoursRow>(
    `
    SELECT a.id AS activity_id, a.name AS activity_name,
           COALESCE(SUM(fs.actual_minutes), 0) AS total_minutes
    FROM activities a
    LEFT JOIN focus_sessions fs
      ON fs.activity_id = a.id
      AND fs.started_at >= ? AND fs.started_at < ?
    WHERE a.archived_at IS NULL
    GROUP BY a.id
    ORDER BY total_minutes DESC
    `,
    [new Date(monthStart).getTime(), new Date(nextMonthStart).getTime()],
  )
}
