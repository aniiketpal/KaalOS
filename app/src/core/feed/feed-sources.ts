export interface FeedSource {
  name: string
  url: string
  category: 'ai-news' | 'tutorial' | 'company-blog' | 'solo-blog' | 'wildcard'
  note?: string
}

export const FEED_SOURCES: FeedSource[] = [
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

export const CATEGORIES = ['ai-news', 'tutorial', 'company-blog', 'solo-blog', 'wildcard'] as const
export type FeedCategory = typeof CATEGORIES[number]