import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Rss } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { useFeedItems, useUnreadCount, ensureFeedLoaded, fetchRemoteFeed, markRead, saveToNote, CATEGORIES, type Category } from './queries'
import { createNote } from '../notes/queries'
import { FeedCard } from './FeedCard'
import { clsx } from 'clsx'

const CATEGORY_LABELS: Record<Category, string> = {
  'ai-news': 'AI News',
  'tutorial': 'Tutorials',
  'company-blog': 'Company Blogs',
  'solo-blog': 'Blogs',
  'wildcard': 'Wildcard',
}

export function FeedPage() {
  const [category, setCategory] = useState<Category | 'all'>('all')
  const { items, loading } = useFeedItems(category === 'all' ? undefined : category)
  const unread = useUnreadCount()
  const [refreshing, setRefreshing] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  // Populate the feed on first open (no-op when cache is fresh).
  useEffect(() => {
    void ensureFeedLoaded()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRemoteFeed()
    setRefreshing(false)
  }

  const handleSave = async (item: typeof items[0]) => {
    setSavingId(item.id)
    await createNote({
      title: item.title,
      content: `Source: ${item.url}\n\n${item.summary ?? ''}`,
    })
    await saveToNote(item.id)
    setSavingId(null)
  }

  return (
    <div>
      <PageHeader
        title="Feed"
        subtitle={`${unread} unread items`}
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-md bg-bg-tertiary px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      {/* Category tabs */}
      <div className="flex gap-1 px-6 pt-4">
        {(['all', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              category === c ? 'text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
            )}
          >
            {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            {category === c && (
              <motion.span layoutId="feed-tab" className="mt-1 block h-0.5 rounded-full bg-accent-blue" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Rss size={32} className="mb-3 text-text-muted" />
            <p className="text-sm text-text-muted">Fetching the latest… try Refresh if nothing appears.</p>
          </div>
        ) : (
          <div className="grid max-w-4xl gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {items.map((item, i) => (
              <FeedCard
                key={item.id}
                item={item}
                index={i}
                saving={savingId === item.id}
                onSave={() => void handleSave(item)}
                onOpen={() => void markRead(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
