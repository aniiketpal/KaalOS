import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Archive, Undo2 } from 'lucide-react'
import { getDb } from '../../core/db/client'
import { bumpVersion, subscribeVersion } from '../../shared/hooks/versionBus'
import { useEffect } from 'react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Modal } from '../../shared/ui/Modal'
import { ActivityForm, type ActivityRow } from '../activities/ActivityForm'
import { ACCENT_COLORS } from '../activities/colors'
import { clsx } from 'clsx'

function useActivitiesLive(includeArchived: boolean): ActivityRow[] {
  const [rows, setRows] = useState<ActivityRow[]>([])
  useEffect(() => {
    let alive = true
    const load = async () => {
      const db = await getDb()
      const data = await db.all<ActivityRow>(
        `SELECT * FROM activities ${includeArchived ? '' : 'WHERE archived_at IS NULL'} ORDER BY created_at ASC`,
      )
      if (alive) setRows(data)
    }
    load()
    const unsub = subscribeVersion(load)
    return () => { alive = false; unsub() }
  }, [includeArchived])
  return rows
}

export function ActivitiesSettingsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const activities = useActivitiesLive(showArchived)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ActivityRow | undefined>(undefined)
  const [archiving, setArchiving] = useState<ActivityRow | undefined>(undefined)

  const openCreate = () => { setEditing(undefined); setFormOpen(true) }
  const openEdit = (a: ActivityRow) => { setEditing(a); setFormOpen(true) }

  const toggleArchive = async (a: ActivityRow) => {
    const db = await getDb()
    await db.run(
      `UPDATE activities SET archived_at=? WHERE id=?`,
      [a.archived_at ? null : Date.now(), a.id],
    )
    bumpVersion()
    setArchiving(undefined)
  }

  return (
    <div>
      <PageHeader
        title="Activities"
        subtitle="Colors, targets, targets — the spine of the tracker"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-2 text-sm font-medium text-text-inverse transition-colors hover:opacity-90"
          >
            <Plus size={14} />
            New Activity
          </button>
        }
      />

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {activities.filter((a) => !a.archived_at).length} active ·{' '}
            {activities.filter((a) => a.archived_at).length} archived
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border-subtle bg-bg-tertiary"
            />
            Show archived
          </label>
        </div>

        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {activities.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={clsx(
                  'flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-secondary px-4 py-3',
                  a.archived_at && 'opacity-50',
                )}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: ACCENT_COLORS.find((c) => c.key === a.color)?.var ?? a.color,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{a.name}</p>
                  <p className="text-xs text-text-muted">
                    {a.target_type === 'time' ? `${a.daily_target} min/day` : `${a.daily_target}/day`}
                    {a.weekly_target != null && a.weekly_target > 0 && ` · ${a.weekly_target}/week`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {a.archived_at ? (
                    <button
                      onClick={() => toggleArchive(a)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-hover"
                    >
                      <Undo2 size={12} />
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => openEdit(a)}
                        className="rounded-md p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                        aria-label={`Edit ${a.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setArchiving(a)}
                        className="rounded-md p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-error"
                        aria-label={`Archive ${a.name}`}
                      >
                        <Archive size={14} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="rounded-lg border border-dashed border-border-subtle p-10 text-center text-sm text-text-muted">
            {showArchived ? 'No activities at all yet.' : 'No active activities. Create one.'}
          </div>
        )}
      </div>

      <ActivityForm open={formOpen} onClose={() => setFormOpen(false)} activity={editing} />

      <Modal
        open={!!archiving}
        onClose={() => setArchiving(undefined)}
        title={archiving ? `Archive "${archiving.name}"?` : 'Archive activity?'}
      >
        <p className="text-sm text-text-secondary">
          Archiving hides the activity from pickers and the sidebar, but keeps all tasks,
          focus sessions, and progress data. You can restore it any time.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setArchiving(undefined)}
            className="rounded-md px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={() => archiving && toggleArchive(archiving)}
            className="rounded-md bg-error/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error"
          >
            Archive
          </button>
        </div>
      </Modal>
    </div>
  )
}
