import { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { getDb } from '../../core/db/client'
import { subscribeVersion, bumpVersion } from '../../shared/hooks/versionBus'
import type { Note } from './types'
import { computeNoteEmbedding } from '../../core/graph/embeddings'

export function createNoteStore() {
  return { notes: [] as Note[], loading: true }
}

export async function listNotes(activityId?: string, notebook?: string): Promise<Note[]> {
  const db = await getDb()
  let sql = 'SELECT * FROM notes'
  const params: unknown[] = []
  const conditions: string[] = []
  if (activityId) { conditions.push('activity_id = ?'); params.push(activityId) }
  if (notebook) { conditions.push('notebook = ?'); params.push(notebook) }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY updated_at DESC'
  return db.all<Note>(sql, params)
}

export async function searchNotes(query: string): Promise<Note[]> {
  const db = await getDb()
  const like = `%${query}%`
  return db.all<Note>(
    'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC LIMIT 50',
    [like, like],
  )
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await getDb()
  return db.get<Note>('SELECT * FROM notes WHERE id = ?', [id])
}

export async function createNote(input: {
  title: string
  content?: string
  activity_id?: string | null
  notebook?: string | null
}): Promise<Note> {
  const db = await getDb()
  const now = Date.now()
  const id = nanoid()
  await db.run(
    'INSERT INTO notes (id, title, content, activity_id, notebook, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, input.title, input.content ?? '', input.activity_id ?? null, input.notebook ?? null, now, now],
  )
  bumpVersion()

  // Generate embedding in background
  if (input.content) {
    computeNoteEmbedding(input.content).then(async (embedding) => {
      const { serializeEmbedding } = await import('../../core/graph/embeddings')
      await db.run(
        'INSERT OR REPLACE INTO note_embeddings (note_id, embedding, created_at) VALUES (?, ?, ?)',
        [id, serializeEmbedding(embedding), Date.now()]
      )
    }).catch(() => { /* ignore embedding errors */ })
  }

  return { id, ...input, content: input.content ?? '', activity_id: input.activity_id ?? null, notebook: input.notebook ?? null, created_at: now, updated_at: now }
}

export async function updateNote(id: string, input: {
  title?: string
  content?: string
  activity_id?: string | null
  notebook?: string | null
}): Promise<void> {
  const db = await getDb()
  const sets: string[] = []
  const params: unknown[] = []
  if (input.title !== undefined) { sets.push('title = ?'); params.push(input.title) }
  if (input.content !== undefined) { sets.push('content = ?'); params.push(input.content) }
  if (input.activity_id !== undefined) { sets.push('activity_id = ?'); params.push(input.activity_id) }
  if (input.notebook !== undefined) { sets.push('notebook = ?'); params.push(input.notebook) }
  sets.push('updated_at = ?'); params.push(Date.now())
  params.push(id)
  await db.run(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`, params)
  bumpVersion()

  // Regenerate embedding if content changed
  if (input.content !== undefined && input.content) {
    computeNoteEmbedding(input.content).then(async (embedding) => {
      const { serializeEmbedding } = await import('../../core/graph/embeddings')
      await db.run(
        'INSERT OR REPLACE INTO note_embeddings (note_id, embedding, created_at) VALUES (?, ?, ?)',
        [id, serializeEmbedding(embedding), Date.now()]
      )
    }).catch(() => { /* ignore embedding errors */ })
  }
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb()
  await db.run('DELETE FROM notes WHERE id = ?', [id])
  bumpVersion()
}

export async function listNotebooks(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.all<{ notebook: string }>(
    'SELECT DISTINCT notebook FROM notes WHERE notebook IS NOT NULL ORDER BY notebook',
  )
  return rows.map((r) => r.notebook)
}

export function useNotes(activityId?: string, notebook?: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const data = await listNotes(activityId, notebook)
      if (!cancelled) { setNotes(data); setLoading(false) }
    }
    load()
    const unsub = subscribeVersion(load)
    return () => { cancelled = true; unsub() }
  }, [activityId, notebook])

  return { notes, loading }
}
