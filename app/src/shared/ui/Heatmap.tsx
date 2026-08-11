import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeatmapCell {
  date: string
  minutes: number
  target: number
}

interface HeatmapProps {
  data: Map<string, { minutes: number; target: number }>
  onCellClick?: (date: string) => void
  cellSize?: number
  accent?: string
  totalPomodoros?: number
  totalHours?: number
  currentStreak?: number
  title?: string
  showNav?: boolean
  compact?: boolean
}

const DAY_LABELS = ['M', '', 'W', '', 'F', '', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  let startOffset = (firstDay.getDay() + 6) % 7
  const cells: { date: string; dayOfMonth: number; inMonth: boolean }[] = []
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, -startOffset + i + 1)
    cells.push({ date: d.toISOString().slice(0, 10), dayOfMonth: d.getDate(), inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    cells.push({ date: d.toISOString().slice(0, 10), dayOfMonth: day, inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, cells.length - startOffset - daysInMonth + 1)
    cells.push({ date: d.toISOString().slice(0, 10), dayOfMonth: d.getDate(), inMonth: false })
  }
  return cells
}

function getIntensity(minutes: number, target: number): number {
  if (minutes <= 0) return 0
  const pct = minutes / target
  if (pct >= 1) return 3
  if (pct >= 0.5) return 2
  return 1
}

const LEVEL_COLORS = [
  'rgba(255,255,255,0.04)',
  'rgba(196,90,40,0.2)',
  'rgba(196,90,40,0.5)',
  '#c45a28',
]

export function Heatmap({
  data,
  onCellClick,
  cellSize = 18,
  totalPomodoros = 0,
  totalHours = 0,
  currentStreak = 0,
  title,
  showNav = true,
  compact = false,
}: HeatmapProps) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  const defaultTitle = title ?? `${MONTH_NAMES[viewMonth]} was a good month`

  const cells = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth])

  const weeks = useMemo(() => {
    const w: typeof cells[] = []
    for (let i = 0; i < cells.length; i += 7) {
      w.push(cells.slice(i, i + 7))
    }
    return w
  }, [cells])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  if (compact) {
    return (
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: 3 }}>
            {week.map((cell) => {
              const entry = data.get(cell.date)
              const minutes = entry?.minutes ?? 0
              const target = entry?.target ?? 120
              const level = cell.inMonth ? getIntensity(minutes, target) : -1
              return (
                <motion.button
                  key={cell.date}
                  onClick={() => cell.inMonth && onCellClick?.(cell.date)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: wi * 0.02, duration: 0.15 }}
                  className="outline-none"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 3,
                    backgroundColor: level === -1 ? 'transparent' : LEVEL_COLORS[level],
                    cursor: cell.inMonth ? 'pointer' : 'default',
                  }}
                  aria-label={cell.inMonth ? `${cell.date} — ${Math.round(minutes)} min` : undefined}
                />
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141414] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-medium text-white italic">{defaultTitle}</h3>
        {showNav && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-10">
        <div>
          <p className="text-3xl font-light tabular-nums text-white">{totalPomodoros}</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Pomodoros</p>
        </div>
        <div>
          <p className="text-3xl font-light tabular-nums text-white">{totalHours}h</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Deep Focus</p>
        </div>
        <div>
          <p className="text-3xl font-light tabular-nums text-white">{currentStreak}d</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted">Streak</p>
        </div>
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col" style={{ gap: 3 }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end text-[11px] text-text-muted/60"
              style={{ width: 16, height: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: 3 }}>
            {week.map((cell) => {
              const entry = data.get(cell.date)
              const minutes = entry?.minutes ?? 0
              const target = entry?.target ?? 120
              const level = cell.inMonth ? getIntensity(minutes, target) : -1
              return (
                <motion.button
                  key={cell.date}
                  onClick={() => cell.inMonth && onCellClick?.(cell.date)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: wi * 0.02, duration: 0.15 }}
                  whileHover={cell.inMonth ? { scale: 1.2 } : undefined}
                  className="outline-none"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 4,
                    backgroundColor: level === -1 ? 'transparent' : LEVEL_COLORS[level],
                    cursor: cell.inMonth ? 'pointer' : 'default',
                  }}
                  aria-label={cell.inMonth ? `${cell.date} — ${Math.round(minutes)} min` : undefined}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-text-muted">
        <span>Less</span>
        {[0, 1, 2, 3].map((lvl) => (
          <span
            key={lvl}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 4,
              backgroundColor: LEVEL_COLORS[lvl],
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
