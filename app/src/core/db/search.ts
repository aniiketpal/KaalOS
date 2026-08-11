import { getDb } from './client'

export type SearchResultKind = 'note' | 'journal' | 'task'

export interface SearchResult {
  kind: SearchResultKind
  id: string
  title: string
  subtitle?: string
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const like = `%${query.trim()}%`
  if (!like.replace(/%/g, '')) return []
  const db = await getDb()

  const [notes, journals, tasks] = await Promise.all([
    db.all<{ id: string; title: string; content: string }>(
      'SELECT id, title, content FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC LIMIT 10',
      [like, like],
    ),
    db.all<{ id: string; prompt: string | null; content: string }>(
      'SELECT id, prompt, content FROM journal_entries WHERE content LIKE ? OR prompt LIKE ? ORDER BY created_at DESC LIMIT 10',
      [like, like],
    ),
    db.all<{ id: string; title: string; notes: string | null }>(
      "SELECT id, title, notes FROM tasks WHERE title LIKE ? OR notes LIKE ? ORDER BY created_at DESC LIMIT 10",
      [like, like],
    ),
  ])

  return [
    ...notes.map((n): SearchResult => ({ kind: 'note', id: n.id, title: n.title, subtitle: n.content?.slice(0, 80) })),
    ...journals.map((j): SearchResult => ({ kind: 'journal', id: j.id, title: j.prompt ?? 'Journal entry', subtitle: j.content?.slice(0, 80) })),
    ...tasks.map((t): SearchResult => ({ kind: 'task', id: t.id, title: t.title, subtitle: t.notes ?? undefined })),
  ]
}
