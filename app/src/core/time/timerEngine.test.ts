import { describe, it, expect } from 'vitest'
import { computeRemaining, pause, resume, isComplete, type Session } from './timerEngine'

const T0 = 1_000_000_000_000 // arbitrary epoch

const s = (over: Partial<Session> = {}): Session => ({
  startedAt: T0,
  plannedMinutes: 25,
  pausedAt: null,
  pausedAccumulator: 0,
  ...over,
})

describe('timerEngine', () => {
  it('fresh session → remaining = planned', () => {
    expect(computeRemaining(s(), T0)).toBe(25 * 60_000)
  })
  it('after 30s → remaining = planned - 30s', () => {
    expect(computeRemaining(s(), T0 + 30_000)).toBe(25 * 60_000 - 30_000)
  })
  it('paused 10s → remaining unchanged while paused', () => {
    const paused = pause(s(), T0 + 5_000)
    expect(computeRemaining(paused, T0 + 15_000)).toBe(25 * 60_000 - 5_000)
    expect(computeRemaining(paused, T0 + 5_000)).toBe(25 * 60_000 - 5_000)
  })
  it('resumed → continues correctly', () => {
    let x = s()
    x = pause(x, T0 + 5_000)
    x = resume(x, T0 + 15_000) // 10s paused (should not count)
    expect(computeRemaining(x, T0 + 20_000)).toBe(25 * 60_000 - 10_000)
  })
  it('elapsed > planned → 0 (clamped)', () => {
    expect(computeRemaining(s(), T0 + 60 * 60_000)).toBe(0)
  })
  it('survives rebuild from stored fields (app restart)', () => {
    const stored: Session = {
      startedAt: T0,
      plannedMinutes: 25,
      pausedAt: T0 + 5_000,
      pausedAccumulator: 0,
    }
    expect(computeRemaining(stored, T0 + 100_000)).toBe(25 * 60_000 - 5_000)
  })
  it('isComplete only when remaining hits 0', () => {
    expect(isComplete(s(), T0 + 10_000)).toBe(false)
    expect(isComplete(s(), T0 + 25 * 60_000 + 1)).toBe(true)
  })
})
