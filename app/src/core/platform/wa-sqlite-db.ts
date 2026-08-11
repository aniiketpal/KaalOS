import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs'
import * as SQLite from 'wa-sqlite/src/sqlite-api.js'
import type { Db, ExecResult } from '../db/types'

export interface WaSqliteOptions {
  /** true → in-memory DB (Phase 1 dev/test). false → OPFS-persisted (M5). */
  memory?: boolean
  /** Database name — used as the OPFS file name when memory is false. */
  name?: string
}

type SQLiteApi = ReturnType<typeof SQLite.Factory>

let apiPromise: Promise<SQLiteApi> | null = null

async function getApi(): Promise<SQLiteApi> {
  apiPromise ??= (async () => {
    const module = await SQLiteESMFactory()
    const sqlite3 = SQLite.Factory(module)
    return sqlite3
  })()
  return apiPromise
}

/**
 * wa-sqlite backed Db. Phase 1 uses `memory: true` for simplicity in browser
 * dev + tests. `memory: false` plus the OPFS VFS lands in M5 for PWA persistence.
 */
export async function createWaSqliteDb(opts: WaSqliteOptions = {}): Promise<Db> {
  const { memory = true, name = 'life-tracker' } = opts
  const sqlite3 = await getApi()

  // Memory mode uses the in-memory VFS by opening ':memory:'-style path.
  // wa-sqlite's async build opens db via `open_v2` with flags; using the simple
  // API call with an in-memory database name keeps this identical across shells.
  const db = await sqlite3.open_v2(
    memory ? ':memory:' : `${name}.db`,
    SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE,
    memory ? undefined : 'opfs',
  )

  const exec = async (sql: string): Promise<void> => {
    await sqlite3.exec(db, sql)
  }

  const run = async (sql: string, params: unknown[] = []): Promise<ExecResult> => {
    const rows = await sqlite3.run(db, sql, params)
    return {
      rowsAffected: sqlite3.changes(db),
      lastInsertId: rows?.lastInsertRowid as number | undefined,
    }
  }

  const all = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
    const rows: T[] = []
    for await (const stmt of sqlite3.statements(db, sql)) {
      if (params.length) {
        stmt.bind(params as never[])
      }
      while ((await stmt.step()) === SQLite.SQLITE_ROW) {
        rows.push(stmt.get() as T)
      }
    }
    return rows
  }

  const get = async <T>(sql: string, params: unknown[] = []): Promise<T | undefined> => {
    const rows = await all<T>(sql, params)
    return rows[0]
  }

  const transaction = async (fn: () => Promise<void>): Promise<void> => {
    await exec('BEGIN')
    try {
      await fn()
      await exec('COMMIT')
    } catch (err) {
      await exec('ROLLBACK')
      throw err
    }
  }

  const exportDb = async (): Promise<Uint8Array> => {
    const tables = await all<{ name: string; sql: string }>(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    let dump = ''

    for (const table of tables) {
      if (table.sql) dump += table.sql + ';\n\n'

      const rows = await all<Record<string, unknown>>(`SELECT * FROM ${table.name}`)
      for (const row of rows) {
        const cols = Object.keys(row)
        const vals = cols.map((c) => {
          const v = row[c]
          if (v === null) return 'NULL'
          if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`
          return String(v)
        })
        dump += `INSERT INTO ${table.name} (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`
      }
      dump += '\n'
    }

    return new TextEncoder().encode(dump)
  }

  return { run, all, get, transaction, exec, export: exportDb }
}
