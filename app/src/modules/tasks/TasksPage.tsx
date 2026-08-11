import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle, AlertTriangle, CalendarDays, ChevronDown, ChevronRight } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { bumpVersion } from '../../shared/hooks/versionBus'
import { getDb } from '../../core/db/client'
import { useActivities } from '../activities/queries'
import { useTasks, type TaskWithActivity } from './queries'
import { TaskRow } from './TaskRow'
import { TaskForm } from './TaskForm'
import { todayStr } from './types'
import { clsx } from 'clsx'

type Filter = 'all' | 'today' | 'overdue' | 'upcoming' | 'completed'
type SectionKey = 'overdue' | 'today' | 'upcoming' | 'completed'

const SECTIONS: { key: SectionKey; title: string; icon: React.ReactNode; hint: string }[] = [
  { key: 'overdue', title: 'Overdue', icon: <AlertTriangle size={13} className="text-error" />, hint: 'Auto-carries tomorrow' },
  { key: 'today', title: 'Today', icon: <CalendarDays size={13} className="text-accent-amber" />, hint: '' },
  { key: 'upcoming', title: 'Upcoming', icon: <CalendarDays size={13} className="text-text-muted" />, hint: '' },
  { key: 'completed', title: 'Completed', icon: <CheckCircle size={13} className="text-accent-teal" />, hint: '' },
]

export function TasksPage() {
  const tasks = useTasks()
  const activities = useActivities()

  const [filter, setFilter] = useState<Filter>('all')
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ completed: true })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TaskWithActivity | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const today = todayStr()
    return tasks.filter((t) => {
      if (activityFilter !== 'all' && t.activity_id !== activityFilter) return false
      if (filter === 'all') return true
      if (filter === 'today') return t.due_date === today && t.status !== 'done'
      if (filter === 'overdue') return t.status === 'pending' && t.due_date !== null && t.due_date < today
      if (filter === 'upcoming') return t.due_date !== null && t.due_date > today
      if (filter === 'completed') return t.status === 'done'
      return true
    })
  }, [tasks, filter, activityFilter])

  const sections = useMemo(() => {
    const today = todayStr()
    const groups: Record<SectionKey, TaskWithActivity[]> = {
      overdue: [], today: [], upcoming: [], completed: [],
    }
    for (const t of visible) {
      if (t.status === 'done') groups.completed.push(t)
      else if (t.due_date === null) groups.upcoming.push(t)
      else if (t.due_date < today) groups.overdue.push(t)
      else if (t.due_date === today) groups.today.push(t)
      else groups.upcoming.push(t)
    }
    for (const g of Object.values(groups)) g.sort((a, b) => a.sort_order - b.sort_order || a.created_at - b.created_at)
    return groups
  }, [visible])

  const busy = {
    all: tasks.length,
    today: tasks.filter((t) => t.due_date === todayStr() && t.status !== 'done').length,
    overdue: tasks.filter((t) => t.status === 'pending' && t.due_date !== null && t.due_date < todayStr()).length,
    upcoming: tasks.filter((t) => t.due_date !== null && t.due_date > todayStr()).length,
    completed: tasks.filter((t) => t.status === 'done').length,
  }

  const onToggle = async (task: TaskWithActivity) => {
    const db = await getDb()
    if (task.status === 'done') {
      await db.run(`UPDATE tasks SET status='pending', completed_at=NULL WHERE id=?`, [task.id])
      bumpVersion()
    } else {
      const { completeTask } = await import('./queries')
      await completeTask(task)
    }
  }

  const onEdit = (t: TaskWithActivity) => { setEditing(t); setFormOpen(true) }
  const onDelete = async (t: TaskWithActivity) => {
    const db = await getDb()
    await db.run(`DELETE FROM tasks WHERE id=?`, [t.id])
    bumpVersion()
  }

  const dropOnTask = async (target: TaskWithActivity) => {
    if (!draggingId || draggingId === target.id) return
    const db = await getDb()
    const targetRow = await db.get<{ sort_order: number }>(`SELECT sort_order FROM tasks WHERE id=?`, [target.id])
    if (!targetRow) return

    const before = await db.get<{ sort_order: number }>(
      `SELECT sort_order FROM tasks WHERE id != ? AND status != 'done' AND sort_order < ? ORDER BY sort_order DESC LIMIT 1`,
      [draggingId, targetRow.sort_order],
    )
    const after = await db.get<{ sort_order: number }>(
      `SELECT sort_order FROM tasks WHERE id != ? AND status != 'done' AND sort_order > ? ORDER BY sort_order ASC LIMIT 1`,
      [draggingId, targetRow.sort_order],
    )
    let sortOrder: number
    if (before && after) sortOrder = (before.sort_order + after.sort_order) / 2
    else if (before) sortOrder = before.sort_order + 1000
    else if (after) sortOrder = after.sort_order - 1000
    else sortOrder = targetRow.sort_order
    await db.run(`UPDATE tasks SET sort_order=? WHERE id=?`, [sortOrder, draggingId])
    setDraggingId(null)
    bumpVersion()
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${busy.today} today · ${busy.overdue} overdue`}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="rounded-md border border-border-subtle px-2 py-2 text-sm text-text-primary outline-none bg-bg-tertiary"
            >
              <option value="all">All activities</option>
              {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button
              onClick={() => { setEditing(null); setFormOpen(true) }}
              className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-2 text-sm font-medium text-text-inverse hover:opacity-90"
            >
              <Plus size={14} />
              New Task
            </button>
          </div>
        }
      />

      {/* Filter chips */}
      <div className="flex gap-1.5 px-6 pt-4">
        {(['all', 'today', 'overdue', 'upcoming', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f
                ? 'bg-bg-active text-text-primary'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover',
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} <span className="ml-1 text-text-muted">{busy[f]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4 p-6">
        {SECTIONS.map(({ key, title, icon, hint }) => {
          const list = sections[key]
          if (!list.length) return null
          const open = !collapsed[key]
          return (
            <section key={key}>
              <button
                onClick={() => setCollapsed((s) => ({ ...s, [key]: !s[key] }))}
                className="mb-1.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover"
              >
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                {icon}
                {title}
                <span className="text-text-muted">({list.length})</span>
                {hint && <span className="ml-auto text-[10px] text-text-muted">{hint}</span>}
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    {list.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        draggingId={draggingId}
                        onToggle={onToggle}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDragStart={(t) => setDraggingId(t.id)}
                        onDragOver={(_t, e) => { e.preventDefault() }}
                        onDrop={dropOnTask}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )
        })}

        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-border-subtle p-10 text-center text-sm text-text-muted">
            No tasks yet. Create one to get started.
          </div>
        )}
      </div>

      <TaskForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} task={editing} />
    </div>
  )
}
