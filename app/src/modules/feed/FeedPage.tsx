import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Bookmark, RefreshCw, Rss, Circle } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { useFeedItems, useUnreadCount, fetchRemoteFeed, markRead, saveToNote, CATEGORIES, type Category } from './queries'
import { createNote } from '../notes/queries'
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
            <p className="text-sm text-text-muted">No items yet. Click Refresh to fetch.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className={clsx(
                  'rounded-xl border bg-bg-secondary p-4 transition-colors hover:bg-bg-hover',
                  item.read ? 'border-border-subtle opacity-60' : 'border-border-subtle',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {!item.read && <Circle size={6} className="mt-1.5 shrink-0 fill-accent-blue text-accent-blue" />}
                    <div className="flex-1 min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => void markRead(item.id)}
                        className="block text-sm font-medium text-text-primary hover:text-accent-blue leading-snug"
                      >
                        {item.title}
                      </a>
                      {item.summary && (
                        <p className="mt-1 text-xs text-text-muted line-clamp-2">{item.summary}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-text-muted">
                        <span className="uppercase tracking-wide">{CATEGORY_LABELS[item.category as Category] ?? item.category}</span>
                        <span>· {item.source}</span>
                        {item.published_at && (
                          <span>· {new Date(item.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => void handleSave(item)}
                      disabled={!!item.saved || savingId === item.id}
                      className={clsx(
                        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                        item.saved ? 'text-success' : 'text-text-muted hover:bg-bg-hover hover:text-text-primary',
                      )}
                      title={item.saved ? 'Saved to notes' : 'Save as note'}
                    >
                      <Bookmark size={13} className={item.saved ? 'fill-current' : ''} />
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary"
                      title="Open"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
