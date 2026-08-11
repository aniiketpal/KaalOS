import Database from '@tauri-apps/plugin-sql'
import type { Db, ExecResult } from '../db/types'

/**
 * Tauri SQL plugin adapter — same Db interface as the browser wa-sqlite
 * implementation so module code never cares which shell it's on.
 */
export async function createTauriSqlDb(path: string): Promise<Db> {
  const db = await Database.load(path)

  const exec = async (sql: string): Promise<void> => {
    await db.execute(sql)
  }

  const run = async (sql: string, params: unknown[] = []): Promise<ExecResult> => {
    const result = await db.execute(sql, params as never[])
    return {
      rowsAffected: result.rowsAffected,
      lastInsertId: result.lastInsertId,
    }
  }

  const all = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
    return db.select(sql, params as never[]) as Promise<T[]>
  }

  const get = async <T>(sql: string, params: unknown[] = []): Promise<T | undefined> => {
    const rows = await all<T>(sql, params)
    return rows[0]
  }

  const transaction = async (fn: () => Promise<void>): Promise<void> => {
    await db.execute('BEGIN')
    try {
      await fn()
      await db.execute('COMMIT')
    } catch (err) {
      await db.execute('ROLLBACK')
      throw err
    }
  }

  const exportDb = async (): Promise<Uint8Array> => {
    const tablesResult = await db.execute('SELECT name, sql FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"')
    const tables = tablesResult as unknown as Array<{ name: string; sql: string }>
    let dump = ''

    for (const table of tables) {
      if (table.sql) dump += table.sql + ';\n\n'

      const rowsResult = await db.select(`SELECT * FROM ${table.name}`)
      const rows = rowsResult as unknown as Array<Record<string, unknown>>
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
