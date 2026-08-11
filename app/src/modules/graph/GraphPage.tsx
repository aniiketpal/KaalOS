import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { loadGraph, type GraphNode, type GraphEdge } from './data'
import { subscribeVersion } from '../../shared/hooks/versionBus'

const GROUP_COLORS: Record<string, string> = {
  activity: '#c45a28',
  note: '#d4a03a',
  task: '#3a8a7a',
  semantic: '#7c5cbf',
}

const GROUP_LABELS: Record<string, string> = {
  activity: 'Activities',
  note: 'Notes',
  task: 'Tasks',
  semantic: 'Semantic Links',
}

const EDGE_STYLES: Record<string, { color: string; dasharray: string; width: number }> = {
  activity: { color: 'rgba(255,255,255,0.06)', dasharray: 'none', width: 1 },
  semantic: { color: 'rgba(124,92,191,0.3)', dasharray: '4,4', width: 1.5 },
}

interface Pos {
  x: number
  y: number
}

function layout(nodes: GraphNode[]): { positions: Map<string, Pos>; width: number; height: number } {
  const w = 800, h = 500
  const map = new Map<string, Pos>()

  // Simple radial layout: activities at center, notes and tasks around
  const activities = nodes.filter((n) => n.group === 'activity')
  const other = nodes.filter((n) => n.group !== 'activity')
  const cx = w / 2, cy = h / 2

  activities.forEach((n, i) => {
    const angle = (i / activities.length) * Math.PI * 2
    const r = w * 0.18
    map.set(n.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })
  })

  other.forEach((n, i) => {
    const angle = (i / other.length) * Math.PI * 2 + Math.PI / activities.length
    const r = w * 0.4
    map.set(n.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })
  })

  return { positions: map, width: w, height: h }
}

export function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; group: string; id: string } | null>(null)

  const { positions, width, height } = layout(nodes)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const g = await loadGraph()
      if (!cancelled) { setNodes(g.nodes); setEdges(g.edges); setLoading(false) }
    }
    load()
    const unsub = subscribeVersion(load)
    return () => { cancelled = true; unsub() }
  }, [])

  // Adjacency map for hover
  const neighbors = new Map<string, Set<string>>()
  for (const e of edges) {
    if (!neighbors.has(e.from)) neighbors.set(e.from, new Set())
    if (!neighbors.has(e.to)) neighbors.set(e.to, new Set())
    neighbors.get(e.from)!.add(e.to)
    neighbors.get(e.to)!.add(e.from)
  }

  if (loading) return <div className="p-6"><p className="text-sm text-text-muted">Building graph...</p></div>

  return (
    <div>
      <PageHeader
        title="Graph"
        subtitle={`${nodes.length} nodes · ${edges.length} connections`}
      />

      <div className="p-6">
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary overflow-hidden relative">
          {/* Legend */}
          <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
            {Object.entries(GROUP_COLORS).map(([k, c]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                {GROUP_LABELS[k]}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-6 h-0.5" style={{ background: 'rgba(124,92,191,0.3)', borderRadius: 2 }} />
              {GROUP_LABELS.semantic}
            </div>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="block w-full"
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Edges */}
            {edges.map((e) => {
              const from = positions.get(e.from)
              const to = positions.get(e.to)
              if (!from || !to) return null
              const style = EDGE_STYLES[e.type ?? 'activity']
              return (
                <line
                  key={e.id}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={style.color}
                  strokeWidth={style.width}
                  strokeDasharray={style.dasharray}
                />
              )
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = positions.get(node.id)
              if (!pos) return null
              const color = GROUP_COLORS[node.group] ?? '#888'
              const isActivity = node.group === 'activity'
              const r = isActivity ? 18 : 12
              const connected = tooltip
                ? neighbors.get(tooltip.id ?? '')?.has(node.id) || node.id === tooltip.id
                : true
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseEnter={() => setTooltip({ x: pos.x, y: pos.y - 20, label: node.title, group: node.group, id: node.id })}
                >
                  {isActivity && (
                    <motion.circle
                      r={r}
                      fill={color}
                      fillOpacity={0.15}
                      stroke={color}
                      strokeWidth={1.5}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.15 }}
                    />
                  )}
                  <motion.circle
                    r={isActivity ? 6 : 5}
                    fill={color}
                    fillOpacity={connected ? 1 : 0.3}
                    whileHover={{ scale: 1.5 }}
                    style={{ cursor: 'pointer' }}
                  />
                  {isActivity && (
                    <text
                      textAnchor="middle"
                      dy={-14}
                      fill="rgba(255,255,255,0.7)"
                      fontSize={10}
                      fontWeight={500}
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.label.length > 18 ? node.label.slice(0, 18) + '…' : node.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 rounded-lg border border-border-subtle bg-bg-tertiary px-2.5 py-1.5 text-xs text-text-primary shadow-lg"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GROUP_COLORS[tooltip.group] }} />
              {tooltip.label}
            </div>
          )}

          {nodes.length === 0 && (
            <div className="flex h-[400px] flex-col items-center justify-center text-center">
              <GitBranch size={32} className="mb-3 text-text-muted" />
              <p className="text-sm text-text-muted">No data yet. Add notes, tasks, and activities to see connections.</p>
            </div>
          )}
        </div>

        {/* Node list */}
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {(['activity', 'note', 'task'] as const).map((g) => {
            const list = nodes.filter((n) => n.group === g)
            return (
              <div key={g} className="rounded-xl border border-border-subtle bg-bg-secondary p-3">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">{GROUP_LABELS[g]} ({list.length})</h3>
                <ul className="space-y-1">
                  {list.slice(0, 8).map((n) => (
                    <li
                      key={n.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-bg-hover cursor-default"
                    >
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[g] }} />
                      <span className="truncate">{n.title}</span>
                    </li>
                  ))}
                  {list.length > 8 && (
                    <li className="px-2 py-1 text-[10px] text-text-muted">+{list.length - 8} more</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── cleanup unused exports ────────────────────────────────────────────────
