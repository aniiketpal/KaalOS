import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Sparkles, BookOpen, PenLine, RefreshCw, Save } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { useJournalEntries, createJournalEntry, updateJournalEntry, journalStreak } from './queries'
import { MOOD_LABELS, ENERGY_LABELS } from './prompts'
import { getJournalPrompt, shouldGenerateBatch, generateQuestionBatch } from '../../core/llm/questions'
import { todayStr } from '../tasks/types'
import { clsx } from 'clsx'
import type { JournalEntry } from './types'

type Mode = 'prompt' | 'free'

export function JournalPage() {
  const { entries, loading } = useJournalEntries()
  const [streak, setStreak] = useState(0)
  const [mode, setMode] = useState<Mode | null>(null)
  const [editing, setEditing] = useState<JournalEntry | null>(null)

  useEffect(() => { void journalStreak().then(setStreak) }, [entries])

  return (
    <div>
      <PageHeader
        title="Journal"
        subtitle={`${streak} day streak · ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('prompt')}
              className="flex items-center gap-1.5 rounded-md bg-bg-tertiary px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
            >
              <Sparkles size={14} /> Prompt
            </button>
            <button
              onClick={() => setMode('free')}
              className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-2 text-sm font-medium text-text-inverse hover:opacity-90"
            >
              <PenLine size={14} /> Free write
            </button>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {mode && (
          <JournalComposer
            key={mode}
            mode={mode}
            onClose={() => setMode(null)}
            onSaved={() => setMode(null)}
          />
        )}
        {editing && (
          <JournalComposer
            key={editing.id}
            mode={editing.prompt ? 'prompt' : 'free'}
            entry={editing}
            onClose={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      <div className="p-6">
        {loading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <BookOpen size={32} className="mb-3 text-text-muted" />
            <p className="text-sm text-text-muted">No entries yet.</p>
            <p className="mt-1 text-xs text-text-muted">Start with a prompt or free write.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <JournalCard key={entry.id} entry={entry} index={i} onEdit={() => setEditing(entry)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function JournalCard({ entry, index, onEdit }: {
  entry: JournalEntry
  index: number
  onEdit: () => void
}) {
  const date = new Date(entry.date + 'T00:00:00')
  const isToday = entry.date === todayStr()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={clsx(
        'rounded-xl border bg-bg-secondary p-4 transition-colors hover:bg-bg-hover',
        isToday ? 'border-accent-blue/30' : 'border-border-subtle',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {entry.prompt && (
            <p className="mb-1 text-xs italic text-text-muted leading-snug">{entry.prompt}</p>
          )}
          <p className="text-sm text-text-primary line-clamp-3">{entry.content}</p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-text-muted">
            <span className={isToday ? 'text-accent-blue font-medium' : ''}>
              {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            {entry.mood && <span>Mood {entry.mood}/10</span>}
            {entry.energy && <span>Energy {entry.energy}/10</span>}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-text-muted hover:bg-bg-hover hover:text-text-primary"
        >
          Edit
        </button>
      </div>
    </motion.div>
  )
}

function JournalComposer({ mode, entry, onClose, onSaved }: {
  mode: Mode
  entry?: JournalEntry
  onClose: () => void
  onSaved: () => void
}) {
  const [content, setContent] = useState(entry?.content ?? '')
  const [mood, setMood] = useState(entry?.mood ?? 5)
  const [energy, setEnergy] = useState(entry?.energy ?? 5)
  const [prompt, setPrompt] = useState<string | null>(entry?.prompt ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!entry && mode === 'prompt') {
      getJournalPrompt().then(setPrompt)
      // Trigger batch generation if needed (fire and forget)
      shouldGenerateBatch().then((should) => {
        if (should) void generateQuestionBatch()
      })
    }
  }, [entry, mode])

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    if (entry) {
      await updateJournalEntry(entry.id, { content, mood, energy })
    } else {
      await createJournalEntry({
        date: todayStr(),
        prompt: prompt ?? undefined,
        content,
        mood,
        energy,
      })
    }
    setSaving(false)
    onSaved()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
        className="w-full max-w-lg rounded-2xl border border-border-subtle bg-bg-secondary shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <div className="flex items-center gap-2">
            {mode === 'prompt' ? <Sparkles size={14} className="text-accent-amber" /> : <PenLine size={14} className="text-accent-blue" />}
            <span className="text-sm font-medium text-text-primary">
              {mode === 'prompt' ? 'Guided journal' : 'Free write'}
            </span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <ChevronLeft size={16} className="rotate-180" />
          </button>
        </div>

        <div className="p-5">
          {/* Prompt */}
          {mode === 'prompt' && prompt && (
            <div className="mb-4 rounded-lg bg-accent-amber/5 border border-accent-amber/20 p-3">
              <p className="text-sm italic text-text-secondary leading-relaxed">{prompt}</p>
              <button
                onClick={() => getJournalPrompt([prompt ?? '']).then(setPrompt)}
                className="mt-2 flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary"
              >
                <RefreshCw size={10} /> Shuffle prompt
              </button>
            </div>
          )}

          {/* Editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === 'prompt' ? 'Write freely, no pressure...' : "What's on your mind?"}
            className="h-48 w-full resize-none rounded-lg border border-border-subtle bg-bg-tertiary p-3 text-sm text-text-primary outline-none placeholder:text-text-muted/40 focus:border-border-focus"
            autoFocus
          />

          {/* Mood + Energy */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Mood — {MOOD_LABELS[mood]} ({mood})
              </label>
              <input
                type="range" min={1} max={10} value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full accent-accent-blue"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Energy — {ENERGY_LABELS[energy]} ({energy})
              </label>
              <input
                type="range" min={1} max={10} value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full accent-accent-teal"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="flex items-center gap-1.5 rounded-md bg-accent-blue px-4 py-2 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-40"
            >
              <Save size={14} />
              {saving ? 'Saving...' : entry ? 'Save changes' : 'Save entry'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
