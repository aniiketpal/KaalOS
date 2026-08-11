import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, RefreshCw, HardDrive, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { backupDatabase, listBackups, cleanupOldBackups, getBackupSettings, setBackupEnabled, runScheduledBackup } from '../../core/backup/backup'
import { isTauri } from '../../core/platform/files'
import { formatDistanceToNow } from 'date-fns'

export function BackupPage() {
  const [settings, setSettings] = useState(getBackupSettings())
  const [backups, setBackups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    void loadBackups()
  }, [])

  const loadBackups = async () => {
    const list = await listBackups()
    setBackups(list)
    setSettings(getBackupSettings())
  }

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message })
    setTimeout(() => setStatus(null), 5000)
  }

  const handleToggle = async (enabled: boolean) => {
    setBackupEnabled(enabled)
    setSettings(getBackupSettings())
    if (enabled) {
      await runScheduledBackup()
      await loadBackups()
    }
  }

  const handleBackupNow = async () => {
    setLoading(true)
    setStatus(null)
    const result = await backupDatabase()
    setLoading(false)
    if (result.success) {
      showStatus('success', `Backup saved to ${result.path}`)
      await loadBackups()
    } else {
      showStatus('error', result.error || 'Backup failed')
    }
  }

  const handleCleanup = async () => {
    await cleanupOldBackups(12)
    await loadBackups()
    showStatus('success', 'Old backups cleaned up (kept latest 12)')
  }

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader
        title="Auto Backup"
        subtitle="Weekly timestamped backups to your local drive for disaster recovery"
      />

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-lg border p-4 flex items-center gap-3 ${
            status.type === 'success'
              ? 'border-success/30 bg-success/5 text-success'
              : 'border-error/30 bg-error/5 text-error'
          }`}
        >
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm">{status.message}</span>
        </motion.div>
      )}

      {!isTauri() && (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/5 p-4 flex items-center gap-3 text-warning">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">Auto-backup unavailable in browser</p>
            <p className="text-sm text-text-secondary mt-1">
              This feature requires the Tauri desktop app to access your local filesystem.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-border-subtle bg-bg-secondary p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary">Weekly Backups</h3>
              <p className="text-xs text-text-muted">Automatically save a full database copy every 7 days</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              disabled={!isTauri()}
              className="sr-only peer"
            />
            <div className="w-11 h-6 rounded-full bg-bg-tertiary peer-focus:ring-2 peer-focus:ring-accent-blue peer-checked:bg-accent-blue transition-colors" />
            <span className="absolute left-1 top-0.5 h-5 w-5 rounded-full bg-white shadow-lg peer-checked:translate-x-5 transition-transform" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Settings size={14} />
            <span>Backup folder: <code className="ml-1 bg-bg-tertiary px-1.5 py-0.5 rounded">{settings.path}</code></span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock size={14} />
            <span>
              Last backup: {settings.lastRun
                ? `${formatDistanceToNow(settings.lastRun, { addSuffix: true })}`
                : 'Never'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleBackupNow}
            disabled={loading || !isTauri()}
            className="flex items-center gap-2 rounded-md bg-accent-blue px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Backup Now
          </button>
          <button
            onClick={handleCleanup}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Cleanup Old
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-primary">Existing Backups</h3>
          <span className="text-xs text-text-muted">{backups.length} / 12 max</span>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-muted">No backups yet. Click "Backup Now" to create your first one.</div>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {backups.map((name) => (
              <motion.li
                key={name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm"
              >
                <span className="font-mono text-text-secondary">{name}</span>
                <span className="text-xs text-text-muted">
                  {name.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || 'Unknown date'}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-border-subtle bg-bg-secondary p-4 text-sm text-text-secondary">
        <p className="font-medium text-text-primary mb-2">How it works</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Runs automatically on app start and then hourly in the background</li>
          <li>Only creates a backup if 7+ days have passed since the last one</li>
          <li>Saves to <code className="bg-bg-tertiary px-1.5 py-0.5 rounded">{settings.path}</code></li>
          <li>Keeps the latest 12 backups, deletes older ones automatically</li>
          <li>Each backup is a complete SQLite database file (~1-5 MB)</li>
        </ul>
      </div>
    </div>
  )
}