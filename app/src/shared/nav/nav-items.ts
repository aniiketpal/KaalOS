import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  BarChart3,
  FileText,
  BookOpen,
  Repeat,
  Dumbbell,
  Rss,
  GitBranch,
  Settings,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: string
  phase: 1 | 2
}

/** Nav per UI-UX-SPEC §2.2 — all 10 items render in the sidebar, but
 *  Phase 2 routes are disabled (dimmed, not the focus) until their milestone. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, phase: 1 },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare, badge: 'Today', phase: 1 },
  { to: '/focus', label: 'Focus', icon: Timer, phase: 1 },
  { to: '/progress', label: 'Progress', icon: BarChart3, phase: 1 },
  { to: '/notes', label: 'Notes', icon: FileText, phase: 1 },
  { to: '/journal', label: 'Journal', icon: BookOpen, badge: 'Streak', phase: 1 },
  { to: '/habits', label: 'Habits', icon: Repeat, badge: 'Due', phase: 1 },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell, phase: 1 },
  { to: '/feed', label: 'Feed', icon: Rss, badge: 'Unread', phase: 1 },
  { to: '/graph', label: 'Graph', icon: GitBranch, phase: 1 },
  { to: '/settings', label: 'Settings', icon: Settings, phase: 1 },
]
