import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, LogIn, RotateCcw, SkipForward, RotateCw } from 'lucide-react'
import { useFocusStore, restoreActiveSession } from './focusStore'
import { TimerRing } from './TimerRing'
import { ManualLogModal } from './ManualLogModal'
import { useActivities } from '../activities/queries'
import { useTasks } from '../tasks/queries'
import { requestNotificationPermission } from '../../core/notify/notify'
import { bumpVersion } from '../../shared/hooks/versionBus'
import { ACCENT_COLORS } from '../activities/colors'
import { clsx } from 'clsx'

const COLOR_BY_KEY: Record<string, string> = Object.fromEntries(
  ACCENT_COLORS.map((c) => [c.key, c.var]),
)

const DURATIONS = [
  { label: '25 / 5', minutes: 25 },
  { label: '50 / 10', minutes: 50 },
  { label: '90 / 15', minutes: 90 },
]

export function FocusPage() {
  const active = useFocusStore((s) => s.active)
  const onBreak = useFocusStore((s) => s.onBreak)
  const activities = useActivities()
  const tasks = useTasks()

  const [activityId, setActivityId] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')
  const [duration, setDuration] = useState<number>(25)
  const [customDuration, setCustomDuration] = useState<string>('')
  const [manualOpen, setManualOpen] = useState(false)

  useEffect(() => { restoreActiveSession() }, [])

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => useFocusStore.getState().tick(), 250)
    return () => clearInterval(id)
  }, [active])

  useEffect(() => { void requestNotificationPermission() }, [])

  const activityOptions = useMemo(
    () => activities.map((a) => ({ id: a.id, name: a.name, color: a.color })),
    [activities],
  )
  const taskOptions = useMemo(
    () => tasks.filter((t) => t.activity_id === activityId && t.status === 'pending'),
    [tasks, activityId],
  )
  const selectedActivity = activities.find((x) => x.id === activityId)
  const selectedColor =
    selectedActivity
      ? (COLOR_BY_KEY[selectedActivity.color] ?? 'var(--accent-blue)')
      : 'var(--accent-blue)'

  const secondsRemaining = active
    ? Math.max(0, Math.round(useFocusStore.getState().active?.lastTickSecond ?? 0))
    : 0
  const mm = Math.floor(secondsRemaining / 60)
  const ss = String(secondsRemaining % 60).padStart(2, '0')

  const isComplete = active && secondsRemaining === 0 && !onBreak
  const progress = active
    ? (active.session.plannedMinutes * 60 - secondsRemaining) / (active.session.plannedMinutes * 60)
    : 0

  const onStart = async () => {
    const a = activities.find((x) => x.id === activityId)
    if (!a) return
    const minutes = customDuration ? Number(customDuration) : duration
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 90) return
    const task = taskId ? tasks.find((t) => t.id === taskId) : null
    await useFocusStore.getState().start({
      activityId: a.id,
      activityName: a.name,
      taskId: task?.id ?? null,
      taskTitle: task?.title ?? null,
      plannedMinutes: minutes,
    })
    bumpVersion()
  }

  const totalCycles = active ? active.cycles.length : 0
  const currentCycle = active ? active.cycleIndex + 1 : 0

  return (
    <div className="flex h-full flex-col items-center overflow-auto px-6 py-8">
      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            className="flex w-full max-w-md flex-col items-center"
          >
            {/* Activity badge */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${selectedColor}18`,
                color: onBreak ? 'var(--accent-teal)' : selectedColor,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
              {onBreak ? 'Break' : active.activityName}
            </span>
            {active.taskTitle && (
              <p className="mt-1.5 text-sm text-text-muted">{active.taskTitle}</p>
            )}

            {/* Timer ring + time */}
            <div className="relative mt-8 grid place-items-center">
              <TimerRing
                progress={onBreak ? 1 - progress : progress}
                size={320}
                strokeWidth={10}
                color={onBreak ? '#3a8a7a' : (selectedColor === 'var(--accent-blue)' ? '#c45a28' : '#c45a28')}
              />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="font-mono text-7xl font-bold tabular-nums tracking-tight text-white">
                    {mm}<span className="text-white/40">:</span>{ss}
                  </div>
                </div>
              </div>
            </div>

            {/* Cycle dots */}
            {totalCycles > 1 && (
              <div className="mt-6 flex items-center gap-2">
                {Array.from({ length: totalCycles }, (_, i) => (
                  <span
                    key={i}
                    className={clsx(
                      'h-2 w-2 rounded-full transition-colors',
                      i < currentCycle
                        ? 'bg-[#c45a28]'
                        : i === currentCycle
                          ? 'bg-[#c45a28]/60'
                          : 'bg-white/15',
                    )}
                  />
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="mt-8 flex w-full max-w-sm items-center gap-3">
              {/* Reset */}
              <button
                onClick={() => useFocusStore.getState().stop()}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
                title="Reset"
              >
                <RotateCcw size={18} />
              </button>

              {/* Main action button */}
              {!onBreak ? (
                active.session.pausedAt ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => useFocusStore.getState().resume()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c45a28] to-[#d46a3a] py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-[#c45a28]/25"
                  >
                    <Play size={16} fill="currentColor" />
                    Resume
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => useFocusStore.getState().pause()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c45a28] to-[#d46a3a] py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-[#c45a28]/25"
                  >
                    <Pause size={16} fill="currentColor" />
                    Pause
                  </motion.button>
                )
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => useFocusStore.getState().nextCycle()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3a8a7a] to-[#4a9e8a] py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-[#3a8a7a]/25"
                >
                  <RotateCw size={16} />
                  Next cycle
                </motion.button>
              )}

              {/* Skip / forward */}
              <button
                onClick={() => useFocusStore.getState().stop()}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
                title="Skip"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Keyboard hints */}
            <div className="mt-4 flex items-center gap-3 text-[11px] text-text-muted/60">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">Space</kbd>
                Hold
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">R</kbd>
                Reset
              </span>
            </div>
          </motion.div>
        ) : (
          /* PICKER — idle state */
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* Timer preview ring */}
            <div className="mb-8 flex justify-center">
              <div className="relative grid place-items-center">
                <TimerRing
                  progress={0}
                  size={260}
                  strokeWidth={8}
                  color="#c45a28"
                />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="font-mono text-6xl font-bold tabular-nums tracking-tight text-white">
                      {duration < 10 ? `0${duration}` : duration}<span className="text-white/40">:</span>00
                    </div>
                    <p className="mt-2 text-xs text-text-muted">minutes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration selector */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.minutes}
                  type="button"
                  onClick={() => { setDuration(d.minutes); setCustomDuration('') }}
                  className={clsx(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    !customDuration && duration === d.minutes
                      ? 'bg-gradient-to-r from-[#c45a28] to-[#d46a3a] text-white shadow-md shadow-[#c45a28]/20'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10',
                  )}
                >
                  {d.label}
                </button>
              ))}
              <input
                type="number"
                min={5}
                max={90}
                placeholder="Min"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center text-sm text-text-primary outline-none focus:border-[#c45a28]/50 placeholder:text-text-muted/40"
              />
            </div>

            {/* Task pairing */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <h3 className="mb-3 text-lg font-medium text-white">Pair with a task</h3>

              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Activity (required)
              </label>
              <select
                value={activityId}
                onChange={(e) => { setActivityId(e.target.value); setTaskId('') }}
                className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none focus:border-[#c45a28]/50"
              >
                <option value="">— pick activity —</option>
                {activityOptions.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              {taskOptions.length > 0 && (
                <>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-text-muted">
                    Task (optional)
                  </label>
                  <div className="mb-4 space-y-1.5 max-h-40 overflow-auto">
                    {taskOptions.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTaskId(taskId === t.id ? '' : t.id)}
                        className={clsx(
                          'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                          taskId === t.id
                            ? 'border-[#c45a28]/40 bg-[#c45a28]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10',
                        )}
                      >
                        <span className="flex-1 text-sm text-text-primary">{t.title}</span>
                        {taskId === t.id && (
                          <span className="h-2 w-2 rounded-full bg-[#c45a28]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Stats preview if activity selected */}
              {selectedActivity && (
                <div className="mb-4 flex items-center gap-6 rounded-xl bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{taskOptions.length}</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Tasks</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{duration}:00</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Next Burn</p>
                  </div>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!activityId}
                onClick={onStart}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c45a28] to-[#d46a3a] py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-[#c45a28]/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Start with this task
              </motion.button>

              <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-text-muted/60">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
                  Start
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">N</kbd>
                  New task
                </span>
              </div>
            </div>

            {/* Manual log + header actions */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setManualOpen(true)}
                className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
              >
                <LogIn size={14} />
                Log time manually
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isComplete && null}

      <ManualLogModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSaved={() => bumpVersion()}
      />
    </div>
  )
}
