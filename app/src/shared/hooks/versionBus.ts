/**
 * Tiny global change bus. Any mutation calls bumpVersion(); hooks subscribe and
 * re-query on change. Keeps everything in sync without TanStack Query.
 */

const listeners = new Set<() => void>()

export function bumpVersion(): void {
  listeners.forEach((l) => l())
}

export function subscribeVersion(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}
