import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = join(fileURLToPath(import.meta.url), '..')

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

interface CuratedItem extends FeedItem {
  curated_category: string
  curated_summary: string
}

const CATEGORIES = ['ai-news', 'tutorial', 'company-blog', 'solo-blog', 'wildcard'] as const
type Category = typeof CATEGORIES[number]

const CATEGORIZATION_PROMPT = `Categorize this feed item into exactly ONE of these categories:
- ai-news: AI research, models, company announcements, breakthroughs
- tutorial: How-to guides, code walkthroughs, technical tutorials
- company-blog: Engineering blogs from tech companies (Netflix, Meta, Google, etc.)
- solo-blog: Personal blogs by individual engineers/writers
- wildcard: Everything else (news aggregators, forums, general tech news)

Title: {{TITLE}}
Content: {{CONTENT}}

Return ONLY the category name.`

const SUMMARIZATION_PROMPT = `Summarize this feed item in 1-2 sentences. Focus on the key insight or actionable takeaway. Be concise and specific.

Title: {{TITLE}}
Content: {{CONTENT}}

Return ONLY the summary.`

async function callLLM(apiKey: string, baseUrl: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`LLM error: ${error.error?.message || res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

async function categorizeItem(apiKey: string, baseUrl: string, model: string, item: FeedItem): Promise<Category> {
  const content = item.summary || item.title
  const prompt = CATEGORIZATION_PROMPT
    .replace('{{TITLE}}', item.title)
    .replace('{{CONTENT}}', content.slice(0, 1000))

  try {
    const response = await callLLM(apiKey, baseUrl, model, '', prompt)
    const category = response.toLowerCase().trim()
    return CATEGORIES.includes(category as Category) ? category as Category : 'wildcard'
  } catch {
    return 'wildcard'
  }
}

async function summarizeItem(apiKey: string, baseUrl: string, model: string, item: FeedItem): Promise<string> {
  const content = item.summary || item.title
  const prompt = SUMMARIZATION_PROMPT
    .replace('{{TITLE}}', item.title)
    .replace('{{CONTENT}}', content.slice(0, 1500))

  try {
    return await callLLM(apiKey, baseUrl, model, '', prompt)
  } catch {
    return content.slice(0, 200)
  }
}

async function main() {
  const apiKey = process.env.TOKEN_ROUTER_KEY
  const baseUrl = process.env.TOKEN_ROUTER_BASE || 'https://api.tokenrouter.com/v1'
  const model = process.env.TOKEN_ROUTER_MODEL || 'kimi-k3'

  if (!apiKey) {
    console.error('TOKEN_ROUTER_KEY environment variable not set')
    process.exit(1)
  }

  const inputPath = join(__dirname, '..', 'feed-output', 'feed', 'feed.json')
  const outputPath = join(__dirname, '..', 'feed-output', 'feed', 'feed.json')

  const raw = readFileSync(inputPath, 'utf-8')
  const data = JSON.parse(raw)

  console.log(`Curating ${data.items.length} items...`)

  const curated: CuratedItem[] = []

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i]
    console.log(`  [${i + 1}/${data.items.length}] ${item.title.slice(0, 60)}...`)

    const [category, summary] = await Promise.all([
      categorizeItem(apiKey, baseUrl, model, item),
      summarizeItem(apiKey, baseUrl, model, item),
    ])

    curated.push({ ...item, category, summary })
  }

  const output = {
    items: curated,
    collected_at: data.collected_at,
    curated_at: Date.now(),
  }

  writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`Curated feed written to ${outputPath}`)
}

main().catch((err) => {
  console.error('Curation failed:', err)
  process.exit(1)
})