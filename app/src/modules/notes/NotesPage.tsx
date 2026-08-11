import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText, BookOpen, LayoutGrid } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { useNotes, listNotebooks } from './queries'
import { useActivities } from '../activities/queries'
import { clsx } from 'clsx'

const NB_COLORS: Record<string, string> = {
  'Personal': 'var(--accent-amber)',
  'Work': 'var(--accent-blue)',
  'Ideas': 'var(--accent-purple)',
  'Reading': 'var(--accent-teal)',
}

export function NotesPage() {
  const { notes, loading } = useNotes()
  const activities = useActivities()
  const [view, setView] = useState<'all' | string>('all')
  const [notebooks, setNotebooks] = useState<string[]>([])

  useEffect(() => { void listNotebooks().then(setNotebooks) }, [notes])

  const activityMap = new Map(activities.map((a) => [a.id, a]))

  const filtered = view === 'all'
    ? notes
    : notes.filter((n) => n.notebook === view)

  return (
    <div>
      <PageHeader
        title="Notes"
        subtitle={loading ? 'Loading...' : `${notes.length} note${notes.length !== 1 ? 's' : ''}`}
        actions={
          <Link
            to="/notes/new"
            className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-2 text-sm font-medium text-text-inverse hover:opacity-90"
          >
            <Plus size={14} /> New note
          </Link>
        }
      />

      <div className="flex gap-1 px-6 pt-4">
        <button
          onClick={() => setView('all')}
          className={clsx(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
            view === 'all' ? 'text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
          )}
        >
          <LayoutGrid size={14} /> All
        </button>
        {notebooks.map((nb) => (
          <button
            key={nb}
            onClick={() => setView(nb)}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              view === nb ? 'text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
            )}
          >
            <BookOpen size={14} /> {nb}
          </button>
        ))}
        {view !== 'all' && (
          <button
            onClick={() => setView('all')}
            className="ml-auto text-xs text-text-muted hover:text-text-secondary"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <FileText size={32} className="mb-3 text-text-muted" />
            <p className="text-sm text-text-muted">No notes yet.</p>
            <Link to="/notes/new" className="mt-2 text-xs text-accent-blue hover:underline">Create your first note</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((note, i) => {
              const activity = note.activity_id ? activityMap.get(note.activity_id) : null
              const nbColor = NB_COLORS[note.notebook ?? ''] ?? 'var(--accent-blue)'
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
                  className="rounded-xl border border-border-subtle bg-bg-secondary p-4 transition-colors hover:bg-bg-hover"
                >
                  <Link to={`/notes/${note.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-text-primary line-clamp-2">{note.title || 'Untitled'}</h3>
                      {note.notebook && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: `${nbColor}18`, color: nbColor }}
                        >
                          {note.notebook}
                        </span>
                      )}
                    </div>
                    {note.content && (
                      <p className="mt-1.5 text-xs text-text-muted line-clamp-3">{note.content}</p>
                    )}
                    <div className="mt-2.5 flex items-center gap-2 text-[10px] text-text-muted">
                      {activity && (
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                          {activity.name}
                        </span>
                      )}
                      <span className="ml-auto">
                        {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
