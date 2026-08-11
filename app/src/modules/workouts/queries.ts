import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { getDb } from '../../core/db/client'
import { subscribeVersion, bumpVersion } from '../../shared/hooks/versionBus'
import { awardXp, XP_VALUES } from '../../core/db/xp'
import type { Exercise, WorkoutSession, WorkoutSet, BodyMetric } from './types'

export async function listExercises(): Promise<Exercise[]> {
  const db = await getDb()
  return db.all<Exercise>('SELECT * FROM exercises ORDER BY category, name')
}

export async function createExercise(input: { name: string; category?: string }): Promise<Exercise> {
  const db = await getDb()
  const now = Date.now()
  const id = nanoid()
  await db.run(
    'INSERT INTO exercises (id, name, category, is_custom, created_at) VALUES (?, ?, ?, 1, ?)',
    [id, input.name, input.category ?? null, now],
  )
  bumpVersion()
  return { id, name: input.name, category: input.category ?? null, is_custom: 1, created_at: now }
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDb()
  await db.run('DELETE FROM exercises WHERE id = ?', [id])
  bumpVersion()
}

export async function startWorkout(): Promise<WorkoutSession> {
  const db = await getDb()
  const now = Date.now()
  const id = nanoid()
  await db.run('INSERT INTO workout_sessions (id, started_at) VALUES (?, ?)', [id, now])
  bumpVersion()
  return { id, started_at: now, ended_at: null, note: null }
}

export async function endWorkout(sessionId: string, note?: string): Promise<void> {
  const db = await getDb()
  await db.run(
    'UPDATE workout_sessions SET ended_at = ?, note = ? WHERE id = ?',
    [Date.now(), note ?? null, sessionId],
  )
  await awardXp('workout', XP_VALUES.workout, sessionId)
  bumpVersion()
}

export async function logSet(input: {
  session_id: string
  exercise_id: string
  reps: number
  weight_kg: number
}): Promise<void> {
  const db = await getDb()
  const existing = await db.get<{ max_n: number }>(
    'SELECT MAX(set_number) as max_n FROM workout_sets WHERE session_id = ? AND exercise_id = ?',
    [input.session_id, input.exercise_id],
  )
  const setNumber = (existing?.max_n ?? 0) + 1
  await db.run(
    'INSERT INTO workout_sets (id, session_id, exercise_id, set_number, reps, weight_kg, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nanoid(), input.session_id, input.exercise_id, setNumber, input.reps, input.weight_kg, Date.now()],
  )
  bumpVersion()
}

export async function deleteSet(setId: string): Promise<void> {
  const db = await getDb()
  await db.run('DELETE FROM workout_sets WHERE id = ?', [setId])
  bumpVersion()
}

export async function listSessionSets(sessionId: string): Promise<WorkoutSet[]> {
  const db = await getDb()
  return db.all<WorkoutSet>(`
    SELECT ws.*, e.name AS exercise_name
    FROM workout_sets ws
    JOIN exercises e ON e.id = ws.exercise_id
    WHERE ws.session_id = ?
    ORDER BY ws.created_at
  `, [sessionId])
}

export async function listPastSessions(limit = 20): Promise<(WorkoutSession & { set_count: number })[]> {
  const db = await getDb()
  return db.all<WorkoutSession & { set_count: number }>(`
    SELECT ws.*, COUNT(w.id) as set_count
    FROM workout_sessions ws
    LEFT JOIN workout_sets w ON w.session_id = ws.id
    WHERE ws.ended_at IS NOT NULL
    GROUP BY ws.id
    ORDER BY ws.started_at DESC
    LIMIT ?
  `, [limit])
}

export async function saveBodyMetric(heightCm?: number, weightKg?: number): Promise<void> {
  const db = await getDb()
  await db.run(
    'INSERT INTO body_metrics (id, height_cm, weight_kg, recorded_at) VALUES (?, ?, ?, ?)',
    [nanoid(), heightCm ?? null, weightKg ?? null, Date.now()],
  )
  bumpVersion()
}

export async function latestBodyMetric(): Promise<BodyMetric | null> {
  const db = await getDb()
  return db.get<BodyMetric>('SELECT * FROM body_metrics ORDER BY recorded_at DESC LIMIT 1')
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const data = await listExercises()
      if (!cancelled) setExercises(data)
    }
    load()
    const unsub = subscribeVersion(load)
    return () => { cancelled = true; unsub() }
  }, [])
  return exercises
}

export function usePastSessions() {
  const [sessions, setSessions] = useState<(WorkoutSession & { set_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const data = await listPastSessions()
      if (!cancelled) { setSessions(data); setLoading(false) }
    }
    load()
    const unsub = subscribeVersion(load)
    return () => { cancelled = true; unsub() }
  }, [])
  return { sessions, loading }
}
