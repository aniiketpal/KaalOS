import { getDb } from '../../core/db/client'
import { useLiveQuery } from '../../shared/hooks/useLiveQuery'
import type { ActivityRow } from './ActivityForm'

export type { ActivityRow }

/** Fetch activities reactively — re-runs whenever bumpVersion() is called. */
export function useActivities(opts?: { includeArchived?: boolean }): ActivityRow[] {
  const includeArchived = opts?.includeArchived ?? false
  return useLiveQuery<ActivityRow[]>(
    async () => {
      const db = await getDb()
      return db.all<ActivityRow>(
        `SELECT * FROM activities ${includeArchived ? '' : 'WHERE archived_at IS NULL'} ORDER BY created_at ASC`,
      )
    },
    [],
    [includeArchived],
  ).data
}
