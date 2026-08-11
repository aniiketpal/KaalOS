import { runScheduledBackup } from './backup'

let checkInterval: ReturnType<typeof setInterval> | null = null

export function startBackupScheduler(): void {
  if (checkInterval) return

  runScheduledBackup()

  checkInterval = setInterval(() => {
    void runScheduledBackup()
  }, 60 * 60 * 1000)
}

export function stopBackupScheduler(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}