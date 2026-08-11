import { describe, it, expect } from 'vitest'
import { createSqlJsDb } from './sqljs'
import { migrate } from './migrate'

describe('db migrations', () => {
  it('runs pending migrations exactly once', async () => {
    const db = await createSqlJsDb()

    await migrate(db)
    await migrate(db)

    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    )
    expect(tables.map((t) => t.name)).toEqual([
      'activities', 'body_metrics', 'exercises', 'feed_items',
      'focus_sessions', 'habit_logs', 'habits',
      'journal_entries', 'notes', 'schema_migrations', 'tasks',
      'workout_sessions', 'workout_sets', 'xp_events',
    ])

    const applied = await db.all<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version',
    )
    expect(applied).toHaveLength(5)
    expect(applied.map((r) => r.version)).toEqual([1, 2, 3, 4, 5])
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
