import { motion } from 'framer-motion'
import { Download, Cpu, Shield, Archive, Plus, LayoutDashboard } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { clsx } from 'clsx'

interface SettingsCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  badge?: string
  comingSoon?: boolean
}

function SettingsCard({ icon, title, description, href, badge, comingSoon }: SettingsCardProps) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        'group relative flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-secondary p-5 transition-colors hover:border-border-strong hover:bg-bg-hover',
        comingSoon && 'opacity-60 pointer-events-none cursor-not-allowed'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
          {icon}
        </div>
        {badge && (
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      {comingSoon && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
          Coming Soon
        </span>
      )}
    </motion.a>
  )
}

export function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Configure your tracker, data, and AI features"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SettingsCard
          icon={<Download size={18} />}
          title="Export Data"
          description="Download your notes, journal, tasks, and more as Markdown, CSV, or SQLite"
          href="/settings/export"
        />
        <SettingsCard
          icon={<Archive size={18} />}
          title="Auto Backup"
          description="Weekly timestamped backups to your local drive for disaster recovery"
          href="/settings/backup"
        />
        <SettingsCard
          icon={<Cpu size={18} />}
          title="AI / LLM"
          description="Configure Token Router API key, model, and test the connection"
          href="/settings/llm"
        />
        <SettingsCard
          icon={<Shield size={18} />}
          title="Privacy"
          description="Control whether journal entries are used for personalized AI prompts"
          href="/settings/privacy"
        />
        <SettingsCard
          icon={<Plus size={18} />}
          title="Activities"
          description="Manage activities — colors, targets, and archive/restore"
          href="/settings/activities"
        />
        <SettingsCard
          icon={<LayoutDashboard size={18} />}
          title="Profile"
          description="View your XP level, progress, focus heatmap, and history"
          href="/profile"
        />
      </div>
    </div>
  )
}