import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CheckSquare, Timer, Flame, Sparkles, Repeat, BookOpen, PenLine, Zap } from 'lucide-react'
import { getDb } from '../../core/db/client'
import { subscribeVersion } from '../../shared/hooks/versionBus'
import { totalXp, currentLevel } from '../../core/db/xp'
import { useTasks } from '../tasks/queries'
import { todayStr } from '../tasks/types'
import { useActivities } from '../activities/queries'
import { useHabits, checkHabit, unlogHabit } from '../habits/queries'
import { Heatmap } from '../../shared/ui/Heatmap'
import { TimerRing } from '../focus/TimerRing'
import { randomPrompt } from '../journal/prompts'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface MiniCardProps { title: string; icon: React.ReactNode; children: React.ReactNode }
function Card({ title, icon, children }: MiniCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
      className="rounded-xl border border-border-subtle bg-bg-secondary p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-text-primary">{icon}{title}</h3>
      </div>
      {children}
    </motion.section>
  )
}

export function DashboardPage() {
  const tasks = useTasks()
  const activities = useActivities()
  const { habits } = useHabits()
  const [name, setName] = useState<string>('friend')
  const [heatmapData, setHeatmapData] = useState<Map<string, { minutes: number; target: number }>>(new Map())
  const [streaks, setStreaks] = useState<{ id: string; name: string; current: number }[]>([])
  const [journalPrompt] = useState(() => randomPrompt())
  const [xp, setXp] = useState(0)

  useEffect(() => {
    let mounted = true
    totalXp().then((v) => { if (mounted) setXp(v) })
    const unsub = subscribeVersion(() => totalXp().then((v) => { if (mounted) setXp(v) }))
    return () => { mounted = false; unsub() }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('lt_display_name')
    if (saved) setName(saved)
  }, [])

  const today = todayStr()
  const todaysPending = useMemo(
    () => tasks.filter((t) => t.status === 'pending' && (t.due_date === null || t.due_date === today)).slice(0, 5),
    [tasks, today],
  )
  const todaysCount = useMemo(() => tasks.filter((t) => t.status === 'pending' && (t.due_date === null || t.due_date === today)).length, [tasks, today])

  const loadAggregates = async () => {
    const db = await getDb()
    const rows = await db.all<{ activity_id: string; d: string; m: number }>(
      `SELECT activity_id, date(started_at/1000,'unixepoch','localtime') AS d, SUM(actual_minutes) AS m
       FROM focus_sessions GROUP BY activity_id, d`,
    )
    const map = new Map<string, { minutes: number; target: number }>()
    for (const r of rows) {
      const a = activities.find((x) => x.id === r.activity_id)
      if (!a) continue
      map.set(r.d, { minutes: r.m, target: a.daily_target })
    }
    setHeatmapData(map)

    const per: Record<string, Map<string, number>> = {}
    for (const r of rows) {
      per[r.activity_id] ??= new Map()
      per[r.activity_id]!.set(r.d, r.m)
    }
    const { currentStreak } = await import('../../core/time/streaks')
    const s = activities.map((a) => ({
      id: a.id, name: a.name,
      current: currentStreak(per[a.id] ?? new Map(), today, a.daily_target),
    }))
    setStreaks(s.filter((x) => x.current > 0).sort((a, b) => b.current - a.current).slice(0, 4))
  }

  useEffect(() => {
    loadAggregates()
    const unsub = subscribeVersion(loadAggregates)
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, today])

  const topActivity = useMemo(() => {
    return activities.reduce((best, a) => {
      return (best === null || a.daily_target > best.daily_target) ? a : best
    }, activities[0] ?? null)
  }, [activities])

  const dueHabits = useMemo(() => habits.filter((h) => h.type === 'good' && h.today_status === null), [habits])
  const checkedHabits = useMemo(() => habits.filter((h) => h.type === 'good' && h.today_status === 'done'), [habits])

  return (
    <div className="p-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {greeting()}, {name}
          </h1>
          <p className="text-sm text-text-muted">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · {todaysCount} task{todaysCount === 1 ? '' : 's'} due
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-bg-tertiary px-3 py-1 border border-border-subtle">
            <Zap size={11} className="text-xp-gold" />
            <span className="text-xs font-semibold text-xp-gold">Lvl {currentLevel(xp).level}</span>
            <span className="text-xs text-text-muted">{xp} XP</span>
          </span>
          <Link to="/settings/activities" className="rounded-md border border-border-subtle bg-bg-tertiary px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary">
            Manage activities
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Today's tasks" icon={<CheckSquare size={15} className="text-accent-blue" />}>
          <ul className="space-y-1.5">
            {todaysPending.length === 0 && (
              <li className="rounded-lg border border-dashed border-border-subtle p-4 text-center text-sm text-text-muted">
                Nothing due yet — add a task.
              </li>
            )}
            {todaysPending.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-md bg-bg-tertiary px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
                <span className="flex-1 truncate text-sm text-text-primary">{t.title}</span>
                {t.activity?.name && <span className="text-[10px] text-text-muted">{t.activity.name}</span>}
              </li>
            ))}
          </ul>
          <Link to="/tasks" className="mt-3 inline-flex text-xs text-accent-blue hover:underline">
            View all →
          </Link>
        </Card>

        <Card title="Start focus" icon={<Timer size={15} className="text-accent-teal" />}>
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24">
              <TimerRing progress={0} size={96} strokeWidth={6} color="#c45a28" />
              <div className="absolute inset-0 grid place-items-center font-mono text-xl font-semibold tabular-nums text-text-primary">
                25:00
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted">Pick an activity and duration, then start a Pomodoro.</p>
              <Link
                to="/focus"
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-accent-blue px-3 py-2 text-xs font-medium text-text-inverse hover:opacity-90"
              >
                <Timer size={12} />
                Open focus
              </Link>
            </div>
          </div>
        </Card>

        <Card title="Active streaks" icon={<Flame size={15} className="text-accent-amber" />}>
          {streaks.length === 0 ? (
            <p className="text-sm text-text-muted">No streaks yet — start with any focus session.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {streaks.map((s) => (
                <div key={s.id} className="rounded-lg bg-bg-tertiary px-3 py-2.5">
                  <p className="truncate text-xs text-text-secondary">{s.name}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-text-primary">{s.current} days</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={topActivity ? `${topActivity.name} heatmap` : 'Activity heatmap'} icon={<Sparkles size={15} className="text-accent-purple" />}>
          {topActivity ? (
            <div className="overflow-auto rounded-lg bg-bg-tertiary p-3">
              <Heatmap data={heatmapData} compact cellSize={12} />
            </div>
          ) : (
            <p className="text-sm text-text-muted">Create an activity to see your heatmap.</p>
          )}
        </Card>
      </div>

      {/* Phase 2 widgets row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={`Habits due (${dueHabits.length})`} icon={<Repeat size={15} className="text-accent-teal" />}>
          {dueHabits.length === 0 && checkedHabits.length === 0 ? (
            <p className="text-sm text-text-muted">No good habits yet. <Link to="/habits" className="text-accent-blue hover:underline">Add one</Link></p>
          ) : dueHabits.length === 0 ? (
            <p className="text-sm text-success">All done today!</p>
          ) : (
            <ul className="space-y-2">
              {dueHabits.map((h) => (
                <li key={h.id} className="flex items-center gap-2">
                  <button
                    onClick={() => void checkHabit(h.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:border-accent-teal hover:text-accent-teal transition-colors"
                  >
                    <CheckSquare size={12} />
                  </button>
                  <span className="text-sm text-text-primary">{h.name}</span>
                  <span className="ml-auto text-[10px] text-text-muted">{h.current_streak}d streak</span>
                </li>
              ))}
              {checkedHabits.map((h) => (
                <li key={h.id} className="flex items-center gap-2 opacity-50">
                  <button
                    onClick={() => void unlogHabit(h.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-teal text-text-inverse"
                  >
                    <CheckSquare size={12} />
                  </button>
                  <span className="text-sm text-text-muted line-through">{h.name}</span>
                </li>
              ))}
            </ul>
          )}
          {(dueHabits.length > 0 || checkedHabits.length > 0) && (
            <Link to="/habits" className="mt-3 inline-flex text-xs text-accent-blue hover:underline">View all →</Link>
          )}
        </Card>

        <Card title="Today's journal prompt" icon={<BookOpen size={15} className="text-accent-amber" />}>
          <p className="text-sm italic text-text-secondary leading-relaxed">{journalPrompt}</p>
          <Link
            to="/journal"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-1.5 text-xs font-medium text-text-inverse hover:opacity-90"
          >
            <PenLine size={12} /> Write now
          </Link>
        </Card>
      </div>
    </div>
  )
}
