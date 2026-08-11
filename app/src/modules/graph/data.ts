import { getDb } from '../../core/db/client'
import { computeSemanticEdges } from '../../core/graph/semantic-links'

export interface GraphNode {
  id: string
  label: string
  group: 'note' | 'activity' | 'task'
  title: string
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  fromLabel: string
  toLabel: string
  type?: 'activity' | 'semantic'
}

/** Load nodes and edges from DB — notes link to activities, tasks link to both. */
export async function loadGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const db = await getDb()
  const [activities, notes, tasks] = await Promise.all([
    db.all<{ id: string; name: string }>('SELECT id, name FROM activities WHERE archived_at IS NULL'),
    db.all<{ id: string; title: string }>('SELECT id, title FROM notes'),
    db.all<{ id: string; title: string }>('SELECT id, title FROM tasks'),
  ])

  const nodes: GraphNode[] = [
    ...activities.map((a): GraphNode => ({ id: a.id, label: a.name, group: 'activity', title: a.name })),
    ...notes.map((n): GraphNode => ({ id: n.id, label: n.title, group: 'note', title: n.title })),
    ...tasks.map((t): GraphNode => ({ id: t.id, label: t.title, group: 'task', title: t.title })),
  ]

  const edges: GraphEdge[] = []
  const nodeIds = new Set(nodes.map((n) => n.id))

  const noteLinks = await db.all<{ id: string; activity_id: string }>(
    'SELECT id, activity_id FROM notes WHERE activity_id IS NOT NULL',
  )
  const taskLinks = await db.all<{ id: string; activity_id: string }>(
    'SELECT id, activity_id FROM tasks WHERE activity_id IS NOT NULL',
  )
  for (const r of noteLinks) if (nodeIds.has(r.id) && nodeIds.has(r.activity_id)) edges.push({ id: `n-${r.id}`, from: r.activity_id, to: r.id, fromLabel: r.id, toLabel: '', type: 'activity' })
  for (const r of taskLinks) if (nodeIds.has(r.id) && nodeIds.has(r.activity_id)) edges.push({ id: `t-${r.id}`, from: r.activity_id, to: r.id, fromLabel: r.id, toLabel: '', type: 'activity' })

  // Semantic edges from embeddings
  const semanticEdges = await computeSemanticEdges()
  for (const se of semanticEdges) {
    if (nodeIds.has(se.from) && nodeIds.has(se.to)) {
      edges.push({
        id: `s-${se.from}-${se.to}`,
        from: se.from,
        to: se.to,
        fromLabel: '',
        toLabel: '',
        type: 'semantic',
      })
    }
  }

  return { nodes, edges }
}