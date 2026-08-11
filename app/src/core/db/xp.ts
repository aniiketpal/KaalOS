import { nanoid } from 'nanoid'
import { getDb } from './client'
import { bumpVersion } from '../../shared/hooks/versionBus'

export const XP_VALUES = {
  task:        20,
  habit:       10,
  journal:     15,
  workout:     40,
  streak_bonus: 50,
  focus: 0, // dynamic — minutes-based
} as const

export type XpSource = keyof typeof XP_VALUES | 'streak'

export interface XpEvent {
  id: string
  source_type: string
  source_id: string | null
  points: number
  created_at: number
}

export async function awardXp(sourceType: string, points: number, sourceId?: string): Promise<void> {
  const db = await getDb()
  await db.run(
    'INSERT INTO xp_events (id, source_type, source_id, points, created_at) VALUES (?, ?, ?, ?, ?)',
    [nanoid(), sourceType, sourceId ?? null, points, Date.now()],
  )
  bumpVersion()
}

/** Remove XP previously awarded for a specific source record (e.g. undo task completion). */
export async function revokeXp(sourceType: string, sourceId: string): Promise<void> {
  const db = await getDb()
  await db.run(
    'DELETE FROM xp_events WHERE source_type = ? AND source_id = ?',
    [sourceType, sourceId],
  )
  bumpVersion()
}

export async function totalXp(): Promise<number> {
  const db = await getDb()
  const row = await db.get<{ total: number }>('SELECT COALESCE(SUM(points), 0) as total FROM xp_events')
  return row?.total ?? 0
}

/** Level N requires N² × 100 XP cumulative. */
export function xpForLevel(level: number): number {
  return level * level * 100
}

export function currentLevel(totalXp: number): { level: number; progress: number; nextLevelXp: number } {
  let level = 1
  while (xpForLevel(level + 1) <= totalXp) level++
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const progress = (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)
  return { level, progress: Math.min(1, progress), nextLevelXp }
}

export async function xpHistory(limit = 20): Promise<XpEvent[]> {
  const db = await getDb()
  return db.all<XpEvent>('SELECT * FROM xp_events ORDER BY created_at DESC LIMIT ?', [limit])
}

/** Calculate XP for a focus session based on minutes (25 XP per 25 min). */
export function focusXpForMinutes(minutes: number): number {
  return Math.round((minutes / 25) * 25)
}

/** Award a streak bonus if the current streak hits a multiple of 7. */
export async function checkStreakBonus(activityId: string, currentStreak: number): Promise<void> {
  if (currentStreak > 0 && currentStreak % 7 === 0) {
    await awardXp('streak_bonus', XP_VALUES.streak_bonus, activityId)
  }
}
