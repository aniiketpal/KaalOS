import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '../../shared/ui/PageHeader'
import { getDb } from '../../core/db/client'
import { subscribeVersion } from '../../shared/hooks/versionBus'
import { useActivities } from '../activities/queries'
import { Heatmap } from '../../shared/ui/Heatmap'
import { PerformanceChart, type ChartSeries } from '../../shared/ui/PerformanceChart'
import { weeklyPerActivity, monthlyByActivity, toMonthCSV, type WeekRow, type MonthRow } from '../../core/db/queries/progress'
import { currentStreak, longestStreak, type DailyLog } from '../../core/time/streaks'
import { ACCENT_COLORS } from '../activities/colors'
import { todayStr } from '../tasks/types'
import { xpHistory, type XpEvent } from '../../core/db/xp'
import { clsx } from 'clsx'
import { Download, ChevronLeft, ChevronRight, Zap } from 'lucide-react'

type Tab = 'heatmap' | 'weekly' | 'monthly' | 'streaks' | 'review'
const TABS: { key: Tab; label: string }[] = [
  { key: 'heatmap', label: 'Heatmap' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'streaks', label: 'Streaks' },
  { key: 'review', label: 'Review' },
]

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function firstOfMonth(offset = 0): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().slice(0, 10)
}
function nextMonthStart(monthStart: string): string {
  const d = new Date(monthStart + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}
function weekStartOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const delta = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - delta)
  return d.toISOString().slice(0, 10)
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ProgressPage() {
  const activities = useActivities()
  const [tab, setTab] = useState<Tab>('heatmap')
  const [activityId, setActivityId] = useState<string>('')
  const [weekAnchor, setWeekAnchor] = useState<string>(weekStartOf(todayStr()))
  const [monthAnchor, setMonthAnchor] = useState<string>(firstOfMonth())

  useEffect(() => { if (!activityId && activities.length) setActivityId(activities[0]!.id) }, [activities, activityId])

  const [heatmapData, setHeatmapData] = useState<Map<string, { minutes: number; target: number }>>(new Map())
  const [weekRows, setWeekRows] = useState<WeekRow[]>([])
  const [monthRows, setMonthRows] = useState<MonthRow[]>([])
  const [streaks, setStreaks] = useState<{ activity_id: string; name: string; current: number; longest: number }[]>([])
  const [totalPomodoros, setTotalPomodoros] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [weekXp, setWeekXp] = useState<XpEvent[]>([])

  const load = async () => {
    const db = await getDb()
    const today = todayStr()

    // All focus sessions grouped by day
    const all = await db.all<{ activity_id: string; d: string; m: number }>(
      `SELECT activity_id, date(started_at/1000,'unixepoch','localtime') AS d, SUM(actual_minutes) AS m
       FROM focus_sessions GROUP BY activity_id, d`,
    )
    const map = new Map<string, { minutes: number; target: number }>()
    const perActivity: Record<string, DailyLog> = {}
    let totalMin = 0
    let totalPom = 0
    for (const r of all) {
      const act = activities.find((a) => a.id === r.activity_id)
      if (!act) continue
      const prev = map.get(r.d)
      map.set(r.d, {
        minutes: (prev?.minutes ?? 0) + r.m,
        target: act.daily_target,
      })
      perActivity[r.activity_id] ??= new Map()
      const prevAct = perActivity[r.activity_id]!.get(r.d) ?? 0
      perActivity[r.activity_id]!.set(r.d, prevAct + r.m)
      totalMin += r.m
      totalPom += Math.round(r.m / 25)
    }
    setHeatmapData(map)
    setTotalMinutes(totalMin)
    setTotalPomodoros(totalPom)

    const wr = await weeklyPerActivity(db, weekAnchor, addDays(weekAnchor, 7))
    setWeekRows(wr)

    const mr = await monthlyByActivity(db, monthAnchor, nextMonthStart(monthAnchor))
    setMonthRows(mr)

    const streakRows = await Promise.all(activities.map(async (a) => ({
      activity_id: a.id,
      name: a.name,
      current: currentStreak(perActivity[a.id] ?? new Map(), today, a.daily_target),
      longest: longestStreak(perActivity[a.id] ?? new Map(), today, a.daily_target),
    })))
    setStreaks(streakRows.sort((x, y) => y.current - x.current))
    setBestStreak(Math.max(0, ...streakRows.map((s) => s.current)))

    // Load XP for review tab
    const weekStartMs = new Date(weekStartOf(today)).getTime()
    const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000
    const hist = await xpHistory(50)
    setWeekXp(hist.filter((e) => e.created_at >= weekStartMs && e.created_at < weekEndMs))
  }

  useEffect(() => {
    load()
    const unsub = subscribeVersion(load)
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, weekAnchor, monthAnchor])

  // Build chart data for the selected week
  const chartSeries = useMemo<ChartSeries[]>(() => {
    if (weekRows.length === 0) return []
    return weekRows.map((r) => ({
      label: r.activity_name,
      color: ACCENT_COLORS.find((c) => c.key === r.color)?.var?.replace('var(', '').replace(')', '') ?? '#c45a28',
      data: [0, 0, 0, 0, 0, 0, 0], // placeholder — real data needs daily breakdown
    }))
  }, [weekRows])

  const chartLabels = DAY_NAMES

  const exportCSV = () => {
    const csv = toMonthCSV(monthRows, monthAnchor.slice(0, 7))
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `progress_${monthAnchor.slice(0, 7)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Progress"
        subtitle="Heatmaps, streaks, weekly / monthly"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none"
            >
              {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'relative rounded-md px-3 py-1.5 text-sm transition-colors',
              tab === t.key ? 'text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
            )}
          >
            {t.label}
            {tab === t.key && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute -bottom-[1px] left-2 right-2 h-0.5 rounded-full bg-accent-blue"
              />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'heatmap' && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <Heatmap
              data={heatmapData}
              totalPomodoros={totalPomodoros}
              totalHours={Math.round(totalMinutes / 60)}
              currentStreak={bestStreak}
            />
          </motion.section>
        )}

        {tab === 'weekly' && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="mb-4 flex items-center gap-2">
              <button onClick={() => setWeekAnchor(addDays(weekAnchor, -7))} className="rounded-md border border-border-subtle bg-bg-tertiary p-2 text-text-secondary hover:bg-bg-hover">
                <ChevronLeft size={14} />
              </button>
              <p className="text-sm text-text-secondary">Week of {weekAnchor}</p>
              <button onClick={() => setWeekAnchor(addDays(weekAnchor, 7))} className="rounded-md border border-border-subtle bg-bg-tertiary p-2 text-text-secondary hover:bg-bg-hover">
                <ChevronRight size={14} />
              </button>
            </div>

            {chartSeries.length > 0 ? (
              <PerformanceChart
                series={chartSeries}
                labels={chartLabels}
                title="Weekly Performance"
                subtitle={`${weekRows.length} activit${weekRows.length === 1 ? 'y' : 'ies'} tracked this week`}
              />
            ) : (
              <div className="rounded-xl border border-border-subtle bg-bg-secondary p-8 text-center">
                <p className="text-sm text-text-muted">No focus data this week. Start a session to see your chart.</p>
              </div>
            )}

            {/* Weekly detail table */}
            <div className="mt-4 space-y-2 rounded-xl border border-border-subtle bg-bg-secondary p-5">
              {weekRows.map((r) => {
                const pct = r.target_minutes > 0 ? Math.round((100 * r.minutes) / r.target_minutes) : 0
                return (
                  <div key={r.activity_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">{r.activity_name}</span>
                      <span className="text-text-muted">{r.minutes} / {r.target_minutes} min ({pct}%)</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, pct)}%` }}
                        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ backgroundColor: ACCENT_COLORS.find((c) => c.key === r.color)?.var ?? 'var(--accent-blue)' }}
                      />
                      <div className="absolute inset-y-0 right-0 w-px border-r border-dashed border-text-muted/60" />
                    </div>
                  </div>
                )
              })}
              {weekRows.length === 0 && <p className="py-6 text-center text-sm text-text-muted">No data this week.</p>}
            </div>
          </motion.section>
        )}

        {tab === 'monthly' && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="mb-4 flex items-center gap-2">
              <button onClick={() => setMonthAnchor(firstOfMonth(-1))} className="rounded-md border border-border-subtle bg-bg-tertiary p-2 text-text-secondary hover:bg-bg-hover">
                <ChevronLeft size={14} />
              </button>
              <p className="text-sm text-text-secondary">{monthAnchor.slice(0, 7)}</p>
              <button onClick={() => setMonthAnchor(firstOfMonth(0))} className="rounded-md border border-border-subtle bg-bg-tertiary p-2 text-text-secondary hover:bg-bg-hover">
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-muted border-b border-border-subtle">
                    <th className="pb-2 font-medium">Activity</th>
                    <th className="pb-2 font-medium">Minutes</th>
                    <th className="pb-2 font-medium">Target</th>
                    <th className="pb-2 font-medium">% met</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((r) => (
                    <tr key={r.activity_name} className="border-b border-border-subtle/60 last:border-0">
                      <td className="py-2.5 text-text-primary">{r.activity_name}</td>
                      <td className="py-2.5 tabular-nums text-text-secondary">{Math.round(r.total_minutes)}</td>
                      <td className="py-2.5 tabular-nums text-text-secondary">{r.target_minutes}</td>
                      <td className="py-2.5 tabular-nums text-text-secondary">{Math.round(r.pct)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {monthRows.length === 0 && <p className="py-6 text-center text-sm text-text-muted">No data this month.</p>}
            </div>
          </motion.section>
        )}

        {tab === 'review' && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
                <Zap size={14} className="text-xp-gold" /> Weekly XP Review
              </h3>
              <p className="mb-4 text-sm text-text-muted">Week of {weekAnchor} · {weekXp.reduce((s, e) => s + e.points, 0)} XP earned</p>
              <div className="space-y-2">
                {(['task', 'habit', 'journal', 'focus', 'workout', 'streak_bonus'] as const).map((src) => {
                  const events = weekXp.filter((e) => e.source_type === src)
                  const pts = events.reduce((s, e) => s + e.points, 0)
                  if (pts === 0) return null
                  const label = src === 'task' ? 'Tasks' : src === 'habit' ? 'Habits' : src === 'journal' ? 'Journal' : src === 'focus' ? 'Focus' : src === 'workout' ? 'Workouts' : 'Streak bonuses'
                  return (
                    <div key={src} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{label}</span>
                      <span className="font-medium text-xp-gold">+{pts} XP</span>
                    </div>
                  )
                })}
                {weekXp.length === 0 && <p className="py-4 text-center text-sm text-text-muted">No XP earned this week yet.</p>}
              </div>
            </div>
          </motion.section>
        )}
        {tab === 'streaks' && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {streaks.map((s) => (
                <div key={s.activity_id} className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wide font-medium">{s.name}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <motion.span
                      key={s.current}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                      className="text-3xl font-semibold tabular-nums text-text-primary"
                    >
                      {s.current}
                    </motion.span>
                    <span className="text-xs text-text-muted">day streak</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">longest: {s.longest}</p>
                </div>
              ))}
              {streaks.length === 0 && <p className="text-sm text-text-muted">No activity streaks yet.</p>}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
