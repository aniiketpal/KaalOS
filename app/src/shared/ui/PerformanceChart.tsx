import { useMemo, useState, useRef } from 'react'
import { Maximize2 } from 'lucide-react'

export interface ChartSeries {
  label: string
  color: string
  data: number[]
}

interface PerformanceChartProps {
  series: ChartSeries[]
  labels: string[]
  yMax?: number
  ySuffix?: string
  title?: string
  subtitle?: string
  showToggle?: boolean
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function PerformanceChart({
  series,
  labels,
  yMax = 100,
  ySuffix = '%',
  title = 'Performance Chart',
  subtitle = 'Track results and watch your progress rise.',
  showToggle = true,
}: PerformanceChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly')

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const width = 700
  const height = 300
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const yTicks = [0, 25, 50, 75, 100]

  const pointsPerSeries = useMemo(() => {
    return series.map((s) => {
      const max = Math.max(...s.data, yMax)
      return s.data.map((val, i) => ({
        x: padding.left + (i / (labels.length - 1)) * chartW,
        y: padding.top + chartH - (val / max) * chartH,
        val,
      }))
    })
  }, [series, labels, yMax, chartW, chartH])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    let closest = 0
    let minDist = Infinity
    pointsPerSeries[0]?.forEach((p, i) => {
      const dist = Math.abs(mx - p.x)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setHoveredIdx(closest)
  }

  const hoverX = hoveredIdx !== null ? pointsPerSeries[0]?.[hoveredIdx]?.x : null

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141414] p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-medium text-white">{title}</h3>
          <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {showToggle && (
            <div className="flex rounded-lg bg-white/5 p-0.5">
              {(['weekly', 'daily'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-white/10 text-white'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-white">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-text-secondary">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.label} id={`grad-${s.label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          {/* Y grid lines */}
          {yTicks.map((tick) => {
            const y = padding.top + chartH - (tick / 100) * chartH
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-text-muted"
                  fontSize={10}
                >
                  {tick}{ySuffix}
                </text>
              </g>
            )
          })}

          {/* X labels */}
          {labels.map((label, i) => {
            const x = padding.left + (i / (labels.length - 1)) * chartW
            return (
              <text
                key={i}
                x={x}
                y={height - 12}
                textAnchor="middle"
                className="fill-text-muted"
                fontSize={10}
              >
                {label}
              </text>
            )
          })}

          {/* Area fills + lines */}
          {pointsPerSeries.map((points, si) => {
            const s = series[si]
            const path = smoothPath(points)
            const areaPath = path
              ? `${path} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`
              : ''
            return (
              <g key={s.label}>
                <path d={areaPath} fill={`url(#grad-${s.label})`} />
                <path d={path} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
              </g>
            )
          })}

          {/* Vertical hover line + dots */}
          {hoveredIdx !== null && hoverX !== null && (
            <g>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={padding.top + chartH}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="3 3"
              />
              {pointsPerSeries.map((points, si) => {
                const p = points[hoveredIdx]
                if (!p) return null
                return (
                  <circle
                    key={si}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={series[si].color}
                    stroke="#141414"
                    strokeWidth={2}
                  />
                )
              })}
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 shadow-xl"
            style={{
              left: hoverX !== null ? `${(hoverX / width) * 100}%` : '50%',
              top: '8px',
            }}
          >
            <p className="mb-1 text-[10px] text-text-muted">{labels[hoveredIdx]}</p>
            {series.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-text-secondary">{s.label}:</span>
                <span className="text-xs font-medium text-white">{s.data[hoveredIdx]}{ySuffix}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity bar at bottom */}
      <div className="mt-3 flex items-center gap-1">
        {labels.map((_, i) => {
          const max = Math.max(...(series[0]?.data ?? [1]))
          const val = series[0]?.data[i] ?? 0
          const pct = max > 0 ? (val / max) * 100 : 0
          const isActive = i <= (hoveredIdx ?? labels.length)
          return (
            <div
              key={i}
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 3 }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isActive
                    ? (series[0]?.color ?? '#c45a28')
                    : 'rgba(255,255,255,0.1)',
                  opacity: isActive ? 1 : 0.3,
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
