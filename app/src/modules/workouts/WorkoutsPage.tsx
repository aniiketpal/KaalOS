import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Dumbbell, Clock, Trash2, CheckCircle, X } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import {
  useExercises, usePastSessions, createExercise, startWorkout, endWorkout,
  logSet, listSessionSets, deleteSet, deleteExercise, saveBodyMetric,
} from './queries'
import { DEFAULT_EXERCISES, CATEGORIES } from './defaultExercises'
import { clsx } from 'clsx'
import type { Exercise, WorkoutSet } from './types'

type View = 'log' | 'history' | 'exercises'

export function WorkoutsPage() {
  const [view, setView] = useState<View>('log')
  const exercises = useExercises()
  const { sessions, loading } = usePastSessions()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const startSession = async () => {
    const s = await startWorkout()
    setActiveSessionId(s.id)
    setView('log')
  }

  return (
    <div>
      <PageHeader
        title="Workouts"
        subtitle={`${exercises.length} exercises · ${sessions.length} sessions logged`}
        actions={
          <div className="flex items-center gap-2">
            <BodyMetricsButton />
            <button
              onClick={startSession}
              className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-2 text-sm font-medium text-text-inverse hover:opacity-90"
            >
              <Plus size={14} /> Start workout
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4">
        {(['log', 'history', 'exercises'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
              view === v ? 'text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
            )}
          >
            {v}
            {view === v && (
              <motion.span layoutId="wt-tab" className="mt-1 block h-0.5 rounded-full bg-accent-blue" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {view === 'log' && (
          activeSessionId
            ? <ActiveSession sessionId={activeSessionId} exercises={exercises} onEnd={() => { void endWorkout(activeSessionId); setActiveSessionId(null) }} />
            : (
              <div className="flex flex-col items-center py-16 text-center">
                <Dumbbell size={32} className="mb-3 text-text-muted" />
                <p className="text-sm text-text-muted">No active workout.</p>
                <button onClick={startSession} className="mt-3 text-sm text-accent-blue hover:underline">Start one now</button>
              </div>
            )
        )}

        {view === 'history' && (
          <SessionHistory sessions={sessions} loading={loading} />
        )}

        {view === 'exercises' && (
          <ExerciseLibrary exercises={exercises} />
        )}
      </div>
    </div>
  )
}

// ─── Active session logger ────────────────────────────────────────────────
function ActiveSession({ sessionId, exercises, onEnd }: {
  sessionId: string
  exercises: Exercise[]
  onEnd: () => void
}) {
  const [selectedExercise, setSelectedExercise] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [elapsed, setElapsed] = useState(0)

  const refreshSets = async () => {
    const data = await listSessionSets(sessionId)
    setSets(data)
  }

  useEffect(() => { void refreshSets() }, [sessionId])

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const submitSet = async () => {
    if (!selectedExercise || !reps) return
    await logSet({ session_id: sessionId, exercise_id: selectedExercise, reps: Number(reps), weight_kg: Number(weight) || 0 })
    await refreshSets()
    setReps(''); setWeight('')
  }

  const mins = Math.floor(elapsed / 60)
  const secs = String(elapsed % 60).padStart(2, '0')

  // Group sets by exercise
  const grouped = sets.reduce<Record<string, WorkoutSet[]>>((acc, s) => {
    const key = s.exercise_name ?? s.exercise_id
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border-subtle bg-bg-secondary p-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-accent-blue" />
          <span className="text-sm text-text-secondary tabular-nums">{mins}:{secs}</span>
        </div>
        <button
          onClick={onEnd}
          className="flex items-center gap-1.5 rounded-md bg-success/20 px-3 py-1.5 text-sm text-success hover:bg-success/30"
        >
          <CheckCircle size={14} /> End workout
        </button>
      </div>

      {/* Log a set */}
      <div className="mb-6 rounded-xl border border-border-subtle bg-bg-secondary p-4">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Log a set</h3>
        <div className="grid grid-cols-[1fr_80px_80px_72px] gap-2">
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          >
            <option value="">Exercise...</option>
            {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input
            type="number" min={1} placeholder="Reps" value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          />
          <input
            type="number" min={0} step={0.5} placeholder="kg" value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          />
          <button
            onClick={submitSet}
            disabled={!selectedExercise || !reps}
            className="rounded-md bg-accent-blue px-2 py-2 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-40"
          >
            Log
          </button>
        </div>
      </div>

      {/* Sets logged this session */}
      {Object.entries(grouped).map(([name, sets]) => (
        <motion.div key={name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 rounded-xl border border-border-subtle bg-bg-secondary p-4">
          <p className="mb-2 text-sm font-medium text-text-primary">{name}</p>
          <div className="space-y-1">
            {sets.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="text-text-muted w-4">{i + 1}.</span>
                <span>{s.reps} reps</span>
                {s.weight_kg > 0 && <span className="text-text-muted">· {s.weight_kg} kg</span>}
                <button onClick={() => void deleteSet(s.id).then(refreshSets)} className="ml-auto text-text-muted/40 hover:text-error">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
      {sets.length === 0 && <p className="text-center text-sm text-text-muted py-6">No sets logged yet — pick an exercise above.</p>}
    </div>
  )
}

// ─── History ──────────────────────────────────────────────────────────────
function SessionHistory({ sessions, loading }: { sessions: { id: string; started_at: number; ended_at: number | null; note: string | null; set_count: number }[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-text-muted">Loading...</p>
  if (sessions.length === 0) return (
    <div className="flex flex-col items-center py-16 text-center">
      <Clock size={32} className="mb-3 text-text-muted" />
      <p className="text-sm text-text-muted">No sessions yet.</p>
    </div>
  )
  return (
    <div className="max-w-2xl space-y-2">
      {sessions.map((s, i) => {
        const duration = s.ended_at ? Math.round((s.ended_at - s.started_at) / 60000) : null
        return (
          <motion.div key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-secondary p-4">
            <Dumbbell size={16} className="text-accent-blue shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-text-primary">{new Date(s.started_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              {s.note && <p className="text-xs text-text-muted">{s.note}</p>}
            </div>
            <div className="text-right text-xs text-text-muted">
              <p>{s.set_count} set{s.set_count !== 1 ? 's' : ''}</p>
              {duration !== null && <p>{duration} min</p>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Exercise library ─────────────────────────────────────────────────────
function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')

  const add = async () => {
    if (!name.trim()) return
    await createExercise({ name: name.trim(), category: category || undefined })
    setName(''); setCategory('')
  }

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, e) => {
    const cat = e.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(e)
    return acc
  }, {})

  return (
    <div className="max-w-2xl">
      <div className="mb-6 rounded-xl border border-border-subtle bg-bg-secondary p-4">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Add custom exercise</h3>
        <div className="flex gap-2">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Exercise name..."
            className="flex-1 rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          />
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          >
            <option value="">Category...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={add} disabled={!name.trim()} className="rounded-md bg-accent-blue px-3 py-2 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-40">
            Add
          </button>
        </div>
      </div>

      {/* Seed default exercises if empty */}
      {exercises.length === 0 && (
        <div className="mb-4 rounded-xl border border-border-subtle bg-bg-tertiary p-4">
          <p className="mb-3 text-xs text-text-muted">No exercises yet. Quick start with defaults:</p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_EXERCISES.map((name) => (
              <button
                key={name}
                onClick={() => void createExercise({ name })}
                className="rounded-md border border-border-subtle px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">{cat}</h3>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {items.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2">
                <span className="text-sm text-text-primary">{e.name}</span>
                {e.is_custom === 1 && (
                  <button onClick={() => void deleteExercise(e.id)} className="text-text-muted/40 hover:text-error"><Trash2 size={12} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Body metrics popup ───────────────────────────────────────────────────
function BodyMetricsButton() {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')

  const save = async () => {
    await saveBodyMetric(height ? Number(height) : undefined, weight ? Number(weight) : undefined)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
      >
        Body metrics
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            <motion.div
              initial={{ scale: 0.96 }} animate={{ scale: 1 }}
              className="w-full max-w-xs rounded-xl border border-border-subtle bg-bg-secondary p-5 shadow-xl"
            >
              <h3 className="mb-4 text-sm font-medium text-text-primary">Body metrics</h3>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Height (cm)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Weight (kg)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover">Cancel</button>
                <button onClick={save} className="rounded-md bg-accent-blue px-4 py-2 text-sm font-medium text-text-inverse">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
