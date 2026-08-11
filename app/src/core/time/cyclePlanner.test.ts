import { describe, it, expect } from 'vitest'
import { planCycles } from './cyclePlanner'

describe('planCycles', () => {
  it('25 → single focus block', () => {
    expect(planCycles(25)).toEqual([{ mode: 'focus', minutes: 25 }])
  })
  it('50 → single focus block (below split threshold)', () => {
    expect(planCycles(50)).toEqual([{ mode: 'focus', minutes: 50 }])
  })
  it('60 → 4 steps, no trailing break', () => {
    expect(planCycles(60)).toEqual([
      { mode: 'focus', minutes: 25 },
      { mode: 'break', minutes: 5 },
      { mode: 'focus', minutes: 25 },
      { mode: 'break', minutes: 5 },
    ])
  })
  it('65 → final 5-min focus absorbed', () => {
    expect(planCycles(65)).toEqual([
      { mode: 'focus', minutes: 25 },
      { mode: 'break', minutes: 5 },
      { mode: 'focus', minutes: 25 },
      { mode: 'break', minutes: 5 },
      { mode: 'focus', minutes: 5 },
    ])
  })
  it('90 → 3 focus + 3 breaks (trailing 5-min break kept, consistent with 60)', () => {
    expect(planCycles(90)).toEqual([
      { mode: 'focus', minutes: 25 },
      { mode: 'break', minutes: 5 },
      { mode: 'focus', minutes: 25 },
      { mode: 'break', minutes: 5 },
      { mode: 'focus', minutes: 25 },
      { mode: 'break', minutes: 5 },
    ])
  })
})
