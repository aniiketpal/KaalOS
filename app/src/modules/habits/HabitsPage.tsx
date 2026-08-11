import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Flame, TrendingUp, Trash2 } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { useHabits, createHabit, deleteHabit, checkHabit, slipHabit, unlogHabit } from './queries'
import { clsx } from 'clsx'
import type { HabitWithToday } from './types'

const HABIT_COLORS = [
  { key: 'blue',   label: 'Copper',  hex: '#c45a28' },
  { key: 'green',  label: 'Sage',    hex: '#4a9e6e' },
  { key: 'amber',  label: 'Gold',    hex: '#d4a03a' },
  { key: 'purple', label: 'Plum',    hex: '#8a6a9e' },
  { key: 'rose',   label: 'Rose',    hex: '#c45a5a' },
  { key: 'teal',   label: 'Teal',    hex: '#3a8a7a' },
]

export function HabitsPage() {
  const { habits, loading } = useHabits()
  const [adding, setAdding] = useState(false)

  const goodHabits = habits.filter((h) => h.type === 'good')
  const badHabits = habits.filter((h) => h.type === 'bad')

  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle={`${goodHabits.length} good · ${badHabits.length} bad`}
        actions={
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-2 text-sm font-medium text-text-inverse hover:opacity-90"
          >
            <Plus size={14} /> Add habit
          </button>
        }
      />

      <div className="p-6">
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6"
            >
              <AddHabitForm onDone={() => setAdding(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <HabitSection title="Good habits" habits={goodHabits} loading={loading} icon={<Check size={14} />} />
        <div className="mt-8">
          <HabitSection title="Bad habits — slip counter" habits={badHabits} loading={loading} icon={<X size={14} />} />
        </div>
      </div>
    </div>
  )
}

function HabitSection({ title, habits, loading, icon }: {
  title: string
  habits: HabitWithToday[]
  loading: boolean
  icon: React.ReactNode
}) {
  if (loading && habits.length === 0) return null
  if (!loading && habits.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-text-muted">{icon}</span>
        <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">{title}</h2>
        <span className="text-xs text-text-muted">({habits.length})</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {habits.map((habit, i) => (
          <HabitCard key={habit.id} habit={habit} index={i} />
        ))}
      </div>
    </div>
  )
}

function HabitCard({ habit, index }: { habit: HabitWithToday; index: number }) {
  const color = HABIT_COLORS.find((c) => c.key === habit.color) ?? HABIT_COLORS[0]
  const isGood = habit.type === 'good'
  const done = habit.today_status === 'done'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className={clsx(
        'rounded-xl border bg-bg-secondary p-4 transition-all',
        done ? 'border-opacity-40' : 'border-border-subtle hover:bg-bg-hover',
      )}
      style={{ borderColor: done ? `${color.hex}60` : undefined }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
          <div>
            <p className="text-sm font-medium text-text-primary">{habit.name}</p>
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <Flame size={10} className="text-accent-amber" />
                {habit.current_streak} day streak
              </span>
              {habit.longest_streak > habit.current_streak && (
                <span className="flex items-center gap-1">
                  <TrendingUp size={10} />
                  best {habit.longest_streak}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => done ? unlogHabit(habit.id) : checkHabit(habit.id)}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
              done
                ? 'border-transparent text-text-inverse'
                : 'border-border-subtle text-text-muted hover:border-border-focus hover:text-text-primary',
            )}
            style={{ backgroundColor: done ? color.hex : undefined }}
            title={done ? 'Undo' : isGood ? 'Check in' : 'Mark slip-free'}
          >
            <Check size={15} />
          </button>
          {!isGood && (
            <button
              onClick={() => slipHabit(habit.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-error/30 text-error/70 transition-colors hover:bg-error/10 hover:text-error"
              title="Log slip"
            >
              <X size={15} />
            </button>
          )}
          <DeleteHabitButton id={habit.id} name={habit.name} />
        </div>
      </div>
    </motion.div>
  )
}

function DeleteHabitButton({ id, name }: { id: string; name: string }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <button
      onClick={() => {
        if (confirm) { void deleteHabit(id) } else { setConfirm(true); setTimeout(() => setConfirm(false), 3000) }
      }}
      className={clsx(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        confirm ? 'bg-error/20 text-error' : 'text-text-muted/40 hover:text-text-muted',
      )}
      title={confirm ? `Click again to delete "${name}"` : 'Delete'}
    >
      <Trash2 size={13} />
    </button>
  )
}

function AddHabitForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'good' | 'bad'>('good')
  const [color, setColor] = useState('blue')

  const save = async () => {
    if (!name.trim()) return
    await createHabit({ name: name.trim(), type, color })
    onDone()
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-tertiary p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        placeholder="Habit name — e.g. Meditate, No sugar..."
        className="mb-3 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted/40"
        autoFocus
      />
      <div className="mb-4 flex items-center gap-2">
        {(['good', 'bad'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={clsx(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              type === t ? 'bg-accent-blue text-text-inverse' : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover',
            )}
          >
            {t === 'good' ? 'Good habit' : 'Bad habit (slip counter)'}
          </button>
        ))}
      </div>
      <div className="mb-4 flex items-center gap-2">
        {HABIT_COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => setColor(c.key)}
            className={clsx('h-6 w-6 rounded-full transition-all', color === c.key && 'ring-2 ring-white/30 ring-offset-2 ring-offset-bg-tertiary')}
            style={{ backgroundColor: c.hex }}
            title={c.label}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="rounded-md px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover">Cancel</button>
        <button onClick={save} disabled={!name.trim()} className="rounded-md bg-accent-blue px-4 py-1.5 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-40">
          Add habit
        </button>
      </div>
    </div>
  )
}
