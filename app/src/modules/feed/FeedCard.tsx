import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import type { FeedItem } from './queries'

/** Per-category accent + fallback-cover gradient, all drawn from the KaalNiti palette. */
const CATEGORY_STYLE: Record<string, { label: string; color: string; from: string; to: string }> = {
  'ai-news': { label: 'AI News', color: '#c45a28', from: '#c45a28', to: '#5f2a12' },
  'tutorial': { label: 'Tutorials', color: '#3a8a7a', from: '#3a8a7a', to: '#1c4139' },
  'company-blog': { label: 'Company Blogs', color: '#8a6a9e', from: '#8a6a9e', to: '#43334f' },
  'solo-blog': { label: 'Blogs', color: '#d4a03a', from: '#d4a03a', to: '#6f5320' },
  'wildcard': { label: 'Wildcard', color: '#c45a5a', from: '#c45a5a', to: '#5f2b2b' },
}
const DEFAULT_STYLE = { label: 'Feed', color: '#8a6a9e', from: '#3a3330', to: '#1a1616' }

const catStyle = (category: string) => CATEGORY_STYLE[category] ?? DEFAULT_STYLE

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Short wordmark for the fallback cover: known aggregators get real initials. */
function monogram(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('hackernews') || s === 'hn') return 'HN'
  if (s.includes('devto') || s.includes('dev.to')) return 'DEV'
  const clean = source.replace(/[^a-z0-9]/gi, '')
  return (clean.slice(0, 2) || 'KA').toUpperCase()
}

function formatDate(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Real feature image when present, otherwise a generated per-category cover. */
function Thumbnail({ item }: { item: FeedItem }) {
  const [failed, setFailed] = useState(false)
  const style = catStyle(item.category)

  if (item.image_url && !failed) {
    return (
      <img
        src={item.image_url}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    )
  }

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(140deg, ${style.from}, ${style.to})` }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,0.16), transparent 60%)' }}
      />
      <span className="relative font-serif text-3xl font-semibold tracking-tight text-white/90">
        {monogram(item.source)}
      </span>
      <span className="relative mt-1 max-w-[85%] truncate text-[10px] uppercase tracking-widest text-white/55">
        {hostOf(item.url) || item.source}
      </span>
    </div>
  )
}

export interface FeedCardProps {
  item: FeedItem
  index: number
  saving: boolean
  onSave: () => void
  /** Marks the item read; fired when any link into the article is clicked. */
  onOpen: () => void
}

export function FeedCard({ item, index, saving, onSave, onOpen }: FeedCardProps) {
  const style = catStyle(item.category)
  const host = hostOf(item.url)
  const date = formatDate(item.published_at)
  const isRead = !!item.read
  const isSaved = !!item.saved

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
      className={clsx(
        'group flex min-h-[8.5rem] overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-colors',
        'hover:border-border-muted hover:bg-bg-hover',
        isRead && 'opacity-55 hover:opacity-90',
      )}
    >
      {/* Feature image / generated cover */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        className="relative w-40 shrink-0 self-stretch sm:w-44"
      >
        <Thumbnail item={item} />
        {!isRead && (
          <span
            className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-black/40"
            style={{ backgroundColor: style.color }}
            aria-hidden
          />
        )}
      </a>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <span
          className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: style.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.color }} />
          {style.label}
        </span>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          className="line-clamp-2 text-[15px] font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent-blue"
        >
          {item.title}
        </a>

        {item.summary && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-muted">{item.summary}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-text-muted">
            <span className="truncate font-medium text-text-secondary">{item.source}</span>
            {host && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{host}</span>
              </>
            )}
            {date && (
              <>
                <span aria-hidden>·</span>
                <span className="shrink-0">{date}</span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onSave}
              disabled={isSaved || saving}
              title={isSaved ? 'Saved to notes' : 'Save as note'}
              className={clsx(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:cursor-default',
                isSaved ? 'text-success' : 'text-text-muted hover:bg-bg-active hover:text-text-primary',
              )}
            >
              <Bookmark size={13} className={isSaved ? 'fill-current' : ''} />
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onOpen}
              title="Open article"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-active hover:text-text-primary"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
