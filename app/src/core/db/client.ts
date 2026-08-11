import type { Db } from './types'
import { migrate } from './migrate'
import { getPlatform } from '../platform/platform'

let dbPromise: Promise<Db> | null = null

/** Singleton DB handle — opens via the platform adapter, migrates to latest. */
export function getDb(): Promise<Db> {
  dbPromise ??= (async () => {
    try {
      const db = await getPlatform().openDb()
      await migrate(db)
      return db
    } catch (err) {
      dbPromise = null
      throw err
    }
  })()
  return dbPromise
}

/** Test-only: reset the singleton so each test gets a fresh DB. */
export function __resetDbForTests(): void {
  dbPromise = null
}

export type { Db, ExecResult } from './types'
