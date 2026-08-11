import initSqlJs from 'sql.js'
import type { Database } from 'sql.js'
import type { Db, ExecResult } from './types'

/**
 * sql.js-backed Db for Node (vitest) — pure WASM, in-memory, zero native build.
 * Used only in tests; the browser uses wa-sqlite via the platform adapter.
 */
export async function createSqlJsDb(): Promise<Db> {
  const SQL = await initSqlJs()
  const database: Database = new SQL.Database()

  const exec = async (sql: string): Promise<void> => {
    database.exec(sql)
  }

  const run = async (sql: string, params: unknown[] = []): Promise<ExecResult> => {
    database.run(sql, params as never[])
    const rowsAffected = database.getRowsModified()
    const idRow = database.exec('SELECT last_insert_rowid() AS id')
    const lastInsertId = idRow[0]?.values[0]?.[0] as number | undefined
    return { rowsAffected, lastInsertId }
  }

  const all = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
    const stmt = database.prepare(sql)
    try {
      stmt.bind(params as never[])
      const rows: T[] = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T)
      }
      return rows
    } finally {
      stmt.free()
    }
  }

  const get = async <T>(sql: string, params: unknown[] = []): Promise<T | undefined> => {
    const rows = await all<T>(sql, params)
    return rows[0]
  }

  const transaction = async (fn: () => Promise<void>): Promise<void> => {
    database.exec('BEGIN')
    try {
      await fn()
      database.exec('COMMIT')
    } catch (err) {
      database.exec('ROLLBACK')
      throw err
    }
  }

  const exportDb = async (): Promise<Uint8Array> => {
    return database.export()
  }

  return { run, all, get, transaction, exec, export: exportDb }
}
