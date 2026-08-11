import { useState } from 'react'
import { getDb } from '../../core/db/client'
import { bumpVersion } from '../../shared/hooks/versionBus'
import { useActivities } from '../activities/queries'
import { Modal } from '../../shared/ui/Modal'
import { nanoid } from 'nanoid'
import { clsx } from 'clsx'
import type { TaskWithActivity } from './types'
import { todayStr, recurrenceLabel } from './types'
import { useRef, useEffect } from 'react'

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface TaskFormProps {
  open: boolean
  onClose: () => void
  /** When provided → edit mode. When null → create. */
  task: TaskWithActivity | null
}

export function TaskForm({ open, onClose, task }: TaskFormProps) {
  const activities = useActivities()
  const isEdit = task !== null

  const [title, setTitle] = useState('')
  const [activityId, setActivityId] = useState('')
  const [dueDate, setDueDate] = useState<string | null>(todayStr())
  const [recurrence, setRecurrence] = useState<string | null>(null)
  const [customDays, setCustomDays] = useState<string[]>([])
  const [carryOver, setCarryOver] = useState(true)
  const [notes, setNotes] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  // Reset form whenever opened for a fresh task/edit
  useEffectOnOpen(open, () => {
    if (task) {
      setTitle(task.title)
      setActivityId(task.activity_id ?? '')
      setDueDate(task.due_date)
      setRecurrence(task.recurrence_rule)
      setShowCustom(task.recurrence_rule?.startsWith('custom:') ?? false)
      setCustomDays(
        task.recurrence_rule?.startsWith('custom:')
          ? task.recurrence_rule.slice('custom:'.length).split(',')
          : [],
      )
      setCarryOver(task.carry_over === 1)
      setNotes(task.notes ?? '')
    } else {
      setTitle('')
      setActivityId('')
      setDueDate(todayStr())
      setRecurrence(null)
      setShowCustom(false)
      setCustomDays([])
      setCarryOver(true)
      setNotes('')
    }
  })

  const canSave = title.trim().length > 0
  const save = async () => {
    if (!canSave) return
    const db = await getDb()
    const rule = showCustom
      ? customDays.length ? `custom:${customDays.join(',')}` : null
      : recurrence === 'none' ? null : recurrence

    if (isEdit) {
      await db.run(
        `UPDATE tasks SET title=?, activity_id=?, notes=?, due_date=?, recurrence_rule=?, carry_over=? WHERE id=?`,
        [title.trim(), activityId || null, notes || null, dueDate, rule, carryOver ? 1 : 0, task.id],
      )
    } else {
      const id = nanoid()
      const maxRow = await db.get<{ max: number | null }>(
        `SELECT MAX(sort_order) AS max FROM tasks WHERE status != 'done'`,
      )
      const sortOrder = (maxRow?.max ?? 0) + 1000
      await db.run(
        `INSERT INTO tasks (id, activity_id, title, notes, status, due_date, recurrence_rule, carry_over, sort_order, completed_at, created_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, NULL, ?)`,
        [id, activityId || null, title.trim(), notes || null, dueDate, rule, carryOver ? 1 : 0, sortOrder, Date.now()],
      )
    }
    bumpVersion()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'New Task'}>
      {/* Title */}
      <div className="mb-4">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Title
        </label>
        <input
          autoFocus
          className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-focus"
          placeholder="e.g. Finish caching chapter"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save() }}
        />
      </div>

      {/* Row: Activity + Due date */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Activity
          </label>
          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          >
            <option value="">None</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Due date
          </label>
          <input
            type="date"
            value={dueDate ?? ''}
            onChange={(e) => setDueDate(e.target.value || null)}
            className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          />
        </div>
      </div>

      {/* Recurrence */}
      <div className="mb-4">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Recurrence
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(['none', 'daily', 'weekdays'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setShowCustom(false); setRecurrence(r === 'none' ? null : r) }}
              className={clsx(
                'rounded-full px-3 py-1 text-xs transition-colors',
                !showCustom && (
                  (r === 'none' && recurrence === null) || recurrence === r
                )
                  ? 'bg-accent-blue text-text-inverse'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover',
              )}
            >
              {r === 'none' ? 'None' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          {recurrence?.startsWith('custom:') && (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className={clsx(
                'rounded-full px-3 py-1 text-xs transition-colors flex items-center gap-1',
                showCustom ? 'bg-accent-blue text-text-inverse' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover',
              )}
            >
              {showCustom ? 'Custom' : recurrenceLabel(recurrence)}
            </button>
          )}
          {!recurrence?.startsWith('custom:') && (
            <button
              type="button"
              onClick={() => { setShowCustom(true); setRecurrence('custom:') }}
              className="rounded-full bg-bg-tertiary px-3 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
            >
              Custom…
            </button>
          )}
        </div>

        {showCustom && (
          <div className="mt-3 space-y-1.5 rounded-md border border-border-subtle bg-bg-tertiary p-3">
            <p className="text-[11px] text-text-muted">Repeats on selected days</p>
            <div className="flex gap-1">
              {WEEKDAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    setCustomDays((prev) =>
                      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                    )
                  }
                  className={clsx(
                    'flex-1 rounded py-1.5 text-xs font-medium transition-colors',
                    customDays.includes(d)
                      ? 'bg-accent-blue text-text-inverse'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover',
                  )}
                >
                  {DAY_LABELS[i]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Carry-over */}
      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={carryOver}
          onChange={(e) => setCarryOver(e.target.checked)}
          className="h-3.5 w-3.5 rounded accent-accent-blue"
        />
        Carry over to tomorrow if unfinished
      </label>

      {/* Notes */}
      <div className="mb-5">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Notes
        </label>
        <textarea
          rows={2}
          className="w-full resize-none rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-focus"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes…"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!canSave}
          className="rounded-md bg-accent-blue px-4 py-2 text-sm font-medium text-text-inverse disabled:opacity-40"
        >
          {isEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </Modal>
  )
}

/** Run callback only when `open` transitions to true. */
function useEffectOnOpen(open: boolean, fn: () => void) {
  const prev = useRef(false)
  useEffect(() => {
    if (open && !prev.current) fn()
    prev.current = open
  }, [open, fn])
}
