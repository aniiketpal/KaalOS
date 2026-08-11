import { parseStringPromise } from 'xml2js'
import { FEED_SOURCES, FeedSource } from '../src/core/feed/feed-sources.js'

interface ParsedItem {
  title: string
  link: string
  pubDate?: string
  content?: string
  summary?: string
  'content:encoded'?: string
  'media:thumbnail'?: Array<{ $: { url: string } }>
  guid?: string
}

interface FeedItem {
  id: string
  title: string
  url: string
  source: string
  category: string
  summary: string | null
  image_url: string | null
  published_at: number | null
}

function hashUrl(url: string): string {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function extractContent(item: ParsedItem): string {
  if (item['content:encoded']?.[0]) return item['content:encoded'][0]
  if (item.content?.[0]) return item.content[0]
  if (item.summary?.[0]) return item.summary[0]
  return ''
}

function extractImage(item: ParsedItem): string | null {
  if (item['media:thumbnail']?.[0]?.$?.url) return item['media:thumbnail'][0].$.url
  const content = extractContent(item)
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/)
  return imgMatch?.[1] || null
}

function parseDate(dateStr?: string): number | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date.getTime()
}

async function fetchFeed(source: FeedSource): Promise<FeedItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'LifeTracker-FeedCollector/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const xml = await res.text()
    const parsed = await parseStringPromise(xml, { explicitArray: true, mergeAttrs: true })

    const items: ParsedItem[] = parsed.rss?.channel?.[0]?.item ?? parsed.feed?.entry ?? []

    return items.map((item) => {
      const title = item.title?.[0] ?? 'Untitled'
      const link = item.link?.[0]?.href ?? item.link?.[0] ?? item.guid?.[0] ?? ''
      const content = extractContent(item)
      const summary = content.replace(/<[^>]+>/g, '').slice(0, 500)
      const image = extractImage(item)
      const published = parseDate(item.pubDate?.[0] ?? item.published?.[0] ?? item.updated?.[0])

      return {
        id: hashUrl(link || item.guid?.[0] ?? title),
        title,
        url: link,
        source: source.name,
        category: source.category,
        summary: summary || null,
        image_url: image,
        published_at: published,
      }
    }).filter((item) => item.url && item.title)
  } catch (err) {
    console.error(`Failed to fetch ${source.name}:`, err)
    return []
  }
}

function deduplicate(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

async function collectAllFeeds(): Promise<FeedItem[]> {
  console.log(`Fetching ${FEED_SOURCES.length} feeds...`)
  const results = await Promise.allSettled(
    FEED_SOURCES.map((source) => fetchFeed(source))
  )

  const allItems: FeedItem[] = []
  let successCount = 0

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value)
      successCount++
    } else {
      console.error(`Feed ${FEED_SOURCES[i].name} failed:`, result.reason)
    }
  })

  console.log(`Successfully fetched ${successCount}/${FEED_SOURCES.length} feeds`)
  console.log(`Total items before dedup: ${allItems.length}`)

  const unique = deduplicate(allItems)
  console.log(`Unique items after dedup: ${unique.length}`)

  return unique
}

async function main() {
  const items = await collectAllFeeds()

  const output = {
    items: items.slice(0, 200),
    collected_at: Date.now(),
  }

  const fs = await import('fs')
  const path = await import('path')
  const outputDir = path.join(process.cwd(), 'feed-output', 'feed')
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(
    path.join(outputDir, 'feed.json'),
    JSON.stringify(output, null, 2)
  )

  console.log(`Written ${output.items.length} items to feed-output/feed/feed.json`)
}

main().catch((err) => {
  console.error('Collection failed:', err)
  process.exit(1)
})