import type { Db } from '../types'

export interface DayMinutes { date: string; minutes: number }
export interface WeekRow { activity_id: string; activity_name: string; color: string; minutes: number; target_minutes: number }
export interface MonthRow { activity_name: string; total_minutes: number; target_minutes: number; pct: number }

const dayStartMs = (dateStr: string): number => new Date(dateStr + 'T00:00:00').getTime()

export async function dailyMinutesByActivity(
  db: Db, activityId: string, fromDate: string, toDate: string,
): Promise<DayMinutes[]> {
  const rows = await db.all<{ d: string; m: number }>(
    `SELECT date(started_at/1000,'unixepoch','localtime') AS d, SUM(actual_minutes) AS m
     FROM focus_sessions
     WHERE activity_id=? AND started_at>=? AND started_at<?
     GROUP BY d ORDER BY d`,
    [activityId, dayStartMs(fromDate), dayStartMs(toDate)],
  )
  return rows.map((r) => ({ date: r.d, minutes: r.m ?? 0 }))
}

export async function weeklyPerActivity(
  db: Db, weekStart: string, weekEnd: string,
): Promise<WeekRow[]> {
  const rows = await db.all<{ activity_id: string; activity_name: string; color: string; total: number; daily: number }>(
    `SELECT a.id AS activity_id, a.name AS activity_name, a.color, COALESCE(SUM(fs.actual_minutes),0) AS total, a.daily_target AS daily
     FROM activities a
     LEFT JOIN focus_sessions fs
       ON fs.activity_id = a.id AND fs.started_at >= ? AND fs.started_at < ?
     WHERE a.archived_at IS NULL
     GROUP BY a.id ORDER BY total DESC`,
    [dayStartMs(weekStart), dayStartMs(weekEnd)],
  )
  return rows.map((r) => ({ activity_id: r.activity_id, activity_name: r.activity_name, color: r.color, minutes: r.total, target_minutes: r.daily * 7 }))
}

export async function monthlyByActivity(
  db: Db, monthStart: string, nextMonthStart: string,
): Promise<MonthRow[]> {
  const rows = await db.all<{ activity_name: string; total: number; daily: number }>(
    `SELECT a.name AS activity_name, COALESCE(SUM(fs.actual_minutes),0) AS total, a.daily_target AS daily
     FROM activities a
     LEFT JOIN focus_sessions fs ON fs.activity_id = a.id AND fs.started_at >= ? AND fs.started_at < ?
     WHERE a.archived_at IS NULL
     GROUP BY a.id ORDER BY total DESC`,
    [dayStartMs(monthStart), dayStartMs(nextMonthStart)],
  )
  const daysInMonth = Math.round((dayStartMs(nextMonthStart) - dayStartMs(monthStart)) / 86_400_000)
  return rows.map((r) => {
    const target = r.daily * daysInMonth
    const total = r.total ?? 0
    return { activity_name: r.activity_name, total_minutes: total, target_minutes: target, pct: target > 0 ? (100 * total) / target : 0 }
  })
}

export function toMonthCSV(rows: MonthRow[], monthLabel: string): string {
  const head = ['activity', 'minutes', 'target_minutes', 'pct_met']
  const body = rows.map((r) => `${r.activity_name.replace(/,/g, ';')},${r.total_minutes},${r.target_minutes},${r.pct.toFixed(1)}`)
  return [`# KaalOS — monthly report (${monthLabel})`, head.join(','), ...body].join('\n')
}
