import { nanoid } from 'nanoid'
import { getDb } from '../../core/db/client'
import { bumpVersion } from '../../shared/hooks/versionBus'
import { useLiveQuery } from '../../shared/hooks/useLiveQuery'
import { awardXp, revokeXp, XP_VALUES } from '../../core/db/xp'
import { todayStr } from '../tasks/types'
import type { Habit, HabitWithToday } from './types'

export async function listHabits(): Promise<Habit[]> {
  const db = await getDb()
  return db.all<Habit>(
    'SELECT * FROM habits WHERE archived_at IS NULL ORDER BY created_at',
  )
}

export async function createHabit(input: {
  name: string
  type: 'good' | 'bad'
  color?: string
}): Promise<Habit> {
  const db = await getDb()
  const now = Date.now()
  const id = nanoid()
  await db.run(
    'INSERT INTO habits (id, name, type, color, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.name, input.type, input.color ?? 'blue', now],
  )
  bumpVersion()
  return { id, ...input, color: input.color ?? 'blue', created_at: now, archived_at: null }
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb()
  await db.run('UPDATE habits SET archived_at = ? WHERE id = ?', [Date.now(), id])
  bumpVersion()
}

async function logHabit(habitId: string, date: string, status: 'done' | 'slip' | null): Promise<void> {
  const db = await getDb()
  if (status === null) {
    await db.run('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', [habitId, date])
    await revokeXp('habit', habitId)
  } else {
    await db.run(
      `INSERT INTO habit_logs (id, habit_id, date, status, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (habit_id, date) DO UPDATE SET status = excluded.status, created_at = excluded.created_at`,
      [nanoid(), habitId, date, status, Date.now()],
    )
    if (status === 'done') await awardXp('habit', XP_VALUES.habit, habitId)
  }
  bumpVersion()
}

export async function checkHabit(habitId: string, date?: string): Promise<void> {
  await logHabit(habitId, date ?? todayStr(), 'done')
}
export async function slipHabit(habitId: string, date?: string): Promise<void> {
  await logHabit(habitId, date ?? todayStr(), 'slip')
}
export async function unlogHabit(habitId: string, date?: string): Promise<void> {
  await logHabit(habitId, date ?? todayStr(), null)
}

const DAY_MS = 86_400_000
const prevDay = (s: string): string => {
  const d = new Date(s + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Current + longest daily streak from a set of 'YYYY-MM-DD' done-dates, relative to today. */
function streaksFromDoneDates(doneDates: Set<string>): { current: number; longest: number } {
  let cursor = todayStr()
  if (!doneDates.has(cursor)) cursor = prevDay(cursor)
  let current = 0
  while (doneDates.has(cursor)) {
    current++
    cursor = prevDay(cursor)
  }

  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const d of Array.from(doneDates).sort()) {
    run = prev && new Date(d + 'T00:00:00').getTime() - new Date(prev + 'T00:00:00').getTime() === DAY_MS ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }
  return { current, longest }
}

export async function getHabitStreaks(habitId: string): Promise<{ current: number; longest: number }> {
  const db = await getDb()
  const rows = await db.all<{ date: string; status: string }>(
    'SELECT date, status FROM habit_logs WHERE habit_id = ? ORDER BY date',
    [habitId],
  )
  return streaksFromDoneDates(new Set(rows.filter((r) => r.status === 'done').map((r) => r.date)))
}

export async function listHabitsWithStats(): Promise<HabitWithToday[]> {
  const habits = await listHabits()
  const today = todayStr()
  const db = await getDb()

  const todayLogs = await db.all<{ habit_id: string; status: string }>(
    'SELECT habit_id, status FROM habit_logs WHERE date = ?', [today],
  )
  const todayMap = new Map(todayLogs.map((r) => [r.habit_id, r.status as 'done' | 'slip']))

  const allLogs = await db.all<{ habit_id: string; date: string; status: string }>(
    'SELECT habit_id, date, status FROM habit_logs ORDER BY date',
  )

  return Promise.all(habits.map(async (habit) => {
    const doneDates = new Set(
      allLogs.filter((r) => r.habit_id === habit.id && r.status === 'done').map((r) => r.date),
    )
    const { current, longest } = streaksFromDoneDates(doneDates)
    return { ...habit, today_status: todayMap.get(habit.id) ?? null, current_streak: current, longest_streak: longest }
  }))
}

export function useHabits() {
  const { data: habits, loading } = useLiveQuery(listHabitsWithStats, [] as HabitWithToday[])
  return { habits, loading }
}
