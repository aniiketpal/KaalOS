import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'

let extractor: FeatureExtractionPipeline | null = null
let isLoading = false
let loadError: Error | null = null

export async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (extractor) return extractor
  if (isLoading) {
    while (isLoading) await new Promise((r) => setTimeout(r, 100))
    if (extractor) return extractor
    throw loadError || new Error('Extractor failed to load')
  }

  isLoading = true
  try {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    return extractor!
  } catch (err) {
    loadError = err instanceof Error ? err : new Error(String(err))
    throw loadError
  } finally {
    isLoading = false
  }
}

export async function generateEmbedding(text: string): Promise<Float32Array> {
  const extractor = await getExtractor()
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return output.data as Float32Array
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function serializeEmbedding(embedding: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(embedding.byteLength)
  new Float32Array(buffer).set(embedding)
  return buffer
}

export function deserializeEmbedding(buffer: ArrayBuffer | SharedArrayBuffer): Float32Array {
  return new Float32Array(buffer)
}

export async function computeNoteEmbedding(content: string): Promise<Float32Array> {
  const text = content.slice(0, 2000)
  return generateEmbedding(text)
}

export const SIMILARITY_THRESHOLD = 0.7
export const EMBEDDING_DIM = 384