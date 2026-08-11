import { useEffect, useState } from 'react'
import { getDb } from '../../core/db/client'
import { subscribeVersion, bumpVersion } from '../../shared/hooks/versionBus'

export interface FeedItem {
  id: string
  title: string
  url: string
  source: string
  category: string
  summary: string | null
  image_url: string | null
  published_at: number | null
  saved: number
  read: number
  fetched_at: number
}

const CATEGORIES = ['ai-news', 'tutorial', 'company-blog', 'solo-blog', 'wildcard'] as const
type Category = (typeof CATEGORIES)[number]

const REMOTE_FEED_URL = 'https://aniiketpal.github.io/KaalOS/feed/feed.json'

// Simple deterministic ID from URL
function itemId(url: string): string {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) >>> 0
  }
  return `feed-${hash}`
}

async function cacheItems(items: Omit<FeedItem, 'id' | 'saved' | 'read' | 'fetched_at'>[]): Promise<void> {
  const db = await getDb()
  for (const item of items) {
    const id = itemId(item.url)
    const existing = await db.get<{ id: string }>('SELECT id FROM feed_items WHERE id = ?', [id])
    if (existing) continue
    await db.run(
      `INSERT INTO feed_items (id, title, url, source, category, summary, image_url, published_at, saved, read, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      [id, item.title, item.url, item.source, item.category, item.summary ?? null, item.image_url ?? null, item.published_at ?? null, Date.now()],
    )
  }
  bumpVersion()
}

export async function fetchRemoteFeed(): Promise<void> {
  try {
    const res = await fetch(REMOTE_FEED_URL, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    if (!data?.items?.length) return

    const items: Omit<FeedItem, 'id' | 'saved' | 'read' | 'fetched_at'>[] = data.items.map((item: any) => ({
      title: item.title,
      url: item.url,
      source: item.source ?? 'remote',
      category: item.category ?? 'wildcard',
      summary: item.summary ?? null,
      image_url: item.image_url ?? null,
      published_at: item.published_at ?? null,
    }))

    await cacheItems(items)
  } catch (err) {
    console.warn('Remote feed fetch failed, falling back to local sources:', err)
    await refreshFeed() // Fallback to HN/Dev.to
  }
}

export async function refreshFeed(): Promise<void> {
  const db = await getDb()
  const since = await db.get<{ max: number | null }>('SELECT MAX(fetched_at) as max FROM feed_items')
  if (since?.max && Date.now() - since.max < 30 * 60 * 1000) return // 30-min cache

  const items: Omit<FeedItem, 'id' | 'saved' | 'read' | 'fetched_at'>[] = []

  // HN top stories
  try {
    const topIds: number[] = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then((r) => r.json())
    const stories = await Promise.all(
      topIds.slice(0, 10).map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json()),
      ),
    )
    for (const s of stories) {
      if (s?.title && s?.url) {
        items.push({ title: s.title, url: s.url, source: 'hackernews', category: 'ai-news', summary: null, image_url: null, published_at: (s.time ?? 0) * 1000 })
      }
    }
  } catch { /* skip HN if offline */ }

  // Dev.to articles
  try {
    const articles: { title: string; url: string; description: string; published_at: string }[] =
      await fetch('https://dev.to/api/articles?top=7&per_page=10').then((r) => r.json())
    for (const a of articles) {
      items.push({ title: a.title, url: a.url, source: 'devto', category: 'tutorial', summary: a.description ?? null, image_url: null, published_at: a.published_at ? new Date(a.published_at).getTime() : null })
    }
  } catch { /* skip if offline */ }

  await cacheItems(items)
}

export async function markRead(id: string): Promise<void> {
  const db = await getDb()
  await db.run('UPDATE feed_items SET read=1 WHERE id=?', [id])
  bumpVersion()
}

export async function saveToNote(id: string): Promise<void> {
  const db = await getDb()
  await db.run('UPDATE feed_items SET saved=1 WHERE id=?', [id])
  bumpVersion()
}

export function useFeedItems(category?: Category) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const db = await getDb()
      const sql = category
        ? 'SELECT * FROM feed_items WHERE category = ? ORDER BY published_at DESC LIMIT 50'
        : 'SELECT * FROM feed_items ORDER BY published_at DESC LIMIT 50'
      const params = category ? [category] : []
      const data = await db.all<FeedItem>(sql, params)
      if (!cancelled) { setItems(data); setLoading(false) }
    }
    load()
    const unsub = subscribeVersion(load)
    return () => { cancelled = true; unsub() }
  }, [category])

  return { items, loading }
}

export function useUnreadCount(): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const db = await getDb()
      const row = await db.get<{ n: number }>('SELECT COUNT(*) as n FROM feed_items WHERE read=0')
      if (!cancelled) setCount(row?.n ?? 0)
    }
    load()
    const unsub = subscribeVersion(load)
    return () => { cancelled = true; unsub() }
  }, [])
  return count
}

export { CATEGORIES }
export type { Category }
