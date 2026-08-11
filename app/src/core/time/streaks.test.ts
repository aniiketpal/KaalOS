import { describe, it, expect } from 'vitest'
import { currentStreak, longestStreak, type DailyLog } from './streaks'

const mk = (entries: [string, number][]): DailyLog => new Map(entries)

describe('streaks', () => {
  it('empty logs → 0 / 0', () => {
    expect(currentStreak(mk([]), '2026-08-10', 60)).toBe(0)
    expect(longestStreak(mk([]), '2026-08-10', 60)).toBe(0)
  })
  it('consecutive 7 days meeting target → current=7, longest=7', () => {
    const logs = mk([
      ['2026-08-04', 60], ['2026-08-05', 60], ['2026-08-06', 60], ['2026-08-07', 60],
      ['2026-08-08', 60], ['2026-08-09', 60], ['2026-08-10', 60],
    ])
    expect(currentStreak(logs, '2026-08-10', 60)).toBe(7)
    expect(longestStreak(logs, '2026-08-10', 60)).toBe(7)
  })
  it('5 consecutive then miss then 3 → current=3, longest=5', () => {
    const logs = mk([
      // 5-day run ending 08-04
      ['2026-07-31', 60], ['2026-08-01', 60], ['2026-08-02', 60], ['2026-08-03', 60], ['2026-08-04', 60],
      // miss 08-05
      ['2026-08-06', 60], ['2026-08-07', 60], ['2026-08-08', 60],
    ])
    expect(currentStreak(logs, '2026-08-08', 60)).toBe(3)
    expect(longestStreak(logs, '2026-08-08', 60)).toBe(5)
  })
  it("today not logged but yesterday+6 days → current=7 (today doesn't break)", () => {
    const logs = mk([
      ['2026-08-03', 60], ['2026-08-04', 60], ['2026-08-05', 60],
      ['2026-08-06', 60], ['2026-08-07', 60], ['2026-08-08', 60], ['2026-08-09', 60],
    ])
    expect(currentStreak(logs, '2026-08-10', 60)).toBe(7)
  })
  it('target=120, one day 90 min → miss', () => {
    const logs = mk([['2026-08-09', 90], ['2026-08-08', 60], ['2026-08-07', 120]])
    expect(currentStreak(logs, '2026-08-09', 120)).toBe(0)
    expect(longestStreak(logs, '2026-08-09', 120)).toBe(1)
  })
})
