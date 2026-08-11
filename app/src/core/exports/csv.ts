import { getDb } from '../db/client'
import { format } from 'date-fns'

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsv).join(',')
  const dataLines = rows.map((row) => row.map(escapeCsv).join(','))
  return [headerLine, ...dataLines].join('\n')
}

export async function exportTasksToCsv(): Promise<string> {
  const db = await getDb()
  const tasks = await db.all<{
    id: string
    title: string
    activity_id: string | null
    status: string
    recurrence: string | null
    sort_order: number
    created_at: number
    updated_at: number
    completed_at: number | null
  }>(`SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC`)

  const headers = ['ID', 'Title', 'Activity ID', 'Status', 'Recurrence', 'Sort Order', 'Created At', 'Updated At', 'Completed At']
  const rows = tasks.map((t) => [
    t.id,
    t.title,
    t.activity_id,
    t.status,
    t.recurrence,
    t.sort_order,
    format(t.created_at, 'yyyy-MM-dd HH:mm'),
    format(t.updated_at, 'yyyy-MM-dd HH:mm'),
    t.completed_at ? format(t.completed_at, 'yyyy-MM-dd HH:mm') : '',
  ])

  return buildCsv(headers, rows)
}

export async function exportHabitsToCsv(): Promise<string> {
  const db = await getDb()
  const habits = await db.all<{
    id: string
    name: string
    type: string
    created_at: number
  }>(`SELECT * FROM habits WHERE archived_at IS NULL ORDER BY created_at ASC`)

  const logs = await db.all<{
    habit_id: string
    date: string
    done: number
  }>(`SELECT * FROM habit_logs ORDER BY date DESC`)

  const headers = ['Habit ID', 'Habit Name', 'Type', 'Date', 'Status']
  const rows: (string | number | null)[][] = []

  for (const habit of habits) {
    const habitLogs = logs.filter((l) => l.habit_id === habit.id)
    for (const log of habitLogs) {
      rows.push([habit.id, habit.name, habit.type, log.date, log.done === 1 ? 'Done' : 'Slip'])
    }
    if (habitLogs.length === 0) {
      rows.push([habit.id, habit.name, habit.type, '', 'No check-ins'])
    }
  }

  return buildCsv(headers, rows)
}

export async function exportWorkoutsToCsv(): Promise<string> {
  const db = await getDb()
  const sets = await db.all<{
    session_id: string
    session_date: string
    exercise_name: string
    set_index: number
    reps: number
    weight: number
    rpe: number | null
  }>(`
    SELECT ws.session_id, w.date as session_date, e.name as exercise_name,
           ws.set_index, ws.reps, ws.weight, ws.rpe
    FROM workout_sets ws
    JOIN workout_sessions w ON ws.session_id = w.id
    JOIN exercises e ON ws.exercise_id = e.id
    ORDER BY w.date DESC, ws.session_id, ws.set_index
  `)

  const headers = ['Session ID', 'Date', 'Exercise', 'Set', 'Reps', 'Weight (kg)', 'RPE']
  const rows = sets.map((s) => [
    s.session_id,
    s.session_date,
    s.exercise_name,
    s.set_index + 1,
    s.reps,
    s.weight,
    s.rpe ?? '',
  ])

  return buildCsv(headers, rows)
}

export async function exportXpToCsv(): Promise<string> {
  const db = await getDb()
  const events = await db.all<{
    id: string
    source_type: string
    points: number
    created_at: number
  }>(`SELECT * FROM xp_events ORDER BY created_at DESC`)

  const headers = ['ID', 'Source', 'Points', 'Date']
  const rows = events.map((e) => [
    e.id,
    e.source_type,
    e.points,
    format(e.created_at, 'yyyy-MM-dd HH:mm'),
  ])

  return buildCsv(headers, rows)
}

export async function exportAllCsv(): Promise<Record<string, string>> {
  const [tasks, habits, workouts, xp] = await Promise.all([
    exportTasksToCsv(),
    exportHabitsToCsv(),
    exportWorkoutsToCsv(),
    exportXpToCsv(),
  ])

  return {
    'tasks.csv': tasks,
    'habits.csv': habits,
    'workouts.csv': workouts,
    'xp.csv': xp,
  }
}