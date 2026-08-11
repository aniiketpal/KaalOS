import type { Db } from './types'
import { MIGRATIONS } from './migrations'

/**
 * Idempotent migration runner. Tracks applied versions in schema_migrations
 * and applies pending ones in version order, each inside a transaction so a
 * failed migration never leaves the DB in a half-migrated state.
 */
export async function migrate(db: Db): Promise<number[]> {
  await db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)',
  )
  const appliedRows = await db.all<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version',
  )
  const applied = new Set(appliedRows.map((r) => r.version))

  const pending = MIGRATIONS.filter((m) => !applied.has(m.version)).sort(
    (a, b) => a.version - b.version,
  )

  for (const m of pending) {
    await db.transaction(async () => {
      await db.exec(m.sql)
      await db.run('INSERT INTO schema_migrations (version) VALUES (?)', [m.version])
    })
  }
  return pending.map((m) => m.version)
}
