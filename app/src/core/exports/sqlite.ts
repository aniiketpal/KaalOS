import { getDb } from '../db/client'

export async function exportSqlite(): Promise<Uint8Array> {
  const db = await getDb()
  return await db.export()
}

export async function exportSqliteBase64(): Promise<string> {
  const bytes = await exportSqlite()
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64
}