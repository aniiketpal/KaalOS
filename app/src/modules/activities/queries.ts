import { useEffect, useState } from 'react'
import { getDb } from '../../core/db/client'
import { subscribeVersion } from '../../shared/hooks/versionBus'
import type { ActivityRow } from './ActivityForm'

export type { ActivityRow }

/** Fetch activities reactively — re-runs whenever bumpVersion() is called. */
export function useActivities(opts?: { includeArchived?: boolean }): ActivityRow[] {
  const [rows, setRows] = useState<ActivityRow[]>([])
  const includeArchived = opts?.includeArchived ?? false

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
