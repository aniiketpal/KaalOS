import { describe, it, expect } from 'vitest'
import { createSqlJsDb } from './sqljs'
import { migrate } from './migrate'

describe('db migrations', () => {
  it('runs pending migrations exactly once and is idempotent across launches', async () => {
    const db = await createSqlJsDb()

    // Migrating twice on the SAME db simulates a second app launch against a
    // populated database — this must not throw (regression guard: migration 1
    // once re-ran `CREATE TABLE activities` without IF NOT EXISTS).
    await migrate(db)
    await migrate(db)

    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    )
    expect(tables.map((t) => t.name)).toEqual([
      'activities', 'body_metrics', 'exercises', 'feed_items',
      'focus_sessions', 'habit_logs', 'habits', 'journal_entries',
      'llm_questions', 'note_embeddings', 'notes', 'schema_migrations',
      'tasks', 'workout_sessions', 'workout_sets', 'xp_events',
    ])

    const applied = await db.all<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version',
    )
    expect(applied.map((r) => r.version)).toEqual([1, 2, 3, 4, 5, 6, 7])

    // A write after migration must succeed (proves the DB is usable, i.e. the
    // create buttons across every module work).
    await db.run(
      "INSERT INTO activities (id, name, color, target_type, daily_target, created_at) VALUES ('a1', 'Reading', 'blue', 'time', 120, 0)",
    )
    const count = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM activities')
    expect(count?.n).toBe(1)
  })

  it('activities table enforces target_type CHECK', async () => {
    const db = await createSqlJsDb()
    await migrate(db)

    await expect(
      db.run(
        "INSERT INTO activities (id, name, color, target_type, created_at) VALUES ('a1', 'X', 'blue', 'bogus', 0)",
      ),
    ).rejects.toThrow()
  })
})
