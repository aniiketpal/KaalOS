import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search, StickyNote, BookOpen, CheckSquare, Zap } from 'lucide-react'
import { searchAll, type SearchResult } from '../../core/db/search'
import { totalXp, currentLevel } from '../../core/db/xp'
import { subscribeVersion } from '../../shared/hooks/versionBus'

const KIND_ICON = { note: StickyNote, journal: BookOpen, task: CheckSquare }
const KIND_COLOR = { note: 'text-accent-amber', journal: 'text-accent-teal', task: 'text-accent-blue' }

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
    else { setQuery(''); setResults([]) }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setSearching(true)
    const timer = setTimeout(async () => {
      const r = await searchAll(query)
      setResults(r)
      setSearching(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    if (result.kind === 'note') navigate(`/notes/${result.id}`)
    else if (result.kind === 'journal') navigate('/journal')
    else if (result.kind === 'task') navigate('/tasks')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border border-border-subtle bg-bg-tertiary px-3 text-xs text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
      >
        <Search size={14} />
        <span>Search</span>
        <kbd className="ml-2 rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
          Ctrl K
        </kbd>
      </button>

      <Command.Dialog open={open} onOpenChange={setOpen} label="Global search" className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
        <div className="absolute left-1/2 top-[15%] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary shadow-xl">
          <Command className="flex flex-col" shouldFilter={false}>
            <div className="flex items-center border-b border-border-subtle px-4">
              <Search size={16} className="mr-2 shrink-0 text-text-muted" />
              <Command.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Search notes, journal, tasks..."
                className="h-12 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              {searching && (
                <div className="h-4 w-4 animate-spin rounded-full border border-border-focus border-t-accent-blue" />
              )}
            </div>

            <Command.List className="max-h-80 overflow-auto p-2">
              {results.length === 0 && !searching && query.trim() && (
                <div className="px-2 py-6 text-center text-sm text-text-muted">
                  No results for "{query}"
                </div>
              )}
              {results.length === 0 && !query.trim() && (
                <div className="px-2 py-6 text-center text-sm text-text-muted">
                  Search notes, journal, and tasks...
                </div>
              )}
              {results.map((r) => {
                const Icon = KIND_ICON[r.kind]
                return (
                  <Command.Item
                    key={`${r.kind}-${r.id}`}
                    value={`${r.kind}-${r.id}`}
                    onSelect={() => handleSelect(r)}
                    className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-sm data-[selected=true]:bg-bg-hover"
                  >
                    <Icon size={14} className={`mt-0.5 shrink-0 ${KIND_COLOR[r.kind]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-text-primary">{r.title || 'Untitled'}</p>
                      {r.subtitle && <p className="mt-0.5 truncate text-xs text-text-muted">{r.subtitle}</p>}
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-text-muted/60">{r.kind}</p>
                    </div>
                  </Command.Item>
                )
              })}
            </Command.List>

            <div className="flex items-center gap-3 border-t border-border-subtle px-4 py-2 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-mono">↵</kbd> open</span>
              <span className="flex items-center gap-1"><kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-mono">Esc</kbd> close</span>
            </div>
          </Command>
        </div>
      </Command.Dialog>
    </>
  )
}

function XpPill() {
  const [xp, setXp] = useState(0)
  useEffect(() => {
    let mounted = true
    totalXp().then((v) => { if (mounted) setXp(v) })
    const unsub = subscribeVersion(() => totalXp().then((v) => { if (mounted) setXp(v) }))
    return () => { mounted = false; unsub() }
  }, [])
  const { level } = currentLevel(xp)
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-bg-tertiary px-2.5 py-1 border border-border-subtle">
      <Zap size={11} className="text-accent-amber" />
      <span className="text-[11px] text-text-secondary">Lvl {level}</span>
      <span className="text-[11px] text-text-muted">{xp} XP</span>
    </div>
  )
}

export function TopBar() {
  return (
    <header className="flex h-12 items-center justify-between gap-4 border-b border-border-subtle bg-bg-primary px-4">
      <div className="text-sm font-medium text-text-secondary">KaalOS</div>
      <CommandPalette />
      <div className="flex items-center gap-2">
        <XpPill />
      </div>
    </header>
  )
}
