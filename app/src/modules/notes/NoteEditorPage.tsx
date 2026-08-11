import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Trash2, Save, Link2, BookOpen } from 'lucide-react'
import { getNote, createNote, updateNote, deleteNote, listNotebooks } from './queries'
import { useActivities } from '../activities/queries'
import { clsx } from 'clsx'

export function NoteEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new' || !id

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [activityId, setActivityId] = useState('')
  const [notebook, setNotebook] = useState('')
  const [createdAt, setCreatedAt] = useState<number>(Date.now())
  const [loaded, setLoaded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saved, setSaved] = useState(false)

  const activities = useActivities()
  const [notebooks, setNotebooks] = useState<string[]>([])

  useEffect(() => {
    void listNotebooks().then(setNotebooks)
  }, [])

  useEffect(() => {
    if (isNew) { setLoaded(true); return }
    void getNote(id).then((n) => {
      if (!n) { navigate('/notes'); return }
      setTitle(n.title)
      setContent(n.content)
      setActivityId(n.activity_id ?? '')
      setNotebook(n.notebook ?? '')
      setCreatedAt(n.created_at)
      setLoaded(true)
    })
  }, [id, isNew, navigate])

  const save = async () => {
    if (!title.trim()) return
    if (isNew) {
      const note = await createNote({
        title: title.trim(),
        content,
        activity_id: activityId || null,
        notebook: notebook || null,
      })
      navigate(`/notes/${note.id}`, { replace: true })
    } else {
      await updateNote(id, { title: title.trim(), content, activity_id: activityId || null, notebook: notebook || null })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return }
    await deleteNote(id)
    navigate('/notes')
  }

  if (!loaded) return null

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-3">
        <div className="flex items-center gap-2">
          <Link to="/notes" className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft size={16} /> Notes
          </Link>
          <span className="text-text-muted/40">/</span>
          <span className="text-sm text-text-secondary truncate max-w-48">{title || 'Untitled'}</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-success"
            >
              Saved
            </motion.span>
          )}
          {!isNew && (
            <button
              onClick={handleDelete}
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                confirmDelete ? 'bg-error/20 text-error' : 'text-text-muted hover:bg-bg-hover hover:text-text-primary',
              )}
              title={confirmDelete ? 'Click again to confirm' : 'Delete'}
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={save}
            className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-1.5 text-sm font-medium text-text-inverse hover:opacity-90"
          >
            <Save size={14} />
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="border-b border-border-subtle px-6 py-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full bg-transparent text-2xl font-semibold text-text-primary outline-none placeholder:text-text-muted/30"
          autoFocus={isNew}
        />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 border-b border-border-subtle px-6 py-2">
        <div className="flex items-center gap-1.5">
          <Link2 size={12} className="text-text-muted" />
          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="bg-transparent text-xs text-text-secondary outline-none"
          >
            <option value="">No activity</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen size={12} className="text-text-muted" />
          <input
            value={notebook}
            onChange={(e) => setNotebook(e.target.value)}
            placeholder="Notebook..."
            list="notebooks"
            className="w-24 bg-transparent text-xs text-text-secondary outline-none placeholder:text-text-muted/40"
          />
          <datalist id="notebooks">
            {notebooks.map((nb) => <option key={nb} value={nb} />)}
          </datalist>
        </div>
        <span className="ml-auto text-[10px] text-text-muted">
          Created {new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="h-full w-full resize-none bg-transparent text-sm leading-relaxed text-text-primary outline-none placeholder:text-text-muted/30"
        />
      </div>
    </div>
  )
}
