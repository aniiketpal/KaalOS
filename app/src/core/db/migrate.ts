import type { Db } from './types'
import { MIGRATIONS } from './migrations'

/**
 * Idempotent migration runner. Tracks applied versions in schema_migrations
 * and applies pending ones in version order.
 *
 * Multi-statement SQL is split on ';' because tauri-plugin-sql's execute()
 * only runs the first statement per call.
 *
 * No explicit transactions — tauri-plugin-sql uses a connection pool, so
 * raw BEGIN/COMMIT doesn't work across execute() calls. All DDL uses
 * IF NOT EXISTS so re-runs are safe.
 */

const TABLES_PER_MIGRATION: Record<number, string[]> = {
  1: ['schema_migrations', 'activities'],
  2: ['tasks'],
  3: ['focus_sessions'],
  4: ['notes', 'journal_entries', 'habits', 'habit_logs'],
  5: ['body_metrics', 'exercises', 'workout_sessions', 'workout_sets', 'xp_events', 'feed_items'],
  6: ['llm_questions'],
  7: ['note_embeddings'],
}

async function repairMigrations(db: Db): Promise<void> {
  const rows = await db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'schema_migrations'",
  )
  const existingTables = new Set(rows.map((r) => r.name))

  for (const [versionStr, expectedTables] of Object.entries(TABLES_PER_MIGRATION)) {
    const version = Number(versionStr)
    const missing = expectedTables.filter((t) => !existingTables.has(t))
    if (missing.length > 0) {
      await db.run('DELETE FROM schema_migrations WHERE version = ?', [version])
    }
  }
}

export async function migrate(db: Db): Promise<number[]> {
  await db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)',
  )

  await repairMigrations(db)

  const appliedRows = await db.all<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version',
  )
  const applied = new Set(appliedRows.map((r) => r.version))

  const pending = MIGRATIONS.filter((m) => !applied.has(m.version)).sort(
    (a, b) => a.version - b.version,
  )

  for (const m of pending) {
    const stmts = m.sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const stmt of stmts) {
      await db.exec(stmt)
    }
    await db.run('INSERT INTO schema_migrations (version) VALUES (?)', [m.version])
  }
  return pending.map((m) => m.version)
}
