/**
 * Tiny global version bus. Any mutation calls bumpVersion(); hooks subscribe
 * and re-query on change. Keeps everything in sync without TanStack Query.
 */

let version = 0
const listeners = new Set<() => void>()

export function bumpVersion(): void {
  version += 1
  listeners.forEach((l) => l())
}

export function subscribeVersion(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function getVersion(): number {
  return version
}
