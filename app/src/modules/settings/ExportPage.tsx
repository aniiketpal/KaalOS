import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Table, Database, AlertCircle, CheckCircle } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { generateAllMarkdown } from '../../core/exports/markdown'
import { exportAllCsv } from '../../core/exports/csv'
import { exportSqliteBase64 } from '../../core/exports/sqlite'
import { isTauri, downloadFile, pickFolder } from '../../core/platform/files'

export function ExportPage() {
  const [exporting, setExporting] = useState<'markdown' | 'csv' | 'sqlite' | null>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [tauriPath, setTauriPath] = useState<string>('')

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message })
    setTimeout(() => setStatus(null), 5000)
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleMarkdownExport = async () => {
    setExporting('markdown')
    setStatus(null)
    try {
      const files = await generateAllMarkdown()

      if (isTauri()) {
        const folder = await pickFolder('Choose export folder')
        if (!folder) {
          showStatus('error', 'No folder selected')
          return
        }

        const JSZip = (await import('jszip')).default
        const zip = new JSZip()

        for (const [path, content] of Object.entries(files)) {
          zip.file(path, content)
        }

        const blob = await zip.generateAsync({ type: 'blob' })
        const filename = `life-tracker-export-${new Date().toISOString().split('T')[0]}.zip`
        await downloadFile(blob, filename, folder)
        setTauriPath(folder)
        showStatus('success', `Exported ${Object.keys(files).length} files to ${folder}`)
      } else {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()

        for (const [path, content] of Object.entries(files)) {
          zip.file(path, content)
        }

        const blob = await zip.generateAsync({ type: 'blob' })
        const filename = `life-tracker-export-${new Date().toISOString().split('T')[0]}.zip`
        downloadBlob(blob, filename)
        showStatus('success', `Downloaded ${Object.keys(files).length} files as ZIP`)
      }
    } catch (err) {
      console.error(err)
      showStatus('error', 'Failed to export Markdown')
    } finally {
      setExporting(null)
    }
  }

  const handleCsvExport = async () => {
    setExporting('csv')
    setStatus(null)
    try {
      const files = await exportAllCsv()

      if (isTauri()) {
        const folder = await pickFolder('Choose export folder')
        if (!folder) {
          showStatus('error', 'No folder selected')
          return
        }

        const JSZip = (await import('jszip')).default
        const zip = new JSZip()

        for (const [name, content] of Object.entries(files)) {
          zip.file(name, content)
        }

        const blob = await zip.generateAsync({ type: 'blob' })
        const filename = `life-tracker-csv-${new Date().toISOString().split('T')[0]}.zip`
        await downloadFile(blob, filename, folder)
        setTauriPath(folder)
        showStatus('success', `Exported ${Object.keys(files).length} CSV files to ${folder}`)
      } else {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()

        for (const [name, content] of Object.entries(files)) {
          zip.file(name, content)
        }

        const blob = await zip.generateAsync({ type: 'blob' })
        const filename = `life-tracker-csv-${new Date().toISOString().split('T')[0]}.zip`
        downloadBlob(blob, filename)
        showStatus('success', `Downloaded ${Object.keys(files).length} CSV files as ZIP`)
      }
    } catch (err) {
      console.error(err)
      showStatus('error', 'Failed to export CSV')
    } finally {
      setExporting(null)
    }
  }

  const handleSqliteExport = async () => {
    setExporting('sqlite')
    setStatus(null)
    try {
      const base64 = await exportSqliteBase64()
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/x-sqlite3' })
      const filename = `life-tracker-${new Date().toISOString().split('T')[0]}.sqlite`

      if (isTauri()) {
        const folder = await pickFolder('Choose export folder')
        if (!folder) {
          showStatus('error', 'No folder selected')
          return
        }
        await downloadFile(blob, filename, folder)
        setTauriPath(folder)
        showStatus('success', `Exported SQLite database to ${folder}`)
      } else {
        downloadBlob(blob, filename)
        showStatus('success', 'Downloaded SQLite database')
      }
    } catch (err) {
      console.error(err)
      showStatus('error', 'Failed to export SQLite')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader
        title="Export Data"
        subtitle="Download your data in various formats for backup or migration"
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

      <div className="grid gap-4 sm:grid-cols-3">
        <ExportCard
          icon={<FileText size={24} />}
          title="Markdown (Full Export)"
          description="Notes, journal, tasks, habits, workouts, and XP as .md files in a ZIP"
          format="markdown"
          exporting={exporting}
          onClick={handleMarkdownExport}
          recommended
        />
        <ExportCard
          icon={<Table size={24} />}
          title="CSV (Tabular Data)"
          description="Tasks, habits, workouts, and XP as .csv files in a ZIP"
          format="csv"
          exporting={exporting}
          onClick={handleCsvExport}
        />
        <ExportCard
          icon={<Database size={24} />}
          title="SQLite (Raw Database)"
          description="Complete database file — exact copy for full restoration"
          format="sqlite"
          exporting={exporting}
          onClick={handleSqliteExport}
        />
      </div>

      {isTauri() && tauriPath && (
        <div className="mt-6 rounded-lg border border-border-subtle bg-bg-secondary p-4 text-sm text-text-secondary">
          Last Tauri export folder: <code className="ml-2 bg-bg-tertiary px-2 py-0.5 rounded">{tauriPath}</code>
        </div>
      )}

      <div className="mt-8 rounded-lg border border-border-subtle bg-bg-secondary p-5">
        <h3 className="mb-3 text-sm font-medium text-text-primary">About Export Formats</h3>
        <dl className="space-y-2 text-sm text-text-secondary">
          <div className="flex gap-3">
            <dt className="font-medium text-text-primary min-w-[100px]">Markdown</dt>
            <dd>Human-readable, version-control friendly, best for notes & journal</dd>
          </div>
          <div className="flex gap-3">
            <dt className="font-medium text-text-primary min-w-[100px]">CSV</dt>
            <dd>Spreadsheet compatible, best for tasks, habits, workouts analysis</dd>
          </div>
          <div className="flex gap-3">
            <dt className="font-medium text-text-primary min-w-[100px]">SQLite</dt>
            <dd>Exact database copy, only format that can fully restore the app</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-text-muted">
          * Markdown & CSV exports are zipped. SQLite is a raw .sqlite file.
          * In Tauri desktop app, exports save directly to your chosen folder.
          * In browser, exports download via the browser's download manager.
        </p>
      </div>
    </div>
  )
}

interface ExportCardProps {
  icon: React.ReactNode
  title: string
  description: string
  format: 'markdown' | 'csv' | 'sqlite'
  exporting: 'markdown' | 'csv' | 'sqlite' | null
  onClick: () => void
  recommended?: boolean
}

function ExportCard({ icon, title, description, format, exporting, onClick, recommended }: ExportCardProps) {
  const isExporting = exporting === format

  return (
    <motion.button
      onClick={onClick}
      disabled={exporting !== null}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative group flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-secondary p-5 transition-colors ${
        exporting !== null && !isExporting ? 'opacity-50 pointer-events-none' : 'hover:border-border-strong hover:bg-bg-hover'
      }`}
    >
      {recommended && (
        <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-accent-blue/10 px-2 py-0.5 text-[10px] font-medium text-accent-blue">
          Recommended
        </span>
      )}
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      {isExporting && (
        <div className="mt-auto flex items-center justify-center gap-2 text-sm text-accent-blue">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Exporting...
        </div>
      )}
    </motion.button>
  )
}