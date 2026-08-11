import type { ActivityRow } from '../activities/ActivityForm'

export interface TaskRow {
  id: string
  activity_id: string | null
  title: string
  notes: string | null
  status: 'pending' | 'done' | 'skipped'
  due_date: string | null
  recurrence_rule: string | null
  carry_over: number
  sort_order: number
  completed_at: number | null
  created_at: number
}

export interface TaskWithActivity extends TaskRow {
  activity?: ActivityRow | null
}

export type TaskSection = 'overdue' | 'today' | 'upcoming' | 'completed'

export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function sectionOf(task: TaskRow, today = todayStr()): TaskSection {
  if (task.status === 'done') return 'completed'
  if (task.due_date === null) return 'upcoming'
  if (task.due_date < today) return 'overdue'
  if (task.due_date === today) return 'today'
  return 'upcoming'
}

export function recurrenceLabel(rule: string | null): string | null {
  if (!rule) return null
  if (rule === 'daily') return 'Daily'
  if (rule === 'weekdays') return 'Weekdays'
  if (rule.startsWith('custom:')) {
    const days = rule.slice('custom:'.length).split(',')
    const map: Record<string, string> = { SU: 'S', MO: 'M', TU: 'T', WE: 'W', TH: 'T', FR: 'F', SA: 'S' }
    return days.map((d) => map[d] ?? d).join('')
  }
  return rule
}
