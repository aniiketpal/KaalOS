import { useState, useEffect } from 'react'
import { getDb } from '../db/client'
import { subscribeVersion } from '../../shared/hooks/versionBus'
import { generateEmbedding, serializeEmbedding, deserializeEmbedding, cosineSimilarity, SIMILARITY_THRESHOLD } from './embeddings'

export interface SemanticEdge {
  from: string
  to: string
  similarity: number
}

let lastComputed = 0
let computedEdges: SemanticEdge[] = []
let isComputing = false

export async function getOrCreateNoteEmbedding(noteId: string, content: string): Promise<Float32Array> {
  const db = await getDb()

  const existing = await db.get<{ embedding: ArrayBuffer }>(
    'SELECT embedding FROM note_embeddings WHERE note_id = ?',
    [noteId]
  )

  if (existing?.embedding) {
    return deserializeEmbedding(existing.embedding)
  }

  const embedding = await generateEmbedding(content)
  await db.run(
    'INSERT OR REPLACE INTO note_embeddings (note_id, embedding, created_at) VALUES (?, ?, ?)',
    [noteId, serializeEmbedding(embedding), Date.now()]
  )

  return embedding
}

export async function computeSemanticEdges(): Promise<SemanticEdge[]> {
  if (isComputing) return computedEdges

  const now = Date.now()
  if (computedEdges.length > 0 && now - lastComputed < 60 * 60 * 1000) {
    return computedEdges
  }

  isComputing = true

  try {
    const db = await getDb()
    const notes = await db.all<{ id: string; content: string }>(
      'SELECT id, content FROM notes WHERE content != \'\''
    )

    if (notes.length < 2) {
      computedEdges = []
      return []
    }

    const embeddings: Map<string, Float32Array> = new Map()

    for (const note of notes) {
      const emb = await getOrCreateNoteEmbedding(note.id, note.content)
      embeddings.set(note.id, emb)
    }

    const edges: SemanticEdge[] = []
    const noteIds = Array.from(embeddings.keys())

    for (let i = 0; i < noteIds.length; i++) {
      for (let j = i + 1; j < noteIds.length; j++) {
        const idA = noteIds[i]
        const idB = noteIds[j]
        const sim = cosineSimilarity(embeddings.get(idA)!, embeddings.get(idB)!)

        if (sim >= SIMILARITY_THRESHOLD) {
          edges.push({ from: idA, to: idB, similarity: sim })
        }
      }
    }

    edges.sort((a, b) => b.similarity - a.similarity)
    computedEdges = edges
    lastComputed = now

    return edges
  } finally {
    isComputing = false
  }
}

export async function invalidateEmbeddings(): Promise<void> {
  computedEdges = []
  lastComputed = 0
}

export function useSemanticEdges() {
  const [edges, setEdges] = useState<SemanticEdge[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const data = await computeSemanticEdges()
      if (!cancelled) setEdges(data)
    }
    load()

    const unsub = subscribeVersion(() => {
      invalidateEmbeddings()
      load()
    })

    return () => { cancelled = true; unsub() }
  }, [])

  return edges
}