import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Bell, User, Zap } from 'lucide-react'
import { totalXp, currentLevel } from '../../core/db/xp'
import { subscribeVersion } from '../hooks/versionBus'

/** Right rail per UI-UX-SPEC §2.3 — contextual content. */
export function RightRail() {
  const [xp, setXp] = useState(0)

  useEffect(() => {
    let mounted = true
    totalXp().then((v) => { if (mounted) setXp(v) })
    const unsub = subscribeVersion(() => totalXp().then((v) => { if (mounted) setXp(v) }))
    return () => { mounted = false; unsub() }
  }, [])

  const { level, progress } = currentLevel(xp)

  return (
    <aside className="hidden w-[320px] flex-col gap-3 border-l border-border-subtle bg-bg-secondary p-4 lg:flex">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">Quick Add</h3>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors duration-(--duration-fast) hover:bg-bg-hover hover:text-text-primary" aria-label="Notifications (M4)">
          <Bell size={14} />
        </button>
      </div>

      <div className="rounded-lg border border-border-subtle bg-bg-tertiary p-3">
        <div className="grid grid-cols-2 gap-2">
          {['Task', 'Habit', 'Journal', 'Workout'].map((kind) => (
            <button
              key={kind}
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-md border border-border-subtle bg-bg-secondary px-2 py-1.5 text-xs text-text-muted opacity-60"
            >
              <Plus size={12} />
              {kind}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-text-muted">Enabled in M2+</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2">
        <span className="text-xs text-text-secondary">Level</span>
        <div className="flex items-center gap-1.5">
          <Zap size={11} className="text-xp-gold" />
          <span className="rounded-full bg-bg-active px-2 py-0.5 text-xs font-semibold text-xp-gold">
            Lvl {level}
          </span>
          <span className="text-xs text-text-muted">{xp} XP</span>
        </div>
      </div>
      <div className="h-1 rounded-full bg-bg-active overflow-hidden">
        <div className="h-full rounded-full bg-xp-gold transition-all" style={{ width: `${progress * 100}%` }} />
      </div>

        <Link to="/profile" className="mt-auto flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-tertiary p-2 transition-colors hover:bg-bg-hover">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-active">
            <User size={14} className="text-text-secondary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-text-secondary">Profile</p>
            <p className="text-[10px] text-text-muted">Local · offline</p>
          </div>
        </Link>
    </aside>
  )
}
