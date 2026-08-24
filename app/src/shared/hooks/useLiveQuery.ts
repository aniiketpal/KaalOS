import { useEffect, useState } from 'react'
import { subscribeVersion } from './versionBus'

/**
 * Runs an async DB query and keeps its result live: loads once on mount (and
 * whenever `deps` change) and re-runs on every bumpVersion(). Handles the
 * unmount race via an `alive` guard. `loading` starts true and flips false
 * after the first load — it does not toggle back on background refetches.
 */
export function useLiveQuery<T>(
  load: () => Promise<T>,
  initial: T,
  deps: unknown[] = [],
): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const run = async () => {
      const result = await load()
      if (alive) {
        setData(result)
        setLoading(false)
      }
    }
    void run()
    const unsub = subscribeVersion(run)
    return () => {
      alive = false
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading }
}
