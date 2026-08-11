import { useState } from 'react'
import { nanoid } from 'nanoid'
import { getDb } from '../../core/db/client'
import { awardXp, focusXpForMinutes } from '../../core/db/xp'
import { bumpVersion } from '../../shared/hooks/versionBus'
import { useActivities } from '../activities/queries'
import { useTasks } from '../tasks/queries'
import { Modal } from '../../shared/ui/Modal'
import { todayStr } from '../tasks/types'

interface ManualLogModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function ManualLogModal({ open, onClose, onSaved }: ManualLogModalProps) {
  const activities = useActivities()
  const tasks = useTasks()

  const [activityId, setActivityId] = useState('')
  const [taskId, setTaskId] = useState<string | ''>('')
  const [dateStr, setDateStr] = useState(todayStr())
  const [minutes, setMinutes] = useState(60)
  const [note, setNote] = useState('')
  const canSave = activityId !== '' && minutes >= 5 && minutes <= 180

  const save = async () => {
    if (!canSave) return
    const db = await getDb()
    const dayStart = new Date(dateStr + 'T00:00:00').getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000
    const id = nanoid()
    await db.run(
      `INSERT INTO focus_sessions (id, activity_id, task_id, started_at, ended_at, planned_minutes, actual_minutes, mode, source, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'focus', 'manual', ?)`,
      [id, activityId, taskId || null, dayStart, dayEnd, minutes, minutes, note || null],
    )
    await awardXp('focus', focusXpForMinutes(minutes), id)
    bumpVersion()
    onSaved()
    onClose()
  }

  const taskOptions = tasks.filter((t) => t.activity_id === activityId && t.status === 'pending')

  return (
    <Modal open={open} onClose={onClose} title="Log time manually">
      <div className="mb-4">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Activity
        </label>
        <select
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
        >
          <option value="">— pick activity —</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Task (optional)
        </label>
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          disabled={!activityId}
        >
          <option value="">— any —</option>
          {taskOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Date
          </label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Minutes
          </label>
          <input
            type="number"
            min={5}
            max={180}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) || 0)}
            className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-2 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Did 1.5h reading offline"
          className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-focus"
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
          Save manual log
        </button>
      </div>
    </Modal>
  )
}
