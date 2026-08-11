import { create } from 'zustand'

const KEY = 'lt_last_carryover_date'

interface CarryOverState {
  /** Number of tasks moved on today's boot, -1 until boot check finishes. */
  movedToday: number
  run: () => Promise<void>
}

const todayStr = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const useCarryOverStore = create<CarryOverState>((set) => ({
  movedToday: -1,
  run: async () => {
    const today = todayStr()

    if (localStorage.getItem(KEY) === today) {
      set({ movedToday: 0 })
      return
    }

    const { getDb } = await import('../../core/db/client')
    const { applyCarryOver } = await import('../../core/time/carryOver')
    const { bumpVersion } = await import('./versionBus')
    const n = await applyCarryOver(await getDb(), today)
    localStorage.setItem(KEY, today)

    if (n > 0) bumpVersion()
    set({ movedToday: n })
  },
}))
