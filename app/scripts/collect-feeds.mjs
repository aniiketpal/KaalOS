import { parseStringPromise } from 'xml2js'

const FEED_SOURCES = [
  // AI News
  { name: 'Anthropic Engineering', url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_engineering.xml', category: 'ai-news' },
  { name: 'Anthropic News', url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml', category: 'ai-news' },
  { name: 'OpenAI Engineering', url: 'https://openai.com/news/engineering/rss.xml', category: 'ai-news' },
  { name: 'OpenAI Research', url: 'https://openai.com/blog/rss.xml', category: 'ai-news' },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', category: 'ai-news' },
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', category: 'ai-news' },
  { name: 'The Batch — DeepLearning.AI', url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_the_batch.xml', category: 'ai-news' },
  { name: 'Machine Learning Mastery', url: 'https://feeds.feedburner.com/MachineLearningMastery', category: 'ai-news' },

  // Tutorials
  { name: 'ByteByteGo', url: 'https://blog.bytebytego.com/feed', category: 'tutorial' },
  { name: 'DEV Community — all', url: 'https://dev.to/feed', category: 'tutorial' },
  { name: 'DEV Community — backend', url: 'https://dev.to/feed/tag/backend', category: 'tutorial' },
  { name: 'Amigoscode', url: 'https://blog.amigoscode.com/feed', category: 'tutorial' },
  { name: 'Computer Science Simplified', url: 'https://computersciencesimplified.substack.com/feed', category: 'tutorial' },
  { name: 'The T-Shaped Dev', url: 'https://thetshaped.dev/feed', category: 'tutorial' },

  // Company Blogs
  { name: 'Netflix Tech Blog', url: 'https://netflixtechblog.com/feed', category: 'company-blog' },
  { name: 'Meta Engineering', url: 'https://engineering.fb.com/feed/', category: 'company-blog' },
  { name: 'Slack Engineering', url: 'https://slack.engineering/feed/', category: 'company-blog' },
  { name: 'Airbnb Engineering', url: 'https://medium.com/feed/airbnb-engineering', category: 'company-blog' },
  { name: 'Pinterest Engineering', url: 'https://medium.com/feed/pinterest-engineering', category: 'company-blog' },
  { name: 'GitHub Engineering', url: 'https://github.blog/engineering/feed/', category: 'company-blog' },
  { name: 'Uber Engineering', url: 'https://eng.uber.com/feed/', category: 'company-blog' },

  // Solo Engineers
  { name: 'Julia Evans', url: 'https://jvns.ca/atom.xml', category: 'solo-blog' },
  { name: 'Dan Luu', url: 'https://danluu.com/atom.xml', category: 'solo-blog' },
  { name: 'Martin Fowler', url: 'https://martinfowler.com/feed.atom', category: 'solo-blog' },
  { name: 'Addy Osmani', url: 'https://addyosmani.com/rss.xml', category: 'solo-blog' },
  { name: 'Pragmatic Engineer', url: 'https://blog.pragmaticengineer.com/rss/', category: 'solo-blog' },
  { name: 'Register Spill', url: 'https://registerspill.thorstenball.com/feed', category: 'solo-blog' },
  { name: "Engineer's Codex", url: 'https://read.engineerscodex.com/feed', category: 'solo-blog' },
  { name: 'Hamel Husain', url: 'https://hamel.dev/index.xml', category: 'solo-blog' },

  // Curated Aggregators
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'wildcard' },
  { name: 'Lobsters', url: 'https://lobste.rs/rss', category: 'wildcard' },
  { name: 'Reddit r/programming', url: 'https://www.reddit.com/r/programming/top/.rss?t=day', category: 'wildcard' },
  { name: 'Reddit r/ExperiencedDevs', url: 'https://www.reddit.com/r/ExperiencedDevs/.rss', category: 'wildcard' },
]

function hashUrl(url) {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function extractContent(item) {
  if (item['content:encoded']?.[0]) return item['content:encoded'][0]
  if (item.content?.[0]) return item.content[0]
  if (item.summary?.[0]) return item.summary[0]
  return ''
}

function extractImage(item) {
  if (item['media:thumbnail']?.[0]?.$?.url) return item['media:thumbnail'][0].$.url
  const content = extractContent(item)
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/)
  return imgMatch?.[1] || null
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date.getTime()
}

async function fetchFeed(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'KaalOS-FeedCollector/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const xml = await res.text()
    const parsed = await parseStringPromise(xml, { explicitArray: true, mergeAttrs: true })

    const items = parsed.rss?.channel?.[0]?.item ?? parsed.feed?.entry ?? []

    return items.map((item) => {
      const title = item.title?.[0] ?? 'Untitled'
      const link = item.link?.[0]?.href ?? item.link?.[0] ?? item.guid?.[0] ?? ''
      const content = extractContent(item)
      const summary = content.replace(/<[^>]+>/g, '').slice(0, 500)
      const image = extractImage(item)
      const published = parseDate(item.pubDate?.[0] ?? item.published?.[0] ?? item.updated?.[0])

      return {
        id: hashUrl(link || (item.guid?.[0] ?? title)),
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

function deduplicate(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

async function collectAllFeeds() {
  console.log(`Fetching ${FEED_SOURCES.length} feeds...`)
  const results = await Promise.allSettled(
    FEED_SOURCES.map((source) => fetchFeed(source))
  )

  const allItems = []
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
