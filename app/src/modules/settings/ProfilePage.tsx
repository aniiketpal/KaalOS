import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Flame, Timer, BookOpen, CheckSquare, Dumbbell } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { totalXp, currentLevel, xpHistory, type XpEvent } from '../../core/db/xp'
import { subscribeVersion } from '../../shared/hooks/versionBus'
import { getDb } from '../../core/db/client'
import { Heatmap } from '../../shared/ui/Heatmap'

const SOURCE_ICON: Record<string, typeof Zap> = {
  task: CheckSquare,
  habit: Flame,
  journal: BookOpen,
  focus: Timer,
  workout: Dumbbell,
  streak_bonus: Zap,
}

const SOURCE_LABEL: Record<string, string> = {
  task: 'Task completed',
  habit: 'Habit checked',
  journal: 'Journal entry',
  focus: 'Focus session',
  workout: 'Workout',
  streak_bonus: 'Streak bonus',
}

export function ProfilePage() {
  const [xp, setXp] = useState(0)
  const [history, setHistory] = useState<XpEvent[]>([])
  const [heatmapData, setHeatmapData] = useState<Map<string, { minutes: number; target: number }>>(new Map())

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const [xpVal, hist] = await Promise.all([totalXp(), xpHistory(20)])
      if (!mounted) return
      setXp(xpVal)
      setHistory(hist)
    }
    load()
    const unsub = subscribeVersion(() => { void load() })
    return () => { mounted = false; unsub() }
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const db = await getDb()
      const rows = await db.all<{ d: string; m: number }>(
        `SELECT date(started_at/1000,'unixepoch','localtime') AS d, SUM(actual_minutes) AS m
         FROM focus_sessions GROUP BY d`,
      )
      if (!mounted) return
      const map = new Map<string, { minutes: number; target: number }>()
      for (const r of rows) map.set(r.d, { minutes: r.m, target: 120 })
      setHeatmapData(map)
    }
    void load()
    const unsub = subscribeVersion(() => { void load() })
    return () => { mounted = false; unsub() }
  }, [])

  const { level, progress, nextLevelXp } = currentLevel(xp)
  const xpForCurrent = (level - 1) * (level - 1) * 100
  const xpInLevel = xp - xpForCurrent
  const xpNeeded = nextLevelXp - xpForCurrent

  // Character title based on level
  const title = level >= 20 ? 'Legend' : level >= 15 ? 'Master' : level >= 10 ? 'Adept' : level >= 5 ? 'Apprentice' : 'Novice'

  return (
    <div className="p-6">
      <PageHeader title="Profile" subtitle="Your stats at a glance" />

      {/* Character card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl border border-border-subtle bg-bg-secondary p-5"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-xp-gold/10 border border-xp-gold/20">
            <Zap size={24} className="text-xp-gold" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{title}</p>
            <p className="text-sm text-text-secondary">Level {level} · {xp.toLocaleString()} XP total</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>Level {level}</span>
            <span>{xpInLevel} / {xpNeeded} XP to level {level + 1}</span>
          </div>
          <div className="h-2 rounded-full bg-bg-active overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-xp-gold"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            />
          </div>
        </div>
      </motion.section>

      {/* Focus heatmap */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-xl border border-border-subtle bg-bg-secondary p-5"
      >
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
          <Timer size={14} className="text-accent-blue" /> Focus activity
        </h3>
        <Heatmap data={heatmapData} compact cellSize={12} />
      </motion.section>

      {/* Recent XP */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border-subtle bg-bg-secondary p-5"
      >
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
          <Zap size={14} className="text-xp-gold" /> Recent XP
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-text-muted">No XP earned yet. Complete tasks, habits, or focus sessions to start.</p>
        ) : (
          <ul className="space-y-1.5">
            {history.map((ev) => {
              const Icon = SOURCE_ICON[ev.source_type] ?? Zap
              const label = SOURCE_LABEL[ev.source_type] ?? ev.source_type
              return (
                <motion.li
                  key={ev.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm"
                >
                  <Icon size={14} className="text-text-muted shrink-0" />
                  <span className="flex-1 text-text-secondary">{label}</span>
                  <span className="text-xs font-medium text-xp-gold">+{ev.points}</span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(ev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </motion.li>
              )
            })}
          </ul>
        )}
      </motion.section>
    </div>
  )
}
