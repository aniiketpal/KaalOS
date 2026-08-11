import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAV_ITEMS } from '../nav/nav-items'
import { clsx } from 'clsx'
import { useActivities } from '../../modules/activities/queries'

const COLOR_MAP: Record<string, string> = {
  blue: 'var(--accent-blue)',
  green: 'var(--accent-green)',
  amber: 'var(--accent-amber)',
  purple: 'var(--accent-purple)',
  rose: 'var(--accent-rose)',
  teal: 'var(--accent-teal)',
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-border-subtle bg-bg-secondary px-3 py-4">
      <div className="mb-4 px-2">
        <h2 className="text-lg font-semibold text-text-primary">KaalOS</h2>
        <p className="text-xs text-text-muted">
          Today ·{' '}
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isPhase1 = item.phase === 1
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-disabled={!isPhase1}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  // 150ms ease-out-expo hover — durations/easings come from tokens
                  'duration-(--duration-fast) ease-(--ease-out-expo)',
                  isPhase1
                    ? 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    : 'pointer-events-none text-text-muted/50',
                  isActive && 'text-text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-blue"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={20} strokeWidth={2} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && !isPhase1 && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted/60">
                      soon
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Activity filter slot — collapsible per UI-UX-SPEC §2.2, acts as quick filter later */}
      <div className="mt-4 border-t border-border-subtle pt-3">
        <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-wide text-text-muted">
          Activities
        </p>
        <ActivityNavList />
      </div>

      <NavLink
        to="/settings/activities"
        className={({ isActive }) =>
          clsx(
            'mt-3 flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors hover:bg-bg-hover',
            isActive ? 'text-text-primary' : 'text-text-muted',
          )
        }
      >
        Manage activities
      </NavLink>
    </aside>
  )
}

function ActivityNavList() {
  const activities = useActivities()
  if (!activities || activities.length === 0) {
    return (
      <p className="px-3 pb-2 text-[11px] text-text-muted/70">
        No activities yet — create via Manage activities.
      </p>
    )
  }
  return (
    <ul className="mb-2 space-y-0.5 px-1">
      {activities.map((a) => (
        <li
          key={a.id}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
          title={a.name}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: COLOR_MAP[a.color] ?? a.color }}
          />
          <span className="truncate">{a.name}</span>
          <span className="ml-auto text-[10px] text-text-muted">
            {a.target_type === 'time' ? `${a.daily_target}m` : `${a.daily_target}x`}
          </span>
        </li>
      ))}
    </ul>
  )
}
