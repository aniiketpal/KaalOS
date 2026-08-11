import { getDb } from '../db/client'
import { isTauri, downloadFile } from '../platform/files'

const BACKUP_DIR = 'E:\\Kaalos backup'
const BACKUP_PREFIX = 'life-tracker-backup_'

export async function backupDatabase(): Promise<{ success: boolean; path?: string; error?: string }> {
  if (!isTauri()) {
    return { success: false, error: 'Backup only available in Tauri desktop app' }
  }

  try {
    const db = await getDb()
    const bytes = await db.export()
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/x-sqlite3' })

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '-')
    const filename = `${BACKUP_PREFIX}${timestamp}.sqlite`

    await downloadFile(blob, filename, BACKUP_DIR)

    return { success: true, path: `${BACKUP_DIR}\\${filename}` }
  } catch (err) {
    console.error('Backup failed:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function listBackups(): Promise<string[]> {
  if (!isTauri()) return []

  try {
    const { readDir } = await import('@tauri-apps/plugin-fs')
    const entries = await readDir(BACKUP_DIR)
    return entries
      .filter((e) => e.name.startsWith(BACKUP_PREFIX) && e.name.endsWith('.sqlite'))
      .map((e) => e.name)
      .sort()
      .reverse()
  } catch {
    return []
  }
}

export async function cleanupOldBackups(keepCount = 12): Promise<void> {
  if (!isTauri()) return

  try {
    const { readDir, remove } = await import('@tauri-apps/plugin-fs')
    const entries = await readDir(BACKUP_DIR)
    const backups = entries
      .filter((e) => e.name.startsWith(BACKUP_PREFIX) && e.name.endsWith('.sqlite'))
      .map((e) => e.name)
      .sort()

    if (backups.length > keepCount) {
      const toDelete = backups.slice(0, backups.length - keepCount)
      for (const name of toDelete) {
        await remove(`${BACKUP_DIR}/${name}`)
      }
    }
  } catch (err) {
    console.error('Backup cleanup failed:', err)
  }
}

export function getBackupSettings(): { enabled: boolean; path: string; lastRun: number | null } {
  if (typeof window === 'undefined') return { enabled: false, path: BACKUP_DIR, lastRun: null }

  return {
    enabled: localStorage.getItem('lt_backup_enabled') === 'true',
    path: localStorage.getItem('lt_backup_path') || BACKUP_DIR,
    lastRun: localStorage.getItem('lt_backup_last_run')
      ? parseInt(localStorage.getItem('lt_backup_last_run')!, 10)
      : null,
  }
}

export function setBackupEnabled(enabled: boolean): void {
  localStorage.setItem('lt_backup_enabled', String(enabled))
}

export function setBackupPath(path: string): void {
  localStorage.setItem('lt_backup_path', path)
}

export function setBackupLastRun(timestamp: number): void {
  localStorage.setItem('lt_backup_last_run', String(timestamp))
}

export async function shouldRunBackup(): Promise<boolean> {
  const settings = getBackupSettings()
  if (!settings.enabled) return false

  const lastRun = settings.lastRun
  if (!lastRun) return true

  const daysSinceLastRun = (Date.now() - lastRun) / (1000 * 60 * 60 * 24)
  return daysSinceLastRun >= 7
}

export async function runScheduledBackup(): Promise<void> {
  const shouldRun = await shouldRunBackup()
  if (!shouldRun) return

  const result = await backupDatabase()
  if (result.success) {
    setBackupLastRun(Date.now())
    await cleanupOldBackups(12)
  }
}