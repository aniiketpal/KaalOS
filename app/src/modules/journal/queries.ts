import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { getDb } from '../../core/db/client'
import { subscribeVersion, bumpVersion } from '../../shared/hooks/versionBus'
import { awardXp, XP_VALUES } from '../../core/db/xp'
import type { JournalEntry } from './types'

export async function listJournalEntries(limit = 50): Promise<JournalEntry[]> {
  const db = await getDb()
  return db.all<JournalEntry>(
    'SELECT * FROM journal_entries ORDER BY date DESC, created_at DESC LIMIT ?',
    [limit],
  )
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const db = await getDb()
  return db.get<JournalEntry>('SELECT * FROM journal_entries WHERE id = ?', [id])
}

export async function createJournalEntry(input: {
  date: string
  prompt?: string
  content: string
  mood?: number
  energy?: number
}): Promise<JournalEntry> {
  const db = await getDb()
  const now = Date.now()
  const id = nanoid()
  await db.run(
    'INSERT INTO journal_entries (id, date, prompt, content, mood, energy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, input.date, input.prompt ?? null, input.content, input.mood ?? null, input.energy ?? null, now, now],
  )
  await awardXp('journal', XP_VALUES.journal, id)
  bumpVersion()
  return { id, prompt: input.prompt ?? null, mood: input.mood ?? null, energy: input.energy ?? null, ...input, created_at: now, updated_at: now }
}

export async function updateJournalEntry(id: string, input: {
  content?: string
  mood?: number
  energy?: number
}): Promise<void> {
  const db = await getDb()
  const sets: string[] = []
  const params: unknown[] = []
  if (input.content !== undefined) { sets.push('content = ?'); params.push(input.content) }
  if (input.mood !== undefined) { sets.push('mood = ?'); params.push(input.mood) }
  if (input.energy !== undefined) { sets.push('energy = ?'); params.push(input.energy) }
  sets.push('updated_at = ?'); params.push(Date.now())
  params.push(id)
  await db.run(`UPDATE journal_entries SET ${sets.join(', ')} WHERE id = ?`, params)
  bumpVersion()
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await getDb()
  await db.run('DELETE FROM journal_entries WHERE id = ?', [id])
  bumpVersion()
}

export async function journalStreak(): Promise<number> {
  const db = await getDb()
  const rows = await db.all<{ date: string }>(
    'SELECT date FROM journal_entries GROUP BY date ORDER BY date DESC',
  )
  if (!rows.length) return 0
  const dates = new Set(rows.map((r) => r.date))
  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  // If no entry today, start from yesterday
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const data = await listJournalEntries(100)
      if (!cancelled) { setEntries(data); setLoading(false) }
    }
    load()
    const unsub = subscribeVersion(load)
    return () => { cancelled = true; unsub() }
  }, [])

  return { entries, loading }
}
