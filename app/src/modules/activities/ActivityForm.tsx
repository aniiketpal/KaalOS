import { useState } from 'react'
import { nanoid } from 'nanoid'
import { getDb } from '../../core/db/client'
import { ACCENT_COLORS } from './colors'
import { bumpVersion } from '../../shared/hooks/versionBus'
import { Modal } from '../../shared/ui/Modal'
import { clsx } from 'clsx'

export interface ActivityRow {
  id: string
  name: string
  color: string
  target_type: 'time' | 'quantity'
  daily_target: number
  weekly_target: number | null
  created_at: number
  archived_at: number | null
}

interface ActivityFormProps {
  open: boolean
  onClose: () => void
  /** Existing activity to edit; undefined → create new. */
  activity?: ActivityRow
}

export function ActivityForm({ open, onClose, activity }: ActivityFormProps) {
  const isEdit = Boolean(activity)
  const [name, setName] = useState(activity?.name ?? '')
  const [color, setColor] = useState<string>(activity?.color ?? 'blue')
  const [targetType, setTargetType] = useState<'time' | 'quantity'>(activity?.target_type ?? 'time')
  const [dailyTarget, setDailyTarget] = useState<number>(activity?.daily_target ?? 120)
  const [weeklyTarget, setWeeklyTarget] = useState<number>(activity?.weekly_target ?? 0)
  const [saving, setSaving] = useState(false)

  const canSave = name.trim().length > 0 && dailyTarget >= 0

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const db = await getDb()
      const now = Date.now()
      if (isEdit && activity) {
        await db.run(
          `UPDATE activities SET name=?, color=?, target_type=?, daily_target=?, weekly_target=? WHERE id=?`,
          [name.trim(), color, targetType, dailyTarget, weeklyTarget || null, activity.id],
        )
      } else {
        await db.run(
          `INSERT INTO activities (id, name, color, target_type, daily_target, weekly_target, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [nanoid(), name.trim(), color, targetType, dailyTarget, weeklyTarget || null, now],
        )
      }
      bumpVersion()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Activity' : 'New Activity'}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
            Name
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. System Design"
            className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-focus"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
            Color
          </label>
          <div className="flex gap-2">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => setColor(c.key)}
                className={clsx(
                  'h-8 w-8 rounded-full transition-transform',
                  color === c.key ? 'scale-110 ring-2 ring-border-focus ring-offset-2 ring-offset-bg-secondary' : 'hover:scale-105',
                )}
                style={{ backgroundColor: c.var }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
            Target type
          </label>
          <div className="flex rounded-md border border-border-subtle bg-bg-tertiary p-0.5">
            {(['time', 'quantity'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetType(t)}
                className={clsx(
                  'flex-1 rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  targetType === t
                    ? 'bg-bg-active text-text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {t === 'time' ? 'Time (min/day)' : 'Quantity (/day)'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
              Daily target {targetType === 'time' ? '(minutes)' : '(count)'}
            </label>
            <input
              type="number"
              min={0}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
              Weekly target (optional)
            </label>
            <input
              type="number"
              min={0}
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Number(e.target.value) || 0)}
              placeholder="—"
              className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-focus"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave || saving}
            className="rounded-md bg-accent-blue px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Activity'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
