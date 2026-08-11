export type ExecResult = { rowsAffected: number; lastInsertId?: string | number }

/**
 * Thin async DB interface. Every shell (browser wa-sqlite, Tauri plugin-sql,
 * Node sql.js in tests) adapts to this contract so module code never cares
 * which SQLite backing store it's using.
 */
export interface Db {
  run(sql: string, params?: unknown[]): Promise<ExecResult>
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>
  /** Execute multiple statements atomically (used by the migration runner). */
  transaction(fn: () => Promise<void>): Promise<void>
  exec(sql: string): Promise<void>
  /** Export entire database as Uint8Array. */
  export(): Promise<Uint8Array>
}
