import { Check, GripVertical, RotateCcw, Pencil, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { TaskWithActivity } from './types'
import { ACCENT_COLORS } from '../activities/colors'
import { recurrenceLabel } from './types'

const COLOR_BY_KEY: Record<string, string> = Object.fromEntries(ACCENT_COLORS.map((c) => [c.key, c.var]))

interface TaskRowProps {
  task: TaskWithActivity
  onToggle: (t: TaskWithActivity) => void
  onEdit: (t: TaskWithActivity) => void
  onDelete: (t: TaskWithActivity) => void
  // drag callbacks — lifted to section level
  onDragStart: (t: TaskWithActivity) => void
  onDragOver: (t: TaskWithActivity, e: React.DragEvent) => void
  onDrop: (t: TaskWithActivity) => void
  draggingId: string | null
}

export function TaskRow({
  task, onToggle, onEdit, onDelete, onDragStart, onDragOver, onDrop, draggingId,
}: TaskRowProps) {
  const done = task.status === 'done'
  const accent = task.activity ? (COLOR_BY_KEY[task.activity.color] ?? task.activity.color) : null

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(task)
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(task, e) }}
      onDrop={(e) => { e.preventDefault(); onDrop(task) }}
      onClick={() => onEdit(task)}
      className={clsx(
        'group relative flex cursor-default items-center gap-3 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-3 transition-colors duration-(--duration-fast) ease-(--ease-out-expo)',
        draggingId === task.id && 'opacity-40',
        !done && 'hover:bg-bg-hover',
      )}
    >
      {/* drag handle */}
      <div className="opacity-0 transition-opacity group-hover:opacity-100" role="button" aria-label="Drag">
        <GripVertical size={14} className="text-text-muted" />
      </div>

      {/* checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task) }}
        aria-label={done ? 'Mark pending' : 'Mark done'}
        className={clsx(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-(--duration-fast) ease-(--ease-out-expo)',
          done
            ? 'border-accent-blue bg-accent-blue'
            : 'border-border-muted hover:border-text-muted',
        )}
        style={done ? { backgroundColor: accent ?? 'var(--accent-blue)', borderColor: 'transparent' } : undefined}
      >
        {done && <Check size={12} strokeWidth={3} style={{ color: 'var(--text-inverse)' }} />}
      </button>

      {/* content */}
      <div className="min-w-0 flex-1">
        <p className={clsx(
          'truncate text-sm',
          done ? 'text-text-muted line-through' : 'text-text-primary',
        )}>
          {task.title}
        </p>
        {task.notes && (
          <p className="truncate text-xs text-text-muted mt-0.5">{task.notes}</p>
        )}
      </div>

      {/* meta */}
      {task.activity && (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-bg-tertiary px-2 py-0.5 text-[11px]"
          style={{ color: accent ?? undefined }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent ?? 'currentColor' }} />
          <span className="max-w-20 truncate">{task.activity.name}</span>
        </span>
      )}

      {task.recurrence_rule && (
        <span className="flex items-center gap-1 rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-secondary">
          <RotateCcw size={10} />
          {recurrenceLabel(task.recurrence_rule)}
        </span>
      )}

      {task.due_date && !task.recurrence_rule && (
        <span className="text-[11px] text-text-muted">{task.due_date}</span>
      )}

      {
        !done && (
          <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task) }}
              className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary"
              aria-label="Edit"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task) }}
              className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-error"
              aria-label="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )
      }
    </div>
  )
}
